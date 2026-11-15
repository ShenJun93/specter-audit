'use strict';
// Arena is a browser-only renderer. It displays one normalized case; no uploads or network PR mutation.
const schema='SPECTER_ARENA_CASE_V1';
const findings=new Set(['UNKNOWN','REGRESSION','DEMONSTRATED_FIX','BOTH_PASS','BOTH_FAIL']);
const trust=new Set(['PROVIDER_REPORTED_UNATTESTED','REVIEWER_CONTROLLED_SELF_REPORTED','DERIVED_FROM_LISTED_INPUTS']);
const reportAttestationFields=['independentlyAttested','executionVerifiedBySpecter','semanticCorrectnessVerified','allRequiredChecksVerified','releaseApproved','localSessionLinkedToPr'];
const sha=/^[0-9a-f]{40}$/;
const hex=/^[0-9a-f]{64}$/;
const $=id=>document.getElementById(id);
let currentReport=null;
let currentSource=null;
function validSubject(s){
 return !!s&&typeof s.repository==='string'&&
  /^[a-z0-9-]{1,39}\/[a-z0-9][a-z0-9._-]{0,99}$/i.test(s.repository)&&
  Number.isSafeInteger(s.prNumber)&&s.prNumber>0&&sha.test(s.baseSha)&&sha.test(s.headSha);
}
// This formatter builds a review *draft* from a validated record. It does not
// attest the report, execute the test, approve a merge, or contact GitHub.
function reviewInline(value){
 return String(value).replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim()
  .replace(/[\u202a-\u202e\u2066-\u2069]/g,'')
  .replace(/[\\\x60*_{}\[\]()#+.!|<>~-]/g,ch=>'\\'+ch);
}
function reviewNote(report,source){
 if(!validateReport(report))return null;
 const s=report.subject;
 const bound=validSubject(s);
 const c=report.classification==='UNKNOWN'?null:report.challenge;
 const sourceLabel=source==='BUNDLED_OWNER_CONTROLLED'?
  'BUNDLED OWNER-CONTROLLED SYNTHETIC FIXTURE':'USER-IMPORTED UNVERIFIED JSON';
 const lines=[
  '# Specter Arena — scoped reviewer draft','',
  'Data origin: '+sourceLabel,
  'PR: '+(bound?'https://github.com/'+s.repository+'/pull/'+s.prNumber:'UNVERIFIED'),
  'Base commit: '+(bound?s.baseSha:'UNKNOWN'),
  'Head commit: '+(bound?s.headSha:'UNKNOWN'),
  'Finding: '+report.classification+(report.classification==='UNKNOWN'?' (no complete reviewer challenge established)':' (limited to one reported reviewer-controlled test)'),
  'Approved test SHA-256 (self-reported): '+(c&&hex.test(c.testSha256)?c.testSha256:'UNKNOWN'),
  'Reported base/head exit codes: '+(c&&[0,1].includes(c.base?.exitCode)&&[0,1].includes(c.head?.exitCode)?[c.base.exitCode,c.head.exitCode].join(' / '):'UNKNOWN'),
  '',
  '## Evidence with bounded trust',
  ...report.statements.map(e=>'- '+reviewInline(e.id)+' ['+e.trust+']: '+reviewInline(e.text)),
  '',
  '## Next verification action',
  reviewInline(report.nextAction.text),
  '',
  '## Evidence limits',
  ...report.limitations.map(limit=>'- '+reviewInline(limit)),
  '',
  'NOT ATTESTED / NOT MERGE APPROVAL. GitHub CI is provider-reported; the challenge is reviewer-controlled self-reported output. The browser did not execute tests or verify source correctness. Check the exact current PR HEAD before acting.'
 ];
 return lines.join('\n')+'\n';
}
async function copyReviewNote(){
 const report=currentReport,source=currentSource;
 const draft=report&&reviewNote(report,source);
 if(!draft)return text('copy-review-status','No valid case is loaded; nothing was copied.');
 const clipboard=globalThis.navigator?.clipboard;
 if(typeof clipboard?.writeText!=='function'){
  text('copy-review-status','Clipboard is unavailable. Nothing was copied.');
  return;
 }
 try{
  await clipboard.writeText(draft);
  if(report===currentReport&&source===currentSource)
   text('copy-review-status','Scoped review draft copied. Check its limits before sharing.');
 }catch{
  if(report===currentReport&&source===currentSource)
   text('copy-review-status','Clipboard permission was denied or copying failed. Nothing was copied.');
 }
}
function showLead(kind){
 if(!currentReport)return;
 if(kind==='ci'){
  const evidence=currentReport.statements.find(s=>s.id==='PROVIDER_RUNS');
  text('lead-result',(evidence?.text??'No complete public CI observation in this report.')+
   ' GitHub records are provider-reported and do not prove the tested behavior or all required checks.');
  return;
 }
 const c=currentReport.challenge;
 if(!c||currentReport.classification==='UNKNOWN'||
    ![0,1].includes(c.base?.exitCode)||![0,1].includes(c.head?.exitCode)){
  text('lead-result','No complete reviewer challenge. UNKNOWN remains the only safe conclusion.');
  return;
 }
 text('lead-result','Reviewer-controlled behavior test: base exit '+c.base.exitCode+
  ', head exit '+c.head.exitCode+'. '+currentReport.nextAction.text+
  ' Scope: this one approved test only; local output is not independently attested.');
}
function caseError(message){
 currentReport=null;currentSource=null;
 $('copy-review-note').disabled=true;
 text('copy-review-status','');
 $('case-status').textContent=message;$('case-file-view').hidden=true;
}
function validateReport(r){
 if(!r||typeof r!=='object'||Array.isArray(r)||r.schema!==schema||
  !findings.has(r.classification)||!r.nextAction||!Array.isArray(r.statements)||
  !Array.isArray(r.limitations)||r.statements.length>30||r.limitations.length>30||
  !reportAttestationFields.every(field=>r.attestation?.[field]===false))
  return false;
 if(r.classification!=='UNKNOWN'&&
  (!validSubject(r.subject)||!r.challenge||!hex.test(r.challenge.testSha256)))return false;
 if(r.classification!=='UNKNOWN'){
  const b=r.challenge.base?.exitCode,h=r.challenge.head?.exitCode;
  if(![0,1].includes(b)||![0,1].includes(h))return false;
  const expected=b===0&&h===1?'REGRESSION':
   b===1&&h===0?'DEMONSTRATED_FIX':
   b===0&&h===0?'BOTH_PASS':'BOTH_FAIL';
  if(expected!==r.classification)return false;
  for(const side of [r.challenge.base,r.challenge.head]){
   if(!hex.test(side.outputSha256)||!/^sha256:[0-9a-f]{64}$/.test(side.imageDigest))return false;
  }
 }
 if(!r.statements.every(x=>x&&typeof x.text==='string'&&x.text.length<650&&
   typeof x.id==='string'&&x.id.length<80&&trust.has(x.trust)&&
   typeof x.observedAt==='string'&&x.observedAt.length<50))return false;
 return typeof r.nextAction.text==='string'&&r.nextAction.text.length<=600&&
  r.limitations.every(x=>typeof x==='string'&&x.length<650);
}
function text(id,value){$(id).textContent=String(value)}
function status(side,id){
 const run=side&&typeof side.exitCode==='number'?side.exitCode:null;
 const label=run===0?'PASS':run===1?'FAIL':'UNKNOWN';
 text(id+'-status',label);
 const tag=$(id+'-status');tag.classList.toggle('is-fail',label==='FAIL');tag.classList.toggle('is-pass',label==='PASS');
 text(id+'-message',label==='UNKNOWN'?'No complete approved challenge observation.':
  'Local reviewer-controlled test exit code '+run+'. Not an independent attestation.');
}
function renderReport(report,{source='USER_IMPORTED_UNVERIFIED'}={}){
 if(!validateReport(report))return caseError('Unsupported or unsafe case report. No verdict has been loaded.');
 const r=validSubject(report.subject)?report.subject:null;
 const c=report.classification==='UNKNOWN'?null:report.challenge;
 currentReport=report;
 currentSource=source;
 $('copy-review-note').disabled=false;
 text('copy-review-status','');
 text('lead-result','Choose an evidence lead to see what it actually proves.');
 $('case-file-view').hidden=false;
 text('finding',report.classification.replaceAll('_',' '));
 $('finding').className='finding'+(report.classification==='DEMONSTRATED_FIX'?' is-fix':
  report.classification==='REGRESSION'?' is-danger':'');
 const label=r?.repository??'Unknown repository';
 text('case-scene',report.classification==='DEMONSTRATED_FIX'?
  'A reviewer-controlled test failed against base but passed on head. GitHub CI observations are separate evidence and do not certify correctness.':
  'The case must be interpreted from its bounded evidence. An UNKNOWN or both-pass result is not release approval.');
 text('base-sha',r?.baseSha??'UNKNOWN');
 text('head-sha',r?.headSha??'UNKNOWN');
 const href=r?'https://github.com/'+r.repository+'/pull/'+r.prNumber:null;
 const link=$('pr-link');link.textContent=href?'PR #'+r.prNumber+' · '+label:'No verified PR link';
 if(href){link.href=href;link.hidden=false}else{link.removeAttribute('href');link.hidden=false}
 status(c?.base,'base');status(c?.head,'head');
 text('challenge-limits','One reviewer-approved test SHA-256: '+(c?.testSha256??'UNKNOWN')+
  '. This report records self-controlled runner outputs; the browser does not rerun tests.');
 const ol=$('statements');ol.replaceChildren();
 for(const s of report.statements){
  const item=document.createElement('li'),tag=document.createElement('span'),
   title=document.createElement('strong'),body=document.createElement('div'),time=document.createElement('time');
  tag.className='trust';tag.textContent=s.trust;
  title.textContent=s.id.replaceAll('_',' ');
  body.textContent=s.text;time.textContent=s.observedAt;time.dateTime=s.observedAt;
  item.append(tag,title,body,time);ol.append(item);
 }
 text('next-action',report.nextAction.text);
 const limits=$('limits');limits.replaceChildren();
 for(const s of report.limitations){const li=document.createElement('li');li.textContent=s;limits.append(li)}
 text('case-status',(source==='BUNDLED_OWNER_CONTROLLED'?'Owner-controlled public fixture':'USER-IMPORTED UNVERIFIED JSON')+'. Classification: '+report.classification+'. This browser has not independently verified the report.');
}
async function loadPublic({focusOnCase=false}={}){
 // Invalidate the previous note while the public report is being refreshed.
 currentReport=null;currentSource=null;
 $('copy-review-note').disabled=true;
 text('copy-review-status','');
 try{
  text('case-status','Opening bundled public case file…');
  const response=await fetch('/arena-fixture-case.json',{cache:'no-store'});
  if(!response.ok)throw Error('Public report is unavailable');
  const content=await response.text();
  if(content.length>100000)throw Error('Report exceeds size limit');
  renderReport(JSON.parse(content),{source:'BUNDLED_OWNER_CONTROLLED'});
  if(focusOnCase&&currentReport){
   const heading=$('choice-heading');
   heading.focus({preventScroll:true});
   heading.scrollIntoView({block:'start',behavior:'auto'});
  }
 }catch{caseError('Public case could not be loaded. No verdict has been inferred.')}
}
async function loadPrivateFile(file){
 currentReport=null;currentSource=null;
 $('copy-review-note').disabled=true;
 text('copy-review-status','');
 if(!file||file.size>100000)return caseError('Select a case JSON under 100 KiB.');
 try{renderReport(JSON.parse(await file.text()))}
 catch{caseError('Case file is invalid. No result has been inferred.')}
}
$('copy-review-note').addEventListener('click',copyReviewNote);
$('lead-ci').addEventListener('click',()=>showLead('ci'));
$('lead-challenge').addEventListener('click',()=>showLead('challenge'));
$('load-case').addEventListener('click',()=>loadPublic({focusOnCase:true}));
$('case-file').addEventListener('change',event=>loadPrivateFile(event.target.files?.[0]));
loadPublic();
