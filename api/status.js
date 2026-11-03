import {statusData,json,methodNotAllowed} from '../hosted/api-common.mjs';
export function GET(){return json(statusData());}
export function POST(){return methodNotAllowed();}
