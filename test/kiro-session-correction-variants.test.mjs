import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const at=n=>'2026-11-04T10:00:'+String(n).padStart(2,'0')+'.000Z';
const row=(n,payload)=>({timestamp:at(n),payload});
const inspect=(rows)=>{
  const parsed=parseKiroSession(rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
  return {parsed,verdict:parsed.input?auditLocalSession(parsed.input).status:'INSUFFICIENT_SESSION_EVIDENCE'};
};
function fixture(claim='All 8 tests pass, 0 fail.'){
  return [
    row(0,{type:'tool_call',toolCallId:'test',toolName:'execute_pwsh',args:{command:'node --test'}}),
    row(1,{type:'tool_result',toolCallId:'test',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
    row(2,{type:'assistant',operationType:'Say',content:claim}),
    row(9,{type:'turn_end'})
  ];
}
test('P0: natural-language and Unicode test corrections invalidate older PASS',()=>{
  const corrections=[
    'Correction — 7 tests passed.',
    'Correction – 7 tests passed.',
    'I need to correct the test result: 7 tests passed.',
    'To correct my earlier test result: 7 tests passed.',
    'Update on tests: 7 passed, one failed.',
    'Oops, one test failed.',
    'Revision about test results: 7 passed.',
    'Correction, only seven tests passed.',
    'Actually — one test failed.'
  ];
  for(const correction of corrections){
    const rows=fixture();
    rows.splice(3,0,row(3,{type:'assistant',operationType:'Say',content:correction}));
    const r=inspect(rows);
    assert.equal(r.verdict,'INSUFFICIENT_SESSION_EVIDENCE',correction);
    assert.equal(r.parsed.errorCode,'LATER_AGENT_TEST_CLAIM_RETRACTED',correction);
  }
});
test('P0: Unicode correction in the same affirmative message is not CURRENT',()=>{
  const r=inspect(fixture('All 8 tests pass, 0 fail. Correction — 7 tests passed.'));
  assert.equal(r.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
  assert.equal(r.parsed.errorCode,'NO_RECORDED_AGENT_TEST_CLAIM');
});
test('Unrelated correction about documentation does not invalidate a valid PASS',()=>{
  const rows=fixture();
  rows.splice(3,0,row(3,{type:'assistant',operationType:'Say',content:'Correction — renamed the README section.'}));
  const r=inspect(rows);
  assert.equal(r.verdict,'CURRENT_SELF_RECORDED_TEST');
  assert.equal(r.parsed.errorCode,null);
});
