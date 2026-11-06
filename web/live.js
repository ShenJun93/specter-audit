// M7 browser-only local Kiro JSONL inspector. No network, persistence or raw log rendering.
import {parseKiroSession} from '/kiro-session-import.mjs';
import {auditLocalSession} from '/kiro-session-staleness.mjs';
const $=id=>document.getElementById(id);
const fileInput=$('session-file'),analyzeButton=$('analyze-file');
const maxBytes=8*1024*1024;
const verdictNames={
 STALE_LOCAL_TEST_EVIDENCE:{
  label:'STALE LOCAL TEST EVIDENCE',
  headline:'The tests passed. Then the code changed.',
  reason:'A later successful source edit exists after the last observed passing test. No newer valid passing tool receipt was identified in this saved session.',
  css:''
 },
 CURRENT_SELF_RECORDED_TEST:{
  label:'CURRENT SELF-RECORDED TEST',
  headline:'The latest observed test follows the source edits.',
  reason:'Within this saved log, the last recorded passing test follows the observed edits. This is self-recorded local evidence, not a correctness guarantee.',
  css:'positive'
 },
 INSUFFICIENT_SESSION_EVIDENCE:{
  label:'INSUFFICIENT SESSION EVIDENCE',
  headline:'The alibi cannot be established from this file.',
  reason:'The required matching evidence is missing, failed, ambiguous or incomplete. Specter does not upgrade an uncertain claim to a pass.',
  css:'unknown'
 }
};
const errors={
 EXPECTED_TEXT_INPUT:'This input is not a text session.',
 FILE_SIZE_LIMIT:'This session exceeds the 8 MiB local safety limit.',
 LINE_COUNT_LIMIT:'The session has too many JSONL records (4,000 maximum).',
 LINE_SIZE_LIMIT:'One JSONL event exceeds the 2 MiB event limit.',
 EMPTY_SESSION:'The selected file has no Kiro session events.',
 INVALID_JSONL:'This file is not valid line-delimited JSON (JSONL).',
 INVALID_EVENT:'The selected file contains an invalid event.',
 INVALID_EVENT_TIMESTAMP:'An event timestamp is missing or invalid.',
 INVALID_PAYLOAD:'A session event has an invalid payload.',
 INVALID_TOOL_ID:'A session tool event has an invalid identifier.',
 DUPLICATE_TOOL_EVENT:'Conflicting or duplicate tool events prevent a reliable match.',
 MULTI_SESSION_FILE:'This file appears to contain more than one session.',
 NO_RECORDED_AGENT_TEST_CLAIM:'No supported agent test-passed claim was found in this saved session.',
 AMBIGUOUS_AGENT_CLAIMS:'Multiple claims have indistinguishable timestamps.',
 INVALID_CHRONOLOGY:'Event timestamps do not form a supported chronology.',
 TOO_MANY_RELEVANT_EVENTS:'Too many test or edit tool events to analyze safely.',
 RESULT_BEFORE_TOOL:'A result appears before its originating tool call.',
 RESULT_PRECEDES_TOOL_CALL_IN_FILE:'A tool result appears before its matching call in the saved file; chronology cannot be verified.',
 NON_MONOTONIC_TOOL_CHRONOLOGY:'Tool timestamps contradict their recorded order. This file cannot establish test freshness.',
 CLAIM_PRECEDES_TEST_RESULT_IN_FILE:'The agent claimed PASS before its supporting tool result appeared in the saved session.',
 NON_MONOTONIC_AGENT_CLAIM_CHRONOLOGY:'Agent PASS statements appear in a conflicting recorded order; their freshness cannot be established.',
 INCOMPLETE_RELEVANT_TOOL_EVIDENCE:'Some test or edit tool results are unmatched or unsupported.',
 CLAIM_TEST_COUNT_MISMATCH:'The agent claim count does not match the latest observed test report.',
 POST_CLAIM_TEST_EVIDENCE_UNRESOLVED:'A later test cannot confirm the earlier claim. The available evidence does not establish a current result.',
 OVERLAPPING_RELEVANT_TOOL_OPERATIONS:'A test overlaps a source edit or an uncertain tool operation. Its completion cannot prove which code was tested.',
 LATER_AGENT_TEST_CLAIM_RETRACTED:'A later agent message retracts the passing-test claim; the prior PASS cannot establish a current result.',
 CORRECTION_WITHOUT_NEW_TEST_RECEIPT:'A later claim follows a test correction without a fresh matching test result; current evidence is insufficient.',
 AMBIGUOUS_EVENT_TIMESTAMPS:'Multiple test or edit events share an ambiguous timestamp.'
};
function showError(text) {
 const label=$('live-error');
 label.textContent=text;
 label.hidden=false;
}
function clearError() {$('live-error').hidden=true;$('live-error').textContent=''}
const safeNextAction=Object.freeze({
 STALE_LOCAL_TEST_EVIDENCE:'Run the relevant tests after the final source edit. Re-import a complete saved Kiro session to check whether a newer recorded result exists. Test freshness is not code correctness.',
 CURRENT_SELF_RECORDED_TEST:'Review correctness separately and verify CI for the exact commit SHA. A self-recorded CURRENT result is not release approval.',
 INSUFFICIENT_SESSION_EVIDENCE:'Capture complete tool results and an explicit, genuine agent test claim in a new session. Never infer PASS from missing evidence.'
});
function status(kind) {
 const text=verdictNames[kind]??verdictNames.INSUFFICIENT_SESSION_EVIDENCE;
 const el=$('live-verdict-label');
 el.textContent=text.label;
 $('live-verdict-headline').textContent=text.headline;
 $('live-verdict-reason').textContent=text.reason;
 $('live-next-step-body').textContent=safeNextAction[kind]??safeNextAction.INSUFFICIENT_SESSION_EVIDENCE;
 $('live-verdict-label').parentElement.className='live-verdict '+text.css;
 $('next-copy-status').textContent='';
 $('copy-next-step').onclick=async()=>{
  // Fixed instructions only; never copy private logs, commands or paths.
  const instruction=safeNextAction[kind]??safeNextAction.INSUFFICIENT_SESSION_EVIDENCE;
  try{await navigator.clipboard.writeText(instruction);$('next-copy-status').textContent='Next step copied.'}
  catch{$('next-copy-status').textContent='Clipboard unavailable. No command was run.'}
 };
}
function showTimeline(parsed,verdict,lastPassMs) {
 const list=$('live-timeline');
 list.replaceChildren();
 const claim={kind:'claim',at:parsed.input.claimAt,pass:parsed.summary.claimedPassCount};
 const entries=[...verdict.timeline,claim].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 for(const e of entries.slice(0,121)){
  const li=document.createElement('li');
  li.dataset.kind=e.kind;
  if(e.kind==='edit'&&lastPassMs!==null&&Date.parse(e.at)>lastPassMs)li.dataset.phase='after-test';
  const strong=document.createElement('strong');
  let title='';
  if(e.kind==='test')title='Tool test result: '+e.pass+' pass / '+e.fail+' fail / exit '+e.exitCode;
  else if(e.kind==='edit')title=e.file.startsWith('redacted/')?'Source edit (private path withheld)':'Successful edit · '+e.file;
  else title='Agent asserted '+e.pass+' passing tests';
  strong.textContent=title;
  const time=document.createElement('time');
  time.dateTime=e.at;
  time.textContent=new Date(e.at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'medium',timeZone:'UTC'})+' UTC';
  li.append(strong,time);
  if(li.dataset.phase==='after-test'){
   const flag=document.createElement('span');flag.className='live-flag';flag.textContent='EDIT AFTER TEST';li.append(flag);
  }
  list.append(li);
 }
 const firstLate=list.querySelector('[data-phase="after-test"]');
 if(firstLate)list.scrollTop=Math.max(0,firstLate.offsetTop-list.offsetTop-100);
}
// Move keyboard and screen-reader focus to the newly rendered finding on narrow
// layouts. The desktop side-by-side workflow keeps its current position.
function exposeMobileFinding(){
 if(!window.matchMedia('(max-width:850px)').matches)return;
 const heading=$('results-heading');
 heading.focus({preventScroll:true});
 heading.scrollIntoView({block:'start',behavior:'instant'});
}
function analyzeText(raw,origin) {
 const parsed=parseKiroSession(raw);
 $('live-unverified').hidden=true;
 if(!parsed.input&&parsed.errorCode==='NO_RECORDED_AGENT_TEST_CLAIM'){
  const summary=parsed.summary??{};
  const counts=['sessionEvents','observedToolCalls','observedToolResults'];
  if(counts.every(k=>Number.isSafeInteger(summary[k])&&summary[k]>=0&&summary[k]<=4000)){
   clearError();
   $('result-provenance').textContent=origin==='synthetic'?'SYNTHETIC EXAMPLE':'YOUR LOCAL KIRO SESSION';
   $('live-empty').hidden=true;
   $('live-report').hidden=true;
   $('live-unverified').hidden=false;
   $('metric-unverified-events').textContent=String(summary.sessionEvents);
   $('metric-unverified-calls').textContent=String(summary.observedToolCalls);
   $('metric-unverified-results').textContent=String(summary.observedToolResults);
   exposeMobileFinding();
   return;
  }
 }
 if(!parsed.input) {
  showError(errors[parsed.errorCode]??'This session is unsupported or incomplete.');
  $('live-empty').hidden=false;
  $('live-report').hidden=true;
  $('result-provenance').textContent='NO VERIFIED LOCAL CHRONOLOGY';
  return;
 }
 const verdict=auditLocalSession(parsed.input);
 if(!verdict||!verdictNames[verdict.status]) {
  showError('The evidence engine returned an unsupported finding.');
  return;
 }
 clearError();
 $('result-provenance').textContent=origin==='synthetic'?'SYNTHETIC EXAMPLE':'YOUR LOCAL KIRO SESSION';
 $('live-empty').hidden=true;
 $('live-report').hidden=false;
 const lastPassMs=parsed.input.tests
   .filter(t=>t.pass>0&&t.fail===0&&t.exitCode===0&&Date.parse(t.at)<=Date.parse(parsed.input.claimAt))
   .reduce((n,t)=>Math.max(n,Date.parse(t.at)),-Infinity);
 const hasPass=Number.isFinite(lastPassMs);
 const laterEdits=hasPass?parsed.input.edits.filter(e=>e.successful&&Date.parse(e.at)>lastPassMs).length:null;
 $('metric-tests').textContent=String(parsed.summary.passingTests);
 $('metric-edits').textContent=laterEdits===null?'—':String(laterEdits);
 $('metric-total-edits').textContent=String(parsed.summary.sourceEdits)+' total observed edits';
 $('metric-redacted').textContent=String(parsed.summary.unclassifiedEdits);
 $('metric-claims').textContent=String(parsed.summary.recognizedClaims);
 status(verdict.status);
 showTimeline(parsed,verdict,hasPass?lastPassMs:null);
 $('copy-state').textContent='';
 const sanitized={
  source:origin==='synthetic'?'SYNTHETIC_EXAMPLE':'USER_SELECTED_LOCAL_SESSION',
  finding:verdict.status,
  scope:'ONE_SAVED_LOCAL_KIRO_SESSION_ONLY',
  observedPassingTests:parsed.summary.passingTests,
  observedSourceEdits:parsed.summary.sourceEdits,
  observedEditsAfterPass:laterEdits,
  redactedPaths:parsed.summary.unclassifiedEdits,
  independentlyAttested:false,semanticCorrectnessVerified:false,
  outsideFileEvidenceUnknown:true
 };
 $('copy-safe').onclick=async()=>{
  const info=JSON.stringify(sanitized,null,2);
  try{await navigator.clipboard.writeText(info);$('copy-state').textContent='Sanitized finding copied.'}
  catch{$('copy-state').textContent='Clipboard unavailable. No file was uploaded.'}
 };
 exposeMobileFinding();
}
const sample=(()=>{
 const at=(s)=>'2026-11-04T10:'+s+'.000Z';
 const line=(timestamp,payload)=>JSON.stringify({timestamp,payload});
 return [
  line(at('00:00'),{type:'tool_call',toolCallId:'demo-test',toolName:'execute_pwsh',args:{command:'node --test'}}),
  line(at('00:03'),{type:'tool_result',toolCallId:'demo-test',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  line(at('01:00'),{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
  line(at('02:00'),{type:'tool_call',toolCallId:'demo-edit',toolName:'str_replace',filePath:'C:\\work\\example\\src\\auth.mjs'}),
  line(at('02:01'),{type:'tool_result',toolCallId:'demo-edit',success:true,content:'success'}),
  line(at('02:30'),{type:'turn_end'})
 ].join('\n');
})();
// All three browser examples use genuine parser/auditor code, not hardcoded verdicts.
// Timestamps and tool content are synthetic and never presented as Kiro provenance.
const safeExampleTime=n=>'2026-11-04T11:'+String(n).padStart(2,'0')+':00.000Z';
const exampleEvent=(n,payload)=>JSON.stringify({timestamp:safeExampleTime(n),payload});
const currentExample=[
 exampleEvent(0,{type:'tool_call',toolCallId:'cur-edit',toolName:'str_replace',filePath:'src/demo.mjs'}),
 exampleEvent(1,{type:'tool_result',toolCallId:'cur-edit',success:true,content:'Done'}),
 exampleEvent(2,{type:'tool_call',toolCallId:'cur-test',toolName:'execute_pwsh',args:{command:'node --test'}}),
 exampleEvent(3,{type:'tool_result',toolCallId:'cur-test',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
 exampleEvent(4,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
 exampleEvent(5,{type:'turn_end'})
].join('\n');
const insufficientExample=[
 exampleEvent(0,{type:'tool_call',toolCallId:'missing-test',toolName:'execute_pwsh',args:{command:'node --test'}}),
 exampleEvent(1,{type:'tool_result',toolCallId:'missing-test',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
 exampleEvent(2,{type:'turn_end'})
].join('\n');
function showSyntheticExample(label,fixture){
 fileInput.value='';analyzeButton.disabled=true;
 $('file-selected').textContent=label+' · generated synthetic example';
 analyzeText(fixture,'synthetic');
}
$('try-sample').addEventListener('click',()=>showSyntheticExample('Stale',sample));
$('try-current').addEventListener('click',()=>showSyntheticExample('Current',currentExample));
$('try-insufficient').addEventListener('click',()=>showSyntheticExample('Insufficient',insufficientExample));
function selected(file){
 if(!file){analyzeButton.disabled=true;$('file-selected').textContent='No local file selected';return}
 if(file.size>maxBytes){
  analyzeButton.disabled=true;
  $('file-selected').textContent='File exceeds safe size limit';
  showError('The file exceeds 8 MiB. Nothing was read or transmitted.');
  return;
 }
 clearError();
 $('file-selected').textContent='One local session selected · '+(file.size/1024).toFixed(0)+' KiB';
 analyzeButton.disabled=false;
}
fileInput.addEventListener('change',()=>selected(fileInput.files[0]));
$('live-form').addEventListener('submit',async(event)=>{
 event.preventDefault();
 const file=fileInput.files[0];
 if(!file)return;
 analyzeButton.disabled=true;
 try{
  if(file.size>maxBytes)throw Error('SIZE');
  const raw=await file.text(); // not sent to any server or persisted
  fileInput.value='';
  $('file-selected').textContent='Analyzed locally · file handle cleared';
  analyzeText(raw,'user');
 }catch{
  showError('Unable to read the selected local session safely.');
 }finally{analyzeButton.disabled=true}
});
const drop=$('drop-target');
drop.addEventListener('dragover',event=>{event.preventDefault();drop.classList.add('drag-over')});
drop.addEventListener('dragleave',()=>drop.classList.remove('drag-over'));
drop.addEventListener('drop',async event=>{
 event.preventDefault();drop.classList.remove('drag-over');
 const file=event.dataTransfer?.files?.[0];
 if(!file)return;
 selected(file);
 if(file.size>maxBytes)return;
 analyzeButton.disabled=true;
 try{
  const raw=await file.text();
  $('file-selected').textContent='Dropped file analyzed locally';
  fileInput.value='';
  analyzeText(raw,'user');
 }catch{showError('Unable to read the dropped session safely.')}
});
