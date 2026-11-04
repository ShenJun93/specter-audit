import test from 'node:test';
import assert from 'node:assert/strict';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';
const T=t=>({at:'2026-11-04T10:'+t+':00.000Z',pass:10,fail:0,exitCode:0});
const base={
 sourceKind:'RECORDED_LOCAL_KIRO_CLI_SESSION',
 claimAt:'2026-11-04T10:30:00.000Z',
 sessionEndedAt:'2026-11-04T10:31:00.000Z',
 tests:[T('25'),T('05')],
 edits:[{at:'2026-11-04T10:15:00.000Z',file:'src/example.mjs',successful:true}]
};
test('latest passing test is selected by timestamp, not array iteration order',()=>{
 const x=auditLocalSession(base);
 assert.equal(x.status,'CURRENT_SELF_RECORDED_TEST');
 assert.equal(x.independentAttestation,false);
});
test('reversing otherwise identical events preserves the verdict',()=>{
 const a=auditLocalSession(base);
 const b=auditLocalSession({...base,tests:[...base.tests].reverse()});
 assert.equal(a.status,b.status);
});
test('a genuinely newer source edit is stale even if input tests are shuffled',()=>{
 const x=auditLocalSession({...base,edits:[{at:'2026-11-04T10:27:00.000Z',file:'src/example.mjs',successful:true}]});
 assert.equal(x.status,'STALE_LOCAL_TEST_EVIDENCE');
});
test('unknown or malformed top-level input fails conservatively rather than crashing',()=>{
 assert.doesNotThrow(()=>auditLocalSession(null));
 assert.equal(auditLocalSession(null).status,'INSUFFICIENT_SESSION_EVIDENCE');
});
