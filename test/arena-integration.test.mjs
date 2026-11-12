import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildArenaCaseReport} from '../src/arena-case-report.mjs';
import {buildCaseFromSources,renderArenaMarkdown}
 from '../scripts/arena-case-cli.mjs';

const A='a'.repeat(40), B='b'.repeat(40), HASH='c'.repeat(64),
 IMAGE='sha256:'+'d'.repeat(64), OUT='e'.repeat(64);
const when='2026-11-12T08:00:00.000Z';
const pr={owner:'test-owner',repo:'other-repo',number:1,url:'https://github.com/test-owner/other-repo/pull/1'};
const snap=()=>({repository:'test-owner/other-repo',prNumber:1,baseSha:A,headSha:B,state:'open'});
const provider=()=>({source:'GITHUB_PUBLIC_REST_OPT_IN',status:'OBSERVED_EXACT_SHA_RUNS',
 repository:'test-owner/other-repo',prNumber:1,prUrl:'https://github.com/test-owner/other-repo/pull/1',
 headSha:B,truncated:false,runs:[{
 id:43148508938,headSha:B,status:'completed',conclusion:'success'
}]});
const side=(revision,exitCode)=>({
 revision,status:'OBSERVED_TEST',exitCode,stdoutSha256:OUT,observedAt:when,
 tap:{tests:2,passed:exitCode===0?2:0,failed:exitCode===0?0:2,skipped:0,cancelled:0}
});
const challenge=()=>({
 schema:'SPECTER_BEHAVIOR_CHALLENGE_V1',
 repository:'test-owner/other-repo',baseSha:A,headSha:B,
 authority:'LOCAL_REVIEWER_INVOCATION_NOT_ATTESTED',
 reviewerTest:{sha256:HASH,approval:'EXPLICIT_LOCAL_CLI_FLAG_NOT_AUTHENTICATED',expectedBehavior:'An approved behavior test'},
 image:{imageId:IMAGE,reference:'node:24-alpine'},
 isolation:{network:'none',root:'readonly',user:'65534:65534',memoryMb:384,cpus:1,pids:64},
 result:'DEMONSTRATED_FIX',
 observations:{base:side(A,1),head:side(B,0)}
});
const build=(first=snap(),last=snap(),obs=provider(),ch=challenge())=>
 buildCaseFromSources(pr,first,last,obs,ch,{now:new Date(when)});

test('same report supports public PR reviewer markdown, both with bounded provenance',()=>{
 const report=build();
 assert.equal(report.schema,'SPECTER_ARENA_CASE_V1');
 assert.equal(report.classification,'DEMONSTRATED_FIX');
 assert.equal(report.subject.repository,'test-owner/other-repo');
 assert.equal(report.attestation.independentlyAttested,false);
 const markdown=renderArenaMarkdown(report);
 assert.match(markdown,/DEMONSTRATED_FIX/);
 assert.match(markdown,/github.com\/test-owner\/other-repo\/pull\/1/);
 assert.match(markdown,/not a GitHub check, approval, or attestation/);
 assert.doesNotMatch(markdown,/E:\\|C:\\|PRIVATE_TOKEN/);
 assert.equal(report.challenge.testSha256,HASH);
});
test('PR HEAD moving during inspection always yields UNKNOWN',()=>{
 assert.equal(build(snap(),{...snap(),headSha:'f'.repeat(40)}).classification,'UNKNOWN');
 assert.equal(build(snap(),{...snap(),baseSha:'f'.repeat(40)}).classification,'UNKNOWN');
});
test('provider results with wrong SHA, truncated samples or missing runs fail closed',()=>{
 const bad=[{...provider(),headSha:A},{...provider(),truncated:true},
 {...provider(),runs:[{id:12,status:'completed',conclusion:'success',headSha:A}]},
 {...provider(),runs:[]}, {...provider(),status:'UNKNOWN'}];
 for(const b of [...bad,{...provider(),repository:'different/repo'}, {...provider(),prNumber:2}, {...provider(),prUrl:'https://github.com/test-owner/other-repo/pull/2'}])
  assert.equal(build(snap(),snap(),b).classification,'UNKNOWN');
});
test('challenge mismatched SHA, test hash or unverified TAP cannot elevate verdict',()=>{
 const old=challenge();
 for(const c of [
 {...old,observations:{base:side(B,1),head:side(B,0)}},
 {...old,reviewerTest:{sha256:'invalid'}},
 {...old,headSha:'f'.repeat(40)},
 {...old,observations:{base:{...side(A,1),status:'UNKNOWN'},head:side(B,0)}}
 ])assert.equal(build(snap(),snap(),provider(),c).classification,'UNKNOWN');
});
test('report cannot be marked as independently attested or released by hostile inputs',()=>{
 const x=challenge();x.extra={releaseApproved:true,independentlyAttested:true};
 const report=build(snap(),snap(),provider(),x);
 assert.equal(report.classification,'DEMONSTRATED_FIX');
 assert.deepEqual(Object.values(report.attestation),[false,false,false,false,false,false]);
});
test('hosted Arena renders only bounded case content, no upload, token or raw Git',async()=>{
 const html=await readFile(new URL('../web/arena.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../web/arena.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../web/arena.css',import.meta.url),'utf8');
 const json=JSON.parse(await readFile(new URL('../web/arena-fixture-case.json',import.meta.url),'utf8'));
 const server=await readFile(new URL('../src/http-server.mjs',import.meta.url),'utf8');
 for(const id of ['load-case','case-file','finding','statements','next-action','base-sha','head-sha','lead-ci','lead-challenge','lead-result']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/owner-controlled synthetic fixture/i);
 assert.match(js,/textContent=/);
 assert.match(css,/\.boundary\{[^}]+overflow-wrap:anywhere/);
 assert.match(js,/reportAttestationFields/);
 assert.match(js,/expected!==r.classification/);
 assert.match(js,/function showLead\(kind\)/);
 assert.match(js,/text\('lead-result'/);
 assert.match(html,/aria-label="Inspect evidence leads"/);
 assert.doesNotMatch(js,/\.innerHTML\s*=|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket/);
 assert.doesNotMatch(js,/fetch\([^)]*api\.github\.com/);
 assert.match(server,/arena-fixture-case\.json/);
 assert.equal(json.schema,'SPECTER_ARENA_CASE_V1');
 assert.equal(json.classification,'DEMONSTRATED_FIX');
 assert.equal(json.attestation.independentlyAttested,false);
 assert.equal(json.statements.length,5);
 assert.ok(!JSON.stringify(json).includes('E:\\'));
});

test('public reviewer-owned challenge test and manifest are immutable fixtures outside target PR',async()=>{
 const bytes=await readFile(new URL('../reviewer/challenges/half-cent-rounding.challenge.mjs',import.meta.url));
 const hash=createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash,'09c6d12c487264d7e2a18ca2025df20b3f470d9a2b257a547240af3e30641ce2');
 const manifest=JSON.parse(await readFile(new URL('../reviewer/challenges/half-cent-rounding.manifest.example.json',import.meta.url),'utf8'));
 assert.equal(manifest.schema,'SPECTER_REVIEWER_CHALLENGE_V1');
 assert.equal(manifest.testSha256,hash);
 assert.equal(manifest.baseSha,'4014554a6577e0a9369b9fb53e6b06da96772289');
 assert.equal(manifest.headSha,'df89b5d477693a0e4bacc27cd46179ad1a334019');
 assert.equal(manifest.sourcePath,'src/pricing.mjs');
 assert.match(manifest.testPath,/absolute path/);
 assert.match(bytes.toString('utf8'),/discountedCents\(101,50\),51/);
});
test('M121 adversarial: forged challenge evidence must fail closed, never claim a demonstrated fix',()=>{
 const baseline=challenge();
 const modified=[
  {...baseline,result:'BOTH_PASS'},
  {...baseline,result:'UNKNOWN'},
  {...baseline,authority:'FORGED_PROVIDER'},
  {...baseline,reviewerTest:{...baseline.reviewerTest,approval:'NEVER_APPROVED'}},
  {...baseline,observations:{base:{...side(A,1),tap:null},head:side(B,0)}},
  {...baseline,observations:{base:{...side(A,1),tap:{tests:2,passed:2,failed:0,skipped:0,cancelled:0}},head:side(B,0)}},
  {...baseline,observations:{base:side(A,1),head:{...side(B,0),tap:{tests:2,passed:1,failed:0,skipped:1,cancelled:0}}}},
  {...baseline,image:{reference:'node:24-alpine',imageId:'bogus'}},
  {...baseline,isolation:{network:'host',root:'readonly',user:'65534:65534'}}
 ];
 for(const [index,caseData] of modified.entries()){
  const report=build(snap(),snap(),provider(),caseData);
  assert.equal(report.classification,'UNKNOWN','forged challenge '+index+' must be UNKNOWN');
 }
});
test('M122 malformed provider run records fail closed without throwing',()=>{
 for(const runs of [[null],[false],[0],[undefined],['injected'],[{id:1},null]]){
  const report=build(snap(),snap(),{...provider(),runs});
  assert.equal(report.classification,'UNKNOWN');
 }
});