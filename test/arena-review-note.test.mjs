import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const jsUrl=new URL('../web/arena.js',import.meta.url);
const fixtureUrl=new URL('../web/arena-fixture-case.json',import.meta.url);
const flush=()=>new Promise(resolve=>setImmediate(resolve));

async function harness(options={}){
 const [code,fixtureText]=await Promise.all([readFile(jsUrl,'utf8'),readFile(fixtureUrl,'utf8')]);
 const elements=new Map(),writes=[],net=[];
 const get=id=>{
  if(!elements.has(id))elements.set(id,{
   id,textContent:'',className:'',hidden:id==='case-file-view',disabled:id==='copy-review-note',
   classList:{toggle(){}},handlers:{},focus(){},scrollIntoView(){},
   addEventListener(type,fn){this.handlers[type]=fn},
   replaceChildren(){},append(){},removeAttribute(){}
  });
  return elements.get(id);
 };
 const document={getElementById:get,createElement:tag=>({tag,textContent:'',dateTime:'',append(){}})};
 let available=true;
 const fetch=async path=>{
  net.push(path);
  assert.equal(path,'/arena-fixture-case.json');
  if(!available)return {ok:false,text:async()=>''};
  return {ok:true,text:async()=>fixtureText};
 };
 const navigator=options.navigator??{clipboard:{writeText:async note=>{writes.push(note)}}};
 runInNewContext(code,{document,navigator,fetch});
 await flush();
 return {
  get,writes,net,fixtureText,
  setAvailable:x=>{available=x},
  import:async value=>{
   const str=typeof value==='string'?value:JSON.stringify(value);
   await get('case-file').handlers.change({target:{files:[{size:str.length,text:async()=>str}]}});
  },
  click:()=>get('copy-review-note').handlers.click()
 };
}

test('M204: explicit copy from bundled fixture includes bounded PR, base/head, test, review action and limits',async()=>{
 const h=await harness();
 const fixture=JSON.parse(h.fixtureText);
 assert.equal(h.net.length,1);
 assert.equal(h.writes.length,0,'no implicit clipboard access on boot');
 assert.equal(h.get('copy-review-note').disabled,false);
 await h.click();
 assert.equal(h.writes.length,1);
 const note=h.writes[0];
 assert.match(note,/^# Specter Arena — scoped reviewer draft/m);
 assert.match(note,/BUNDLED OWNER-CONTROLLED SYNTHETIC FIXTURE/);
 assert.match(note,/Finding: DEMONSTRATED_FIX/);
 assert.match(note,/NOT ATTESTED \/ NOT MERGE APPROVAL/);
 assert.match(note,/PROVIDER_REPORTED_UNATTESTED/);
 assert.match(note,/REVIEWER_CONTROLLED_SELF_REPORTED/);
 assert.match(note,/Check the exact current PR HEAD/);
 assert.ok(note.includes(fixture.subject.baseSha));
 assert.ok(note.includes(fixture.subject.headSha));
 assert.ok(note.includes(fixture.challenge.testSha256));
 assert.ok(note.includes('https://github.com/'+fixture.subject.repository+'/pull/'+fixture.subject.prNumber));
 assert.match(h.get('copy-review-status').textContent,/copied/i);
 assert.equal(h.net.length,1,'copy makes no network calls');
});

test('M204: unavailable or rejected clipboard reports truthful failure',async()=>{
 const missing=await harness({navigator:{}});
 assert.equal(missing.get('copy-review-note').disabled,false);
 await missing.click();
 assert.match(missing.get('copy-review-status').textContent,/unavailable.*Nothing was copied/);
 const denied=await harness({navigator:{clipboard:{writeText:async()=>{throw Error('NotAllowedError')}}}});
 await denied.click();
 assert.match(denied.get('copy-review-status').textContent,/permission.*Nothing was copied/);
});

test('M204: user imported case is marked unverified and multiline Markdown injection is escaped',async()=>{
 const h=await harness();
 const raw=JSON.parse(h.fixtureText);
 raw.statements[0].text='Looks safe\n# APPROVED\n[click](https://evil.example)';
 raw.nextAction.text='Check exact HEAD\n## APPROVED!\n<script>bad</script>\u202Espoof';
 await h.import(raw);
 assert.match(h.get('case-status').textContent,/USER-IMPORTED UNVERIFIED JSON/);
 await h.click();
 const note=h.writes.at(-1);
 assert.match(note,/USER-IMPORTED UNVERIFIED JSON/);
 assert.doesNotMatch(note,/\n# APPROVED|\n## APPROVED!/);
 assert.doesNotMatch(note,/<script>/);
 assert.match(note,/\\# APPROVED/);
 assert.match(note,/\\<script\\>/);
 assert.doesNotMatch(note,/\u202E/,'bidirectional override removed');
 assert.match(note,/NOT MERGE APPROVAL/);
});

test('M204: invalid imported report disables copying and removes stale success',async()=>{
 const h=await harness();
 await h.click();
 assert.match(h.get('copy-review-status').textContent,/copied/);
 const invalid=JSON.parse(h.fixtureText);
 invalid.attestation.releaseApproved=true;
 await h.import(invalid);
 assert.equal(h.get('copy-review-note').disabled,true);
 assert.equal(h.get('copy-review-status').textContent,'');
 await h.click();
 assert.equal(h.writes.length,1);
 assert.match(h.get('copy-review-status').textContent,/No valid case.*nothing was copied/);
});

test('M204: UNKNOWN imported report with malformed challenge never crashes or manufactures PR proof',async()=>{
 const h=await harness();
 const raw=JSON.parse(h.fixtureText);
 raw.classification='UNKNOWN';
 raw.subject={repository:'evil/malformed',prNumber:'not-a-number',baseSha:'bogus',headSha:'wrong'};
 raw.challenge={testSha256:'fake',base:null,head:null};
 await h.import(raw);
 assert.equal(h.get('copy-review-note').disabled,false);
 assert.equal(h.get('pr-link').textContent,'No verified PR link','untrusted UNKNOWN subject cannot invent PR link');
 assert.doesNotThrow(()=>h.get('lead-challenge').handlers.click());
 assert.match(h.get('lead-result').textContent,/No complete reviewer challenge/);
 await assert.doesNotReject(()=>h.click());
 const note=h.writes.at(-1);
 assert.match(note,/Finding: UNKNOWN \(no complete reviewer challenge established\)/);
 assert.match(note,/PR: UNVERIFIED/);
 assert.match(note,/Base commit: UNKNOWN/);
 assert.match(note,/Approved test SHA-256 \(self-reported\): UNKNOWN/);
 assert.match(note,/Reported base\/head exit codes: UNKNOWN/);
});

test('M204: interrupted refresh disables copy and does not report stale async success',async()=>{
 let complete;
 const h=await harness({navigator:{clipboard:{writeText:async()=>new Promise(resolve=>{complete=resolve})}}});
 const clickPromise=h.click();
 h.setAvailable(false);
 await h.get('load-case').handlers.click();
 assert.equal(h.get('copy-review-note').disabled,true);
 assert.match(h.get('case-status').textContent,/could not be loaded/);
 complete(); await clickPromise;
 assert.equal(h.get('copy-review-status').textContent,'');
 assert.equal(h.net.length,2);
});

test('M204: HTML control is accessible, explicit and non-submitting',async()=>{
 const [html,css,code]=await Promise.all([
  readFile(new URL('../web/arena.html',import.meta.url),'utf8'),
  readFile(new URL('../web/arena.css',import.meta.url),'utf8'),
  readFile(jsUrl,'utf8')
 ]);
 assert.match(html,/<button type="button" id="copy-review-note" disabled>/);
 assert.match(html,/<p id="copy-review-status" role="status" aria-live="polite"><\/p>/);
 assert.match(css,/#copy-review-status/);
 assert.match(code,/\$\('copy-review-note'\)\.addEventListener\('click',copyReviewNote\)/);
 assert.doesNotMatch(code,/\.innerHTML\s*=|sendBeacon|XMLHttpRequest|fetch\(['"]https:\/\/github/);
});
