// Deterministic static browser build for two pure ESM modules.
// No third-party bundler. Generated web copies are reviewed and tracked.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=[
 ['src/kiro-session-staleness.mjs','web/kiro-session-staleness.mjs'],
 ['src/kiro-session-import.mjs','web/kiro-session-import.mjs']
];
const hash=data=>createHash('sha256').update(data).digest('hex');
const check=process.argv.includes('--check');
if(process.argv.slice(2).some(a=>a!=='--check'))throw Error('Usage: node scripts/build-live-web.mjs [--check]');
let failed=false;
for(const [source,target] of files) {
 const src=await readFile(source);
 if(check) {
  let current=null;try{current=await readFile(target)}catch{}
  if(!current||hash(src)!==hash(current)){console.error('STALE_STATIC_WEB_MODULE '+target);failed=true;}
 }else{await writeFile(target,src)}
 console.log((check?'CHECK ':'BUILD ')+target+' sha256 '+hash(src));
}
if(failed)process.exitCode=2;
