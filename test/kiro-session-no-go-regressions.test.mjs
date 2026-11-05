import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const t=(n)=>'2026-11-04T10:00:'+String(n).padStart(2,'0')+'.000Z';
const e=(n,payload)=>({timestamp:t(n),payload});
const stringify=rows=>rows.map(row=>JSON.stringify(row)).join('\n')+'\n';
function currentFixture(claim='All 8 tests pass, 0 fail.'){
 return [
  e(0,{type:'tool_call',toolCallId:'edit1',toolName:'str_replace',filePath:'src/sample.mjs'}),
  e(1,{type:'tool_result',toolCallId:'edit1',success:true,content:'Done'}),
  e(2,{type:'tool_call',toolCallId:'test1',toolName:'execute_pwsh',args:{command:'node --test'}}),
  e(3,{type:'tool_result',toolCallId:'test1',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  e(4,{type:'assistant',operationType:'Say',content:claim}),
  e(5,{type:'turn_end'})
 ];
}
const status=rows=>{
 const parsed=parseKiroSession(stringify(rows));
 return {parsed,verdict:parsed.input?auditLocalSession(parsed.input).status:'INSUFFICIENT_SESSION_EVIDENCE'};
};
test('baseline: coherent self-recorded PASS after source edit remains CURRENT',()=>{
 const r=status(currentFixture());
 assert.equal(r.parsed.errorCode,null);
 assert.equal(r.verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('P0: self-contradictory claim never gives CURRENT (independent judge reproduction)',()=>{
 const claims=[
  'All 8 tests pass, 0 fail. This claim is wrong.',
  'All 8 tests pass. The above test claim is incorrect.',
  'All 8 tests pass. I retract that statement.',
  'All 8 tests pass. That was a mistaken assertion.',
  'All 8 tests pass. The previous claim has been retracted.'
 ];
 for(const claim of claims){
  const r=status(currentFixture(claim));
  assert.equal(r.verdict,'INSUFFICIENT_SESSION_EVIDENCE','Unsafe CURRENT from: '+claim);
  assert.equal(r.parsed.input,null,'Contradiction should fail closed at import');
 }
});
test('P0: a paired result serialized before its call is not CURRENT despite valid timestamps',()=>{
 const rows=currentFixture();
 [rows[2],rows[3]]=[rows[3],rows[2]];
 const r=status(rows);
 assert.equal(r.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
 assert.equal(r.parsed.errorCode,'RESULT_PRECEDES_TOOL_CALL_IN_FILE');
});
test('P0: concurrency can interleave calls and results in an otherwise valid log',()=>{
 const rows=currentFixture();
 rows.splice(2,0,e(2,{type:'tool_call',toolCallId:'read1',toolName:'read_file'}));
 // An independent read-only result interleaves with a separate test call.
 rows.splice(4,0,e(2,{type:'tool_result',toolCallId:'read1',success:true}));
 const r=status(rows);
 assert.equal(r.parsed.errorCode,null);
 assert.equal(r.verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('P1: missing, null and scalar payload are safe structured errors, not throws',()=>{
 for(const payload of [undefined,null,'unexpected',0]){
  const rows=currentFixture();
  rows.splice(3,0, payload===undefined?{timestamp:t(2)}:e(2,payload));
  assert.doesNotThrow(()=>parseKiroSession(stringify(rows)));
  const r=status(rows);
  assert.equal(r.parsed.input,null);
  assert.equal(r.parsed.errorCode,'INVALID_PAYLOAD');
 }
});
test('P1: direct exported audit API cannot report session CURRENT after a postclaim failed test',()=>{
 const input={
  sourceKind:'RECORDED_LOCAL_KIRO_CLI_SESSION',
  claimAt:t(4),sessionEndedAt:t(9),
  tests:[
   {at:t(3),pass:8,fail:0,exitCode:0},
   {at:t(8),pass:7,fail:1,exitCode:1}
  ],
  edits:[{at:t(1),file:'src/sample.mjs',successful:true}]
 };
 const r=auditLocalSession(input);
 assert.equal(r.status,'INSUFFICIENT_SESSION_EVIDENCE');
 assert.equal(r.independentAttestation,false);
 assert.equal(r.semanticCorrectnessVerified,false);
});
test('P0: plain-English pronoun-only withdrawal of a PASS claim cannot establish CURRENT',()=>{
 for(const claim of [
  'All 8 tests pass, 0 fail. I retract this.',
  'All 8 tests pass, 0 fail. I withdraw that.',
  'All 8 tests pass, 0 fail. That was a lie.',
  'All 8 tests pass, 0 fail. Please disregard my earlier statement.',
  'All 8 tests pass, 0 fail. I take that back.'
 ]){
  const r=status(currentFixture(claim));
  assert.equal(r.parsed.input,null,'FAIL CLOSED: '+claim);
  assert.equal(r.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
 }
});
test('P0: a separate assistant withdrawal after PASS claim blocks CURRENT',()=>{
 const rows=currentFixture();
 rows.splice(5,0,e(5,{type:'assistant',operationType:'Say',content:'I retract this.'}));
 rows[6].timestamp=t(6);
 const r=status(rows);
 assert.equal(r.parsed.input,null);
 assert.equal(r.parsed.errorCode,'LATER_AGENT_TEST_CLAIM_RETRACTED');
});
test('P0: a later serialized source edit cannot be backdated before test to fake CURRENT',()=>{
 const rows=[
  e(0,{type:'tool_call',toolCallId:'e1',toolName:'str_replace',filePath:'src/sample.mjs'}),
  e(1,{type:'tool_result',toolCallId:'e1',success:true}),
  e(3,{type:'tool_call',toolCallId:'test1',toolName:'execute_pwsh',args:{command:'node --test'}}),
  e(4,{type:'tool_result',toolCallId:'test1',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  e(1,{type:'tool_call',toolCallId:'e2',toolName:'str_replace',filePath:'src/sample.mjs'}),
  e(2,{type:'tool_result',toolCallId:'e2',success:true}),
  e(6,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
  e(7,{type:'turn_end'})
 ];
 const r=status(rows);
 assert.equal(r.parsed.input,null);
 assert.equal(r.parsed.errorCode,'NON_MONOTONIC_TOOL_CHRONOLOGY');
});
test('P0: agent claim serialized before its supporting test result cannot establish CURRENT',()=>{
 const rows=currentFixture();
 [rows[3],rows[4]]=[rows[4],rows[3]]; // claim appears before test result; timestamps stay valid.
 const r=status(rows);
 assert.equal(r.parsed.input,null);
 assert.equal(r.parsed.errorCode,'CLAIM_PRECEDES_TEST_RESULT_IN_FILE');
});
test('legitimate unrelated event timestamp skew does not discard Kiro tool chronology',()=>{
 const rows=currentFixture();
 rows.splice(2,0,e(0,{type:'turn_end'})); // unrelated non-tool event can arrive late.
 const r=status(rows);
 assert.equal(r.parsed.errorCode,null);
 assert.equal(r.verdict,'CURRENT_SELF_RECORDED_TEST');
});
