import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {combineTrial} from '../web/evidence-trial.mjs';

const sha='bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d';
const run=(id,status,conclusion)=>({id,headSha:sha,status,conclusion});
const provider=(runs,truncated=false)=>({
 source:'GITHUB_PUBLIC_REST_OPT_IN',status:'OBSERVED_EXACT_SHA_RUNS',
 repository:'ShenJun93/specter-audit',prNumber:7,headSha:sha,
 runs,counts:{success:999,failure:0,inProgress:0,other:0},truncated
});
test('a failed exact-SHA run is a first-class red flag even alongside successful runs',()=>{
 const h=combineTrial(null,provider([run(1,'completed','success'),run(2,'completed','failure')]));
 assert.equal(h.pr.workflowFinding,'FAILED_RUNS_OBSERVED');
 assert.equal(h.suggestedAction,'INVESTIGATE_FAILED_PR_WORKFLOWS');
 assert.equal(h.pr.counts.failure,1);
 assert.equal(h.releaseApproved,false);
});
test('pending runs cannot masquerade as a completed green verdict',()=>{
 const h=combineTrial(null,provider([run(1,'completed','success'),run(2,'in_progress',null)]));
 assert.equal(h.pr.workflowFinding,'RUNS_IN_PROGRESS');
 assert.equal(h.suggestedAction,'WAIT_FOR_PR_WORKFLOWS');
 assert.equal(h.releaseApproved,false);
});
test('nonpassing neutral and skipped runs require review, not success labeling',()=>{
 const h=combineTrial(null,provider([run(1,'completed','success'),run(2,'completed','neutral')]));
 assert.equal(h.pr.workflowFinding,'NON_PASS_RUNS_OBSERVED');
 assert.equal(h.suggestedAction,'REQUIRE_SUCCESSFUL_EXACT_SHA_CI');
});
test('first-page truncation keeps the observed run sample incomplete',()=>{
 const h=combineTrial(null,provider([run(1,'completed','success')],true));
 assert.equal(h.pr.workflowFinding,'PARTIAL_RUN_SAMPLE');
 assert.equal(h.suggestedAction,'REVIEW_UNOBSERVED_CI_RUNS');
});
test('all observed runs success is still not required-check certification',()=>{
 const h=combineTrial(null,provider([run(1,'completed','success')]));
 assert.equal(h.pr.workflowFinding,'SUCCESSFUL_RUNS_OBSERVED');
 assert.equal(h.allRequiredChecksVerified,false);
 assert.equal(h.localSessionLinkedToPr,false);
});
test('malformed provider records stay unknown and cannot become success',()=>{
 const h=combineTrial(null,provider([run(1,'completed','success'),run(1,'completed','success')]));
 assert.equal(h.pr.status,'UNKNOWN');
 assert.equal(h.pr.workflowFinding,'CI_UNVERIFIED');
 assert.equal(h.pr.counts,null);
});
test('PR page distinguishes failed and pending workflows from mere observation',async()=>{
 const js=await readFile(new URL('../web/pr-proof.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../web/pr-proof.css',import.meta.url),'utf8');
 assert.match(js,/FAILED RUNS OBSERVED/);
 assert.match(js,/RUNS STILL ACTIVE/);
 assert.match(js,/PARTIAL WORKFLOW SAMPLE/);
 assert.match(css,/\.pr-status\.risk/);
 assert.match(css,/\.pr-status\.pending/);
});
test('Trial UI never uses its positive green marker for provider observations',async()=>{
 const js=await readFile(new URL('../web/trial-ui.mjs',import.meta.url),'utf8');
 assert.match(js,/FAILED RUN OBSERVED/);
 assert.match(js,/RUNS IN PROGRESS/);
 assert.match(js,/trial-observed/);
 const status=js.match(/\$\('trial-pr-status'\)\.className=[\s\S]*?;/);
 assert.ok(status);
 assert.doesNotMatch(status[0],/trial-positive/);
});
