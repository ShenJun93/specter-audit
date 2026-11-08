# M18 — M9B safe-output preflight integrated into M16 (2026-11-08)

**Disposition: LOCAL REGRESSION PASS / REMOTE ATTESTATION NOT YET RUN / RELEASE HOLD.**

## Provenance and exact code state

- Baseline: `feat/m16-judge-selfverify` at exact source commit `2e6cfe2d4852defa16ccad3d1311cb710b9ffab1`.
- Integration worktree: `qa/private/specter-m18-m16-m9b-preflight-20261108`.
- Integration branch: `feat/m18-m16-m9b-preflight`.
- Source commits applied via clean cherry-pick:
  - `921bc97f60d812865a4a6c5b0d0928b07bf5d00e` (hardening + 3 regression cases + historical evidence doc), integrated commit `7f67078`.
  - `f79020baf02bb7134ccb4b49b963d46b1648adae` (M9B historical local regression report update), integrated commit `3a10bde`.
- Authorship: all integration/harness changes from ChatGPT/WAG, **not Kiro-native handler code**. This work cannot be represented as a new Kiro session or a real PostFileSave hook trigger.

## Why this integration exists

M9B hardening had passed in an older experiment branch rooted at `8fcb11f`, while the tested web Preview/M15 attestation integration had advanced to M16. The paths `scripts/kiro-v3-hook-preflight.mjs` and `test/kiro-v3-hook-preflight.test.mjs` in M16 were verified to match the pre-hardening versions in the older branch before integration.

The cherry-picks applied without conflict. Comparing M16 baseline against this branch changes precisely:

1. `scripts/kiro-v3-hook-preflight.mjs` — accepts only the **one exact warning sentence** from the existing M9B specification for permitted synthetic source events, allows no other stdout/stderr; fails closed on unexpected output.
2. `test/kiro-v3-hook-preflight.test.mjs` — adds adversarial tests for appended instructions, ANSI escape contamination, unwanted stderr and missing warnings.
3. `docs/competition/M9B_SAFE_HOOK_OUTPUT_20261108.md` — historical original-branch report, preserved with original 464-test result. **That report's original branch provenance does not describe M18 itself.** Use this file for the M18 integration result.

No file under `.kiro/hooks/` was created, no CLI quota request was attempted, no provider permissions were added, no production or Preview deployment was changed.

## Observed local acceptance

- **Full exact-M18 Node suite:** `node --test --test-reporter=tap` **523/523 PASS**, 11 suites, fail 0, skipped 0, cancelled 0, todo 0; execution ~17.75 seconds. TAP retained locally under ignored `out/ci/m18-full.tap`.
- **`npm run check`:** PASS.
- **`git diff --check`:** PASS.
- Before adding this report, worktree was clean and exact commit `3a10bdee273e9691b293725e3a5a8eba200a4f75`.
- Real M16 Preview acceptance and its exact SHA CI attestation were completed separately. **M18 has not yet been deployed or attested by GitHub**; never transplant M16 verification claims to M18 without a new exact-SHA run.

## Source and trust boundaries

The harness tests an **invented synthetic STDIN format**. Kiro V3's real post-save payload, matcher path normalization, hook subprocess behavior, and warning delivery remain unverified in a real session. A passing mock cannot prove that Kiro authored code, reran tests, or bound a receipt to a PR HEAD. Only a fresh Kiro CLI session with a real hook, owner-approved installation, actual save and test/edit/retest evidence can establish these properties.

Historical genuine Kiro code edits/test sessions already exist (see `docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md`); M18 does not claim to create them. M9B latest CLI quota test still reported `ServiceQuotaExceededException / MONTHLY_REQUEST_COUNT`. An email credit award is not proof that the credits have been successfully redeemed into the authenticated Builder ID.

## Remaining gates

1. **Remote:** owner push M18 branch; verify GitHub `node-verification`, `attest-ci-receipt`, exact downloaded `receipt.json` TAP SHA-256 and `gh attestation verify` against M18 source SHA, expected workflow and branch. No Preview is warranted for a harness-only change unless it becomes part of the final candidate.
2. **Kiro-native M9B:** credits activated; real Kiro-authored handler, actual documented STDIN confirmed by live event, sandbox hook JSON reviewed and expressly approved, real PostFileSave warning and negative control, verified cleanup.
3. **Product:** independent security/UX audit for final integrated source, judge-facing footage, truthful submission review and explicit owner release permission.

**Decision: M18 LOCAL PASS / REMOTE + RELEASE HOLD.**
