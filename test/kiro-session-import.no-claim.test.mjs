import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
const at=n=>'2026-11-05T04:'+String(n).padStart(2,'0')+':00.000Z';
const item=(n,payload)=>({timestamp:at(n),payload});
const parse=items=>parseKiroSession(items.map(x=>JSON.stringify(x)).join('\n'));

test('no recognized claim exposes only bounded event and pairing counts, not tool content',()=>{
 const report=parse([
  item(0,{type:'user',content:'PRIVATE_NO_CLAIM_SENTINEL'}),
  item(1,{type:'tool_call',toolCallId:'t1',toolName:'execute_pwsh',args:{command:'node --test PRIVATE_NO_CLAIM_SENTINEL'}}),
  item(2,{type:'tool_result',toolCallId:'t1',success:true,content:'pass 8\nfail 0\nExit Code: 0\nPRIVATE_NO_CLAIM_SENTINEL'}),
  item(3,{type:'tool_call',toolCallId:'t2',toolName:'str_replace',filePath:'C:\\Users\\PRIVATE_NO_CLAIM_SENTINEL\\src\\main.mjs'}),
  item(4,{type:'turn_end'})
 ]);
 assert.equal(report.input,null);
 assert.equal(report.errorCode,'NO_RECORDED_AGENT_TEST_CLAIM');
 assert.equal(report.summary.sessionEvents,5);
 assert.equal(report.summary.observedToolCalls,2);
 assert.equal(report.summary.observedToolResults,1);
 assert.equal(report.summary.recognizedClaims,0);
 assert.doesNotMatch(JSON.stringify(report),/PRIVATE_NO_CLAIM_SENTINEL|C:\\Users|node --test/);
});
test('no claim cannot produce CURRENT or STALE irrespective of passing tool receipt',()=>{
 const report=parse([
  item(0,{type:'tool_call',toolCallId:'t1',toolName:'execute_pwsh',args:{command:'node --test'}}),
  item(1,{type:'tool_result',toolCallId:'t1',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  item(2,{type:'turn_end'})
 ]);
 assert.equal(report.input,null);
 assert.equal(report.errorCode,'NO_RECORDED_AGENT_TEST_CLAIM');
 assert.equal(report.summary.sessionEvents,3);
 assert.equal(report.summary.observedToolCalls,1);
 assert.equal(report.summary.observedToolResults,1);
});
test('malformed JSONL stays a hard error without invented summary counts',()=>{
 const report=parseKiroSession('{private\n');
 assert.equal(report.errorCode,'INVALID_JSONL');
 assert.equal(report.input,null);
 assert.equal(report.summary.observedToolCalls,undefined);
 assert.equal(report.summary.observedToolResults,undefined);
});
