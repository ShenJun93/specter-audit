// M7: Privacy-minimized parser for locally selected Kiro CLI messages.jsonl.
// Pure ESM, no filesystem, network, DOM, storage, logging or dependencies.
// The raw event text and prompt/tool content never appear in returned values.
const MAX_BYTES=8*1024*1024;
const MAX_LINES=4000;
const MAX_LINE_BYTES=2*1024*1024;
const SOURCE='RECORDED_LOCAL_KIRO_CLI_SESSION';
const NO_ATTESTATION=Object.freeze({
  independentlyAttested:false,
  semanticCorrectnessVerified:false,
  outsideFileEvidenceUnknown:true,
  noNetworkRequestsByThisModule:true
});
const safeError=(errorCode,summary={})=>({
  input:null,
  summary:{recognizedClaims:0,passingTests:0,sourceEdits:0,unclassifiedEdits:0,...summary},
  scope:NO_ATTESTATION,
  errorCode
});
function iso(s) {
  if(typeof s!=='string'||s.length>38||
     !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-]\d\d:\d\d)$/.test(s))return null;
  const time=Date.parse(s);
  return Number.isFinite(time)?time:null;
}
function pathFromKiro(s) {
  if(typeof s!=='string'||s.length>600)return null;
  const normalized=s.replace(/\\/g,'/');
  const match=normalized.match(/(?:^|\/)((?:src|test|web)\/[A-Za-z0-9._/-]{1,180})$/);
  if(!match)return null;
  const relative=match[1];
  if(relative.includes('..')||relative.includes('//')||relative.endsWith('/')||
     !/\.(?:mjs|js|jsx|cjs|ts|tsx|json|css|html|md|yml|yaml)$/.test(relative))return null;
  return relative;
}
function summaryNumbers(raw) {
  if(typeof raw!=='string')return null;
  const matches={};
  for(const [key,re] of [
    ['pass',/^\s*(?:[#ℹ]\s*)?pass\s+(\d+)\s*$/gim],
    ['fail',/^\s*(?:[#ℹ]\s*)?fail\s+(\d+)\s*$/gim],
    ['exit',/^\s*Exit Code:\s*(\d+)\s*$/gim]
  ]){
    const found=[...raw.matchAll(re)].map(m=>Number(m[1]));
    if(found.length!==1||!Number.isSafeInteger(found[0])||found[0]>1000000)return null;
    matches[key]=found[0];
  }
  return {pass:matches.pass,fail:matches.fail,exitCode:matches.exit};
}
// Accept regex parentheses inside quoted read-only filter arguments only.
function safeOutputFilter(stage) {
  if (/[<>$\x60]/.test(stage)) return false;
  let quoted=null;
  for(let i=0;i<stage.length;i++){
    const ch=stage[i];
    if(quoted){
      if(ch===quoted){
        if(ch==="'"&&stage[i+1]==="'"){i++;continue}
        quoted=null;
      }
      continue;
    }
    if(ch==="'"||ch==='"'){quoted=ch;continue}
    if(ch==='('||ch===')'||ch==='&')return false;
  }
  return quoted===null;
}
function isTestCommand(command) {
  if(typeof command!=='string'||command.length>4000)return false;
  // PowerShell single/double-quoted regex patterns may contain literal pipes.
  // Split only on unquoted pipes; disallow command chaining and unknown
  // pipeline consumers, which can hide mutations or a failed test exit.
  let quoted=null,part='',parts=[];
  for(let i=0;i<command.length;i++){
    const c=command[i];
    if(quoted){
      part+=c;
      if(c===quoted){
        if(c==="'"&&command[i+1]==="'"){part+=command[++i];continue}
        quoted=null;
      }
      continue;
    }
    if(c==="'"||c==='"'){quoted=c;part+=c;continue}
    if(c===';'||c==='\n'||c==='\r')return false;
    if(c==='|' ){
      if(command[i+1]==='|'||command[i-1]==='|')return false;
      parts.push(part.trim());part='';continue;
    }
    part+=c;
  }
  if(quoted)return false;
  parts.push(part.trim());
  if(parts.length<1||parts.length>3)return false;
  const first=parts[0].replace(/\s+2>&1\s*$/,'').trim();
  // Other redirection operators are unverified potential side effects.
  // PowerShell expressions and backticks can execute arbitrary extra commands.
  // Reject non-literal test arguments rather than guessing that they are read-only.
  if(/[<>$()`]/.test(first)||/&&/.test(first))return false;
  if(!/^(?:&\s*)?(?:(?:node|node\.exe)\s+--test(?:\s|$)|(?:npm|npm\.cmd)\s+(?:run\s+)?test(?:\s|$))/i.test(first))return false;
  for(const stage of parts.slice(1)){
    // Only allow known read-only output filters. Compound test+write
    // pipelines and arbitrary code in script blocks remain unsupported.
    if(!/^(?:Select-String\b|Select-Object\s+-(?:First|Last|Skip|Unique|Property|ExpandProperty)\b|Out-String\b)/i.test(stage)||!safeOutputFilter(stage))return false;
  }
  return true;
}
function safeClaim(content) {
  if(typeof content!=='string')return null;
  // Only a short, explicit affirmative result claim qualifies.
  // Do not search within negations, quotations, conditionals or narratives.
  // Kiro often follows the first factual sentence with commentary.
  // Evaluate only a leading, complete affirmative sentence; reject
  // explicit contradictions in the remainder of the message.
  const match=content.match(/^\s*(?:all\s+)?(\d{1,5})\s+tests?\s+pass(?:ed)?(?:\s*,\s*0\s+fail(?:ures?)?)?(?:\s*\([^()\r\n]{1,120}\))?\s*[.!](?:\s|$)/i);
  if(!match)return null;
  const suffix=content.slice(match[0].length);
  if(/\b(?:but|however|actually|false|failed|didn.t|not|hypothetical|conditional)\b/i.test(suffix))return null;
  const count=Number(match[1]);
  return count>0&&Number.isSafeInteger(count)?count:null;
}
// A newer explicit test correction invalidates an older passing claim.
function isTestRetraction(content) {
  if(typeof content!=='string')return false;
  const statement=content.trim().slice(0,500);
  return /^(?:(?:correction|update)\s*:\s*|actually[,:\s-]+)?(?:not\s+all\s+\d{1,5}\s+tests?\s+pass(?:ed)?\b|\d{1,5}\s+tests?\s+failed?\b|(?:the\s+)?tests?\s+(?:failed|are\s+failing|were\s+failing|did\s+not\s+pass)\b|(?:the\s+)?(?:earlier|previous)\s+(?:pass|test)\s+claim\s+(?:was|is)\s+(?:wrong|false|incorrect|retracted)\b)/i.test(statement);
}
function result(events) {
  const callById=new Map(),resultById=new Map();
  let lastTime=-Infinity,firstTime=Infinity,validSessionIds=new Set();
  for(const e of events) {
    if(!e||typeof e!=='object'||Array.isArray(e))return safeError('INVALID_EVENT');
    const ms=iso(e.timestamp);
    if(ms===null)return safeError('INVALID_EVENT_TIMESTAMP');
    firstTime=Math.min(firstTime,ms);
    lastTime=Math.max(lastTime,ms);
    const sessionId=typeof e.sessionId==='string'?e.sessionId:null;
    if(sessionId&&sessionId.length<150)validSessionIds.add(sessionId);
    const p=e.payload??{};
    if(!p||typeof p!=='object'||Array.isArray(p))return safeError('INVALID_PAYLOAD');
    if(p.type!=='tool_call'&&p.type!=='tool_result')continue;
    if(typeof p.toolCallId!=='string'||p.toolCallId.length<1||p.toolCallId.length>220)return safeError('INVALID_TOOL_ID');
    const map=p.type==='tool_call'?callById:resultById;
    if(map.has(p.toolCallId))return safeError('DUPLICATE_TOOL_EVENT');
    map.set(p.toolCallId,e);
  }
  if(validSessionIds.size>1)return safeError('MULTI_SESSION_FILE');
  if(events.length===0)return safeError('EMPTY_SESSION');
  const claims=[],retractions=[];
  for(const e of events) {
    const p=e.payload;
    if(p.type!=='assistant'||p.operationType!=='Say')continue;
    const n=safeClaim(p.content);
    if(n!==null)claims.push({at:e.timestamp,ms:iso(e.timestamp),count:n});
    else if(isTestRetraction(p.content))retractions.push(iso(e.timestamp));
  }
  if(!claims.length)return safeError('NO_RECORDED_AGENT_TEST_CLAIM');
  claims.sort((a,b)=>b.ms-a.ms);
  if(claims.length>1&&claims[0].ms===claims[1].ms)return safeError('AMBIGUOUS_AGENT_CLAIMS');
  const claim=claims[0];
  // A correction at/after the chosen claim leaves the claim's truth unresolved.
  // A newer affirmative claim can supersede an earlier correction.
  if(retractions.some(ms=>ms>=claim.ms))return safeError('LATER_AGENT_TEST_CLAIM_RETRACTED',{recognizedClaims:claims.length});
  if(claim.ms>lastTime)return safeError('INVALID_CHRONOLOGY');
  const tests=[],edits=[],unverifiedOperations=[];
  let unclassifiedEdits=0,unpairedRelevant=0;
  const readOnlyTools=new Set(['read_file','list_directory','update_session_information','get_session_information','list_files']);
  for(const [id,call] of callById){
    const p=call.payload;
    const tool=p.toolName;
    const isEditingTool=['fs_write','str_replace'].includes(tool);
    const shell=tool==='execute_pwsh';
    // A mixed test/write shell command cannot establish an isolated test receipt.
    const dangerousShell=/\b(?:Set-Content|Add-Content|Out-File|Tee-Object|Remove-Item|Move-Item|Rename-Item|Copy-Item|New-Item|writeFileSync|appendFileSync|git\s+(?:checkout|restore|reset|clean|apply)|sed\s+-i)\b/i.test(p.args?.command??'');
    const testingTool=shell && isTestCommand(p.args?.command) && !dangerousShell;
    const observed=resultById.get(id);
    if(!isEditingTool&&!testingTool){
      // The importer cannot establish absence of writes/tests inside unknown
      // shell calls or unsupported tools. Treat later operations as uncertain.
      if(shell||!readOnlyTools.has(tool)){
        if(observed&&iso(observed.timestamp)<iso(call.timestamp))return safeError('RESULT_BEFORE_TOOL');
        unverifiedOperations.push({at:observed?.timestamp??new Date(lastTime).toISOString()});
      }
      continue;
    }
    if(!observed){
      unpairedRelevant++;
      // With no result timestamp, completion may have occurred later.
      unverifiedOperations.push({at:new Date(lastTime).toISOString()});
      continue;
    }
    const at=observed.timestamp; // Evidence exists at completion, not invocation.
    if(iso(at)<iso(call.timestamp))return safeError('RESULT_BEFORE_TOOL');
    if(observed.payload.success!==true){
      // Even a failed file-write tool may have partially mutated source.
      // It is NOT a confirmed successful edit; preserve the uncertainty.
      // Likewise a failed test tool cannot supply a valid passing receipt.
      unpairedRelevant++;
      unverifiedOperations.push({at:observed.timestamp});
      continue;
    }
    if(isEditingTool){
      const file=pathFromKiro(p.filePath??p.args?.filePath??p.args?.path);
      // Count even unrecognized successful writes as source edits:
      // dropping them could incorrectly elevate a session to CURRENT.
      // The placeholder is explicitly redacted, not a claimed filename.
      if(!file)unclassifiedEdits++;
      edits.push({at,file:file??('redacted/edited-file-'+(edits.length+1)),successful:true});
    }else{
      const data=summaryNumbers(observed.payload.content);
      if(!data){
        unpairedRelevant++;
        unverifiedOperations.push({at:observed.timestamp});
        continue;
      }
      tests.push({at,...data});
    }
    if(tests.length>60||edits.length>60)return safeError('TOO_MANY_RELEVANT_EVENTS');
  }
  // A result without a recorded call has unknown effect and cannot be
  // presumed read-only. A later recognized test may supersede its uncertainty.
  for(const [id,observed] of resultById){
    if(!callById.has(id)){
      unpairedRelevant++;
      unverifiedOperations.push({at:observed.timestamp});
    }
  }
  const info={
    recognizedClaims:claims.length,
    passingTests:tests.filter(t=>t.pass>0&&t.fail===0&&t.exitCode===0).length,
    observedTests:tests.length,sourceEdits:edits.length,
    unclassifiedEdits,unpairedRelevant,unverifiedOperations:unverifiedOperations.length,claimedPassCount:claim.count,
    sessionEvents:events.length,
    testTimesBeforeClaim:tests.filter(t=>iso(t.at)<=claim.ms).length,
    scope:'ONE_SAVED_LOCAL_KIRO_SESSION_ONLY'
  };
  // Unrecognized paths are retained as explicit redacted source edits,
  // never dropped from chronology. Missing/unsupported tool results
  // remain insufficient because they could hide a later test or edit.
  // Do not discard unresolved tools silently. A later observed passing
  // test or successful edit can supersede earlier uncertainty, but any
  // uncertainty at/after the latest known evidence blocks CURRENT/STALE.
  // Mismatched count is not proof that the observed test run supports the claim.
  // Only a completed test strictly before the claim can support it.
  // Later test results are chronology, not retroactive confirmation.
  const candidate=tests.filter(t=>iso(t.at)<claim.ms).sort((a,b)=>iso(b.at)-iso(a.at))[0];
  if(candidate&&candidate.pass!==claim.count)return safeError('CLAIM_TEST_COUNT_MISMATCH',info);
  const afterClaim=tests.filter(t=>iso(t.at)>=claim.ms);
  if(afterClaim.length){
    const lastAfterClaim=Math.max(...afterClaim.map(t=>iso(t.at)));
    const lastEdit=Math.max(-Infinity,...edits.map(e=>iso(e.at)));
    const allPassed=afterClaim.every(t=>t.pass>0&&t.fail===0&&t.exitCode===0);
    // Retain STALE only when a proven preclaim pass is followed by
    // successful postclaim tests, then a successful edit after ALL tests.
    // Equal timestamps, failures, missing preclaim tests and newer tests
    // after the last edit remain insufficient.
    if(afterClaim.some(t=>iso(t.at)===claim.ms)||
       !candidate||candidate.pass<=0||candidate.fail!==0||candidate.exitCode!==0||
       !allPassed||lastEdit<=lastAfterClaim){
      return safeError('POST_CLAIM_TEST_EVIDENCE_UNRESOLVED',info);
    }
  }
  // Unverified operations after the newest known successful test/edit
  // might have changed source or produced another test. Do not elevate
  // the recorded file to CURRENT in the absence of tool coverage.
  const lastKnown=Math.max(candidate?iso(candidate.at):-Infinity,...edits.map(e=>iso(e.at)));
  if(unverifiedOperations.some(e=>iso(e.at)>=lastKnown)){
    return safeError('INCOMPLETE_RELEVANT_TOOL_EVIDENCE',info);
  }
  // The same instant can conceal ordering; avoid an uplift from ambiguous chronology.
  const sameInstant=(xs)=>new Set(xs.map(e=>iso(e.at))).size!==xs.length;
  if(sameInstant(tests)||sameInstant(edits))return safeError('AMBIGUOUS_EVENT_TIMESTAMPS',info);
  const sessionEndedAt=new Date(lastTime).toISOString();
  return {
    input:{sourceKind:SOURCE,claimAt:new Date(claim.ms).toISOString(),
      sessionEndedAt,tests,edits},
    summary:info,
    scope:NO_ATTESTATION,
    errorCode:null
  };
}
export function parseKiroSession(text) {
  if(typeof text!=='string')return safeError('EXPECTED_TEXT_INPUT');
  if(new TextEncoder().encode(text).length>MAX_BYTES)return safeError('FILE_SIZE_LIMIT');
  const lines=text.split(/\r?\n/).filter(line=>line.trim()!=='');
  if(lines.length>MAX_LINES)return safeError('LINE_COUNT_LIMIT');
  if(!lines.length)return safeError('EMPTY_SESSION');
  const events=[];
  for(const line of lines){
    if(new TextEncoder().encode(line).length>MAX_LINE_BYTES)return safeError('LINE_SIZE_LIMIT');
    try{events.push(JSON.parse(line))}catch{return safeError('INVALID_JSONL')}
  }
  return result(events);
}
