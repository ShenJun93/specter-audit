// Operator-only M6B capture of public GitHub Actions evidence.
// No visitor-triggered request, no tokens, no arbitrary URLs, no dependency.
// This script makes no claims of independent attestation or code correctness.
import { execFileSync } from 'node:child_process';
import { writeFile, rename, rm } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OWNER='ShenJun93', REPO='specter-audit', WORKFLOW=405703749;
const OLD='374af1417b714619d9edc1af790f7e7db15a71ca';
const CURRENT='b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e';
const PROVIDER_RUNS=[
  {id:41736082288,sha:OLD,runNumber:6},
  {id:41742626694,sha:CURRENT,runNumber:9}
];
const usage='Use: node scripts/capture-alibi-cases.mjs --capture (operator only)';
if(process.argv.length!==3||process.argv[2]!=='--capture'){
  console.error(usage);process.exitCode=2;
}else{
  try{await capture();}catch(error){
    console.error('ALIBI_CAPTURE_REJECTED:',error.message);
    process.exitCode=1;
  }
}
async function capture(){
  const capturedAt=new Date().toISOString();
  const actualHead=execFileSync('git',['rev-parse','HEAD'],{
    cwd:ROOT,encoding:'utf8',timeout:6000,maxBuffer:1024,windowsHide:true,
    env:{...process.env,GIT_PAGER:'cat'}
  }).trim();
  // Running from v2 branch is allowed, but the historical commit must
  // exist locally and must not be inferred from the working tree.
  if(!/^[a-f0-9]{40}$/.test(actualHead))throw Error('Invalid repository HEAD');
  const lines=execFileSync('git',['--no-pager','log','--format=%H|%P|%cI','-n','90',CURRENT],{
    cwd:ROOT,encoding:'utf8',timeout:7000,maxBuffer:50_000,windowsHide:true,
    env:{...process.env,GIT_PAGER:'cat',GIT_CONFIG_NOSYSTEM:'1'}
  }).trim().split(/\r?\n/);
  const commits=lines.map(line=>{
    const [sha,parents,date,...rest]=line.split('|');
    if(rest.length || !/^[a-f0-9]{40}$/.test(sha)||!Number.isFinite(Date.parse(date))){
      throw Error('Unsafe Git history record');
    }
    return {sha,parents:parents?parents.split(' '):[],committedAt:new Date(date).toISOString()};
  });
  if(!commits.some(x=>x.sha===CURRENT&&x.parents.includes(OLD))){
    throw Error('Expected production ancestry not found; refusing to invent stale evidence');
  }
  const checks=[];
  for(const wanted of PROVIDER_RUNS){
    const url=`https://api.github.com/repos/${OWNER}/${REPO}/actions/runs/${wanted.id}`;
    const res=await fetch(url,{
      headers:{Accept:'application/vnd.github+json','User-Agent':'specter-alibi-readonly-capture'},
      signal:AbortSignal.timeout(12000),redirect:'error'
    });
    if(!res.ok)throw Error('GitHub returned HTTP '+res.status+' for run '+wanted.id);
    const len=Number(res.headers.get('content-length')??0);
    if(len>180000)throw Error('Oversized GitHub run response');
    const raw=await res.text();if(raw.length>180000)throw Error('Oversized run JSON');
    const j=JSON.parse(raw);
    const canonical=`https://github.com/${OWNER}/${REPO}/actions/runs/${wanted.id}`;
    if(j.id!==wanted.id || j.workflow_id!==WORKFLOW || j.head_sha!==wanted.sha ||
       j.run_number!==wanted.runNumber || j.run_attempt!==1 ||
       j.status!=='completed' || j.conclusion!=='success' ||
       j.html_url!==canonical || !Number.isFinite(Date.parse(j.updated_at)) ||
       Date.parse(j.updated_at)>Date.parse(capturedAt)){
      throw Error('Provider run identity/result mismatch for '+wanted.id);
    }
    checks.push({
      runId:j.id,sha:j.head_sha,workflowId:j.workflow_id,runNumber:j.run_number,
      runAttempt:j.run_attempt,status:j.status,conclusion:j.conclusion,
      updatedAt:j.updated_at,sourceUrl:j.html_url,origin:'RECORDED_GITHUB_PROVIDER'
    });
  }
  const core={schema:'SPECTER_ALIBI_CASE_V1',
    repo:{owner:OWNER,name:REPO,workflowId:WORKFLOW},
    target:{
      sha:CURRENT,
      claim:'Hypothetical agent claims tests passed for current merge; examine the cited run SHA.',
      observedAt:capturedAt
    },
    commits,capturedAt
  };
  const cases=[
    {id:'stale-artifact',title:'The Alibi From Another Commit',
      label:'REAL PROVIDER RUN / HYPOTHETICAL CLAIM',
      explanation:'An older successful workflow was captured for an ancestor SHA, not the current target SHA. This demonstrates why reusing that specific receipt is stale; it does not claim current CI is missing.',
      input:{...core,checks:[checks[0]]},expectedStatus:'STALE_EVIDENCE'},
    {id:'current-exact-run',title:'The Current Commit Has Its Own CI',
      label:'REAL PROVIDER RUN / HYPOTHETICAL CLAIM',
      explanation:'A distinct successful run exists for the exact target SHA. That supersedes an older artifact for workflow status, but does not prove the code is correct.',
      input:{...core,checks},expectedStatus:'PROVIDER_REPORTED_PASS'},
    {id:'no-artifact-presented',title:'A Claim Without a Receipt',
      label:'NO EVIDENCE INPUT / SYNTHETIC SCENARIO',
      explanation:'No run was supplied to this fictional case. This is a missing-evidence exercise, not a statement that the real repository has no CI run.',
      input:{...core,checks:[]},expectedStatus:'INSUFFICIENT_EVIDENCE'}
  ];
  const {analyzeAlibiCase}=await import('../src/alibi-engine.mjs');
  const complete=cases.map(c=>{
    const verdict=analyzeAlibiCase(c.input);
    if(verdict.status!==c.expectedStatus)throw Error('Engine disagrees with '+c.id+': '+verdict.status);
    return {...c,verdict};
  });
  const json=JSON.stringify({
    schema:'SPECTER_ALIBI_EXHIBITS_V1',
    capturedAt,
    fixedPublicRepo:`${OWNER}/${REPO}`,
    targetCommit:CURRENT,
    providerSource:'Operator-captured unauthenticated GitHub Actions REST; provider-reported, not signed',
    caseProvenance:'Hypothetical claim text; real linked Git commits and CI run metadata',
    cases:complete
  },null,2)+'\n';
  const target=join(ROOT,'web','alibi-cases.json');
  const tmp=target+'.tmp-'+process.pid;
  try{await writeFile(tmp,json,{flag:'wx'});await rename(tmp,target)}
  finally{await rm(tmp,{force:true}).catch(()=>{})}
  console.log(JSON.stringify({result:'ALIBI_REAL_PROVIDER_CASES_CAPTURED',
    capturedAt,headAtCapture:actualHead,sourceRunIds:checks.map(c=>c.runId),
    targetSha:CURRENT,exhibits:complete.map(c=>({id:c.id,status:c.verdict.status})),bytes:json.length}));
}
