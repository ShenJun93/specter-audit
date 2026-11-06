// M9A experimental public PR evidence UI. No Kiro session file is read.
import {inspectPublicPr} from '/public-pr-evidence.mjs';
const $=id=>document.getElementById(id);
const form=$('pr-form'),input=$('pr-url'),button=$('pr-inspect');
let latest=null;
const unknown={
 INVALID_PR_URL:'Enter a canonical public GitHub PR URL with no extra query, fragment or credentials.',
 INVALID_INSPECTOR_CONFIGURATION:'The inspector could not be configured safely.',
 RATE_LIMITED_OR_FORBIDDEN:'GitHub denied or rate-limited the public request. No PR evidence was established.',
 NOT_FOUND_OR_PRIVATE:'GitHub did not return this public PR. Private repositories cannot be inspected.',
 PROVIDER_UNAVAILABLE:'The provider returned an unavailable or unsupported response.',
 INVALID_PROVIDER_RESPONSE:'The provider response was incomplete or invalid.',
 INVALID_CONTENT_TYPE:'GitHub returned a response that was not valid JSON.',
 RESPONSE_TOO_LARGE:'The public response exceeded the local safety limit.',
 UNTRUSTED_PROVIDER_BYTES:'The provider returned unexpected bytes.',
 INVALID_PROVIDER_JSON:'The provider response could not be parsed safely.',
 UNTRUSTED_PR_RESPONSE:'The pull request metadata did not match the requested public PR.',
 UNTRUSTED_RUNS_RESPONSE:'One or more workflow records had mismatched, duplicate or untrusted metadata.',
 NETWORK_OR_TIMEOUT:'The request failed or timed out. No provider verdict was inferred.',
 NO_MATCHING_RUNS_OBSERVED:'No matching GitHub Actions runs were observed in this response. This does not prove no CI exists.'
};
function showError(message){$('pr-error').textContent=message;$('pr-error').hidden=false}
function clearError(){$('pr-error').hidden=true;$('pr-error').textContent=''}
function observedResult(data){
 $('pr-empty').hidden=true;$('pr-report').hidden=false;
 $('pr-provenance').textContent=data.status==='OBSERVED_EXACT_SHA_RUNS'?
  'PUBLIC GITHUB · WORKFLOWS OBSERVED':data.headSha?
  'PR HEAD OBSERVED · CI UNKNOWN':'NO PROVIDER EVIDENCE';
 $('pr-status-card').className='pr-status '+(data.status==='OBSERVED_EXACT_SHA_RUNS'?'observed':'unknown');
 $('pr-status').textContent=data.status==='OBSERVED_EXACT_SHA_RUNS'?'PROVIDER RUNS OBSERVED':'EVIDENCE UNKNOWN';
 $('pr-headline').textContent=data.status==='OBSERVED_EXACT_SHA_RUNS'?
  'GitHub reports workflows for this exact commit.':data.headSha?
  'PR HEAD observed; GitHub Actions evidence unavailable.':'The PR evidence chain is not established.';
 $('pr-summary').textContent=data.status==='OBSERVED_EXACT_SHA_RUNS'?
  'Observed public GitHub Actions metadata for PR #'+data.prNumber+'. This is not proof that all required checks passed.':
  (unknown[data.reason]??'A bounded public observation was not possible.');
 $('pr-head-sha').textContent=data.headSha??'NOT CONFIRMED';
 for(const [id,n] of [
  ['pr-success',data.counts?.success],
  ['pr-failure',data.counts?.failure],
  ['pr-progress',data.counts?.inProgress],
  ['pr-other',data.counts?.other]
 ])$(id).textContent=Number.isSafeInteger(n)?String(n):'—';
 $('pr-truncation').textContent=data.truncated?
  'Only '+data.runs.length+' of '+data.totalCount+' public runs were returned in this first page. Other workflows or required checks may be missing.':
  'Only the observed GitHub Actions runs are counted. Other checks, required status gates and future PR updates are not independently verified.';
 const list=$('pr-runs');list.replaceChildren();
 for(const r of data.runs){
  const li=document.createElement('li');
  const title=document.createElement('strong');
  title.textContent='Workflow '+r.workflowId+' · run #'+r.runNumber+' · attempt '+r.runAttempt;
  const detail=document.createElement('span');
  detail.textContent=(r.status==='completed'?'Completed: '+r.conclusion:'Status: '+r.status)+' · exact HEAD SHA';
  const link=document.createElement('a');
  link.href=r.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';
  link.textContent='Inspect source on GitHub';
  li.append(title,document.createElement('br'),detail,link);list.append(li);
 }
 if(!data.runs.length){
  const li=document.createElement('li');li.textContent='No validated public workflow receipts to display.';list.append(li);
 }
 $('pr-copy-status').textContent='';
 $('pr-results-heading').focus({preventScroll:true});
 // Public metadata only. No local Kiro session data is ever sent in this event.
 window.dispatchEvent(new CustomEvent('specter:pr-observed',{detail:data}));
}
form.addEventListener('submit',async e=>{
 e.preventDefault();clearError();
 if(button.disabled)return;
 latest=null;
 window.dispatchEvent(new CustomEvent('specter:pr-observed',{detail:null}));
 button.disabled=true;input.disabled=true;button.textContent='Checking public GitHub evidence…';
 try{
  latest=await inspectPublicPr(input.value);
  observedResult(latest);
  if(latest.status==='UNKNOWN')showError(unknown[latest.reason]??'No trustworthy public evidence was returned.');
 }catch{
  latest=null;showError('Unable to inspect the PR safely.');
  $('pr-report').hidden=true;$('pr-empty').hidden=false;
 }finally{input.disabled=false;button.disabled=false;button.textContent='Inspect this PR →'}
});
$('pr-copy').addEventListener('click',async()=>{
 if(!latest)return;
 try{
  await navigator.clipboard.writeText(JSON.stringify(latest,null,2));
  $('pr-copy-status').textContent='Public provider summary copied (no private Kiro transcript).';
 }catch{$('pr-copy-status').textContent='Clipboard unavailable; no data was sent.'}
});
$('pr-download').addEventListener('click',()=>{
 if(!latest)return;
 const blob=new Blob([JSON.stringify(latest,null,2)+'\n'],{type:'application/json'});
 const localUrl=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=localUrl;a.download='specter-public-pr-observation.json';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(localUrl),1000);
 $('pr-copy-status').textContent='A local public-metadata report was prepared. Nothing from a private Kiro session is included.';
});
