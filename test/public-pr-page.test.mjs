import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAppServer} from '../src/http-server.mjs';
let server;
before(async()=>{server=await createAppServer({repoPath:process.cwd(),port:0})});
after(async()=>{await server?.close()});
const get=p=>fetch(server.url+p);

test('PR proof HTML is a real allowlisted local page',async()=>{
 const r=await get('/pr-proof.html');assert.equal(r.status,200);
 assert.match(r.headers.get('content-type'),/text\/html/);
 const txt=await r.text();
 assert.match(txt,/pr-form/);assert.match(txt,/local Kiro session/i);
 assert.match(txt,/type="module" src="\/pr-proof.js"/);
 assert.doesNotMatch(txt,/<script[^>]*>(?!\s*<\/script>)[\s\S]*?<\/script>/i);
});
test('PR page alone may connect to GitHub public REST',async()=>{
 const pr=(await get('/pr-proof.html')).headers.get('content-security-policy');
 const live=(await get('/live.html')).headers.get('content-security-policy');
 const alibi=(await get('/alibi.html')).headers.get('content-security-policy');
 const index=(await get('/')).headers.get('content-security-policy');
 assert.match(pr,/connect-src 'self' https:\/\/api\.github\.com/);
 for(const csp of [live,alibi,index]){
  assert.match(csp,/connect-src 'self'/);
  assert.doesNotMatch(csp,/api\.github\.com/);
 }
});
test('new page preserves restrictive non-CSP protections',async()=>{
 const r=await get('/pr-proof.html');
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.equal(r.headers.get('x-frame-options'),'DENY');
 assert.equal(r.headers.get('referrer-policy'),'no-referrer');
 assert.equal(r.headers.get('cache-control'),'no-store, max-age=0');
 assert.equal(r.headers.get('access-control-allow-origin'),null);
});
for(const [uri,mime,pattern] of [
 ['/pr-proof.js',/javascript/,/inspectPublicPr/],
 ['/pr-proof.css',/text\/css/,/pr-boundary/],
 ['/public-pr-evidence.mjs',/javascript/,/parsePublicPrUrl/]
]){
 test('serves '+uri+' from fixed allowlist',async()=>{
  const r=await get(uri);assert.equal(r.status,200);
  assert.match(r.headers.get('content-type'),mime);
  assert.match(await r.text(),pattern);
 });
}
test('does not expose Git or private system files through PR route',async()=>{
 for(const path of ['/test/public-pr-evidence.test.mjs','/src/http-server.mjs','/pr-proof.html/../../.env','/api/github/token']){
  const r=await get(path);assert.notEqual(r.status,200,path);
 }
});
test('PR page does not send a request until user opts in',async()=>{
 const s=await(await get('/pr-proof.js')).text();
 assert.match(s,/form\.addEventListener\('submit'/);
 assert.doesNotMatch(s,/inspectPublicPr\(['"]https:\/\/github/);
 assert.match(s,/latest=await inspectPublicPr\(input\.value\)/);
});
test('browser DOM rendering uses textContent and nodes, not innerHTML',async()=>{
 const s=await(await get('/pr-proof.js')).text();
 assert.doesNotMatch(s,/(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write)\s*[=(]/);
 assert.match(s,/link\.rel='noopener noreferrer'/);
});
test('Vercel public PR CSP has exactly one matching policy',async()=>{
 const cfg=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 const patterns=cfg.headers.map(h=>({src:h.source,match:new RegExp('^'+h.source+'$')}));
 assert.equal(patterns.length,2);
 for(const pathname of ['/','/live.html','/alibi.html','/index.html']){
  const matches=patterns.filter(x=>x.match.test(pathname));
  assert.equal(matches.length,1,pathname);
  const h=cfg.headers.find(x=>x.source===matches[0].src);
  assert.ok(h.headers.some(x=>x.key==='Content-Security-Policy'&&!x.value.includes('api.github.com')));
 }
 const matches=patterns.filter(x=>x.match.test('/pr-proof.html'));
 assert.equal(matches.length,1);
 const pr=cfg.headers.find(x=>x.source===matches[0].src);
 assert.ok(pr.headers.some(x=>x.key==='Content-Security-Policy'&&x.value.includes("connect-src 'self' https://api.github.com")));
});
test('all three existing judge entrypoints link to Proof Chain without JavaScript',async()=>{
 for(const page of ['/','/alibi.html','/live.html']){
  const res=await get(page);
  assert.equal(res.status,200,page);
  assert.match(await res.text(),/href="\/pr-proof\.html"/,page);
 }
});
test('PR form prevents changing the URL while evidence lookup is in flight',async()=>{
 const src=await(await get('/pr-proof.js')).text();
 assert.match(src,/button\.disabled=true;input\.disabled=true;/);
 assert.match(src,/finally\{input\.disabled=false;button\.disabled=false;/);
});

test('UNKNOWN and invalid PR URL must not claim a GitHub provider observation',async()=>{
 const s=await(await get('/pr-proof.js')).text();
 assert.match(s,/NO PROVIDER EVIDENCE/);
 assert.match(s,/PR HEAD OBSERVED.*CI UNKNOWN/);
 assert.match(s,/data\.status===['"]OBSERVED_EXACT_SHA_RUNS['"]/);
});

test('changing the public PR target invalidates prior green provider evidence',async()=>{
 const s=await(await get('/pr-proof.js')).text();
 assert.match(s,/function invalidatePrObservation\(\)\{/);
 const block=s.match(/function invalidatePrObservation\(\)\{([\s\S]*?)\n\}/);
 assert.ok(block);
 for(const safe of ["latest=null", "$('pr-report').hidden=true", "$('pr-empty').hidden=false", "$('pr-provenance').textContent='NOT YET REQUESTED'", "CustomEvent('specter:pr-observed',{detail:null})"]){
  assert.ok(block[1].includes(safe),'missing invalidation: '+safe);
 }
 assert.match(s,/input\.addEventListener\('input',\(\)=>\{\s*if\(button\.disabled\)return;\s*clearError\(\);\s*invalidatePrObservation\(\);/);
 assert.match(s,/form\.addEventListener\('submit',async e=>\{[\s\S]*?clearError\(\);\s*invalidatePrObservation\(\);\s*button\.disabled=true;/);
});
