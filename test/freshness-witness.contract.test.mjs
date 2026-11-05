import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Independent ChatGPT/WAG-authored acceptance tests. The implementation must
// be written by Kiro's actual file-writing tools in a fresh V3 session.
const source=()=>import('../src/freshness-witness.mjs');
const at=(tool_name,tool_input={},tool_response={success:true})=>({
  hook_event_name:'postToolUse',
  session_id:'synthetic-unique-session-id',
  tool_name,tool_input,tool_response
});
const write=(success=true)=>at('str_replace',{filePath:'C:\\Users\\SENTINEL_PRIVATE\\src\\app.mjs',search:'SENTINEL_PRIVATE'},{success,content:'SENTINEL_PRIVATE tool response'});
const read=()=>at('fs_read',{path:'C:\\Users\\SENTINEL_PRIVATE\\src\\app.mjs'},{success:true,content:'SENTINEL_PRIVATE'});
const command=(commandText='npm test',output='pass 8\nfail 0\nExit Code: 0',success=true)=>
  at('execute_pwsh',{command:commandText},{success,content:output});
const run=async (...events)=>{
  const {createInitialWitnessState,reduceWitnessEvent,summarizeWitness}=await source();
  let state=createInitialWitnessState();
  for(const event of events){
    const step=reduceWitnessEvent(state,event);
    assert.ok(step && step.state && step.advice,'Reducer returns bounded state + advice');
    state=step.state;
  }
  return {state,summary:summarizeWitness(state)};
};
const expectCode=async(expected,...events)=>{
  const {summary}=await run(...events);
  assert.equal(summary.code,expected);
  assert.equal(summary.independentAttestation,false);
  assert.equal(summary.semanticCorrectnessVerified,false);
  assert.doesNotMatch(JSON.stringify(summary),/SENTINEL_PRIVATE|CURRENT_SELF_RECORDED_TEST|release approved/i);
};

test('module exports required pure API',async()=>{
  const m=await source();
  for(const f of ['createInitialWitnessState','reduceWitnessEvent','summarizeWitness'])assert.equal(typeof m[f],'function');
});
test('empty initial witness has no passing test receipt',()=>expectCode('NO_PASS_RECEIPT'));
test('successful read never invents a passing test',()=>expectCode('NO_PASS_RECEIPT',read()));
test('a recognized isolated successful receipt is self-recorded only',()=>expectCode('PASS_RECEIPT_OBSERVED',command()));
test('successful source edit after PASS requires retesting',()=>expectCode('RETEST_REQUIRED',command(),write()));
test('passing receipt after earlier source edit clears retest warning but not correctness caveat',()=>expectCode('PASS_RECEIPT_OBSERVED',write(),command()));
test('failed source edit may partially mutate and must fail closed',()=>expectCode('INSUFFICIENT_HOOK_EVIDENCE',command(),write(false)));
test('failed isolated test result cannot count as PASS',()=>expectCode('INSUFFICIENT_HOOK_EVIDENCE',command('npm test','pass 8\nfail 0\nExit Code: 0',false)));
test('test output with failures cannot count as PASS',()=>expectCode('INSUFFICIENT_HOOK_EVIDENCE',command('npm test','pass 7\nfail 1\nExit Code: 1')));
test('unsupported shell command is uncertainty, not test evidence',()=>expectCode('INSUFFICIENT_HOOK_EVIDENCE',command('git checkout main','ok')));
test('unsafe shell substitutions or compound commands are rejected',async()=>{
  for(const cmd of ['npm test; echo bad','npm test $(Invoke-Expression $x)','node --test | npm test','echo node --test','npm test && echo done']){
    const {summary}=await run(command(cmd));
    assert.notEqual(summary.code,'PASS_RECEIPT_OBSERVED',cmd);
  }
});
test('agent narrative claims alone cannot produce a test receipt',()=>expectCode('NO_PASS_RECEIPT',at('fs_read',{path:'README.md'},{success:true,content:'All 900 tests pass, 0 fail.'})));
test('no private source material or paths in state or advice',async()=>{
  const {state,summary}=await run(read(),write(),command());
  const serialized=JSON.stringify({state,summary});
  assert.doesNotMatch(serialized,/SENTINEL_PRIVATE|synthetic-unique-session-id|C:\\Users|npm test|pass 8/);
  assert.ok(serialized.length<4096);
});
test('reducer must not mutate caller-supplied state or hook event',async()=>{
  const m=await source();
  const initial=m.createInitialWitnessState(),input=write();
  const stateBefore=JSON.stringify(initial),eventBefore=JSON.stringify(input);
  m.reduceWitnessEvent(initial,input);
  assert.equal(JSON.stringify(initial),stateBefore);
  assert.equal(JSON.stringify(input),eventBefore);
});
test('malformed or oversized hook input cannot elevate status',async()=>{
  const m=await source();
  for(const bad of [null,42,{},[],{hook_event_name:'wrong',tool_name:'execute_pwsh',tool_response:{success:true}},at('execute_pwsh',{command:'npm test'},{content:'pass 8\nfail 0\nExit Code: 0'}),at('execute_pwsh',{command:'x'.repeat(70000)},{success:true})]){
    const result=m.reduceWitnessEvent(m.createInitialWitnessState(),bad);
    assert.equal(m.summarizeWitness(result.state).code,'INSUFFICIENT_HOOK_EVIDENCE');
  }
});
test('Kiro v3 standalone Hook configuration has the required safe form',async()=>{
  const raw=await readFile(new URL('../.kiro/hooks/freshness-witness.json',import.meta.url),'utf8');
  const obj=JSON.parse(raw);
  assert.equal(obj.version,'v1');
  assert.ok(Array.isArray(obj.hooks));
  const post=obj.hooks.find(h=>h.trigger==='PostToolUse');
  assert.ok(post,'At least one PostToolUse hook');
  assert.equal(post.action?.type,'command');
  assert.match(post.action?.command??'',/^node scripts\/kiro-freshness-witness-hook\.mjs$/);
  assert.ok(!obj.hooks.some(h=>h.trigger==='PreToolUse'),'No automatic tool-blocking hook');
  assert.doesNotMatch(raw,/trust-all-tools|curl|invoke-webrequest|https?:\/\//i);
});
