import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {combineTrial,summarizeLocalSession,syntheticTrial} from '../web/evidence-trial.mjs';

const sha='bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d';
const run=(id,status,conclusion)=>({id,headSha:sha,status,conclusion});
const provider=(runs,truncated=false)=>({
 source:'GITHUB_PUBLIC_REST_OPT_IN',status:'OBSERVED_EXACT_SHA_RUNS',
 repository:'ShenJun93/specter-audit',prNumber:7,headSha:sha,
 runs,counts:{success:500,failure:0,inProgress:0,other:0},truncated
});
const states=h=>Object.fromEntries(h.repairPlan.checks.map(c=>[c.id,c.state]));

test('no evidence gives three separately actionable gaps with no release approval',()=>{
 const h=combineTrial(null,null);
 assert.equal(h.repairPlan.schema,'SPECTER_EVIDENCE_REPAIR_PLAN_V1');
 assert.deepEqual(states(h),{
  KIRO_TEST_FRESHNESS:'NOT_INSPECTED',
  PR_HEAD_CI:'NOT_INSPECTED',
  SESSION_TO_COMMIT:'UNBOUND'
 });
 assert.equal(h.repairPlan.readyForRelease,false);
 assert.equal(h.releaseApproved,false);
});
test('stale local test and successful exact SHA CI produce separate remediation steps',()=>{
 const h=combineTrial(summarizeLocalSession(syntheticTrial('stale'),{synthetic:true}),
  provider([run(1,'completed','success')]));
 assert.equal(states(h).KIRO_TEST_FRESHNESS,'SYNTHETIC_STALE');
 assert.equal(states(h).PR_HEAD_CI,'PROVIDER_SUCCESS_OBSERVED');
 assert.equal(states(h).SESSION_TO_COMMIT,'UNBOUND');
 assert.match(h.repairPlan.checks[0].nextAction,/retest/i);
 assert.equal(h.repairPlan.readyForRelease,false);
});
test('new self-recorded retest changes only local state; never closes independent link',()=>{
 const l=summarizeLocalSession(syntheticTrial('retested'),{synthetic:true});
 const h=combineTrial(l,provider([run(1,'completed','success')]));
 assert.equal(states(h).KIRO_TEST_FRESHNESS,'SYNTHETIC_CURRENT');
 assert.equal(states(h).SESSION_TO_COMMIT,'UNBOUND');
 assert.equal(h.localSessionLinkedToPr,false);
 assert.equal(h.repairPlan.readyForRelease,false);
});
test('real imported current session is self-recorded rather than independently verified',()=>{
 const l=summarizeLocalSession(syntheticTrial('retested'),{synthetic:false});
 const h=combineTrial(l,provider([run(1,'completed','success')]));
 assert.equal(states(h).KIRO_TEST_FRESHNESS,'SELF_RECORDED_CURRENT');
 assert.equal(h.independentlyAttested,false);
});
test('failed and in-progress provider receipts remain separate from local freshness',()=>{
 const local=summarizeLocalSession(syntheticTrial('stale'));
 assert.equal(states(combineTrial(local,provider([run(1,'completed','failure')]))).PR_HEAD_CI,'FAILED');
 assert.equal(states(combineTrial(local,provider([run(1,'in_progress',null)]))).PR_HEAD_CI,'IN_PROGRESS');
 assert.equal(states(combineTrial(local,provider([run(1,'completed','neutral')]))).PR_HEAD_CI,'NON_PASS');
 assert.equal(states(combineTrial(local,provider([run(1,'completed','success')],true))).PR_HEAD_CI,'TRUNCATED');
});
test('invalid provider evidence is UNKNOWN despite green-looking input',()=>{
 const h=combineTrial(null,provider([{id:1,headSha:'a'.repeat(40),status:'completed',conclusion:'success'}]));
 assert.equal(states(h).PR_HEAD_CI,'UNKNOWN');
 assert.equal(h.repairPlan.readyForRelease,false);
});
test('sanitized plan contains no raw path or input controlled provider secrets',()=>{
 const local=summarizeLocalSession(syntheticTrial('stale').replaceAll('src/synthetic-proof.mjs','SECRET_PATH_CANARY'));
 const p={...provider([run(1,'completed','success')]),auth:'SECRET_TOKEN_CANARY'};
 const txt=JSON.stringify(combineTrial(local,p));
 for(const secret of ['SECRET_PATH_CANARY','SECRET_TOKEN_CANARY','toolCallId','filePath','sessionId']){
  assert.equal(txt.includes(secret),false,secret);
 }
 assert.ok(txt.length<3100);
});
test('review UI contains real plan region and renders sanitized steps as text nodes',async()=>{
 const html=await readFile(new URL('../web/pr-proof.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../web/trial-ui.mjs',import.meta.url),'utf8');
 assert.match(html,/id="trial-repair-list"/);
 assert.match(html,/aria-labelledby="trial-repair-title"/);
 assert.match(js,/hearing\.repairPlan\.checks/);
 assert.match(js,/createElement\('li'\)/);
 assert.match(js,/\.textContent=/);
 assert.doesNotMatch(js,/\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b/);
});
