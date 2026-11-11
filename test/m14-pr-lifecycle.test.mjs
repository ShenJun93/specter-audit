import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inspectPublicPr} from '../web/public-pr-evidence.mjs';
import {combineTrial} from '../web/evidence-trial.mjs';

const url='https://github.com/ShenJun93/specter-audit/pull/7';
const sha='bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d';
const run={id:301,workflow_id:42,run_number:1,run_attempt:1,
 head_sha:sha,repository:{full_name:'ShenJun93/specter-audit'},
 status:'completed',conclusion:'success',
 html_url:'https://github.com/ShenJun93/specter-audit/actions/runs/301'};
async function proof(state,draft){
 let calls=0;
 return inspectPublicPr(url,{fetchImpl:async()=>{
  calls++;
  return new Response(JSON.stringify(calls===1?{
   number:7,state,draft,html_url:url,
   base:{repo:{full_name:'ShenJun93/specter-audit'}},head:{sha}
  }:{total_count:1,workflow_runs:[run]}),{status:200,
    headers:{'content-type':'application/json'}});
 }});
}
test('draft PR is explicitly classified even when provider reports successful CI',async()=>{
 const observed=await proof('open',true);
 assert.equal(observed.status,'OBSERVED_EXACT_SHA_RUNS');
 const h=combineTrial(null,observed);
 assert.equal(h.pr.reviewState,'OPEN_DRAFT');
 assert.equal(h.pr.counts.success,1);
 assert.equal(h.repairPlan.checks[1].state,'PROVIDER_SUCCESS_OBSERVED');
 assert.match(h.repairPlan.checks[1].nextAction,/draft/i);
 assert.equal(h.releaseApproved,false);
});
test('closed PR never implies merge, and does not convert green CI into release approval',async()=>{
 const h=combineTrial(null,await proof('closed',false));
 assert.equal(h.pr.reviewState,'CLOSED');
 assert.match(h.repairPlan.checks[1].nextAction,/closed/i);
 assert.match(h.repairPlan.checks[1].nextAction,/merge status not determined/i);
 assert.equal(h.releaseApproved,false);
});
test('non-draft open PR still cannot be certified on observed success alone',async()=>{
 const h=combineTrial(null,await proof('open',false));
 assert.equal(h.pr.reviewState,'OPEN_NON_DRAFT');
 assert.equal(h.allRequiredChecksVerified,false);
 assert.equal(h.localSessionLinkedToPr,false);
});
test('missing or contradictory PR lifecycle inputs remain UNKNOWN',()=>{
 const p={
  source:'GITHUB_PUBLIC_REST_OPT_IN',repository:'ShenJun93/specter-audit',
  prNumber:7,headSha:sha,runs:[{id:301,headSha:sha,status:'completed',conclusion:'success'}],
  status:'OBSERVED_EXACT_SHA_RUNS',state:'merged',draft:false
 };
 assert.equal(combineTrial(null,p).pr.reviewState,'UNKNOWN');
 assert.equal(combineTrial(null,{...p,state:'open',draft:'false'}).pr.reviewState,'UNKNOWN');
 assert.equal(combineTrial(null,{...p,state:'closed',draft:true}).pr.reviewState,'CLOSED');
});
test('invalid provider metadata does not fabricate lifecycle review status',()=>{
 const h=combineTrial(null,{status:'UNKNOWN',state:'open',draft:false});
 assert.equal(h.pr,null);
 assert.equal(h.repairPlan.readyForRelease,false);
});
test('judge page independently exposes PR lifecycle and labels its trust boundary',async()=>{
 const html=await readFile(new URL('../web/pr-proof.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../web/pr-proof.js',import.meta.url),'utf8');
 assert.match(html,/id="pr-lifecycle"/);
 assert.match(html,/Provider-reported PR review status/);
 assert.match(js,/OPEN · DRAFT/);
 assert.match(js,/CLOSED · MERGE NOT DETERMINED/);
 assert.match(js,/PR STATE UNKNOWN/);
 assert.doesNotMatch(js,/MERGED VERIFIED|RELEASE APPROVED/);
});
