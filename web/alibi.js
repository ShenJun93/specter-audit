/* Specter Audit — interactive Alibi Room. No dependencies or external calls. */
(() => {
  'use strict';
  const TARGET = 'b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e';
  const ANCESTOR = '374af1417b714619d9edc1af790f7e7db15a71ca';
  const REPO = 'ShenJun93/specter-audit';
  const WORKFLOW = 405703749;
  const OLD_RUN = 41736082288;
  const NEW_RUN = 41742626694;
  const expected = Object.freeze({
    'stale-artifact': {status: 'STALE_EVIDENCE', runId: OLD_RUN, sha: ANCESTOR, runs: 1},
    'current-exact-run': {status: 'PROVIDER_REPORTED_PASS', runId: NEW_RUN, sha: TARGET, runs: 2},
    'no-artifact-presented': {status: 'INSUFFICIENT_EVIDENCE', runId: null, sha: null, runs: 0}
  });
  const DIGEST = /^[0-9a-f]{40}$/;
  const iso = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : NaN;
  function fail(message) { throw new Error(`Invalid recorded alibi: ${message}`); }
  function equal(a, b) { return String(a) === String(b); }
  function canonicalRunLink(link, id) {
    if (typeof link !== 'string' || !Number.isSafeInteger(id) || id <= 0) return null;
    const expectedUrl = `https://github.com/${REPO}/actions/runs/${id}`;
    // Exact equality prevents credentials, alternate origins, fake run IDs,
    // encoded paths, queries, fragments and special URL normalization.
    return link === expectedUrl ? expectedUrl : null;
  }
  function hasProvableParent(graph, child, ancestor) {
    if (child === ancestor) return false;
    const bySha = new Map(graph.map(c => [c.sha, c]));
    const start = bySha.get(child);
    if (!start) return false;
    const stack = [...start.parents], visited = new Set();
    while (stack.length) {
      const parent = stack.pop();
      if (visited.has(parent)) continue;
      visited.add(parent);
      if (parent === ancestor) return true;
      const node = bySha.get(parent);
      if (node) stack.push(...node.parents);
    }
    return false;
  }
  function validateCase(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('case object');
    const rule = expected[raw.id];
    if (!rule || typeof raw.title !== 'string' || raw.title.length > 110 || !raw.title ||
        typeof raw.explanation !== 'string' || raw.explanation.length > 1500 || !raw.explanation ||
        typeof raw.label !== 'string' || raw.label.length > 120 || !raw.label) fail('case metadata');
    if (!raw.input || !raw.verdict || raw.expectedStatus !== rule.status ||
        raw.verdict.schema !== 'SPECTER_ALIBI_VERDICT_V1' || raw.verdict.status !== rule.status ||
        raw.input.schema !== 'SPECTER_ALIBI_CASE_V1') fail('case status/schema');
    const input = raw.input;
    if (input.repo?.owner !== 'ShenJun93' || input.repo?.name !== 'specter-audit' ||
        input.repo?.workflowId !== WORKFLOW || input.target?.sha !== TARGET ||
        raw.verdict.targetSha !== TARGET || typeof input.target.claim !== 'string' ||
        input.target.claim.length > 2000 || input.target.claim.length === 0 ||
        !Array.isArray(input.checks) || input.checks.length !== rule.runs ||
        !Array.isArray(input.commits) || input.commits.length > 100) fail('case input identity');
    if (!Array.isArray(raw.verdict.events) || raw.verdict.events.length > 150 ||
        !Array.isArray(raw.verdict.gaps) || raw.verdict.gaps.length > 30 ||
        typeof raw.verdict.headline !== 'string' || typeof raw.verdict.reason !== 'string' ||
        raw.verdict.headline.length > 250 || raw.verdict.reason.length > 2000) fail('verdict contents');
    if (raw.verdict.provenance?.independentAttestation !== false ||
        raw.verdict.provenance?.semanticCorrectnessVerified !== false ||
        raw.verdict.provenance?.providerReportedOnly !== true ||
        raw.verdict.provenance.repo !== REPO ||
        raw.verdict.provenance.workflowId !== WORKFLOW) fail('untrusted provenance');
    if (Number.isNaN(iso(input.capturedAt)) || Number.isNaN(iso(input.target.observedAt)) ||
        iso(input.target.observedAt) > iso(input.capturedAt)) fail('timestamps');
    for (const c of input.commits) {
      if (!DIGEST.test(c?.sha) || !Array.isArray(c.parents) || c.parents.length > 16 ||
          c.parents.some(p => !DIGEST.test(p))) fail('commit genealogy');
    }
    if (!hasProvableParent(input.commits, TARGET, ANCESTOR)) fail('expected production genealogy');
    const validRun = (run, id, sha, expectedNumber) =>
      !!run && run.runId === id && run.sha === sha && run.workflowId === WORKFLOW &&
      run.runNumber === expectedNumber && run.runAttempt === 1 && run.status === 'completed' && run.conclusion === 'success' &&
      run.origin === 'RECORDED_GITHUB_PROVIDER' &&
      canonicalRunLink(run.sourceUrl, id) !== null && Number.isFinite(iso(run.updatedAt)) &&
      iso(run.updatedAt) <= iso(input.capturedAt);
    if (rule.runs >= 1 && !validRun(input.checks[0], OLD_RUN, ANCESTOR, 6)) fail('older GitHub run identity');
    if (rule.runs === 2 && !validRun(input.checks[1], NEW_RUN, TARGET, 9)) fail('current GitHub run identity');
    const selected = raw.verdict.selectedRun;
    if (rule.runId === null ? selected !== null :
        !validRun(selected, rule.runId, rule.sha, rule.runId === OLD_RUN ? 6 : 9)) fail('selected provider run mismatch');
    for (const e of raw.verdict.events) {
      if (!e || !['CI_RUN', 'COMMIT', 'CLAIM'].includes(e.type) ||
          Number.isNaN(iso(e.timestamp)) || !DIGEST.test(e.sha) ||
          typeof e.label !== 'string' || e.label.length > 230) fail('timeline event');
      if (e.type === 'CI_RUN') {
        const run = input.checks.find(r => r.runId === e.runId);
        if (!run || e.sha !== run.sha || e.sourceKind !== run.origin || !canonicalRunLink(e.sourceUrl, e.runId)) fail('event source mismatch');
      } else if (e.sourceUrl !== null) fail('non-CI event cannot supply provider link');
    }
    return raw;
  }
  function validatePack(pack) {
    if (!pack || typeof pack !== 'object' || pack.schema !== 'SPECTER_ALIBI_EXHIBITS_V1' ||
        pack.fixedPublicRepo !== REPO || pack.targetCommit !== TARGET ||
        Number.isNaN(iso(pack.capturedAt)) || !Array.isArray(pack.cases) ||
        pack.cases.length !== 3) fail('file scope');
    const ids = new Set();
    for (const c of pack.cases) {
      validateCase(c);
      if (ids.has(c.id)) fail('duplicate case ID');
      ids.add(c.id);
      if (!equal(iso(c.input.capturedAt), iso(pack.capturedAt))) fail('case capture timestamp');
    }
    if (ids.size !== Object.keys(expected).length) fail('missing case');
    return pack;
  }
  function selectedEventRows(events) {
    const relevant = events.filter(e => e.type !== 'COMMIT' ||
      e.sha === TARGET || e.sha === ANCESTOR || e.sha === 'ad8c79f27bb5da3e6228696c55d1e3a50cc8bf3b');
    return relevant.sort((a, b) => iso(a.timestamp) - iso(b.timestamp));
  }
  // The pure guards can be exercised with Node's vm without a DOM.
  if (typeof document === 'undefined') {
    globalThis.SpecterAlibiGuards = {validatePack, validateCase, canonicalRunLink, hasProvableParent, selectedEventRows};
    return;
  }

  const $ = id => document.getElementById(id);
  const controls = [...document.querySelectorAll('[data-case]')];
  const status = $('loaded-status');
  const reveal = $('reveal');
  const verdictEl = $('verdict');
  let pack = null;
  let selected = null;
  function set(el, value) { el.textContent = String(value); }
  function node(tag, className, textValue) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textValue !== undefined) set(el, textValue);
    return el;
  }
  function shortSha(value) { return typeof value === 'string' ? value.slice(0, 8) : 'NONE'; }
  function utc(value) {
    try { return new Date(value).toLocaleString('en-GB', {
      timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short'
    }) + ' UTC'; } catch { return 'Unknown'; }
  }
  function renderEvents(entries) {
    const list = $('timeline');
    list.replaceChildren();
    for (const entry of selectedEventRows(entries)) {
      const li = node('li', entry.type === 'CI_RUN' ? 'run-event' :
        entry.type === 'CLAIM' ? 'claim-event' : 'commit-event');
      const head = node('div', 'event-header');
      head.append(node('span', 'event-heading', entry.type === 'CI_RUN' ? 'GITHUB ACTIONS RUN' :
        entry.type === 'CLAIM' ? 'AGENT CLAIM' : 'GIT COMMIT'));
      head.append(node('time', 'event-stamp', utc(entry.timestamp)));
      li.append(head, node('p', 'event-desc', entry.label));
      if (entry.type === 'CI_RUN' && canonicalRunLink(entry.sourceUrl, entry.runId)) {
        const link = node('a', 'event-link', `Inspect GitHub run ${entry.runId} ↗`);
        link.href = canonicalRunLink(entry.sourceUrl, entry.runId);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        li.append(link);
      }
      list.append(li);
    }
  }
  function renderCase(id) {
    if (!pack) return;
    const item = pack.cases.find(c => c.id === id);
    if (!item) return;
    selected = item;
    controls.forEach(button => {
      const active = button.dataset.case === id;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    set($('case-number'), String(pack.cases.indexOf(item) + 1).padStart(2, '0'));
    set($('case-title'), item.title);
    set($('case-desc'), item.explanation);
    set($('origin-label'), item.label);
    set($('target-sha'), shortSha(item.input.target.sha));
    set($('cited-sha'), item.verdict.selectedRun ? shortSha(item.verdict.selectedRun.sha) : 'NONE SUPPLIED');
    set($('cited-sub'), item.verdict.selectedRun ?
      `GitHub run #${item.verdict.selectedRun.runNumber}` : 'No run included in this exhibit');
    renderEvents(item.verdict.events);
    verdictEl.hidden = true;
    verdictEl.className = 'verdict';
    $('source-link').hidden = true;
    reveal.disabled = false;
    reveal.textContent = '✧ Expose the alibi';
  }
  function revealVerdict() {
    if (!selected) return;
    const v = selected.verdict;
    const kind = v.status === 'PROVIDER_REPORTED_PASS' ? 'pass' :
      v.status === 'PROVIDER_REPORTED_FAILURE' ? 'fail' :
      v.status === 'STALE_EVIDENCE' ? 'stale' : 'unknown';
    verdictEl.className = `verdict ${kind}`;
    set($('verdict-type'), v.status.replaceAll('_', ' '));
    set($('verdict-title'), v.headline);
    set($('verdict-reason'), v.reason);
    const gaps = $('verdict-gaps');
    gaps.replaceChildren();
    for (const gap of v.gaps.slice(0, 12)) gaps.append(node('li', '', gap));
    const link = $('source-link');
    const source = v.selectedRun && canonicalRunLink(v.selectedRun.sourceUrl, v.selectedRun.runId);
    if (source) {
      link.href = source;
      link.hidden = false;
    } else {
      link.removeAttribute('href');
      link.hidden = true;
    }
    verdictEl.hidden = false;
    reveal.textContent = '✧ Alibi exposed';
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      verdictEl.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  }
  reveal.addEventListener('click', revealVerdict);
  controls.forEach(button => button.addEventListener('click', () => renderCase(button.dataset.case)));
  async function boot() {
    try {
      const res = await fetch('/alibi-cases.json', {
        method: 'GET', headers: {Accept: 'application/json'},
        cache: 'no-store', signal: AbortSignal.timeout(10000)
      });
      if (!res.ok || !String(res.headers.get('content-type')).includes('json')) fail('case file unavailable');
      if (Number(res.headers.get('content-length') || 0) > 160000) fail('oversized case file');
      const data = await res.text();
      if (data.length > 160000) fail('oversized case file');
      pack = validatePack(JSON.parse(data));
      set($('captured-at'), utc(pack.capturedAt));
      set(status, 'Public evidence loaded · 3 bounded cases');
      renderCase('stale-artifact');
    } catch (err) {
      pack = null;
      reveal.disabled = true;
      set(status, 'Evidence not available — investigation disabled');
      set($('case-title'), 'Unable to verify the recorded exhibits');
      set($('case-desc'), 'The recorded case pack is missing or did not pass provenance checks. No verdict is shown.');
      set($('timeline'), '');
      verdictEl.hidden = true;
      console.warn('Alibi Room refused case pack:', err.message);
    }
  }
  boot();
})();
