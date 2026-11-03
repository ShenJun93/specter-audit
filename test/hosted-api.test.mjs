// Hosted Vercel functions: validate replay provenance and real evaluator semantics.
// No Git subprocess is started by these requests; the snapshot is generated separately.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GET as getInspection,POST as noPostInspection} from '../api/inspection.js';
import {GET as getStatus} from '../api/status.js';
import {POST as evaluate,GET as noGetEvaluate} from '../api/evaluate.js';

const origin='https://specter-demo.example.test';
function makeRequest(path,body,headers={}) {
  return new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
}
async function verdict(claim,receipt){
  const response=await evaluate(makeRequest('/api/evaluate',{claim,...(receipt?{receipt}:{})}));
  assert.equal(response.status,200);
  return response.json();
}
test('hosted inspection is explicitly synthetic and non-live',async()=>{
  const r=await getInspection();
  assert.equal(r.status,200);
  const i=await r.json();
  assert.equal(i.demoMode,true);
  assert.match(i.provenance,/Precomputed/);
  assert.match(i.head,/^[a-f0-9]{40}$/);
  assert.equal(i.repo,'synthetic-judge-fixture');
  assert.ok(i.unstaged.some(x=>x.path==='src/auth/login.mjs'));
  assert.ok(!JSON.stringify(i).includes('E:\\'));
});
test('hosted status shows synthetic fixture label',async()=>{
  const r=await getStatus();
  const d=await r.json();
  assert.equal(d.demoMode,true);
  assert.ok(d.counts.unstaged>=1);
  assert.equal(d.repo,'synthetic-judge-fixture');
});
test('hosted claim: standalone fake test pass stays UNVERIFIED',async()=>{
  const data=await verdict('all tests pass');
  assert.equal(data.verdict.status,'UNVERIFIED');
  assert.equal(data.inspection.demoMode,true);
});
test('hosted claim: combined change/test stays PARTIAL',async()=>{
  const data=await verdict('updated auth login and all tests pass');
  assert.equal(data.verdict.status,'PARTIAL');
});
test('hosted claim: path alignment SUPPORTED but not correctness',async()=>{
  const data=await verdict('updated auth login validation');
  assert.equal(data.verdict.status,'SUPPORTED');
  assert.match(data.disclaimer,/not semantic correctness/);
});
test('matching synthetic HEAD does not create independent test proof',async()=>{
  const head=(await (await getInspection()).json()).head;
  const data=await verdict('all tests pass',{exitCode:0,head,timestamp:new Date().toISOString(),command:'npm test'});
  assert.equal(data.verdict.status,'UNVERIFIED');
  assert.equal(data.verdict.details.receiptVerdict,'metadata-consistent');
});
test('hosted POST cross-origin rejected',async()=>{
  const r=await evaluate(makeRequest('/api/evaluate',{claim:'updated auth login'}, {'Origin':'https://evil.invalid'}));
  assert.equal(r.status,403);
});
test('hosted POST invalid JSON rejected',async()=>{
  const r=await evaluate(makeRequest('/api/evaluate','{bad json'));
  assert.equal(r.status,400);
});
test('hosted POST oversize rejected',async()=>{
  const r=await evaluate(makeRequest('/api/evaluate',{claim:'x'.repeat(20_000)}));
  assert.equal(r.status,413);
});
test('hosted POST wrong content type rejected',async()=>{
  const r=await evaluate(makeRequest('/api/evaluate','hello',{'Content-Type':'text/plain'}));
  assert.equal(r.status,415);
});
test('hosted GET/POST method restrictions',async()=>{
  assert.equal((await noPostInspection()).status,405);
  assert.equal((await noGetEvaluate()).status,405);
});
test('hosted endpoint never returns absolute source paths',async()=>{
  const r=await verdict('updated auth login');
  const s=JSON.stringify(r);
  assert.ok(!s.includes('E:\\Projects'));
  assert.ok(!s.includes('C:\\Users'));
});
