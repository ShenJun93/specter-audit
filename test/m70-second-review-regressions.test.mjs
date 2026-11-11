import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const line=(n,payload)=>JSON.stringify({timestamp:'2026-11-10T10:00:'+String(n).padStart(2,'0')+'.000Z',payload});
function inspect(statement) {
 const rows=[
  line(0,{type:'tool_call',toolCallId:'t',toolName:'execute_pwsh',args:{command:'node --test'}}),
  line(1,{type:'tool_result',toolCallId:'t',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  line(2,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
  line(3,{type:'assistant',operationType:'Say',content:statement})
 ];
 const parsed=parseKiroSession(rows.join('\n'));
 return {errorCode:parsed.errorCode,verdict:parsed.input?auditLocalSession(parsed.input).status:'INSUFFICIENT_SESSION_EVIDENCE'};
}
test('M70 P1: new explicit correction of test count invalidates earlier pass',()=>{
 for(const text of [
  'The test count should have been 7, not 8.',
  'The pass count should have been 7, not 8.',
  'My test count should have been 7, not 8.'
 ]){
  const x=inspect(text);
  assert.equal(x.errorCode,'LATER_AGENT_TEST_CLAIM_RETRACTED',text);
  assert.equal(x.verdict,'INSUFFICIENT_SESSION_EVIDENCE',text);
 }
});
test('M70 P2: README example numbers are not test-result corrections',()=>{
 for(const text of [
  'Actually, the README example says 7 tests passed; my claim was about the source suite.',
  'Correction: the README example says 7 tests passed. My real test claim remains about the source suite.',
  'Update: documentation example states 7 tests passed; this refers only to the example.'
 ]){
  const x=inspect(text);
  assert.equal(x.errorCode,null,text);
  assert.equal(x.verdict,'CURRENT_SELF_RECORDED_TEST',text);
 }
});
test('M70 control: an explicit result correction after discussing README fails closed',()=>{
 const x=inspect('Actually, the README example says 8 tests passed, but the actual run passed only 7.');
 assert.equal(x.errorCode,'LATER_AGENT_TEST_CLAIM_RETRACTED');
 assert.equal(x.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
});
