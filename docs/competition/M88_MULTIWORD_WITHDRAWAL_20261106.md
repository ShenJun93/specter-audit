# M8.8 — Multiword explicit PASS withdrawal fail-closed hardening

Date: 2026-11-06
Base remote SHA: `16b3813f1814445d4b609298145f205a40416a8e` (M8.7).
Release mode: **HOLD**. This document does not authorize PR merge, production deployment, rollback, or M9 hook activation.

## Confirmed P1 and bounded origin

A separate Codex source-only review of selected tracked Kiro import, audit, live UI and Alibi Room files found a concrete missed retraction: `I retract my earlier claim.` following an agent statement `All 8 tests pass, 0 fail.` and a prior recorded eight-test PASS. This review received line-numbered tracked source as stdin, invoked no shell/tools, and is **NOT** full independent PR signoff. Prior source-only API/CI review found no substantiated P0/P1 within its excerpts, with the same limitations.

The owner-reviewed local WAG Node reproduction independently confirmed false `CURRENT_SELF_RECORDED_TEST` at M8.7 HEAD for:
- `I retract my earlier claim.`
- `I withdraw my earlier claim.`
- `I retract the previous claim.`
- `I withdraw my previous test claim.`
- `I take back my earlier claim.`

The prior passing test receipt was still accepted even after explicit withdrawal. This is a confirmed P1 fail-open issue, not merely an LLM opinion.

## Minimal targeted change and acceptance

- Add `test/kiro-session-retraction-phrases-m88.test.mjs`, five test groups: postclaim multiword retractions, repeated PASS without a new tool receipt, same-message withdrawal, unrelated documentation control, and valid fresh retest after withdrawal.
- Regression test before patch: **3 FAIL, 2 PASS**.
- Update the bounded `contradictsClaim()` retraction grammar in `src/kiro-session-import.mjs` to permit multiple claim qualifiers (`my earlier`, `our earlier test`, etc.) and explicit `take back my earlier claim`. Preserve the existing finite grammar, correction order, and new-receipt requirements.
- Rebuild browser mirror through `npm run build:live`. Node and browser import modules are byte-identical (SHA-256: `d51987265fcf919d0cf409443f57e139c58583f17fa72e4e468ab4ac1b61fdc4`).
- New tests after patch: **5/5 PASS**.
- Full `npm test`: **335/335 PASS**, 0 failed/skipped.
- `npm run check`: PASS; `git diff --check`: PASS.
- Private local Chrome using actual file-picker: **80/80 synthetic checks PASS** across desktop and mobile390 (72 file-picker, four auditor API control cases, two synthetic recovery cases, two metadata checks). Observed **zero console errors and zero unexpected analysis uploads**; file inputs cleared. This does not constitute packet-level privacy certification.
- Ignored runner/receipt: `qa/private/specter-m7-live-20261104/m88-local-browser-qa.mjs` and `m88-local-browser-qa-receipt.json`. No raw user Kiro logs or credentials were published.

## Architectural limitation

Natural-language parsing cannot establish exhaustive semantic contradiction coverage. This patch adds bounded conservative recognition of explicit formulations; it does **not** prove that every possible paraphrase of a withdrawal is detected. Longer-term improvement should prefer structured, machine-readable test receipt and claim provenance over treating free-form language as a cryptographically trusted status.

## Remaining release gates

- [ ] Commit and push M8.8 to the feature branch; verify exact-SHA GitHub Actions.
- [ ] Create and validate exact-SHA Vercel **Preview**, then public Chrome file-picker regressions on that new Preview. M8.7 public 52/52 file-picker evidence does not cover M8.8.
- [ ] Full independent code/security review of integrated PR #7, plus formal keyboard and assistive-technology assessment; source-only subset audits are not independent signoff.
- [ ] Confirm tracked Vercel production branch and auto-deployment behavior, rollback artifact and owner-approved atomic merge/release; production browser smoke and judge video only after authorization.
- [ ] Keep M9 disabled and PR #7 Draft. Never separately merge an intermediate vulnerable stacked PR.

**Release decision: HOLD.**
