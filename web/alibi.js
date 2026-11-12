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
    const commitIds = new Set();
    for (const c of input.commits) {
      if (!DIGEST.test(c?.sha) || !Array.isArray(c.parents) || c.parents.length > 16 ||
          c.parents.some(p => !DIGEST.test(p))) fail('commit genealogy');
      if (commitIds.has(c.sha)) fail('duplicate Git commit record');
      commitIds.add(c.sha);
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
    // Status claims must agree with the exact provider record at claim time.
    // A CI run finishing after the hypothetical claim cannot validate it.
    if (rule.status === 'PROVIDER_REPORTED_PASS' &&
        iso(input.checks[1].updatedAt) > iso(input.target.observedAt)) {
      fail('CI result completed after claim observation');
    }
    const selected = raw.verdict.selectedRun;
    if (rule.runId === null ? selected !== null :
        !validRun(selected, rule.runId, rule.sha, rule.runId === OLD_RUN ? 6 : 9)) fail('selected provider run mismatch');
    if (selected) {
      const cited = input.checks.find(check => check.runId === selected.runId);
      if (!cited || iso(selected.updatedAt) !== iso(cited.updatedAt) ||
          selected.status !== cited.status || selected.conclusion !== cited.conclusion ||
          selected.origin !== cited.origin || selected.sourceUrl !== cited.sourceUrl) {
        fail('selected run diverges from supplied provider check');
      }
    }
    const runEventCounts = new Map();
    for (const e of raw.verdict.events) {
      if (!e || !['CI_RUN', 'COMMIT', 'CLAIM'].includes(e.type) ||
          Number.isNaN(iso(e.timestamp)) || !DIGEST.test(e.sha) ||
          typeof e.label !== 'string' || e.label.length > 230) fail('timeline event');
      if (e.type === 'CI_RUN') {
        const run = input.checks.find(r => r.runId === e.runId);
        if (!run || e.sha !== run.sha || e.sourceKind !== run.origin ||
            !canonicalRunLink(e.sourceUrl, e.runId) ||
            iso(e.timestamp) !== iso(run.updatedAt)) fail('event source mismatch');
        runEventCounts.set(e.runId, (runEventCounts.get(e.runId) || 0) + 1);
        if (runEventCounts.get(e.runId) !== 1) fail('duplicate CI timeline event');
      } else {
        if (e.sourceUrl !== null) fail('non-CI event cannot supply provider link');
        if (e.type === 'CLAIM' &&
            (e.sha !== TARGET || iso(e.timestamp) !== iso(input.target.observedAt))) {
          fail('claim timeline disagrees with observed claim');
        }
        if (e.type === 'COMMIT') {
          const commit = input.commits.find(c => c.sha === e.sha);
          if (!commit || iso(commit.committedAt) !== iso(e.timestamp)) {
            fail('commit timeline does not match Git graph');
          }
        }
      }
    }
    if (runEventCounts.size !== input.checks.length) fail('missing CI timeline event');
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

  const LOCAL_SESSION_ID = 'real-kiro-session';
  const LOCAL_SESSION_TRACE = '48f82b65a652dc2a7f4b4de8d20716af45c798152cf5d4c95867443bb2847d12';
  const LOCAL_TEST_AT = '2026-11-03T13:42:38.312Z';
  const LOCAL_CLAIM_AT = '2026-11-03T13:42:53.083Z';
  const LOCAL_EDIT_AT = Object.freeze([
    '2026-11-03T15:06:27.965Z', '2026-11-03T15:06:41.549Z',
    '2026-11-03T15:06:55.866Z', '2026-11-03T15:07:08.372Z',
    '2026-11-03T15:07:21.514Z'
  ]);
  // Local CLI receipts are separate from GitHub provider runs. These fixed
  // bounds prevent a swapped static file from inventing tool results or links.
  function validateSessionExhibit(raw) {
    const required = [
      'schema', 'id', 'project', 'title', 'summary', 'origin',
      'capturedAt', 'sourceTraceSha256', 'claim', 'toolEvidence',
      'sourceEdits', 'sessionEndedAt', 'afterFinalEdit',
      'finding', 'provenanceNote', 'privacyNote'
    ];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
        Object.keys(raw).length !== required.length ||
        Object.keys(raw).some(k => !required.includes(k)) ||
        raw.schema !== 'SPECTER_ALIBI_RECORDED_KIRO_SESSION_V1' ||
        raw.id !== LOCAL_SESSION_ID || raw.project !== REPO ||
        raw.origin !== 'RECORDED_LOCAL_KIRO_CLI_SESSION' ||
        raw.sourceTraceSha256 !== LOCAL_SESSION_TRACE ||
        raw.title !== 'The midnight rewrite' ||
        raw.summary !== 'A genuine Kiro CLI test report passed, then the same agent made five later source edits. The earlier result cannot establish their final tested state.' ||
        !Number.isFinite(iso(raw.capturedAt)) || iso(raw.capturedAt) <= iso(LOCAL_EDIT_AT[4])) {
      fail('local Kiro session identity');
    }
    if (!raw.claim || Object.keys(raw.claim).length !== 2 ||
        raw.claim.text !== 'All 120 tests pass, 0 fail.' ||
        raw.claim.observedAt !== LOCAL_CLAIM_AT ||
        !raw.toolEvidence || Object.keys(raw.toolEvidence).length !== 5 ||
        raw.toolEvidence.kind !== 'KIRO_EXECUTE_PWSH_TOOL_RESULT' ||
        raw.toolEvidence.at !== LOCAL_TEST_AT ||
        raw.toolEvidence.pass !== 120 ||
        raw.toolEvidence.fail !== 0 ||
        raw.toolEvidence.exitCode !== 0 ||
        !Array.isArray(raw.sourceEdits) || raw.sourceEdits.length !== 5 ||
        raw.sessionEndedAt !== LOCAL_EDIT_AT[4] ||
        !(iso(LOCAL_TEST_AT) < iso(LOCAL_CLAIM_AT))) {
      fail('local Kiro recorded tool results');
    }
    for (let i = 0; i < LOCAL_EDIT_AT.length; i++) {
      const edit = raw.sourceEdits[i];
      if (!edit || Object.keys(edit).length !== 3 ||
          edit.at !== LOCAL_EDIT_AT[i] ||
          edit.file !== 'src/github-actions-evidence.mjs' ||
          edit.successful !== true ||
          !(iso(edit.at) > iso(LOCAL_CLAIM_AT))) fail('local source edit chronology');
    }
    if (!raw.afterFinalEdit || Object.keys(raw.afterFinalEdit).length !== 2 ||
        raw.afterFinalEdit.furtherTestRunsObservedInThisSavedSession !== 0 ||
        raw.afterFinalEdit.outsideSessionEvidenceUnknown !== true ||
        !raw.finding || Object.keys(raw.finding).length !== 6 ||
        raw.finding.status !== 'STALE_LOCAL_TEST_EVIDENCE' ||
        raw.finding.reason !== 'Successful source edit after latest passing test with no later passing test' ||
        raw.finding.headline !== 'Tests passed. Then the code changed.' ||
        raw.finding.independentAttestation !== false ||
        raw.finding.semanticCorrectnessVerified !== false ||
        !Array.isArray(raw.finding.gaps) || raw.finding.gaps.length !== 3 ||
        raw.finding.gaps[0] !== 'Five successful source edits followed the last recorded passing test.' ||
        raw.finding.gaps[1] !== 'No rerun was observed after those edits within this saved Kiro session.' ||
        raw.finding.gaps[2] !== 'Other sessions or later CI could contain additional evidence; code correctness is not evaluated.' ||
        raw.provenanceNote !== 'Recorded Kiro CLI tool results from a local editable session; captured SHA-256 is a fingerprint, not a signed attestation.' ||
        raw.privacyNote !== 'Only selected, pre-scrubbed timestamps, public source file name, outcome counts and digest are shown. No raw session or terminal output is published.') {
      fail('local session finding cannot be authenticated from record');
    }
    return raw;
  }
  function sessionTimeline(session) {
    return [
      {type:'LOCAL_TEST', timestamp:session.toolEvidence.at,
        label:'Kiro CLI tool result: 120 tests passed, 0 failed, exit code 0.'},
      {type:'CLAIM', timestamp:session.claim.observedAt,
        label:'Actual coding-agent statement: “All 120 tests pass, 0 fail.”'},
      ...session.sourceEdits.map((edit, index) => ({
        type:'SOURCE_EDIT', timestamp:edit.at,
        label:'Kiro source edit '+(index+1)+'/5: '+edit.file+' (successful)'
      }))
    ];
  }

  function selectedEventRows(events) {
    const relevant = events.filter(e => e.type !== 'COMMIT' ||
      e.sha === TARGET || e.sha === ANCESTOR || e.sha === 'ad8c79f27bb5da3e6228696c55d1e3a50cc8bf3b');
    return relevant.sort((a, b) => iso(a.timestamp) - iso(b.timestamp));
  }
  // The pure guards can be exercised with Node's vm without a DOM.
  if (typeof document === 'undefined') {
    globalThis.SpecterAlibiGuards = {validatePack, validateCase, validateSessionExhibit, sessionTimeline, canonicalRunLink, hasProvableParent, selectedEventRows};
    return;
  }

  const $ = id => document.getElementById(id);
  const controls = [...document.querySelectorAll('[data-case]')];
  const status = $('loaded-status');
  const reveal = $('reveal');
  const quickReveal = $('quick-reveal');
  const verdictEl = $('verdict');
  let pack = null;
  let localSession = null;
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
  function renderEvents(entries, isLocal = false) {
    const list = $('timeline');
    list.replaceChildren();
    for (const entry of isLocal ? entries : selectedEventRows(entries)) {
      const li = node('li', entry.type === 'CI_RUN' ? 'run-event' :
        entry.type === 'LOCAL_TEST' ? 'local-test-event' :
        entry.type === 'SOURCE_EDIT' ? 'edit-event' :
        entry.type === 'CLAIM' ? 'claim-event' : 'commit-event');
      const head = node('div', 'event-header');
      head.append(node('span', 'event-heading', entry.type === 'CI_RUN' ? 'GITHUB ACTIONS RUN' :
        entry.type === 'LOCAL_TEST' ? 'LOCAL KIRO TEST RECEIPT' :
        entry.type === 'SOURCE_EDIT' ? 'KIRO SOURCE EDIT' :
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

  function renderSessionCase() {
    if (!localSession) return;
    selected = {kind:'local-session', verdict:localSession.finding};
    controls.forEach(button => {
      const active = button.dataset.case === LOCAL_SESSION_ID;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    set($('case-number'), '04');
    set($('case-title'), localSession.title);
    set($('case-desc'), localSession.summary);
    set($('origin-label'), 'AUTHENTIC KIRO CLI SESSION · LOCAL SELF-RECORD');
    set($('target-label'), 'KIRO AGENT CLAIM');
    set($('target-sub'), '120 tests reportedly passed at claim time');
    set($('target-sha'), '120 PASS');
    set($('cited-label'), 'SOURCE EDITS AFTER TEST');
    set($('cited-sha'), '5 EDITS');
    set($('cited-sub'), 'Same adapter, later than recorded passing test');
    renderEvents(sessionTimeline(localSession), true);
    set($('scope-caveat'), 'Local self-recorded tool log · not independent attestation');
    resetReveal();
  }
  function resetReveal() {
    verdictEl.hidden = true;
    verdictEl.className = 'verdict';
    $('source-link').removeAttribute('href');
    $('source-link').hidden = true;
    reveal.disabled = false;
    quickReveal.disabled = false;
    quickReveal.setAttribute('aria-expanded', 'false');
    quickReveal.firstChild.textContent = 'Reveal finding now ';
    reveal.textContent = '✧ Expose the alibi';
  }

  function renderCase(id) {
    if (!pack) return;
    if (id === LOCAL_SESSION_ID) return renderSessionCase();
    const item = pack.cases.find(c => c.id === id);
    if (!item) return;
    selected = {kind:'provider', verdict:item.verdict};
    controls.forEach(button => {
      const active = button.dataset.case === id;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    set($('case-number'), String(pack.cases.indexOf(item) + 1).padStart(2, '0'));
    set($('case-title'), item.title);
    set($('case-desc'), item.explanation);
    set($('origin-label'), item.label);
    set($('target-label'), 'THE CLAIMED REVISION');
    set($('target-sub'), 'Target commit SHA');
    set($('cited-label'), 'CITED CI REVISION');
    set($('scope-caveat'), 'Provider-reported status ≠ proof of correctness');
    set($('target-sha'), shortSha(item.input.target.sha));
    set($('cited-sha'), item.verdict.selectedRun ? shortSha(item.verdict.selectedRun.sha) : 'NONE SUPPLIED');
    set($('cited-sub'), item.verdict.selectedRun ?
      `GitHub run #${item.verdict.selectedRun.runNumber}` : 'No run included in this exhibit');
    renderEvents(item.verdict.events);
    resetReveal();
  }
  function revealVerdict() {
    if (!selected) return;
    const v = selected.verdict;
    const kind = v.status === 'PROVIDER_REPORTED_PASS' ? 'pass' :
      v.status === 'PROVIDER_REPORTED_FAILURE' ? 'fail' :
      v.status === 'STALE_EVIDENCE' || v.status === 'STALE_LOCAL_TEST_EVIDENCE' ? 'stale' : 'unknown';
    verdictEl.className = `verdict ${kind}`;
    set($('verdict-type'), v.status.replaceAll('_', ' '));
    set($('verdict-title'), v.headline);
    set($('verdict-reason'), v.reason);
    const gaps = $('verdict-gaps');
    gaps.replaceChildren();
    for (const gap of v.gaps.slice(0, 12)) gaps.append(node('li', '', gap));
    const link = $('source-link');
    const source = selected.kind === 'provider' && v.selectedRun && canonicalRunLink(v.selectedRun.sourceUrl, v.selectedRun.runId);
    if (source) {
      link.href = source;
      link.hidden = false;
    } else {
      link.removeAttribute('href');
      link.hidden = true;
    }
    verdictEl.hidden = false;
    quickReveal.setAttribute('aria-expanded', 'true');
    quickReveal.firstChild.textContent = 'Finding revealed ';
    reveal.textContent = '✧ Alibi exposed';
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      verdictEl.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
  }
  reveal.addEventListener('click', revealVerdict);
  quickReveal.addEventListener('click', () => {
    if (!selected) return;
    revealVerdict();
    $('verdict-title').focus({preventScroll:true});
    verdictEl.scrollIntoView({block:'center',behavior:'instant'});
  });
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
      set(status, '3 GitHub exhibits loaded · checking Kiro session…');
      renderCase('stale-artifact');
      // Fail-closed independently: a missing or tampered local session cannot
      // disable the already validated public GitHub provider exhibits.
      try {
        const localRes = await fetch('/alibi-session-case.json', {
          method: 'GET', headers: {Accept: 'application/json'},
          cache: 'no-store', signal: AbortSignal.timeout(10000)
        });
        if (!localRes.ok || !String(localRes.headers.get('content-type')).includes('json')) fail('local session file unavailable');
        if (Number(localRes.headers.get('content-length') || 0) > 14000) fail('oversized local session file');
        const localText = await localRes.text();
        if (localText.length > 14000) fail('oversized local session file');
        localSession = validateSessionExhibit(JSON.parse(localText));
        const sessionButton = controls.find(button => button.dataset.case === LOCAL_SESSION_ID);
        if (sessionButton) sessionButton.disabled = false;
        // Lead the judge demo with authentic local evidence; retain all three
        // GitHub exhibits as independent selectable cases.
        renderCase(LOCAL_SESSION_ID);
        set(status, '4 recorded exhibits · 3 GitHub · 1 real Kiro session');
      } catch (localError) {
        localSession = null;
        const sessionButton = controls.find(button => button.dataset.case === LOCAL_SESSION_ID);
        if (sessionButton) sessionButton.disabled = true;
        set(status, '3 GitHub exhibits verified · Kiro session unavailable');
        console.warn('Alibi Room rejected local Kiro session:', localError.message);
      }
    } catch (err) {
      pack = null;
      reveal.disabled = true;
      quickReveal.disabled = true;
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
