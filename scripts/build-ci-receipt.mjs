// M15: bounded self-reported CI test evidence; no Kiro or release attestation.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const MAX_BYTES=8*1024*1024;
const SHA=/^[a-f0-9]{40}$/;
const REPO=/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const FOOTER=/\n1\.\.\d+\n# tests (\d+)\n# suites (\d+)\n# pass (\d+)\n# fail (\d+)\n# cancelled (\d+)\n# skipped (\d+)\n# todo (\d+)\n# duration_ms (\d+(?:\.\d+)?)\n?$/;
const positive=s=>typeof s==='string'&&/^[1-9]\d{0,15}$/.test(s);
// No receipt may claim a commit if local source differs from that commit.
// Exact, fixed, read-only Git argv; no shell, network, or user commands.
const safeGit=args=>execFileSync('git',args,{
 encoding:'utf8',timeout:5000,maxBuffer:65536,windowsHide:true
});
export function validateCiCheckout(expectedSha,{gitRead=safeGit}={}){
 if(typeof expectedSha!=='string'||!SHA.test(expectedSha))
  throw Error('UNVERIFIED_WORKTREE');
 try{
  const head=gitRead(['rev-parse','HEAD']).trim();
  const dirty=gitRead(['status','--porcelain','--untracked-files=normal']).trim();
  if(head!==expectedSha||dirty)throw Error('UNVERIFIED_WORKTREE');
  return true;
 }catch{throw Error('UNVERIFIED_WORKTREE')}
}

export function buildCiReceipt(tap,{sourceSha,repository,eventName,runId,runAttempt,nodeVersion}={}){
 if(typeof tap!=='string'||!tap||Buffer.byteLength(tap,'utf8')>MAX_BYTES||tap.includes('\0'))
  throw Error('INVALID_CI_TEST_REPORT');
 if(typeof sourceSha!=='string'||!SHA.test(sourceSha)||
  typeof repository!=='string'||!REPO.test(repository)||
  !['push','pull_request'].includes(eventName)||!positive(runId)||
  !positive(runAttempt)||typeof nodeVersion!=='string'||!/^v\d+\.\d+\.\d+$/.test(nodeVersion))
  throw Error('INVALID_CI_PROVENANCE');
 const m=tap.replaceAll('\r\n','\n').match(FOOTER);
 if(!m)throw Error('INVALID_CI_TEST_REPORT');
 const nums=m.slice(1,8).map(Number);
 if(!nums.every(x=>Number.isSafeInteger(x)&&x>=0&&x<=100000))
  throw Error('INVALID_CI_TEST_REPORT');
 const [tests,,pass,fail,cancelled,skipped,todo]=nums;
 if(!tests||pass!==tests||fail||cancelled||skipped||todo)throw Error('TESTS_NOT_ALL_PASS');
 return {
  schema:'SPECTER_CI_TEST_RECEIPT_V1',
  kind:'SELF_REPORTED_GITHUB_ACTIONS_TEST_RESULT',
  sourceRepository:repository,sourceCommit:sourceSha,
  github:{event:eventName,runId,runAttempt},
  nodeVersion,testCommand:'node --test --test-reporter=tap',
  testSummary:{tests,pass,fail,cancelled,skipped,todo},
  tapSha256:createHash('sha256').update(tap,'utf8').digest('hex'),
  independentlyAttested:false,localKiroSessionLinked:false,releaseApproved:false,
  limitations:[
   'Receipt fields are self-reported until the exact JSON bytes are externally verified using GitHub Artifact Attestations.',
   'Artifact provenance can bind this file to a workflow and commit, not prove that a saved Kiro session tested this commit.',
   'Passing tests do not certify source correctness, required checks, or release approval.'
  ]
 };
}
async function cli(){
 validateCiCheckout(process.env.GITHUB_SHA);
 const tap=await readFile('out/ci/test.tap','utf8');
 const receipt=buildCiReceipt(tap,{
  sourceSha:process.env.GITHUB_SHA,
  repository:process.env.GITHUB_REPOSITORY,
  eventName:process.env.GITHUB_EVENT_NAME,
  runId:process.env.GITHUB_RUN_ID,
  runAttempt:process.env.GITHUB_RUN_ATTEMPT,
  nodeVersion:process.version
 });
 await mkdir('out/ci',{recursive:true});
 await writeFile('out/ci/receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 process.stdout.write('CI receipt prepared (unsigned until external verification).\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 cli().catch(e=>{
  process.stderr.write('CI receipt rejected: '+(
   ['INVALID_CI_TEST_REPORT','INVALID_CI_PROVENANCE','TESTS_NOT_ALL_PASS','UNVERIFIED_WORKTREE'].includes(e.message)
    ?e.message:'IO_OR_RUNTIME_FAILURE')+'\n');
  process.exitCode=1;
 });
}
