import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeAlibiCase, AlibiInputError} from '../src/alibi-engine.mjs';

const A='374af1417b714619d9edc1af790f7e7db15a71ca';
const B='b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e';
const C='ad8c79f27bb5da3e6228696c55d1e3a50cc8bf3b';
const X='9'.repeat(40);
const at='2026-11-04T01:00:00.000Z';
const run=(id,sha,runNumber,conclusion='success',extra={})=>({
  runId:id,sha,workflowId:405703749,runNumber,runAttempt:1,
  status:conclusion===null?'in_progress':'completed',conclusion,
  updatedAt:'2026-11-03T23:55:00.000Z',
  sourceUrl:'https://github.com/ShenJun93/specter-audit/actions/runs/'+id,
  origin:'RECORDED_GITHUB_PROVIDER',...extra
});
const earlier=run(41736082288,A,6,'success',{updatedAt:'2026-11-03T23:04:05.000Z'});
const current=run(41742626694,B,9);
function sample(){
  return {schema:'SPECTER_ALIBI_CASE_V1',
    repo:{owner:'ShenJun93',name:'specter-audit',workflowId:405703749},
    target:{sha:B,claim:'Agent says all tests pass on merge B',observedAt:at},
    commits:[
      {sha:B,parents:[A,C],committedAt:'2026-11-03T23:53:11.000Z'},
      {sha:A,parents:[X],committedAt:'2026-11-03T23:03:48.000Z'},
      {sha:C,parents:[A],committedAt:'2026-11-03T23:34:59.000Z'}
    ],
    checks:[structuredClone(earlier),structuredClone(current)],capturedAt:at};
}
const clone=(x)=>structuredClone(x);
function expectInputError(f){assert.throws(f,e=>e instanceof AlibiInputError && e.code==='INVALID_ALIBI_CASE');}

test('provider-reported success for exact target SHA, never semantic correctness',()=>{
 const r=analyzeAlibiCase(sample());
 assert.equal(r.schema,'SPECTER_ALIBI_VERDICT_V1');
 assert.equal(r.status,'PROVIDER_REPORTED_PASS');
 assert.equal(r.selectedRun.runId,41742626694);
 assert.equal(r.selectedRun.sha,B);
 assert.equal(r.provenance.semanticCorrectnessVerified,false);
 assert.equal(r.provenance.independentAttestation,false);
 assert.equal(r.provenance.providerReportedOnly,true);
 assert.ok(r.limitations.some(s=>s.includes('not prove source code correctness')));
 assert.ok(r.events.some(e=>e.type==='CI_RUN' && e.sourceKind==='RECORDED_GITHUB_PROVIDER'));
});
test('only ancestor CI supplied -> stale artifact, not all GitHub CI missing',()=>{
 const x=sample();x.checks=[earlier];const r=analyzeAlibiCase(x);
 assert.equal(r.status,'STALE_EVIDENCE');assert.equal(r.selectedRun.sha,A);
 assert.match(r.reason,/374af141.*b6e1407d/);
 assert.match(r.gaps.join(' '),/not an assertion that no newer CI/);
});
test('old run for non-ancestor cannot be called stale',()=>{
 const x=sample();x.commits=[x.commits[0],x.commits[2]];x.commits[0].parents=[C];x.commits[1].parents=[];
 x.checks=[earlier];
 assert.equal(analyzeAlibiCase(x).status,'INSUFFICIENT_EVIDENCE');
});
test('missing target graph cannot assert ancestor relationship',()=>{
 const x=sample();x.commits=[];x.checks=[earlier];
 assert.equal(analyzeAlibiCase(x).status,'INSUFFICIENT_EVIDENCE');
});
test('empty checks cannot be green even if Git graph exists',()=>{
 const x=sample();x.checks=[];const r=analyzeAlibiCase(x);
 assert.equal(r.status,'INSUFFICIENT_EVIDENCE');assert.equal(r.selectedRun,null);
 assert.match(r.headline,/No exact-commit/);
});
test('latest exact-SHA failed run contradicts claimed test pass',()=>{
 const x=sample();x.checks=[earlier,run(5000000,B,10,'failure')];
 const r=analyzeAlibiCase(x);assert.equal(r.status,'PROVIDER_REPORTED_FAILURE');
 assert.equal(r.selectedRun.conclusion,'failure');
 assert.match(r.gaps.join(' '),/conflicts/);
});
test('cancelled or timed out is not a test success',()=>{
 for(const c of ['cancelled','timed_out','action_required']){
 const x=sample();x.checks=[run(5000000,B,10,c)];
 assert.equal(analyzeAlibiCase(x).status,'PROVIDER_REPORTED_FAILURE');
 }
});
test('latest exact SHA success supersedes earlier failed run',()=>{
 const x=sample();x.checks=[run(5000000,B,8,'failure'),current];
 const r=analyzeAlibiCase(x);
 assert.equal(r.status,'PROVIDER_REPORTED_PASS');
 assert.equal(r.selectedRun.runId,41742626694);
});
test('CI success arriving after the claim cannot retroactively certify it',()=>{
 const x=sample();x.target.observedAt='2026-11-03T23:54:00Z';
 x.checks=[run(5000000,B,10,'success',{updatedAt:'2026-11-03T23:56:00Z'})];
 const r=analyzeAlibiCase(x);
 assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
 assert.match(r.reason,/after the claim/i);
});
test('CI failure arriving after the claim is also not a contemporaneous contradiction',()=>{
 const x=sample();x.target.observedAt='2026-11-03T23:54:00Z';
 x.checks=[run(5000000,B,10,'failure',{updatedAt:'2026-11-03T23:56:00Z'})];
 assert.equal(analyzeAlibiCase(x).status,'INSUFFICIENT_EVIDENCE');
});
test('latest exact SHA failure supersedes earlier success',()=>{
 const x=sample();x.checks=[current,run(5000000,B,10,'failure')];
 assert.equal(analyzeAlibiCase(x).status,'PROVIDER_REPORTED_FAILURE');
});
test('latest pending run blocks inherited success even for exact SHA',()=>{
 const x=sample();x.checks=[current,run(5000000,B,10,null)];
 const r=analyzeAlibiCase(x);
 assert.equal(r.status,'INSUFFICIENT_EVIDENCE');
 assert.equal(r.selectedRun.status,'in_progress');
});
test('neutral and skipped conclusions never affirm test pass',()=>{
 for(const state of ['neutral','skipped','stale']){
 const x=sample();x.checks=[run(5000000,B,10,state)];
 assert.equal(analyzeAlibiCase(x).status,'INSUFFICIENT_EVIDENCE');
 }
});
test('Git merge graph can prove ancestry through either parent',()=>{
 const x=sample();x.checks=[earlier];x.commits[0].parents=[C,A];
 assert.equal(analyzeAlibiCase(x).status,'STALE_EVIDENCE');
});
test('missing unrelated parent nodes are permitted when target-to-ancestor path exists',()=>{
 const x=sample();x.checks=[earlier];x.commits=x.commits.filter(z=>z.sha!==C);
 assert.equal(analyzeAlibiCase(x).status,'STALE_EVIDENCE');
});
test('all report events are chronological and constrained',()=>{
 const report=analyzeAlibiCase(sample());
 for(let i=1;i<report.events.length;i++) assert.ok(Date.parse(report.events[i].timestamp)>=Date.parse(report.events[i-1].timestamp));
 assert.ok(report.events.every(e=>typeof e.label==='string'&&!e.label.includes('<script>')));
});
test('wrong workflow or incorrect source URL must fail closed',()=>{
 let x=sample();x.checks=[{...current,workflowId:1}];expectInputError(()=>analyzeAlibiCase(x));
 for(const url of [
 'https://evil.invalid/ShenJun93/specter-audit/actions/runs/41742626694',
 'https://github.com/ShenJun93/specter-audit/actions/runs/41742626695',
 'https://github.com/ShenJun93/specter-audit/actions/runs/41742626694?token=<REDACTED>',
 'https://github.com/ShenJun93/specter-audit/actions/runs/41742626694#x',
 'https://user:<REDACTED>@github.com/ShenJun93/specter-audit/actions/runs/41742626694',
 'http://github.com/ShenJun93/specter-audit/actions/runs/41742626694'
 ]){x=sample();x.checks=[{...current,sourceUrl:url}];expectInputError(()=>analyzeAlibiCase(x));}
});
test('recorded provider run requires canonical URL',()=>{
 const x=sample();x.checks=[{...current,sourceUrl:null}];
 expectInputError(()=>analyzeAlibiCase(x));
});
test('synthetic run can be unlinked but must not claim independent attestation',()=>{
 const x=sample();x.checks=[{...current,sourceUrl:null,origin:'SYNTHETIC_FIXTURE'}];
 const r=analyzeAlibiCase(x);assert.equal(r.status,'PROVIDER_REPORTED_PASS');
 assert.equal(r.selectedRun.sourceUrl,null);
 assert.deepEqual(r.provenance.sources,['SYNTHETIC_FIXTURE']);
 assert.equal(r.provenance.independentAttestation,false);
});
test('unknown provenance label is rejected',()=>{
 const x=sample();x.checks=[{...current,origin:'SIGNED_BY_SPECTER'}];
 expectInputError(()=>analyzeAlibiCase(x));
});
test('SHA must be full 40-hex and cannot be invented from a short prefix',()=>{
 for(const bad of ['b6e1407','gg'.repeat(20),'',null]){
 const x=sample();x.target.sha=bad;expectInputError(()=>analyzeAlibiCase(x));
 }
});
test('commits with duplicate IDs, self-parent or cycle are invalid',()=>{
 let x=sample();x.commits.push(clone(x.commits[0]));expectInputError(()=>analyzeAlibiCase(x));
 x=sample();x.commits[0].parents=[B];expectInputError(()=>analyzeAlibiCase(x));
 x=sample();x.commits[1].parents=[B];expectInputError(()=>analyzeAlibiCase(x));
});
test('duplicate run id or same run attempt is rejected',()=>{
 let x=sample();x.checks.push({...current,runNumber:11});expectInputError(()=>analyzeAlibiCase(x));
 x=sample();x.checks.push({...current,runId:4000});expectInputError(()=>analyzeAlibiCase(x));
});
test('run future of capture or impossible observation order rejected',()=>{
 let x=sample();x.checks=[{...current,updatedAt:'2027-01-01T00:00:00.000Z'}];
 expectInputError(()=>analyzeAlibiCase(x));
 x=sample();x.target.observedAt='2027-01-01T00:00:00.000Z';expectInputError(()=>analyzeAlibiCase(x));
});
test('malformed status, conclusion, numbers, and timestamps fail closed',()=>{
 const mutations=[
 c=>c.checks[0].status='unk',
 c=>c.checks[0].conclusion='all_passed',
 c=>c.checks[0].runId=-2,
 c=>c.checks[0].runNumber=Number.MAX_SAFE_INTEGER+1,
 c=>c.checks[0].updatedAt='yesterday',
 c=>{c.checks[0].status='in_progress';c.checks[0].conclusion='success';}
 ];
 for(const mutate of mutations){const x=sample();mutate(x);expectInputError(()=>analyzeAlibiCase(x));}
});
test('bound all untrusted input sizes',()=>{
 let x=sample();x.target.claim='x'.repeat(2001);expectInputError(()=>analyzeAlibiCase(x));
 x=sample();x.commits=Array(101).fill(x.commits[0]);expectInputError(()=>analyzeAlibiCase(x));
 x=sample();x.checks=Array(51).fill(current);expectInputError(()=>analyzeAlibiCase(x));
});
test('does not mutate supplied case object',()=>{
 const x=sample(),before=JSON.stringify(x);analyzeAlibiCase(x);
 assert.equal(JSON.stringify(x),before);
});
