import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('landing page guides judges to live Kiro session and recorded cases',async()=>{
 const html=await read('web/index.html');
 assert.match(html,/href="\/live\.html"/);
 assert.match(html,/href="\/alibi\.html"/);
 assert.match(html,/START HERE · BROWSER-ONLY KIRO SESSION ANALYSIS/);
 assert.match(html,/Try three synthetic cases/);
 assert.match(html,/INVESTIGATE A KIRO SESSION/);
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
