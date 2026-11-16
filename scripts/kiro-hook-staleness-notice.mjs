// M260 advisory Kiro hook handler. Reads one JSON event from stdin (max 8192 bytes)
// and prints one fixed notice when a src/ JS/TS file was saved. Otherwise silent.
// It never reports that tests ran, are current, or that code is correct.
// No filesystem, network, subprocess or logging. Always exits 0.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const MAX_STDIN=8192;
const WARNING='SPECTER SOURCE CHANGE: A source file was saved after earlier evidence may have been collected. Any previous PASS claim is not sufficient to verify this new source state. Rerun the relevant tests and inspect the new receipt before claiming current results.';
const EVENTS=new Set(['FileSave','PostFileSave']);
const BLOCKED_SEGMENTS=new Set(['env','git','qa','private']);
const SOURCE=/^src\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*\.(?:js|mjs|ts|tsx)$/;

export function isSourcePath(value){
  if(typeof value!=='string'||value.length===0||value.length>260)return false;
  const p=value.replaceAll('\\','/');
  if(!SOURCE.test(p))return false;
  for(const seg of p.split('/')){
    const lower=seg.toLowerCase();
    if(BLOCKED_SEGMENTS.has(lower)||lower.split('.')[0]==='env')return false;
  }
  return true;
}

export function decide(text){
  try{
    if(typeof text!=='string'||Buffer.byteLength(text,'utf8')>MAX_STDIN)return null;
    const event=JSON.parse(text);
    if(event===null||typeof event!=='object'||Array.isArray(event))return null;
    if(!EVENTS.has(event.hook_event_name))return null;
    return isSourcePath(event.file_path)?WARNING:null;
  }catch{return null}
}

function main(){
  const chunks=[];
  let size=0,over=false;
  process.stdin.on('data',chunk=>{
    if(over)return;
    size+=chunk.length;
    if(size>MAX_STDIN){over=true;chunks.length=0;return}
    chunks.push(chunk);
  });
  process.stdin.on('error',()=>{});
  process.stdin.on('end',()=>{
    if(over)return;
    const out=decide(Buffer.concat(chunks).toString('utf8'));
    if(out!==null)process.stdout.write(out+'\n');
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();
