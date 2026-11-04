import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const at = n => '2026-11-05T01:'+String(n).padStart(2,'0')+':00.000Z';
const event = (n,payload) => ({timestamp:at(n),payload});
const call = (n,id,command='node --test') =>
  event(n,{type:'tool_call',toolCallId:id,toolName:'execute_pwsh',args:{command}});
const result = (n,id,success,content) =>
  event(n,{type:'tool_result',toolCallId:id,success,content});
const claim = n => event(n,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'});
const receipt = (pass=8,fail=0,exit=0) =>
  'pass '+pass+'\nfail '+fail+'\nExit Code: '+exit;
const assess = events => {
  const parsed=parseKiroSession(events.map(e=>JSON.stringify(e)).join('\n'));
  return {parsed,status:parsed.input?auditLocalSession(parsed.input).status:null};
};
test('post-claim failing test supersedes an earlier passing test for current-session verdict',()=>{
  const {status,parsed}=assess([
    call(0,'pass'),result(1,'pass',true,receipt()),claim(2),
    call(3,'fail'),result(4,'fail',true,receipt(7,1,1)),event(5,{type:'turn_end'})
  ]);
  assert.notEqual(status,'CURRENT_SELF_RECORDED_TEST',JSON.stringify(parsed.summary));
});
test('orphan tool result after PASS cannot silently hide a potential edit',()=>{
  const {status}=assess([
    call(0,'pass'),result(1,'pass',true,receipt()),claim(2),
    result(3,'orphan',true,'Wrote src/main.mjs'),event(4,{type:'turn_end'})
  ]);
  assert.notEqual(status,'CURRENT_SELF_RECORDED_TEST');
});
test('same-instant test completion and agent claim is not chronologically proven',()=>{
  const {status}=assess([
    call(0,'pass'),result(1,'pass',true,receipt()),claim(1),
    event(2,{type:'turn_end'})
  ]);
  assert.notEqual(status,'CURRENT_SELF_RECORDED_TEST');
});
test('PowerShell expression substitution is not an isolated trusted test invocation',()=>{
  for(const command of [
    'node --test $(Invoke-Expression $payload)',
    'node --test @(Invoke-Expression $payload)'
  ]){
    const {status}=assess([
      call(0,'pass',command),result(1,'pass',true,receipt()),claim(2),
      event(3,{type:'turn_end'})
    ]);
    assert.notEqual(status,'CURRENT_SELF_RECORDED_TEST',command);
  }
});

test('quoted regex parentheses in read-only pipeline are recognized without shell execution',()=>{
  const {parsed,status}=assess([
    call(0,'t','npm test 2>&1 | Select-String -Pattern "(pass|fail|Exit Code)" | Select-Object -Last 30'),
    result(1,'t',true,receipt(120,0,0)),
    event(2,{type:'assistant',operationType:'Say',content:'All 120 tests pass, 0 fail.'}),
    event(9,{type:'turn_end'})
  ]);
  assert.equal(parsed.errorCode,null);
  assert.equal(status,'CURRENT_SELF_RECORDED_TEST');
});
test('unquoted PowerShell expressions inside output filters remain insufficient',()=>{
  for(const command of [
    'node --test | Select-String -Pattern (Invoke-Expression input)',
    'node --test | Select-String -Pattern "$(Invoke-Expression $input)"',
    'node --test | Select-String -Pattern "result" & Invoke-Expression input'
  ]){
    const {status}=assess([call(0,'t',command),result(1,'t',true,receipt()),claim(2)]);
    assert.notEqual(status,'CURRENT_SELF_RECORDED_TEST',command);
  }
});
test('authentic M5A-shaped chronology is stale: 120 PASS before claim, 36 PASS later, then edit',()=>{
  const {parsed,status}=assess([
    call(0,'base','npm test 2>&1 | Select-String -Pattern "(pass|fail|Exit Code)" | Select-Object -Last 30'),
    result(1,'base',true,receipt(120,0,0)),
    event(2,{type:'assistant',operationType:'Say',content:'All 120 tests pass, 0 fail.'}),
    call(3,'followup'),result(4,'followup',true,receipt(36,0,0)),
    event(5,{type:'tool_call',toolCallId:'edit',toolName:'str_replace',filePath:'src/example.mjs'}),
    result(6,'edit',true,'Done'),
    event(9,{type:'turn_end'})
  ]);
  assert.equal(parsed.errorCode,null);
  assert.equal(parsed.summary.observedTests,2);
  assert.equal(parsed.summary.testTimesBeforeClaim,1);
  assert.equal(status,'STALE_LOCAL_TEST_EVIDENCE');
});
test('a later passing test after the last edit cannot retroactively certify a claim',()=>{
  const {parsed,status}=assess([
    call(0,'base'),result(1,'base',true,receipt()),claim(2),
    event(3,{type:'tool_call',toolCallId:'edit',toolName:'fs_write',filePath:'src/example.mjs'}),
    result(4,'edit',true,'Done'),
    call(5,'followup'),result(6,'followup',true,receipt()),
    event(9,{type:'turn_end'})
  ]);
  assert.equal(parsed.errorCode,'POST_CLAIM_TEST_EVIDENCE_UNRESOLVED');
  assert.equal(status,null);
});
test('no preclaim test plus a later passing test and edit is insufficient',()=>{
  const {parsed,status}=assess([
    claim(0),call(1,'followup'),result(2,'followup',true,receipt()),
    event(3,{type:'tool_call',toolCallId:'edit',toolName:'str_replace',filePath:'src/example.mjs'}),
    result(4,'edit',true,'Done'),event(5,{type:'turn_end'})
  ]);
  assert.equal(parsed.errorCode,'POST_CLAIM_TEST_EVIDENCE_UNRESOLVED');
  assert.equal(status,null);
});
test('postclaim failing test remains insufficient even when later edit exists',()=>{
  const {parsed,status}=assess([
    call(0,'base'),result(1,'base',true,receipt()),claim(2),
    call(3,'later'),result(4,'later',true,receipt(7,1,1)),
    event(5,{type:'tool_call',toolCallId:'edit',toolName:'str_replace',filePath:'src/example.mjs'}),
    result(6,'edit',true,'Done')
  ]);
  assert.equal(parsed.errorCode,'POST_CLAIM_TEST_EVIDENCE_UNRESOLVED');
  assert.equal(status,null);
});
