# M8.3 — Second-pass false-CURRENT hardening (2026-11-05)

## Scope and decision

Follow-up to commit `8975b80336ebb6f4763952d6e617c1e9285e7e7a` on `feat/m8-judge-entry-ux` (Draft PR #6). **Production release remains HOLD.** This is not a signed attestation of the session, source correctness, or absence of activity outside the recording. M9 Hook remains disabled and excluded.

## Independently reproduced on M8.2

Three additional classes of recorded evidence were able to yield `CURRENT_SELF_RECORDED_TEST`:

1. A passing agent claim followed by explicit pronoun-only withdrawal: "I retract this", "I withdraw that", "I take that back", "That was a lie", or "Please disregard my earlier statement". Retractions could appear in the same or a later assistant message.
2. A tool write serialized *after* a passing test tool result, but with backdated event timestamps. M8.2 sorted by timestamp and treated the last test as covering source state, despite conflicting JSONL order.
3. A passing agent claim serialized *before* its supporting test result; the result was assigned an earlier timestamp, causing the parser to accept a test report that had not appeared in the recording when the agent claimed it had passed.

These cases used bounded synthetic JSONL and are documented as genuine reproduced classification defects, not evidence of real-world exploitation.

## Narrow fail-closed remediation

- Extended explicit PASS-claim withdrawal detection (same-message suffix and later assistant statement). Unrelated "wrong commit" discussion is not automatically treated as test retraction.
- Require non-decreasing timestamps **among tool_call/tool_result events in recorded file order**; otherwise return `NON_MONOTONIC_TOOL_CHRONOLOGY`. Unrelated non-tool/status events are deliberately exempt: the pinned authentic Kiro M5A session has one non-tool timestamp decrease, but its 112 tool events have zero decreases (55 equal timestamps).
- Prevent a test result physically recorded after the selected affirmative claim from retroactively supporting it, even if its timestamp predates the claim. Returns `CLAIM_PRECEDES_TEST_RESULT_IN_FILE`.
- Preserve priority of the existing `RESULT_PRECEDES_TOOL_CALL_IN_FILE` guard. Distinct calls/results may interleave legitimately.
- Add privacy-safe error messages for both new chronology codes. Rebuild browser ESM from `src/` using `npm run build:live`.
- Update an existing same-timestamp test fixture to use valid chronological serialization while still asserting `AMBIGUOUS_EVENT_TIMESTAMPS`; the previous fixture appended older events at the end of the recording.

## Verification

- New regression cases were confirmed RED before remediation and GREEN after remediation; the adversarial test module now passes 11/11.
- Full Node suite **314 PASS / 0 FAIL**, `npm run check`, generated browser ESM sync, and `git diff --check` PASS on local worktree.
- Hash-pinned authentic Kiro M5A session replay unchanged: 288 events, 2 recognized test receipts, 11 observed source edits, 6 after last recorded test; verdict remains `STALE_LOCAL_TEST_EVIDENCE`. No raw log was exported.
- Chrome local browser file-picker acceptance: **18/18** cases PASS across desktop and mobile390 (seven problematic fixtures + valid CURRENT recovery + previous homepage/STALE/copy case per viewport). 0 console errors; no observed analysis/upload requests; generated fixtures only, clipboard mocked.
- Ignored local QA script/receipt: `qa/private/specter-m7-live-20261104/m83-no-go-browser-qa.mjs` and `m83-no-go-browser-qa-receipt.json`. Raw Kiro transcript remains private.
- This gate is **LOCAL only** until pushed exact-SHA GitHub Actions, fresh Vercel Preview asset hashes and public Chrome/browser QA pass.

## Release gates still open

- [ ] Push the isolated M8.3 follow-up and confirm new exact-head CI.
- [ ] Exact-head Preview, source-byte verification and adversarial browser QA.
- [ ] Independent security/source review (fail-closed tests are necessary but not a proof of no further false CURRENT).
- [ ] Review PR #3 → #4 → #6, merge/retarget in safe order with fresh merge-tree CI. **Do not release PR #4's older importer standalone.**
- [ ] Owner-approved production release with selected artifact, source SHA provenance, rollback plan and public hostname smoke.
- [ ] Judge video and submission based on final deployed production, not a stale Preview.

## Attribution

M8.3 follow-up authored using ChatGPT/WAG. Authentic Kiro authorship evidence pertains to the earlier M6E core and its tests, not this remediation.
