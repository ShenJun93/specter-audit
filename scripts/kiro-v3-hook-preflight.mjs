// M9B synthetic acceptance harness; NOT an installed Kiro hook.
// Real PostFileSave STDIN schema and live trigger remain UNVERIFIED.
import {spawn} from 'node:child_process';
import {access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const MAX_OUTPUT=512;
const APPROVED_WARNING='SPECTER SOURCE CHANGE: A source file was saved after earlier evidence may have been collected. Any previous PASS claim is not sufficient to verify this new source state. Rerun the relevant tests and inspect the new receipt before claiming current results.';
// Kiro forwards hook stdout to the agent's context. Whitelist the entire output.
function validateOutput(kind,stdout,stderr){
 const output=stdout.trim();
 if(kind==='warn'){
  if(!output.includes('SPECTER SOURCE CHANGE:'))return {ok:false,reason:'EXPECTED_SOURCE_WARNING'};
  if(output!==APPROVED_WARNING||stderr.trim())return {ok:false,reason:'UNEXPECTED_HOOK_OUTPUT'};
  return {ok:true};
 }
 if(output.includes('SPECTER SOURCE CHANGE:'))return {ok:false,reason:'FALSE_SOURCE_WARNING'};
 if(output||stderr.trim())return {ok:false,reason:'UNEXPECTED_HOOK_OUTPUT'};
 return {ok:true};
}
const SENSITIVE=/(?:C:\\Users\\|\/Users\/|\/home\/|\/root\/|Bearer\s+|sk-[A-Za-z0-9]|private[_-]?key|api[_-]?key|CANARY_PRIVATE_)/i;
const FALSE_CLAIM=/(?:ALL_TESTS_PASS|RELEASE_APPROVED|INDEPENDENTLY_VERIFIED|TESTS_VERIFIED|CURRENT_SELF_RECORDED_TEST)/i;
const event=(name,file)=>JSON.stringify({hook_event_name:name,cwd:'C:\\SPECTER_SYNTHETIC_WORKSPACE',file_path:file,session_id:'CANARY_PRIVATE_SESSION_123',prompt:'CANARY_PRIVATE_PROMPT_123',api_key:'CANARY_PRIVATE_KEY_123'});
export const SYNTHETIC_CASES=Object.freeze([
  {name:'source-ts',kind:'warn',payload:event('PostFileSave','src/app.ts')},
  {name:'source-js',kind:'warn',payload:event('PostFileSave','src/logic.js')},
  {name:'nested-mjs',kind:'warn',payload:event('PostFileSave','src/lib/worker.mjs')},
  {name:'win-separator',kind:'warn',payload:event('PostFileSave','src\\lib\\worker.tsx')},
  {name:'readme',kind:'silent',payload:event('PostFileSave','README.md')},
  {name:'secrets',kind:'silent',payload:event('PostFileSave','.env')},
  {name:'hooks-config',kind:'silent',payload:event('PostFileSave','.kiro/hooks/guard.json')},
  {name:'private-qa',kind:'silent',payload:event('PostFileSave','qa/private/report.ts')},
  {name:'lockfile',kind:'silent',payload:event('PostFileSave','package-lock.json')},
  {name:'nested-dotenv',kind:'silent',payload:event('PostFileSave','src/.env')},
  {name:'relative-traversal',kind:'silent',payload:event('PostFileSave','src/../.env')},
  {name:'misleading-traversal',kind:'silent',payload:event('PostFileSave','src/foo/../../.env')},
  {name:'other-event',kind:'silent',payload:event('PostToolUse','src/app.ts')},
  {name:'no-file',kind:'silent',payload:JSON.stringify({hook_event_name:'PostFileSave'})},
  {name:'nonstring-file',kind:'silent',payload:JSON.stringify({hook_event_name:'PostFileSave',file_path:['src/app.ts']})},
  {name:'empty-stdin',kind:'silent',payload:''},
  {name:'bad-json',kind:'silent',payload:'{"hook_event_name":"PostFileSave","file_path":'},
  {name:'oversized-stdin',kind:'silent',payload:' '.repeat(8500)}
]);
function completed(code,stdout,stderr,timeout,error){
  if(error)return {ok:false,reason:'SPAWN_FAILED'};
  if(timeout)return {ok:false,reason:'TIMEOUT'};
  // Killing on excess output makes the process exit nonzero: report the true cause.
  if(Buffer.byteLength(stdout,'utf8')>MAX_OUTPUT||Buffer.byteLength(stderr,'utf8')>MAX_OUTPUT)
    return {ok:false,reason:'OUTPUT_TOO_LONG'};
  if(code!==0)return {ok:false,reason:'NONZERO_EXIT'};
  if(SENSITIVE.test(stdout)||SENSITIVE.test(stderr))return {ok:false,reason:'SENSITIVE_OUTPUT'};
  if(FALSE_CLAIM.test(stdout)||FALSE_CLAIM.test(stderr))return {ok:false,reason:'UNSUPPORTED_ATTESTATION'};
  return {ok:true};
}
export async function evaluateHandler(handlerPath,{
  timeoutMs=2000,
  cases=SYNTHETIC_CASES,
  launch=(path)=>[process.execPath,[path]]
}={}){
  if(typeof handlerPath!=='string'||!handlerPath.trim())
    return {status:'BLOCKED_NO_HANDLER',tested:0,passed:0,failed:[],schemaVerified:false,liveKiroVerified:false};
  const resolved=resolve(handlerPath);
  try{await access(resolved)}catch{
    return {status:'BLOCKED_NO_HANDLER',tested:0,passed:0,failed:[],schemaVerified:false,liveKiroVerified:false};
  }
  if(!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>3000)
    return {status:'INVALID_CONFIGURATION',tested:0,passed:0,failed:[],schemaVerified:false,liveKiroVerified:false};
  const failures=[];
  for(const scenario of cases){
    const [exe,args]=launch(resolved);
    const result=await new Promise(resolve=>{
      let stdout='',stderr='',timeout=false,err=null;
      let child;
      try{child=spawn(exe,args,{shell:false,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{SystemRoot:process.env.SystemRoot??'C:\\Windows',SPECTER_M9B_SYNTHETIC_PREFLIGHT:'1'}})}
      catch{resolve({ok:false,reason:'SPAWN_FAILED'});return}
      const timer=setTimeout(()=>{timeout=true;child.kill()},timeoutMs);
      const receive=(which,chunk)=>{
        const text=chunk.toString('utf8');
        if(which==='stdout')stdout+=text;else stderr+=text;
        if(Buffer.byteLength(stdout,'utf8')>MAX_OUTPUT||Buffer.byteLength(stderr,'utf8')>MAX_OUTPUT)child.kill();
      };
      child.stdout.on('data',x=>receive('stdout',x));
      child.stderr.on('data',x=>receive('stderr',x));
      child.on('error',e=>{err=e});
      child.on('close',code=>{
        clearTimeout(timer);
        const base=completed(code,stdout,stderr,timeout,err);
        if(!base.ok){resolve(base);return}
        resolve(validateOutput(scenario.kind,stdout,stderr));
      });
      child.stdin.on('error',()=>{});
      child.stdin.end(scenario.payload);
    });
    if(!result.ok)failures.push({case:scenario.name,reason:result.reason});
  }
  return {
    schema:'SPECTER_M9B_SYNTHETIC_PREFLIGHT_V1',
    status:failures.length?'SYNTHETIC_CONTRACT_FAIL':'SYNTHETIC_CONTRACT_PASS_ONLY',
    tested:cases.length,passed:cases.length-failures.length,failed:failures,
    schemaVerified:false,liveKiroVerified:false,networkIsolationVerified:false,
    noFilesystemMutationVerified:false,
    limitations:['Synthetic file_path envelope is NOT confirmed Kiro V3 STDIN.',
      'Passing does not prove Kiro triggered a hook or that PASS/STALE is valid.',
      'Network and filesystem side effects require separate sandbox and live verification.']
  };
}
async function main(){
 const args=process.argv.slice(2);
 const handler=args[0]==='--handler'&&args.length===2?args[1]:null;
 const report=await evaluateHandler(handler);
 process.stdout.write(JSON.stringify(report)+'\n');
 if(report.status!=='SYNTHETIC_CONTRACT_PASS_ONLY')process.exitCode=3;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
