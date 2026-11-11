# M13 — Provenance-first judge UX (local acceptance, 2026-11-07)

## Scope and authorship
- Local worktree: `qa/private/specter-m13-provenance-ux-20261107`
- Branch: `feat/m13-provenance-ux`
- Base SHA: `652f0cbb8de50642acde0bf755dd940af33f9882` (M12)
- Authored and tested using ChatGPT/WAG, **not** Kiro CLI.
- No Kiro V3 hook, account token, private log, new backend, deployment, PR edit, YouTube change, or Devpost mutation.

## Finding and changes
1. **False-green affordance in Evidence Trial:** before M13, `CURRENT_SELF_RECORDED_TEST` used `trial-positive` (green) for both user-selected and expressly synthetic example sources. The report already said `independentlyAttested:false`, but the visual marker could imply verification. M13 uses the neutral `trial-observed` marker for a self-recorded current result, explicitly labels synthetic stale/retest on the prominent badge and in detail text, and calls the selected local file an **unverified** log.
2. **Misleading independence claim:** M12 presented `3 independent checks` and an accessible list label `Independently actionable evidence checks`. These are three *separate evidence reviews*, not three independently attested facts. M13 corrects the wording to `3 separate reviews · independent attestation absent` and `Separate evidence reviews`.

The underlying conservative validation and release invariants are unchanged: `localSessionLinkedToPr:false`, `independentlyAttested:false`, `semanticCorrectnessVerified:false`, `allRequiredChecksVerified:false`, `releaseApproved:false`; the third edge stays `UNBOUND` even with a synthetic retest.

## Test evidence
- Added `test/m13-provenance-ux.test.mjs`, including a minimal in-memory DOM harness that exercises the actual `web/trial-ui.mjs` module and its click handlers.
- Regression red/green: 2/3 failed on the M12 presentation, then 3/3 passed after the change.
- Full Node suite: **480 passed, 0 failed, 0 skipped**. Suites: 11.
- `npm run check` and `git diff --check`: PASS.
- Local WAG-owned headless Chrome, `http://127.0.0.1:58613/pr-proof.html`:
  - Explicitly synthetic `After source edit`: `SYNTHETIC STALE RECEIPT`, synthetic provenance stated, `UNBOUND`.
  - Explicitly synthetic `After fresh retest`: `SYNTHETIC RETEST — UNVERIFIED`, `SYNTHETIC CURRENT`, `UNBOUND`, `RELEASE EVIDENCE INCOMPLETE`.
  - Accessible list name: `Separate evidence reviews`.
  - Browser telemetry in checked flow: 0 console errors, 0 failed requests, 0 unhandled exceptions.

## Limitations / go-no-go
- This was a **local** presentation and regression hardening pass. It does not independently validate actual Kiro session-to-commit provenance.
- No actual Kiro-native PostFileSave operation, human video review, screen-reader audit, security penetration test, or Preview verification occurred in this M13 test.
- M9B remains credit/quota-blocked until the user's issued credits are activated.
- **Technical local acceptance PASS; release/contest readiness HOLD.**
