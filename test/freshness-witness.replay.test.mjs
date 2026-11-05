import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createInitialWitnessState,reduceWitnessEvent,summarizeWitness} from '../src/freshness-witness.mjs';

const sid='synthetic-unique-session-id';
const pass=(id)=>({
 hook_event_name:'PostToolUse',session_id:sid,tool_name:'execute_pwsh',
 tool_use_id:id,tool_input:{command:'npm test'},
 tool_response:{success:true,content:'pass 8\nfail 0\nExit Code: 0'}
});
const edit=(id)=>({
 hook_event_name:'PostToolUse',session_id:sid,tool_name:'str_replace',
 tool_use_id:id,tool_input:{filePath:'C:\\PRIVATE_SENTINEL\\a.mjs'},
 tool_response:{success:true,content:'Done'}
});
const reduce=(state,e)=>reduceWitnessEvent(state,e).state;
test('replaying a known passing tool result after source edits must never erase RETEST_REQUIRED',()=>{
 let state=createInitialWitnessState();
 state=reduce(state,pass('test-001'));
 assert.equal(summarizeWitness(state).code,'PASS_RECEIPT_OBSERVED');
 state=reduce(state,edit('edit-001'));
 assert.equal(summarizeWitness(state).code,'RETEST_REQUIRED');
 state=reduce(state,pass('test-001'));
 assert.equal(summarizeWitness(state).code,'INSUFFICIENT_HOOK_EVIDENCE');
});
test('a truly new identified test after an edit retains bounded PASS_RECEIPT_OBSERVED advisory',()=>{
 let state=createInitialWitnessState();
 state=reduce(state,pass('test-001'));
 state=reduce(state,edit('edit-001'));
 state=reduce(state,pass('test-002'));
 assert.equal(summarizeWitness(state).code,'PASS_RECEIPT_OBSERVED');
 assert.doesNotMatch(JSON.stringify(state),/test-001|test-002|edit-001|PRIVATE_SENTINEL/);
});
test('replayed source edit identifier cannot create a fresh event observation',()=>{
 let state=createInitialWitnessState();
 state=reduce(state,edit('edit-001'));
 state=reduce(state,pass('test-001'));
 state=reduce(state,edit('edit-001'));
 assert.equal(summarizeWitness(state).code,'INSUFFICIENT_HOOK_EVIDENCE');
});
test('subprocess persisted state rejects repeated passing tool id after a later edit',async()=>{
 const session=randomUUID();
 const dir=join(tmpdir(),'specter-freshness-witness-local-v1');
 const digest=createHash('sha256').update(session,'utf8').digest('hex');
 const statePath=join(dir,digest+'.json'),lockPath=join(dir,digest+'.lock');
 const script=resolve(import.meta.dirname,'../scripts/kiro-freshness-witness-hook.mjs');
 const invoke=(obj)=>{
  const result=spawnSync(process.execPath,[script],{
   input:JSON.stringify({...obj,session_id:session}),
   encoding:'utf8',timeout:10000,maxBuffer:10000
  });
  assert.equal(result.status,0,result.stderr);
  assert.equal(result.stderr,'');
  return result.stdout;
 };
 try{
  assert.match(invoke(pass('known-pass-001')),/PASS_RECEIPT_OBSERVED/);
  assert.match(invoke(edit('known-edit-001')),/RETEST_REQUIRED/);
  assert.match(invoke(pass('known-pass-001')),/INSUFFICIENT_HOOK_EVIDENCE/);
  const saved=await readFile(statePath,'utf8');
  assert.doesNotMatch(saved,/known-pass-001|known-edit-001|PRIVATE_SENTINEL/);
  assert.ok(Buffer.byteLength(saved)<4096);
 }finally{
  await rm(statePath,{force:true});
  await rm(lockPath,{force:true});
 }
});
test('malformed conflicting tool identities fail closed, and recent hashes remain bounded',()=>{
 let state=createInitialWitnessState();
 for(let i=0;i<23;i++){
  state=reduce(state,{hook_event_name:'PostToolUse',session_id:sid,
   tool_name:'fs_read',tool_use_id:'read-'+i,tool_input:{},tool_response:{success:true}});
 }
 assert.equal(state.recentIds.length,16);
 assert.equal(new Set(state.recentIds).size,16);
 const conflicting={...pass('pass-001'),tool_call_id:'different-002'};
 state=reduce(state,conflicting);
 assert.equal(summarizeWitness(state).code,'INSUFFICIENT_HOOK_EVIDENCE');
 assert.doesNotMatch(JSON.stringify(state),/read-0|pass-001|different-002/);
});
