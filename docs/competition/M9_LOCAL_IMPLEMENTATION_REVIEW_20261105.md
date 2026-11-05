# M9 — Freshness Witness local implementation review (2026-11-05)

## Release classification
**LOCAL IMPLEMENTED / CONTRACT-VERIFIED / LIVE KIRO V3 NOT VERIFIED.**

This continues work after the interactive Kiro CLI V3 account hit its monthly usage limit. The Kiro session explored the task and observed the pre-implementation red baseline; it did **not** write any M9 implementation. The files below are **ChatGPT/WAG-authored**, not Kiro-authored.

## Implementation
- src/freshness-witness.mjs — dependency-free pure reducer, bounded metadata and deterministic NO_PASS_RECEIPT / PASS_RECEIPT_OBSERVED / RETEST_REQUIRED / INSUFFICIENT_HOOK_EVIDENCE. Never returns a CURRENT, correctness or independent attestation verdict.
- scripts/kiro-freshness-witness-hook.mjs — 64 KiB maximum stdin, validated JSON, SHA-256 keyed per-session private OS temp metadata (4 KiB maximum), exclusive file lock, atomic rename and a 24-hour fail-closed expiry. No source reads, networking, arbitrary command execution or telemetry.
- .kiro/hooks/freshness-witness.json — standalone v1 PostToolUse Hook with fixed literal command; **enabled:false intentionally**.
- test/freshness-witness.wrapper.test.mjs — subprocess checks for state transitions, locking, corrupted/expired state, session separation, malformed input, unsafe command and private-data redaction.
- Independent contract tests: test/freshness-witness.contract.test.mjs.
- test/freshness-witness.replay.test.mjs — replay/duplicate tool ID tests, including a persisted-state subprocess run and bounded metadata checks.

## Verified local gates
- M9 contract + wrapper + replay tests: **33 PASS / 0 FAIL** (26 initial + 7 replay).
- Full project Node tests: **332 PASS / 0 FAIL**, 11 suites.
- npm run check: PASS. node --check on both new source files: PASS.
- git diff --check: PASS.
- M7/M8 engine, browser UI, PR #4, Vercel and production unchanged.

## Limits and outstanding gates
1. **Native Kiro hook not activated.** Real V3 PostToolUse stdin shape, tool IDs and result fields remain unobserved. Synthetic fixtures cannot establish runtime compatibility; leave Hook disabled pending validation.
2. **Completion is not source snapshot proof.** A PASS_RECEIPT_OBSERVED event is explicitly self-recorded only, and is not CURRENT_SELF_RECORDED_TEST or proof of correctness.
3. **M9 Kiro-authored provenance remains missing.** Kiro CLI hit MONTHLY USAGE LIMIT after inspecting requirements; it had no recorded successful M9 source-write tool call. This WAG implementation does not satisfy the new genuine Kiro-code gate.
4. **Fail closed.** Unknown tools, missing explicit success, dynamic shell commands, partial writes, corrupted or expired state and abandoned locks do not produce passing statuses.
5. **No private material in repository.** Hook state stores fixed status codes/counters, at most 16 recent SHA-256 tool-ID digests, and a canonical 1024-byte Bloom filter (base64). Never raw prompts, commands, source paths, tool IDs, or session IDs. Serialized state stays under the 4 KiB wrapper limit.
6. **Replay hardening (2026-11-05).** A red-team test reproduced false PASS_RECEIPT_OBSERVED after a stale tool result was replayed with the same tool ID. Baseline: **2/3 failing**; after bounded digest deduplication: **5/5 PASS**, including persisted wrapper state. Duplicate/malformed tool IDs fail closed; a new identified test remains allowed.
7. **Beyond-16 replay fix (2026-11-05).** A separate red test established that a PASS replayed after 20 distinct later read-tool IDs incorrectly became PASS_RECEIPT_OBSERVED. It failed before the fix. The immutable reducer now also keeps a fixed-size Bloom filter of all known explicit IDs; repeating an ID is rejected even after eviction from the 16-item recent cache. Both pure and real persisted subprocess regression tests PASS. Bloom collisions are **false positives that fail closed**, not green outcomes.
8. **Replay limits.** Only stable top-level tool_use_id/tool_call_id values can be deduplicated; ID-less events or locally tampered state cannot be independently validated. The Bloom filter is not an attestation, cannot authenticate an untrusted event stream, and may conservatively reject a new ID by collision. No claim of complete replay defense, CI correctness, or source snapshot proof.
9. **Runtime payload still unknown.** Official Kiro Hook documentation covers standalone JSON, PostToolUse and stdin context, but this account has not produced a successful native Hook invocation after hitting quota. Exact event IDs, result shape and version behavior remain unverified. Hook stays disabled.

## Next Kiro-owned acceptance
After credits are available, start a fresh Kiro V3 session. Inspect the actual PostToolUse input fields and tool ids without publishing private input, deliberately enable the Hook, and verify a genuine test → source edit → RETEST_REQUIRED sequence with Kiro-written files and credible tool-write provenance. Run the 332+ tests, exact-SHA CI and independent review before marking release-ready.

References: https://kiro.dev/docs/hooks/ and https://kiro.dev/docs/cli/v3/hooks-migration/

This is an implementation audit, not an independent security certification or a prediction of hackathon ranking.
