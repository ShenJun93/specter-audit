// Specter Audit M6A — deterministic, offline alibi / CI revision investigation.
// Implemented with ChatGPT/WAG after Kiro CLI v2 and v3 implementation attempts
// timed out without writing source. Do not misattribute this file to Kiro.
//
// This module does NOT call GitHub, execute Git, read source contents, execute
// tests or authenticate provider reports. Source links are inspectable but a
// JSON input, even labeled RECORDED_GITHUB_PROVIDER, remains untrusted.

export class AlibiInputError extends TypeError {
  constructor(message) {
    super(message);
    this.name = 'AlibiInputError';
    this.code = 'INVALID_ALIBI_CASE';
  }
}
const SCHEMA = 'SPECTER_ALIBI_CASE_V1';
const VERDICT_SCHEMA = 'SPECTER_ALIBI_VERDICT_V1';
const HEX_SHA = /^[0-9a-f]{40}$/i;
const NAME = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/;
const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const ORIGINS = new Set(['RECORDED_GITHUB_PROVIDER', 'SYNTHETIC_FIXTURE']);
const FINAL_FAILURES = new Set(['failure','cancelled','timed_out','action_required']);
const FINAL_OTHER = new Set(['neutral','skipped','stale','startup_failure']);
const STATUSES = new Set(['queued','requested','pending','waiting','in_progress','completed']);
const CONCLUSIONS = new Set(['success',...FINAL_FAILURES,...FINAL_OTHER]);
const LIMITATIONS = Object.freeze([
  'GitHub Actions status is provider-reported metadata, not signed independent attestation.',
  'An exact-SHA CI result does not prove source code correctness or that the agent fixed the claimed issue.',
  'Input case JSON and provenance labels can be tampered with; open canonical provider links to inspect the source.',
]);

function reject(message) { throw new AlibiInputError(message); }
function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    reject(label + ' must be an object');
  }
  return value;
}
function str(value, label, min, max) {
  if (typeof value !== 'string' || value.length < min || value.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
    reject(label + ' invalid text');
  }
  return value;
}
function sha(value, label) {
  if (typeof value !== 'string' || !HEX_SHA.test(value)) {
    reject(label + ' must be an exact 40-hex Git SHA');
  }
  return value.toLowerCase();
}
function uint(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) reject(label + ' must be a positive safe integer');
  return value;
}
function time(value, label) {
  if (typeof value !== 'string' || !TIME.test(value) || !Number.isFinite(Date.parse(value))) {
    reject(label + ' must be ISO-8601 with a timezone');
  }
  const stamp = new Date(value);
  if (Number.isNaN(stamp.getTime())) reject(label + ' invalid timestamp');
  return stamp.toISOString();
}
function list(value, label, maximum) {
  if (!Array.isArray(value) || value.length > maximum) reject(label + ' must be a bounded array');
  return value;
}
function safeLink(input, owner, repo, runId, required) {
  if ((input === null || input === undefined || input === '') && !required) return null;
  if (typeof input !== 'string' || input.length > 400) reject('Invalid GitHub Actions source URL');
  let u;
  try { u = new URL(input); } catch { reject('Invalid GitHub Actions source URL'); }
  const expected = '/' + owner + '/' + repo + '/actions/runs/' + runId;
  if (u.origin !== 'https://github.com' || u.pathname.toLowerCase() !== expected.toLowerCase() ||
      u.search || u.hash || u.username || u.password || u.pathname.includes('%')) {
    reject('Provider run URL does not match the exact GitHub repo and run ID');
  }
  return u.href;
}

function normalizedInput(input) {
  record(input,'case');
  if (input.schema !== SCHEMA) reject('Wrong alibi case schema');
  const repo = record(input.repo,'repo');
  const owner = str(repo.owner,'repo owner',1,100);
  const name = str(repo.name,'repo name',1,100);
  if (!NAME.test(owner) || !NAME.test(name) || owner==='.' || name==='.' || name==='..') {
    reject('Unsafe GitHub owner/repo slug');
  }
  const workflowId = uint(repo.workflowId,'workflowId');
  const target = record(input.target,'target');
  const targetSha = sha(target.sha,'target.sha');
  const claim = str(target.claim,'target.claim',1,2000);
  const capturedAt = time(input.capturedAt,'capturedAt');
  const observedAt = time(target.observedAt,'target.observedAt');
  if (Date.parse(observedAt) > Date.parse(capturedAt)) reject('Target observation is later than capture');
  const commits = list(input.commits,'commits',100).map((entry,index)=>{
    const c=record(entry,'commits['+index+']');
    const id=sha(c.sha,'commits['+index+'].sha');
    const parents=list(c.parents,'commits['+index+'].parents',16).map((p,j)=>sha(p,'parent '+j));
    if (new Set(parents).size!==parents.length || parents.includes(id)) reject('Duplicate or self-parent commit');
    return {sha:id,parents,committedAt:time(c.committedAt,'commit time')};
  });
  const commitMap = new Map();
  for(const c of commits) {
    if (commitMap.has(c.sha)) reject('Duplicate Git commit record');
    commitMap.set(c.sha,c);
  }
  // A complete cycle is impossible in Git; malformed input must not fake
  // proof of ancestry. Missing parents are permitted as incomplete evidence.
  const color=new Map();
  function visit(id) {
    if (color.get(id)===1) reject('Cyclic commit ancestry');
    if (color.get(id)===2) return;
    const node=commitMap.get(id);
    if(!node) return;
    color.set(id,1);
    for(const parent of node.parents) visit(parent);
    color.set(id,2);
  }
  for(const c of commits) visit(c.sha);
  const checks=list(input.checks,'checks',50).map((entry,index)=>{
    const c=record(entry,'checks['+index+']');
    const runId=uint(c.runId,'runId');
    const runSha=sha(c.sha,'run.sha');
    if(uint(c.workflowId,'run.workflowId')!==workflowId) reject('Run belongs to wrong workflow');
    const runNumber=uint(c.runNumber,'runNumber');
    const runAttempt=uint(c.runAttempt,'runAttempt');
    const status=str(c.status,'status',1,30);
    if(!STATUSES.has(status)) reject('Unknown workflow status');
    const conclusion=c.conclusion;
    if (status==='completed') {
      if(typeof conclusion!=='string'||!CONCLUSIONS.has(conclusion)) reject('Completed run has invalid conclusion');
    } else if(conclusion!==null&&conclusion!==undefined) {
      reject('Unfinished run cannot have a final conclusion');
    }
    const updatedAt=time(c.updatedAt,'run.updatedAt');
    if(Date.parse(updatedAt)>Date.parse(capturedAt)) reject('Run update is after capture');
    if(!ORIGINS.has(c.origin)) reject('Unrecognized provenance origin');
    const sourceUrl=safeLink(c.sourceUrl,owner,name,runId,c.origin==='RECORDED_GITHUB_PROVIDER');
    return {
      runId,sha:runSha,workflowId,runNumber,runAttempt,status,
      conclusion:status==='completed'?conclusion:null,updatedAt,
      sourceUrl,origin:c.origin
    };
  });
  const seenIds=new Set(),seenAttempts=new Set();
  for(const c of checks) {
    const key=c.runNumber+':'+c.runAttempt;
    if(seenIds.has(c.runId) || seenAttempts.has(key)) {
      reject('Conflicting or duplicate run IDs / run-number attempts');
    }
    seenIds.add(c.runId);seenAttempts.add(key);
  }
  return {repo:{owner,name,workflowId},target:{sha:targetSha,claim,observedAt},
    commits,commitMap,checks,capturedAt};
}

function provableAncestor(map, earlier, current) {
  if (earlier===current) return false; // strict ancestry only
  let cur=map.get(current);
  if (!cur) return false;
  const pending=[...cur.parents],seen=new Set();
  while (pending.length) {
    const s=pending.pop();
    if (seen.has(s)) continue;
    seen.add(s);
    if(s===earlier) return true;
    cur=map.get(s);
    if(cur) pending.push(...cur.parents);
  }
  return false;
}
function newestFirst(a,b) {
  return b.runNumber-a.runNumber || b.runAttempt-a.runAttempt ||
    Date.parse(b.updatedAt)-Date.parse(a.updatedAt) || b.runId-a.runId;
}
function briefRun(c) {
  return {runId:c.runId,sha:c.sha,workflowId:c.workflowId,runNumber:c.runNumber,
    runAttempt:c.runAttempt,status:c.status,conclusion:c.conclusion,
    updatedAt:c.updatedAt,sourceUrl:c.sourceUrl,origin:c.origin};
}
function eventList(data) {
  const events=[];
  for(const c of data.commits) {
    events.push({type:'COMMIT',timestamp:c.committedAt,sha:c.sha,parents:c.parents,
      label:'Git commit '+c.sha.slice(0,8),sourceKind:'GIT_GRAPH_INPUT',sourceUrl:null});
  }
  for(const c of data.checks) {
    events.push({type:'CI_RUN',timestamp:c.updatedAt,sha:c.sha,runId:c.runId,
      label:'Workflow #'+c.runNumber+' attempt '+c.runAttempt+': '+(c.conclusion??c.status),
      sourceKind:c.origin,sourceUrl:c.sourceUrl});
  }
  events.push({type:'CLAIM',timestamp:data.target.observedAt,sha:data.target.sha,
    label:'Hypothetical completion claim at '+data.target.sha.slice(0,8),
    sourceKind:'CLAIM_INPUT',sourceUrl:null});
  const order={COMMIT:0,CI_RUN:1,CLAIM:2};
  return events.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp) ||
    order[a.type]-order[b.type] || a.label.localeCompare(b.label));
}

/**
 * Investigate alignment of a claimed revision with provided workflow metadata.
 * No I/O or independent attestation is performed.
 *
 * @param {unknown} input - SPECTER_ALIBI_CASE_V1 case record.
 * @returns {object} SPECTER_ALIBI_VERDICT_V1 report.
 * @throws {AlibiInputError} on invalid or contradictory case inputs.
 */
export function analyzeAlibiCase(input) {
  const data=normalizedInput(input);
  const exact=data.checks.filter(c=>c.sha===data.target.sha).sort(newestFirst);
  const other=data.checks.filter(c=>c.sha!==data.target.sha);
  const gaps=[],observations=[];
  let selected=null, status, headline, reason;
  if(exact.length) {
    selected=exact[0];
    observations.push('Newest supplied workflow run for the exact target SHA: #'+selected.runNumber+
      ', attempt '+selected.runAttempt+'.');
    // CI completing after the agent's observed claim cannot retroactively
    // justify an assertion that tests had already passed at claim time.
    if(Date.parse(selected.updatedAt)>Date.parse(data.target.observedAt)) {
      status='INSUFFICIENT_EVIDENCE';
      headline='CI result arrived after the agent claim';
      reason='The latest supplied workflow result was updated after the claim was observed; it cannot establish the claimed test state at that earlier time.';
      gaps.push('Distinguish post-claim CI completion from evidence available when the agent said done.');
    } else if(selected.status!=='completed') {
      status='INSUFFICIENT_EVIDENCE';
      headline='The newest exact-commit CI run is not finished';
      reason='A pending or running check cannot establish an outcome, even if an older attempt passed.';
      gaps.push('Wait for the latest exact-SHA run to complete and inspect its canonical result.');
    } else if(selected.conclusion==='success') {
      status='PROVIDER_REPORTED_PASS';
      headline='GitHub Actions reported success for this exact commit';
      reason='The supplied latest completed run matches the target SHA and workflow. This is status alignment, not proof the code works.';
    } else if(FINAL_FAILURES.has(selected.conclusion)) {
      status='PROVIDER_REPORTED_FAILURE';
      headline='GitHub Actions did not report a successful run';
      reason='The latest supplied completed run for this exact SHA concluded '+selected.conclusion+'.';
      gaps.push('The claimed CI success conflicts with the selected exact-SHA workflow result.');
    } else {
      status='INSUFFICIENT_EVIDENCE';
      headline='No affirmative CI result for the target commit';
      reason='The latest completed check concluded '+selected.conclusion+'; this does not confirm a test pass.';
      gaps.push('A neutral, skipped or stale workflow conclusion does not verify successful tests.');
    }
    if(exact.length>1)observations.push('Earlier attempts/results are retained for the timeline; the newest supplied attempt takes precedence.');
  } else {
    const ancestorSuccess=other.filter(c=>c.status==='completed'&&c.conclusion==='success'&&
      provableAncestor(data.commitMap,c.sha,data.target.sha)).sort(newestFirst);
    if (ancestorSuccess.length) {
      selected=ancestorSuccess[0];
      status='STALE_EVIDENCE';
      headline='The cited successful CI run belongs to an ancestor commit';
      reason='The run reports success for '+selected.sha.slice(0,8)+', but the claim targets '+
        data.target.sha.slice(0,8)+'. The supplied Git graph proves the revision changed.';
      observations.push('The cited run is for a proven ancestor SHA, not the target SHA.');
      gaps.push('Provide an independent exact-target-SHA CI run rather than reuse the ancestor run.');
      gaps.push('This verdict concerns the supplied artifact, not an assertion that no newer CI exists elsewhere.');
    } else {
      status='INSUFFICIENT_EVIDENCE';
      headline='No exact-commit CI result was supplied';
      reason=other.length?'Supplied CI records target different commits and their ancestry is not proven relevant.':
        'No workflow check metadata was included in the case.';
      gaps.push('A successful GitHub Actions run for the exact target SHA is missing from the supplied evidence.');
      if(other.length)gaps.push('Do not infer ancestry or current success from mismatched or incomplete Git metadata.');
    }
  }
  if(other.length) observations.push(other.length+' run(s) were for SHA(s) other than the target commit.');
  const origins=[...new Set(data.checks.map(c=>c.origin))].sort();
  return {
    schema:VERDICT_SCHEMA,
    status,headline,reason,targetSha:data.target.sha,claim:data.target.claim,
    selectedRun:selected?briefRun(selected):null,
    observations,events:eventList(data),gaps,limitations:[...LIMITATIONS],
    provenance:{
      repo:data.repo.owner+'/'+data.repo.name,
      workflowId:data.repo.workflowId,
      capturedAt:data.capturedAt,
      sources:origins,
      providerReportedOnly:true,
      independentAttestation:false,
      semanticCorrectnessVerified:false,
      claimObservedIndependently:false
    }
  };
}
