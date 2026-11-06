import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createAppServer} from '../src/http-server.mjs';
let server;
before(async()=>{server=await createAppServer({repoPath:process.cwd(),port:0})});
after(async()=>server?.close());
const get=path=>fetch(server.url+path);
test('trial exhibit is opt-in and reachable from public PR page',async()=>{
 const res=await get('/pr-proof.html');assert.equal(res.status,200);
 const page=await res.text();
 for(const id of ['trial-court','trial-heading','trial-file','trial-analyze','trial-stale','trial-retest',
  'trial-clear','trial-local-status','trial-pr-status','trial-next','trial-download','trial-copy']){
  assert.match(page,new RegExp('id="'+id+'"'));
 }
 assert.match(page,/src="\/trial-ui\.mjs"/);
 assert.match(page,/NO FALSE VERDICTS/);
 assert.match(page,/RELEASE EVIDENCE INCOMPLETE/);
 assert.match(page,/EXPLICITLY SYNTHETIC/);
});
for(const [route,pattern] of [
 ['/trial-ui.mjs',/summarizeLocalSession/],
 ['/evidence-trial.mjs',/combineTrial/]
]){
 test('serves '+route+' with JavaScript MIME',async()=>{
  const res=await get(route);
  assert.equal(res.status,200);
  assert.match(res.headers.get('content-type'),/javascript/);
  assert.match(await res.text(),pattern);
 });
}
test('Evidence Trial uses existing PR-specific CSP only',async()=>{
 const trial=await get('/pr-proof.html');const csp=trial.headers.get('content-security-policy');
 assert.match(csp,/connect-src 'self' https:\/\/api\.github\.com/);
 const live=await get('/live.html');
 assert.doesNotMatch(live.headers.get('content-security-policy'),/api\.github\.com/);
});
test('no automatic external request or private-file network upload in trial UI',async()=>{
 const src=await(await get('/trial-ui.mjs')).text();
 assert.doesNotMatch(src,/\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\b|navigator\.sendBeacon/);
 assert.doesNotMatch(src,/\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|\bdocument\.write\b/);
 assert.match(src,/selected\.text\(\)/);
 assert.match(src,/clearFile\(\)/);
 assert.match(src,/summarizeLocalSession\(raw,\{synthetic:false\}\)/);
 assert.match(src,/JSON\.stringify\(combineTrial\(local,provider\)/);
 assert.match(src,/EXPLICITLY SYNTHETIC/);
});
test('PR inspector clears previous observation before new fetch',async()=>{
 const src=await(await get('/pr-proof.js')).text();
 assert.match(src,/latest=null;\s*window\.dispatchEvent\(new CustomEvent\('specter:pr-observed',\{detail:null\}\)\)/);
 assert.match(src,/window\.dispatchEvent\(new CustomEvent\('specter:pr-observed',\{detail:data\}\)\)/);
});
test('local parser and trial UI retain safe static-script isolation',async()=>{
 const page=await(await get('/pr-proof.html')).text();
 assert.doesNotMatch(page,/<script[^>]+(?:src=['"]https?:\/\/)/i);
 assert.doesNotMatch(page,/<script(?![^>]*src=)[^>]*>/i);
 const ui=await(await get('/trial-ui.mjs')).text();
 assert.doesNotMatch(ui,/localStorage|sessionStorage|indexedDB/);
 assert.doesNotMatch(ui,/document\.cookie/);
});

test('Clear, synthetic switch and new selection invalidate an in-flight file read',async()=>{
 const src=await(await get('/trial-ui.mjs')).text();
 assert.match(src,/sessionEpoch=0/);
 assert.match(src,/const epoch=\+\+sessionEpoch/);
 assert.match(src,/if\(epoch!==sessionEpoch\)return/);
 assert.match(src,/file\.addEventListener\('change',\(\)=>\{\s*sessionEpoch\+\+/);
 assert.match(src,/function example\(kind\)\{\s*sessionEpoch\+\+/);
 assert.match(src,/\$\('trial-clear'\)\.addEventListener\('click',\(\)=>\{\s*sessionEpoch\+\+/);
 assert.match(src,/if\(epoch===sessionEpoch\)\{clearFile\(\);render\(\)\}/);
});
