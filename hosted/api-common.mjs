// Shared response policy for the PUBLIC synthetic replay, not the local Git inspector.
import {snapshot} from './snapshot.mjs';
const BOUNDS=16*1024;
export {snapshot};
export const headers={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, max-age=0',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
};
export function json(body,status=200){return Response.json(body,{status,headers});}
export function methodNotAllowed(){return json({error:'Method not allowed'},405);}
export function statusData(){
 return {ok:true,repo:snapshot.repo,head:snapshot.head,clean:snapshot.clean,
   counts:snapshot.total,demoMode:true,
   provenance:'Precomputed synthetic Git snapshot; not a live scan of your filesystem'};
}
export function inspectionData(){return snapshot;}
export function requestOkay(request){
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return false;
 return request.headers.get('sec-fetch-site')!=='cross-site';
}
export async function readJSON(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??'')){
   return {error:'application/json required',status:415};
 }
 const declared=request.headers.get('content-length');
 if(declared!==null&&Number(declared)>BOUNDS)return {error:'Request body too large',status:413};
 let bytes=0;const chunks=[];const reader=request.body?.getReader();
 if(!reader)return {error:'Empty JSON body',status:400};
 try{
   while(true){
     const {done,value}=await reader.read();
     if(done)break;
     bytes+=value.length;
     if(bytes>BOUNDS){await reader.cancel();return {error:'Request body too large',status:413};}
     chunks.push(value);
   }
 }catch{return {error:'Request body unavailable',status:400};}
 const buffer=new Uint8Array(bytes);
 let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
 try{return {data:JSON.parse(new TextDecoder().decode(buffer))};}
 catch{return {error:'Malformed JSON',status:400};}
}
