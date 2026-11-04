// M6C: actual loopback HTTP static route and case-pack contract gates.
import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAppServer} from '../src/http-server.mjs';
import {makeTempDir,initRepo,writeRel,commitAll,cleanup} from './helpers.mjs';

const TARGET = 'b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e';
const EARLIER = '374af1417b714619d9edc1af790f7e7db15a71ca';
let root,server;
before(async()=>{
  root=await makeTempDir('specter alibi http ');
  await initRepo(root);
  await writeRel(root,'README.md','disposable fixture for Alibi Room static GET\n');
  await commitAll(root,'fixture');
  server=await createAppServer({repoPath:root,port:0});
});
after(async()=>{if(server)await server.close();if(root)await cleanup(root)});
test('alibi HTML and assets served from fixed allowlist only',async()=>{
  for(const [path,mime] of [
    ['/alibi.html','text/html'],['/alibi.css','text/css'],
    ['/alibi.js','javascript'],['/alibi-cases.json','application/json']
  ]){
    const response=await fetch(server.url+path);
    assert.equal(response.status,200,path);
    assert.match(response.headers.get('content-type'),new RegExp(mime));
    assert.match(response.headers.get('content-security-policy'),/default-src 'none'/);
    assert.equal(response.headers.get('cache-control'),'no-store, max-age=0');
    assert.ok((await response.text()).length>100);
  }
});
test('the HTML refers only to local CSS/JS and a prominent disclaimer',async()=>{
  const html=await (await fetch(server.url+'/alibi.html')).text();
  assert.match(html,/alibi\.js/);
  assert.match(html,/alibi\.css/);
  assert.match(html,/hypothetical claims/i);
  assert.match(html,/code correctness/i);
  assert.doesNotMatch(html,/<script[^>]+src=['"]https?:/i);
});
test('static pack has distinct real source runs and hypothetical case labels',async()=>{
  const r=await fetch(server.url+'/alibi-cases.json');
  const pack=await r.json();
  assert.equal(pack.schema,'SPECTER_ALIBI_EXHIBITS_V1');
  assert.equal(pack.targetCommit,TARGET);
  assert.deepEqual(pack.cases.map(c=>c.id),[
    'stale-artifact','current-exact-run','no-artifact-presented'
  ]);
  assert.deepEqual(pack.cases.map(c=>c.verdict.status),[
    'STALE_EVIDENCE','PROVIDER_REPORTED_PASS','INSUFFICIENT_EVIDENCE'
  ]);
  const stale=pack.cases[0],current=pack.cases[1];
  assert.equal(stale.verdict.selectedRun.sha,EARLIER);
  assert.equal(current.verdict.selectedRun.sha,TARGET);
  assert.equal(stale.verdict.selectedRun.sourceUrl,
    'https://github.com/ShenJun93/specter-audit/actions/runs/41736082288');
  assert.equal(current.verdict.selectedRun.sourceUrl,
    'https://github.com/ShenJun93/specter-audit/actions/runs/41742626694');
  assert.match(stale.label,/hypothetical/i);
  assert.equal(current.verdict.provenance.semanticCorrectnessVerified,false);
  assert.equal(current.verdict.provenance.independentAttestation,false);
});
test('arbitrary path traversal and source routes remain blocked',async()=>{
  for(const path of ['/src/alibi-engine.mjs','/test/alibi-engine.test.mjs',
    '/scripts/capture-alibi-cases.mjs','/alibi-private.json','/%2e%2e/.env']){
    assert.equal((await fetch(server.url+path)).status,404,path);
  }
});

test('homepage clearly links to the newer alibi evidence investigation',async()=>{
  const html=await (await fetch(server.url+'/')).text();
  assert.match(html,/href="\/alibi\.html"/);
  assert.match(html,/The CI passed|tests passed on the wrong commit/i);
  assert.match(html,/id="instance-kind"/);
});
