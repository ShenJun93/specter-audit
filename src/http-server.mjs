// Specter Audit M2 — loopback-only, read-only evidence UI. Node.js >=24, zero deps.
// The only repository path comes from CLI/server construction, never from HTTP.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspectRepository } from './git-inspector.mjs';
import { evaluateClaim } from './claim-evaluator.mjs';
import { readPublicReleaseCI } from './public-ci.mjs';

const LOOPBACK = '127.0.0.1';
const BODY_LIMIT = 16 * 1024;
const STATIC_FILES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/alibi.html', ['alibi.html', 'text/html; charset=utf-8']],
  ['/alibi.js', ['alibi.js', 'text/javascript; charset=utf-8']],
  ['/alibi.css', ['alibi.css', 'text/css; charset=utf-8']],
  ['/alibi-cases.json', ['alibi-cases.json', 'application/json; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
  ['/favicon.ico', ['favicon.svg', 'image/svg+xml']],
]);
const WEB_DIR = fileURLToPath(new URL('../web/', import.meta.url));
const POLICY = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function headers(res, mime) {
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', POLICY);
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}
function send(res, status, payload) {
  if (res.writableEnded) return;
  headers(res, 'application/json; charset=utf-8');
  res.writeHead(status);
  res.end(JSON.stringify(payload));
}
function publicInspection(i, repoLabel) {
  if (!i.ok) return { ok:false, errorCode:i.errorCode||'INSPECTION_ERROR', error:'Unable to inspect the selected repository' };
  const cap = (a) => a.slice(0, 400);
  return {
    ok:true, repo:repoLabel, head:i.head, unborn:i.unborn, clean:i.clean,
    dirty:i.dirty, staged:cap(i.staged), unstaged:cap(i.unstaged),
    untracked:cap(i.untracked), renamed:cap(i.renamed),
    total:{staged:i.staged.length,unstaged:i.unstaged.length,untracked:i.untracked.length,renamed:i.renamed.length},
    truncated:[i.staged,i.unstaged,i.untracked,i.renamed].some(a=>a.length>400),
    warnings:i.errors?.map(()=>'Git inspection reported an incomplete command result') ?? [],
  };
}
function readBounded(req, maxBytes) {
  return new Promise((resolve,reject)=>{
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared>maxBytes) {
      reject(Object.assign(new Error('Body too large'),{statusCode:413}));
      req.resume();
      return;
    }
    const chunks=[];let length=0;let finished=false;
    req.on('data',chunk=>{
      if(finished)return;
      length+=chunk.length;
      if(length>maxBytes){finished=true;reject(Object.assign(new Error('Body too large'),{statusCode:413}));req.resume();return;}
      chunks.push(chunk);
    });
    req.on('end',()=>{if(!finished){finished=true;resolve(Buffer.concat(chunks).toString('utf8'));}});
    req.on('error',err=>{if(!finished){finished=true;reject(err);}});
    req.on('aborted',()=>{if(!finished){finished=true;reject(Object.assign(new Error('Request aborted'),{statusCode:400}));}});
  });
}
function validateOrigin(req, url) {
  const origin = req.headers.origin;
  if(origin && origin!==url) return false;
  return req.headers['sec-fetch-site']!=='cross-site';
}

/** Start an HTTP application that only inspects a selected repository's Git metadata. */
export async function createAppServer({repoPath,port=0,publicCiFetchImpl}={}) {
  if(typeof repoPath!=='string'||repoPath.trim()==='') throw new Error('Explicit --repo path required');
  if(!Number.isInteger(port)||port<0||port>65535) throw new Error('Invalid port');
  const initial=await inspectRepository(repoPath);
  if(!initial.ok) throw new Error('Selected path is not an inspectable Git repository: '+initial.errorCode);
  const selectedRoot=initial.root;
  const repoLabel=path.basename(selectedRoot);
  let origin='';
  const server=http.createServer((req,res)=>{
    void (async()=>{
      const host=req.headers.host;
      if(host!==origin.slice('http://'.length)) return send(res,403,{error:'Invalid Host header'});
      const rawPath=(req.url??'').split('?')[0];
      if (rawPath.length>200) return send(res,414,{error:'Request path too long'});
      if(req.method==='GET' && rawPath==='/api/status'){
        const i=await inspectRepository(selectedRoot);
        const safe=publicInspection(i,repoLabel);
        return send(res,i.ok?200:503,{ok:safe.ok,repo:repoLabel,head:safe.head??null,clean:safe.clean??false,
          counts:safe.total??{staged:0,unstaged:0,untracked:0,renamed:0},errorCode:safe.errorCode});
      }
      if(req.method==='GET' && rawPath==='/api/inspection'){
        const i=await inspectRepository(selectedRoot);
        return send(res,i.ok?200:503,publicInspection(i,repoLabel));
      }
      if(req.method==='GET' && rawPath==='/api/provider-evidence')return send(res,405,{error:'Method not allowed'});
      if(req.method==='POST' && rawPath==='/api/provider-evidence'){
        if(!validateOrigin(req,origin)) return send(res,403,{error:'Cross-origin CI request blocked'});
        if(req.headers['x-specter-ci-consent']!=='public-release'){
          return send(res,403,{error:'Explicit public CI query required'});
        }
        if((req.headers['transfer-encoding']??'')!=='' || Number(req.headers['content-length']??0)!==0){
          return send(res,413,{error:'CI query takes no user-controlled body'});
        }
        // Fixed public GitHub release only. Never use the local repo origin,
        // browser-supplied SHA/workflow, or pasted providerEvidence.
        const result=await readPublicReleaseCI({fetchImpl:publicCiFetchImpl});
        return send(res,200,result);
      }
      if(req.method==='POST' && rawPath==='/api/evaluate'){
        if(!validateOrigin(req,origin))return send(res,403,{error:'Cross-origin evaluation is blocked'});
        if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']??''))return send(res,415,{error:'application/json required'});
        const raw=await readBounded(req,BODY_LIMIT);
        let payload;try{payload=JSON.parse(raw);}catch{return send(res,400,{error:'Malformed JSON'});}
        if(!payload||typeof payload!=='object'||Array.isArray(payload)||typeof payload.claim!=='string'||payload.claim.length===0||payload.claim.length>2000){
          return send(res,422,{error:'A claim between 1 and 2000 characters is required'});
        }
        const inspection=await inspectRepository(selectedRoot);
        if(!inspection.ok)return send(res,503,{error:'Inspection unavailable',errorCode:inspection.errorCode});
        const verdict=evaluateClaim({claim:payload.claim,inspection,receipt:payload.receipt});
        return send(res,200,{verdict,inspection:publicInspection(inspection,repoLabel),disclaimer:'Alignment is not correctness. Receipts are self-reported, not independently attested.'});
      }
      if(req.method==='GET'&&STATIC_FILES.has(rawPath)){
        const [filename,mime]=STATIC_FILES.get(rawPath);
        const buf=await readFile(path.join(WEB_DIR,filename));
        headers(res,mime);res.writeHead(200);res.end(buf);return;
      }
      if(req.method!=='GET'&&req.method!=='POST')return send(res,405,{error:'Method not allowed'});
      return send(res,404,{error:'Route not found'});
    })().catch(e=>{
      if(res.writableEnded)return;
      const code=Number.isInteger(e.statusCode)?e.statusCode:500;
      send(res,code,{error:code===413?'Request body too large':code===400?'Invalid request':'Request failed'});
    });
  });
  server.requestTimeout=12_000;
  server.headersTimeout=15_000;
  server.keepAliveTimeout=5_000;
  await new Promise((resolve,reject)=>{
    server.once('error',reject);
    server.listen(port,LOOPBACK,()=>{server.off('error',reject);resolve();});
  });
  origin='http://'+LOOPBACK+':'+server.address().port;
  return {server,url:origin,repoLabel,close:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))};
}

async function main() {
  const args=process.argv.slice(2);
  const repoFlag=args.find(a=>a.startsWith('--repo='));
  const portFlag=args.find(a=>a.startsWith('--port='));
  if(!repoFlag||!repoFlag.slice(7))throw new Error('Usage: npm start -- --repo="C:\\path\\to\\repo" [--port=0]');
  if(args.some(a=>!a.startsWith('--repo=')&&!a.startsWith('--port=')))throw new Error('Unsupported CLI option');
  const port=portFlag?Number(portFlag.slice(7)):0;
  const app=await createAppServer({repoPath:repoFlag.slice(7),port});
  process.stdout.write('Specter Audit ready: '+app.url+'\n');
  process.stdout.write('Read-only repository: '+app.repoLabel+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  main().catch(e=>{process.stderr.write('Specter Audit: '+e.message+'\n');process.exitCode=1;});
}
