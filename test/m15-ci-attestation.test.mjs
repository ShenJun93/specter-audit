import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCiReceipt} from '../scripts/build-ci-receipt.mjs';

const sha='b905070aedf371e822ccbecfb01b7922fa4cf58f';
const meta={sourceSha:sha,repository:'ShenJun93/specter-audit',
 eventName:'push',runId:'1645129',runAttempt:'1',nodeVersion:'v24.11.0'};
test('exact clean source gate uses only two fixed read-only Git operations',async()=>{
 const {validateCiCheckout}=await import('../scripts/build-ci-receipt.mjs');
 const calls=[];
 const gitRead=args=>{calls.push(args);return args[0]==='rev-parse'?sha+'\n':''};
 assert.equal(validateCiCheckout(sha,{gitRead}),true);
 assert.deepEqual(calls,[['rev-parse','HEAD'],['status','--porcelain','--untracked-files=normal']]);
});
for(const [name,expected,reader] of [
 ['different actual HEAD','a'.repeat(40),args=>args[0]==='rev-parse'?sha:''],
 ['dirty worktree',sha,args=>args[0]==='rev-parse'?sha:' M src/edited.mjs'],
 ['Git unavailable',sha,()=>{throw Error('Not a repository')}],
 ['invalid SHA','INVALID',args=>args[0]==='rev-parse'?sha:'']
]){
 test('rejects self-reported source when '+name,async()=>{
  const {validateCiCheckout}=await import('../scripts/build-ci-receipt.mjs');
  assert.throws(()=>validateCiCheckout(expected,{gitRead:reader}),/UNVERIFIED_WORKTREE/);
 });
}
function tap({tests=3,pass=3,fail=0,cancelled=0,skipped=0,todo=0}={}){
 return ['TAP version 13','# Subtest: checked source','ok 1 - checked source',
 '  ---','  duration_ms: 2.4','  ...','1..1',`# tests ${tests}`,
 '# suites 0',`# pass ${pass}`,`# fail ${fail}`,
 `# cancelled ${cancelled}`,`# skipped ${skipped}`,`# todo ${todo}`,
 '# duration_ms 19.124',''].join('\n');
}
test('valid fully passing TAP produces a bounded, explicitly self-reported SHA receipt',()=>{
 const r=buildCiReceipt(tap(),meta);
 assert.equal(r.schema,'SPECTER_CI_TEST_RECEIPT_V1');
 assert.equal(r.kind,'SELF_REPORTED_GITHUB_ACTIONS_TEST_RESULT');
 assert.equal(r.sourceCommit,sha);
 assert.equal(r.sourceRepository,meta.repository);
 assert.deepEqual(r.testSummary,{tests:3,pass:3,fail:0,cancelled:0,skipped:0,todo:0});
 assert.match(r.tapSha256,/^[a-f0-9]{64}$/);
 assert.equal(r.github.runId,'1645129');
 assert.equal(r.github.event,'push');
 assert.equal(r.independentlyAttested,false);
 assert.equal(r.localKiroSessionLinked,false);
 assert.equal(r.releaseApproved,false);
 assert.ok(r.limitations.some(s=>s.includes('externally')));
});
test('CRLF-normalized TAP is accepted but the digest remains bound to original bytes',()=>{
 const unix=tap(),windows=unix.replaceAll('\n','\r\n');
 const signed=buildCiReceipt(windows,meta);
 assert.equal(signed.testSummary.pass,3);
 assert.notEqual(signed.tapSha256,buildCiReceipt(unix,meta).tapSha256);
});
test('UTF-16 PowerShell redirection is safely rejected as binary, not an apparent pass',()=>{
 const raw=Buffer.from(tap(),'utf16le').toString('utf8');
 assert.throws(()=>buildCiReceipt(raw,meta),/INVALID_CI_TEST_REPORT/);
});
test('a summary can count nested tests differently from 1..N without guessing',()=>{
 const r=buildCiReceipt(tap({tests:486,pass:486}),meta);
 assert.equal(r.testSummary.tests,486);
 assert.equal(r.testSummary.pass,486);
});
for(const [name,report] of [
 ['failing',tap({pass:2,fail:1})],
 ['skipped',tap({pass:2,skipped:1})],
 ['cancelled',tap({pass:2,cancelled:1})],
 ['todo',tap({pass:2,todo:1})],
 ['inconsistent',tap({tests:3,pass:2})],
 ['zero',tap({tests:0,pass:0})],
 ['missing footer','TAP version 13\nok 1 - test\n'],
 ['trailing injected verdict',tap()+'# pass 999\n'],
 ['oversized',tap()+'A'.repeat(9*1024*1024)]
]){
 test('fails closed for '+name,()=>assert.throws(()=>buildCiReceipt(report,meta),/INVALID_CI_TEST_REPORT|TESTS_NOT_ALL_PASS/));
}
for(const [name,bad] of [
 ['bad sha',{sourceSha:'faked'}],
 ['untrusted repo',{repository:'other/repo?token=SECRET'}],
 ['bad event',{eventName:'workflow_run'}],
 ['bad id',{runId:'123; rm -rf /'}],
 ['no attempt',{runAttempt:''}],
 ['bad node',{nodeVersion:'node 24'}]
]){
 test('rejects unsupported provenance '+name,()=>{
  assert.throws(()=>buildCiReceipt(tap(),{...meta,...bad}),/INVALID_CI_PROVENANCE/);
 });
}
test('receipt cannot echo tool paths, secrets or raw TAP content',()=>{
 const raw=tap().replace('checked source','secret_token_TEST_CANARY_PATH_and_commands');
 const s=JSON.stringify(buildCiReceipt(raw,meta));
 assert.equal(s.includes('secret_token_TEST_CANARY'),false);
 assert.ok(s.length<2100);
 assert.ok(!s.includes('true,"independentlyAttested"'));
});
test('CI workflow runs read-only tests then uploads receipts and attests only on trusted push',async()=>{
 const yml=await readFile(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
 assert.match(yml,/node --test --test-reporter=tap "test\/\*\.test\.mjs" > out\/ci\/test\.tap/);
 assert.match(yml,/node scripts\/build-ci-receipt\.mjs/);
 assert.match(yml,/if: github\.event_name == 'push'/);
 assert.match(yml,/uses: actions\/attest@[a-f0-9]{40}/);
 assert.match(yml,/uses: actions\/upload-artifact@[a-f0-9]{40}/);
 assert.match(yml,/uses: actions\/download-artifact@[a-f0-9]{40}/);
 assert.match(yml,/needs: node-verification/);
 assert.match(yml,/id-token: write/);
 assert.match(yml,/attestations: write/);
 assert.match(yml,/permissions:\n  contents: read/);
 assert.match(yml,/subject-path: out\/ci\/receipt\.json/);
 assert.doesNotMatch(yml,/pull_request_target:|secrets\.|curl.*attestations|gh api.*POST/);
});
