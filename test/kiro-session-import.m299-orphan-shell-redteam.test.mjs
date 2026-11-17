import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession as sourceParse} from '../src/kiro-session-import.mjs';
import {parseKiroSession as browserParse} from '../web/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';
import {summarizeLocalSession} from '../web/evidence-trial.mjs';

const at = m => '2026-11-17T10:' + String(m).padStart(2,'0') + ':00.000Z';
const e = (m,payload) => ({timestamp:at(m),payload});
const call = (m,id,toolName,args={}) => e(m,{type:'tool_call',toolCallId:id,toolName,args});
const result = (m,id,success,content) => e(m,{type:'tool_result',toolCallId:id,success,content});
const pass = [call(20,'t','execute_pwsh',{command:'node --test'}),result(21,'t',true,'pass 8\nfail 0\nExit Code: 0')];
const end = [e(30,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),e(31,{type:'turn_end'})];
const encode = xs => xs.map(x=>JSON.stringify(x)).join('\n')+'\n';
function checkFailClosed(rows) {
  const raw = encode(rows);
  const parsed = sourceParse(raw);
  assert.equal(parsed.errorCode,'INCOMPLETE_RELEVANT_TOOL_EVIDENCE');
  assert.equal(parsed.input,null);
  assert.deepEqual(browserParse(raw),parsed,'browser importer must preserve fail-closed error');
  const ui = summarizeLocalSession(raw);
  assert.equal(ui.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
  assert.equal(ui.reason,'INCOMPLETE_RELEVANT_TOOL_EVIDENCE');
  const safe = JSON.stringify({parsed,ui});
  assert.doesNotMatch(safe,/CANARY_SOURCE_SECRET|CANARY_COMMAND_SECRET|C:\\Users\\Secret/i);
  return {parsed,ui};
}

for(const success of [false,true,null]) {
  test('M299 SEC-01 orphan result before test (success='+String(success)+') cannot earn CURRENT',()=>{
    const rows=[result(10,'orphan',success,'CANARY_SOURCE_SECRET'),...pass,...end];
    const {parsed}=checkFailClosed(rows);
    assert.equal(parsed.summary.unpairedRelevant,1);
  });
}
test('M299 SEC-01 orphan result after passing test remains unresolved',()=>{
  checkFailClosed([...pass,result(24,'orphan',false,'CANARY_SOURCE_SECRET'),...end]);
});
test('M299 SEC-01 orphan result after agent claim remains unresolved',()=>{
  checkFailClosed([...pass,end[0],result(31,'orphan',true,'CANARY_SOURCE_SECRET'),e(32,{type:'turn_end'})]);
});
test('M299 SEC-01 multiple orphan results before passing test remain insufficient',()=>{
  checkFailClosed([result(5,'orphanA',true,'quiet'),result(10,'orphanB',false,'CANARY_SOURCE_SECRET'),...pass,...end]);
});

const dangerousCommands = [
  'Set-Content src/foo.mjs CANARY_COMMAND_SECRET',
  'Remove-Item src/foo.mjs',
  'node -e "require(\'fs\').writeFileSync(\'src/foo.mjs\',\'corrupt\')"',
  'git reset --hard HEAD',
  'node --test | Out-File src/results.mjs'
];
for(const command of dangerousCommands) {
  test('M299 SEC-02 failed shell write before retest fails closed: '+command.slice(0,35),()=>{
    checkFailClosed([call(10,'s','execute_pwsh',{command}),result(11,'s',false,'CANARY_SOURCE_SECRET'),...pass,...end]);
  });
}
test('M299 SEC-02 failed dangerous shell AFTER test is also insufficient',()=>{
  checkFailClosed([...pass,call(24,'s','execute_pwsh',{command:'Set-Content src/foo.mjs value'}),result(25,'s',false,'CANARY_SOURCE_SECRET'),...end]);
});
test('M299 valid failed test then successful retest remains CURRENT',()=>{
  const rows=[
    call(2,'bad','execute_pwsh',{command:'node --test'}),result(3,'bad',false,'Test command failed'),
    ...pass,...end
  ];
  const raw=encode(rows);
  const parsed=sourceParse(raw);
  assert.equal(parsed.errorCode,null);
  assert.equal(auditLocalSession(parsed.input).status,'CURRENT_SELF_RECORDED_TEST');
  assert.equal(summarizeLocalSession(raw).verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('M299 normal successful edit before later pass remains CURRENT',()=>{
  const rows=[
    call(10,'ed','str_replace',{filePath:'src/main.mjs'}),result(11,'ed',true,'done'),
    ...pass,...end
  ];
  const parsed=sourceParse(encode(rows));
  assert.equal(parsed.errorCode,null);
  assert.equal(auditLocalSession(parsed.input).status,'CURRENT_SELF_RECORDED_TEST');
});

test('M299 failed unknown tool result before PASS cannot be treated as harmless',()=>{
  checkFailClosed([
    call(10,'unknown','mcp_write_file',{path:'C:\\\\Users\\\\Secret\\\\source.mjs'}),
    result(11,'unknown',false,'CANARY_SOURCE_SECRET'),
    ...pass,...end
  ]);
});
test('M299 failed unclassified shell result before PASS remains insufficient',()=>{
  checkFailClosed([
    call(10,'unknown','execute_pwsh',{command:`python -c "open('src/x.mjs','w').write('x')"`}),
    result(11,'unknown',false,'CANARY_SOURCE_SECRET'),
    ...pass,...end
  ]);
});
test('M299 known read-only failure before a passing test need not imply source mutation',()=>{
  const raw=encode([
    call(10,'info','read_file',{filePath:'src/x.mjs'}),
    result(11,'info',false,'File not found'),
    ...pass,...end
  ]);
  const parsed=sourceParse(raw);
  assert.equal(parsed.errorCode,null);
  assert.equal(summarizeLocalSession(raw).verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('M299 unpaired tool call with no result stays fail-closed',()=>{
  const raw=encode([
    call(10,'unknown','execute_pwsh',{command:'Set-Content src/x.mjs value'}),
    ...pass,...end
  ]);
  const parsed=sourceParse(raw);
  assert.equal(parsed.input,null);
  assert.equal(parsed.errorCode,'OVERLAPPING_RELEVANT_TOOL_OPERATIONS');
  assert.equal(summarizeLocalSession(raw).verdict,'INSUFFICIENT_SESSION_EVIDENCE');
});
