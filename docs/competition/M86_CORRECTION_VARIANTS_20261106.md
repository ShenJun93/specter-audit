# M8.6 — Adversarial test-correction wording hardening

Date: 2026-11-06
Base local M8.5 SHA: `5ec13517b8b0b1e858ee819feaefce2e5c096bb7`.
Release decision: **HOLD**; this document does not authorize merge, production deployment or M9 activation.

## Finding independently reproduced by the current review session

A new local read-only replay of synthetic Kiro JSONL on M8.5 still gave false `CURRENT_SELF_RECORDED_TEST` after the agent's earlier eight-test PASS when the later agent said:
- `Correction — 7 tests passed.` (Unicode em dash)
- `Correction – 7 tests passed.` (Unicode en dash)
- `I need to correct the test result: 7 tests passed.`
- `To correct my earlier test result: 7 tests passed.`
- `Update on tests: 7 passed, one failed.`
- `Oops, one test failed.`

The M8.5 anchored correction matcher recognized `Correction: 7 tests passed.` but missed common punctuation and natural-language prefixes.

## Remediation and verification

- Added `test/kiro-session-correction-variants.test.mjs` with nine explicit correction variants, same-message correction, and an unrelated documentation correction negative control.
- RED before patch: 2 failing test groups, 1 passing group.
- Expanded only the bounded, anchored `isExplicitTestCorrection()` prefix grammar in `src/kiro-session-import.mjs`, preserving the existing test-count and fresh-receipt logic.
- Regenerated the browser mirror through the existing `npm run build:live`; hashes for `src/kiro-session-import.mjs` and `web/kiro-session-import.mjs` are identical.
- GREEN after patch: 3/3 new test groups PASS (nine variations inside the first group), `npm test` **328/328 PASS**, `npm run check` PASS, `git diff --check` PASS.
- Only synthetic in-memory session events were used. No raw Kiro logs, credentials or user transcripts were included.

## Scope and remaining release gates

This improves recognition of explicitly phrased test-result corrections. It does **not** solve arbitrary-language semantic interpretation and must never be described as a verified general-purpose contradiction detector. False CURRENT on new adversarial phrasing remains a risk requiring independent reviewer scrutiny.

- [ ] Commit and push exact new SHA to the feature branch, then verify GitHub Actions for that same SHA.
- [ ] Verify new exact-SHA Vercel Preview and exercise the actual file-picker path on public desktop/mobile Chrome with the added synthetic variants; do not reuse old Preview evidence.
- [ ] Obtain genuinely separate authorized code/security and keyboard/screen-reader review; current reviewer cannot self-certify independence.
- [ ] Confirm production alias tracking, explicit owner merge/deploy approval, merge-SHA checks, rollback and final judge video.
- [ ] Keep PR #7 Draft, no production promotion and no M9 activation.
