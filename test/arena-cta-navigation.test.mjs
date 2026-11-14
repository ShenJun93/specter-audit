import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const sourceUrl=new URL('../web/arena.js',import.meta.url);
const fixtureUrl=new URL('../web/arena-fixture-case.json',import.meta.url);

async function harness(){
 const [source,fixtureText]=await Promise.all([
  readFile(sourceUrl,'utf8'),readFile(fixtureUrl,'utf8')]);
 const events=[];
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id)){
   elements.set(id,{
    id,hidden:id==='case-file-view',textContent:'',className:'',
    classList:{toggle(){}},handlers:{},
    addEventListener(type,fn){this.handlers[type]=fn},
    focus(options){events.push({type:'focus',id,options})},
    scrollIntoView(options){events.push({type:'scroll',id,options})},
    replaceChildren(){},append(){},removeAttribute(){}
   });
  }
  return elements.get(id);
 };
 let available=true,requests=0;
 const document={
  getElementById:get,
  createElement:tag=>({tag,textContent:'',dateTime:'',append(){}})
 };
 const fetch=async url=>{
  assert.equal(url,'/arena-fixture-case.json');
  requests++;
  return {ok:available,text:async()=>fixtureText};
 };
 runInNewContext(source,{document,fetch});
 await new Promise(resolve=>setImmediate(resolve));
 return {get,events,requests:()=>requests,setAvailable:value=>{available=value}};
}

test('M193: automatic first render does not scroll or steal keyboard focus',async()=>{
 const h=await harness();
 assert.equal(h.requests(),1,'one bundled fixture request on initial page load');
 assert.equal(h.get('case-file-view').hidden,false);
 assert.match(h.get('case-status').textContent,/Owner-controlled public fixture/);
 assert.equal(h.events.length,0,'no automatic navigation before user click');
});

test('M193: explicit Open public case click reloads and brings evidence leads into view',async()=>{
 const h=await harness();
 const open=h.get('load-case').handlers.click;
 assert.equal(typeof open,'function');
 await open();
 assert.equal(h.requests(),2,'preserve explicit reload behavior');
 assert.equal(h.get('case-file-view').hidden,false);
 assert.deepEqual(h.events.map(e=>e.type),['focus','scroll']);
 assert.deepEqual(h.events.map(e=>e.id),['choice-heading','choice-heading']);
 assert.equal(h.events[0].options.preventScroll,true);
 assert.equal(h.events[1].options.block,'start');
 assert.match(h.get('case-status').textContent,/DEMONSTRATED_FIX/);
});

test('M193: failed public reload fails closed without redirecting focus',async()=>{
 const h=await harness();
 h.setAvailable(false);
 await h.get('load-case').handlers.click();
 assert.equal(h.get('case-file-view').hidden,true);
 assert.match(h.get('case-status').textContent,/Public case could not be loaded/);
 assert.equal(h.events.length,0,'no viewport jump when report is unavailable');
});

test('M193: local JSON import never triggers public-case navigation',async()=>{
 const h=await harness();
 const content=await readFile(fixtureUrl,'utf8');
 await h.get('case-file').handlers.change({target:{files:[{
  size:content.length,text:async()=>content
 }]}});
 assert.equal(h.get('case-file-view').hidden,false);
 assert.equal(h.events.length,0);
 assert.match(h.get('case-status').textContent,/USER-IMPORTED UNVERIFIED JSON/);
});

test('M193: target is programmatically focusable and receives visible focus',async()=>{
 const [html,css,js]=await Promise.all([
  readFile(new URL('../web/arena.html',import.meta.url),'utf8'),
  readFile(new URL('../web/arena.css',import.meta.url),'utf8'),
  readFile(sourceUrl,'utf8')]);
 assert.match(html,/<h2 id="choice-heading" tabindex="-1">/);
 assert.match(css,/#choice-heading:focus-visible\{/);
 assert.match(js,/addEventListener\('click',\(\)=>loadPublic\(\{focusOnCase:true\}\)\)/);
 assert.match(js,/loadPublic\(\);\s*$/,'initial render stays non-navigating');
});
