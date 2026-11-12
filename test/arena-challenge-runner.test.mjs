import test from 'node:test';
import assert from 'node:assert/strict';
import {validateManifest,parseTap,classifyBehavior,runApprovedChallenge}
 from '../scripts/arena-challenge-runner.mjs';

const SHA1='a'.repeat(40),SHA2='b'.repeat(40),DIGEST='c'.repeat(64);
const manifest=()=>({
 schema:'SPECTER_REVIEWER_CHALLENGE_V1',repository:'owner/project',
 repoPath:'C:/workspace/fixture',baseSha:SHA1,headSha:SHA2,
 sourcePath:'src/candidate.mjs',testPath:'C:/reviewer/approved.test.mjs',
 testSha256:DIGEST,expectedBehavior:'The result is stable for all inputs.'
});
const tap=(tests,pass,fail,skip=0,cancel=0)=>
 '# tests '+tests+'\n# pass '+pass+'\n# fail '+fail+
 '\n# skipped '+skip+'\n# cancelled '+cancel+'\n';

test('manifest is explicit, fully pinned, and refuses traversal/unapproved paths',()=>{
 assert.equal(validateManifest(manifest()).sourcePath,'src/candidate.mjs');
 assert.equal(validateManifest(manifest()).testSha256,DIGEST);
 for(const changes of [
  {schema:'other'},{baseSha:SHA2},{baseSha:SHA2.toUpperCase(),headSha:SHA2},{sourcePath:'../secrets.mjs'},
  {sourcePath:'src/../../evil.mjs'},{sourcePath:'src/foo\\bar.mjs'},
  {sourcePath:'https://evil.invalid/code.mjs'},{repository:'owner/../repo'},
  {testSha256:'bad'},{expectedBehavior:'ok'}
 ]){
  assert.throws(()=>validateManifest({...manifest(),...changes}),/INVALID_REVIEWER_CHALLENGE_MANIFEST/);
 }
});
test('TAP parser enforces positive test count, no skip, no cancel and bounded rows',()=>{
 assert.deepEqual(parseTap(tap(1,1,0)),{tests:1,passed:1,failed:0,skipped:0,cancelled:0});
 assert.equal(parseTap(tap(1,0,1))?.failed,1);
 for(const s of [tap(0,0,0),tap(1,0,0),tap(2,1,0),tap(1,1,0,1),tap(1,0,0,1),tap(1,0,0,0,1),tap(1,1,0)+'# pass 1\n', 'not tap',tap(1,1,0).repeat(10000)])
  assert.equal(parseTap(s),null);
});
const good=(exitCode)=>{
 const t=exitCode===0?{tests:1,passed:1,failed:0,skipped:0,cancelled:0}
 :{tests:1,passed:0,failed:1,skipped:0,cancelled:0};
 return {status:'OBSERVED_TEST',exitCode,tap:t};
};
test('two-revision test result never confuses regression, fix, both pass/fail',()=>{
 assert.equal(classifyBehavior(good(0),good(1)),'REGRESSION');
 assert.equal(classifyBehavior(good(1),good(0)),'DEMONSTRATED_FIX');
 assert.equal(classifyBehavior(good(0),good(0)),'BOTH_PASS');
 assert.equal(classifyBehavior(good(1),good(1)),'BOTH_FAIL');
});
test('Docker/setup failures, no TAP tests, invalid exit codes and skipped tests are UNKNOWN',()=>{
 for(const r of [
  {status:'UNKNOWN',exitCode:null,tap:null},
  {...good(0),exitCode:125},
  {...good(0),tap:{tests:0,passed:0,failed:0,skipped:0,cancelled:0}},
  {...good(0),tap:{tests:1,passed:0,failed:0,skipped:1,cancelled:0}},
  {...good(1),tap:{tests:1,passed:1,failed:0,skipped:0,cancelled:0}},
  null
 ])assert.equal(classifyBehavior(good(0),r),'UNKNOWN');
});
test('cannot run Docker without explicit reviewer approval',async()=>{
 await assert.rejects(runApprovedChallenge(manifest()),/REVIEWER_APPROVAL_REQUIRED/);
});
test('M121 runner does not persist raw Docker stdout/stderr or secret-bearing output samples',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../scripts/arena-challenge-runner.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/outputSample|sanitiseOutput|STDOUT_LIMIT/);
 assert.match(source,/stdoutSha256:sha256\(result.stdout\)/);
 assert.match(source,/stderrSha256:sha256\(result.stderr\)/);
 assert.match(source,/stdoutBytes:Buffer.byteLength\(result.stdout\)/);
});