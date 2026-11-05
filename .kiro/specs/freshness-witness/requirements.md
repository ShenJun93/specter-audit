# M9 Freshness Witness — Kiro CLI V3
## Goal
Turn the existing passive saved-session inspector into a proactive advisory loop inside a genuine Kiro development session. When Kiro finishes changing a source file after an observed passing test receipt, the agent sees a bounded RETEST_REQUIRED warning. A subsequent genuine passing test may clear that warning, but its status is still self-recorded, not independent attestation or code correctness.

## Scope and EARS acceptance requirements
R1. WHEN Kiro CLI V3 completes a supported tool operation, the project-scoped PostToolUse Hook SHALL receive its event on stdin and emit only deterministic fixed wording plus bounded numeric counts. It SHALL NOT echo tool arguments, response text, filenames, prompts, tokens, session IDs, raw JSON, or home directories.
R2. WHEN a supported successful source write completes, the witness SHALL remember the event's completion order for that session and, if a PASS was previously observed, mark RETEST_REQUIRED. No test shall run automatically.
R3. WHEN an isolated supported test command (exact npm test or node --test invocation, with harmless fixed flags only) returns an explicit tool success, pass N > 0, fail 0 and exit 0, the witness MAY report PASS_RECEIPT_OBSERVED_AFTER_LAST_WRITE. It SHALL always state self-recorded only, not correctness verified. An agent claim alone SHALL NEVER turn into a passing receipt.
R4. WHEN a tool result is absent, failed, malformed, truncated or unsupported, or an unknown shell operation could mutate source, the witness SHALL move to INSUFFICIENT_HOOK_EVIDENCE, never silently recover to a passing status on that same event. A later clean isolated test may supersede earlier uncertainty only if the implementation can justify the order and scope.
R5. WHEN tests and edits could overlap, PostToolUse completion order alone cannot prove which source snapshot the test covered. Therefore the hook SHALL NEVER issue CURRENT_SELF_RECORDED_TEST, VERIFIED, CLEAN, SAFE or release approval. For stronger chronology the existing M7 importer remains the authority and must remain unchanged.
R6. WHEN an unrelated read-only tool is observed, it SHALL NOT assert a new PASS or edit. Unsupported commands, evaluation substitutions, pipelines or shell metacharacters SHALL NOT count as safe isolated test runs.
R7. The only permitted persistent state is a bounded metadata-only local per-session file under the operating system temp folder, keyed by a SHA-256 digest of a nonempty session ID, never raw IDs or paths. No network requests, third-party services, telemetry, runtime package dependencies, Git mutations or source-content reads.
R8. Hook input SHALL be bounded to 64 KiB and stored state to 4 KiB. Persist only schema version, nonnegative safe integer counters, latest known event order, status codes and a short fixed expiry. Files shall be created with restricted permissions where possible. Invalid, corrupted or concurrent state updates fail closed.
R9. The workspace Hook configuration SHALL use official Kiro CLI 3.x standalone v1 JSON with PascalCase trigger PostToolUse and an action invoking a tracked Node.js 24 script with a fixed literal command. Do not use obsolete CLI 2.x camelCase object-form Hook syntax.
R10. Tests SHALL cover both pure reducer behavior and command-line stdin process with temporary state; never use private real sessions in fixtures. Native Kiro Hook activation SHALL be proven separately by a freshly launched Kiro V3 session and successful tool writes.
R11. Do not change M7/M8 importer, evaluator or production. Source changes are in the separate local M9 branch; PR #4 remains unchanged. Only Kiro tool-write events count as genuine Kiro implementation provenance.

## Fixed advisory statuses
- NO_PASS_RECEIPT: No isolated passing test receipt observed by this Hook.
- PASS_RECEIPT_OBSERVED: One passing receipt observed after the last definitely completed source edit; self-recorded, not proof of source version, coverage or correctness.
- RETEST_REQUIRED: A successful source edit was observed after the last passing test receipt.
- INSUFFICIENT_HOOK_EVIDENCE: Unknown/failed/missing/overlapping input prevents a reliable local ordering statement.

## Out of scope
- Automatic execution of tests, CI modifications, signing/attestation, inspecting source contents, uploading anything, modifying Git refs, browser DOM or giving release approval.
- Claims about tool events not intercepted by configured Hook matcher, other agents, other sessions, MCP operations or concurrent processes.
