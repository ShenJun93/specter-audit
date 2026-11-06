// M10 Evidence Trial UI. Imported local JSONL is parsed entirely in the browser.
// No raw session data, filenames, paths, prompts or commands are sent to GitHub.
import {summarizeLocalSession,combineTrial,syntheticTrial} from './evidence-trial.mjs';
const $=id=>document.getElementById(id);
const file=$('trial-file'),analyze=$('trial-analyze'),notice=$('trial-notice');
const maxSize=8*1024*1024;
let local=null,provider=null,sessionEpoch=0;
const localText={
 STALE_LOCAL_TEST_EVIDENCE:['STALE RECEIPT','A passing test preceded a successful source edit in this saved chronology. Retest the final source state.'],
 CURRENT_SELF_RECORDED_TEST:['SELF-RECORDED CURRENT','The latest passing test followed observed edits in the saved log. This remains editable, self-recorded evidence.'],
 INSUFFICIENT_SESSION_EVIDENCE:['SESSION UNKNOWN','Missing or unsupported local chronology cannot establish a current test result.']
};
const nextText={
 INVESTIGATE_FAILED_PR_WORKFLOWS:'At least one exact-SHA workflow failed. Inspect its provider receipt, resolve the failure and rerun; separately verify any stale local test.',
 WAIT_FOR_PR_WORKFLOWS:'At least one exact-SHA workflow is still running. Wait for a completed result and inspect again; other required checks remain unverified.',
 REQUIRE_SUCCESSFUL_EXACT_SHA_CI:'The observed exact-SHA workflows include non-passing results. Review skipped or neutral runs and obtain a valid successful run before relying on CI.',
 REVIEW_UNOBSERVED_CI_RUNS:'Only a truncated sample of exact-SHA workflows was observed. Inspect the remaining provider history and required checks before deciding.',
 RETEST_AFTER_FINAL_EDIT:'Run relevant tests after the last source edit, then inspect the new receipt. Independently verify commit identity.',
 VERIFY_COMMIT_BINDING_AND_REQUIRED_CHECKS:'The saved session reports a current test, but no evidence links it to the PR HEAD. Verify the actual commit and required CI checks.',
 OBTAIN_COMPLETE_TEST_RECEIPT:'Obtain a complete, genuine test receipt and supported chronology. Unknown evidence is not a PASS.',
 INSPECT_LOCAL_KIRO_TEST_CHRONOLOGY:'GitHub metadata alone does not prove what the AI agent tested. Inspect the local session chronology.',
 GATHER_BOTH_EVIDENCE_SOURCES:'Inspect the public PR above, then select a Kiro session or run a clearly labeled synthetic demonstration.'
};
function render(){
 const hearing=combineTrial(local,provider);
 const localStage=hearing.session;
 const copy=localStage?localText[localStage.status]??localText.INSUFFICIENT_SESSION_EVIDENCE:null;
 $('trial-local-status').textContent=copy?.[0]??'NOT INSPECTED';
 $('trial-local-status').className='trial-mark '+(localStage?.status==='STALE_LOCAL_TEST_EVIDENCE'?'trial-warning':
  localStage?.status==='CURRENT_SELF_RECORDED_TEST'?'trial-positive':'trial-unknown');
 $('trial-local-detail').textContent=copy?.[1]??'Choose a local session or a synthetic example.';
 $('trial-local-source').textContent=localStage?
  (localStage.source==='EXPLICITLY_SYNTHETIC_EXAMPLE'?'SOURCE: SYNTHETIC EXAMPLE — NOT REAL KIRO':'SOURCE: USER SELECTED · BROWSER ONLY')+
  ' · '+localStage.counts.observedPassingTests+' PASS RECEIPT(S) · '+localStage.counts.observedSourceEdits+' EDIT(S)':
  'SOURCE: NONE';
 const pr=hearing.pr;
 const finding=pr?.workflowFinding;
 const labels={
  FAILED_RUNS_OBSERVED:'FAILED RUN OBSERVED',
  RUNS_IN_PROGRESS:'RUNS IN PROGRESS',
  NON_PASS_RUNS_OBSERVED:'NON-PASS OBSERVED',
  PARTIAL_RUN_SAMPLE:'PARTIAL SAMPLE',
  SUCCESSFUL_RUNS_OBSERVED:'RUNS OBSERVED',
  NO_SUCCESSFUL_RUN_OBSERVED:'NO PASS OBSERVED',
  CI_UNVERIFIED:'CI UNKNOWN'
 };
 $('trial-pr-status').textContent=pr?(labels[finding]??'CI UNKNOWN'):'NOT INSPECTED';
 $('trial-pr-status').className='trial-mark '+(finding==='FAILED_RUNS_OBSERVED'?'trial-warning':
  finding==='SUCCESSFUL_RUNS_OBSERVED'?'trial-observed':'trial-unknown');
 const caution=finding==='FAILED_RUNS_OBSERVED'?'WARNING: failed exact-SHA CI observed. ':
  finding==='RUNS_IN_PROGRESS'?'Pending results cannot be treated as a PASS. ':
  finding==='NON_PASS_RUNS_OBSERVED'?'Some workflow results were not successful. ':
  finding==='PARTIAL_RUN_SAMPLE'?'This is only a partial provider sample. ':'';
 $('trial-pr-detail').textContent=pr?.status==='OBSERVED_EXACT_SHA_RUNS'?
  caution+pr.counts.success+' success, '+pr.counts.failure+' failure, '+pr.counts.inProgress+' ongoing, '+pr.counts.other+' other public GitHub Actions observations. Required checks remain unverified.':
  pr?'PR HEAD is observed; the GitHub Actions evidence is unknown or unavailable.':
  'Inspect a public PR above to retrieve its current HEAD SHA.';
 $('trial-pr-source').textContent=pr?'HEAD: '+pr.headSha+' · PROVIDER-REPORTED':'PROVIDER: NOT QUERIED';
 // Render only fixed, bounded planner text derived from the validated hearing.
 const repairList=$('trial-repair-list');
 repairList.replaceChildren();
 for(const step of hearing.repairPlan.checks){
  const li=document.createElement('li');
  const label=document.createElement('strong');
  const state=document.createElement('span');
  const action=document.createElement('p');
  label.textContent=step.label;
  state.textContent=step.state.replaceAll('_',' ');
  action.textContent=step.nextAction;
  li.append(label,state,action);
  repairList.append(li);
 }
 $('trial-repair-status').textContent='3 independent checks · release still unapproved';
 $('trial-next').textContent=nextText[hearing.suggestedAction]??nextText.GATHER_BOTH_EVIDENCE_SOURCES;
}
// Invalidate any pending async file read before clearing or replacing a session.
function clearFile(){file.value='';file.disabled=false;analyze.disabled=true}
file.addEventListener('change',()=>{
 sessionEpoch++;
 // Selection is NOT analysis. Never present an earlier hearing for a newly chosen file.
 local=null;
 render();
 const selected=file.files?.[0];
 analyze.disabled=!selected||selected.size>maxSize;
 notice.textContent=!selected?'No local file selected.':selected.size>maxSize?
  'File exceeds 8 MiB. Nothing was read or uploaded.':
  'Local file selected · '+Math.round(selected.size/1024)+' KiB. Click Analyze to read it privately.';
});
analyze.addEventListener('click',async()=>{
 const selected=file.files?.[0];
 if(!selected||selected.size>maxSize){clearFile();return}
 const epoch=++sessionEpoch;
 analyze.disabled=true;file.disabled=true;
 try{
  const raw=await selected.text();
  if(epoch!==sessionEpoch)return; // A clear/example/new file superseded this read.
  local=summarizeLocalSession(raw,{synthetic:false});
  notice.textContent='Local session examined in this browser only. The file selection was cleared.';
 }catch{
  if(epoch!==sessionEpoch)return;
  local=null;
  notice.textContent='Unable to read this local file safely. Nothing was transmitted.';
 }finally{
  if(epoch===sessionEpoch){clearFile();render()}
 }
});
function example(kind){
 sessionEpoch++;
 clearFile();
 local=summarizeLocalSession(syntheticTrial(kind),{synthetic:true});
 notice.textContent='EXPLICITLY SYNTHETIC — generated demonstration, NOT a Kiro-authored or real session.';
 render();
}
$('trial-stale').addEventListener('click',()=>example('stale'));
$('trial-retest').addEventListener('click',()=>example('retested'));
$('trial-clear').addEventListener('click',()=>{
 sessionEpoch++;
 local=null;clearFile();render();
 notice.textContent='Local session cleared from this view. No raw text was stored or uploaded.';
});
window.addEventListener('specter:pr-observed',event=>{
 // Only validated, public metadata is passed by the PR inspector. No local file.
 provider=event.detail??null;
 render();
});
$('trial-copy').addEventListener('click',async()=>{
 const json=JSON.stringify(combineTrial(local,provider),null,2);
 try{await navigator.clipboard.writeText(json);
  $('trial-export-status').textContent='Sanitized evidence hearing copied. No raw session included.'}
 catch{$('trial-export-status').textContent='Clipboard unavailable. No data was sent.'}
});
$('trial-download').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify(combineTrial(local,provider),null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download='specter-evidence-hearing.json';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 $('trial-export-status').textContent='Sanitized local JSON prepared. No transcript content included.';
});
render();
