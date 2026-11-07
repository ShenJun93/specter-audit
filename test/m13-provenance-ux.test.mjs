import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {combineTrial,summarizeLocalSession,syntheticTrial} from '../web/evidence-trial.mjs';

// Minimal deterministic DOM harness: run the actual browser module without a network provider.
class Element {
 constructor(){this.textContent='';this.className='';this.value='';this.disabled=false;this.children=[];this.handlers=new Map();this.files=[];}
 addEventListener(type,fn){this.handlers.set(type,fn)}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items]}
 click(){const fn=this.handlers.get('click');assert.equal(typeof fn,'function');fn()}
}
test('synthetic and user-selected chronology cannot acquire a green attestation-style badge',async()=>{
 const oldDocument=globalThis.document,oldWindow=globalThis.window;
 const elements=new Map(),windowHandlers=new Map();
 const getElementById=id=>{
  if(!elements.has(id))elements.set(id,new Element());
  return elements.get(id);
 };
 globalThis.document={getElementById,createElement:()=>new Element()};
 globalThis.window={addEventListener:(type,fn)=>windowHandlers.set(type,fn)};
 try{
  await import('../web/trial-ui.mjs?m13-provenance-visual-test');
  const local=getElementById('trial-local-status');
  getElementById('trial-stale').click();
  assert.match(local.textContent,/SYNTHETIC.*STALE/);
  assert.doesNotMatch(local.className,/trial-positive/);
  getElementById('trial-retest').click();
  assert.match(local.textContent,/SYNTHETIC.*RETEST/);
  assert.doesNotMatch(local.className,/trial-positive/);
  assert.match(getElementById('trial-local-source').textContent,/NOT REAL KIRO/);
  assert.match(getElementById('trial-repair-status').textContent,/separate/i);
  assert.doesNotMatch(getElementById('trial-repair-status').textContent,/3 independent checks/i);
  assert.equal(getElementById('trial-repair-list').children.length,3);
  const unbound=getElementById('trial-repair-list').children[2].children[1];
  assert.equal(unbound.textContent,'UNBOUND');
  assert.ok(windowHandlers.has('specter:pr-observed'));
 }finally{
  if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
  if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
 }
});
test('report data cannot be upgraded to independent proof by a synthetic retest',()=>{
 const local=summarizeLocalSession(syntheticTrial('retested'),{synthetic:true});
 const report=combineTrial(local);
 assert.equal(report.session.source,'EXPLICITLY_SYNTHETIC_EXAMPLE');
 assert.equal(report.repairPlan.checks[0].state,'SYNTHETIC_CURRENT');
 assert.equal(report.localSessionLinkedToPr,false);
 assert.equal(report.independentlyAttested,false);
 assert.equal(report.releaseApproved,false);
 assert.equal(report.repairPlan.readyForRelease,false);
});
test('judge page describes separate reviews, not independent attestations',async()=>{
 const html=await readFile(new URL('../web/pr-proof.html',import.meta.url),'utf8');
 assert.match(html,/id="trial-repair-list"/);
 assert.match(html,/Separate evidence reviews/);
 assert.doesNotMatch(html,/Independently actionable evidence checks/);
});
