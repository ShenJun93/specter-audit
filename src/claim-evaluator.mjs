// src/claim-evaluator.mjs
//
// Specter Audit — Milestone 1: claim-to-evidence evaluator.
//
// `evaluateClaim({ claim, inspection, receipt })` compares a narrow,
// human-entered claim (e.g. "fixed auth regression") against structured Git
// evidence produced by `inspectRepository()` plus an optional structured
// run receipt. It labels the observation SUPPORTED, PARTIAL, or UNVERIFIED.
//
// Critical honesty rules enforced here:
//   * SUPPORTED means *alignment* between the claim and Git-recorded changes,
//     NOT that the code is correct. We never measure semantic correctness.
//   * A user-supplied receipt cannot independently verify that tests ran. A receipt
//     is trusted only when it is a structured object with a numeric exitCode
//     of 0, a HEAD hash that matches the current HEAD exactly, and a valid
//     timestamp — all supplied by the caller.
//   * Text-only / stale / fake / missing receipts are never trusted.
//   * File evidence (actual Git-recorded changes) is required for change
//     claims; keyword matching alone never supports a claim.

const STATUS_SUPPORTED = 'SUPPORTED';
const STATUS_PARTIAL = 'PARTIAL';
const STATUS_UNVERIFIED = 'UNVERIFIED';

// Generic function words only. Domain terms (auth, login, api, ...) are kept
// so they can be matched against changed file paths.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by',
  'at', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its',
  'this', 'that', 'these', 'those', 'my', 'our', 'your', 'their', 'them',
  'they', 'as', 'if', 'then', 'so', 'but', 'not', 'no', 'do', 'did', 'has',
  'had', 'have', 'having', 'into', 'onto', 'over', 'under', 'than', 'too',
  'very', 'just', 'also', 'only', 'all', 'any', 'some', 'more', 'most', 'such',
  'about', 'after', 'before', 'between', 'through', 'during', 'via', 'per',
  'now', 'here', 'there', 'when', 'where', 'which', 'who', 'whom', 'whose',
]);

// Words implying the claim asserts a *change* to the repository. These are
// action verbs; they are also excluded from file-path token matching because
// they describe an action, not a code area (so "fix" should not match a
// hypothetical "fix.js").
const CHANGE_KEYWORDS = [
  'fix', 'fixed', 'fixing', 'fixes',
  'add', 'added', 'adding', 'adds',
  'remove', 'removed', 'removing', 'removes',
  'update', 'updated', 'updating', 'updates',
  'refactor', 'refactored', 'refactoring',
  'implement', 'implemented', 'implementing', 'implements',
  'change', 'changed', 'changing', 'changes',
  'modify', 'modified', 'modifying',
  'delete', 'deleted', 'deleting',
  'create', 'created', 'creating',
  'move', 'moved', 'moving',
  'rename', 'renamed', 'renaming',
  'write', 'wrote', 'writing',
  'rework', 'reworked', 'overhaul', 'migrate', 'migrated',
];

// Action verbs excluded from path-matching tokens.
const ACTION_STOPWORDS = new Set(CHANGE_KEYWORDS);

// Words implying the claim asserts a *test / run* outcome.
const TEST_KEYWORDS = [
  'test', 'tests', 'testing', 'tested',
  'pass', 'passes', 'passed', 'passing',
  'run', 'runs', 'ran', 'running',
  'lint', 'lints', 'linted', 'linting',
  'build', 'builds', 'built', 'building',
  'spec', 'specs', 'specify',
  'coverage', 'covered',
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(text, word) {
  return new RegExp(`\\b${escapeRegex(word)}\\b`).test(text);
}

/**
 * Extract significant lowercase tokens (length >= 3, not a stopword) from the
 * claim text. Used only to test alignment against changed file paths; never
 * used as sole support.
 * @param {string} text
 * @returns {string[]}
 */
export function extractTokens(text) {
  if (typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  const raw = lower.match(/[a-z][a-z0-9]+/g) || [];
  const out = [];
  const seen = new Set();
  for (const t of raw) {
    if (t.length < 3) continue;
    if (STOPWORDS.has(t)) continue;
    if (ACTION_STOPWORDS.has(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Match claim tokens against a set of changed file paths by case-insensitive
 * substring containment. Returns the matched pairs.
 * @param {string[]} tokens
 * @param {string[]} files
 * @returns {{token: string, path: string}[]}
 */
export function matchFiles(tokens, files) {
  const matched = [];
  const seen = new Set();
  for (const token of tokens) {
    for (const f of files) {
      const p = String(f).toLowerCase();
      if (p.includes(token)) {
        const key = `${token}\0${f}`;
        if (seen.has(key)) continue;
        seen.add(key);
        matched.push({ token, path: f });
      }
    }
  }
  return matched;
}

/**
 * Collect the set of changed file paths (current + rename source) from an
 * inspection result.
 * @param {object} inspection
 * @returns {string[]}
 */
export function changedFilePaths(inspection) {
  const set = new Set();
  if (!inspection || inspection.ok === false) return [];
  for (const s of inspection.staged || []) if (s.path) set.add(s.path);
  for (const u of inspection.unstaged || []) if (u.path) set.add(u.path);
  for (const u of inspection.untracked || []) if (u) set.add(u);
  for (const r of inspection.renamed || []) {
    if (r.path) set.add(r.path);
    if (r.oldPath) set.add(r.oldPath);
  }
  return [...set];
}

/**
 * Validate a run receipt against strict trust rules.
 *
 * Internally consistent (NOT independently verified) when the receipt has:
 *   - numeric exitCode === 0
 *   - string HEAD hash that exactly equals the inspection's HEAD
 *   - a parseable timestamp
 *
 * @param {unknown} receipt
 * @param {string|null} inspectionHead
 * @returns {{verdict: string, reason: string}}
 */
export function evaluateReceipt(receipt, inspectionHead) {
  if (receipt === null || receipt === undefined) {
    return { verdict: 'missing', reason: 'no receipt provided' };
  }
  if (typeof receipt === 'string') {
    return {
      verdict: 'text-only',
      reason: 'receipt is a text string, not a structured record; text-only logs are never trusted',
    };
  }
  if (typeof receipt !== 'object' || Array.isArray(receipt)) {
    return {
      verdict: 'malformed',
      reason: 'receipt is not a structured object',
    };
  }

  const { exitCode, head, timestamp } = receipt;

  if (typeof exitCode !== 'number' || !Number.isFinite(exitCode)) {
    return {
      verdict: 'malformed',
      reason: 'exitCode must be a finite number (string values are not accepted)',
    };
  }

  if (timestamp === null || timestamp === undefined) {
    return { verdict: 'malformed', reason: 'timestamp is missing' };
  }
  const ts = new Date(timestamp);
  if (Number.isNaN(ts.getTime())) {
    return { verdict: 'malformed', reason: 'timestamp is not a valid date' };
  }

  if (typeof head !== 'string' || head.length === 0) {
    return { verdict: 'malformed', reason: 'HEAD commit hash is missing' };
  }

  if (inspectionHead === null) {
    return {
      verdict: 'stale',
      reason: 'repository HEAD is unborn; a receipt cannot be tied to a commit',
    };
  }
  if (head !== inspectionHead) {
    return {
      verdict: 'stale',
      reason: `receipt HEAD ${head.slice(0, 8)} does not match current HEAD ${inspectionHead.slice(0, 8)}`,
    };
  }

  if (exitCode !== 0) {
    return { verdict: 'failed', reason: `exitCode=${exitCode} (non-zero)` };
  }

  return {
    verdict: 'metadata-consistent',
    reason: 'Self-reported exitCode=0, HEAD and timestamp are internally consistent; no test execution was observed or independently attested',
  };
}

/**
 * Decide a qualitative confidence label from a 0..1 score.
 * @param {number} score
 * @returns {string}
 */
function confidenceLabel(score) {
  if (score >= 0.75) return 'high';
  if (score >= 0.45) return 'medium';
  if (score >= 0.2) return 'low';
  return 'none';
}

/**
 * Evaluate a claim against Git inspection evidence and an optional run receipt.
 *
 * @param {{claim: string, inspection: object, receipt?: unknown}} input
 * @returns {{status: string, confidence: number, confidenceLabel: string,
 *            evidence: object[], gaps: string[], details: object}}
 */
export function evaluateClaim({ claim, inspection, receipt } = {}) {
  // Guard: claim must be a non-empty string.
  if (typeof claim !== 'string' || claim.trim() === '') {
    return {
      status: STATUS_UNVERIFIED,
      confidence: 0,
      confidenceLabel: 'none',
      evidence: [],
      gaps: ['claim is empty or not a string'],
      details: { fileVerdict: 'none', receiptVerdict: 'missing', claimsTest: false, isPureTestClaim: false },
    };
  }

  // Guard: a failed inspection cannot support anything.
  if (!inspection || inspection.ok === false) {
    return {
      status: STATUS_UNVERIFIED,
      confidence: 0,
      confidenceLabel: 'none',
      evidence: [],
      gaps: [
        'repository inspection failed or was not provided',
        inspection && inspection.error ? inspection.error : 'no Git evidence available',
      ],
      details: { fileVerdict: 'none', receiptVerdict: 'missing', claimsTest: false, isPureTestClaim: false },
    };
  }

  const claimLower = claim.toLowerCase();
  const hasChangeSignal = CHANGE_KEYWORDS.some((k) => hasWord(claimLower, k));
  const hasTestSignal = TEST_KEYWORDS.some((k) => hasWord(claimLower, k));
  const claimsTest = hasTestSignal || (receipt !== undefined && receipt !== null);
  const isPureTestClaim = hasTestSignal && !hasChangeSignal;

  // File evidence.
  const files = changedFilePaths(inspection);
  const hasFileEvidence = files.length > 0;
  const tokens = extractTokens(claim);
  const matched = matchFiles(tokens, files);
  const claimAligns = matched.length > 0;
  const fileVerdict = !hasFileEvidence
    ? 'none'
    : claimAligns
      ? 'evidence'
      : 'present-unmatched';

  // Receipt evidence.
  const receiptEval = evaluateReceipt(receipt, inspection.head);
  const receiptVerdict = receiptEval.verdict;

  const evidence = [];
  const gaps = [];

  // Always state the alignment-vs-correctness boundary.
  gaps.push('SUPPORTED means alignment with Git-recorded changes, not that the code is correct');

  if (hasFileEvidence) {
    evidence.push({
      kind: 'changed-files',
      files,
      note: `${files.length} changed file(s) recorded by Git in the working tree / index`,
    });
    if (claimAligns) {
      evidence.push({
        kind: 'claim-alignment',
        matched,
        note: 'claim terms appear in changed file paths',
      });
    } else if (tokens.length > 0) {
      gaps.push(`changed files do not clearly correspond to the claim (tokens: ${tokens.join(', ')})`);
    } else {
      gaps.push('claim produced no significant tokens to match against changed files');
    }
  } else {
    gaps.push('no working-tree or index changes were recorded by Git');
    gaps.push('if the change was already committed, this inspector does not analyze commit diffs (Milestone 1 scope)');
  }

  if (claimsTest) {
    if (receiptVerdict === 'metadata-consistent') {
      evidence.push({ kind: 'receipt', verdict: 'metadata-consistent', note: receiptEval.reason });
      gaps.push('user-supplied receipt is not independent proof that a test or build ran');
    } else if (receiptVerdict === 'text-only') {
      gaps.push('a test/run receipt was supplied but is text-only and is not trusted');
    } else if (receiptVerdict === 'stale') {
      gaps.push(`receipt is stale: ${receiptEval.reason}`);
    } else if (receiptVerdict === 'failed') {
      gaps.push(`receipt indicates failure: ${receiptEval.reason}`);
    } else if (receiptVerdict === 'malformed') {
      gaps.push(`receipt is malformed: ${receiptEval.reason}`);
    } else {
      gaps.push('a test/run claim was made but no receipt was provided');
    }
  }

  // Decide the overall status.
  let status;
  let confidence;

  if (isPureTestClaim) {
    // A user-supplied receipt can never independently prove a test executed.
    status = STATUS_UNVERIFIED;
    confidence = receiptVerdict === 'metadata-consistent' ? 0.2 : 0.1;
    gaps.push('no independently observed test execution; self-reported metadata cannot support a standalone test-pass claim');
  } else {
    // Change claim (possibly mixed with a test claim): file evidence is primary.
    if (!hasFileEvidence) {
      status = STATUS_UNVERIFIED;
      confidence = 0.1;
    } else if (hasTestSignal) {
      // Git paths may align with the change, but the test assertion is unverified.
      status = claimAligns ? STATUS_PARTIAL : STATUS_UNVERIFIED;
      confidence = claimAligns ? 0.35 : 0.1;
      gaps.push('mixed claim includes a test/build result that this read-only inspector did not execute');
    } else {
      status = claimAligns ? STATUS_SUPPORTED : STATUS_PARTIAL;
      confidence = claimAligns ? 0.6 : 0.35;
    }
  }

  // Cap confidence and re-derive label.
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    status,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    evidence,
    gaps,
    details: {
      hasFileEvidence,
      claimAligns,
      fileVerdict,
      receiptVerdict,
      receiptProvenance: 'user-supplied',
      independentlyAttested: false,
      claimsTest,
      isPureTestClaim,
      hasChangeSignal,
      hasTestSignal,
      changedFileCount: files.length,
      matchedFiles: matched,
      tokens,
    },
  };
}

export { STATUS_SUPPORTED, STATUS_PARTIAL, STATUS_UNVERIFIED };
