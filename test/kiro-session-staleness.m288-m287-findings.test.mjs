import test from 'node:test';
import assert from 'node:assert/strict';
import { auditLocalSession } from '../src/kiro-session-staleness.mjs';
import { auditLocalSession as webAudit } from '../web/kiro-session-staleness.mjs';
import { parseKiroSession as sourceImporter } from '../src/kiro-session-import.mjs';

const T=(minute)=>`2026-03-02T12:${String(minute).padStart(2,'0')}:00.000Z`;
const base={
  sourceKind:'RECORDED_LOCAL_KIRO_CLI_SESSION',
  claimAt:T(30), sessionEndedAt:T(40),
  tests:[{at:T(20),pass:8,fail:0,exitCode:0}],
  edits:[]
};
const expectInsufficient=(x)=>{assert.equal(x.status,'INSUFFICIENT_SESSION_EVIDENCE');assert.equal(x.independentAttestation,false);assert.equal(x.semanticCorrectnessVerified,false);};
for(const [label,auditor] of [['src',auditLocalSession],['web',webAudit]]){
  test(`M288 ${label}: failed edit after passing test never yields CURRENT`,()=>{
    const x=auditor({...base,edits:[{at:T(25),file:'src/x.mjs',successful:false}]});
    expectInsufficient(x);
    assert.match(x.reason,/failed|unconfirmed|unknown/i);
  });
  test(`M288 ${label}: failed edit before passing test also has uncertain provenance`,()=>{
    const x=auditor({...base,edits:[{at:T(10),file:'src/x.mjs',successful:false}]});
    expectInsufficient(x);
  });
  test(`M288 ${label}: a failed edit after agent claim is not CURRENT`,()=>{
    const x=auditor({...base,edits:[{at:T(35),file:'src/x.mjs',successful:false}]});
    expectInsufficient(x);
  });
  test(`M288 ${label}: equal test/claim timestamps cannot prove CURRENT`,()=>{
    expectInsufficient(auditor({...base,tests:[{at:T(30),pass:8,fail:0,exitCode:0}]}));
  });
  test(`M288 ${label}: earlier test plus equal newer test is still ambiguous`,()=>{
    expectInsufficient(auditor({...base,tests:[...base.tests,{at:T(30),pass:8,fail:0,exitCode:0}]}));
  });
  test(`M288 ${label}: fraction with 4+ digits rejected, not silently truncated`,()=>{
    for(const t of ['2026-03-02T12:30:00.1234Z','2026-03-02T12:30:00.123456Z']){
      expectInsufficient(auditor({...base,claimAt:t}));
    }
  });
  test(`M288 ${label}: overly long timestamps rejected`,()=>{
    expectInsufficient(auditor({...base,claimAt:'2026-03-02T12:30:00.'+'0'.repeat(100000)+'Z'}));
  });
  test(`M288 ${label}: Windows root-relative source path rejected`,()=>{
    expectInsufficient(auditor({...base,edits:[{at:T(10),file:'\\Windows\\System32\\cmd.exe',successful:true}]}));
  });
  test(`M288 ${label}: ordinary edit then later passing test remains CURRENT`,()=>{
    assert.equal(auditor({...base,edits:[{at:T(10),file:'src/x.mjs',successful:true}]}).status,'CURRENT_SELF_RECORDED_TEST');
  });
}
test('M288 importer remains strict on over-precision',()=>{
  const rows=[
    {timestamp:'2026-03-02T12:20:00.1234Z',payload:{type:'assistant',operationType:'Say',content:'All 8 tests pass, 0 fail.'}},
  ];
  assert.equal(sourceImporter(rows.map(v=>JSON.stringify(v)).join('\n')).errorCode,'INVALID_EVENT_TIMESTAMP');
});
