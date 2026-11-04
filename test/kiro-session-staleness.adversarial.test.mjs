// Independent ChatGPT/WAG adversarial review of Kiro-authored session auditor.
// This is not attributed to Kiro; code source is Kiro authored.
import test from 'node:test';
import assert from 'node:assert/strict';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';
const BASE={
  sourceKind:'RECORDED_LOCAL_KIRO_CLI_SESSION',
  claimAt:'2026-11-04T10:30:00.000Z',
  sessionEndedAt:'2026-11-04T11:00:00.000Z',
  edits:[{at:'2026-11-04T10:10:00.000Z',file:'src/x.mjs',successful:true}],
  tests:[]
};
const PASS=(at='2026-11-04T10:20:00.000Z')=>({at,pass:10,fail:0,exitCode:0});
function check(input){
  const r=auditLocalSession(input);
  assert.equal(r.independentAttestation,false);
  assert.equal(r.semanticCorrectnessVerified,false);
  return r;
}
test('a later failing test cannot be hidden by an earlier passing test',()=>{
  const x={...BASE,tests:[PASS(),{at:'2026-11-04T10:25:00.000Z',pass:9,fail:1,exitCode:1}]};
  assert.equal(check(x).status,'INSUFFICIENT_SESSION_EVIDENCE');
});
test('a passing test after the observed agent claim is not contemporaneous evidence',()=>{
  const x={...BASE,tests:[PASS('2026-11-04T10:40:00.000Z')]};
  assert.equal(check(x).status,'INSUFFICIENT_SESSION_EVIDENCE');
});
test('two timestamp strings denoting the same instant cannot count as two runs',()=>{
  const x={...BASE,tests:[PASS('2026-11-04T10:20:00.000Z'),PASS('2026-11-04T10:20:00Z')]};
  assert.equal(check(x).status,'INSUFFICIENT_SESSION_EVIDENCE');
});
test('timestamp without an explicit timezone is rejected, not presumed UTC',()=>{
  const x={...BASE,tests:[PASS('2026-11-04T10:20:00')]};
  assert.equal(check(x).status,'INSUFFICIENT_SESSION_EVIDENCE');
});
test('a clean passing test after last edit and before claim remains supported as self-reported only',()=>{
  const x={...BASE,tests:[PASS()]};
  const r=check(x);
  assert.equal(r.status,'CURRENT_SELF_RECORDED_TEST');
});
test('valid later source edit makes previous passing test stale',()=>{
  const x={...BASE,edits:[{at:'2026-11-04T10:25:00.000Z',file:'src/x.mjs',successful:true}],tests:[PASS()]};
  assert.equal(check(x).status,'STALE_LOCAL_TEST_EVIDENCE');
});
