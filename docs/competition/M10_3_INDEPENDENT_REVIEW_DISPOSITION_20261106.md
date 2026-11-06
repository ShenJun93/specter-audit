# M10.3 — Source-only independent review and disposition (2026-11-06)

**Status: LOCAL ACCEPTANCE PASS / RELEASE HOLD.** This is not full-repository independent security signoff.

## Source authority

- Experimental repository branch: `feat/m10-evidence-trial`. Base before M10.3: `ebcba7f72c0f4e3af49393c89addb1961b8c05cd` (M10.2).
- Source-only independent reviewer: Codex CLI `0.163.0`, read-only prompt with exact line-numbered excerpts from `web/trial-ui.mjs` and `web/evidence-trial.mjs`. The reviewer did not run tests, inspect all code paths or review Vercel deployment headers. Its output is **review guidance**, not verified proof by itself.
- M10.3 remediation and tests authored via **ChatGPT/WAG**, not Kiro. No new Kiro hook, global configuration or private transcript export.

## Finding A — confirmed provider metadata fail-open, FIXED

**Original reproducer:** call `combineTrial(null, { source:'GITHUB_PUBLIC_REST_OPT_IN', status:'OBSERVED_EXACT_SHA_RUNS', repository:'ShenJun93/specter-audit', prNumber:7, headSha:'a'.repeat(40), runs:[{}], counts:{success:1} })`.

**Before:** returned `pr.status='OBSERVED_EXACT_SHA_RUNS'`, `counts.success=1` and `providerStep='MATCHING_GITHUB_WORKFLOWS_OBSERVED'` despite no valid run data.

**Expected:** malformed run must not be presented as a verified exact-SHA observation.

**Fix:** `web/evidence-trial.mjs` now independently validates each normalized run's unique positive ID, exact PR HEAD SHA, known workflow status and status/conclusion consistency; rejects malformed/duplicate/mismatched entries with `status:'UNKNOWN'`, `counts:null`. For valid runs, derives success/failure/inProgress/other counts from run fields, never blindly copies `provider.counts`.

**Red/green:** two new tests demonstrate forged and contradictory input, initially failed before fix, now PASS. Existing test fixture was updated to include actual normalized provider `headSha` fields; the prior expectation that fake aggregate counts were coerced to 0 was corrected to derive a legitimate two-success observation from matching run records.

## Finding B — overlapping PR requests, NOT REPRODUCED THROUGH CURRENT UI

Reviewer hypothesized an older asynchronous PR result could overwrite a newer selection. Current `web/pr-proof.js` **synchronously** checks `if(button.disabled)return`, disables both button and input **before** awaiting `inspectPublicPr`, and restores them after completion. This prevents two concurrent user-initiated Inspect requests in the existing UI. Existing regression `PR form prevents changing the URL while evidence lookup is in flight` also guards this behavior.

A forged programmatic `specter:pr-observed` event could bypass these assumptions but would require an independently compromised same-origin script context; the current CSP and app do not load an untrusted scripting origin. No P1 race was independently reproduced. **Disposition: monitor, do not introduce a token protocol without a demonstrated concurrent path.**

## QA and scope

- **Full `npm test`: 460/460 PASS**, 0 fail/skipped.
- `npm run check`: PASS. `git diff --check`: PASS.
- Real Chrome local app, desktop 1280px + mobile390: PASS; real GitHub PR #7 provider still returned three successful runs at exact public HEAD `bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d`. Each explicit valid check used two public GET requests. Invalid URL yielded no GET, and file/synthetic interactions did not trigger additional external requests. No observed browser runtime/console errors or horizontal overflow.
- Prior M10.1/M10.2 local async file invalidation regressions remain PASS.
- Vercel API confirms the **existing M8.8 Preview** is READY at `8fc24affba4cfa00ee91b9ed0a65ad5941cdfe24`. Independently executed no-cookie `curl -I` from MAIN-PC returned HTTP 200 for that Preview `/`, `/alibi.html` and current stable production `/`, and returned restrictive CSP. **This is not a hosted M10 test.**
- No git push, PR update, production deploy, Preview M10 deploy, YouTube visibility change, or Devpost submission.

## Remaining release blockers

1. Full independent integrated review of exact M10 candidate, including Vercel hosted CSP and actual browser network behavior from a *new* exact-SHA Preview.
2. Owner-approved promotion path. PR #7 is still Draft and current production is older; do not silently change links or release.
3. Genuine Kiro CLI V3 staleness hook and source-edit/retest footage remain blocked by monthly quota; synthetic M9B preflight cannot substitute.
4. Final public YouTube review and Devpost project synchronization, followed by verification of real submitted timestamp, are still outstanding.

**Decision: LOCAL PASS / RELEASE HOLD.**
