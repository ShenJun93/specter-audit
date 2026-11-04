/**
 * Kiro Session Staleness Auditor
 * 
 * Pure ESM module for auditing local Kiro CLI session evidence.
 * No external dependencies, no network, no filesystem access.
 * 
 * @file kiro-session-staleness.mjs
 * @module src/kiro-session-staleness
 */

/**
 * Validates a single ISO UTC timestamp string
 * @param {string} ts - Timestamp string to validate
 * @returns {number|null} Unix timestamp in ms or null if invalid
 */
function parseTimestamp(ts) {
  if (typeof ts !== 'string' || ts.trim() === '') return null;
  // Reject timestamps without explicit timezone (Z or numeric offset)
  // ISO8601 without timezone is ambiguous and must be rejected
  if (!ts.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(ts)) return null;
  const date = new Date(ts);
  if (isNaN(date.getTime())) return null;
  return date.getTime();
}

/**
 * Normalizes a timestamp string to epoch milliseconds for comparison
 * @param {string} ts - Timestamp string
 * @returns {number|null} Epoch milliseconds or null if invalid
 */
function normalizeTimestamp(ts) {
  const ms = parseTimestamp(ts);
  if (ms === null) return null;
  return ms;
}

/**
 * Validates file path to prevent path traversal
 * @param {string} filePath - File path to validate
 * @returns {boolean} true if valid
 */
function isValidFilePath(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') return false;
  
  // Check for path traversal patterns (forward or backward slash)
  if (filePath.includes('..')) return false;
  
  // Reject UNC paths like \\server\share or //server/share
  if (filePath.startsWith('\\\\') || filePath.startsWith('//')) return false;
  
  // Reject Windows absolute paths like C:\ or D:\
  if (filePath.match(/^[a-zA-Z]:[/\\]/)) return false;
  
  // Reject Unix absolute paths like /etc/x
  if (filePath.startsWith('/')) return false;
  
  // Allow relative paths like 'src/name.mjs'
  return true;
}

/**
 * Audits a local Kiro CLI session for staleness based on test and edit evidence.
 * 
 * @param {Object} input - Session audit input
 * @param {string} input.sourceKind - Must be 'RECORDED_LOCAL_KIRO_CLI_SESSION'
 * @param {string} input.claimAt - ISO UTC timestamp of the claim
 * @param {string} input.sessionEndedAt - ISO UTC timestamp when session ended
 * @param {Array} input.tests - Array of test objects with at, pass, fail, exitCode
 * @param {Array} input.edits - Array of edit objects with at, file, successful
 * @returns {Object} Audit result with status, reason, timeline, and flags
 */
export function auditLocalSession(input) {
  // Validate sourceKind
  if (input.sourceKind !== 'RECORDED_LOCAL_KIRO_CLI_SESSION') {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'Invalid sourceKind - must be RECORDED_LOCAL_KIRO_CLI_SESSION',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  // Validate claimAt
  const claimAtMs = parseTimestamp(input.claimAt);
  if (claimAtMs === null) {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'Invalid claimAt timestamp',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  // Validate sessionEndedAt
  const sessionEndedAtMs = parseTimestamp(input.sessionEndedAt);
  if (sessionEndedAtMs === null) {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'Invalid sessionEndedAt timestamp',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  // Validate timestamps order: claimAt <= sessionEndedAt
  if (claimAtMs > sessionEndedAtMs) {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'claimAt must be <= sessionEndedAt',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  // Validate tests array
  if (!Array.isArray(input.tests)) {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'tests must be an array',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  if (input.tests.length > 60) {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'Maximum 60 tests allowed',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  // Validate edits array
  if (!Array.isArray(input.edits)) {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'edits must be an array',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  if (input.edits.length > 60) {
    return {
      status: 'INSUFFICIENT_SESSION_EVIDENCE',
      reason: 'Maximum 60 edits allowed',
      timeline: [],
      independentAttestation: false,
      semanticCorrectnessVerified: false
    };
  }

  const timeline = [];
  let latestPassingTestMs = null;
  let latestPassingTest = null;
  let latestTestMs = null;
  let latestTestPassed = false;
  let latestSuccessfulEditMs = null;
  let latestSuccessfulEdit = null;
  const seenTestTimestampsMs = new Set();
  const seenEditTimestampsMs = new Set();

  // Process and validate tests
  for (const test of input.tests) {
    const testAtMs = parseTimestamp(test.at);
    if (testAtMs === null) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Invalid test.at timestamp: ${test.at}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    // Check for duplicates by normalized epoch ms
    if (seenTestTimestampsMs.has(testAtMs)) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Duplicate test.at timestamp (same instant): ${test.at}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }
    seenTestTimestampsMs.add(testAtMs);

    // Validate test values
    if (typeof test.pass !== 'number' || test.pass < 0 || !Number.isInteger(test.pass)) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Invalid test.pass value: ${test.pass}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    if (typeof test.fail !== 'number' || test.fail < 0 || !Number.isInteger(test.fail)) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Invalid test.fail value: ${test.fail}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    if (typeof test.exitCode !== 'number' || !Number.isInteger(test.exitCode)) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Invalid test.exitCode value: ${test.exitCode}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    // Validate timestamp <= session end
    if (testAtMs > sessionEndedAtMs) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Test timestamp ${test.at} is after sessionEndedAt`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    timeline.push({
      kind: 'test',
      at: test.at,
      pass: test.pass,
      fail: test.fail,
      exitCode: test.exitCode
    });

    // Only tests at or before claim time can support the claim
    if (testAtMs > claimAtMs) {
      continue;
    }

    // Track the latest test result at or before claim time
    if (latestTestMs === null || testAtMs > latestTestMs) {
      latestTestMs = testAtMs;
      latestTestPassed = (test.pass > 0 && test.fail === 0 && test.exitCode === 0);
    }
    
    // Track latest passing test (only if this test passed)
    if (test.pass > 0 && test.fail === 0 && test.exitCode === 0) {
      latestPassingTestMs = testAtMs;
      latestPassingTest = test;
    }
  }

  // Process and validate edits
  for (const edit of input.edits) {
    const editAtMs = parseTimestamp(edit.at);
    if (editAtMs === null) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Invalid edit.at timestamp: ${edit.at}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    // Check for duplicates by normalized epoch ms
    if (seenEditTimestampsMs.has(editAtMs)) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Duplicate edit.at timestamp (same instant): ${edit.at}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }
    seenEditTimestampsMs.add(editAtMs);

    // Validate file field
    if (!isValidFilePath(edit.file)) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Invalid edit.file path: ${edit.file}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    if (typeof edit.successful !== 'boolean') {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Invalid edit.successful value: ${edit.successful}`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    // Validate timestamp <= session end
    if (editAtMs > sessionEndedAtMs) {
      return {
        status: 'INSUFFICIENT_SESSION_EVIDENCE',
        reason: `Edit timestamp ${edit.at} is after sessionEndedAt`,
        timeline: [],
        independentAttestation: false,
        semanticCorrectnessVerified: false
      };
    }

    timeline.push({
      kind: 'edit',
      at: edit.at,
      file: edit.file,
      successful: edit.successful
    });

    // Track latest successful edit
    if (edit.successful && (latestSuccessfulEditMs === null || editAtMs > latestSuccessfulEditMs)) {
      latestSuccessfulEditMs = editAtMs;
      latestSuccessfulEdit = edit;
    }
  }

  // Sort timeline by timestamp
  timeline.sort((a, b) => {
    const timeA = new Date(a.at).getTime();
    const timeB = new Date(b.at).getTime();
    return timeA - timeB;
  });

  // Classification logic
  // A passing test is only valid evidence if it was the latest test at or before claim time
  const hasValidPassingTest = (latestTestPassed && latestPassingTestMs !== null);
  
  let status;
  let reason;

  if (!hasValidPassingTest && latestSuccessfulEditMs === null) {
    status = 'INSUFFICIENT_SESSION_EVIDENCE';
    reason = 'No passing tests or successful edits found';
  } else if (!hasValidPassingTest) {
    status = 'INSUFFICIENT_SESSION_EVIDENCE';
    reason = 'No passing tests found despite successful source edits';
  } else if (latestSuccessfulEditMs === null) {
    status = 'CURRENT_SELF_RECORDED_TEST';
    reason = 'Passing test exists but no source edits recorded';
  } else if (latestSuccessfulEditMs > latestPassingTestMs) {
    status = 'STALE_LOCAL_TEST_EVIDENCE';
    reason = 'Successful source edit after latest passing test with no later passing test';
  } else {
    status = 'CURRENT_SELF_RECORDED_TEST';
    reason = 'Latest passing test was after all successful source edits';
  }

  return {
    status,
    reason,
    timeline,
    independentAttestation: false,
    semanticCorrectnessVerified: false
  };
}