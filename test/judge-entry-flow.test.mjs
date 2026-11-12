import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('judge first-run begins with real recorded case, not a private file picker',async()=>{
 const html=await read('web/index.html');
 const primary=html.match(/<a class="alibi-room-cta" href="([^"]+)">([\s\S]*?)<\/a>/);
 assert.ok(primary,'prominent primary judge link');
 assert.equal(primary[1],'/alibi.html#case-room');
 assert.match(primary[2],/JUDGE FAST PATH/);
 assert.match(primary[2],/120 tests passed/);
 assert.match(primary[2],/five later edits/);
 assert.match(primary[2],/INVESTIGATE THE MIDNIGHT REWRITE/);
 assert.match(html,/No file required to start/);
 assert.match(html,/href="\/pr-proof\.html"/);
 assert.match(html,/href="\/live\.html"/);
 const recorded=await read('web/alibi.html');
 assert.match(recorded,/data-case="real-kiro-session"/);
 assert.match(recorded,/REAL KIRO SESSION/);
 assert.match(recorded,/id="case-room"/);
});
test('recorded Kiro case navigation fits narrow screens',async()=>{
 const css=await read('web/alibi.css');
 assert.match(css,/@media\(max-width:630px\)\{\.topbar\{flex-direction:column/);
 assert.match(css,/\.topbar nav\{width:100%;flex-wrap:wrap/);
});
test('local session UI shows honest help and an actionable next step',async()=>{
 const html=await read('web/live.html');
 assert.match(html,/Where do I find a Kiro messages\.jsonl file/);
 assert.match(html,/Specter does not scan folders/);
 assert.match(html,/do not include raw sessions in public recordings/);
 assert.match(html,/id="copy-next-step"/);
 assert.match(html,/id="next-copy-status"/);
});
test('next-step copy uses only known static guidance',async()=>{
 const js=await read('web/live.js');
 assert.match(js,/const instruction=safeNextAction\[kind\]/);
 assert.match(js,/navigator\.clipboard\.writeText\(instruction\)/);
 assert.match(js,/No command was run/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon/);
});
test('mobile verdict scrolls and moves accessible focus after real or synthetic evidence',async()=>{
 const html=await read('web/live.html');
 const js=await read('web/live.js');
 const css=await read('web/live.css');
 assert.match(html,/id="results-heading" tabindex="-1"/);
 assert.match(js,/function exposeMobileFinding\(\)/);
 assert.match(js,/matchMedia\('\(max-width:850px\)'\)/);
 assert.match(js,/heading\.focus\(\{preventScroll:true\}\)/);
 assert.match(js,/heading\.scrollIntoView\(\{block:'start',behavior:'instant'\}\)/);
 assert.equal(js.split('exposeMobileFinding();').length-1,2,'Focus is required for both supported and no-claim states');
 assert.match(css,/#results-heading\{scroll-margin-block-start:24px\}/);
});

test('Git inspector navigation remains reachable below 960px, with semantic toggle and keyboard escape',async()=>{
 const html=await read('web/index.html');
 const css=await read('web/styles.css');
 assert.match(html,/<button id="rail-menu-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="rail-workspace-nav"/);
 assert.match(html,/<nav id="rail-workspace-nav"[^>]+aria-label="Workspace navigation"/);
 for(const href of ['/','/alibi.html','/live.html','/pr-proof.html','/arena.html']){
  assert.match(html,new RegExp('class="nav-item[^"]*" href="'+href.replaceAll('.','\\.')+'"'));
 }
 assert.match(css,/\.rail-menu-toggle\{display:none/);
 assert.match(css,/@media\(max-width:960px\)/);
 assert.match(css,/\.rail\.menu-open \.rail-workspace-nav\{display:grid\}/);
 assert.match(css,/\.rail-workspace-nav \.nav-item\{display:flex;min-height:48px/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/\.rail-workspace-nav\{top:100%;left:0;width:100%/);
 assert.doesNotMatch(css,/\.rail-label,\.nav-item,\.protocol-step,\.rail-bottom\{display:none\}/);
});
test('responsive menu toggles ARIA, closes on outside pointer, Escape and desktop resize',async()=>{
 const code=await read('web/app.js');
 const begin=code.indexOf('function setupRailNavigation() {');
 const end=code.indexOf('\nsetupRailNavigation();',begin);
 assert.ok(begin>=0 && end>begin,'navigation initializer found');
 const isolated=code.slice(begin,end+'\nsetupRailNavigation();'.length);
 const {runInNewContext}=await import('node:vm');
 const cls=new Set(), attributes={}, events={}, toggleEvents={};
 let resize,focusCount=0;
 const rail={classList:{contains:name=>cls.has(name),toggle:(name,force)=>force?cls.add(name):cls.delete(name)},contains:target=>target==='inside'};
 const toggle={setAttribute:(name,value)=>{attributes[name]=value},addEventListener:(name,fn)=>{toggleEvents[name]=fn},focus:()=>focusCount++};
 const document={querySelector:()=>rail,getElementById:()=>toggle,addEventListener:(name,fn)=>{events[name]=fn}};
 const window={matchMedia:()=>({addEventListener:(name,fn)=>{if(name==='change')resize=fn}})};
 runInNewContext(isolated,{document,window});
 toggleEvents.click();
 assert.equal(attributes['aria-expanded'],'true');
 assert.equal(attributes['aria-label'],'Close workspace navigation');
 events.pointerdown({target:'inside'});
 assert.equal(attributes['aria-expanded'],'true');
 events.keydown({key:'Escape'});
 assert.equal(attributes['aria-expanded'],'false');
 assert.equal(focusCount,1);
 toggleEvents.click();
 events.pointerdown({target:'outside'});
 assert.equal(attributes['aria-expanded'],'false');
 toggleEvents.click();
 resize({matches:false});
 assert.equal(attributes['aria-expanded'],'false');
});
test('Arena is reachable from recorded case and private session without altering judge first-run',async()=>{
 for(const p of ['web/index.html','web/alibi.html','web/live.html','web/pr-proof.html']){
  const html=await read(p);
  assert.match(html,/href="\/arena\.html"/,'Arena link present in '+p);
 }
 assert.match(await read('web/index.html'),/href="\/alibi\.html#case-room"/);
});
test('shared Alibi/Live/Proof navigation wraps before tablet width overflow',async()=>{
 const css=await read('web/alibi.css');
 assert.match(css,/@media\(min-width:631px\) and \(max-width:1100px\)\{/);
 assert.match(css,/@media\(min-width:631px\) and \(max-width:1100px\)\{\.topbar\{flex-wrap:wrap/);
 assert.match(css,/\.topbar nav\{width:100%;justify-content:flex-start;flex-wrap:wrap/);
});