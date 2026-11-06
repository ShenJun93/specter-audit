import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePublicPrUrl,inspectPublicPr} from '../web/public-pr-evidence.mjs';

const url='https://github.com/ShenJun93/specter-audit/pull/7';
const head='8fc24affba4cfa00ee91b9ed0a65ad5941cdfe24';
const ancestor='b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e';
const repo='ShenJun93/specter-audit';
const pr=()=>({
 number:7,state:'open',draft:true,
 html_url:url,base:{repo:{full_name:repo}},head:{sha:head}
});
const workflow=(overrides={})=>({
 id:42153824506,workflow_id:22991888,run_number:45,run_attempt:1,
 head_sha:head,repository:{full_name:repo},status:'completed',conclusion:'success',
 html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/42153824506',
 name:'Untrusted provider name <script>alert(1)</script>',
 ...overrides
});
const runs=(items=[workflow()],total=items.length)=>({total_count:total,workflow_runs:items});
function ok(x,headers={'content-type':'application/json'}){
 return new Response(JSON.stringify(x),{status:200,headers});
}
function response(status){
 return new Response(status===204?null:'{}',{status,headers:{'content-type':'application/json'}});
}
function makeFetch(p=pr(),r=runs()){
 const calls=[];
 const fetchImpl=async (endpoint,opts)=>{
  calls.push({endpoint,opts});
  if(calls.length>2)throw Error('THIRD NETWORK REQUEST');
  return ok(calls.length===1?p:r);
 };
 return {fetchImpl,calls};
}
const check=async(p=pr(),r=runs())=>{
 const f=makeFetch(p,r);
 const result=await inspectPublicPr(url,{fetchImpl:f.fetchImpl,now:()=>new Date('2026-11-06T05:20:00Z')});
 return {...f,result};
};

test('accepts only canonical public GitHub PR URLs and normalizes no credentials',()=>{
 assert.deepEqual(parsePublicPrUrl(url),{owner:'ShenJun93',repo:'specter-audit',number:7,url});
 assert.deepEqual(parsePublicPrUrl(url+'/'),{owner:'ShenJun93',repo:'specter-audit',number:7,url});
});
for(const bad of [
 '',null,undefined,5,{},'https://github.com/a/b/pull/1?x=1',
 'https://github.com/a/b/pull/1#x','https://github.com/a/b/pull/0',
 'https://github.com/a/b/pull/9999999999','http://github.com/a/b/pull/7',
 'https://github.com.evil.test/a/b/pull/7','https://evil.test/github.com/a/b/pull/7',
 'https://x:password@github.com/a/b/pull/7','https://github.com:443/a/b/pull/7',
 'https://github.com/a/../b/pull/7','https://github.com/a/%2e%2e/pull/7',
 'https://github.com/a%2fb/r/pull/1','https://github.com/a/b/pull/1/extra',
 'https://github.com/a/b/issues/7','https://github.com/a/b/pull/-1',
 'https://github.com/a/b/pull/01','https://github.com/a/b/pull/1?token=secret',
 'https://github.com/a/b/pull/1 ', '\nhttps://github.com/a/b/pull/1',
 'https://github.com/a/b/pull/1\n','https://github.com/ab--cd/r/pull/1',
 'https://github.com/a/b..c/pull/1','https://github.com/a/b./pull/1',
 'https://github.com/a/b/pull/1💥'
]){
 test('fails closed on unsafe PR URL: '+String(bad).slice(0,60),()=>{
  assert.equal(parsePublicPrUrl(bad),null);
 });
}
test('accepts even a minimal valid public PR URL',()=>{
 assert.deepEqual(parsePublicPrUrl('https://github.com/a/b/pull/1'),{
  owner:'a',repo:'b',number:1,url:'https://github.com/a/b/pull/1'
 });
});
test('valid provider fetch uses only two fixed API GETs, no credentials or referrer',async()=>{
 const {result,calls}=await check();
 assert.equal(result.status,'OBSERVED_EXACT_SHA_RUNS');
 assert.equal(result.headSha,head);
 assert.equal(result.repository,repo);
 assert.equal(result.prNumber,7);
 assert.equal(result.prUrl,url);
 assert.equal(result.observedAtClient,'2026-11-06T05:20:00.000Z');
 assert.deepEqual(result.counts,{success:1,failure:0,inProgress:0,other:0});
 assert.equal(result.truncated,false);
 assert.equal(result.totalCount,1);
 assert.equal(result.runs[0].sourceUrl,workflow().html_url);
 assert.equal(calls.length,2);
 assert.equal(calls[0].endpoint,'https://api.github.com/repos/ShenJun93/specter-audit/pulls/7');
 assert.equal(calls[1].endpoint,'https://api.github.com/repos/ShenJun93/specter-audit/actions/runs?head_sha='+head+'&per_page=30&page=1');
 for(const {opts} of calls){
  assert.equal(opts.method,'GET');
  assert.equal(opts.redirect,'error');
  assert.equal(opts.credentials,'omit');
  assert.equal(opts.referrerPolicy,'no-referrer');
  assert.equal(opts.cache,'no-store');
  assert.equal(opts.headers.Authorization,undefined);
  assert.equal(typeof opts.signal,'object');
 }
});
test('positive provider response still never upgrades to attested or all-required-checks-pass',async()=>{
 const {result}=await check();
 assert.equal(result.localSessionLinkedToPr,false);
 assert.equal(result.independentlyAttested,false);
 assert.equal(result.semanticCorrectnessVerified,false);
 assert.equal(result.allRequiredChecksVerified,false);
 assert.ok(result.limits.some(s=>s.includes('all required')));
 assert.ok(!JSON.stringify(result).includes('ALL_TESTS_PASS'));
 assert.ok(!JSON.stringify(result).includes('RELEASE_APPROVED'));
 assert.ok(!JSON.stringify(result).includes('Untrusted provider name'));
});
test('no observed workflows is UNKNOWN, not a fake PASS or proof of absence',async()=>{
 const {result}=await check(pr(),runs([]));
 assert.equal(result.status,'UNKNOWN');
 assert.equal(result.reason,'NO_MATCHING_RUNS_OBSERVED');
 assert.equal(result.counts.success,0);
 assert.equal(result.runs.length,0);
});
test('mixed provider conclusions are preserved with distinct counts',async()=>{
 const items=[
  workflow(),
  workflow({id:42153824507,run_number:46,conclusion:'failure',html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/42153824507'}),
  workflow({id:42153824508,run_number:47,status:'in_progress',conclusion:null,html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/42153824508'}),
  workflow({id:42153824509,run_number:48,conclusion:'skipped',html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/42153824509'})
 ];
 const {result}=await check(pr(),runs(items));
 assert.equal(result.status,'OBSERVED_EXACT_SHA_RUNS');
 assert.deepEqual(result.counts,{success:1,failure:1,inProgress:1,other:1});
});
test('truncation is explicitly marked, not silently mistaken for complete checks',async()=>{
 const {result}=await check(pr(),runs([workflow()],90));
 assert.equal(result.truncated,true);
 assert.equal(result.totalCount,90);
 assert.equal(result.allRequiredChecksVerified,false);
});
for(const [label,altered] of [
 ['wrong PR number',{number:8}],
 ['wrong base repository',{base:{repo:{full_name:'other/fork'}}}],
 ['different PR URL',{html_url:'https://github.com/ShenJun93/specter-audit/pull/8'}],
 ['wrong HEAD sha',{head:{sha:'not-a-sha'}}],
 ['wrong state',{state:'deleted'}],
 ['missing draft',{draft:null}],
 ['missing base',{base:null}]
 ]){
 test('untrusted PR metadata fails closed: '+label,async()=>{
  const {result,calls}=await check({...pr(),...altered});
  assert.equal(result.status,'UNKNOWN');
  assert.equal(result.reason,'UNTRUSTED_PR_RESPONSE');
  assert.equal(calls.length,1,'Mismatched PR must not fetch runs');
 });
}
for(const [label,altered] of [
 ['stale workflow run SHA',{head_sha:ancestor}],
 ['forged source URL',{html_url:'https://evil.test/a/b/actions/runs/42153824506'}],
 ['foreign owner run link',{html_url:'https://github.com/another/repo/actions/runs/42153824506'}],
 ['different run id',{html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/99'}],
 ['foreign repository',{repository:{full_name:'another/repo'}}],
 ['missing repo',{repository:null}],
 ['unsupported status',{status:'super_success'}],
 ['completed without conclusion',{conclusion:null}],
 ['in-progress with fake conclusion',{status:'in_progress',conclusion:'success'}],
 ['workflow ID zero',{workflow_id:0}],
 ['run attempt zero',{run_attempt:0}],
 ['run number invalid',{run_number:'45'}],
 ['run ID unsafe',{id:2**53+1}]
 ]){
 test('untrusted provider workflow metadata fails closed: '+label,async()=>{
  const {result}=await check(pr(),runs([workflow(altered)]));
  assert.equal(result.status,'UNKNOWN');
  assert.equal(result.reason,'UNTRUSTED_RUNS_RESPONSE');
  assert.deepEqual(result.runs,[]);
 });
}
test('duplicate runs fail closed rather than counting one success twice',async()=>{
 const {result}=await check(pr(),runs([workflow(),workflow()]));
 assert.equal(result.status,'UNKNOWN');
 assert.equal(result.reason,'UNTRUSTED_RUNS_RESPONSE');
});
test('duplicated workflow/run attempt with distinct ID still fails closed',async()=>{
 const alt=workflow({id:42153824509,html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/42153824509'});
 const {result}=await check(pr(),runs([workflow(),alt]));
 assert.equal(result.status,'UNKNOWN');
 assert.equal(result.reason,'UNTRUSTED_RUNS_RESPONSE');
});
test('unsupported array size fails closed',async()=>{
 const {result}=await check(pr(),runs(Array.from({length:31},(_,i)=>workflow({
  id:42153824600+i,run_number:100+i,html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/'+(42153824600+i)
 }))));
 assert.equal(result.reason,'UNTRUSTED_RUNS_RESPONSE');
});
for(const status of [403,404,429,500]){
 test('HTTP '+status+' fails closed on PR lookup',async()=>{
  let count=0;
  const result=await inspectPublicPr(url,{fetchImpl:async()=>{count++;return response(status)}});
  assert.equal(result.status,'UNKNOWN');
  assert.equal(result.reason,({403:'RATE_LIMITED_OR_FORBIDDEN',404:'NOT_FOUND_OR_PRIVATE',429:'RATE_LIMITED_OR_FORBIDDEN',500:'PROVIDER_UNAVAILABLE'})[status]);
  assert.equal(count,1);
  assert.equal(result.localSessionLinkedToPr,false);
 });
}
test('invalid content type fails closed without leaking body',async()=>{
 const result=await inspectPublicPr(url,{fetchImpl:async()=>ok({token:'SECRET'}, {'content-type':'text/html'})});
 assert.equal(result.reason,'INVALID_CONTENT_TYPE');
 assert.ok(!JSON.stringify(result).includes('SECRET'));
});
test('declared oversized provider response fails closed',async()=>{
 let count=0;
 const result=await inspectPublicPr(url,{fetchImpl:async()=>{count++;return ok(pr(),{'content-type':'application/json','content-length':'999999999'})}});
 assert.equal(result.reason,'RESPONSE_TOO_LARGE');
 assert.equal(count,1);
});
test('actual oversized streamed response fails closed',async()=>{
 const big={...pr(),filler:'x'.repeat(512*1024)};
 const result=await inspectPublicPr(url,{fetchImpl:async()=>ok(big)});
 assert.equal(result.reason,'RESPONSE_TOO_LARGE');
});
test('bad JSON is not shown to user',async()=>{
 const result=await inspectPublicPr(url,{fetchImpl:async()=>new Response('{ bad \\"token\\":\\"hidden\\"', {status:200,headers:{'content-type':'application/json'}})});
 assert.equal(result.reason,'INVALID_PROVIDER_JSON');
 assert.ok(!JSON.stringify(result).includes('hidden'));
});
test('network failure returns UNKNOWN with no exception or provider error echo',async()=>{
 const result=await inspectPublicPr(url,{fetchImpl:async()=>{throw Error('leaked-secret-from-network')}});
 assert.equal(result.reason,'NETWORK_OR_TIMEOUT');
 assert.ok(!JSON.stringify(result).includes('leaked-secret'));
});
test('timeout is bounded and mapped to UNKNOWN',async()=>{
 let signal;
 const start=Date.now();
 const result=await inspectPublicPr(url,{timeoutMs:250,fetchImpl:(endpoint,opts)=>{
  signal=opts.signal;
  return new Promise((resolve,reject)=>{
   if(opts.signal.aborted)return reject(Error('Aborted'));
   opts.signal.addEventListener('abort',()=>reject(Error('Aborted')),{once:true});
  });
 }});
 assert.equal(result.reason,'NETWORK_OR_TIMEOUT');
 assert.equal(signal.aborted,true);
 assert.ok(Date.now()-start<2200);
});
test('unsupported configuration never initiates a fetch',async()=>{
 let called=false;
 const result=await inspectPublicPr(url,{timeoutMs:999999,fetchImpl:()=>{called=true}});
 assert.equal(result.reason,'INVALID_INSPECTOR_CONFIGURATION');
 assert.equal(called,false);
});
test('invalid URL never initiates a fetch',async()=>{
 let called=false;
 const result=await inspectPublicPr('http://127.0.0.1/admin',{fetchImpl:()=>{called=true}});
 assert.equal(result.reason,'INVALID_PR_URL');
 assert.equal(called,false);
 assert.equal(result.localSessionLinkedToPr,false);
});

test('validated PR HEAD survives later workflow endpoint rate limiting, but never implies CI PASS',async()=>{
 let calls=0;
 const result=await inspectPublicPr(url,{fetchImpl:async()=>{
  calls++;
  return calls===1?ok(pr()):response(429);
 }});
 assert.equal(calls,2);
 assert.equal(result.status,'UNKNOWN');
 assert.equal(result.reason,'RATE_LIMITED_OR_FORBIDDEN');
 assert.equal(result.headSha,head,'validated PR HEAD must remain inspectable');
 assert.equal(result.repository,repo);
 assert.equal(result.prNumber,7);
 assert.deepEqual(result.runs,[]);
 assert.equal(result.counts,null);
 assert.equal(result.independentlyAttested,false);
 assert.equal(result.allRequiredChecksVerified,false);
});
test('PR lookup failure does not invent a confirmed HEAD',async()=>{
 const result=await inspectPublicPr(url,{fetchImpl:async()=>response(404)});
 assert.equal(result.status,'UNKNOWN');
 assert.equal(result.headSha,null);
});
