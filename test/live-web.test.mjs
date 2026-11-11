import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createAppServer} from '../src/http-server.mjs';
const root=resolve(import.meta.dirname,'..');
const load=path=>readFile(resolve(root,path));
test('pure Kiro audit and import modules are identical to published browser copies',async()=>{
 for(const name of ['kiro-session-staleness.mjs','kiro-session-import.mjs']){
  const [source,web]=await Promise.all([load('src/'+name),load('web/'+name)]);
  assert.deepEqual(web,source);
 }
});
test('local HTML is a working file-driven user flow with explicit trust boundaries',async()=>{
 const html=(await load('web/live.html')).toString('utf8');
 assert.match(html,/id="session-file".*type="file"/);
 assert.match(html,/id="analyze-file"/);
 assert.match(html,/id="try-sample"/);
 assert.match(html,/id="live-timeline"/);
 assert.match(html,/BROWSER-ONLY · NO UPLOAD/);
 assert.match(html,/Raw prompts, commands and private paths are never rendered/);
});
test('no supported agent claim displays bounded event counts without a passing verdict',async()=>{
 const [html,js]=await Promise.all([load('web/live.html'),load('web/live.js')]);
 const page=html.toString('utf8'),controller=js.toString('utf8');
 for(const id of ['live-unverified','metric-unverified-events','metric-unverified-calls','metric-unverified-results']){
  assert.match(page,new RegExp('id="'+id+'"'));
 }
 assert.match(page,/A missing supported claim is not evidence that no tests ran/);
 assert.match(controller,/parsed\.errorCode==='NO_RECORDED_AGENT_TEST_CLAIM'/);
 assert.match(controller,/Number\.isSafeInteger\(summary\[k\]\)/);
 assert.match(controller,/\$\('live-report'\)\.hidden=true/);
 assert.match(controller,/\$\('live-unverified'\)\.hidden=true/);
});
test('browser controller does not fetch, send or persist selected session data',async()=>{
 const src=(await load('web/live.js')).toString('utf8');
 assert.doesNotMatch(src,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|WebSocket/);
 assert.match(src,/file\.text\(\)/);
 assert.match(src,/\.textContent\s*=/);
 assert.doesNotMatch(src,/\.innerHTML\s*=/);
});
test('loopback app serves only explicit static files and blocks arbitrary private content',async()=>{
 const app=await createAppServer({repoPath:root,port:0});
 try{
  for(const [path,type] of [
   ['/live.html','text/html'],
   ['/live.css','text/css'],
   ['/live.js','text/javascript'],
   ['/kiro-session-import.mjs','text/javascript'],
   ['/kiro-session-staleness.mjs','text/javascript']
  ]){
   const r=await fetch(app.url+path);
   assert.equal(r.status,200,path);
   assert.match(r.headers.get('content-type'),new RegExp(type));
   assert.match(r.headers.get('content-security-policy'),/connect-src 'self'/);
   assert.ok((await r.text()).length>200);
  }
  for(const path of ['/qa/private/secret.jsonl','/src/kiro-session-import.mjs','/upload','/src/kiro-session-staleness.mjs']){
   const r=await fetch(app.url+path);
   assert.equal(r.status,404,path);
  }
  const post=await fetch(app.url+'/live.html',{method:'POST'});
  assert.equal(post.status,404);
 }finally{await app.close()}
});
