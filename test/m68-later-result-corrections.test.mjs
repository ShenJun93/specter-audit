import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const at=n=>'2026-11-08T10:00:'+String(n).padStart(2,'0')+'.000Z';
const row=(n,payload)=>({timestamp:at(n),payload});
function inspect(correction,{inSameMessage=false}={}) {
  const claim='All 8 tests pass, 0 fail.';
  const rows=[
    row(0,{type:'tool_call',toolCallId:'test',toolName:'execute_pwsh',args:{command:'node --test'}}),
    row(1,{type:'tool_result',toolCallId:'test',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
    row(2,{type:'assistant',operationType:'Say',content:inSameMessage?claim+' '+correction:claim}),
    ...(!correction||inSameMessage?[]:[row(3,{type:'assistant',operationType:'Say',content:correction})]),
    row(9,{type:'turn_end'})
  ];
  const parsed=parseKiroSession(rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
  return {parsed,verdict:parsed.input?auditLocalSession(parsed.input).status:'INSUFFICIENT_SESSION_EVIDENCE'};
}
test('control: valid claim without correction remains self-recorded current',()=>{
  const {parsed,verdict}=inspect(null);
  assert.equal(parsed.errorCode,null);
  assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('M68 P0: explicit later natural-language test count correction never remains CURRENT',()=>{
  const corrections=[
    'Sorry, I was mistaken: only 7 tests actually passed.',
    'The earlier number was wrong — only 7 tests passed.',
    'Recheck: 7 tests passed.',
    'I gave the wrong test count: 7 passed, not 8.',
    'Sorry, I was wrong about the tests: only 7 passed.',
    'Follow-up on test results: 7 passed, not 8.',
    'I was wrong about the test result: 7 passed, 1 failed.',
    'Actually I miscounted: 7 tests passed.',
    'My apologies, only 7 tests passed.',
    'I need to amend the test result: 7 passed.',
    'The correct test count is 7, not 8.',
    'Make that 7 tests passed, not 8.',
    'Only 7 tests actually passed.',
    'After checking, 7 tests passed, not 8.'
  ];
  for(const correction of corrections){
    const {parsed,verdict}=inspect(correction);
    assert.equal(verdict,'INSUFFICIENT_SESSION_EVIDENCE',correction);
    assert.equal(parsed.errorCode,'LATER_AGENT_TEST_CLAIM_RETRACTED',correction);
  }
});
test('M68 P0: same-message explicit natural language correction never remains CURRENT',()=>{
  const correction='Sorry, I was mistaken: only 7 tests actually passed.';
  const {parsed,verdict}=inspect(correction,{inSameMessage:true});
  assert.equal(verdict,'INSUFFICIENT_SESSION_EVIDENCE');
  assert.equal(parsed.errorCode,'NO_RECORDED_AGENT_TEST_CLAIM');
});
test('unrelated correction about documentation does not retract an observed passing result',()=>{
  for(const correction of ['Correction: renamed the README section.','Sorry, I was wrong about the README title.']){
    const {parsed,verdict}=inspect(correction);
    assert.equal(parsed.errorCode,null,correction);
    assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST',correction);
  }
});
