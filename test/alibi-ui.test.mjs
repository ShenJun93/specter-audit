import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const code = readFileSync(resolve(import.meta.dirname, '../web/alibi.js'), 'utf8');
const context = {URL, Date, Set, Map, Error, Number, String, Array, Object};
context.globalThis = context;
runInNewContext(code, context, {filename: 'alibi.js'});
const {validatePack, canonicalRunLink, hasProvableParent, selectedEventRows} = context.SpecterAlibiGuards;
const A = '374af1417b714619d9edc1af790f7e7db15a71ca';
const B = 'b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e';
const C = 'ad8c79f27bb5da3e6228696c55d1e3a50cc8bf3b';
const at = '2026-11-04T01:20:12Z';
const link = (id) => `https://github.com/ShenJun93/specter-audit/actions/runs/${id}`;
const oldRun = {runId:41736082288,sha:A,workflowId:405703749,runNumber:6,runAttempt:1,status:'completed',conclusion:'success',updatedAt:'2026-11-03T23:04:05Z',sourceUrl:link(41736082288),origin:'RECORDED_GITHUB_PROVIDER'};
const newRun = {runId:41742626694,sha:B,workflowId:405703749,runNumber:9,runAttempt:1,status:'completed',conclusion:'success',updatedAt:'2026-11-03T23:53:25Z',sourceUrl:link(41742626694),origin:'RECORDED_GITHUB_PROVIDER'};
const commits = [
  {sha:B,parents:[A,C],committedAt:'2026-11-03T23:53:11Z'},
  {sha:A,parents:[],committedAt:'2026-11-03T23:03:48Z'},
  {sha:C,parents:[A],committedAt:'2026-11-03T23:34:59Z'},
];
const event = (run) => ({type:'CI_RUN',timestamp:run.updatedAt,sha:run.sha,runId:run.runId,sourceKind:run.origin,sourceUrl:run.sourceUrl,label:`Workflow #${run.runNumber} attempt 1: success`});
const claimEvent = {type:'CLAIM',timestamp:at,sha:B,label:'Hypothetical completion claim',sourceKind:'CLAIM_INPUT',sourceUrl:null};
function makeCase(id,status,runs,selected) {
  return {
    id,title:'Test case',explanation:'A fixed test record',label:'RECORDED RUN / HYPOTHETICAL CLAIM',expectedStatus:status,
    input:{schema:'SPECTER_ALIBI_CASE_V1',repo:{owner:'ShenJun93',name:'specter-audit',workflowId:405703749},
      target:{sha:B,claim:'Hypothetical agent says tests pass',observedAt:at},
      capturedAt:at,commits,checks:runs},
    verdict:{schema:'SPECTER_ALIBI_VERDICT_V1',status,targetSha:B,headline:'Test headline',reason:'Test reason',
      selectedRun:selected,events:[...runs.map(event),claimEvent],gaps:[],
      provenance:{repo:'ShenJun93/specter-audit',workflowId:405703749,independentAttestation:false,
        semanticCorrectnessVerified:false,providerReportedOnly:true}}
  };
}
function sample() {return {schema:'SPECTER_ALIBI_EXHIBITS_V1',fixedPublicRepo:'ShenJun93/specter-audit',targetCommit:B,capturedAt:at,cases:[
  makeCase('stale-artifact','STALE_EVIDENCE',[oldRun],oldRun),
  makeCase('current-exact-run','PROVIDER_REPORTED_PASS',[oldRun,newRun],newRun),
  makeCase('no-artifact-presented','INSUFFICIENT_EVIDENCE',[],null)
]};}
const clone = (v) => JSON.parse(JSON.stringify(v));
const invalid = (mutate) => {const p=clone(sample());mutate(p);assert.throws(()=>validatePack(p),/Invalid recorded alibi:/);};

test('three bounded cases with exact source runs are accepted',()=>{
  const p=sample();assert.equal(validatePack(p),p);
});
test('invalid provider host, query, wrong run id are never clickable',()=>{
  assert.equal(canonicalRunLink(link(41742626694),41742626694),link(41742626694));
  for(const candidate of ['https://evil.invalid/actions/runs/41742626694',link(41742626694)+'?fake=1',link(41742626695),
    'https://github.com@attacker.invalid/ShenJun93/specter-audit/actions/runs/41742626694'])
    assert.equal(canonicalRunLink(candidate,41742626694),null);
});
test('mismatched target SHA and fake success status fail closed',()=>{
  invalid(p=>p.cases[0].input.target.sha=A);
  invalid(p=>p.cases[0].verdict.status='PROVIDER_REPORTED_PASS');
});
test('wrong run number and forged provider run URL fail closed',()=>{
  invalid(p=>p.cases[1].input.checks[1].runNumber=10);
  invalid(p=>p.cases[1].input.checks[1].sourceUrl=link(123));
});
test('missing or changed commit genealogy fails closed',()=>{
  invalid(p=>p.cases[0].input.commits=[]);
  invalid(p=>p.cases[0].input.commits[0].parents=[]);
});
test('overstated provenance and synthetic origins fail closed',()=>{
  invalid(p=>p.cases[1].verdict.provenance.semanticCorrectnessVerified=true);
  invalid(p=>p.cases[0].input.checks[0].origin='SYNTHETIC_FIXTURE');
});
test('incorrect event link and non-CI event links fail closed',()=>{
  invalid(p=>p.cases[0].verdict.events[0].sourceUrl=link(123));
  invalid(p=>p.cases[0].verdict.events[1].sourceUrl=link(41742626694));
});
test('replayed or oversized exhibit lists fail closed',()=>{
  invalid(p=>p.cases.push(clone(p.cases[0])));
  invalid(p=>p.cases[0].input.checks.push(clone(newRun)));
  invalid(p=>p.cases[0].input.target.claim='X'.repeat(2100));
});
test('provable ancestry requires a connected directed path',()=>{
  assert.equal(hasProvableParent(commits,B,A),true);
  assert.equal(hasProvableParent(commits,A,B),false);
  assert.equal(hasProvableParent([],B,A),false);
  assert.equal(hasProvableParent(commits,B,B),false);
});
test('events are chronologically ordered without rewriting source content',()=>{
  const arr=[claimEvent,event(newRun),event(oldRun)];
  const ordered=selectedEventRows(arr);
  assert.equal(ordered[0].runId,41736082288);
  assert.equal(ordered[1].runId,41742626694);
  assert.equal(ordered[2].type,'CLAIM');
});

test('CI run completed after claim cannot remain provider-reported pass in browser',()=>{
  invalid(p=>{
    const c=p.cases[1];
    c.input.target.observedAt='2026-11-03T23:53:20Z';
    c.verdict.events.find(e=>e.type==='CLAIM').timestamp='2026-11-03T23:53:20Z';
  });
});
test('every cited provider run must appear exactly once on evidence timeline',()=>{
  invalid(p=>{
    const c=p.cases[1];
    c.verdict.events=c.verdict.events.filter(e=>e.runId!==41742626694);
  });
  invalid(p=>{
    const c=p.cases[1];
    c.verdict.events.push(clone(c.verdict.events.find(e=>e.runId===41742626694)));
  });
});
test('selected run must agree with exact input record including timestamp',()=>{
  invalid(p=>p.cases[1].verdict.selectedRun.updatedAt='2026-11-03T23:53:20Z');
});
test('ambiguous duplicate commit nodes must not rewrite ancestry',()=>{
  invalid(p=>p.cases[0].input.commits.push(clone(commits[0])));
});

test('checked-in real GitHub evidence pack passes browser integrity checks',()=>{
  const pack=JSON.parse(readFileSync(resolve(import.meta.dirname,'../web/alibi-cases.json'),'utf8'));
  assert.equal(validatePack(pack),pack);
});
