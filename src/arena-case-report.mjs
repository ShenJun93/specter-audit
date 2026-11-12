// M118 Arena case report: pure, deterministic classification of one reviewer-
// approved behavior challenge run on exact base and head commits.
// No network, shell, Git, filesystem, or Docker access: input is data only.
// Free-text input is never echoed; every output string is a fixed template or
// a strictly validated SHA, digest, integer, repository slug or timestamp.
// Authorship: generated in a real Kiro CLI 3.1.0 non-interactive session; not yet
// independently reviewed. Nothing here attests execution or correctness.
export const ARENA_CASE_SCHEMA = 'SPECTER_ARENA_CASE_V1';

const SHA1 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const IMAGE = /^sha256:[0-9a-f]{64}$/;
const REPO = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const RUN_STATUS = new Set(['completed', 'queued', 'requested', 'pending', 'waiting', 'in_progress']);
const RUN_CONCLUSION = new Set([
  'success', 'failure', 'cancelled', 'timed_out', 'action_required',
  'neutral', 'skipped', 'stale', 'startup_failure'
]);
const MAX_RUNS = 30;

// Trust labels are a closed vocabulary; none means independently attested.
const TRUST = Object.freeze({
  PROVIDER: 'PROVIDER_REPORTED_UNATTESTED',
  REVIEWER: 'REVIEWER_CONTROLLED_SELF_REPORTED',
  DERIVED: 'DERIVED_FROM_LISTED_INPUTS'
});

const ACTIONS = Object.freeze({
  NO_OBSERVATION: 'Record a public PR observation with exact base and head SHAs before challenging.',
  INVALID_OBSERVATION: 'Re-observe the PR; the observation is malformed or incomplete.',
  SAME_BASE_HEAD: 'Choose a PR whose base and head commits differ; identical commits give no comparison.',
  HEAD_MOVED: 'Head moved or was not rechecked; re-observe the PR and rerun the challenge on the new head.',
  RUN_SHA_MISMATCH: 'Discard provider runs that do not belong to the exact head SHA and re-observe.',
  NO_CHALLENGE: 'Have the reviewer approve a test file and its SHA-256, then run it on base and head.',
  INVALID_CHALLENGE: 'Re-run the approved challenge and supply complete, well-formed base and head results.',
  TEST_HASH_MISMATCH: 'Executed test hash differs from the approved hash; rerun with the approved file.',
  SOURCE_SHA_MISMATCH: 'Challenge ran on a commit other than the observed base/head; rerun on the exact SHAs.',
  RUN_INCOMPLETE: 'A challenge run timed out, errored or lacks a clean exit code; rerun it before classifying.',
  REGRESSION: 'Reviewer: inspect the head change for the chosen behavior; it passed on base and failed on head.',
  DEMONSTRATED_FIX: 'Reviewer: confirm the chosen behavior is the intended one; it failed on base and passed on head.',
  BOTH_PASS: 'The chosen test does not distinguish base from head; add a behavior test that targets the change.',
  BOTH_FAIL: 'The chosen test fails on both commits; check the test and environment before blaming the PR.'
});

const own = (o, k) => o !== null && typeof o === 'object' && !Array.isArray(o) &&
  Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;
const sha = (v) => (typeof v === 'string' && SHA1.test(v.toLowerCase()) ? v.toLowerCase() : null);
const hex256 = (v) => (typeof v === 'string' && SHA256.test(v.toLowerCase()) ? v.toLowerCase() : null);
const posInt = (v) => (Number.isSafeInteger(v) && v > 0 && v <= 2147483647 ? v : null);
const runId = (v) => (Number.isSafeInteger(v) && v > 0 ? v : null);
function time(v) {
  if (typeof v !== 'string' || !ISO.test(v)) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function readRuns(raw, headSha) {
  if (raw === undefined) return { runs: [] };
  if (!Array.isArray(raw) || raw.length > MAX_RUNS) return { error: 'INVALID_OBSERVATION' };
  const runs = [];
  const seen = new Set();
  for (const r of raw) {
    const id = runId(own(r, 'id'));
    const status = own(r, 'status');
    const conclusion = own(r, 'conclusion');
    const rs = sha(own(r, 'headSha'));
    if (id === null || seen.has(id) || !RUN_STATUS.has(status)) return { error: 'INVALID_OBSERVATION' };
    if (status === 'completed' ? !RUN_CONCLUSION.has(conclusion) : conclusion !== null) {
      return { error: 'INVALID_OBSERVATION' };
    }
    if (rs === null) return { error: 'INVALID_OBSERVATION' };
    if (rs !== headSha) return { error: 'RUN_SHA_MISMATCH' };
    seen.add(id);
    runs.push({ id, status, conclusion });
  }
  return { runs };
}

function readObservation(raw) {
  if (raw === null || raw === undefined) return { error: 'NO_OBSERVATION' };
  const repository = own(raw, 'repository');
  const prNumber = posInt(own(raw, 'prNumber'));
  const baseSha = sha(own(raw, 'baseSha'));
  const headSha = sha(own(raw, 'headSha'));
  const observedAt = time(own(raw, 'observedAt'));
  if (typeof repository !== 'string' || !REPO.test(repository) || prNumber === null ||
      baseSha === null || headSha === null || observedAt === null) {
    return { error: 'INVALID_OBSERVATION' };
  }
  const recheck = own(raw, 'recheckedHeadSha');
  if (sha(recheck) !== headSha) return { error: 'HEAD_MOVED' };
  if (baseSha === headSha) return { error: 'SAME_BASE_HEAD' };
  const r = readRuns(own(raw, 'runs'), headSha);
  if (r.error) return { error: r.error };
  return { value: { repository, prNumber, baseSha, headSha, observedAt, runs: r.runs } };
}

function readSide(raw) {
  const sourceSha = sha(own(raw, 'sourceSha'));
  const imageDigest = own(raw, 'imageDigest');
  const outputSha256 = hex256(own(raw, 'outputSha256'));
  const observedAt = time(own(raw, 'observedAt'));
  const status = own(raw, 'status');
  const exitCode = own(raw, 'exitCode');
  if (sourceSha === null || typeof imageDigest !== 'string' || !IMAGE.test(imageDigest) ||
      outputSha256 === null || observedAt === null) return null;
  if (status !== 'COMPLETED' && status !== 'TIMED_OUT' && status !== 'ERROR') return null;
  const exitOk = Number.isSafeInteger(exitCode) && (exitCode === 0 || exitCode === 1);
  if (status === 'COMPLETED' && !exitOk) return null;
  return { sourceSha, imageDigest, outputSha256, observedAt, status, exitCode: exitOk ? exitCode : null };
}

function readChallenge(raw, obs) {
  if (raw === null || raw === undefined) return { error: 'NO_CHALLENGE' };
  const approved = hex256(own(raw, 'approvedTestSha256'));
  const executed = hex256(own(raw, 'testSha256'));
  const base = readSide(own(raw, 'base'));
  const head = readSide(own(raw, 'head'));
  if (approved === null || executed === null || base === null || head === null) {
    return { error: 'INVALID_CHALLENGE' };
  }
  if (approved !== executed) return { error: 'TEST_HASH_MISMATCH' };
  if (base.sourceSha !== obs.baseSha || head.sourceSha !== obs.headSha) {
    return { error: 'SOURCE_SHA_MISMATCH' };
  }
  const clean = (s) => s.status === 'COMPLETED' && s.exitCode !== null;
  if (!clean(base) || !clean(head)) return { error: 'RUN_INCOMPLETE' };
  return { value: { testSha256: executed, base, head } };
}

function classify(base, head) {
  const bp = base.exitCode === 0;
  const hp = head.exitCode === 0;
  if (bp && !hp) return 'REGRESSION';
  if (!bp && hp) return 'DEMONSTRATED_FIX';
  return bp ? 'BOTH_PASS' : 'BOTH_FAIL';
}

function summarizeRuns(runs) {
  const c = { success: 0, failure: 0, inProgress: 0, other: 0 };
  for (const r of runs) {
    if (r.status !== 'completed') c.inProgress++;
    else if (r.conclusion === 'success') c.success++;
    else if (['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure'].includes(r.conclusion)) c.failure++;
    else c.other++;
  }
  return c;
}

const LIMITATIONS = Object.freeze([
  'A classification covers only the single reviewer-approved test on these two commits, never general correctness.',
  'Challenge results are reviewer-controlled self-reported data; this module cannot verify that they were executed.',
  'Provider-reported workflow runs do not establish that all required checks ran or passed.',
  'No release approval, independent attestation or Kiro-session link is established.'
]);

function envelope(classification, reason, obs, challenge, statements) {
  return {
    schema: ARENA_CASE_SCHEMA,
    classification,
    reason,
    subject: obs ? {
      repository: obs.repository, prNumber: obs.prNumber,
      baseSha: obs.baseSha, headSha: obs.headSha
    } : null,
    challenge: challenge ? {
      testSha256: challenge.testSha256,
      base: { exitCode: challenge.base.exitCode, outputSha256: challenge.base.outputSha256, imageDigest: challenge.base.imageDigest },
      head: { exitCode: challenge.head.exitCode, outputSha256: challenge.head.outputSha256, imageDigest: challenge.head.imageDigest }
    } : null,
    statements,
    nextAction: { code: reason, text: ACTIONS[reason] },
    attestation: {
      independentlyAttested: false,
      executionVerifiedBySpecter: false,
      semanticCorrectnessVerified: false,
      allRequiredChecksVerified: false,
      releaseApproved: false,
      localSessionLinkedToPr: false
    },
    limitations: [...LIMITATIONS]
  };
}

/**
 * @param {{observation?: object|null, challenge?: object|null}} input
 * @returns {object} SPECTER_ARENA_CASE_V1 report. Never throws.
 */
export function buildArenaCaseReport(input) {
  try {
    const obsResult = readObservation(own(input, 'observation'));
    if (obsResult.error) return envelope('UNKNOWN', obsResult.error, null, null, []);
    const obs = obsResult.value;
    const statements = [{
      id: 'PR_SHAS',
      text: 'Public PR observation recorded exact base and head SHAs.',
      source: 'PUBLIC_PR_OBSERVATION', trust: TRUST.PROVIDER, observedAt: obs.observedAt
    }];
    if (obs.runs.length > 0) {
      const c = summarizeRuns(obs.runs);
      statements.push({
        id: 'PROVIDER_RUNS',
        text: 'Provider reported ' + obs.runs.length + ' run(s) for the exact head SHA: ' +
          c.success + ' success, ' + c.failure + ' failure, ' + c.inProgress + ' in progress, ' +
          c.other + ' other. This is not a test attestation.',
        source: 'PUBLIC_PR_OBSERVATION', trust: TRUST.PROVIDER, observedAt: obs.observedAt
      });
    }
    const chResult = readChallenge(own(input, 'challenge'), obs);
    if (chResult.error) return envelope('UNKNOWN', chResult.error, obs, null, statements);
    const ch = chResult.value;
    for (const side of ['base', 'head']) {
      statements.push({
        id: 'CHALLENGE_' + side.toUpperCase(),
        text: 'Reviewer-controlled result reports exit code ' + ch[side].exitCode +
          ' on the ' + side + ' commit for the approved test hash.',
        source: 'REVIEWER_CHALLENGE_RESULT', trust: TRUST.REVIEWER, observedAt: ch[side].observedAt
      });
    }
    const classification = classify(ch.base, ch.head);
    statements.push({
      id: 'CLASSIFICATION',
      text: 'Classification ' + classification + ' compares the two reported exit codes for this one test only.',
      source: 'DERIVED', trust: TRUST.DERIVED, observedAt: obs.observedAt
    });
    return envelope(classification, classification, obs, ch, statements);
  } catch {
    return envelope('UNKNOWN', 'INVALID_OBSERVATION', null, null, []);
  }
}
