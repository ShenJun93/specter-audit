// Specter Audit browser controller. No external libraries, no source access, no persistence.
'use strict';

const $ = (id) => document.getElementById(id);
const els = {
  refresh: $('refresh'), form: $('claim-form'), claim: $('claim'), receipt: $('receipt'),
  error: $('form-error'), submit: $('evaluate'), state: $('worktree-state'),
  name: $('repo-name'), staged: $('staged-count'), unstaged: $('unstaged-count'),
  untracked: $('untracked-count'), ledger: $('ledger-list'), total: $('ledger-total'),
  head: $('head-label'), footer: $('footer-status'), result: $('result'),
  empty: $('result-empty'), verdict: $('verdict-status'), confidence: $('confidence'),
  description: $('verdict-description'), evidence: $('evidence-list'), gaps: $('gaps-list')
};

function setFooter(text) { els.footer.textContent = text; }
function text(el, content) { el.textContent = String(content); }
function showError(message) { text(els.error, message); els.error.hidden = false; setFooter('Investigation requires attention.'); }
function clearError() { els.error.hidden = true; text(els.error, ''); }
function make(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) text(element, content);
  return element;
}
function addLedgerEntry(code, filename, stage) {
  const li = make('li');
  li.append(make('span', 'ledger-type', code));
  const details = make('div', 'ledger-file');
  details.append(make('strong', '', filename));
  details.append(make('small', '', stage));
  li.append(details);
  els.ledger.append(li);
}
function renderInspection(data) {
  if (!data || !data.ok) throw new Error('Git evidence unavailable. Check the selected repository.');
  const banner = document.querySelector('#demo-mode-notice');
  if (banner) banner.hidden = data.demoMode !== true;
  const clock = document.querySelector('#clock');
  if (clock) clock.textContent = data.demoMode ? 'SYNTHETIC SNAPSHOT' : 'NO EXTERNAL CONNECTION';
  const staged = data.staged ?? [];
  const unstaged = data.unstaged ?? [];
  const untracked = data.untracked ?? [];
  const counts = data.total ?? { staged:staged.length, unstaged:unstaged.length, untracked:untracked.length };
  text(els.state, data.clean ? 'CLEAN' : 'DIRTY');
  text(els.name, data.repo ?? 'Selected repository');
  text(els.staged, counts.staged);
  text(els.unstaged, counts.unstaged);
  text(els.untracked, counts.untracked);
  text(els.head, data.head ? 'HEAD / ' + data.head.slice(0, 12) : 'HEAD / UNBORN');
  const total = counts.staged + counts.unstaged + counts.untracked;
  text(els.total, total + ' RECORD' + (total === 1 ? '' : 'S'));
  els.ledger.replaceChildren();
  for (const item of staged) addLedgerEntry(item.status ?? 'S', item.path, 'STAGED / INDEX');
  for (const item of unstaged) addLedgerEntry(item.status ?? 'M', item.path, 'UNSTAGED / WORKTREE');
  for (const file of untracked) addLedgerEntry('?', file, 'UNTRACKED');
  if (total === 0) els.ledger.append(make('li', 'ledger-placeholder', 'No working-tree changes recorded. A clean tree alone does not prove correctness.'));
  if (data.truncated) els.ledger.append(make('li', 'ledger-placeholder', 'List truncated at 400 entries per category.'));
}
async function getJSON(url, options) {
  const response = await fetch(url, {cache:'no-store', ...options});
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Invalid response from local verifier.'); }
  if (!response.ok) throw new Error(data?.error ?? 'Local verifier error (HTTP ' + response.status + ').');
  return data;
}
async function refreshEvidence() {
  els.refresh.disabled = true;
  setFooter('Inspecting selected Git repository…');
  try {
    const data = await getJSON('/api/inspection');
    renderInspection(data);
    setFooter('Evidence refreshed · Read-only inspection complete.');
  } catch (err) {
    text(els.state, 'ERROR');
    text(els.name, 'Unable to inspect');
    els.ledger.replaceChildren(make('li', 'ledger-placeholder', 'Inspection unavailable; no changes will be made.'));
    setFooter(err.message || 'Unable to inspect repository.');
  } finally { els.refresh.disabled = false; }
}
function renderList(target, items, emptyText) {
  target.replaceChildren();
  if (!items || items.length === 0) {target.append(make('li', '', emptyText)); return;}
  for (const item of items) {
    const label = typeof item === 'string' ? item : item.note ?? item.reason ?? item.kind ?? 'Observation';
    const li = make('li', '', label);
    if (item && Array.isArray(item.matched) && item.matched.length) {
      const names = item.matched.slice(0, 5).map(x=>x.path);
      li.append(document.createTextNode(' · Matches: ' + names.join(', ')));
    }
    target.append(li);
  }
}
function renderResult(verdict, disclaimer) {
  els.empty.hidden = true;
  els.result.hidden = false;
  const status = ['SUPPORTED','PARTIAL','UNVERIFIED'].includes(verdict?.status) ? verdict.status : 'UNVERIFIED';
  const bar = els.result.querySelector('.verdict-bar');
  bar.className = 'verdict-bar status-' + status.toLowerCase();
  text(els.verdict, status);
  text(els.confidence, String(verdict?.confidenceLabel ?? 'none').toUpperCase());
  const label = {
    SUPPORTED:'Observed Git evidence aligns with the claim under the limited rules below.',
    PARTIAL:'Some evidence exists, but the claim is not completely supported.',
    UNVERIFIED:'The current evidence does not support the claim.'
  };
  text(els.description, label[status] + ' ' + disclaimer);
  renderList(els.evidence, verdict.evidence, 'No supporting observations.');
  renderList(els.gaps, verdict.gaps, 'No additional gaps listed. This is still not a semantic correctness proof.');
  els.result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}
async function analyze(event) {
  event.preventDefault();
  clearError();
  const claim = els.claim.value.trim();
  if (!claim || claim.length > 2000) {showError('Enter a completion claim of 1 to 2000 characters.');els.claim.focus();return;}
  let receipt;
  const rawReceipt = els.receipt.value.trim();
  if (rawReceipt) {
    try { receipt = JSON.parse(rawReceipt); }
    catch {showError('Receipt JSON is malformed. Correct it or leave the field empty.');els.receipt.focus();return;}
  }
  els.submit.disabled = true;
  setFooter('Correlating claim with fresh Git evidence…');
  try {
    const result = await getJSON('/api/evaluate', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({claim,...(rawReceipt?{receipt}:{})})
    });
    if(result.inspection?.ok)renderInspection(result.inspection);
    renderResult(result.verdict,result.disclaimer??'');
    setFooter('Analysis complete · Result based on local metadata.');
  } catch (err) {showError(err.message ?? 'Analysis failed.');}
  finally {els.submit.disabled=false;}
}
for(const button of document.querySelectorAll('[data-sample-claim]')){
  button.addEventListener('click',()=>{
    els.claim.value=button.dataset.sampleClaim;
    els.receipt.value='';
    els.form.requestSubmit();
  });
}
els.refresh.addEventListener('click',refreshEvidence);
els.form.addEventListener('submit',analyze);
refreshEvidence();
