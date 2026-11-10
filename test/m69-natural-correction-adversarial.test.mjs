import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const at=n=>'2026-11-10T10:00:'+String(n).padStart(2,'0')+'.000Z';
const item=(n,payload)=>({timestamp:at(n),payload});
const base=[
  item(0,{type:'tool_call',toolCallId:'t0',toolName:'execute_pwsh',args:{command:'node --test'}}),
  item(1,{type:'tool_result',toolCallId:'t0',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  item(2,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'})
];
function classify(message){
  const rows=[...base,item(3,{type:'assistant',operationType:'Say',content:message})];
  const p=parseKiroSession(rows.map(x=>JSON.stringify(x)).join('\n'));
  return {errorCode:p.errorCode,verdict:p.input?auditLocalSession(p.input).status:'INSUFFICIENT_SESSION_EVIDENCE'};
}
const realCorrections=[
 'I was mistaken about the test results: 7 passed, not 8.',
 'Sorry \u2014 I was mistaken: only 7 tests passed.',
 'Sorry, I was mistaken: 7 tests passed.',
 'I got the test count wrong: 7 passed, not 8.',
 'The previous test result was incorrect. Only 7 tests passed.',
 'I need to correct myself: 7 tests passed, not 8.',
 'I apologize: just 7 tests passed.',
 'Actually only 7 tests passed, not 8.',
 'Correction, seven tests passed rather than eight.',
 'My apologies, only seven tests passed.',
 'The test result I gave was wrong: only 7 tests passed.',
 'To clarify, 7 tests passed, not 8.'
];
const unrelated=[
 'Sorry, I was wrong about the README link: the docs mention 7 tests.',
 'Recheck: I updated 7 test file links in the README.',
 'Actually, the README says 7 tests.',
 'My apologies, the documentation refers to 7 test files.',
 'I was mistaken about the test directory: it contains 7 test files.',
 'The previous count of 7 test fixtures in the README was incorrect.',
 'I gave the test count in the README: 7 passed (in the example).',
 'I reported the test count in docs: 7 passed (as a sample).'
];
test('M69: later explicit test-result corrections never retain CURRENT',()=>{
 for(const message of realCorrections){
   const {errorCode,verdict}=classify(message);
   assert.equal(verdict,'INSUFFICIENT_SESSION_EVIDENCE',message);
   assert.equal(errorCode,'LATER_AGENT_TEST_CLAIM_RETRACTED',message);
 }
});
test('M69: unrelated documentation changes cannot retract self-recorded test',()=>{
 for(const message of unrelated){
   const {errorCode,verdict}=classify(message);
   assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST',message);
   assert.equal(errorCode,null,message);
 }
});
