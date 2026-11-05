import test from 'node:test';
import assert from 'node:assert/strict';
import {parseKiroSession} from '../src/kiro-session-import.mjs';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';
const at=t=>'2026-11-04T10:'+t+'.000Z';
const event=(timestamp,payload)=>({timestamp,payload});
function data(){
 return [
  event(at('00:00'),{type:'tool_call',toolCallId:'tc1',toolName:'execute_pwsh',args:{command:'node --test'}}),
  event(at('00:03'),{type:'tool_result',toolCallId:'tc1',content:'pass 8\nfail 0\nExit Code: 0',success:true}),
  event(at('01:00'),{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
  event(at('02:00'),{type:'tool_call',toolCallId:'edit1',toolName:'str_replace',filePath:'C:\\Users\\PACMAP\\project\\src\\auth.mjs'}),
  event(at('02:03'),{type:'tool_result',toolCallId:'edit1',content:'Done',success:true}),
  event(at('03:00'),{type:'turn_end'})
 ];
}
const text=events=>events.map(e=>JSON.stringify(e)).join('\n')+'\n';
const verdict=r=>r.input?auditLocalSession(r.input).status:null;
test('working authentic-shaped Kiro transcript returns stale evidence',()=>{
 const r=parseKiroSession(text(data()));
 assert.equal(r.errorCode,null);
 assert.equal(verdict(r),'STALE_LOCAL_TEST_EVIDENCE');
 assert.equal(r.summary.claimedPassCount,8);
 assert.equal(r.input.tests[0].exitCode,0);
 assert.equal(r.input.edits[0].file,'src/auth.mjs');
});
test('no raw prompts, commands, session IDs, absolute paths or source contents in result',()=>{
 const e=data();
 e.push(event(at('03:05'),{type:'user',content:'SECRET_MARKER_1 password test github_pat_123456'}));
 const result=JSON.stringify(parseKiroSession(text(e)));
 assert.doesNotMatch(result,/PACMAP|SECRET_MARKER_1|github_pat_|C:\\|node --test|password test/);
});
test('missing claim must not produce a verdict',()=>{
 const e=data().filter(x=>x.payload?.operationType!=='Say');
 const r=parseKiroSession(text(e));assert.equal(r.input,null);
 assert.equal(r.errorCode,'NO_RECORDED_AGENT_TEST_CLAIM');
});
test('claim alone cannot manufacture passing tool evidence',()=>{
 const r=parseKiroSession(text([event(at('01:00'),{type:'assistant',operationType:'Say',content:'All 8 tests pass.'})]));
 assert.equal(verdict(r),'INSUFFICIENT_SESSION_EVIDENCE');
});
test('echo and grep mentioning node --test do not count as executed tests',()=>{
 for(const command of ["echo 'node --test'","Write-Host 'node --test'","rg 'node --test'"]){
  const e=data();e[0].payload.args.command=command;
  const r=parseKiroSession(text(e));assert.equal(verdict(r),'INSUFFICIENT_SESSION_EVIDENCE');
 }
});
test('failed write tool is not a proven edit but cannot falsely establish CURRENT',()=>{
 const e=data();e[4].payload.success=false;
 const r=parseKiroSession(text(e));
 assert.equal(r.summary.sourceEdits,0);
 assert.equal(r.errorCode,'INCOMPLETE_RELEVANT_TOOL_EVIDENCE');
 assert.equal(r.input,null);
});
test('explicit failed test tool cannot count as pass',()=>{
 const e=data();e[1].payload.success=false;
 const r=parseKiroSession(text(e));
 assert.notEqual(verdict(r),'CURRENT_SELF_RECORDED_TEST');
 if(r.input)assert.equal(verdict(r),'INSUFFICIENT_SESSION_EVIDENCE');
});
test('later failing test is not hidden by earlier pass',()=>{
 const e=data();
 e.splice(2,0,event(at('00:30'),{type:'tool_call',toolCallId:'tc2',toolName:'execute_pwsh',args:{command:'npm test'}}),
  event(at('00:35'),{type:'tool_result',toolCallId:'tc2',content:'pass 7\nfail 1\nExit Code: 1',success:true}));
 const r=parseKiroSession(text(e));assert.equal(r.errorCode,'CLAIM_TEST_COUNT_MISMATCH');
});
test('unmatched successful edit call fails closed',()=>{
 const e=data().filter(x=>x.payload?.toolCallId!=='edit1'||x.payload.type==='tool_call');
 const r=parseKiroSession(text(e));assert.equal(r.input,null);assert.equal(r.errorCode,'INCOMPLETE_RELEVANT_TOOL_EVIDENCE');
});
test('unrecognized source path is withheld but edit still counts',()=>{
 const e=data();e[3].payload.filePath='C:\\Users\\someone\\private-secret-config.json';
 const r=parseKiroSession(text(e));assert.equal(r.summary.unclassifiedEdits,1);
 assert.equal(r.input.edits[0].file,'redacted/edited-file-1');
 assert.equal(verdict(r),'STALE_LOCAL_TEST_EVIDENCE');
 assert.doesNotMatch(JSON.stringify(r),/private-secret-config|someone/);
});
test('duplicate tool result cannot be used as evidence',()=>{
 const e=data();e.push({...e[1],timestamp:at('03:01')});
 const r=parseKiroSession(text(e));assert.equal(r.errorCode,'DUPLICATE_TOOL_EVENT');
});
test('different invalid top-level event types are rejected',()=>{
 const e=data();e[2]=null;
 assert.equal(parseKiroSession(text(e)).errorCode,'INVALID_EVENT');
});
test('malformed JSONL and empty text are rejected safely',()=>{
 assert.equal(parseKiroSession('{bad json').errorCode,'INVALID_JSONL');
 assert.equal(parseKiroSession('  \n').errorCode,'EMPTY_SESSION');
 assert.equal(parseKiroSession(null).errorCode,'EXPECTED_TEXT_INPUT');
});
test('file size and line limits are fail closed',()=>{
 assert.equal(parseKiroSession('x'.repeat(8*1024*1024+1)).errorCode,'FILE_SIZE_LIMIT');
 const e=event(at('00:00'),{type:'turn_end'});
 assert.equal(parseKiroSession(Array(4001).fill(JSON.stringify(e)).join('\n')).errorCode,'LINE_COUNT_LIMIT');
});
test('a single extremely long record fails before parsing sensitive content',()=>{
 assert.equal(parseKiroSession('x'.repeat(2*1024*1024+1)).errorCode,'LINE_SIZE_LIMIT');
});
test('latest test and edit evaluation is timestamp-based not input-order-based',()=>{
 const e=data();
 e.splice(2,0,
 event(at('00:25'),{type:'tool_call',toolCallId:'tc2',toolName:'execute_pwsh',args:{command:'npm test'}}),
 event(at('00:27'),{type:'tool_result',toolCallId:'tc2',content:'pass 8\nfail 0\nExit Code: 0',success:true}));
 const r=parseKiroSession(text(e));assert.equal(verdict(r),'STALE_LOCAL_TEST_EVIDENCE');
});
test('multiple sessionId values reject conflated logs',()=>{
 const e=data();e[0].sessionId='session-A';e[1].sessionId='session-B';
 assert.equal(parseKiroSession(text(e)).errorCode,'MULTI_SESSION_FILE');
});
test('multiple recognized claims choose newest timestamp and never expose claim prose',()=>{
 const e=data();
 e.push(event(at('02:50'),{type:'assistant',operationType:'Say',content:'All 8 tests passed!'}));
 e.push(event(at('02:55'),{type:'user',content:'Secret message.'}));
 const r=parseKiroSession(text(e));
 assert.equal(r.summary.recognizedClaims,2);
 assert.equal(r.input.claimAt,at('02:50'));
 assert.doesNotMatch(JSON.stringify(r),/Secret message/);
});
test('same-timestamp testing calls fail closed',()=>{
 const e=data();
 e.push(event(at('00:00'),{type:'tool_call',toolCallId:'tc2',toolName:'execute_pwsh',args:{command:'node --test'}}),
 event(at('00:03'),{type:'tool_result',toolCallId:'tc2',content:'pass 8\nfail 0\nExit Code: 0',success:true}));
 assert.equal(parseKiroSession(text(e)).errorCode,'AMBIGUOUS_EVENT_TIMESTAMPS');
});
