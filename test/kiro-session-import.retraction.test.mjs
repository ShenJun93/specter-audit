import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const at = minute => `2026-11-05T00:${String(minute).padStart(2,'0')}:00.000Z`;
const event = (minute,payload) => ({timestamp:at(minute),payload});
const passLog = 'pass 8\nfail 0\nExit Code: 0';
function inspect(messages) {
  const events=[
    event(0,{type:'tool_call',toolCallId:'test-1',toolName:'execute_pwsh',args:{command:'node --test'}}),
    event(1,{type:'tool_result',toolCallId:'test-1',success:true,content:passLog}),
    ...messages.map(([minute,content])=>event(minute,{type:'assistant',operationType:'Say',content})),
    event(9,{type:'turn_end'})
  ];
  const parsed=parseKiroSession(events.map(e=>JSON.stringify(e)).join('\n'));
  return {parsed,verdict:parsed.input?auditLocalSession(parsed.input).status:null};
}
test('M7 regression: a later explicit retraction cannot leave earlier PASS CURRENT',()=>{
  for(const correction of [
    'Not all 8 tests pass, 0 fail.',
    'Correction: 2 tests failed; the earlier PASS claim was wrong.',
    'Actually, tests failed. Do not ship.'
  ]){
    const {parsed,verdict}=inspect([[2,'All 8 tests pass, 0 fail.'],[3,correction]]);
    assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST',correction);
    assert.equal(parsed.input,null,correction);
  }
});
test('M7/M8.5 regression: repeating PASS after a retraction without a new test is insufficient',()=>{
  const {parsed,verdict}=inspect([
    [2,'All 8 tests pass, 0 fail.'],
    [3,'Actually, tests failed.'],
    [4,'All 8 tests pass, 0 fail.']
  ]);
  assert.equal(parsed.errorCode,'CORRECTION_WITHOUT_NEW_TEST_RECEIPT');
  assert.equal(verdict,null);
});
test('M7/M8.5 regression: a fresh matching receipt supports a new claim after correction',()=>{
  const events=[
    event(0,{type:'tool_call',toolCallId:'test-1',toolName:'execute_pwsh',args:{command:'node --test'}}),
    event(1,{type:'tool_result',toolCallId:'test-1',success:true,content:passLog}),
    event(2,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
    event(3,{type:'assistant',operationType:'Say',content:'Actually, tests failed.'}),
    event(4,{type:'tool_call',toolCallId:'test-2',toolName:'execute_pwsh',args:{command:'node --test'}}),
    event(5,{type:'tool_result',toolCallId:'test-2',success:true,content:passLog}),
    event(6,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
    event(9,{type:'turn_end'})
  ];
  const parsed=parseKiroSession(events.map(e=>JSON.stringify(e)).join('\n'));
  assert.equal(parsed.errorCode,null);
  assert.equal(auditLocalSession(parsed.input).status,'CURRENT_SELF_RECORDED_TEST');
  assert.equal(parsed.input.claimAt,at(6));
});
