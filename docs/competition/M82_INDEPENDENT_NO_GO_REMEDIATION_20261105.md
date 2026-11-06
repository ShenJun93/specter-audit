# M8.2 — Independent NO-GO Correctness Remediation

Date: 2026-11-05  
Parent release candidate: `bc773ba4f5050af7e5f79e86b59d62fa2f156c9b`  
Feature branch: `feat/m8-judge-entry-ux` (stacked on PR #4, then PR #3).

## Independent reviewer findings

An external adversarial report reproduced **false CURRENT** from an agent message that negates its own pass claim and from JSONL that serializes a tool result before the corresponding call. The report also identified a missing-payload `TypeError` and a direct exported audit-API false CURRENT when a post-claim test fails. The public production hostname still lacks the M8 session-investigation routes; that remains a separate P0 release blocker.

## Reproduced before patch

`node --test test/kiro-session-no-go-regressions.test.mjs` initially returned **1 PASS / 5 FAIL**. Four failures reproduced the independent findings. The fifth was a flawed concurrency expectation in the first test draft; it was corrected to verify a valid interleaving of distinct read-only and testing tool call/results.

## Minimal remediation

- `src/kiro-session-import.mjs`: explicit self-retraction of a pass claim fails closed, including a negative suffix within the same agent message. Later retractions can also invalidate earlier claims. No raw agent prose is returned.
- Validate `payload` on every JSONL event. Missing, null, scalar or array payloads return bounded `INVALID_PAYLOAD` instead of uncaught exceptions.
- Check **physical JSONL record order** for each paired `tool_call` / `tool_result`. A result preceding its matching call returns `RESULT_PRECEDES_TOOL_CALL_IN_FILE`. Independent valid calls/results may interleave; orphan results retain prior incomplete-evidence behavior.
- `src/kiro-session-staleness.mjs`: the standalone exported API now considers post-claim failing tests before concluding CURRENT, but retains existing insufficiency reasons when no valid passing evidence exists.
- `web/live.js`: explicit user-facing error text for the new order guard.
- Deterministic `scripts/build-live-web.mjs` copies synchronized source ESM files into `web/`.

All changes are fail-closed. This does not establish code correctness or signed provenance from a mutable local log.

## Verification on the local release-candidate tree

- New adversarial regression file: **6/6 PASS** after remediation.
- Full Node suite: **309 PASS / 0 FAIL**.
- `npm run build:live`, `npm run check`, `git diff --check`: PASS.
- Safe-metadata-only replay of the existing Kiro workspace sessions retained the known real M5A `STALE_LOCAL_TEST_EVIDENCE`: 288 recorded events, two observed tests and eleven edits. No private transcript was exported.
- Chrome local synthetic file-picker QA: **10/10 cases PASS** across desktop and mobile390, covering contradictory claim, reversed result/call order, malformed payload, recovery to a valid CURRENT example, homepage navigation, and previous STALE/copy-next-step flow.
- Chrome QA observed **zero unexpected uploads/analysis requests and zero console errors**. Tests used generated fixtures only; clipboard behavior used a browser mock, not an OS clipboard test.
- Ignored local QA runner and receipt: `qa/private/specter-m7-live-20261104/m82-no-go-browser-recovery-qa.mjs` and `m82-no-go-browser-recovery-qa-receipt.json`.

## Remaining gates before any merge/release

- [ ] Push the remediation commit and confirm CI on its **new exact SHA**.
- [ ] Create and accept a matching Vercel Preview with six functional verdict cases and the three newly blocked false-confidence cases; check asset hashes.
- [ ] Obtain independent source review and accessibility/UX review.
- [ ] Recheck stacked PRs #3 -> #4 -> #6. **PR #4 alone still contains the old vulnerable parser**; do not release #4 standalone. Reconcile the parser patch into the final reviewed merge tree before deployment.
- [ ] Obtain explicit owner approval for merging/promotion; verify production SHA and rollback target.
- [ ] Production hostname must serve `/live.html`, `/alibi.html`, parser modules and all three functional verdicts before final judge demo.
- [ ] Genuine Kiro provenance must be accurately attributed; M8.2 authored with ChatGPT/WAG, not Kiro. M9 Hook stays disabled and outside the release.
- [ ] Re-record and review final video against the exact public release, then complete the official submission.

**Release verdict: HOLD** until the above external and production gates are closed.
