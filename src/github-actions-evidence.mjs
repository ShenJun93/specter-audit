// src/github-actions-evidence.mjs
//
// Specter Audit — Milestone 5A: optional, opt-in GitHub Actions provider
// evidence reader.
//
// This module is the ONLY component in Specter Audit that may make an outbound
// network request, and only when the caller explicitly passes `enabled: true`.
// The local Git inspector (`src/git-inspector.mjs`) remains fully offline and
// is unaffected by this module existing.
//
// Trust model (NON-NEGOTIABLE):
//
//   * The caller may NEVER hand in a `providerEvidence` object and have it
//     trusted. There is no such parameter. The only provider data this module
//     considers is bytes it retrieves itself from a fixed, allowlisted
//     api.github.com endpoint. Any extra fields the caller passes are ignored.
//   * A provider-reported successful CI run is NOT signed/cryptographic
//     attestation, and it is NOT proof that the code is correct. It only means
//     GitHub's records report a completed+success run for the exact commit.
//   * We distinguish exactly three verdicts:
//       PROVIDER_REPORTED_SUCCESS — GitHub reports a completed run with
//         conclusion "success" for the EXACT commit SHA, owned by the exact
//         requested owner/repo, with a validated github.com run URL.
//       PROVIDER_REPORTED_FAILED   — GitHub reports a completed run for the
//         exact SHA whose conclusion is not "success".
//       UNKNOWN                    — everything else: disabled, network error,
//         timeout, 403/429/5xx, malformed/oversized response, SHA mismatch, no
//         runs, in-progress run, or an untrusted run URL. We always fail closed.
//
// Security boundaries:
//
//   * No arbitrary URL. The URL is constructed from strictly validated owner,
//     repo and a full 40-hex-char SHA, on the fixed host https://api.github.com.
//   * No credentials, tokens, secrets or Authorization header. Public repos
//     only. No process.env access at all.
//   * No shell, no command execution, no repo mutation, no file reads.
//   * Bounded execution: AbortController timeout + bounded response stream
//     (<= 128 KiB). Fail closed on timeout, oversized body, wrong content type,
//     403/429/5xx and malformed JSON.
//   * The returned object never contains the raw response body, source file
//     contents or credentials — only distilled, validated fields.

const API_HOST = 'https://api.github.com';
const RUN_HOST = 'https://github.com';

/** Largest response body we will buffer from the provider. */
const MAX_BODY_BYTES = 128 * 1024;

/** Default per-request timeout. Overridable for tests. */
const DEFAULT_TIMEOUT_MS = 8000;

export const PROVIDER_REPORTED_SUCCESS = 'PROVIDER_REPORTED_SUCCESS';
export const PROVIDER_REPORTED_FAILED = 'PROVIDER_REPORTED_FAILED';
export const PROVIDER_UNKNOWN = 'UNKNOWN';

/** Statuses that mean a run has finished (a conclusion is meaningful). */
const COMPLETED = new Set(['completed']);

/** Non-terminal statuses: the run has not produced a conclusion yet. */
const IN_PROGRESS = new Set(['queued', 'in_progress', 'waiting', 'pending']);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate a GitHub owner (user/org) name.
 * Rules: 1-39 chars; [A-Za-z0-9-]; no leading/trailing hyphen; no consecutive
 * hyphens. Rejects path traversal and injection characters.
 * @param {unknown} s
 * @returns {boolean}
 */
export function isValidOwner(s) {
  if (typeof s !== 'string') return false;
  if (s.length < 1 || s.length > 39) return false;
  if (!/^[A-Za-z0-9-]+$/.test(s)) return false;
  if (s.startsWith('-') || s.endsWith('-')) return false;
  if (s.includes('--')) return false;
  return true;
}

/**
 * Validate a GitHub repository name.
 * Rules: 1-100 chars; [A-Za-z0-9._-]; no leading/trailing dot; no consecutive
 * dots. Rejects "../" traversal.
 * @param {unknown} s
 * @returns {boolean}
 */
export function isValidRepo(s) {
  if (typeof s !== 'string') return false;
  if (s.length < 1 || s.length > 100) return false;
  if (!/^[A-Za-z0-9._-]+$/.test(s)) return false;
  if (s.startsWith('.') || s.endsWith('.')) return false;
  if (s.includes('..')) return false;
  return true;
}

/**
 * Validate a full 40-character hexadecimal Git object SHA (case-insensitive).
 * @param {unknown} s
 * @returns {boolean}
 */
export function isValidSha(s) {
  if (typeof s !== 'string') return false;
  return /^[0-9a-f]{40}$/i.test(s) && s.length === 40;
}

/**
 * Normalize a workflow identity to a comparable string of digits, or null when
 * it is not a positive integer or numeric string. This pins the EXACT workflow
 * whose CI status counts, so an arbitrary green workflow cannot prove the
 * selected CI. Comparison is string-based to stay exact for large ids.
 * @param {unknown} v
 * @returns {string | null}
 */
export function workflowIdStr(v) {
  if (typeof v === 'number' && Number.isSafeInteger(v) && v > 0) return String(v);
  if (typeof v === 'string' && /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v))) return v;
  return null;
}

/** True when v is a valid workflow identity (positive integer / numeric string). */
export function isValidWorkflowId(v) {
  return workflowIdStr(v) !== null;
}

/**
 * GitHub: run_number increases for a new run, run_attempt increases when
 * rerunning the same run. updated_at must not determine which run is latest.
 */
function positiveSafeInt(v) {
  if (typeof v === 'number' && Number.isSafeInteger(v) && v > 0) return v;
  if (typeof v === 'string' && /^[1-9]\d*$/.test(v)) {
    const n = Number(v);
    if (Number.isSafeInteger(n) && n > 0) return n;
  }
  return null;
}

/** Choose the newest run and attempt; fail closed on incomplete metadata. */
function latestRun(runs) {
  let best = null;
  let bestNumber = -1;
  let bestAttempt = -1;
  const seen = new Map();
  for (const run of runs) {
    const number = positiveSafeInt(run?.run_number);
    const attempt = positiveSafeInt(run?.run_attempt);
    const id = positiveSafeInt(run?.id);
    if (number === null || attempt === null || id === null) return null;
    const known = seen.get(number);
    if (known !== undefined && known !== id) return null;
    seen.set(number, id);
    if (number > bestNumber || (number === bestNumber && attempt > bestAttempt)) {
      best = run;
      bestNumber = number;
      bestAttempt = attempt;
    } else if (number === bestNumber && attempt === bestAttempt) {
      return null; // duplicated latest metadata is ambiguous
    }
  }
  return best;
}

/**
 * Validate that a workflow run's html_url belongs to the exact requested
 * owner/repo and points at a numeric run id that matches the run's id field.
 * Returns { url, id } (id as string) when valid, else null.
 * @param {object} run
 * @param {string} owner
 * @param {string} repo
 * @returns {{url: string, id: string} | null}
 */
function validateRunUrl(run, owner, repo) {
  const htmlUrl = run && typeof run.html_url === 'string' ? run.html_url : null;
  if (!htmlUrl) return null;
  const re = new RegExp(
    '^' + escapeRe(RUN_HOST) + '/' + escapeRe(owner) + '/' + escapeRe(repo) +
      '/actions/runs/(\\d+)$',
    'i',
  );
  const m = re.exec(htmlUrl);
  if (!m) return null;
  const urlId = m[1];

  let idStr = null;
  const id = run && run.id;
  if (typeof id === 'number' && Number.isSafeInteger(id) && id > 0) {
    idStr = String(id);
  } else if (typeof id === 'string' && /^\d+$/.test(id) && id.length > 0) {
    idStr = id;
  }
  if (!idStr || idStr !== urlId) return null;
  return { url: htmlUrl, id: idStr };
}

/**
 * Read and JSON-parse an HTTP response body with a hard byte cap. Uses the
 * readable stream when available so a pathological provider response cannot
 * exhaust memory; falls back to response.text() for minimal mocks.
 * @param {Response} response
 * @param {number} maxBytes
 * @returns {Promise<{json: any, oversized: boolean, error?: string}>}
 */
async function readBoundedJson(response, maxBytes) {
  let reader = null;
  try {
    if (response && response.body && typeof response.body.getReader === 'function') {
      reader = response.body.getReader();
    }
  } catch {
    reader = null;
  }

  if (reader) {
    const chunks = [];
    let total = 0;
    let oversized = false;
    let readError = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let bytes;
        if (value instanceof Uint8Array) {
          bytes = value;
        } else if (typeof value === 'string') {
          bytes = new TextEncoder().encode(value);
        } else if (value && typeof value.length === 'number') {
          bytes = new Uint8Array(value);
        } else {
          continue;
        }
        total += bytes.length;
        if (total > maxBytes) {
          oversized = true;
          break;
        }
        chunks.push(bytes);
      }
    } catch {
      readError = true;
    }
    try {
      if (reader && typeof reader.cancel === 'function') await reader.cancel();
    } catch {
      /* ignore cancel errors */
    }
    if (oversized) return { json: null, oversized: true };
    if (readError) return { json: null, oversized: false, error: 'stream read failed' };
    const merged = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      merged.set(c, off);
      off += c.length;
    }
    const text = new TextDecoder('utf-8').decode(merged);
    try {
      return { json: JSON.parse(text), oversized: false };
    } catch {
      return { json: null, oversized: false, error: 'malformed JSON' };
    }
  }

  // A non-streaming response has no enforceable byte cap; fail closed.
  return { json: null, oversized: false, error: 'no bounded readable body' };
}

function discardBody(response) {
  try {
    const body = response && response.body;
    if (body && typeof body.cancel === 'function') {
      const result = body.cancel();
      // A locked stream rejects cancellation asynchronously; never leak it.
      if (result && typeof result.catch === 'function') void result.catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

function baseResult({ owner, repo, sha, enabled }) {
  return {
    verdict: PROVIDER_UNKNOWN,
    reason: '',
    provider: 'github-actions',
    enabled: enabled === true,
    owner: typeof owner === 'string' ? owner : null,
    repo: typeof repo === 'string' ? repo : null,
    sha: typeof sha === 'string' && isValidSha(sha) ? sha.toLowerCase() : (typeof sha === 'string' ? sha : null),
    workflowId: null,
    sourceUrl: null,
    runId: null,
    conclusion: null,
    providerStatus: null,
    updatedAt: null,
    ageMs: null,
    fetched: false,
    // Trust boundary: provider-reported status is never attestation/correctness.
    independentlyAttested: false,
    cryptographicAttestation: false,
    correctness: false,
    attestation: 'none',
    disclaimer:
      'Provider-reported CI status is not cryptographic attestation and not proof of code correctness.',
  };
}

function unknown(base, reason, extra) {
  return { ...base, verdict: PROVIDER_UNKNOWN, reason, ...(extra || {}) };
}

/**
 * Optionally fetch provider-reported GitHub Actions evidence for a single
 * public repository commit.
 *
 * @param {object} input
 * @param {string} input.owner  - strict GitHub owner (user/org) name
 * @param {string} input.repo   - strict GitHub repository name
 * @param {string} input.sha    - full 40-char hex commit SHA
 * @param {string|number} input.workflowId - numeric GitHub workflow id; REQUIRED
 *   when enabled, to pin the exact CI workflow (no cross-workflow cherry-pick)
 * @param {function} [input.fetchImpl=globalThis.fetch] - injectable fetch for tests
 * @param {boolean} [input.enabled=false] - MUST be true to use the network;
 *   defaults to false so the local/offline behavior is preserved
 * @param {number} [input.now=Date.now()] - epoch ms for deterministic age tests
 * @param {number} [input.timeoutMs=8000] - per-request timeout in ms
 * @returns {Promise<object>} structured, validated provider-evidence result
 */
export async function fetchGithubActionsEvidence({
  owner,
  repo,
  sha,
  workflowId,
  fetchImpl = globalThis.fetch,
  enabled = false,
  now = Date.now(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const base = baseResult({ owner, repo, sha, enabled });

  // 1. Validate inputs BEFORE any network consideration. Invalid inputs never
  //    reach the network, so they cannot be used to probe arbitrary endpoints.
  if (!isValidOwner(owner)) return unknown(base, 'invalid owner name', { fetched: false });
  if (!isValidRepo(repo)) return unknown(base, 'invalid repository name', { fetched: false });
  if (!isValidSha(sha)) return unknown(base, 'invalid commit SHA (must be 40 hex chars)', { fetched: false });

  // 2. Offline by default. No network call is made unless explicitly enabled.
  if (enabled !== true) {
    return unknown(base, 'network access is disabled by default', { fetched: false });
  }
  if (typeof fetchImpl !== 'function') {
    return unknown(base, 'fetch implementation unavailable', { fetched: false });
  }

  // Workflow identity is REQUIRED whenever the network is enabled. It pins the
  // specific CI workflow whose status counts, so an arbitrary green workflow
  // cannot prove the selected CI. Missing/invalid identity fails closed here,
  // before any network call.
  const wfId = workflowIdStr(workflowId);
  if (wfId === null) {
    return unknown(
      base,
      workflowId === undefined || workflowId === null
        ? 'workflow identity is required when provider status is enabled'
        : 'invalid workflow identity',
      { fetched: false },
    );
  }
  base.workflowId = wfId;

  // 3. Construct the ONLY URL we will ever request, from validated inputs.
  const apiSha = sha.toLowerCase();
  const url =
    API_HOST + '/repos/' + owner + '/' + repo + '/actions/workflows/' + wfId + '/runs?head_sha=' + apiSha + '&per_page=100&page=1';

  // 4. Fetch with a timeout and abort. No credentials. No redirect following.
  const requestTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? Math.min(timeoutMs, 10_000) : DEFAULT_TIMEOUT_MS;
  const requestStartedAt = Date.now();
  const controller = new AbortController();
  let timer;
  let response;
  try {
    const fetchPromise = Promise.resolve().then(() =>
      fetchImpl(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'error',
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'specter-audit-provider-evidence',
        },
      }),
    );
    const raced = await Promise.race([
      fetchPromise.then(
        (r) => ({ kind: 'response', response: r }),
        () => ({ kind: 'network-error' }),
      ),
      new Promise((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve({ kind: 'timeout' });
        }, requestTimeoutMs);
      }),
    ]);
    clearTimeout(timer);
    if (raced.kind === 'timeout') {
      return unknown(base, 'request timed out', { fetched: true });
    }
    if (raced.kind === 'network-error') {
      return unknown(base, 'network request failed', { fetched: true });
    }
    response = raced.response;
  } catch {
    clearTimeout(timer);
    return unknown(base, 'network request failed', { fetched: true });
  }

  // 5. HTTP status fail-closed (read no body for error statuses).
  if (!response || typeof response.status !== 'number') {
    discardBody(response);
    return unknown(base, 'malformed provider response', { fetched: true });
  }
  const status = response.status;
  if (status === 403) {
    discardBody(response);
    return unknown(base, 'forbidden (access denied or rate limit)', { fetched: true });
  }
  if (status === 429) {
    discardBody(response);
    return unknown(base, 'rate limited', { fetched: true });
  }
  if (status >= 500) {
    discardBody(response);
    return unknown(base, 'provider error (HTTP ' + status + ')', { fetched: true });
  }
  if (status !== 200) {
    discardBody(response);
    return unknown(base, 'unexpected HTTP status ' + status, { fetched: true });
  }

  // 6. Content-type must be JSON before we read any bytes.
  const ct =
    response.headers && typeof response.headers.get === 'function'
      ? response.headers.get('content-type')
      : null;
  if (!ct || !/^application\/json\b/i.test(ct)) {
    discardBody(response);
    return unknown(base, 'unexpected content type', { fetched: true });
  }

  // 7. Bound the body phase by the REMAINING request budget, not just the
  //    header timeout. Response bodies can stall indefinitely after HTTP 200.
  const remainingMs = Math.max(0, requestTimeoutMs - (Date.now() - requestStartedAt));
  let bodyTimer;
  let bodyRace;
  try {
    bodyRace = await Promise.race([
      readBoundedJson(response, MAX_BODY_BYTES).then(
        (result) => ({ kind: 'body', result }),
        () => ({ kind: 'body-error' }),
      ),
      new Promise((resolve) => {
        bodyTimer = setTimeout(() => {
          controller.abort();
          resolve({ kind: 'body-timeout' });
        }, remainingMs);
      }),
    ]);
  } finally {
    clearTimeout(bodyTimer);
  }
  if (bodyRace.kind === 'body-timeout') {
    discardBody(response);
    return unknown(base, 'provider response body timed out', { fetched: true });
  }
  if (bodyRace.kind !== 'body') {
    return unknown(base, 'provider response body read failed', { fetched: true });
  }
  const { json, oversized, error } = bodyRace.result;
  if (oversized) return unknown(base, 'provider response exceeded size bound', { fetched: true });
  if (!json || error === 'malformed JSON') return unknown(base, 'malformed provider JSON', { fetched: true });
  if (error) return unknown(base, 'malformed provider response', { fetched: true });

  // 8. Shape validation.
  if (typeof json !== 'object' || Array.isArray(json) || !Array.isArray(json.workflow_runs)) {
    return unknown(base, 'malformed provider response (workflow_runs missing)', { fetched: true });
  }
  const runs = json.workflow_runs;
  // Without every matching entry, an older green run could be selected.
  // Deliberately fail closed rather than fetching arbitrary pagination URLs.
  if (!Number.isSafeInteger(json.total_count) || json.total_count < 0 ||
      runs.length > 100 || json.total_count !== runs.length ||
      /rel=["']?next\b/i.test(response.headers?.get?.('link') ?? '')) {
    return unknown(base, 'incomplete or malformed provider pagination', { fetched: true });
  }
  if (runs.length === 0) return unknown(base, 'no runs found for this commit', { fetched: true });

  // 9. Restrict to runs for the EXACT commit SHA AND the requested workflow.
  //    Workflow identity is mandatory so an arbitrary green workflow cannot
  //    prove the selected CI; only the requested workflow's runs are eligible.
  const matching = [];
  for (const run of runs) {
    if (!run || typeof run !== 'object') continue;
    const runSha = typeof run.head_sha === 'string' ? run.head_sha.toLowerCase() : null;
    if (runSha !== apiSha) continue; // exact SHA match required
    if (workflowIdStr(run.workflow_id) !== wfId) continue; // exact workflow match
    matching.push(run);
  }
  if (matching.length === 0) {
    return unknown(base, 'no run found for the exact commit SHA and workflow', { fetched: true });
  }

  // 10. Newest run_number then run_attempt determines status, never updated_at.
  const chosen = latestRun(matching);
  if (!chosen) {
    return unknown(base, 'ambiguous or missing workflow run_number/run_attempt metadata', { fetched: true });
  }
  const urlInfo = validateRunUrl(chosen, owner, repo);
  if (!urlInfo) {
    return unknown(base, 'invalid provider run URL', { fetched: true });
  }

  const chosenStatus = typeof chosen.status === 'string' ? chosen.status : null;
  const conclusion = chosen.conclusion == null ? null : String(chosen.conclusion);
  const updatedAt = typeof chosen.updated_at === 'string' ? chosen.updated_at : null;
  const updatedMs = updatedAt ? Date.parse(updatedAt) : NaN;
  const ageMs = Number.isFinite(now) && Number.isFinite(updatedMs) ? now - updatedMs : null;
  const ordering = { runNumber: chosen.run_number, runAttempt: chosen.run_attempt };

  if (COMPLETED.has(chosenStatus) && conclusion === 'success') {
    return {
      ...base,
      verdict: PROVIDER_REPORTED_SUCCESS,
      reason:
        'GitHub Actions reports the latest run of workflow ' + wfId +
        ' as completed and successful for the exact commit SHA; this is provider-reported status, not cryptographic attestation or proof of correctness',
      fetched: true,
      sourceUrl: urlInfo.url,
      runId: urlInfo.id,
      ...ordering,
      conclusion: 'success',
      providerStatus: 'completed',
      updatedAt,
      ageMs,
      attestation: 'provider-reported',
    };
  }

  if (COMPLETED.has(chosenStatus) && conclusion && conclusion !== 'success') {
    return {
      ...base,
      verdict: PROVIDER_REPORTED_FAILED,
      reason:
        'GitHub Actions reports the latest run of workflow ' + wfId +
        ' as completed with conclusion "' + conclusion +
        '" for the exact commit SHA; provider-reported failure, not attestation',
      fetched: true,
      sourceUrl: urlInfo.url,
      runId: urlInfo.id,
      ...ordering,
      conclusion,
      providerStatus: chosenStatus,
      updatedAt,
      ageMs,
      attestation: 'provider-reported',
    };
  }

  if (IN_PROGRESS.has(chosenStatus)) {
    return unknown(base, 'latest run for this commit and workflow is not completed', { fetched: true });
  }

  return unknown(base, 'latest run has an unrecognized status', { fetched: true });
}
