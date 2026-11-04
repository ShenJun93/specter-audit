import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';
const at=t=>'2026-11-04T10:'+t+':00.000Z';
const event=(time,payload)=>({timestamp:at(time),payload});
const call=(time,id,toolName,args={})=>event(time,{type:'tool_call',toolCallId:id,toolName,args});
const result=(time,id,success,content)=>event(time,{type:'tool_result',toolCallId:id,success,content});
const claim=(time,content='All 8 tests pass, 0 fail.')=>event(time,{type:'assistant',operationType:'Say',content});
const passLog='pass 8\nfail 0\nExit Code: 0';
const inspect=events=>{
 const parsed=parseKiroSession(events.map(e=>JSON.stringify(e)).join('\n')+'\n');
 return {parsed,verdict:parsed.input?auditLocalSession(parsed.input).status:null};
};
test('a test finishing after the claim cannot prove it retroactively',()=>{
 const {verdict}=inspect([call('00','t','execute_pwsh',{command:'node --test'}),claim('02'),result('04','t',true,passLog),event('06',{type:'turn_end'})]);
 assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('an edit overlapping a test cannot establish CURRENT or proven STALE chronology',()=>{
 const {parsed,verdict}=inspect([call('00','e','str_replace',{filePath:'src/main.mjs'}),call('01','t','execute_pwsh',{command:'node --test'}),result('02','t',true,passLog),result('04','e',true,'done'),claim('05'),event('06',{type:'turn_end'})]);
 assert.equal(parsed.errorCode,'OVERLAPPING_RELEVANT_TOOL_OPERATIONS');
 assert.equal(verdict,null);
});
test('a failed later test tool result must not silently disappear',()=>{
 const {verdict}=inspect([call('00','t1','execute_pwsh',{command:'node --test'}),result('01','t1',true,passLog),call('02','t2','execute_pwsh',{command:'npm test'}),result('03','t2',false,'Tool execution aborted'),claim('04'),event('05',{type:'turn_end'})]);
 assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('ambiguous or hypothetical test passed text must not be elevated',()=>{
 for(const sentence of [
  'Not all 8 tests pass, 0 fail.',
  'Do not claim all 8 tests pass, 0 fail.',
  'Some users might say all 8 tests pass, 0 fail.',
  'If all 8 tests pass, 0 fail, then we can ship.'
 ]){
  const {parsed}=inspect([call('00','t','execute_pwsh',{command:'node --test'}),result('01','t',true,passLog),claim('02',sentence),event('03',{type:'turn_end'})]);
  assert.equal(parsed.input,null,sentence);
 }
});
test('successful unknown shell write cannot yield CURRENT',()=>{
 for(const command of [
   "Set-Content src/main.mjs -Value 'changed'",
   'node -e "require(\'fs\').writeFileSync(\'src/main.mjs\',\'changed\')"',
   'git checkout -- src/main.mjs'
 ]){
  const {verdict}=inspect([call('00','t','execute_pwsh',{command:'node --test'}),result('01','t',true,passLog),claim('02'),call('03','w','execute_pwsh',{command}),result('04','w',true,'Exit Code: 0'),event('05',{type:'turn_end'})]);
  assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST',command);
 }
});
test('failed test tool never establishes a valid current receipt',()=>{
 const {verdict}=inspect([call('00','t','execute_pwsh',{command:'node --test'}),result('01','t',false,passLog),claim('02')]);
 assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('compound shell scripts do not become trusted passing tests',()=>{
 for(const command of [
  'node --test; node -e "process.exit(0)"',
  'echo Preparing; node --test',
  'node --test || echo FAILED',
  'node --test && node scripts/post-test-write.mjs'
 ]){
  const {parsed,verdict}=inspect([
    call('00','t','execute_pwsh',{command}),
    result('01','t',true,passLog),
    claim('02'),
    event('03',{type:'turn_end'})
  ]);
  assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST',command);
 }
});
test('an affirmative-sounding first sentence followed by a contradiction is rejected',()=>{
 for(const sentence of [
  'All 8 tests pass, 0 fail. But actually the run failed.',
  'All 8 tests passed! However, that was hypothetical.'
 ]){
  const {parsed}=inspect([
    call('00','t','execute_pwsh',{command:'node --test'}),
    result('01','t',true,passLog),
    claim('02',sentence)
  ]);
  assert.equal(parsed.input,null,sentence);
 }
});
test('read-only Select-String pipeline from real Kiro shell style is recognized',()=>{
 const {parsed,verdict}=inspect([
   call('00','t','execute_pwsh',{command:"node --test 2>&1 | Select-String -Pattern 'pass|fail|Exit Code' | Select-Object -Last 30"}),
   result('01','t',true,passLog),
   claim('02'),event('03',{type:'turn_end'})
 ]);
 assert.equal(parsed.errorCode,null);
 assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('a piped file-write command never masquerades as a pure test command',()=>{
 const {verdict}=inspect([
   call('00','t','execute_pwsh',{command:'node --test | Out-File src/test-output.mjs'}),
   result('01','t',true,passLog),
   claim('02'),event('03',{type:'turn_end'})
 ]);
 assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('a failed source edit can have partially mutated files: never upgrade to CURRENT',()=>{
 const {parsed,verdict}=inspect([
  call('00','t','execute_pwsh',{command:'node --test'}),
  result('01','t',true,passLog),
  claim('02'),
  call('03','e','str_replace',{filePath:'src/main.mjs'}),
  result('04','e',false,'Tool failed during write'),
  event('05',{type:'turn_end'})
 ]);
 assert.notEqual(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('a failed edit followed by a newer observed passing test does not force a false stale verdict',()=>{
 const {parsed,verdict}=inspect([
  call('00','e','str_replace',{filePath:'src/main.mjs'}),
  result('01','e',false,'Tool failed during write'),
  call('02','t','execute_pwsh',{command:'node --test'}),
  result('03','t',true,passLog),
  claim('04'),
  event('05',{type:'turn_end'})
 ]);
 assert.equal(parsed.errorCode,null);
 assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST');
});
