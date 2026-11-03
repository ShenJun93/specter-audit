// test/claim-evaluator.test.mjs
//
// Deterministic tests for the claim-to-evidence evaluator. Most tests use
// hand-built inspection objects so they stay independent of Git availability;
// one integration test wires the real inspector to a disposable fixture repo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  evaluateClaim,
  evaluateReceipt,
  extractTokens,
  matchFiles,
  changedFilePaths,
  STATUS_SUPPORTED,
  STATUS_PARTIAL,
  STATUS_UNVERIFIED,
} from '../src/claim-evaluator.mjs';
import { inspectRepository } from '../src/git-inspector.mjs';
import {
  initRepo,
  commitAll,
  makeTempDir,
  cleanup,
  writeRel,
} from './helpers.mjs';

const HEAD = '0123456789abcdef0123456789abcdef01234567';

function dirtyInspection({ head = HEAD, files = ['src/auth/login.js'] } = {}) {
  const staged = files.map((p) => ({ path: p, status: 'M', oldPath: null }));
  return {
    ok: true,
    root: path.join(path.sep, 'tmp', 'repo'),
    head,
    unborn: false,
    clean: false,
    dirty: true,
    status: files.map((p) => ({ x: 'M', y: ' ', path: p, oldPath: null })),
    staged,
    unstaged: [],
    untracked: [],
    renamed: [],
    diff: { unstaged: [], staged },
    errors: [],
  };
}

function cleanInspection(head = HEAD) {
  return {
    ok: true,
    root: path.join(path.sep, 'tmp', 'repo'),
    head,
    unborn: false,
    clean: true,
    dirty: false,
    status: [],
    staged: [],
    unstaged: [],
    untracked: [],
    renamed: [],
    diff: { unstaged: [], staged: [] },
    errors: [],
  };
}

const VALID = { exitCode: 0, head: HEAD, timestamp: '2026-11-03T12:00:00Z', command: 'npm test' };

test('change claim aligned with changed files -> SUPPORTED', () => {
  const r = evaluateClaim({
    claim: 'fixed auth login regression',
    inspection: dirtyInspection({ files: ['src/auth/login.js'] }),
  });
  assert.equal(r.status, STATUS_SUPPORTED);
  assert.ok(r.confidence > 0 && r.confidence <= 1);
  assert.ok(r.gaps.some((g) => /not.*correct/i.test(g)), 'includes alignment-not-correctness caveat');
});

test('change claim against a clean tree -> UNVERIFIED despite a consistent receipt', () => {
  const r = evaluateClaim({
    claim: 'fixed auth regression',
    inspection: cleanInspection(),
    receipt: VALID,
  });
  assert.equal(r.status, STATUS_UNVERIFIED);
  assert.ok(r.gaps.some((g) => /no working-tree or index changes/i.test(g)));
});

test('dirty tree whose files do not match the claim -> PARTIAL', () => {
  const r = evaluateClaim({
    claim: 'fixed auth regression',
    inspection: dirtyInspection({ files: ['docs/README.md'] }),
  });
  assert.equal(r.status, STATUS_PARTIAL);
  assert.ok(r.details.claimAligns === false);
});

test('mixed claim with self-reported metadata and aligned files -> PARTIAL', () => {
  const r = evaluateClaim({
    claim: 'fixed auth login tests now pass',
    inspection: dirtyInspection({ files: ['src/auth/login.js'] }),
    receipt: VALID,
  });
  assert.equal(r.status, STATUS_PARTIAL);
  assert.equal(r.details.receiptVerdict, 'metadata-consistent');
  assert.equal(r.details.independentlyAttested, false);
  assert.ok(r.gaps.some(g => /independent proof/i.test(g)));
});

test('mixed claim with stale receipt (HEAD mismatch) -> PARTIAL', () => {
  const r = evaluateClaim({
    claim: 'fixed auth login tests pass',
    inspection: dirtyInspection({ files: ['src/auth/login.js'] }),
    receipt: { exitCode: 0, head: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef', timestamp: '2026-11-02T00:00:00Z' },
  });
  assert.equal(r.details.receiptVerdict, 'stale');
  assert.equal(r.status, STATUS_PARTIAL);
});

test('text-only receipt is never trusted: pure test claim -> UNVERIFIED', () => {
  const r = evaluateClaim({
    claim: 'all tests pass',
    inspection: cleanInspection(),
    receipt: 'BUILD SUCCESSFUL - all green, trust me',
  });
  assert.equal(r.details.receiptVerdict, 'text-only');
  assert.equal(r.status, STATUS_UNVERIFIED);
});

test('pure test claim with fabricated-valid receipt remains UNVERIFIED', () => {
  const r = evaluateClaim({
    claim: 'all tests pass',
    inspection: cleanInspection(),
    receipt: VALID,
  });
  assert.equal(r.details.isPureTestClaim, true);
  assert.equal(r.details.receiptVerdict, 'metadata-consistent');
  assert.equal(r.status, STATUS_UNVERIFIED);
  assert.equal(r.details.independentlyAttested, false);
});

test('pure test claim with failed receipt (exitCode=1) -> UNVERIFIED', () => {
  const r = evaluateClaim({
    claim: 'all tests pass',
    inspection: cleanInspection(),
    receipt: { exitCode: 1, head: HEAD, timestamp: '2026-11-03T12:00:00Z' },
  });
  assert.equal(r.details.receiptVerdict, 'failed');
  assert.equal(r.status, STATUS_UNVERIFIED);
});

test('missing receipt for a pure test claim -> UNVERIFIED', () => {
  const r = evaluateClaim({
    claim: 'all tests pass',
    inspection: cleanInspection(),
  });
  assert.equal(r.details.receiptVerdict, 'missing');
  assert.equal(r.status, STATUS_UNVERIFIED);
});

test('malformed receipt: exitCode as string "0" is rejected', () => {
  const r = evaluateClaim({
    claim: 'tests pass',
    inspection: cleanInspection(),
    receipt: { exitCode: '0', head: HEAD, timestamp: '2026-11-03T12:00:00Z' },
  });
  assert.equal(r.details.receiptVerdict, 'malformed');
  assert.equal(r.status, STATUS_UNVERIFIED);
});

test('malformed receipt: missing timestamp is rejected', () => {
  const r = evaluateClaim({
    claim: 'tests pass',
    inspection: cleanInspection(),
    receipt: { exitCode: 0, head: HEAD },
  });
  assert.equal(r.details.receiptVerdict, 'malformed');
  assert.equal(r.status, STATUS_UNVERIFIED);
});

test('failed inspection -> UNVERIFIED regardless of claim', () => {
  const r = evaluateClaim({
    claim: 'fixed auth regression',
    inspection: { ok: false, error: 'NOT_A_GIT_REPO: ...' },
    receipt: VALID,
  });
  assert.equal(r.status, STATUS_UNVERIFIED);
  assert.ok(r.gaps.some((g) => /inspection failed/i.test(g)));
});

test('injection regression: shell metacharacters in claim do not crash or support', () => {
  const malicious = `'; rm -rf /; # \${(process.exit(1))} -- DROP TABLE users; --`;
  const r = evaluateClaim({
    claim: malicious,
    inspection: dirtyInspection({ files: ['src/auth/login.js'] }),
  });
  assert.ok(typeof r.status === 'string');
  // No claim tokens match real file evidence => not aligned => PARTIAL (changes exist but unmatched).
  assert.equal(r.details.claimAligns, false);
  assert.ok(r.gaps.length > 0);
});

test('SUPPORTED result always carries the alignment-not-correctness caveat', () => {
  const r = evaluateClaim({
    claim: 'updated api routes',
    inspection: dirtyInspection({ files: ['src/api/routes.js'] }),
  });
  assert.equal(r.status, STATUS_SUPPORTED);
  assert.ok(r.gaps.includes('SUPPORTED means alignment with Git-recorded changes, not that the code is correct'));
});

test('evaluateReceipt: structured metadata may be consistent but not independently verified', () => {
  const v = evaluateReceipt(VALID, HEAD);
  assert.equal(v.verdict, 'metadata-consistent');
});

test('evaluateReceipt: unborn HEAD cannot be verified -> stale', () => {
  const v = evaluateReceipt(VALID, null);
  assert.equal(v.verdict, 'stale');
});

test('extractTokens drops stopwords and short tokens', () => {
  assert.deepEqual(extractTokens('the and a fix auth login'), ['auth', 'login']);
  assert.deepEqual(extractTokens(''), []);
  assert.deepEqual(extractTokens(null), []);
});

test('matchFiles finds token substrings in paths', () => {
  const m = matchFiles(['auth', 'login'], ['src/auth/login.js', 'docs/x.md']);
  assert.equal(m.length, 2);
  assert.ok(m.some((x) => x.token === 'auth' && x.path === 'src/auth/login.js'));
  assert.ok(m.some((x) => x.token === 'login' && x.path === 'src/auth/login.js'));
});

test('changedFilePaths includes rename source paths', () => {
  const files = changedFilePaths({
    ok: true,
    staged: [{ path: 'new.js', status: 'R', oldPath: 'old.js' }],
    unstaged: [{ path: 'mod.js', status: 'M', oldPath: null }],
    untracked: ['un.js'],
    renamed: [{ path: 'new.js', oldPath: 'old.js', stage: 'staged', status: 'R' }],
  });
  assert.ok(files.includes('new.js'));
  assert.ok(files.includes('old.js'));
  assert.ok(files.includes('mod.js'));
  assert.ok(files.includes('un.js'));
});

test('integration: real dirty fixture supports an aligned claim', async (t) => {
  const dir = await makeTempDir('specter-eval-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'src/auth/login.js', 'export const login = () => 1;\n');
  await commitAll(dir, 'init auth');
  await writeRel(dir, 'src/auth/login.js', 'export const login = () => 2;\n'); // unstaged change

  const inspection = await inspectRepository(dir);
  assert.equal(inspection.ok, true);
  assert.equal(inspection.dirty, true);
  assert.ok(inspection.unstaged.some((u) => u.path === 'src/auth/login.js'));

  const r = evaluateClaim({
    claim: 'fixed auth login bug',
    inspection,
  });
  assert.equal(r.status, STATUS_SUPPORTED);
  assert.ok(r.evidence.some((e) => e.kind === 'changed-files'));
});
