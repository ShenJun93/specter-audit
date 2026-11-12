# Specter Arena + Gate (M118) requirements

R1: For a canonical public GitHub PR, record repo, PR number, base/head SHA, provider-reported runs and attempts. Recheck HEAD; any movement, malformed response or network failure must fail closed.

R2: Reviewer must approve a test file outside the PR and its SHA-256 before execution. Run exactly the same behavior test on isolated base/head checkouts. Capture exit code, source SHA, runtime image digest, bounded output hash and status. Only Docker execution; never on the host or public web server.

R3: Classify REGRESSION, DEMONSTRATED_FIX, BOTH_PASS, BOTH_FAIL, UNKNOWN. A result supports only the chosen behavior, never general correctness.

R4: Output one versioned JSON report with per-statement source/trust/observation time and a next action. Arena and PR-oriented views must consume that report without retyping findings.

R5: Reuse existing PR observer, session auditor, signed receipt. No private log upload, invented attestation, or unsupported Kiro claim. Native Kiro hook only if real CLI session proves activation.

R6: Protect already submitted M75, V5D video, Devpost, production and aliases. Work in reviewable branches with complete tests and isolated external-repo evidence.
