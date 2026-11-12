// M122 deterministic *synthetic* adversarial contract matrix.
// Counts deliberate tamper/invalid-input cases. This is not a production false-positive rate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCaseFromSources,validLocalChallengeReport} from '../scripts/arena-case-cli.mjs';
import {buildArenaCaseReport} from '../src/arena-case-report.mjs';
const A='a'.repeat(40), B='b'.repeat(40), C='c'.repeat(40);
const HASH='d'.repeat(64),IMAGE='sha256:'+'e'.repeat(64),OUT='f'.repeat(64);
const WHEN='2026-11-12T05:00:00.000Z';
const pr=Object.freeze({owner:'test-owner',repo:'owner-controlled',number:17,url:'https://github.com/test-owner/owner-controlled/pull/17'});
const expected={ '0,0':'BOTH_PASS','0,1':'REGRESSION','1,0':'DEMONSTRATED_FIX','1,1':'BOTH_FAIL' };
const copy=value=>structuredClone(value);
const side=(sha,exit)=>({
 revision:sha,status:'OBSERVED_TEST',exitCode:exit,
 stdoutSha256:OUT,observedAt:WHEN,
 tap:{tests:2,passed:exit===0?2:1,failed:exit===0?0:1,skipped:0,cancelled:0}
});
const fresh=(baseExit,headExit)=>{
 const repo='test-owner/owner-controlled';
 const snapshot={repository:repo,prNumber:17,baseSha:A,headSha:B,state:'open'};
 const provider={
  status:'OBSERVED_EXACT_SHA_RUNS',repository:repo,prNumber:17,prUrl:pr.url,
  headSha:B,truncated:false,runs:[{id:43148508938,headSha:B,status:'completed',conclusion:'success'}]
 };
 const challenge={
  schema:'SPECTER_BEHAVIOR_CHALLENGE_V1',
  authority:'LOCAL_REVIEWER_INVOCATION_NOT_ATTESTED',
  repository:repo,baseSha:A,headSha:B,sourcePath:'src/pricing.mjs',
  reviewerTest:{sha256:HASH,approval:'EXPLICIT_LOCAL_CLI_FLAG_NOT_AUTHENTICATED',expectedBehavior:'Integer cents at half-cent rounding'},
  image:{reference:'node:24-alpine',imageId:IMAGE},
  isolation:{network:'none',root:'readonly',user:'65534:65534',memoryMb:384,cpus:1,pids:64},
  observations:{base:side(A,baseExit),head:side(B,headExit)},
  result:expected[baseExit+','+headExit]
 };
 return {first:copy(snapshot),last:copy(snapshot),provider,challenge};
};
const evaluate=f=>buildCaseFromSources(pr,f.first,f.last,f.provider,f.challenge,{now:new Date(WHEN)});
const modifications={
 // Public provider reference and exact SHAs.
 'first foreign repository':x=>{x.first.repository='other/project'},
 'last foreign repository':x=>{x.last.repository='other/project'},
 'first base changed':x=>{x.first.baseSha=C},
 'last base changed':x=>{x.last.baseSha=C},
 'last head changed':x=>{x.last.headSha=C},
 'provider foreign repository':x=>{x.provider.repository='other/project'},
 'provider PR number changed':x=>{x.provider.prNumber=18},
 'provider PR link changed':x=>{x.provider.prUrl='https://github.com/test-owner/owner-controlled/pull/18'},
 'provider missing SHA':x=>{x.provider.headSha='invalid'},
 'provider mismatched SHA':x=>{x.provider.headSha=C},
 'provider unknown status':x=>{x.provider.status='UNKNOWN'},
 'provider truncated':x=>{x.provider.truncated=true},
 'provider zero runs':x=>{x.provider.runs=[]},
 'provider excess runs':x=>{x.provider.runs=Array.from({length:31},(_,i)=>({...x.provider.runs[0],id:i+1}))},
 'provider null run':x=>{x.provider.runs=[null]},
 'provider boolean run':x=>{x.provider.runs=[true]},
 'provider string run':x=>{x.provider.runs=['fake']},
 'provider duplicate run':x=>{x.provider.runs.push({...x.provider.runs[0]})},
 'provider wrong run SHA':x=>{x.provider.runs[0].headSha=C},
 'provider missing run status':x=>{delete x.provider.runs[0].status},
 'provider fake run conclusion':x=>{x.provider.runs[0].conclusion='totally-safe'},
 'challenge wrong repository':x=>{x.challenge.repository='other/project'},
 'challenge wrong base SHA':x=>{x.challenge.baseSha=C},
 'challenge wrong head SHA':x=>{x.challenge.headSha=C},
 'challenge wrong schema':x=>{x.challenge.schema='MALICIOUS'},
 'challenge forged authority':x=>{x.challenge.authority='INDEPENDENT_ATTESTED'},
 'challenge no approval':x=>{x.challenge.reviewerTest.approval='NOT_APPROVED'},
 'challenge bad test SHA':x=>{x.challenge.reviewerTest.sha256='not-a-sha'},
 'challenge no expected behavior':x=>{x.challenge.reviewerTest.expectedBehavior=''},
 'challenge wrong image ref':x=>{x.challenge.image.reference='node:latest'},
 'challenge forged image id':x=>{x.challenge.image.imageId='sha256:xxx'},
 'challenge network enabled':x=>{x.challenge.isolation.network='host'},
 'challenge root writable':x=>{x.challenge.isolation.root='rw'},
 'challenge root user':x=>{x.challenge.isolation.user='0:0'},
 'challenge memory increased':x=>{x.challenge.isolation.memoryMb=2048},
 'challenge CPU increased':x=>{x.challenge.isolation.cpus=4},
 'challenge PID limit increased':x=>{x.challenge.isolation.pids=4096},
 'challenge missing observations':x=>{delete x.challenge.observations},
 'challenge swapped base source':x=>{x.challenge.observations.base.revision=B},
 'challenge swapped head source':x=>{x.challenge.observations.head.revision=A},
 'challenge no base status':x=>{delete x.challenge.observations.base.status},
 'challenge head timeout':x=>{x.challenge.observations.head.status='UNKNOWN'},
 'challenge head invalid exit':x=>{x.challenge.observations.head.exitCode=125},
 'challenge missing TAP':x=>{x.challenge.observations.base.tap=null},
 'challenge zero tests':x=>{x.challenge.observations.base.tap.tests=0},
 'challenge negative tests':x=>{x.challenge.observations.base.tap.tests=-1},
 'challenge incorrect test total':x=>{x.challenge.observations.base.tap.tests=3},
 'challenge skipped test':x=>{x.challenge.observations.base.tap.skipped=1},
 'challenge canceled test':x=>{x.challenge.observations.base.tap.cancelled=1},
 'challenge contradictory exit':x=>{const t=x.challenge.observations.base.tap;t.passed=x.challenge.observations.base.exitCode===0?1:2;t.failed=x.challenge.observations.base.exitCode===0?1:0},
 'challenge bad stdout digest':x=>{x.challenge.observations.base.stdoutSha256='000'},
 'challenge incorrect result':x=>{x.challenge.result=x.challenge.result==='BOTH_PASS'?'BOTH_FAIL':'BOTH_PASS'},
 'challenge unknown result':x=>{x.challenge.result='UNKNOWN'},
 'challenge no result':x=>{delete x.challenge.result}
};
const mutations=Object.entries(modifications);
test('M122 all four consistent behavior outcomes classify exactly and remain non-attested',()=>{
 for(const [pair,kind] of Object.entries(expected)){
  const [before,after]=pair.split(',').map(Number);
  const input=fresh(before,after),result=evaluate(input);
  assert.equal(result.classification,kind,'pair '+pair);
  assert.equal(result.attestation.independentlyAttested,false);
  assert.equal(result.attestation.releaseApproved,false);
  assert.equal(result.statements.length,5);
 }
});
test('M122 deterministic tamper matrix: every mutated provider/challenge case fails closed',()=>{
 let checked=0;
 for(const [pair,kind] of Object.entries(expected)){
  const [before,after]=pair.split(',').map(Number);
  for(const [label,mutate] of mutations){
   const input=fresh(before,after);
   mutate(input);
   let result;
   assert.doesNotThrow(()=>{result=evaluate(input)},'should not throw: '+label);
   assert.equal(result.classification,'UNKNOWN',pair+' '+label+' was '+result.classification);
   assert.equal(result.attestation?.independentlyAttested,false);
   assert.equal(result.attestation?.releaseApproved,false);
   checked++;
  }
 }
 assert.equal(checked,4*mutations.length);
 console.log('M122_ATTACK_MATRIX',JSON.stringify({negativeCases:checked,mutationTypes:mutations.length,positiveCases:4,observedUnexpectedVerdicts:0}));
});
test('M122 irrelevant JSON extras never become attestation or raw report text',()=>{
 const input=fresh(1,0);
 const secret='FAKE_SECRET_SHOULD_NEVER_APPEAR_8675309';
 input.challenge.attestation={independentlyAttested:true,releaseApproved:true,secret};
 input.challenge.reviewerTest.privateNote=secret;
 input.provider.privateAccessToken=secret;
 input.first.privateWorktree=secret;
 const r=evaluate(input);
 assert.equal(r.classification,'DEMONSTRATED_FIX');
 assert.ok(!JSON.stringify(r).includes(secret));
 assert.ok(Object.values(r.attestation).every(v=>v===false));
});
test('M122 internal consistency is not proof: fully fabricated but consistent data stays unverified',()=>{
 const input=fresh(1,0);
 const r=evaluate(input);
 assert.equal(r.classification,'DEMONSTRATED_FIX');
 assert.equal(r.attestation.executionVerifiedBySpecter,false);
 assert.equal(r.attestation.independentlyAttested,false);
 assert.equal(r.attestation.releaseApproved,false);
 assert.ok(r.limitations.some(x=>/self-reported/.test(x)));
});
test('M122 malformed observation envelope itself also fails closed',()=>{
 for(const b of [null,undefined,0,'fake',true,[],{foo:'bar'}]){
  const r=buildArenaCaseReport({observation:b});
  assert.equal(r.classification,'UNKNOWN');
  assert.equal(r.attestation.independentlyAttested,false);
 }
});
