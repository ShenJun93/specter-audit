// M118 Specter Arena. Reviewer-approved, Docker-only Node.js behavior challenge.
// Runs EXACT same reviewer test against one immutable file from each Git commit.
// No arbitrary npm command, test upload, host execution, or Git mutation.
import {createHash,randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {readFile,realpath,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SHA=/^[0-9a-f]{40}$/i;
const DIGEST=/^[0-9a-f]{64}$/i;
const IMAGE='node:24-alpine';
const MAX_TEST_BYTES=32768;
const MAX_SOURCE_BYTES=256*1024;
const LIMITED_OUTPUT=50000;

const REPO=/^[a-z0-9-]{1,39}\/[a-z0-9][a-z0-9._-]{0,99}$/i;
const SOURCE=/^(?:src|lib)\/[a-z0-9._/-]+\.mjs$/i;
const sha256=(value)=>createHash('sha256').update(value).digest('hex');
function safePath(p) {
 return typeof p==='string'&&SOURCE.test(p)&&!p.includes('..')&&!p.includes('//')&&!p.includes('\\')&&!p.split('/').some(x=>x==='.');
}
export function validateManifest(m){
 if(!m||typeof m!=='object'||Array.isArray(m)||m.schema!=='SPECTER_REVIEWER_CHALLENGE_V1'||
    !REPO.test(m.repository)||typeof m.repoPath!=='string'||m.repoPath.length>1024||
    !SHA.test(m.baseSha)||!SHA.test(m.headSha)||m.baseSha.toLowerCase()===m.headSha.toLowerCase()||
    !safePath(m.sourcePath)||typeof m.testPath!=='string'||m.testPath.length>1024||
    !DIGEST.test(m.testSha256)||typeof m.expectedBehavior!=='string'||
    m.expectedBehavior.trim().length<5||m.expectedBehavior.length>500)
  throw Error('INVALID_REVIEWER_CHALLENGE_MANIFEST');
 return {repository:m.repository,repoPath:m.repoPath,baseSha:m.baseSha.toLowerCase(),
  headSha:m.headSha.toLowerCase(),sourcePath:m.sourcePath,testPath:m.testPath,
  testSha256:m.testSha256.toLowerCase(),expectedBehavior:m.expectedBehavior.trim()};
}
export function parseTap(stdout) {
 if(typeof stdout!=='string'||Buffer.byteLength(stdout)>LIMITED_OUTPUT)return null;
 const rows=stdout.replaceAll('\r\n','\n').trim().split('\n');
 const find=(name)=>{
  const matches=rows.filter(row=>new RegExp('^# '+name+' (\\d+)$').test(row.trim()));
  if(matches.length!==1)return null;
  const v=Number(matches[0].trim().slice(name.length+3));
  return Number.isSafeInteger(v)?v:null;
 };
 const tests=find('tests'),passed=find('pass'),failed=find('fail'),
  skipped=find('skipped'),cancelled=find('cancelled');
 if([tests,passed,failed,skipped,cancelled].some(v=>v===null)||tests<1||
    passed+failed+skipped+cancelled!==tests||skipped||cancelled) return null;
 return {tests,passed,failed,skipped,cancelled};
}
export function classifyBehavior(base,head){
 const good=(r)=>r&&r.status==='OBSERVED_TEST'&&r.tap&&Number.isInteger(r.exitCode)&&
  (r.exitCode===0||r.exitCode===1)&&r.tap.tests>=1&&
  r.tap.passed+r.tap.failed===r.tap.tests&&r.tap.skipped===0&&r.tap.cancelled===0&&
  (r.exitCode===0?r.tap.failed===0:r.tap.failed>0);
 if(!good(base)||!good(head))return 'UNKNOWN';
 if(base.exitCode===0&&head.exitCode!==0)return 'REGRESSION';
 if(base.exitCode!==0&&head.exitCode===0)return 'DEMONSTRATED_FIX';
 if(base.exitCode===0&&head.exitCode===0)return 'BOTH_PASS';
 return 'BOTH_FAIL';
}
function run(file,args,{cwd,timeout=10000,maxBuffer=LIMITED_OUTPUT}={}){
 return new Promise(resolve=>{
  execFile(file,args,{cwd,timeout,windowsHide:true,maxBuffer,encoding:'utf8',shell:false},
   (error,stdout,stderr)=>resolve({error,stdout:String(stdout??''),stderr:String(stderr??''),
     exitCode:error?typeof error.code==='number'?error.code:null:0,
     timedOut:Boolean(error?.killed),truncated:error?.code==='ERR_CHILD_PROCESS_STDIO_MAXBUFFER'}));
 });
}
function successful(r,code='HOST_COMMAND_FAILED'){
 if(r.error)throw Error(code);
 return r.stdout.trim();
}

async function dockerTest(dir,testPath,imageId,revision){
 const name='specter-arena-'+randomUUID().slice(0,12);
 const mounts=['type=bind,source='+dir+',target=/workspace,readonly',
  'type=bind,source='+testPath+',target=/reviewer/challenge.test.mjs,readonly'];
 const args=['run','--pull=never','--rm','--name',name,'--network=none','--read-only',
  '--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit=64',
  '--memory=384m','--memory-swap=384m','--cpus=1','--user=65534:65534',
  '--tmpfs','/tmp:rw,nosuid,noexec,size=32m'];
 for(const mount of mounts)args.push('--mount',mount);
 args.push(imageId,'node','--test','--test-reporter=tap','/reviewer/challenge.test.mjs');
 let result;
 try{ result=await run('docker',args,{timeout:18000,maxBuffer:LIMITED_OUTPUT});}
 finally{
  // A dead Docker CLI may leave the container running; force cleanup.
  await run('docker',['rm','-f',name],{timeout:5000,maxBuffer:4096});
 }
 const tap=parseTap(result.stdout);
 const status=!result.timedOut&&!result.truncated&&result.exitCode!==null&&
  result.exitCode<=1&&tap?'OBSERVED_TEST':'UNKNOWN';
 return {revision,observedAt:new Date().toISOString(),status,exitCode:status==='OBSERVED_TEST'?result.exitCode:null,
  tap:status==='OBSERVED_TEST'?tap:null,
  stdoutSha256:sha256(result.stdout),stderrSha256:sha256(result.stderr),
  stdoutBytes:Buffer.byteLength(result.stdout),stderrBytes:Buffer.byteLength(result.stderr),
  failureReason:status==='OBSERVED_TEST'?null:
   result.timedOut?'TIMEOUT':result.truncated?'OUTPUT_TOO_LARGE':'TEST_EXECUTION_UNVERIFIED'};
}
export async function runApprovedChallenge(manifest,{approval=false}={}){
 const m=validateManifest(manifest);
 if(approval!==true)throw Error('REVIEWER_APPROVAL_REQUIRED');
 const [repoRoot,testFile]=await Promise.all([realpath(m.repoPath),realpath(m.testPath)]);
 if(testFile.toLowerCase().startsWith(repoRoot.toLowerCase()+path.sep.toLowerCase()))
  throw Error('REVIEWER_TEST_MUST_BE_OUTSIDE_REPOSITORY');
 const test=await readFile(testFile);
 if(!test.length||test.length>MAX_TEST_BYTES||sha256(test)!==m.testSha256)
  throw Error('REVIEWER_TEST_HASH_MISMATCH');
 const remote=successful(await run('git',['-C',repoRoot,'remote','get-url','origin']), 'INVALID_GIT_REMOTE');
 const expected='https://github.com/'+m.repository+'.git';
 if(remote.toLowerCase()!==expected.toLowerCase()&&remote.toLowerCase()!==expected.slice(0,-4).toLowerCase())
  throw Error('GIT_REMOTE_REPOSITORY_MISMATCH');
 for(const revision of [m.baseSha,m.headSha]){
  const type=successful(await run('git',['-C',repoRoot,'cat-file','-t',revision]),'INVALID_GIT_COMMIT');
  if(type!=='commit')throw Error('INVALID_GIT_COMMIT');
 }
 const image=successful(await run('docker',['image','inspect',IMAGE,'--format','{{.Id}}'],{timeout:6000}),
  'DOCKER_IMAGE_NOT_PRESENT');
 if(!/^sha256:[0-9a-f]{64}$/.test(image))throw Error('UNVERIFIED_DOCKER_IMAGE');
 const stage=await mkdtemp(path.join(tmpdir(),'specter-arena-'));
 try{
  const runs={};
  for(const [kind,revision] of [['base',m.baseSha],['head',m.headSha]]){
   const code=await run('git',['-C',repoRoot,'show',revision+':'+m.sourcePath],
    {timeout:8000,maxBuffer:MAX_SOURCE_BYTES+100});
   if(code.error||!code.stdout||code.stdout.includes('\uFFFD')||code.stdout.includes('\0')||
      Buffer.byteLength(code.stdout,'utf8')>MAX_SOURCE_BYTES)
    throw Error('SOURCE_BLOB_UNAVAILABLE');
   const folder=path.join(stage,kind);
   await mkdir(folder);
   await writeFile(path.join(folder,'candidate.mjs'),code.stdout,{encoding:'utf8',flag:'wx'});
   runs[kind]=await dockerTest(folder,testFile,image,revision);
  }
  const result=classifyBehavior(runs.base,runs.head);
  return {
   schema:'SPECTER_BEHAVIOR_CHALLENGE_V1',
   authority:'LOCAL_REVIEWER_INVOCATION_NOT_ATTESTED',
   repository:m.repository,baseSha:m.baseSha,headSha:m.headSha,sourcePath:m.sourcePath,
   reviewerTest:{sha256:m.testSha256,expectedBehavior:m.expectedBehavior,
     approval:'EXPLICIT_LOCAL_CLI_FLAG_NOT_AUTHENTICATED'},
   image:{reference:IMAGE,imageId:image},
   isolation:{network:'none',root:'readonly',user:'65534:65534',memoryMb:384,cpus:1,pids:64},
   observations:runs,result,
   limitations:['The local runner is not independently attested.',
    'Result applies only to the exact reviewer-approved behavior test and two immutable file revisions.',
    'A Docker container is not an assurance against hostile kernel/container-escape vulnerabilities.',
    'An external PR HEAD must be separately checked after execution; this report alone does not bind it to GitHub.']
  };
 }finally{await rm(stage,{recursive:true,force:true})}
}
async function cli(){
 const args=process.argv.slice(2);
 if(args.length!==5||args[0]!=='--manifest'||args[2]!=='--out'||
    args[4]!=='--i-reviewed-test-and-accept-execution')
  throw Error('Usage: node scripts/arena-challenge-runner.mjs --manifest manifest.json --out report.json --i-reviewed-test-and-accept-execution');
 const m=JSON.parse((await readFile(args[1],'utf8')).replace(/^\uFEFF/,''));
 const result=await runApprovedChallenge(m,{approval:true});
 await writeFile(args[3],JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 process.stdout.write('Behavior challenge complete: '+result.result+' (local, bounded)\n');
 if(result.result==='UNKNOWN')process.exitCode=2;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 cli().catch(e=>{process.stderr.write('Arena challenge: '+e.message+'\n');process.exitCode=1;});
}
