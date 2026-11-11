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
    ['/alibi.js','javascript'],['/alibi-cases.json','application/json'],
    ['/alibi-session-case.json','application/json']
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
    '/scripts/capture-alibi-cases.mjs','/scripts/capture-kiro-session-exhibit.mjs',
    '/src/kiro-session-staleness.mjs','/qa/private/kiro-session.json',
    '/alibi-private.json','/%2e%2e/.env']){
    assert.equal((await fetch(server.url+path)).status,404,path);
  }
});

test('homepage clearly links to the newer alibi evidence investigation',async()=>{
  const html=await (await fetch(server.url+'/')).text();
  assert.match(html,/href="\/alibi\.html"/);
  assert.match(html,/<a class="alibi-room-cta" href="\/alibi\.html#case-room">/);
  assert.match(html,/120 tests passed.*five later edits/i);
  assert.match(html,/id="instance-kind"/);
});
test('fourth recorded Kiro case is distinctly labeled, initially disabled and bounded',async()=>{
  const html=await (await fetch(server.url+'/alibi.html')).text();
  assert.match(html,/data-case="real-kiro-session"[^>]+disabled/);
  assert.match(html,/AUTHENTIC KIRO/i);
  assert.match(html,/hypothetical claims/i);
  assert.match(html,/self-recorded local test/i);
  const r=await fetch(server.url+'/alibi-session-case.json');
  assert.equal(r.status,200);
  const raw=await r.text();
  assert.ok(raw.length<14000);
  const data=JSON.parse(raw);
  assert.equal(data.id,'real-kiro-session');
  assert.equal(data.schema,'SPECTER_ALIBI_RECORDED_KIRO_SESSION_V1');
  assert.equal(data.toolEvidence.pass,120);
  assert.equal(data.sourceEdits.length,5);
  assert.equal(data.finding.status,'STALE_LOCAL_TEST_EVIDENCE');
  assert.equal(data.finding.independentAttestation,false);
  assert.equal(data.afterFinalEdit.outsideSessionEvidenceUnknown,true);
  assert.doesNotMatch(raw,/[A-Z]:\\|AppData|PACMAP|sess_[a-f0-9]{8}|sk-proj-/i);
});
