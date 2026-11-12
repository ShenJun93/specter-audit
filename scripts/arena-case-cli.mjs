// M118: opt-in public PR observation + reviewer-owned challenge to ONE normalized case.
// The existing public PR inspector is reused; no tokens, arbitrary URLs, or PR writes.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectPublicPr,parsePublicPrUrl} from '../web/public-pr-evidence.mjs';
import {buildArenaCaseReport} from '../src/arena-case-report.mjs';

const SHA=/^[0-9a-f]{40}$/i;
const MAX_BYTES=256*1024;
function validSha(s){return typeof s==='string'&&SHA.test(s)}
function matchRepo(s,repo){return typeof s==='string'&&s.toLowerCase()===repo.toLowerCase()}
async function pullSnapshot(pr,{fetchImpl=globalThis.fetch}={}){
 if(!pr||typeof fetchImpl!=='function')throw Error('INVALID_PR');
 const url='https://api.github.com/repos/'+pr.owner+'/'+pr.repo+'/pulls/'+pr.number;
 const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),9000);
 try{
  const res=await fetchImpl(url,{method:'GET',headers:{Accept:'application/vnd.github+json'},
   redirect:'error',cache:'no-store',credentials:'omit',signal:controller.signal});
  if(res.status!==200||!/json/i.test(res.headers?.get?.('content-type')??''))throw Error('PR_PROVIDER_UNAVAILABLE');
  const n=Number(res.headers?.get?.('content-length')??0);
  if(n>MAX_BYTES)throw Error('PR_RESPONSE_OVERSIZED');
  const buffer=await res.arrayBuffer();
  if(buffer.byteLength>MAX_BYTES)throw Error('PR_RESPONSE_OVERSIZED');
  const j=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer));
  if(j.number!==pr.number||j.html_url!==pr.url||
    !matchRepo(j.base?.repo?.full_name,pr.owner+'/'+pr.repo)||
    !validSha(j.base?.sha)||!validSha(j.head?.sha)||
    !['open','closed'].includes(j.state))throw Error('PR_PROVIDER_UNTRUSTED');
  return {baseSha:j.base.sha.toLowerCase(),headSha:j.head.sha.toLowerCase(),
   repository:pr.owner+'/'+pr.repo,prNumber:pr.number,state:j.state};
 }finally{clearTimeout(timer)}
}
function convertSide(side,sha,image){
 if(!side||typeof side!=='object')return {sourceSha:sha,status:'ERROR'};
 return {
  sourceSha:side.revision,status:side.status==='OBSERVED_TEST'?'COMPLETED':'ERROR',
  exitCode:side.status==='OBSERVED_TEST'?side.exitCode:null,
  imageDigest:image,outputSha256:side.stdoutSha256,
  observedAt:side.observedAt
 };
}
export function buildCaseFromSources(pr,first,last,provider,challenge,{now=new Date()}={}){
 if(!pr||!first||!last||!provider||!challenge||
    !matchRepo(first.repository,pr.owner+'/'+pr.repo)||
    !matchRepo(last.repository,pr.owner+'/'+pr.repo)||
    !matchRepo(challenge.repository,pr.owner+'/'+pr.repo)||
    provider.status!=='OBSERVED_EXACT_SHA_RUNS'||!matchRepo(provider.repository,pr.owner+'/'+pr.repo)||
    provider.prNumber!==pr.number||provider.prUrl!==pr.url||!validSha(provider.headSha)||
    provider.headSha.toLowerCase()!==first.headSha||
    !Array.isArray(provider.runs)||provider.runs.length<1||provider.runs.length>30||provider.truncated===true||
    challenge.schema!=='SPECTER_BEHAVIOR_CHALLENGE_V1'||
    challenge.baseSha!==first.baseSha||challenge.headSha!==first.headSha||
    !challenge.reviewerTest||!challenge.observations)
  return buildArenaCaseReport({});
 const observedAt=now.toISOString();
 const observation={
  repository:pr.owner+'/'+pr.repo,prNumber:pr.number,
  baseSha:first.baseSha,headSha:first.headSha,
  recheckedHeadSha:last.headSha===first.headSha&&last.baseSha===first.baseSha?
   last.headSha:'0000000000000000000000000000000000000000',
  observedAt,
  runs:provider.runs.map(r=>({
   id:r.id,status:r.status,conclusion:r.conclusion,headSha:r.headSha
  }))
 };
 const challengeInput={
  approvedTestSha256:challenge.reviewerTest.sha256,
  testSha256:challenge.reviewerTest.sha256,
  base:convertSide(challenge.observations.base,first.baseSha,challenge.image?.imageId),
  head:convertSide(challenge.observations.head,first.headSha,challenge.image?.imageId)
 };
 return buildArenaCaseReport({observation,challenge:challengeInput});
}
export function renderArenaMarkdown(report){
 if(!report||report.schema!=='SPECTER_ARENA_CASE_V1')throw Error('INVALID_CASE_REPORT');
 const r=report.subject,repo=r?.repository??null;
 const link=r&&repo?'https://github.com/'+repo+'/pull/'+r.prNumber:'(unverified PR)';
 const lines=[
  '# Specter Arena — Reviewer case',
  '',
  'PR: '+link,
  'Base: '+(r?.baseSha??'UNKNOWN'),
  'Head: '+(r?.headSha??'UNKNOWN'),
  'Finding: '+report.classification+' (limited to one reviewer-controlled test)',
  '',
  '## Evidence with source and trust',
  ...report.statements.map(s=>'- '+s.id+' ['+s.trust+']: '+s.text),
  '',
  '## Next action',
  report.nextAction.text,
  '',
  '## Boundaries',
  ...report.limitations.map(x=>'- '+x),
  '',
  'This is a REVIEW DRAFT, not a GitHub check, approval, or attestation.'
 ];
 return lines.join('\n')+'\n';
}
export async function collectArenaCase(prUrl,challenge,{fetchImpl=globalThis.fetch,now=new Date()}={}){
 const pr=parsePublicPrUrl(prUrl);
 if(!pr)throw Error('INVALID_PR_URL');
 const first=await pullSnapshot(pr,{fetchImpl});
 const provider=await inspectPublicPr(prUrl,{fetchImpl,now:()=>now});
 const last=await pullSnapshot(pr,{fetchImpl});
 return buildCaseFromSources(pr,first,last,provider,challenge,{now});
}
async function cli(){
 const args=process.argv.slice(2);
 if(args.length!==8||args[0]!=='--pr'||args[2]!=='--challenge'||
    args[4]!=='--out'||args[6]!=='--markdown')
  throw Error('Usage: node scripts/arena-case-cli.mjs --pr https://github.com/owner/repo/pull/1 --challenge challenge.json --out case.json --markdown review.md');
 const challenge=JSON.parse((await readFile(args[3],'utf8')).replace(/^\uFEFF/,''));
 const caseReport=await collectArenaCase(args[1],challenge);
 await writeFile(args[5],JSON.stringify(caseReport,null,2)+'\n',{flag:'wx'});
 await writeFile(args[7],renderArenaMarkdown(caseReport),{flag:'wx'});
 process.stdout.write('Arena case report: '+caseReport.classification+'; '+caseReport.reason+'\n');
 if(caseReport.classification==='UNKNOWN')process.exitCode=2;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 cli().catch(e=>{process.stderr.write('Arena PR inspection: '+e.message+'\n');process.exitCode=1;});
}
