// M6F: independent fail-closed browser validation of the authentic Kiro exhibit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';

const root=resolve(import.meta.dirname,'..');
const code=readFileSync(resolve(root,'web/alibi.js'),'utf8');
const context={};
vm.runInNewContext(code,context,{timeout:3000});
const {validateSessionExhibit,sessionTimeline,validatePack}=context.SpecterAlibiGuards;
const data=JSON.parse(readFileSync(resolve(root,'web/alibi-session-case.json'),'utf8'));
const classic=JSON.parse(readFileSync(resolve(root,'web/alibi-cases.json'),'utf8'));
const clone=value=>JSON.parse(JSON.stringify(value));
function rejected(fn) {
  const x=clone(data);
  fn(x);
  assert.throws(()=>validateSessionExhibit(x),/Invalid recorded alibi:/);
}

test('authentic M5A public-safe exhibit validates exactly',()=>{
 assert.equal(validateSessionExhibit(data),data);
 assert.equal(data.origin,'RECORDED_LOCAL_KIRO_CLI_SESSION');
 assert.equal(data.finding.independentAttestation,false);
 assert.equal(data.finding.semanticCorrectnessVerified,false);
 assert.equal(data.afterFinalEdit.outsideSessionEvidenceUnknown,true);
});
test('Kiro-authored analyzer agrees with static public exhibit',()=>{
 const result=auditLocalSession({
   sourceKind:data.origin,claimAt:data.claim.observedAt,sessionEndedAt:data.sessionEndedAt,
   tests:[{at:data.toolEvidence.at,pass:data.toolEvidence.pass,fail:data.toolEvidence.fail,exitCode:data.toolEvidence.exitCode}],
   edits:data.sourceEdits
 });
 assert.equal(result.status,'STALE_LOCAL_TEST_EVIDENCE');
 assert.equal(result.status,data.finding.status);
 assert.equal(result.reason,data.finding.reason);
 assert.equal(result.timeline.length,6);
});
test('local session chronology is test, claim, five later edits',()=>{
 const events=sessionTimeline(validateSessionExhibit(data));
 assert.deepEqual(Array.from(events, e=>e.type),['LOCAL_TEST','CLAIM','SOURCE_EDIT','SOURCE_EDIT','SOURCE_EDIT','SOURCE_EDIT','SOURCE_EDIT']);
 assert.equal(events.length,7);
 assert.ok(events.every((e,i)=>i===0||Date.parse(events[i-1].timestamp)<Date.parse(e.timestamp)));
});
test('original three GitHub provider exhibits remain independently valid',()=>{
 assert.equal(validatePack(classic),classic);
});
test('fake pass counts, exit status and test timestamp are rejected',()=>{
 rejected(x=>x.toolEvidence.pass=121);
 rejected(x=>x.toolEvidence.fail=1);
 rejected(x=>x.toolEvidence.exitCode=1);
 rejected(x=>x.toolEvidence.at='2026-11-03T16:00:00Z');
});
test('removing, inserting or reordering source edits is rejected',()=>{
 rejected(x=>x.sourceEdits.pop());
 rejected(x=>x.sourceEdits.push(clone(x.sourceEdits[0])));
 rejected(x=>x.sourceEdits.reverse());
 rejected(x=>x.sourceEdits[0].at='2026-11-03T13:40:00Z');
});
test('private file and source trace substitutions are rejected',()=>{
 rejected(x=>x.sourceEdits[2].file='C:\\Users\\somebody\\secret.env');
 rejected(x=>x.sourceTraceSha256='0'.repeat(64));
 rejected(x=>x.claim.text='All code is correct.');
});
test('overstated attestation or unknown outside-session results cannot appear',()=>{
 rejected(x=>x.finding.independentAttestation=true);
 rejected(x=>x.finding.semanticCorrectnessVerified=true);
 rejected(x=>x.afterFinalEdit.outsideSessionEvidenceUnknown=false);
 rejected(x=>x.afterFinalEdit.furtherTestRunsObservedInThisSavedSession=1);
});
test('text and schema injections cannot rewrite original finding',()=>{
 rejected(x=>x.finding.headline='Vulnerability fixed');
 rejected(x=>x.finding.gaps[2]='All future checks passed.');
 rejected(x=>x.title='<img src=x onerror=alert(1)>');
 rejected(x=>x.extra='unexpected data');
 rejected(x=>x.origin='RECORDED_GITHUB_PROVIDER');
});
test('the real case is not allowed to invent a GitHub source link',()=>{
 rejected(x=>x.sourceUrl='https://github.com/ShenJun93/specter-audit/actions/runs/41742626694');
});
test('capture timestamps and claim/session ordering are fixed',()=>{
 rejected(x=>x.capturedAt='2026-11-02T10:00:00.000Z');
 rejected(x=>x.claim.observedAt='2026-11-03T15:08:00.000Z');
 rejected(x=>x.sessionEndedAt='2026-11-03T13:42:38.312Z');
});
