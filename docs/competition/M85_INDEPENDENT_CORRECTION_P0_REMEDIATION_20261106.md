# M8.5 — Independent PR #7 Correction Claim P0 Remediation

Date: 2026-11-06
Previous HEAD: `2bc4de47e845334f115f97718d5814fb74bac910`.
Release mode: **HOLD**. This document does not authorize a merge, production deployment, rollback or native Kiro hook activation.

## Independent source of finding

An independent reviewer supplied `PR7_FINAL_INDEPENDENT_AUDIT.md` on 2026-11-06 after reading the actual PR #7 code and testing a synthetic five-event JSONL file via both Node and the public M8.4 Preview. The reviewer demonstrated **false `CURRENT_SELF_RECORDED_TEST`** from:
- `Correction: 7 tests passed.` after the agent claimed `All 8 tests pass, 0 fail.`.
- `Correction: one test failed.` after the original PASS claim.
- The same correction with a backdated event timestamp but later physical JSONL position.

The reviewer saw 103 selected parser/auditor tests pass and noted the full-suite test was blocked by sandbox Git/temp-directory restrictions, **not** a verified product failure. The original report is a private reviewer artifact and was not copied into this repository.

## Reproduction, then fail-closed fix

On original head `2bc4de4`, all three correction variants produced `CURRENT_SELF_RECORDED_TEST` when independently replayed via Node. Seven targeted M8.5 tests were added: **5 RED, 2 PASS** before the patch.

The smallest coherent source change:
- Add bounded anchored detection of explicit corrections/updates about test pass/fail/results. Do not classify unrelated documentation corrections as test retractions.
- A correction in a later assistant event invalidates an earlier matching PASS claim by either file position or timestamp. A correction within the same affirmative message fails closed.
- A new affirmative PASS **after a correction** requires a successful, matching, new recorded test result between the correction and new claim, ordered correctly by JSONL position and timestamp. This stops repeated assertions from reusing the disputed old receipt.
- Preserve normal CURRENT for coherent, non-contradictory tests and for a fresh matching test receipt after a correction.
- Add bounded, non-sensitive UI error copy `CORRECTION_WITHOUT_NEW_TEST_RECEIPT`.
- Synchronize `web/kiro-session-import.mjs` from `src/kiro-session-import.mjs` using the existing deterministic `npm run build:live` process.
- Update one historical M7 test whose old expectation accepted reassertion without a new receipt. It now checks both unsafe and valid-retest scenarios.

## Verified on the local working tree

- Targeted fail-closed regressions: **21/21 PASS** after remediation, including the independent five-event input and two correction variants.
- Full `npm test`: **325/325 PASS**, 0 fail.
- `npm run check`: PASS; importer/browser ESM are byte-identical.
- `git diff --check`: PASS.
- Multi-session Kiro metadata-only replay: authentic previously SHA-pinned M5A remains `STALE_LOCAL_TEST_EVIDENCE` (288 events, 2 observed tests, 11 source edits), not falsely uplifted to CURRENT. Unknown or unsupported sessions remain NO_VERDICT, not fabricated PASS.
- Local Chrome via generated synthetic JSONL file picker: **32/32 cases PASS** across desktop and mobile390 (16 each); explicit corrections, backdated correction, same-message correction and reassertion without retest all insufficient; valid synthetic CURRENT recovery works. **0 console errors, 0 observed unexpected upload requests**, local input handles cleared. Browser clipboard mock used; not an OS clipboard test.
- Private local QA runner and receipt (ignored): `qa/private/specter-m7-live-20261104/m85-correction-browser-qa.mjs` and `m85-correction-browser-qa-receipt.json`. Raw Kiro transcripts were not copied or uploaded.

## External and release gates — still open

- [ ] Commit/push remediation; verify GitHub HEAD/CI on the exact new SHA for Draft PRs #6/#7.
- [ ] Deploy a **new Preview** on exact new SHA and accept the independent five-event JSONL through the **public browser file-picker** with no false CURRENT; verify static assets match Git.
- [ ] Request an independent review of the **new patched tree**. Existing independent report demonstrates a P0 on the **previous** SHA; it does NOT sign off on this fix.
- [ ] Review keyboard/screen-reader accessibility and privacy boundaries as a separate release gate.
- [ ] Recheck atomic integration merge tree to unchanged `main` and obtain owner approval before any merge/deploy. Do not merge vulnerable intermediate PR #4 into production.
- [ ] Confirm Vercel production-branch/auto-deploy behavior, exact artifact SHA, rollback candidate, production browser smoke.
- [ ] Re-record judge video from final public production release, accurately distinguishing authentic Kiro M6E work from ChatGPT/WAG M7/M8 integration.
- [ ] M9 Kiro V3 hook stays disabled and excluded.

**Current release decision: HOLD.** The latest local tests are evidence of the specified correction fix, not exhaustive semantic correctness or cryptographic provenance.
