// Independent ChatGPT/WAG-authored wrapper acceptance tests; synthetic only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,mkdir,writeFile,rm,utimes,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const script=join(root,'scripts','kiro-freshness-witness-hook.mjs');
const store=join(tmpdir(),'specter-freshness-witness-local-v1');
const id=()=>randomUUID();
const statePath=session=>join(store,createHash('sha256').update(session).digest('hex')+'.json');
const lockPath=session=>join(store,createHash('sha256').update(session).digest('hex')+'.lock');
const cleanup=async session=>{
 await rm(statePath(session),{force:true});await rm(lockPath(session),{force:true});
};
function event(session,tool_name,tool_input={},tool_response={success:true}){
 return {hook_event_name:'postToolUse',session_id:session,tool_name,tool_input,tool_response};
}
function pass(session){
 return event(session,'execute_pwsh',{command:'npm test'},{success:true,content:'pass 8\nfail 0\nExit Code: 0'});
}
function edit(session){return event(session,'str_replace',{filePath:'C:\\Users\\PRIVATE_SENTINEL\\src\\a.mjs'},{success:true,content:'PRIVATE_SENTINEL'})}
function run(payload){
 const proc=spawnSync(process.execPath,[script],{cwd:root,input:typeof payload==='string'?payload:JSON.stringify(payload),
  encoding:'utf8',timeout:10000,maxBuffer:10000});
 assert.equal(proc.status,0,proc.stderr);
 assert.equal(proc.stderr,'');
 assert.doesNotMatch(proc.stdout,/PRIVATE_SENTINEL|C:\\Users|synthetic-secret|npm test|pass 8/);
 return proc.stdout.trim();
}
const check=(str,code)=>assert.match(str,new RegExp('^SPECTER FRESHNESS WITNESS: '+code+'\\.'));
test('stdin wrapper: PASS, subsequent edit, then test yields bounded statuses',async()=>{
 const session=id();
 try{
  check(run(pass(session)),'PASS_RECEIPT_OBSERVED');
  check(run(edit(session)),'RETEST_REQUIRED');
  check(run(pass(session)),'PASS_RECEIPT_OBSERVED');
  const data=await readFile(statePath(session),'utf8');
  assert.doesNotMatch(data,/PRIVATE_SENTINEL|C:\\Users|npm test|pass 8|session_id/);
  assert.ok(data.length<4096);
  assert.equal(JSON.parse(data).testCount,2);
 }finally{await cleanup(session)}
});
test('stdin wrapper: missing event, malformed JSON and large payload fail closed',()=>{
 for(const bad of ['not-json','null','{}','{','x'.repeat(66000)]){
  check(run(bad),'INSUFFICIENT_HOOK_EVIDENCE');
 }
});
test('stdin wrapper: successful read cannot invent PASS',async()=>{
 const session=id();try{check(run(event(session,'fs_read',{path:'PRIVATE_SENTINEL'},{success:true,content:'All 8 pass'})),'NO_PASS_RECEIPT')}finally{await cleanup(session)}
});
test('stdin wrapper: failed write after a pass is insufficient',async()=>{
 const session=id();try{
  check(run(pass(session)),'PASS_RECEIPT_OBSERVED');
  check(run(event(session,'str_replace',{}, {success:false,content:'PRIVATE_SENTINEL'})),'INSUFFICIENT_HOOK_EVIDENCE');
  check(run(pass(session)),'INSUFFICIENT_HOOK_EVIDENCE');
 }finally{await cleanup(session)}
});
test('stdin wrapper: unknown shell operation fails closed',async()=>{
 const session=id();try{check(run(event(session,'execute_pwsh',{command:'git checkout main'}, {success:true,content:'ok'})),'INSUFFICIENT_HOOK_EVIDENCE')}finally{await cleanup(session)}
});
test('stdin wrapper: two sessions cannot share state',async()=>{
 const one=id(),two=id();try{
  check(run(pass(one)),'PASS_RECEIPT_OBSERVED');
  check(run(edit(two)),'NO_PASS_RECEIPT');
  check(run(edit(one)),'RETEST_REQUIRED');
  check(run(pass(two)),'PASS_RECEIPT_OBSERVED');
 }finally{await cleanup(one);await cleanup(two)}
});
test('stdin wrapper: exclusive lock conflict cannot be overwritten',async()=>{
 const session=id();await mkdir(store,{recursive:true});const p=lockPath(session);
 try{
  await writeFile(p,'OWNED_BY_OTHER_PROCESS',{flag:'wx'});
  check(run(pass(session)),'INSUFFICIENT_HOOK_EVIDENCE');
  assert.equal(await readFile(p,'utf8'),'OWNED_BY_OTHER_PROCESS');
  await assert.rejects(readFile(statePath(session),'utf8'),/ENOENT/);
 }finally{await cleanup(session)}
});
test('stdin wrapper: corrupted persisted state cannot become PASS',async()=>{
 const session=id();await mkdir(store,{recursive:true});
 try{
  await writeFile(statePath(session),JSON.stringify({status:'PASS_RECEIPT_OBSERVED',secret:'PRIVATE_SENTINEL'}));
  check(run(pass(session)),'INSUFFICIENT_HOOK_EVIDENCE');
  assert.match(await readFile(statePath(session),'utf8'),/PRIVATE_SENTINEL/);
 }finally{await cleanup(session)}
});
test('stdin wrapper: expired state fails closed',async()=>{
 const session=id();
 try{
  check(run(pass(session)),'PASS_RECEIPT_OBSERVED');
  const old=new Date(Date.now()-3*86400000);
  await utimes(statePath(session),old,old);
  check(run(pass(session)),'INSUFFICIENT_HOOK_EVIDENCE');
 }finally{await cleanup(session)}
});
test('stdin wrapper: rejects invalid session identifiers and does not persist raw IDs',()=>{
 check(run(event('PRIVATE_SENTINEL /../', 'execute_pwsh',{command:'npm test'},{success:true,content:'pass 8\nfail 0\nExit Code: 0'})),'INSUFFICIENT_HOOK_EVIDENCE');
});
