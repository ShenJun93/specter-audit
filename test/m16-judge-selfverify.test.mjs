import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAppServer} from '../src/http-server.mjs';

const fullSha='70eec77327fee7e86e6b52b57e9ab539c372bd94';
const runId='42323178158';
const from=path=>readFile(new URL('../web/'+path,import.meta.url),'utf8');
test('judge page offers a prominently linked immutable signed-CI reference',async()=>{
 const html=await from('pr-proof.html');
 assert.match(html,/<section id="ci-reference"[^>]+aria-labelledby="ci-reference-title"/);
 assert.match(html,/href="#ci-reference"/);
 assert.match(html,/id="ci-reference-title"/);
 assert.match(html,/id="ci-reference-run"/);
 assert.match(html,/id="ci-reference-commit"/);
 assert.match(html,new RegExp(fullSha));
 assert.match(html,new RegExp(runId));
 assert.match(html,/https:\/\/github\.com\/ShenJun93\/specter-audit\/actions\/runs\/42323178158/);
});
test('historical reference explicitly does NOT certify arbitrary PR or local Kiro',async()=>{
 const html=await from('pr-proof.html');
 assert.match(html,/historical/i);
 assert.match(html,/not the inspected PR/i);
 assert.match(html,/not.*Kiro session/i);
 assert.match(html,/not a release approval/i);
 assert.match(html,/verified on November 7, 2026/i);
});
test('reproducible command constrains source SHA, exact signer workflow, source ref and repo',async()=>{
 const html=await from('pr-proof.html');
 assert.match(html, /gh run download 42323178158 -R ShenJun93\/specter-audit/);
 assert.match(html,/gh attestation verify/);
 assert.match(html,/--source-digest 70eec77327fee7e86e6b52b57e9ab539c372bd94/);
 assert.match(html,/--source-ref refs\/heads\/feat\/m15-attested-ci-receipts/);
 assert.match(html,/--signer-workflow ShenJun93\/specter-audit\/\.github\/workflows\/ci\.yml/);
 assert.match(html,/test\.tap/);
 assert.match(html,/receipt\.json/);
});
test('judge verification region has accessible progressive disclosure and copy status',async()=>{
 const html=await from('pr-proof.html');
 assert.match(html,/<details[^>]*class="ci-reference-commands"/);
 assert.match(html,/<summary>Verify signed receipt/);
 assert.match(html,/id="ci-reference-command"/);
 assert.match(html,/id="ci-reference-copy"/);
 assert.match(html,/id="ci-reference-copy-status"[^>]*role="status"[^>]*aria-live="polite"/);
 assert.match(html,/src="\/ci-reference\.js"/);
 assert.doesNotMatch(html,/<script(?![^>]*src=)[^>]*>/i);
 assert.doesNotMatch(html, /\sonclick=/i);
});
test('copy code is network-free, storage-free, and cannot inject copied HTML',async()=>{
 const js=await from('ci-reference.js');
 assert.match(js,/addEventListener\('click'/);
 assert.match(js,/clipboard\.writeText/);
 assert.match(js,/textContent/);
 assert.doesNotMatch(js,/innerHTML|outerHTML|insertAdjacentHTML|fetch\(|localStorage|sessionStorage|eval\(/);
});
test('mobile CI reference uses internal code scrolling without viewport overscroll',async()=>{
 const css=await from('pr-proof.css');
 assert.match(css,/\.ci-reference-command-wrap[^\{]*\{[^}]*overflow-x:auto/);
 assert.match(css,/\.ci-reference\b/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/@media\(max-width:600px\)/);
});
test('new proof section is not a dynamic gate or unverified runtime status',async()=>{
 const html=await from('pr-proof.html');
 assert.match(html,/STATIC HISTORICAL EXAMPLE/);
 assert.doesNotMatch(html,/M16 RELEASE APPROVED|Kiro-native VERIFIED|SESSION TO COMMIT VERIFIED/);
 const js=await from('ci-reference.js');
 assert.doesNotMatch(js, /setInterval|addEventListener\('load'|fetch\(|XMLHttpRequest/);
});
test('server exposes the optional static helper under existing restrictive CSP',async()=>{
 const server=await createAppServer({repoPath:process.cwd(),port:0});
 try{
  const [page,script]=await Promise.all([fetch(server.url+'/pr-proof.html'),fetch(server.url+'/ci-reference.js')]);
  assert.equal(page.status,200);
  assert.equal(script.status,200);
  assert.match(script.headers.get('content-type'),/javascript/);
  assert.match((await page.text()),/STATIC HISTORICAL EXAMPLE/);
  const csp=page.headers.get('content-security-policy');
  assert.ok(csp.includes("script-src 'self'"));
  assert.doesNotMatch(csp, /unsafe-inline/);
 }finally{await server.close()}
});
