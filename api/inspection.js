import {inspectionData,json,methodNotAllowed} from '../hosted/api-common.mjs';
export function GET(){return json(inspectionData());}
export function POST(){return methodNotAllowed();}
