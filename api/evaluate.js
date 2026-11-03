import {inspectionData,json,requestOkay,readJSON,methodNotAllowed} from '../hosted/api-common.mjs';
import {evaluateClaim} from '../src/claim-evaluator.mjs';
export async function POST(request){
 if(!requestOkay(request))return json({error:'Cross-origin evaluation blocked'},403);
 const body=await readJSON(request);
 if(body.error)return json({error:body.error},body.status);
 const payload=body.data;
 if(!payload||Array.isArray(payload)||typeof payload!=='object'||
    typeof payload.claim!=='string'||payload.claim.length<1||payload.claim.length>2000){
    return json({error:'Claim must be 1–2000 characters'},422);
 }
 const inspection=inspectionData();
 const verdict=evaluateClaim({claim:payload.claim,inspection,receipt:payload.receipt});
 return json({
   verdict,inspection,
   disclaimer:'Synthetic Git snapshot is precomputed, not a live visitor repository scan. SUPPORTED means path alignment, not semantic correctness. Self-reported receipts cannot prove tests ran.',
 });
}
export function GET(){return methodNotAllowed();}
