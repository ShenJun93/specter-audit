// test/github-actions-evidence.test.mjs
//
// Deterministic tests for the optional GitHub Actions provider-evidence
// reader. No real network is used: every test injects a mock fetch (or none at
// all for the disabled/validation cases). These tests never read credentials
// or touch other repositories.
//
// Trust invariants under test:
//   * Default behavior is offline (enabled:false) and performs NO fetch.
//   * Caller-supplied providerEvidence is structurally ignored (no such param).
//   * Only self-retrieved, exact-SHA, validated-owner/repo results can report
//     PROVIDER_REPORTED_SUCCESS; everything else fails closed to UNKNOWN.
//   * Provider-reported success is never cryptographic attestation or
//     correctness proof.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchGithubActionsEvidence,
  isValidOwner,
  isValidRepo,
  isValidSha,
  PROVIDER_REPORTED_SUCCESS,
  PROVIDER_REPORTED_FAILED,
  PROVIDER_UNKNOWN,
} from '../src/github-actions-evidence.mjs';

const OWNER = 'ShenJun93';
const REPO = 'specter-audit';
const SHA = '0123456789abcdef0123456789abcdef01234567';
const WORKFLOW_ID = 12345;
const NOW = Date.parse('2026-11-03T13:00:00Z');

function ghRun(overrides = {}) {
  const id = overrides.id ?? 41639525541;
  return {
    id,
    workflow_id: overrides.workflowId ?? WORKFLOW_ID,
    run_number: overrides.runNumber ?? id,
    run_attempt: overrides.attempt ?? 1,
    head_sha: overrides.sha ?? SHA,
    status: overrides.status ?? 'completed',
    conclusion: Object.hasOwn(overrides, 'conclusion') ? overrides.conclusion : 'success',
    html_url: overrides.url ?? `https://github.com/${OWNER}/${REPO}/actions/runs/${id}`,
    updated_at: overrides.updatedAt ?? '2026-11-03T12:00:00Z',
    ...(overrides.extra ?? {}),
  };
}

function runsBody(runs, total) {
  return JSON.stringify({
    total_count: total ?? (Array.isArray(runs) ? runs.length : 0),
    workflow_runs: runs ?? [],
  });
}

function makeResponse({ status = 200, body = '', contentType = 'application/json', headers = {} } = {}) {
  const h = { ...(contentType ? { 'content-type': contentType } : {}), ...headers };
  return new Response(body, { status, headers: h });
}

function fetchReturning(responseFactory) {
  let called = 0;
  let lastUrl = null;
  let lastOpts = null;
  const fn = async (url, opts) => {
    called++;
    lastUrl = url;
    lastOpts = opts;
    const r = typeof responseFactory === 'function' ? responseFactory(url, opts) : responseFactory;
    return r;
  };
  Object.defineProperty(fn, 'called', { get: () => called });
  Object.defineProperty(fn, 'lastUrl', { get: () => lastUrl });
  Object.defineProperty(fn, 'lastOpts', { get: () => lastOpts });
  return fn;
}

// --- input validation helpers ------------------------------------------------

test('isValidOwner rejects traversal, slashes and weird chars', () => {
  assert.equal(isValidOwner('ShenJun93'), true);
  assert.equal(isValidOwner('../evil'), false);
  assert.equal(isValidOwner('evil/repo'), false);
  assert.equal(isValidOwner('-bad'), false);
  assert.equal(isValidOwner('bad-'), false);
  assert.equal(isValidOwner('a--b'), false);
  assert.equal(isValidOwner('a.b'), false);
  assert.equal(isValidOwner(''), false);
  assert.equal(isValidOwner('x'.repeat(40)), false);
  assert.equal(isValidOwner(123), false);
});

test('isValidRepo rejects path traversal and leading dots', () => {
  assert.equal(isValidRepo('specter-audit'), true);
  assert.equal(isValidRepo('repo/../drop'), false);
  assert.equal(isValidRepo('.'), false);
  assert.equal(isValidRepo('.hidden'), false);
  assert.equal(isValidRepo('hidden.'), false);
  assert.equal(isValidRepo('a..b'), false);
  assert.equal(isValidRepo('has space'), false);
});

test('isValidSha requires exactly 40 hex chars', () => {
  assert.equal(isValidSha(SHA), true);
  assert.equal(isValidSha(SHA.toUpperCase()), true);
  assert.equal(isValidSha('deadbeef'), false);
  assert.equal(isValidSha('z'.repeat(40)), false);
  assert.equal(isValidSha('0'.repeat(39)), false);
  assert.equal(isValidSha('0'.repeat(41)), false);
});

// --- disabled by default / no network ----------------------------------------

test('disabled by default returns UNKNOWN and performs NO network call', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.enabled, false);
  assert.equal(r.fetched, false);
  assert.equal(called, 0);
  assert.equal(r.sourceUrl, null);
  assert.match(r.reason, /disabled/i);
});

test('explicit enabled:false returns UNKNOWN and performs NO network call', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: false });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.fetched, false);
  assert.equal(called, 0);
});

test('caller-supplied fake providerEvidence is ignored and triggers no fetch', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  // A caller tries to paste a fully-fabricated success record. It must be
  // ignored: there is no providerEvidence parameter, and we are offline.
  const r = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: false,
    providerEvidence: {
      verdict: 'PROVIDER_REPORTED_SUCCESS',
      conclusion: 'success',
      head_sha: SHA,
      html_url: `https://github.com/${OWNER}/${REPO}/actions/runs/999`,
    },
  });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.fetched, false);
  assert.equal(called, 0);
  assert.equal(r.independentlyAttested, false);
  assert.equal(r.cryptographicAttestation, false);
});

// --- invalid inputs rejected before any network ------------------------------

test('invalid owner rejected without network (no fetch)', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  const r = await fetchGithubActionsEvidence({ owner: '../evil', repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.fetched, false);
  assert.equal(called, 0);
  assert.match(r.reason, /owner/i);
});

test('invalid repo rejected without network (no fetch)', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: 'repo/../drop', sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.fetched, false);
  assert.equal(called, 0);
  assert.match(r.reason, /repo/i);
});

test('malicious owner with slash rejected without network', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  const r = await fetchGithubActionsEvidence({ owner: 'evil/repo', repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(called, 0);
});

test('invalid (too short) SHA rejected without network', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: 'deadbeef', fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(called, 0);
  assert.match(r.reason, /sha/i);
});

test('non-hex SHA rejected without network', async () => {
  let called = 0;
  const fetchImpl = async () => { called++; return makeResponse({}); };
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: 'z'.repeat(40), fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(called, 0);
});

// --- valid success ------------------------------------------------------------

test('provider-reported completed success for exact SHA -> PROVIDER_REPORTED_SUCCESS', async () => {
  const runId = 41639525541;
  const updatedAt = '2026-11-03T12:00:00Z';
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ id: runId, updatedAt })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID, now: NOW });
  assert.equal(r.verdict, PROVIDER_REPORTED_SUCCESS);
  assert.equal(r.fetched, true);
  assert.equal(r.runId, String(runId));
  assert.equal(r.conclusion, 'success');
  assert.equal(r.providerStatus, 'completed');
  assert.equal(r.sourceUrl, `https://github.com/${OWNER}/${REPO}/actions/runs/${runId}`);
  assert.equal(r.updatedAt, updatedAt);
  assert.equal(r.ageMs, NOW - Date.parse(updatedAt));
  assert.equal(r.cryptographicAttestation, false);
  assert.equal(r.independentlyAttested, false);
  assert.equal(r.correctness, false);
  assert.equal(r.attestation, 'provider-reported');
  assert.match(r.disclaimer, /not cryptographic attestation/);
  // Only the fixed api.github.com host is ever requested, never an arbitrary URL.
  assert.equal(fetchImpl.lastUrl, `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_ID}/runs?head_sha=${SHA}&per_page=100&page=1`);
  assert.equal(fetchImpl.lastOpts.headers['User-Agent'], 'specter-audit-provider-evidence');
  // No Authorization / secret header is sent.
  assert.equal(fetchImpl.lastOpts.headers.Authorization, undefined);
  assert.equal(fetchImpl.lastOpts.headers.authorization, undefined);
});

test('uppercase SHA is normalized to lowercase for the request URL and matching', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ sha: SHA })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA.toUpperCase(), fetchImpl, enabled: true, workflowId: WORKFLOW_ID, now: NOW });
  assert.equal(r.verdict, PROVIDER_REPORTED_SUCCESS);
  assert.ok(fetchImpl.lastUrl.includes('head_sha=' + SHA));
  assert.equal(r.sha, SHA);
});

// --- non-200 fail closed ------------------------------------------------------

test('HTTP 403 -> UNKNOWN forbidden (fail closed)', async () => {
  const fetchImpl = fetchReturning(makeResponse({ status: 403, body: '{"message":"forbidden"}' }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.fetched, true);
  assert.match(r.reason, /forbidden/i);
});

test('HTTP 429 -> UNKNOWN rate limited (fail closed)', async () => {
  const fetchImpl = fetchReturning(makeResponse({ status: 429, body: '{"message":"rate limited"}' }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /rate/i);
});

test('HTTP 500 -> UNKNOWN provider error (fail closed)', async () => {
  const fetchImpl = fetchReturning(makeResponse({ status: 503, body: '{"message":"unavailable"}' }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /provider error/i);
});

test('HTTP 404 -> UNKNOWN unexpected status (fail closed)', async () => {
  const fetchImpl = fetchReturning(makeResponse({ status: 404, body: '{"message":"not found"}' }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /status/i);
});

// --- content-type / malformed / oversized -------------------------------------

test('non-JSON content type -> UNKNOWN (fail closed)', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: '<html>nope</html>', contentType: 'text/html' }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /content type/i);
});

test('malformed JSON -> UNKNOWN', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: '{not json' }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /malformed/i);
});

test('response missing workflow_runs array -> UNKNOWN malformed', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: JSON.stringify({ total_count: 0 }) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /malformed/i);
});

test('oversized streaming body is capped and rejected -> UNKNOWN', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: 'x'.repeat(200000) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /size|exceed/i);
  assert.equal(r.fetched, true);
});

// --- SHA mismatch / no runs / in-progress / failed ----------------------------

test('run with mismatching head_sha is not accepted (exact SHA required)', async () => {
  const other = '1111111111111111111111111111111111111111';
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ sha: other })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.sourceUrl, null);
  assert.match(r.reason, /exact commit SHA|no run matches/i);
});

test('no runs for the commit -> UNKNOWN', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /no run/i);
});

test('in-progress run -> UNKNOWN (not completed)', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ status: 'in_progress', conclusion: null })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /not completed|in.progress/i);
});

test('queued run -> UNKNOWN (not completed)', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ status: 'queued', conclusion: null })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

test('cancelled run -> PROVIDER_REPORTED_FAILED', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ status: 'completed', conclusion: 'cancelled' })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID, now: NOW });
  assert.equal(r.verdict, PROVIDER_REPORTED_FAILED);
  assert.equal(r.conclusion, 'cancelled');
  assert.equal(r.cryptographicAttestation, false);
  assert.equal(r.independentlyAttested, false);
});

test('failed conclusion -> PROVIDER_REPORTED_FAILED', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ status: 'completed', conclusion: 'failure' })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_REPORTED_FAILED);
  assert.equal(r.conclusion, 'failure');
});

test('newer successful run wins over older failed run of the same workflow', async () => {
  const fetchImpl = fetchReturning(makeResponse({
    body: runsBody([
      ghRun({ id: 1, status: 'completed', conclusion: 'failure' }),
      ghRun({ id: 2, status: 'completed', conclusion: 'success' }),
    ]),
  }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID, now: NOW });
  assert.equal(r.verdict, PROVIDER_REPORTED_SUCCESS);
  assert.equal(r.runId, '2');
});

// --- untrusted run URL --------------------------------------------------------

test('success run pointing at an off-host URL is rejected -> UNKNOWN', async () => {
  const fetchImpl = fetchReturning(makeResponse({
    body: runsBody([ghRun({ url: 'https://evil.example/runs/41639525541' })]),
  }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /run URL|exact commit SHA|no run matches/i);
  assert.equal(r.sourceUrl, null);
});

test('success run with wrong owner/repo in its URL is rejected -> UNKNOWN', async () => {
  const fetchImpl = fetchReturning(makeResponse({
    body: runsBody([ghRun({ url: 'https://github.com/other/repo/actions/runs/41639525541' })]),
  }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

test('success run whose id does not match the URL id is rejected -> UNKNOWN', async () => {
  const fetchImpl = fetchReturning(makeResponse({
    body: runsBody([ghRun({ id: 999, url: `https://github.com/${OWNER}/${REPO}/actions/runs/41639525541` })]),
  }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

// --- timeout / network error --------------------------------------------------

test('request timeout -> UNKNOWN (fail closed)', async () => {
  const fetchImpl = (url, opts) => new Promise((resolve, reject) => {
    if (opts && opts.signal) opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
    // never resolves on its own
  });
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID, timeoutMs: 40 });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.fetched, true);
  assert.match(r.reason, /timed out|timeout/i);
});

test('fetch rejection / network error -> UNKNOWN', async () => {
  const fetchImpl = async () => { throw new Error('ECONNREFUSED'); };
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /network/i);
});

test('fetch unavailable (no implementation) while enabled -> UNKNOWN', async () => {
  // null is not undefined, so the default globalThis.fetch does NOT apply;
  // this deterministically exercises the non-function guard on Node 24.
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl: null, enabled: true, workflowId: WORKFLOW_ID });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(r.fetched, false);
  assert.match(r.reason, /unavailable/i);
});

// --- non-disclosure ------------------------------------------------------------

test('result never echoes the raw provider body, workflow_runs, or credentials', async () => {
  const secret = 'SUPERSECRET_TOKEN_123';
  const fetchImpl = fetchReturning(makeResponse({
    body: runsBody([ghRun({ extra: { nested: secret } })]),
  }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID, now: NOW });
  const serialized = JSON.stringify(r);
  assert.ok(!serialized.includes('workflow_runs'), 'raw response shape must not leak');
  assert.ok(!serialized.includes(secret), 'nested provider payload must not leak');
  assert.ok(r.sourceUrl.startsWith('https://github.com/'));
  assert.ok(!serialized.includes('api.github.com'), 'request host must not appear in the result');
});

test('provider-reported success still disclaims attestation and correctness', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun()]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, fetchImpl, enabled: true, workflowId: WORKFLOW_ID, now: NOW });
  assert.equal(r.verdict, PROVIDER_REPORTED_SUCCESS);
  assert.equal(r.cryptographicAttestation, false);
  assert.equal(r.independentlyAttested, false);
  assert.equal(r.correctness, false);
  assert.match(r.reason, /not cryptographic attestation/);
});

// --- M5B workflow trust-boundary regressions -------------------------------

test('enabled provider requires workflow identity before fetching', async () => {
  let calls = 0;
  const result = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, enabled: true,
    fetchImpl: async () => { calls++; throw Error('should not fetch'); },
  });
  assert.equal(result.verdict, PROVIDER_UNKNOWN);
  assert.equal(result.fetched, false);
  assert.equal(calls, 0);
  assert.match(result.reason, /workflow identity/i);
});

test('invalid workflow identity fails closed without network', async () => {
  let calls = 0;
  const result = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: '../other',
    fetchImpl: async () => { calls++; throw Error('should not fetch'); },
  });
  assert.equal(result.verdict, PROVIDER_UNKNOWN);
  assert.equal(calls, 0);
});

test('green unrelated workflow cannot mask failed target workflow', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1002, workflowId: WORKFLOW_ID + 1, conclusion: 'success', updatedAt: '2026-11-03T12:10:00Z' }),
    ghRun({ id: 1001, workflowId: WORKFLOW_ID, conclusion: 'failure', updatedAt: '2026-11-03T12:00:00Z' }),
  ]) }));
  const result = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, workflowId: WORKFLOW_ID, enabled: true, fetchImpl,
  });
  assert.equal(result.verdict, PROVIDER_REPORTED_FAILED);
  assert.equal(result.runId, '1001');
});

test('newer failed target run supersedes older success', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1001, updatedAt: '2026-11-03T11:00:00Z' }),
    ghRun({ id: 1002, conclusion: 'failure', updatedAt: '2026-11-03T12:00:00Z' }),
  ]) }));
  const result = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, workflowId: WORKFLOW_ID, enabled: true, fetchImpl,
  });
  assert.equal(result.verdict, PROVIDER_REPORTED_FAILED);
  assert.equal(result.runId, '1002');
});

test('newer queued target run prevents stale green status', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1001, updatedAt: '2026-11-03T11:00:00Z' }),
    ghRun({ id: 1002, status: 'queued', conclusion: null, updatedAt: '2026-11-03T12:00:00Z' }),
  ]) }));
  const result = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, workflowId: WORKFLOW_ID, enabled: true, fetchImpl,
  });
  assert.equal(result.verdict, PROVIDER_UNKNOWN);
});

test('only unrelated workflow returns UNKNOWN even if green', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1003, workflowId: WORKFLOW_ID + 1 }),
  ]) }));
  const result = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, workflowId: WORKFLOW_ID, enabled: true, fetchImpl,
  });
  assert.equal(result.verdict, PROVIDER_UNKNOWN);
});

test('older run rerun later cannot hide failure of newer workflow run', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1001, runNumber: 10, attempt: 2, conclusion: 'success', updatedAt: '2026-11-03T14:00:00Z' }),
    ghRun({ id: 1002, runNumber: 11, attempt: 1, conclusion: 'failure', updatedAt: '2026-11-03T12:00:00Z' }),
  ]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_REPORTED_FAILED);
  assert.equal(r.runId, '1002');
  assert.equal(r.runNumber, 11);
  assert.equal(r.runAttempt, 1);
});

test('latest attempt of the same run supersedes earlier success', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1001, runNumber: 10, attempt: 1, conclusion: 'success' }),
    ghRun({ id: 1001, runNumber: 10, attempt: 2, status: 'in_progress', conclusion: null }),
  ]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

test('latest attempt success after earlier failure is reported for that attempt', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1001, runNumber: 10, attempt: 1, conclusion: 'failure' }),
    ghRun({ id: 1001, runNumber: 10, attempt: 2, conclusion: 'success' }),
  ]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_REPORTED_SUCCESS);
  assert.equal(r.runAttempt, 2);
});

test('incomplete pagination never reports a green run', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun()], 101) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /pagination/i);
});

test('next Link pagination header returns UNKNOWN even if total_count is misleading', async () => {
  const fetchImpl = fetchReturning(makeResponse({
    body: runsBody([ghRun()]),
    headers: { link: '<https://api.github.com/?page=2>; rel="next"' },
  }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /pagination/i);
});

test('missing total_count is not trusted', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: JSON.stringify({ workflow_runs: [ghRun()] }) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

test('missing run_number fails closed instead of using updated_at', async () => {
  const run = ghRun();
  delete run.run_number;
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([run]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /metadata/i);
});

test('missing run_attempt fails closed', async () => {
  const run = ghRun();
  delete run.run_attempt;
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([run]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

test('conflicting run IDs for same run_number fail closed', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([
    ghRun({ id: 1001, runNumber: 10 }),
    ghRun({ id: 1002, runNumber: 10 }),
  ]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

test('completed run without conclusion is UNKNOWN, not FAILED', async () => {
  const fetchImpl = fetchReturning(makeResponse({ body: runsBody([ghRun({ conclusion: null })]) }));
  const r = await fetchGithubActionsEvidence({ owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
});

test('workflow ID containing leading zero is invalid without network', async () => {
  let count = 0;
  const r = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, workflowId: '0012345', enabled: true,
    fetchImpl: async () => { count++; return makeResponse({}); },
  });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(count, 0);
});
test('response body that hangs after HTTP 200 is subject to timeout', async () => {
  let signal;
  const fetchImpl = async (_url, opts) => {
    signal = opts.signal;
    return new Response(new ReadableStream({ start() {} }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  };
  const r = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID,
    fetchImpl, timeoutMs: 35,
  });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.match(r.reason, /body timed out/i);
  assert.equal(signal.aborted, true);
});

test('non-streaming response is rejected without unbounded text read', async () => {
  let textCalled = 0;
  const fetchImpl = async () => ({
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    body: null,
    text: async () => { textCalled++; return runsBody([ghRun()]); },
  });
  const r = await fetchGithubActionsEvidence({
    owner: OWNER, repo: REPO, sha: SHA, enabled: true, workflowId: WORKFLOW_ID, fetchImpl,
  });
  assert.equal(r.verdict, PROVIDER_UNKNOWN);
  assert.equal(textCalled, 0);
});
