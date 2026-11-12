import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArenaCaseReport, ARENA_CASE_SCHEMA } from '../src/arena-case-report.mjs';

const BASE = 'a'.repeat(40);
const HEAD = 'b'.repeat(40);
const TEST_HASH = 'c'.repeat(64);
const IMAGE = 'sha256:' + 'd'.repeat(64);
const T = '2026-11-12T10:00:00.000Z';

const observation = (over = {}) => ({
  repository: 'owner/repo', prNumber: 7, baseSha: BASE, headSha: HEAD,
  recheckedHeadSha: HEAD, observedAt: T,
  runs: [{ id: 1, status: 'completed', conclusion: 'success', headSha: HEAD }],
  ...over
});
const side = (sourceSha, exitCode, over = {}) => ({
  sourceSha, exitCode, status: 'COMPLETED', imageDigest: IMAGE,
  outputSha256: 'e'.repeat(64), observedAt: T, ...over
});
const challenge = (b, h, over = {}) => ({
  approvedTestSha256: TEST_HASH, testSha256: TEST_HASH,
  base: side(BASE, b), head: side(HEAD, h), ...over
});
const run = (b, h) => buildArenaCaseReport({ observation: observation(), challenge: challenge(b, h) });

test('regression: passes on base, fails on head', () => {
  const r = run(0, 1);
  assert.equal(r.schema, ARENA_CASE_SCHEMA);
  assert.equal(r.classification, 'REGRESSION');
  assert.equal(r.nextAction.code, 'REGRESSION');
});

test('demonstrated fix: fails on base, passes on head', () => {
  assert.equal(run(1, 0).classification, 'DEMONSTRATED_FIX');
});

test('both pass and both fail are distinguished', () => {
  assert.equal(run(0, 0).classification, 'BOTH_PASS');
  assert.equal(run(1, 1).classification, 'BOTH_FAIL');
});

test('unknown without observation, challenge or with incomplete runs', () => {
  assert.equal(buildArenaCaseReport({}).classification, 'UNKNOWN');
  assert.equal(buildArenaCaseReport(undefined).classification, 'UNKNOWN');
  const none = buildArenaCaseReport({ observation: observation() });
  assert.equal(none.classification, 'UNKNOWN');
  assert.equal(none.reason, 'NO_CHALLENGE');
  const timeout = buildArenaCaseReport({
    observation: observation(),
    challenge: challenge(0, 0, { head: side(HEAD, null, { status: 'TIMED_OUT' }) })
  });
  assert.equal(timeout.classification, 'UNKNOWN');
  assert.equal(timeout.reason, 'RUN_INCOMPLETE');
});

test('stale or moved SHA yields UNKNOWN', () => {
  const moved = buildArenaCaseReport({
    observation: observation({ recheckedHeadSha: 'f'.repeat(40) }), challenge: challenge(0, 1)
  });
  assert.equal(moved.classification, 'UNKNOWN');
  assert.equal(moved.reason, 'HEAD_MOVED');
  const missingRecheck = observation();
  delete missingRecheck.recheckedHeadSha;
  assert.equal(buildArenaCaseReport({ observation: missingRecheck, challenge: challenge(0, 1) }).reason, 'HEAD_MOVED');
  const staleChallenge = buildArenaCaseReport({
    observation: observation(), challenge: challenge(0, 1, { head: side('f'.repeat(40), 1) })
  });
  assert.equal(staleChallenge.reason, 'SOURCE_SHA_MISMATCH');
  const swapped = buildArenaCaseReport({
    observation: observation(), challenge: challenge(0, 1, { base: side(HEAD, 0), head: side(BASE, 1) })
  });
  assert.equal(swapped.classification, 'UNKNOWN');
  const runMismatch = buildArenaCaseReport({
    observation: observation({ runs: [{ id: 1, status: 'completed', conclusion: 'success', headSha: BASE }] }),
    challenge: challenge(0, 1)
  });
  assert.equal(runMismatch.reason, 'RUN_SHA_MISMATCH');
  assert.equal(buildArenaCaseReport({
    observation: observation({ baseSha: HEAD }), challenge: challenge(0, 1)
  }).reason, 'SAME_BASE_HEAD');
});

test('test hash differing from approved hash is UNKNOWN', () => {
  const r = buildArenaCaseReport({
    observation: observation(), challenge: challenge(0, 1, { testSha256: '9'.repeat(64) })
  });
  assert.equal(r.classification, 'UNKNOWN');
  assert.equal(r.reason, 'TEST_HASH_MISMATCH');
});

test('malicious fields are rejected or never echoed', () => {
  const evil = '<script>alert(1)</script>; rm -rf / $(whoami)';
  const bad = [
    observation({ repository: evil }),
    observation({ prNumber: '7; id' }),
    observation({ baseSha: evil }),
    observation({ observedAt: evil }),
    observation({ runs: [{ id: 1, status: evil, conclusion: null, headSha: HEAD }] })
  ];
  for (const o of bad) {
    const r = buildArenaCaseReport({ observation: o, challenge: challenge(0, 1) });
    assert.equal(r.classification, 'UNKNOWN');
    assert.ok(!JSON.stringify(r).includes('script'));
  }
  const chBad = buildArenaCaseReport({
    observation: observation(),
    challenge: challenge(0, 1, { base: side(BASE, 0, { imageDigest: evil, note: evil }) })
  });
  assert.equal(chBad.classification, 'UNKNOWN');
  // Extra attacker-controlled fields on an otherwise valid input are not echoed.
  const extra = buildArenaCaseReport({
    observation: observation({ title: evil, __proto__: { x: evil } }),
    challenge: challenge(0, 1, { comment: evil, releaseApproved: true })
  });
  assert.equal(extra.classification, 'REGRESSION');
  assert.ok(!JSON.stringify(extra).includes('whoami'));
  // Inherited properties and hostile getters fail closed rather than throw.
  const hostile = { get observation() { throw new Error('boom'); } };
  assert.equal(buildArenaCaseReport(hostile).classification, 'UNKNOWN');
  const inherited = Object.create({ observation: observation(), challenge: challenge(0, 1) });
  assert.equal(buildArenaCaseReport(inherited).classification, 'UNKNOWN');
  for (const exit of [-1, 2, 125, 256, 1.5, '0', NaN, null]) {
    assert.equal(run(exit, 0).classification, 'UNKNOWN');
  }
});

test('no false attestation in any outcome', () => {
  const outcomes = [run(0, 1), run(1, 0), run(0, 0), run(1, 1), buildArenaCaseReport({}),
    buildArenaCaseReport({ observation: observation(), challenge: { attestation: { releaseApproved: true }, releaseApproved: true } })];
  for (const r of outcomes) {
    for (const v of Object.values(r.attestation)) assert.equal(v, false);
    assert.ok(r.limitations.length >= 4);
    assert.ok(r.nextAction.text.length > 0);
    const text = JSON.stringify(r);
    assert.ok(!/\b(verified correct|approved for release|independently attested)\b/i.test(text), text);
    for (const s of r.statements) {
      assert.ok(['PROVIDER_REPORTED_UNATTESTED', 'REVIEWER_CONTROLLED_SELF_REPORTED', 'DERIVED_FROM_LISTED_INPUTS'].includes(s.trust));
      assert.match(s.observedAt, /^\d{4}-\d{2}-\d{2}T/);
    }
  }
  // Provider success runs do not elevate the classification.
  assert.equal(run(1, 1).classification, 'BOTH_FAIL');
});

test('report is deterministic, JSON-serializable and does not mutate input', () => {
  const input = { observation: observation(), challenge: challenge(0, 1) };
  const snapshot = JSON.stringify(input);
  const a = buildArenaCaseReport(input);
  const b = buildArenaCaseReport(input);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(JSON.stringify(input), snapshot);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});

test('real GitHub Actions run IDs exceed 32-bit PR number bounds', () => {
  const x=buildArenaCaseReport({
    observation: observation({runs:[{id:43148508938,status:'completed',conclusion:'success',headSha:HEAD}]}),
    challenge: challenge(1,0)
  });
  assert.equal(x.classification,'DEMONSTRATED_FIX');
  assert.match(x.statements.find(s=>s.id==='PROVIDER_RUNS').text,/1 success/);
});