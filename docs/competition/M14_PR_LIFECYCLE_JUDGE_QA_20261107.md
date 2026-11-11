# M14 — PR lifecycle clarity and integrated judge QA (2026-11-07)

**Decision: LOCAL TECHNICAL PASS / RELEASE HOLD.**

## Exact scope and provenance
- Base: `26cf59ca12f2a5b11a6ceca9b1c01f82c7fdd2ff` (M13).
- Worktree: `qa/private/specter-m14-pr-lifecycle-20261107`; branch `feat/m14-pr-lifecycle`.
- Changes by ChatGPT/WAG, **not Kiro CLI**. No new Kiro V3 hook was enabled, created or tested.
- No merge, production deploy, Devpost submission, YouTube visibility change, or PR #7/#8 mutation.

## Finding

The earlier GitHub public PR inspector already validated provider-reported `state` and `draft`, but **did not present them to the judge** or propagate them to the Evidence Repair Plan. As a result, three successful provider-reported workflow runs could visually coexist with an otherwise silent **draft** or **closed** PR. This is especially relevant to the live PR #7 demonstration.

## Remediation
- Add a dedicated, explicitly **provider-reported PR review status** panel: `OPEN · DRAFT`, `CLOSED · MERGE NOT DETERMINED`, `OPEN · NOT DRAFT (NOT APPROVED)`, or `PR STATE UNKNOWN`.
- Preserve the existing exact-SHA workflow counts, failed/pending precedence, and no-release-approval verdict. Never infer merged status from `closed` or certify release from `open`.
- Propagate a sanitized `pr.reviewState` into the combined hearing. For closed/draft PRs, prepend lifecycle caveats to the exact-commit CI repair action. Missing/contradictory metadata defaults to UNKNOWN.
- No new API calls, credentials, persistence, server endpoint, dependency or attestation infrastructure.

## Verification

1. Test-first regression: 5 of 6 M14 cases RED before correction, then **6/6 GREEN** after correction. Cases cover draft/open/non-draft/closed, missing or malicious lifecycle values, and UI/source wording.
2. Full Node suite: **486 tests passed, 0 failed, 0 skipped**, 11 suites.
3. `npm run check`: PASS; `git diff --check`: PASS.
4. Actual local Chrome headless via WAG on `http://127.0.0.1:58614/pr-proof.html`: explicit user-triggered inspection of real public GitHub PR #7 displayed **OPEN · DRAFT**, **RUNS OBSERVED, NOT CERTIFIED**, **3 success**, **UNBOUND**, and **RELEASE EVIDENCE INCOMPLETE**. The repair plan said draft PR is not ready for normal review and required check scope remained unverified. Browser telemetry: 0 console errors, 0 failed requests, 0 unhandled exceptions in this tested flow.
5. Static HTML accessibility heuristic returned **100/100**, 0 detected violations. This is *not* a screen-reader, keyboard focus, contrast or WCAG certification.

## Unresolved competition gates
- M9B native Kiro `PostFileSave` source-edit/retest demo remains unverified until credit activation and genuine CLI execution.
- A provider-reported run is not independent proof that a Kiro session tested the same exact code. Independent session-to-commit binding remains `UNBOUND`.
- Full adversarial browser injection, mobile viewport overflow, real screen-reader, and integrated deploy/Preview CSP checks have **not** been independently completed in M14. Do not claim these as PASS.
- Approval for merge, Preview, production, final video and Devpost remains separate and on HOLD.
