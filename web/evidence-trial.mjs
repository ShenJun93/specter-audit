// M10 experimental Evidence Trial: assemble two separate *observations*.
// Browser-only session parsing; no network, storage, hashing of private logs,
// file names, source paths, prompts, tool commands or session IDs in output.
// Implemented with ChatGPT/WAG, NOT Kiro-authored.
import {parseKiroSession} from './kiro-session-import.mjs';
import {auditLocalSession} from './kiro-session-staleness.mjs';

const STATUSES=new Set([
 'STALE_LOCAL_TEST_EVIDENCE',
 'CURRENT_SELF_RECORDED_TEST',
 'INSUFFICIENT_SESSION_EVIDENCE'
]);
const SHA=/^[0-9a-f]{40}$/i;
const MAX_BYTES=8*1024*1024;
const SMALL=20000;
const UNSUPPORTED='UNSUPPORTED_LOCAL_SESSION';
const NO_ATTESTATION=Object.freeze({
 localSessionLinkedToPr:false,independentlyAttested:false,
 semanticCorrectnessVerified:false,allRequiredChecksVerified:false,
 releaseApproved:false
});
const number=(x,max=4000)=>Number.isSafeInteger(x)&&x>=0&&x<=max?x:0;
const formatReason=(s)=>typeof s==='string'&&/^[A-Z_]{3,72}$/.test(s)?s:UNSUPPORTED;
function cleanSummary(parsed){
 const a=parsed.summary??{};
 return {
  observedPassingTests:number(a.passingTests),
  observedSourceEdits:number(a.sourceEdits),
  recognizedAgentClaims:number(a.recognizedClaims),
  unclassifiedEdits:number(a.unclassifiedEdits),
  sessionEvents:number(a.sessionEvents)
 };
}
const sessionUnknown=(errorCode='NOT_INSPECTED',source='NONE',summary={})=>({
 source,verdict:'INSUFFICIENT_SESSION_EVIDENCE',reason:formatReason(errorCode),
 counts:{
  observedPassingTests:number(summary.observedPassingTests),
  observedSourceEdits:number(summary.observedSourceEdits),
  recognizedAgentClaims:number(summary.recognizedAgentClaims),
  unclassifiedEdits:number(summary.unclassifiedEdits),
  sessionEvents:number(summary.sessionEvents)
 },
 ...NO_ATTESTATION
});
export function summarizeLocalSession(text,{synthetic=false}={}){
 const source=synthetic?'EXPLICITLY_SYNTHETIC_EXAMPLE':'USER_SELECTED_BROWSER_ONLY';
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)
  return sessionUnknown('FILE_SIZE_LIMIT',source);
 let parsed;
 try{parsed=parseKiroSession(text)}catch{return sessionUnknown(UNSUPPORTED,source)}
 const counts=cleanSummary(parsed);
 if(!parsed.input)return sessionUnknown(parsed.errorCode??UNSUPPORTED,source,counts);
 let audit;
 try{audit=auditLocalSession(parsed.input)}catch{return sessionUnknown(UNSUPPORTED,source,counts)}
 if(!audit||!STATUSES.has(audit.status))return sessionUnknown(UNSUPPORTED,source,counts);
 return {
  source,verdict:audit.status,
  reason:audit.status==='INSUFFICIENT_SESSION_EVIDENCE'?'AUDITOR_INSUFFICIENT':'LOCAL_TIMELINE_OBSERVED',
  counts,...NO_ATTESTATION
 };
}
export function combineTrial(local=null,provider=null){
 const validLocal=local&&STATUSES.has(local.verdict)&&
   ['EXPLICITLY_SYNTHETIC_EXAMPLE','USER_SELECTED_BROWSER_ONLY'].includes(local.source);
 const session=validLocal?{
  source:local.source,status:local.verdict,
  reason:formatReason(local.reason??UNSUPPORTED),
  counts:{
   observedPassingTests:number(local.counts?.observedPassingTests),
   observedSourceEdits:number(local.counts?.observedSourceEdits),
   recognizedAgentClaims:number(local.counts?.recognizedAgentClaims),
   unclassifiedEdits:number(local.counts?.unclassifiedEdits),
   sessionEvents:number(local.counts?.sessionEvents)
  }
 }:null;
 const validPr=provider?.source==='GITHUB_PUBLIC_REST_OPT_IN'&&
   provider?.headSha&&SHA.test(provider.headSha)&&
   Number.isSafeInteger(provider.prNumber)&&provider.prNumber>0&&
   typeof provider.repository==='string'&&/^[A-Za-z0-9-]+\/[A-Za-z0-9._-]{1,100}$/.test(provider.repository);
 const runStatus=provider?.status==='OBSERVED_EXACT_SHA_RUNS'&&
  Array.isArray(provider.runs)&&provider.runs.length>0&&provider.runs.length<=30?
  'OBSERVED_EXACT_SHA_RUNS':'UNKNOWN';
 const counts=runStatus==='OBSERVED_EXACT_SHA_RUNS'?
  {success:number(provider.counts?.success,30),
   failure:number(provider.counts?.failure,30),
   inProgress:number(provider.counts?.inProgress,30),
   other:number(provider.counts?.other,30)}:null;
 const pr=validPr?{
  repository:provider.repository,
  prNumber:provider.prNumber,headSha:provider.headSha.toLowerCase(),
  status:runStatus,counts,
  truncated:provider.truncated===true
 }:null;
 const sessionStep=session?.status==='STALE_LOCAL_TEST_EVIDENCE'?
  'STALE_TEST_RECEIPT':session?.status==='CURRENT_SELF_RECORDED_TEST'?
  'CURRENT_SELF_RECORDED_ONLY':session?'INSUFFICIENT_SESSION_EVIDENCE':'AWAITING_LOCAL_SESSION';
 const providerStep=pr?.status==='OBSERVED_EXACT_SHA_RUNS'?
  'MATCHING_GITHUB_WORKFLOWS_OBSERVED':pr?'CI_UNVERIFIED':'AWAITING_PUBLIC_PR';
 const action=sessionStep==='STALE_TEST_RECEIPT'?
  'RETEST_AFTER_FINAL_EDIT':sessionStep==='CURRENT_SELF_RECORDED_ONLY'?
  'VERIFY_COMMIT_BINDING_AND_REQUIRED_CHECKS':sessionStep==='INSUFFICIENT_SESSION_EVIDENCE'?
  'OBTAIN_COMPLETE_TEST_RECEIPT':pr?.status==='OBSERVED_EXACT_SHA_RUNS'?
  'INSPECT_LOCAL_KIRO_TEST_CHRONOLOGY':'GATHER_BOTH_EVIDENCE_SOURCES';
 return {
  schema:'SPECTER_UNJOINED_EVIDENCE_TRIAL_V1',
  session,pr,
  localStep:sessionStep,providerStep,
  bridge:'NO_INDEPENDENT_SESSION_TO_PR_COMMIT_BINDING',
  finalFinding:'RELEASE_EVIDENCE_INCOMPLETE',
  suggestedAction:action,
  ...NO_ATTESTATION,
  limitations:[
   'Session chronology is editable local evidence, never independent attestation.',
   'GitHub Actions metadata is provider-reported and does not establish required checks or correctness.',
   'No independently verified binding connects this Kiro session to this PR HEAD.',
   'This dossier cannot approve a release or certify a test result.'
  ]
 };
}
// Safe, synthetic-only timeline for a judge demonstration. Never called a real log.
export function syntheticTrial(kind='stale'){
 if(kind!=='stale'&&kind!=='retested')throw Error('UNSUPPORTED_SYNTHETIC_CASE');
 const time=n=>'2026-11-04T11:'+String(n).padStart(2,'0')+':00.000Z';
 const line=(n,payload)=>JSON.stringify({timestamp:time(n),payload});
 const events=[
  line(0,{type:'tool_call',toolCallId:'test1',toolName:'execute_pwsh',args:{command:'node --test'}}),
  line(1,{type:'tool_result',toolCallId:'test1',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
  line(2,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}),
  line(3,{type:'tool_call',toolCallId:'edit1',toolName:'str_replace',filePath:'src/synthetic-proof.mjs'}),
  line(4,{type:'tool_result',toolCallId:'edit1',success:true,content:'Done'})
 ];
 if(kind==='retested'){
  // New test after edit: the old claim remains historically true,
  // but a later observed PASS is not a retroactive attestation of the PR HEAD.
  events.push(
   line(5,{type:'tool_call',toolCallId:'test2',toolName:'execute_pwsh',args:{command:'node --test'}}),
   line(6,{type:'tool_result',toolCallId:'test2',success:true,content:'pass 8\nfail 0\nExit Code: 0'}),
   line(7,{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'})
  );
 }
 events.push(line(8,{type:'turn_end'}));
 return events.join('\n');
}
