# Receipt provenance

## Threat model

An AI coding agent or user can type "tests passed" and invent JSON with exitCode 0, a current HEAD hash, and a valid timestamp without executing tests. These are self-asserted metadata, not independent evidence.

## Evidence levels

| Item | Source | Allowed inference |
| --- | --- | --- |
| Git worktree/index file paths | Local read-only Git | File-path alignment |
| Claim word/path matching | Heuristic comparison | Weak alignment, not semantic correctness |
| Pasted JSON receipt | Self-reported | Metadata consistency only |
| Pasted text log | Self-reported | No independent test evidence |
| Executed test in controlled environment | Not implemented | Cannot be claimed |
| Signed CI provenance | Not implemented | Cannot be claimed |

Verdict invariants: test-only claims stay UNVERIFIED regardless of pasted receipt; combined change and test-pass claims cannot exceed PARTIAL when test execution is not observed; change-only claims can be SUPPORTED solely for file-path alignment and carry an explicit caveat; malformed/stale/failed receipts never upgrade a verdict.

Future independent attestation would require an explicitly authorized runner, sandboxing, observed process exit, provenance capture and verification, replay protection, and a separate security review. Specter Audit currently does not execute user commands or claim independent attestation.
