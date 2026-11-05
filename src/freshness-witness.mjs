// M9 Freshness Witness — local, self-recorded advisory only.
// Authored with ChatGPT/WAG after Kiro CLI reached its usage limit.
// The session log importer remains authoritative for event chronology.
const SCHEMA='SPECTER_FRESHNESS_WITNESS_V1';
const MAX_EVENTS=100000;
const STATUSES=new Set(['NO_PASS_RECEIPT','PASS_RECEIPT_OBSERVED','RETEST_REQUIRED','INSUFFICIENT_HOOK_EVIDENCE']);
const MESSAGES=Object.freeze({
 NO_PASS_RECEIPT:'No isolated passing test receipt has been observed by this hook.',
 PASS_RECEIPT_OBSERVED:'A passing receipt was observed after the last recorded edit. Self-recorded tool evidence only; source version and correctness are not verified.',
 RETEST_REQUIRED:'A source edit was observed after a passing test receipt. Rerun relevant tests after the final edit.',
 INSUFFICIENT_HOOK_EVIDENCE:'Hook tool evidence is missing, ambiguous, unsupported or failed. No current test result can be inferred.'
});
const READ_TOOLS=new Set(['fs_read','read_file','list_directory','grep_search','file_search']);
const EDIT_TOOLS=new Set(['fs_write','fs_append','str_replace','delete_file']);
const SHELL_TOOLS=new Set(['execute_pwsh','execute_bash']);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const count=x=>Number.isSafeInteger(x)&&x>=0&&x<=MAX_EVENTS;
const order=x=>x===null||count(x);
const safeState=s=>record(s)&&s.schema===SCHEMA&&
 STATUSES.has(s.status)&&count(s.eventCount)&&count(s.testCount)&&count(s.editCount)&&
 order(s.lastPassOrder)&&order(s.lastEditOrder)&&typeof s.uncertain==='boolean'&&
 Object.keys(s).length===8&&
 (s.testCount===0)===(s.lastPassOrder===null)&&
 (s.editCount===0)===(s.lastEditOrder===null)&&
 (s.status!=='PASS_RECEIPT_OBSERVED'||(s.testCount>0&&!s.uncertain&&
   (s.lastEditOrder===null||s.lastPassOrder>s.lastEditOrder)))&&
 (s.status!=='RETEST_REQUIRED'||(s.testCount>0&&s.editCount>0&&!s.uncertain&&
   s.lastEditOrder>s.lastPassOrder))&&
 (s.status!=='NO_PASS_RECEIPT'||(s.testCount===0&&!s.uncertain))&&
 (s.status!=='INSUFFICIENT_HOOK_EVIDENCE'||s.uncertain)&&
 s.testCount<=s.eventCount&&s.editCount<=s.eventCount&&
 (s.lastPassOrder===null||s.lastPassOrder<=s.eventCount)&&
 (s.lastEditOrder===null||s.lastEditOrder<=s.eventCount)&&
 (s.uncertain===true||s.status!=='INSUFFICIENT_HOOK_EVIDENCE');
function badState(){
 return {...createInitialWitnessState(),status:'INSUFFICIENT_HOOK_EVIDENCE',uncertain:true};
}
export function createInitialWitnessState(){
 return {schema:SCHEMA,status:'NO_PASS_RECEIPT',eventCount:0,testCount:0,editCount:0,
  lastPassOrder:null,lastEditOrder:null,uncertain:false};
}
export function validateWitnessState(state){return safeState(state)}
export function summarizeWitness(state){
 const s=safeState(state)?state:badState(),code=s.status;
 return {code,message:MESSAGES[code],independentAttestation:false,
  semanticCorrectnessVerified:false};
}
const parseOne=(content,name)=>{
 const re=new RegExp('^\\s*(?:[#ℹ]\\s*)?'+name+'\\s+(\\d+)\\s*$','gmi');
 const matches=[...content.matchAll(re)];
 return matches.length===1?Number(matches[0][1]):null;
};
function passing(content){
 if(typeof content!=='string'||content.length>32768)return false;
 const pass=parseOne(content,'pass');
 const fail=parseOne(content,'fail');
 const exit=[...content.matchAll(/^\s*Exit Code:\s*(\d+)\s*$/gmi)];
 return count(pass)&&pass>0&&fail===0&&exit.length===1&&Number(exit[0][1])===0;
}
function isolatedTest(command){
 if(typeof command!=='string'||command.length>256)return false;
 // No shell interpolation, command chaining, redirection, pipelines or wrapper.
 return /^(?:npm(?:\.cmd)?\s+test|node(?:\.exe)?\s+--test)(?:\s+--test-reporter=(?:spec|tap|dot))?$/i.test(command.trim());
}
function validInput(event){
 try{
  if(!record(event)||!record(event.tool_input)||!record(event.tool_response)||
    typeof event.hook_event_name!=='string'||event.hook_event_name.toLowerCase()!=='posttooluse'||
    typeof event.tool_name!=='string'||event.tool_name.length>100||
    typeof event.session_id!=='string'||!/^[a-zA-Z0-9_-]{8,128}$/.test(event.session_id))return false;
  const serialized=JSON.stringify(event);
  return typeof serialized==='string'&&Buffer.byteLength(serialized,'utf8')<=65536;
 }catch{return false}
}
export function reduceWitnessEvent(state,event){
 if(!safeState(state)||state.eventCount>=MAX_EVENTS||!validInput(event)){
  const s=badState();return {state:s,advice:summarizeWitness(s)};
 }
 const next={...state,eventCount:state.eventCount+1};
 const uncertain=()=>{next.uncertain=true;next.status='INSUFFICIENT_HOOK_EVIDENCE'};
 const type=event.tool_name;
 if(READ_TOOLS.has(type)){
  if(event.tool_response.success!==true)uncertain();
 }else if(EDIT_TOOLS.has(type)){
  if(event.tool_response.success!==true)uncertain();
  else{
   next.editCount++;
   next.lastEditOrder=next.eventCount;
   if(!next.uncertain)next.status=next.lastPassOrder!==null?'RETEST_REQUIRED':'NO_PASS_RECEIPT';
  }
 }else if(SHELL_TOOLS.has(type)){
  if(event.tool_response.success!==true||
     !isolatedTest(event.tool_input.command)||
     !passing(event.tool_response.content))uncertain();
  else{
   next.testCount++;
   next.lastPassOrder=next.eventCount;
   if(!next.uncertain)next.status='PASS_RECEIPT_OBSERVED';
  }
 }else uncertain();
 // A previously unknown / partially failed operation is not cleared by
 // a later success merely because the hook saw a completion event.
 if(next.uncertain)next.status='INSUFFICIENT_HOOK_EVIDENCE';
 return {state:next,advice:summarizeWitness(next)};
}
