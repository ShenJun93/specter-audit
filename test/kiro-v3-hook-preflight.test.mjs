import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {evaluateHandler,SYNTHETIC_CASES} from '../scripts/kiro-v3-hook-preflight.mjs';

const candidate=[
 'let s="";process.stdin.setEncoding("utf8");',
 'process.stdin.on("data",c=>s+=c);',
 'process.stdin.on("end",()=>{try{if(s.length>8192)return;',
 'const e=JSON.parse(s);if(e.hook_event_name!=="PostFileSave"||typeof e.file_path!=="string")return;',
 'const p=e.file_path.replaceAll("\\\\","/");',
 'if(/^src\\/(?:[A-Za-z0-9_-]+\\/)*[A-Za-z0-9_-]+\\.(?:js|mjs|ts|tsx)$/.test(p))',
 'console.log("SPECTER SOURCE CHANGE: earlier PASS may not cover this source state. Rerun tests.");',
 '}catch{}});'
].join('\n');
async function fixture(script){
 const dir=await mkdtemp(join(tmpdir(),'specter-hook-contract-'));
 const file=join(dir,'mock.mjs');await writeFile(file,script);
 return {file,cleanup:()=>rm(dir,{recursive:true,force:true})};
}
test('fixture coverage is broad and explicitly synthetic',()=>{
 assert.ok(SYNTHETIC_CASES.length>=18);
 assert.ok(SYNTHETIC_CASES.some(x=>x.name==='win-separator'));
 assert.ok(SYNTHETIC_CASES.some(x=>x.name==='relative-traversal'));
});
test('missing Kiro-authored handler is BLOCKED, not PASS',async()=>{
 const r=await evaluateHandler('');
 assert.equal(r.status,'BLOCKED_NO_HANDLER');
 assert.equal(r.liveKiroVerified,false);
});
test('contract checks pass on a local MOCK without claiming Kiro provenance',async()=>{
 const f=await fixture(candidate);try{
 const r=await evaluateHandler(f.file);
 assert.equal(r.status,'SYNTHETIC_CONTRACT_PASS_ONLY',JSON.stringify(r.failed));
 assert.equal(r.passed,18);assert.equal(r.liveKiroVerified,false);
 assert.equal(r.schemaVerified,false);assert.equal(r.networkIsolationVerified,false);
 }finally{await f.cleanup()}
});
for(const [label,code,expected] of [
 ['wrong warning','process.stdin.on("end",()=>console.log("SPECTER SOURCE CHANGE: wrong"));process.stdin.resume();','FALSE_SOURCE_WARNING'],
 ['invented PASS','process.stdin.on("end",()=>console.log("ALL_TESTS_PASS"));process.stdin.resume();','UNSUPPORTED_ATTESTATION'],
 ['private leak','process.stdin.on("end",()=>console.log("CANARY_PRIVATE_KEY_123"));process.stdin.resume();','SENSITIVE_OUTPUT'],
 ['oversized output','process.stdin.on("end",()=>console.log("x".repeat(1000)));process.stdin.resume();','OUTPUT_TOO_LONG'],
 ['nonzero exit','process.stdin.on("end",()=>process.exit(4));process.stdin.resume();','NONZERO_EXIT']
]){
 test('rejects '+label,async()=>{
 const f=await fixture(code);try{
 const r=await evaluateHandler(f.file,{cases:[SYNTHETIC_CASES[4]]});
 assert.equal(r.status,'SYNTHETIC_CONTRACT_FAIL');
 assert.equal(r.failed[0].reason,expected);
 }finally{await f.cleanup()}
 });
}
test('timeout kills stalled handler',async()=>{
 const f=await fixture('setInterval(()=>{},10000);');try{
 const r=await evaluateHandler(f.file,{timeoutMs:350,cases:[SYNTHETIC_CASES[0]]});
 assert.equal(r.failed[0].reason,'TIMEOUT');
 }finally{await f.cleanup()}
});
test('invalid timeout is rejected without executing',async()=>{
 const f=await fixture(candidate);try{
 const r=await evaluateHandler(f.file,{timeoutMs:30000});
 assert.equal(r.status,'INVALID_CONFIGURATION');
 }finally{await f.cleanup()}
});
