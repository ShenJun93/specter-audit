import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const at=n=>'2026-11-04T10:00:'+String(n).padStart(2,'0')+'.000Z';
const e=(n,payload)=>({timestamp:at(n),payload});
const passLog='pass 8\nfail 0\nExit Code: 0';
const base=()=>[
  e(0,{type:'tool_call',toolCallId:'test1',toolName:'execute_pwsh',args:{command:'node --test'}}),
  e(1,{type:'tool_result',toolCallId:'test1',success:true,content:passLog}),
  e(2,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
  e(9,{type:'turn_end'})
];
const check=rows=>{
 const parsed=parseKiroSession(rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
 const verdict=parsed.input?auditLocalSession(parsed.input).status:'INSUFFICIENT_SESSION_EVIDENCE';
 return {parsed,verdict};
};
test('P1 M8.8: multiword explicit claim withdrawals invalidate old passing assertion',()=>{
 for(const sentence of [
  'I retract my earlier claim.',
  'I withdraw my earlier claim.',
  'I retract the previous claim.',
  'I withdraw my previous test claim.',
  'I take back my earlier claim.',
  'We disavow our earlier test results.',
  'We retract the original statement.'
 ]){
  const rows=base();
  rows.splice(3,0,e(3,{type:'assistant',operationType:'Say',content:sentence}));
  const {parsed,verdict}=check(rows);
  assert.equal(verdict,'INSUFFICIENT_SESSION_EVIDENCE',sentence);
  assert.equal(parsed.errorCode,'LATER_AGENT_TEST_CLAIM_RETRACTED',sentence);
 }
});
test('P1 M8.8: repeated PASS after withdrawal cannot reuse the disputed receipt',()=>{
 const rows=base();
 rows.splice(3,0,
  e(3,{type:'assistant',operationType:'Say',content:'I retract my earlier claim.'}),
  e(4,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'})
 );
 const {parsed,verdict}=check(rows);
 assert.equal(parsed.errorCode,'CORRECTION_WITHOUT_NEW_TEST_RECEIPT');
 assert.equal(verdict,'INSUFFICIENT_SESSION_EVIDENCE');
});
test('M8.8: same-message multiword withdrawal cannot support CURRENT',()=>{
 const rows=base();
 rows[2].payload.content='All 8 tests pass, 0 fail. I retract my earlier claim.';
 const {parsed,verdict}=check(rows);
 assert.equal(parsed.errorCode,'NO_RECORDED_AGENT_TEST_CLAIM');
 assert.equal(verdict,'INSUFFICIENT_SESSION_EVIDENCE');
});
test('M8.8: unrelated assistant comment still preserves a valid CURRENT',()=>{
 const rows=base();
 rows.splice(3,0,e(3,{type:'assistant',operationType:'Say',content:'I reworded the documentation heading.'}));
 const {parsed,verdict}=check(rows);
 assert.equal(parsed.errorCode,null);
 assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('M8.8: fresh successful receipt after withdrawal may support a new PASS',()=>{
 const rows=base();
 rows.splice(3,0,
  e(3,{type:'assistant',operationType:'Say',content:'I retract my earlier claim.'}),
  e(4,{type:'tool_call',toolCallId:'test2',toolName:'execute_pwsh',args:{command:'node --test'}}),
  e(5,{type:'tool_result',toolCallId:'test2',success:true,content:passLog}),
  e(6,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'})
 );
 const {parsed,verdict}=check(rows);
 assert.equal(parsed.errorCode,null);
 assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST');
});
