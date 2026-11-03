// Synthetic judge fixture: real Git evidence, real HTTP evaluation, no test execution.
import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {rm} from 'node:fs/promises';
import {createJudgeFixture} from '../scripts/create-judge-fixture.mjs';
import {inspectRepository} from '../src/git-inspector.mjs';
import {evaluateClaim} from '../src/claim-evaluator.mjs';
import {createAppServer} from '../src/http-server.mjs';

let fixture,inspection,app;
before(async()=>{
  fixture=await createJudgeFixture();
  inspection=await inspectRepository(fixture.dir);
  app=await createAppServer({repoPath:fixture.dir});
});
after(async()=>{if(app)await app.close();if(fixture)await rm(fixture.dir,{recursive:true,force:true});});

test('fixture creates genuine committed HEAD and a modified tracked auth path',()=>{
  assert.match(fixture.head,/^[a-f0-9]{40}$/);
  assert.equal(inspection.ok,true);
  assert.equal(inspection.head,fixture.head);
  assert.ok(inspection.unstaged.some(f=>f.path==='src/auth/login.mjs'));
  assert.ok(inspection.untracked.length>0);
});
test('synthetic demo outcomes all come from the evaluator, never fixed UI labels',()=>{
  assert.deepEqual(fixture.scenarios.map(s=>s.id),['unverified','partial','supported']);
  for(const scenario of fixture.scenarios) {
    const result=evaluateClaim({claim:scenario.claim,inspection,receipt:scenario.receipt??undefined});
    assert.equal(result.status,scenario.expected,scenario.id);
    assert.ok(result.gaps.some(x=>/not that the code is correct/i.test(x)),scenario.id);
  }
});
test('fabricated-but-consistent test receipt never upgrades pure test claim to supported',()=>{
  const result=evaluateClaim({claim:'all tests pass',inspection,receipt:fixture.receipt});
  assert.equal(result.status,'UNVERIFIED');
  assert.equal(result.details.receiptVerdict,'metadata-consistent');
  assert.equal(result.details.independentlyAttested,false);
});
test('fabricated-but-consistent test receipt never upgrades mixed claim beyond partial',()=>{
  const result=evaluateClaim({claim:'updated auth login and all tests pass',inspection,receipt:fixture.receipt});
  assert.equal(result.status,'PARTIAL');
  assert.equal(result.details.receiptVerdict,'metadata-consistent');
});
test('HTTP judge demo exercises all three real verdicts',async()=>{
  for(const scenario of fixture.scenarios){
    const r=await fetch(app.url+'/api/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({claim:scenario.claim,...(scenario.receipt?{receipt:scenario.receipt}:{})})});
    assert.equal(r.status,200,scenario.id);
    const data=await r.json();
    assert.equal(data.verdict.status,scenario.expected,scenario.id);
    assert.equal(data.inspection.repo,fixture.dir.split(/[\\/]/).at(-1));
  }
});
test('judge fixture is entirely separate from the real project',()=>{
  assert.match(fixture.dir,/specter-judge-/);
  assert.notEqual(inspection.root,process.cwd());
  assert.ok(fixture.dir.includes('specter-judge-'));
});
