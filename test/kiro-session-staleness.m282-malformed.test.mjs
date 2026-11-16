import test from 'node:test';
import assert from 'node:assert/strict';
import { auditLocalSession } from '../src/kiro-session-staleness.mjs';

const base = {
  sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
  claimAt: '2026-03-02T12:10:00Z',
  sessionEndedAt: '2026-03-02T13:00:00Z',
  tests: [{ at: '2026-03-02T12:09:00Z', pass: 8, fail: 0, exitCode: 0 }],
  edits: [{ at: '2026-03-02T12:01:00Z', file: 'src/example.mjs', successful: true }],
};

test('M282: null test element must return insufficient, not throw', () => {
  assert.equal(auditLocalSession({ ...base, tests: [null] }).status, 'INSUFFICIENT_SESSION_EVIDENCE');
});

test('M282: null edit element must return insufficient, not throw', () => {
  assert.equal(auditLocalSession({ ...base, edits: [null] }).status, 'INSUFFICIENT_SESSION_EVIDENCE');
});

test('M282: impossible calendar claim cannot be marked CURRENT', () => {
  const x = auditLocalSession({ ...base, claimAt: '2026-02-30T12:10:00Z' });
  assert.equal(x.status, 'INSUFFICIENT_SESSION_EVIDENCE');
  assert.match(x.reason, /Invalid claimAt/i);
});

test('M282: impossible test and edit dates fail closed', () => {
  const badTest = auditLocalSession({ ...base, tests: [{ ...base.tests[0], at: '2026-02-30T12:09:00Z' }] });
  const badEdit = auditLocalSession({ ...base, edits: [{ ...base.edits[0], at: '2026-02-30T12:01:00Z' }] });
  assert.equal(badTest.status, 'INSUFFICIENT_SESSION_EVIDENCE');
  assert.equal(badEdit.status, 'INSUFFICIENT_SESSION_EVIDENCE');
});

test('M282: valid leap-day timestamp and explicit timezone offsets remain accepted', () => {
  const x = auditLocalSession({
    ...base,
    claimAt: '2028-02-29T12:10:00+00:00',
    sessionEndedAt: '2028-02-29T13:00:00Z',
    tests: [{ ...base.tests[0], at: '2028-02-29T12:09:00Z' }],
    edits: [{ ...base.edits[0], at: '2028-02-29T19:01:00+07:00' }],
  });
  assert.equal(x.status, 'CURRENT_SELF_RECORDED_TEST');
});

test('M282: invalid clock components are rejected', () => {
  const invalid = ['2026-03-02T24:00:00Z', '2026-03-02T12:60:00Z', '2026-03-02T12:09:60Z', '2026-03-02T12:09:00+24:00'];
  for (const claimAt of invalid) {
    const x = auditLocalSession({ ...base, claimAt });
    assert.equal(x.status, 'INSUFFICIENT_SESSION_EVIDENCE', claimAt);
  }
});
