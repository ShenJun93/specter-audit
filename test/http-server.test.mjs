// Node built-in integration tests: actual loopback HTTP + disposable Git repository.
import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createAppServer } from '../src/http-server.mjs';
import {makeTempDir,initRepo,writeRel,commitAll,cleanup,headOf} from './helpers.mjs';

let dir,app,head;
before(async()=>{
  dir=await makeTempDir('specter m2 http ');
  await initRepo(dir);
  await writeRel(dir,'src/auth.mjs','export const login = true;\n');
  await commitAll(dir,'initial auth');
  head=await headOf(dir);
  await writeRel(dir,'src/auth.mjs','export const login = false;\n');
  await writeRel(dir,'notes.txt','untracked scratch');
  app=await createAppServer({repoPath:dir,port:0});
});
after(async()=>{if(app)await app.close();if(dir)await cleanup(dir);});
const u=(p)=>app.url+p;
const post=(body,headers={})=>fetch(u('/api/evaluate'),{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});

test('constructor requires explicit repo path',async()=>{await assert.rejects(()=>createAppServer({}),/Explicit/);});
test('constructor rejects non-repository path',async()=>{const other=await makeTempDir('specter non repo ');try{await assert.rejects(()=>createAppServer({repoPath:other}),/not an inspectable Git repository/);}finally{await cleanup(other);}});
test('constructor rejects invalid port',async()=>{await assert.rejects(()=>createAppServer({repoPath:dir,port:-1}),/Invalid port/);});
test('HTTP socket bound only to 127.0.0.1',()=>{assert.equal(app.server.address().address,'127.0.0.1');assert.match(app.url,/^http:\/\/127\.0\.0\.1:\d+$/);});
test('GET status returns basename and counts',async()=>{const res=await fetch(u('/api/status'));const data=await res.json();assert.equal(res.status,200);assert.equal(data.repo,dir.split(/[\\/]/).pop());assert.ok(data.counts.unstaged>=1);assert.ok(data.counts.untracked>=1);});
test('GET inspection returns Git metadata without absolute repo path',async()=>{const res=await fetch(u('/api/inspection'));const txt=await res.text();assert.equal(res.status,200);assert.ok(!txt.includes(dir));const data=JSON.parse(txt);assert.equal(data.head,head);assert.ok(data.unstaged.some(x=>x.path==='src/auth.mjs'));assert.ok(data.untracked.includes('notes.txt'));});
test('GET inspection exposes no source file contents',async()=>{const txt=await (await fetch(u('/api/inspection'))).text();assert.ok(!txt.includes('export const login = false'));});
test('security headers include strict CSP',async()=>{const r=await fetch(u('/'));assert.match(r.headers.get('content-security-policy'),/default-src 'none'/);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('cache-control'),'no-store, max-age=0');});
test('no CORS permissive header',async()=>{const r=await fetch(u('/api/status'));assert.equal(r.headers.get('access-control-allow-origin'),null);});
test('GET HTML serves investigation UI',async()=>{const r=await fetch(u('/'));assert.equal(r.status,200);const txt=await r.text();assert.match(txt,/Haunted worktree/);assert.match(txt,/claim-form/);});
test('GET JS serves browser controller',async()=>{const r=await fetch(u('/app.js'));assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);assert.match(await r.text(),/renderResult/);});
test('GET CSS serves local styles',async()=>{const r=await fetch(u('/styles.css'));assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/css/);assert.match(await r.text(),/prefers-reduced-motion/);});
test('GET unknown route -> 404',async()=>{assert.equal((await fetch(u('/api/config'))).status,404);});
test('GET traversal attempt -> 404',async()=>{assert.equal((await fetch(u('/%2e%2e/%2e%2e/.env'))).status,404);});
test('GET arbitrary source file path -> 404',async()=>{assert.equal((await fetch(u('/src/git-inspector.mjs'))).status,404);});
test('POST evaluates aligned change claim',async()=>{const r=await post({claim:'fixed auth regression'});assert.equal(r.status,200);const x=await r.json();assert.equal(x.verdict.status,'SUPPORTED');assert.match(x.disclaimer,/not correctness|not independently attested/i);});
test('POST evaluates mixed claim with stale receipt conservatively',async()=>{const r=await post({claim:'fixed auth and all tests passed',receipt:{exitCode:0,head:'deadbeef',timestamp:'2026-11-03T10:00:00Z'}});assert.equal((await r.json()).verdict.status,'PARTIAL');});
test('POST ignores supplied repoPath and inspects selected repo only',async()=>{const r=await post({claim:'fixed auth regression',repoPath:'C:\\Windows\\System32'});const data=await r.json();assert.equal(data.inspection.repo,dir.split(/[\\/]/).pop());assert.ok(!JSON.stringify(data).includes('System32'));});
test('POST no claim -> 422',async()=>{const r=await post({receipt:{}});assert.equal(r.status,422);});
test('POST claim too long -> 422',async()=>{const r=await post({claim:'a'.repeat(2001)});assert.equal(r.status,422);});
test('POST invalid JSON -> 400',async()=>{const r=await post('{bad JSON');assert.equal(r.status,400);});
test('POST wrong content type -> 415',async()=>{const r=await post('a',{ 'Content-Type':'text/plain'});assert.equal(r.status,415);});
test('POST foreign origin -> 403',async()=>{const r=await post({claim:'fixed auth'},{'Origin':'https://evil.example'});assert.equal(r.status,403);});
test('POST same origin is accepted',async()=>{const r=await post({claim:'fixed auth'},{'Origin':app.url});assert.equal(r.status,200);});
test('POST forged cross-site fetch metadata -> 403',async()=>{const r=await post({claim:'fixed auth'},{'Sec-Fetch-Site':'cross-site'});assert.equal(r.status,403);});
test('POST >16KB body -> 413',async()=>{const r=await post({claim:'a'.repeat(18_000)});assert.equal(r.status,413);});
test('PUT is not allowed',async()=>{const r=await fetch(u('/api/evaluate'),{method:'PUT'});assert.equal(r.status,405);});
test('POST to unspecified route -> 404',async()=>{const r=await post({claim:'fixed auth'},{'Origin':app.url});assert.equal(r.status,200);const other=await fetch(u('/api/config'),{method:'POST'});assert.equal(other.status,404);});
test('forged Host header -> 403',async()=>{
  const port=app.server.address().port;
  const status=await new Promise((resolve,reject)=>{
    const req=request({host:'127.0.0.1',port,path:'/api/status',headers:{Host:'evil.example'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
    req.on('error',reject);req.end();
  });
  assert.equal(status,403);
});
test('favicon is served locally without a 404',async()=>{const r=await fetch(u('/favicon.svg'));assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/image\/svg\+xml/);assert.match(await r.text(),/<svg/);});
