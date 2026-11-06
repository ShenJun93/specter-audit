import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';
const root=resolve(import.meta.dirname,'..');
const at=n=>'2026-11-04T11:'+String(n).padStart(2,'0')+':00.000Z';
const row=(n,payload)=>JSON.stringify({timestamp:at(n),payload});
const inspect=e=>{const parsed=parseKiroSession(e.join('\n'));return {parsed,verdict:parsed.input?auditLocalSession(parsed.input).status:null}};
test('synthetic CURRENT is only self-recorded, and follows the edit',()=>{
 const {parsed,verdict}=inspect([
  row(0,{type:'tool_call',toolCallId:'edit',toolName:'str_replace',filePath:'src/demo.mjs'}),
  row(1,{type:'tool_result',toolCallId:'edit',success:true,content:'Done'}),
  row(2,{type:'tool_call',toolCallId:'test',toolName:'execute_pwsh',args:{command:'node --test'}}),
  row(3,{type:'tool_result',toolCallId:'test',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  row(4,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
  row(5,{type:'turn_end'})
 ]);
 assert.equal(parsed.errorCode,null);
 assert.equal(verdict,'CURRENT_SELF_RECORDED_TEST');
});
test('synthetic no-claim never becomes CURRENT or STALE despite passing tool receipt',()=>{
 const {parsed,verdict}=inspect([
  row(0,{type:'tool_call',toolCallId:'test',toolName:'execute_pwsh',args:{command:'node --test'}}),
  row(1,{type:'tool_result',toolCallId:'test',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  row(2,{type:'turn_end'})
 ]);
 assert.equal(verdict,null);
 assert.equal(parsed.errorCode,'NO_RECORDED_AGENT_TEST_CLAIM');
 assert.equal(parsed.summary.observedTests,undefined);
});
test('browser case controls are explicit and not fake status toggles',async()=>{
 const [html,js,css]=await Promise.all(['web/live.html','web/live.js','web/live.css'].map(p=>readFile(resolve(root,p),'utf8')));
 for(const id of ['try-sample','try-current','try-insufficient','live-next-step-body'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(js.includes("analyzeText(fixture,'synthetic')"));
 assert.ok(js.includes('const currentExample=['));
 assert.ok(js.includes('const insufficientExample=['));
 assert.ok(css.includes('.live-next-step'));
 assert.doesNotMatch(js,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|WebSocket/);
});
