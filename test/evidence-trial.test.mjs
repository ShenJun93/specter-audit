import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeLocalSession,combineTrial,syntheticTrial} from '../web/evidence-trial.mjs';

const sha='bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d';
const provider=(status='OBSERVED_EXACT_SHA_RUNS')=>({
 source:'GITHUB_PUBLIC_REST_OPT_IN',status,repository:'ShenJun93/specter-audit',
 prNumber:7,headSha:sha,
 runs:[{id:45,status:'completed',conclusion:'success'},{id:46,status:'completed',conclusion:'success'}],
 counts:{success:2,failure:0,other:0,inProgress:0},truncated:false,
 // These supplied strings must never leak, even if a provider returns them:
 privateSessionId:'LEAK_SESSION_CANARY',html:'<script>LEAK_SCRIPT_CANARY</script>',
 providerAuth:'LEAK_TOKEN_CANARY'
});
test('stale synthetic demonstrates a test followed by source edit',()=>{
 const l=summarizeLocalSession(syntheticTrial('stale'),{synthetic:true});
 assert.equal(l.verdict,'STALE_LOCAL_TEST_EVIDENCE');
 assert.equal(l.source,'EXPLICITLY_SYNTHETIC_EXAMPLE');
 assert.ok(l.counts.observedPassingTests>=1);
 assert.ok(l.counts.observedSourceEdits>=1);
 assert.equal(l.localSessionLinkedToPr,false);
});
test('retest synthetic never establishes a PR commit binding',()=>{
 const l=summarizeLocalSession(syntheticTrial('retested'),{synthetic:true});
 assert.equal(l.verdict,'CURRENT_SELF_RECORDED_TEST');
 const h=combineTrial(l,provider());
 assert.equal(h.session.status,'CURRENT_SELF_RECORDED_TEST');
 assert.equal(h.finalFinding,'RELEASE_EVIDENCE_INCOMPLETE');
 assert.equal(h.localSessionLinkedToPr,false);
 assert.equal(h.independentlyAttested,false);
});
test('stale Kiro plus matching GitHub success still fails closed',()=>{
 const h=combineTrial(summarizeLocalSession(syntheticTrial('stale'),{synthetic:true}),provider());
 assert.equal(h.localStep,'STALE_TEST_RECEIPT');
 assert.equal(h.providerStep,'MATCHING_GITHUB_WORKFLOWS_OBSERVED');
 assert.equal(h.bridge,'NO_INDEPENDENT_SESSION_TO_PR_COMMIT_BINDING');
 assert.equal(h.suggestedAction,'RETEST_AFTER_FINAL_EDIT');
 assert.equal(h.releaseApproved,false);
 assert.equal(h.allRequiredChecksVerified,false);
});
test('with no session, PR observation alone is incomplete',()=>{
 const h=combineTrial(null,provider());
 assert.equal(h.session,null);
 assert.equal(h.localStep,'AWAITING_LOCAL_SESSION');
 assert.equal(h.finalFinding,'RELEASE_EVIDENCE_INCOMPLETE');
});
test('with no PR, local chronology alone is incomplete',()=>{
 const h=combineTrial(summarizeLocalSession(syntheticTrial('stale')),null);
 assert.equal(h.pr,null);
 assert.equal(h.providerStep,'AWAITING_PUBLIC_PR');
 assert.equal(h.localSessionLinkedToPr,false);
});
test('provider rate-limited but head validated shows an unknown CI step',()=>{
 const x={...provider('UNKNOWN'),runs:[],counts:null};
 const h=combineTrial(null,x);
 assert.equal(h.pr.headSha,sha);
 assert.equal(h.providerStep,'CI_UNVERIFIED');
 assert.equal(h.pr.counts,null);
});
test('untrusted provider metadata cannot manufacture an observed PR HEAD',()=>{
 for(const pr of [
  {...provider(),source:'FAKE_PROVIDER'},
  {...provider(),headSha:'not-sha'},
  {...provider(),repository:'x/<script>'},
  {...provider(),prNumber:-1}
 ]){
  const h=combineTrial(null,pr);
  assert.equal(h.pr,null);
 }
});
test('synthetic example cannot be labeled a real Kiro session',()=>{
 const h=combineTrial(summarizeLocalSession(syntheticTrial('stale'),{synthetic:true}),provider());
 assert.equal(h.session.source,'EXPLICITLY_SYNTHETIC_EXAMPLE');
 assert.notEqual(h.session.source,'RECORDED_LOCAL_KIRO_CLI_SESSION');
});
test('unrecognized or missing claims remain insufficient',()=>{
 const one=JSON.stringify({
  timestamp:'2026-11-04T11:00:00.000Z',payload:{type:'turn_end'}
 });
 const x=summarizeLocalSession(one);
 assert.equal(x.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
 assert.equal(combineTrial(x,provider()).releaseApproved,false);
});
for(const input of ['',null,undefined,'{bad json','a'.repeat(8*1024*1024+1)]){
 test('unsupported local input fails closed without raw echo: '+String(input).slice(0,16),()=>{
  const o=summarizeLocalSession(input);
  assert.equal(o.verdict,'INSUFFICIENT_SESSION_EVIDENCE');
  assert.equal(o.independentlyAttested,false);
  assert.ok(JSON.stringify(o).length<1500);
 });
}
test('no private raw path, canary or command crosses the dossier boundary',()=>{
 const raw=syntheticTrial('stale').replaceAll('src/synthetic-proof.mjs','src/SECRET_INTERNAL_PATH.mjs');
 const l=summarizeLocalSession(raw);
 const p=provider();
 const h=combineTrial(l,p);
 const json=JSON.stringify(h);
 for(const leak of ['SECRET_INTERNAL_PATH','LEAK_SESSION_CANARY','LEAK_SCRIPT_CANARY','LEAK_TOKEN_CANARY','toolCallId','filePath','toolName','command','session_id','raw']){
  assert.ok(!json.includes(leak),leak);
 }
 assert.ok(json.length<2800);
});
test('counts are bounded and not derived from untrusted raw object labels',()=>{
 const l=summarizeLocalSession(syntheticTrial('retested'));
 l.counts.observedSourceEdits=999999999;
 l.counts.observedPassingTests=-3;
 l.reason='<script>alert(1)</script>';
 const h=combineTrial(l,{...provider(),counts:{success:9999,failure:-100,other:0,inProgress:0}});
 assert.equal(h.session.counts.observedSourceEdits,0);
 assert.equal(h.session.counts.observedPassingTests,0);
 assert.equal(h.session.reason,'UNSUPPORTED_LOCAL_SESSION');
 assert.equal(h.pr.counts.success,0);
});
test('reported outcome cannot claim certification even if all observed runs passed',()=>{
 const h=combineTrial(summarizeLocalSession(syntheticTrial('retested')),provider());
 assert.equal(h.pr.counts.success,2);
 for(const k of ['localSessionLinkedToPr','independentlyAttested','semanticCorrectnessVerified','allRequiredChecksVerified','releaseApproved']){
  assert.equal(h[k],false);
 }
});
test('unsupported synthetic scenario is rejected without fallback',()=>{
 assert.throws(()=>syntheticTrial('real'),/UNSUPPORTED_SYNTHETIC_CASE/);
});
