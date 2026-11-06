// Operator-only, fixed-source M6F publication of a scrubbed Kiro session exhibit.
// Never reads raw Kiro logs. No CLI paths, network, secrets or dynamic repo access.
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {auditLocalSession} from '../src/kiro-session-staleness.mjs';
const sourceFile=new URL('../qa/private/specter-m6e-kiro-provenance-20261104/real-session-stale-public-safe.json',import.meta.url);
const outputFile=new URL('../web/alibi-session-case.json',import.meta.url);
const FIXED_TRACE='48f82b65a652dc2a7f4b4de8d20716af45c798152cf5d4c95867443bb2847d12';
const fail=message=>{throw Error('M6F_CAPTURE_FAIL: '+message)};
if(process.argv.length!==3||process.argv[2]!=='--capture')fail('explicit --capture required');
const input=JSON.parse(await readFile(sourceFile,'utf8'));
if(input.schema!=='SPECTER_AUTHENTIC_AGENT_STALE_TEST_EXHIBIT_V1' ||
 input.origin!=='RECORDED_LOCAL_KIRO_CLI_SESSION' ||
 input.sourceTraceSha256!==FIXED_TRACE ||
 input.originalAgentClaim?.text!=='All 120 tests pass, 0 fail.' ||
 input.testEvidenceBeforeClaim?.pass!==120 ||
 input.testEvidenceBeforeClaim?.fail!==0 ||
 input.testEvidenceBeforeClaim?.exit!==0 ||
 input.testEvidenceBeforeClaim?.kind!=='KIRO_EXECUTE_PWSH_TOOL_RESULT' ||
 input.finding!=='OBSERVED_STALE_LOCAL_TEST_ARTIFACT' ||
 input.selfRecorded!==true || input.independentlyAttested!==false ||
 input.semanticCorrectnessVerified!==false ||
 input.afterFinalEdit?.furtherTestRunsObservedInThisSavedSession!==0 ||
 input.afterFinalEdit?.outsideSessionEvidenceUnknown!==true ||
 !Array.isArray(input.subsequentSuccessfulSourceEdits) ||
 input.subsequentSuccessfulSourceEdits.length!==5)fail('fixed source provenance');
const timestamp=t=>typeof t==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(t)&&Number.isFinite(Date.parse(t));
if(!timestamp(input.capturedAt)||!timestamp(input.originalAgentClaim.observedAt) ||
 !timestamp(input.testEvidenceBeforeClaim.at) ||
 !timestamp(input.lastObservedSuccessfulEditAt))fail('timestamp');
if(input.subsequentSuccessfulSourceEdits.some(e=>e.file!=='src/github-actions-evidence.mjs'||
 e.kind!=='SUCCESSFUL_KIRO_SOURCE_EDIT'||!timestamp(e.at)))fail('unexpected edits');
const testAt=input.testEvidenceBeforeClaim.at;
const claimAt=input.originalAgentClaim.observedAt;
const edits=input.subsequentSuccessfulSourceEdits.map(e=>({at:e.at,file:e.file,successful:true}));
if(!(Date.parse(testAt)<Date.parse(claimAt)&&edits.every(e=>Date.parse(e.at)>Date.parse(claimAt))&&
 edits.at(-1).at===input.lastObservedSuccessfulEditAt))fail('evidence chronology');
const auditInput={
 sourceKind:'RECORDED_LOCAL_KIRO_CLI_SESSION',
 claimAt,sessionEndedAt:input.lastObservedSuccessfulEditAt,
 tests:[{at:testAt,pass:120,fail:0,exitCode:0}],edits
};
const verdict=auditLocalSession(auditInput);
if(verdict.status!=='STALE_LOCAL_TEST_EVIDENCE'||verdict.independentAttestation!==false ||
 verdict.semanticCorrectnessVerified!==false||verdict.timeline.length!==6)fail('auditor disagrees');
const exhibit={
 schema:'SPECTER_ALIBI_RECORDED_KIRO_SESSION_V1',
 id:'real-kiro-session',
 project:'ShenJun93/specter-audit',
 title:'The midnight rewrite',
 summary:'A genuine Kiro CLI test report passed, then the same agent made five later source edits. The earlier result cannot establish their final tested state.',
 origin:'RECORDED_LOCAL_KIRO_CLI_SESSION',
 capturedAt:input.capturedAt,
 sourceTraceSha256:FIXED_TRACE,
 claim:{text:input.originalAgentClaim.text,observedAt:claimAt},
 toolEvidence:{kind:'KIRO_EXECUTE_PWSH_TOOL_RESULT',at:testAt,pass:120,fail:0,exitCode:0},
 sourceEdits:edits,
 sessionEndedAt:input.lastObservedSuccessfulEditAt,
 afterFinalEdit:{furtherTestRunsObservedInThisSavedSession:0,outsideSessionEvidenceUnknown:true},
 finding:{status:verdict.status,reason:verdict.reason,independentAttestation:false,semanticCorrectnessVerified:false,
  headline:'Tests passed. Then the code changed.',
  gaps:[
   'Five successful source edits followed the last recorded passing test.',
   'No rerun was observed after those edits within this saved Kiro session.',
   'Other sessions or later CI could contain additional evidence; code correctness is not evaluated.'
  ]},
 provenanceNote:'Recorded Kiro CLI tool results from a local editable session; captured SHA-256 is a fingerprint, not a signed attestation.',
 privacyNote:'Only selected, pre-scrubbed timestamps, public source file name, outcome counts and digest are shown. No raw session or terminal output is published.'
};
const output=JSON.stringify(exhibit,null,2)+'\n';
if(/[A-Z]:\\|\\\\\?\\|AppData|PACMAP|sess_[0-9a-f]{8}|sk-proj-/i.test(output))fail('private content detected');
await writeFile(outputFile,output);
console.log(JSON.stringify({result:'M6F_RECORDED_KIRO_EXHIBIT_CAPTURE_PASS',
 output:fileURLToPath(outputFile),status:verdict.status,edits:edits.length,
 traceSha256:FIXED_TRACE,bytes:Buffer.byteLength(output)}));
