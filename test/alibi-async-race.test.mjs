import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const codeUrl = new URL('../web/alibi.js',import.meta.url);
const packUrl = new URL('../web/alibi-cases.json',import.meta.url);
const sessionUrl = new URL('../web/alibi-session-case.json',import.meta.url);
const delay = ()=>new Promise(resolve=>setImmediate(resolve));

function mockElement(id){
 const el={
  id,textContent:'',className:'',hidden:id==='verdict',
  disabled:['reveal','quick-reveal'].includes(id),firstChild:{textContent:''},
  attrs:new Map(),handlers:{},children:[],dataset:{},value:'',
  classList:{toggle(name,on){this._state??={};this._state[name]=on}},
  addEventListener(name,fn){this.handlers[name]=fn},
  setAttribute(name,val){this.attrs.set(name,String(val))},
  getAttribute(name){return this.attrs.get(name)??null},
  removeAttribute(name){this.attrs.delete(name)},
  append(...items){this.children.push(...items)},
  replaceChildren(...items){this.children=items},
  focus(){},scrollIntoView(){}
 };
 return el;
}
async function createHarness(){
 const [script,pack,session]=await Promise.all([readFile(codeUrl,'utf8'),readFile(packUrl,'utf8'),readFile(sessionUrl,'utf8')]);
 const ids=new Map();
 const el=id=>{if(!ids.has(id))ids.set(id,mockElement(id));return ids.get(id)};
 const cases=['stale-artifact','current-exact-run','no-artifact-presented','real-kiro-session'];
 const buttons=cases.map((id,index)=>{
  const button=mockElement('case-'+index);
  button.dataset.case=id;button.disabled=index===3;
  button.setAttribute('aria-pressed',index===0?'true':'false');
  return button;
 });
 let finishSession, failSession;
 const pendingSession=new Promise((resolve,reject)=>{finishSession=resolve;failSession=reject});
 let requests=[];
 const reply=body=>({ok:true,headers:{get(key){return key==='content-type'?'application/json':key==='content-length'?String(body.length):null}},text:async()=>body});
 const fetch=path=>{requests.push(path);if(path==='/alibi-cases.json')return Promise.resolve(reply(pack));if(path==='/alibi-session-case.json')return pendingSession;throw Error('unexpected request '+path)};
 const document={getElementById:el,querySelectorAll:s=>s==='[data-case]'?buttons:[],createElement:tag=>mockElement(tag)};
 const ctx={document,fetch,AbortSignal,Date,URL,Set,Map,Number,String,Array,Object,Error,JSON,Promise,console,matchMedia:()=>({matches:false})};
 vm.runInNewContext(script,ctx,{filename:'alibi.js',timeout:2000});
 const until=async condition=>{for(let i=0;i<80;i++){if(condition())return;await delay()}throw Error('timeout waiting for UI state')};
 await until(()=>el('loaded-status').textContent.includes('3 GitHub exhibits loaded'));
 return {
  el,buttons,requests,until,
  complete:()=>finishSession(reply(session)),
  reject:()=>failSession(new Error('network unavailable')),
  selected:()=>buttons.filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.case)
 };
}

test('M196: default Reveal stays disabled while Kiro judge case is still loading',async()=>{
 const h=await createHarness();
 assert.deepEqual(h.requests,['/alibi-cases.json','/alibi-session-case.json']);
 assert.deepEqual(h.selected(),['stale-artifact']);
 assert.equal(h.el('reveal').disabled,true);
 assert.equal(h.el('quick-reveal').disabled,true);
 h.complete();
 await h.until(()=>h.el('loaded-status').textContent.startsWith('4 recorded exhibits'));
 assert.deepEqual(h.selected(),['real-kiro-session']);
 assert.equal(h.el('quick-reveal').disabled,false);
 h.el('quick-reveal').handlers.click();
 assert.equal(h.el('verdict-type').textContent,'STALE LOCAL TEST EVIDENCE');
 assert.equal(h.el('verdict').hidden,false);
});

test('M196: explicit provider case selection while Kiro fetch is pending is preserved',async()=>{
 const h=await createHarness();
 h.buttons[1].handlers.click();
 assert.deepEqual(h.selected(),['current-exact-run']);
 assert.equal(h.el('quick-reveal').disabled,false);
 h.el('quick-reveal').handlers.click();
 assert.equal(h.el('verdict').hidden,false);
 assert.equal(h.el('verdict-type').textContent,'PROVIDER REPORTED PASS');
 h.complete();
 await h.until(()=>h.el('loaded-status').textContent.startsWith('4 recorded exhibits'));
 assert.deepEqual(h.selected(),['current-exact-run']);
 assert.equal(h.el('verdict-type').textContent,'PROVIDER REPORTED PASS');
 assert.equal(h.el('verdict').hidden,false);
 assert.equal(h.buttons[3].disabled,false,'Kiro case can now be selected manually');
 h.buttons[3].handlers.click();
 assert.deepEqual(h.selected(),['real-kiro-session']);
 h.el('quick-reveal').handlers.click();
 assert.equal(h.el('verdict-type').textContent,'STALE LOCAL TEST EVIDENCE');
});

test('M196: missing or rejected Kiro receipt falls back to selectable public provider evidence',async()=>{
 const h=await createHarness();
 h.reject();
 await h.until(()=>h.el('loaded-status').textContent.includes('Kiro session unavailable'));
 assert.deepEqual(h.selected(),['stale-artifact']);
 assert.equal(h.el('quick-reveal').disabled,false);
 assert.equal(h.buttons[3].disabled,true);
 h.el('quick-reveal').handlers.click();
 assert.equal(h.el('verdict-type').textContent,'STALE EVIDENCE');
});

test('M196: explicit Case01 inspect action retains displayed verdict when authentic case arrives late',async()=>{
 const h=await createHarness();
 h.buttons[0].handlers.click();
 h.el('quick-reveal').handlers.click();
 assert.equal(h.el('verdict').hidden,false);
 h.complete();
 await h.until(()=>h.el('loaded-status').textContent.startsWith('4 recorded exhibits'));
 assert.deepEqual(h.selected(),['stale-artifact']);
 assert.equal(h.el('verdict').hidden,false);
 assert.equal(h.el('verdict-type').textContent,'STALE EVIDENCE');
});
