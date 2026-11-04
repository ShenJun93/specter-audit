/**
 * Tests for kiro-session-staleness module
 *
 * Node:test based tests for the auditLocalSession function.
 * No external dependencies.
 *
 * @file kiro-session-staleness.test.mjs
 * @module test/kiro-session-staleness.test
 */

import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { auditLocalSession } from '../src/kiro-session-staleness.mjs';

describe('auditLocalSession', () => {
  const baseInput = {
    sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
    claimAt: '2026-11-04T10:00:00.000Z',
    sessionEndedAt: '2026-11-04T11:00:00.000Z',
    tests: [],
    edits: []
  };

  describe('fresh session - CURRENT_SELF_RECORDED_TEST', () => {
    it('should return CURRENT_SELF_RECORDED_TEST when passing test is after all edits', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:45:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:30:00.000Z', pass: 5, fail: 0, exitCode: 0 }
        ],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'src/name.mjs', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'CURRENT_SELF_RECORDED_TEST');
      strictEqual(result.reason, 'Latest passing test was after all successful source edits');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
      strictEqual(result.timeline.length, 2);
    });
  });

  describe('stale after edit - STALE_LOCAL_TEST_EVIDENCE', () => {
    it('should return STALE_LOCAL_TEST_EVIDENCE when edit is after latest passing test', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:45:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:20:00.000Z', pass: 5, fail: 0, exitCode: 0 }
        ],
        edits: [
          { at: '2026-11-04T10:30:00.000Z', file: 'src/name.mjs', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'STALE_LOCAL_TEST_EVIDENCE');
      strictEqual(result.reason, 'Successful source edit after latest passing test with no later passing test');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });
  });

  describe('no tests - INSUFFICIENT_SESSION_EVIDENCE', () => {
    it('should return INSUFFICIENT_SESSION_EVIDENCE when no tests but has successful edits', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'src/name.mjs', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'No passing tests found despite successful source edits');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });
  });

  describe('test failure - INSUFFICIENT_SESSION_EVIDENCE', () => {
    it('should return INSUFFICIENT_SESSION_EVIDENCE when test has 0 pass count', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:30:00.000Z', pass: 0, fail: 1, exitCode: 1 }
        ],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'src/name.mjs', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'No passing tests found despite successful source edits');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });
  });

  describe('adversarial time - INSUFFICIENT_SESSION_EVIDENCE', () => {
    it('should reject test timestamp after sessionEndedAt', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T12:00:00.000Z', pass: 5, fail: 0, exitCode: 0 }
        ],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Test timestamp 2026-11-04T12:00:00.000Z is after sessionEndedAt');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject edit timestamp after sessionEndedAt', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T12:00:00.000Z', file: 'src/name.mjs', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Edit timestamp 2026-11-04T12:00:00.000Z is after sessionEndedAt');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject claimAt after sessionEndedAt', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T12:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'claimAt must be <= sessionEndedAt');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });
  });

  describe('invalid file - INSUFFICIENT_SESSION_EVIDENCE', () => {
    it('should reject path traversal in edit.file', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: '../../etc/passwd', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid edit.file path: ../../etc/passwd');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject empty edit.file', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: '', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid edit.file path: ');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject absolute path in edit.file', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'C:/Windows/System32/config', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid edit.file path: C:/Windows/System32/config');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject Windows backslash absolute path in edit.file', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'C:\\Windows\\System32\\config', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid edit.file path: C:\\Windows\\System32\\config');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject Unix absolute path in edit.file', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: '/etc/passwd', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid edit.file path: /etc/passwd');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject UNC path in edit.file', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: '\\\\server\\share\\file.txt', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid edit.file path: \\\\server\\share\\file.txt');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });
  });

  describe('duplicate entries - INSUFFICIENT_SESSION_EVIDENCE', () => {
    it('should reject duplicate test.at timestamps', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:30:00.000Z', pass: 5, fail: 0, exitCode: 0 },
          { at: '2026-11-04T10:30:00.000Z', pass: 3, fail: 0, exitCode: 0 }
        ],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Duplicate test.at timestamp (same instant): 2026-11-04T10:30:00.000Z');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject duplicate edit.at timestamps', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'src/name.mjs', successful: true },
          { at: '2026-11-04T10:15:00.000Z', file: 'src/other.mjs', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Duplicate edit.at timestamp (same instant): 2026-11-04T10:15:00.000Z');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });
  });

  describe('empty input - INSUFFICIENT_SESSION_EVIDENCE', () => {
    it('should return INSUFFICIENT_SESSION_EVIDENCE for empty arrays', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'No passing tests or successful edits found');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
      strictEqual(result.timeline.length, 0);
    });
  });

  describe('malformed input - INSUFFICIENT_SESSION_EVIDENCE', () => {
    it('should reject invalid sourceKind', () => {
      const input = {
        sourceKind: 'INVALID_KIND',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid sourceKind - must be RECORDED_LOCAL_KIRO_CLI_SESSION');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject missing tests array', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'tests must be an array');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject missing edits array', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'edits must be an array');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject pass as float', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:30:00.000Z', pass: 5.5, fail: 0, exitCode: 0 }
        ],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid test.pass value: 5.5');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject negative pass count', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:30:00.000Z', pass: -1, fail: 0, exitCode: 0 }
        ],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid test.pass value: -1');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject malformed test.at timestamp', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: 'not-a-date', pass: 5, fail: 0, exitCode: 0 }
        ],
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid test.at timestamp: not-a-date');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });

    it('should reject edit.successful as non-boolean', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'src/name.mjs', successful: 'true' }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Invalid edit.successful value: true');
      strictEqual(result.independentAttestation, false);
      strictEqual(result.semanticCorrectnessVerified, false);
    });
  });

  describe('boundary conditions', () => {
    it('should handle test with 0 fail count correctly', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:45:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:30:00.000Z', pass: 5, fail: 0, exitCode: 0 }
        ],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'src/name.mjs', successful: true }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'CURRENT_SELF_RECORDED_TEST');
      strictEqual(result.timeline.length, 2);
    });

    it('should handle edit with successful=false correctly', () => {
      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:45:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [
          { at: '2026-11-04T10:30:00.000Z', pass: 5, fail: 0, exitCode: 0 }
        ],
        edits: [
          { at: '2026-11-04T10:15:00.000Z', file: 'src/name.mjs', successful: false }
        ]
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'CURRENT_SELF_RECORDED_TEST');
      strictEqual(result.timeline.length, 2);
    });

    it('should allow max 60 tests', () => {
      const tests = [];
      for (let i = 0; i < 60; i++) {
        tests.push({
          at: `2026-11-04T10:${String(i).padStart(2, '0')}:00.000Z`,
          pass: 1,
          fail: 0,
          exitCode: 0
        });
      }

      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests,
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'CURRENT_SELF_RECORDED_TEST');
      strictEqual(result.timeline.length, 60);
    });

    it('should reject more than 60 tests', () => {
      const tests = [];
      for (let i = 0; i < 61; i++) {
        tests.push({
          at: `2026-11-04T10:${String(i).padStart(2, '0')}:00.000Z`,
          pass: 1,
          fail: 0,
          exitCode: 0
        });
      }

      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests,
        edits: []
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Maximum 60 tests allowed');
    });

    it('should allow max 60 edits', () => {
      const edits = [];
      for (let i = 0; i < 60; i++) {
        edits.push({
          at: `2026-11-04T10:${String(i).padStart(2, '0')}:00.000Z`,
          file: `src/file${i}.mjs`,
          successful: true
        });
      }

      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.timeline.length, 60);
    });

    it('should reject more than 60 edits', () => {
      const edits = [];
      for (let i = 0; i < 61; i++) {
        edits.push({
          at: `2026-11-04T10:${String(i).padStart(2, '0')}:00.000Z`,
          file: `src/file${i}.mjs`,
          successful: true
        });
      }

      const input = {
        sourceKind: 'RECORDED_LOCAL_KIRO_CLI_SESSION',
        claimAt: '2026-11-04T10:00:00.000Z',
        sessionEndedAt: '2026-11-04T11:00:00.000Z',
        tests: [],
        edits
      };

      const result = auditLocalSession(input);

      strictEqual(result.status, 'INSUFFICIENT_SESSION_EVIDENCE');
      strictEqual(result.reason, 'Maximum 60 edits allowed');
    });
  });
});