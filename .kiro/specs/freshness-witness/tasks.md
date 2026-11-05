# M9 Tasks — Genuine Kiro Implementation

> **2026-11-05 update:** Kiro CLI reached its monthly usage limit before
> authoring M9 source. ChatGPT/WAG implemented a local reducer, CLI wrapper,
> and disabled Hook, with 325/325 full Node tests PASS. This does **not**
> complete Kiro-authored provenance or real PostToolUse acceptance.
> See docs/competition/M9_LOCAL_IMPLEMENTATION_REVIEW_20261105.md.
> The genuine Kiro-owned tasks below remain open.

- [ ] 0. Inspect current repo, Kiro CLI 3.0.0 Hook docs and exact runtime event shape using a fresh Kiro session. Do not read private .kiro/sessions logs or existing secrets.
- [ ] 1. Implement src/freshness-witness.mjs with the three required exported functions and a bounded, immutable pure state reducer.
- [ ] 2. Implement scripts/kiro-freshness-witness-hook.mjs receiving bounded stdin, parsing known event fields conservatively and maintaining metadata-only per-session state with safe locking/fail-closed behavior.
- [ ] 3. Create .kiro/hooks/freshness-witness.json as a standalone V3 PostToolUse Hook. Avoid enabling any PreToolUse gate, auto tests, dynamic shell commands, network or source content collection.
- [ ] 4. Author test/freshness-witness.kiro.test.mjs with >=12 independent cases: source edit after PASS, PASS after edit, invalid/failed results, malformed JSON, injection/redaction, duplicate events, concurrency, lock conflict, partial edits, source path rejection, unsupported test command, no RAW output leak.
- [ ] 5. Run node --test test/freshness-witness.contract.test.mjs test/freshness-witness.kiro.test.mjs and npm test, npm run check, git diff --check.
- [ ] 6. In a fresh Kiro V3 session, demonstrate actual PostToolUse invocation and safe RETEST_REQUIRED after an edit. Save only sanitized proof; report any actual Hook schema incompatibility or command permission failure.
- [ ] 7. Provide an accurate changed-file list, tool-write provenance and open risks. Do NOT commit, push, merge or deploy; independent reviewer will handle Git.

Implementation must use real Kiro tool writes. If tool writing or Hook runtime is blocked, report the blocker and STOP; do not claim completion.
