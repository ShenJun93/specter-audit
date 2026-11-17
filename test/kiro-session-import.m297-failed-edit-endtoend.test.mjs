import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKiroSession as sourceParse } from '../src/kiro-session-import.mjs';
import { parseKiroSession as browserParse } from '../web/kiro-session-import.mjs';
import { auditLocalSession } from '../src/kiro-session-staleness.mjs';
import { summarizeLocalSession } from '../web/evidence-trial.mjs';

const stamp = minute => `2026-03-02T12:${String(minute).padStart(2, '0')}:00.000Z`;
const event = (minute, payload) => ({ timestamp: stamp(minute), payload });
const call = (minute, id, toolName, args={}) =>
  event(minute, { type:'tool_call', toolCallId:id, toolName, args });
const result = (minute, id, success, content) =>
  event(minute, { type:'tool_result', toolCallId:id, success, content });
const testCall = () => call(20, 'test', 'execute_pwsh', {command:'node --test'});
const testPass = () => result(21, 'test', true, 'pass 8\nfail 0\nExit Code: 0');
const claim = () => event(30, {type:'assistant', operationType:'Say', content:'All 8 tests pass, 0 fail.'});
const encode = rows => rows.map(e => JSON.stringify(e)).join('\n') + '\n';

for (const toolName of ['str_replace','fs_write']) {
  for (const when of ['before-test','after-test']) {
    test(`M297 ${toolName}: failed edit ${when} never becomes CURRENT in importer or UI`, () => {
      const editCall = call(when==='before-test'?10:24,'edit',toolName,
        {filePath:'C:\\Users\\Private\\project\\src\\example.mjs'});
      const editResult = result(when==='before-test'?11:25,'edit',false,'Permission denied SECRET_EDIT_CONTENT');
      const rows = when==='before-test'
        ? [editCall,editResult,testCall(),testPass(),claim(),event(31,{type:'turn_end'})]
        : [testCall(),testPass(),editCall,editResult,claim(),event(31,{type:'turn_end'})];
      const raw=encode(rows);
      const a=sourceParse(raw);
      const b=browserParse(raw);
      assert.equal(a.errorCode,'INCOMPLETE_RELEVANT_TOOL_EVIDENCE');
      assert.equal(a.input,null);
      assert.deepEqual(b,a);
      const summary=summarizeLocalSession(raw);
      assert.equal(summary.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
      assert.equal(summary.reason,'INCOMPLETE_RELEVANT_TOOL_EVIDENCE');
      assert.notEqual(summary.verdict,'CURRENT_SELF_RECORDED_TEST');
      assert.doesNotMatch(JSON.stringify(a)+JSON.stringify(summary),/SECRET_EDIT_CONTENT|Private|project\\src/);
    });
  }
}

test('M297 valid successful edit BEFORE passing test remains CURRENT',()=>{
  const rows=[call(10,'edit','fs_write',{filePath:'src/example.mjs'}),
    result(11,'edit',true,'Done'),testCall(),testPass(),claim(),event(31,{type:'turn_end'})];
  const raw=encode(rows);
  const parsed=sourceParse(raw);
  assert.equal(parsed.errorCode,null);
  assert.equal(auditLocalSession(parsed.input).status,'CURRENT_SELF_RECORDED_TEST');
  assert.equal(summarizeLocalSession(raw).verdict,'CURRENT_SELF_RECORDED_TEST');
});

test('M297 unsuccessful test operation does not get reclassified as failed source edit',()=>{
  const raw=encode([testCall(),result(21,'test',false,'Exit Code: 1'),claim(),event(31,{type:'turn_end'})]);
  assert.notEqual(sourceParse(raw).errorCode,'UNCONFIRMED_SOURCE_EDIT_OBSERVED');
  assert.equal(summarizeLocalSession(raw).verdict,'INSUFFICIENT_SESSION_EVIDENCE');
});

test('M297 early failed edit, then successful edit, then PASS still fail-closed',()=>{
  const raw=encode([
    call(1,'first','str_replace',{filePath:'src/foo.mjs'}),result(2,'first',false,'failed'),
    call(9,'second','str_replace',{filePath:'src/foo.mjs'}),result(10,'second',true,'done'),
    testCall(),testPass(),claim(),event(31,{type:'turn_end'})
  ]);
  assert.equal(sourceParse(raw).errorCode,'INCOMPLETE_RELEVANT_TOOL_EVIDENCE');
  assert.equal(summarizeLocalSession(raw).verdict,'INSUFFICIENT_SESSION_EVIDENCE');
});
