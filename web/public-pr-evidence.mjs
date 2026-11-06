// M9A experimental public GitHub PR proof chain; no Kiro-hook activation.
// Network boundary: exactly two explicit, bounded, unauthenticated GET calls to
// https://api.github.com. Never process/upload user Kiro transcript data.
// Source was developed with ChatGPT/WAG, NOT authored or tested by Kiro CLI.
const SCHEMA='SPECTER_PUBLIC_PR_OBSERVATION_V1';
const API_ORIGIN='https://api.github.com';
const SHA=/^[0-9a-f]{40}$/i;
const STATUSES=new Set(['completed','queued','requested','pending','waiting','in_progress']);
const CONCLUSIONS=new Set([
  'success','failure','cancelled','timed_out','action_required','neutral','skipped','stale','startup_failure'
]);
const MAX_PR_BYTES=512*1024;
const MAX_RUNS_BYTES=1024*1024;
const MAX_RUNS=30;
const DEFAULT_TIMEOUT_MS=8000;
const LIMITATIONS=Object.freeze([
  'Provider-reported public GitHub metadata; not an independent or cryptographic attestation.',
  'Observed GitHub Actions runs do not establish that all required CI checks ran or passed.',
  'A saved Kiro session is not independently bound to this PR HEAD commit.',
  'A PR HEAD can change after inspection; re-check before any release decision.',
  'No source code correctness, test execution, or release approval is established.'
]);

class ProbeError extends Error {
 constructor(code){super(code);this.name='ProbeError';this.code=code}
}
function fail(code){throw new ProbeError(code)}
function validOwner(s){
 return typeof s==='string'&&s.length>=1&&s.length<=39&&
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s);
}
function validRepo(s){
 return typeof s==='string'&&s.length>=1&&s.length<=100&&
  /^[a-z0-9][a-z0-9._-]*$/i.test(s)&&!s.endsWith('.')&&!s.includes('..');
}
function positiveInt(n){return typeof n==='number'&&Number.isSafeInteger(n)&&n>0}
function matchRepo(name,owner,repo){
 return typeof name==='string'&&name.toLowerCase()===(owner+'/'+repo).toLowerCase();
}
function githubUrl(url,owner,repo,kind,id){
 if(typeof url!=='string'||url.length>320)return false;
 const expected='https://github.com/'+owner+'/'+repo+'/'+kind+'/'+id;
 return url.toLowerCase()===expected.toLowerCase();
}
function stamp(now) {
 try{
  const d=typeof now==='function'?now():new Date();
  const value=d instanceof Date?d:new Date(d);
  if(!Number.isFinite(value.getTime()))return null;
  return value.toISOString();
 }catch{return null}
}
function common(now) {
 return {
  schema:SCHEMA,
  source:'GITHUB_PUBLIC_REST_OPT_IN',
  observedAtClient:stamp(now),
  localSessionLinkedToPr:false,
  independentlyAttested:false,
  semanticCorrectnessVerified:false,
  allRequiredChecksVerified:false,
  limits:[...LIMITATIONS]
 };
}
function unknown(reason,now,ctx={}) {
 return {
  ...common(now),status:'UNKNOWN',reason,
  repository:ctx.repository??null,prNumber:ctx.prNumber??null,
  headSha:ctx.headSha??null,prUrl:ctx.prUrl??null,
  runs:[],counts:null,truncated:false
 };
}
/**
 * @param {unknown} input - ONLY a canonical public github.com pull URL.
 * @returns {{owner:string,repo:string,number:number,url:string}|null}
 */
export function parsePublicPrUrl(input){
 if(typeof input!=='string'||input.length<29||input.length>320||input!==input.trim()||
    /[^\x20-\x7e]/.test(input))return null;
 let u;
 try{u=new URL(input)}catch{return null}
 if(u.protocol!=='https:'||u.hostname!=='github.com'||u.port||u.username||u.password||
    u.search||u.hash)return null;
 const m=/^\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/pull\/([1-9][0-9]{0,9})\/?$/.exec(u.pathname);
 if(!m||!validOwner(m[1])||!validRepo(m[2]))return null;
 const n=Number(m[3]);if(!Number.isSafeInteger(n)||n<=0||n>2147483647)return null;
 // Reject noncanonical spellings (percent-encoded slugs, ports, whitespace, etc.).
 const expected='https://github.com/'+m[1]+'/'+m[2]+'/pull/'+n;
 if(input!==expected&&input!==expected+'/')return null;
 return {owner:m[1],repo:m[2],number:n,url:expected};
}
function validatePull(json,target){
 if(!json||typeof json!=='object'||Array.isArray(json)||
  json.number!==target.number||!json.head||!SHA.test(json.head.sha)||
  !json.base||!json.base.repo||!matchRepo(json.base.repo.full_name,target.owner,target.repo)||
  !githubUrl(json.html_url,target.owner,target.repo,'pull',target.number)||
  !['open','closed'].includes(json.state)||typeof json.draft!=='boolean')fail('UNTRUSTED_PR_RESPONSE');
 return {
  repository:target.owner+'/'+target.repo,prNumber:target.number,
  headSha:json.head.sha.toLowerCase(),state:json.state,draft:json.draft,
  prUrl:target.url
 };
}
function validateRuns(json,target,pull){
 if(!json||typeof json!=='object'||Array.isArray(json)||
  !Number.isSafeInteger(json.total_count)||json.total_count<0||
  !Array.isArray(json.workflow_runs)||json.workflow_runs.length>MAX_RUNS||
  json.total_count<json.workflow_runs.length)fail('UNTRUSTED_RUNS_RESPONSE');
 const usedIds=new Set(),usedAttempts=new Set();
 const runs=[];
 for(const v of json.workflow_runs){
  if(!v||typeof v!=='object'||Array.isArray(v)||!positiveInt(v.id)||
    !positiveInt(v.workflow_id)||!positiveInt(v.run_number)||!positiveInt(v.run_attempt)||
    typeof v.head_sha!=='string'||v.head_sha.toLowerCase()!==pull.headSha||
    !v.repository||!matchRepo(v.repository.full_name,target.owner,target.repo)||
    !STATUSES.has(v.status)||
    !githubUrl(v.html_url,target.owner,target.repo,'actions/runs',v.id)||
    (v.status==='completed'?!CONCLUSIONS.has(v.conclusion):v.conclusion!==null)){
   fail('UNTRUSTED_RUNS_RESPONSE');
  }
  const key=v.workflow_id+':'+v.run_number+':'+v.run_attempt;
  if(usedIds.has(v.id)||usedAttempts.has(key))fail('UNTRUSTED_RUNS_RESPONSE');
  usedIds.add(v.id);usedAttempts.add(key);
  runs.push({
   id:v.id,workflowId:v.workflow_id,runNumber:v.run_number,
   runAttempt:v.run_attempt,
   status:v.status,conclusion:v.status==='completed'?v.conclusion:null,
   sourceUrl:'https://github.com/'+target.owner+'/'+target.repo+'/actions/runs/'+v.id,
   headSha:pull.headSha
  });
 }
 return {runs,truncated:json.total_count>runs.length,totalCount:json.total_count};
}
async function boundedJson(response,byteLimit){
 if(!response||typeof response.status!=='number')fail('INVALID_PROVIDER_RESPONSE');
 if(response.status===403||response.status===429)fail('RATE_LIMITED_OR_FORBIDDEN');
 if(response.status===404)fail('NOT_FOUND_OR_PRIVATE');
 if(response.status!==200)fail('PROVIDER_UNAVAILABLE');
 const mime=response.headers?.get?.('content-type')??'';
 if(!/^application\/(?:[a-z0-9.-]+\+)?json(?:\s*;|$)/i.test(mime))fail('INVALID_CONTENT_TYPE');
 const length=response.headers?.get?.('content-length');
 if(length!==null&&length!==undefined){
  const n=Number(length);
  if(!Number.isFinite(n)||n<0||n>byteLimit)fail('RESPONSE_TOO_LARGE');
 }
 let data;
 if(response.body&&typeof response.body.getReader==='function'){
  const reader=response.body.getReader();
  const buffers=[];let bytes=0;
  try{
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    if(!(value instanceof Uint8Array))fail('UNTRUSTED_PROVIDER_BYTES');
    bytes+=value.byteLength;
    if(bytes>byteLimit)fail('RESPONSE_TOO_LARGE');
    buffers.push(value);
   }
  }finally{
   try{await reader.cancel()}catch{}
  }
  data=new Uint8Array(bytes);
  let offset=0;for(const buf of buffers){data.set(buf,offset);offset+=buf.byteLength}
 }else{
  // Minimal Response mocks for deterministic tests.
  if(typeof response.text!=='function')fail('INVALID_PROVIDER_RESPONSE');
  const raw=await response.text();
  data=new TextEncoder().encode(raw);
  if(data.byteLength>byteLimit)fail('RESPONSE_TOO_LARGE');
 }
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data))}
 catch{fail('INVALID_PROVIDER_JSON')}
}
async function fetchOne(fetchImpl,url,limit,timeoutMs){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchImpl(url,{
   method:'GET',headers:{Accept:'application/vnd.github+json'},
   redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',
   cache:'no-store',signal:controller.signal
  });
  return await boundedJson(response,limit);
 }finally{clearTimeout(timer)}
}
/**
 * Inspect a public GitHub PR using two bounded, GET-only provider requests.
 * Do not pass raw Kiro session material. Never claims end-to-end verification.
 */
export async function inspectPublicPr(input,{fetchImpl=globalThis.fetch,now=()=>new Date(),timeoutMs=DEFAULT_TIMEOUT_MS}={}){
 const target=parsePublicPrUrl(input);
 if(!target)return unknown('INVALID_PR_URL',now);
 const context={repository:target.owner+'/'+target.repo,prNumber:target.number,prUrl:target.url};
 if(typeof fetchImpl!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<250||timeoutMs>15000)
  return unknown('INVALID_INSPECTOR_CONFIGURATION',now,context);
 try{
  const base=API_ORIGIN+'/repos/'+target.owner+'/'+target.repo;
  const pull=validatePull(await fetchOne(fetchImpl,base+'/pulls/'+target.number,MAX_PR_BYTES,timeoutMs),target);
  // Preserve only the validated PR HEAD if the second provider call fails.
  // This does not establish that CI ran or passed for the commit.
  context.headSha=pull.headSha;
  const runs=validateRuns(await fetchOne(fetchImpl,base+'/actions/runs?head_sha='+pull.headSha+
   '&per_page='+MAX_RUNS+'&page=1',MAX_RUNS_BYTES,timeoutMs),target,pull);
  const counts={success:0,failure:0,inProgress:0,other:0};
  for(const r of runs.runs){
   if(r.status!=='completed')counts.inProgress++;
   else if(r.conclusion==='success')counts.success++;
   else if(['failure','cancelled','timed_out','action_required','startup_failure'].includes(r.conclusion))counts.failure++;
   else counts.other++;
  }
  return {
   ...common(now),
   status:runs.runs.length?'OBSERVED_EXACT_SHA_RUNS':'UNKNOWN',
   reason:runs.runs.length?'MATCHING_PROVIDER_RUNS_OBSERVED':'NO_MATCHING_RUNS_OBSERVED',
   ...pull,runs:runs.runs,counts,
   totalCount:runs.totalCount,truncated:runs.truncated
  };
 }catch(e){
  return unknown(e instanceof ProbeError?e.code:'NETWORK_OR_TIMEOUT',now,context);
 }
}
