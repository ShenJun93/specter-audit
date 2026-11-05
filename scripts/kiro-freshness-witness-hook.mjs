#!/usr/bin/env node
// M9 Kiro V3 PostToolUse advisory — ChatGPT/WAG-authored.
// Processes bounded session metadata only; never runs user-supplied commands.
// Not enabled on live Kiro sessions until the actual V3 stdin schema is verified.
import {createHash,randomBytes} from 'node:crypto';
import {readFile,writeFile,mkdir,open,rename,rm,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createInitialWitnessState,reduceWitnessEvent,summarizeWitness,validateWitnessState} from '../src/freshness-witness.mjs';

const INPUT_MAX=65536,STATE_MAX=4096,TTL_MS=24*60*60*1000;
const ROOT=join(tmpdir(),'specter-freshness-witness-local-v1');
const UNKNOWN='INSUFFICIENT_HOOK_EVIDENCE';
const ADVICE=Object.freeze({
 NO_PASS_RECEIPT:'No isolated passing test receipt has been observed by this hook.',
 PASS_RECEIPT_OBSERVED:'Passing receipt observed (self-recorded only). Correctness and tested source version are not verified.',
 RETEST_REQUIRED:'Source changed after a passing receipt. Rerun relevant tests after the final edit.',
 INSUFFICIENT_HOOK_EVIDENCE:'Insufficient local hook evidence. Inspect the saved session and run relevant tests after edits.'
});
function emit(code){
 const safe=Object.hasOwn(ADVICE,code)?code:UNKNOWN;
 process.stdout.write('SPECTER FRESHNESS WITNESS: '+safe+'. '+ADVICE[safe]+'\n');
}
async function readStdin(){
 const chunks=[];let length=0;
 for await(const chunk of process.stdin){
  length+=chunk.length;
  if(length>INPUT_MAX)throw Error('OVERSIZE');
  chunks.push(chunk);
 }
 const event=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(!event||typeof event!=='object'||Array.isArray(event))throw Error('NOT_OBJECT');
 return event;
}
async function run(){
 let event;
 try{event=await readStdin()}catch{emit(UNKNOWN);return}
 const session=event.session_id;
 if(typeof session!=='string'||!/^[a-zA-Z0-9_-]{8,128}$/.test(session)){
  emit(UNKNOWN);return;
 }
 const digest=createHash('sha256').update(session,'utf8').digest('hex');
 const file=join(ROOT,digest+'.json'),lock=join(ROOT,digest+'.lock');
 let tmp=null,lockOwned=false,handle=null;
 try{
  await mkdir(ROOT,{recursive:true,mode:0o700});
  // Exclusive lock: an existing lock is not bypassed or removed.
  handle=await open(lock,'wx',0o600);
  lockOwned=true;
  await handle.close();handle=null;
  let state=createInitialWitnessState();
  try{
   const info=await lstat(file);
   if(!info.isFile()||info.isSymbolicLink()||info.size>STATE_MAX||
      Date.now()-info.mtimeMs>TTL_MS){emit(UNKNOWN);return}
   const data=await readFile(file,'utf8');
   state=JSON.parse(data);
   if(!validateWitnessState(state)){emit(UNKNOWN);return}
  }catch(e){if(e?.code!=='ENOENT'){emit(UNKNOWN);return}}
  const result=reduceWitnessEvent(state,event);
  if(!validateWitnessState(result.state)){emit(UNKNOWN);return}
  const data=JSON.stringify(result.state);
  if(Buffer.byteLength(data,'utf8')>STATE_MAX){emit(UNKNOWN);return}
  tmp=join(ROOT,digest+'.'+randomBytes(8).toString('hex')+'.tmp');
  await writeFile(tmp,data,{flag:'wx',mode:0o600});
  await rename(tmp,file);
  tmp=null;
  emit(summarizeWitness(result.state).code);
 }catch{emit(UNKNOWN)}
 finally{
  if(handle){try{await handle.close()}catch{}}
  if(tmp){try{await rm(tmp,{force:true})}catch{}}
  if(lockOwned){try{await rm(lock,{force:true})}catch{}}
 }
}
await run();
