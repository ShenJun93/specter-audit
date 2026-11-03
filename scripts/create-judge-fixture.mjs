// Reproducible judge fixture; all Git mutations are scoped to a fresh temp directory.
// Never accepts an existing repository path or executes arbitrary shell commands.
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const exec = promisify(execFile);
const SCENARIOS = Object.freeze([
  { id:'unverified', label:'Unsupported test claim', claim:'all tests pass', expected:'UNVERIFIED',
    explanation:'No tests are executed by Specter Audit. Even self-reported exitCode=0 is not independent proof.' },
  { id:'partial', label:'Change plus unverified test claim', claim:'updated auth login and all tests pass', expected:'PARTIAL',
    explanation:'The tracked auth file changed, but the test result remains unverified.' },
  { id:'supported', label:'Git path alignment only', claim:'updated auth login validation', expected:'SUPPORTED',
    explanation:'The Git change path corresponds to the claim. Semantic correctness is NOT established.' },
]);
async function git(cwd, args) {
  return (await exec('git',args,{cwd,shell:false,windowsHide:true,timeout:10000,maxBuffer:256*1024,
    env:{...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1'}})).stdout.trim();
}
export async function createJudgeFixture() {
  // Always create a fresh repository with a random name under the OS temp directory.
  const dir=await mkdtemp(path.join(tmpdir(),'specter-judge-'));
  const mkdirIn=async(relative)=>mkdir(path.join(dir,relative),{recursive:true});
  const writeIn=async(relative,content)=>writeFile(path.join(dir,relative),content,'utf8');
  await git(dir,['init','-b','main']);
  await git(dir,['config','user.name','Specter Demo Fixture']);
  await git(dir,['config','user.email','fixture@local.invalid']);
  await git(dir,['config','commit.gpgsign','false']);
  await mkdirIn('src/auth');
  await mkdirIn('docs');
  await writeIn('src/auth/login.mjs','export function allowLogin(value) { return Boolean(value); }\n');
  await writeIn('docs/README.md','# Specter demo fixture\nThis is generated test data.\n');
  await git(dir,['add','--','src/auth/login.mjs','docs/README.md']);
  await git(dir,['-c','commit.gpgsign=false','commit','-m','Initial synthetic fixture baseline','--no-verify']);
  const head=await git(dir,['rev-parse','HEAD']);
  // Intentionally changed tracked file; NOT evidence that the login code is correct.
  await writeIn('src/auth/login.mjs','export function allowLogin(value) { return value === true; }\n');
  await writeIn('docs/judge-observations.md','This file is untracked synthetic demo content.\n');
  const receipt={exitCode:0,head,timestamp:new Date().toISOString(),command:'npm test'};
  return {dir,head,receipt,scenarios:SCENARIOS.map(s=>({...s,receipt:s.id==='unverified'||s.id==='partial'?receipt:null}))};
}
async function main(){
  const result=await createJudgeFixture();
  process.stdout.write(JSON.stringify({
    schema:'SPECTER_SYNTHETIC_JUDGE_FIXTURE_V1',repoPath:result.dir,head:result.head,
    scenarios:result.scenarios,warning:'Synthetic local Git fixture; no test execution was performed.'
  },null,2)+'\n');
  process.stdout.write('\nRun local server: node src/http-server.mjs --repo="'+result.dir+'"\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  main().catch(e=>{process.stderr.write('Fixture creation failed: '+e.message+'\n');process.exitCode=1;});
}
