# M8.4 — Claim-chronology contradiction remediation (2026-11-06)

## Release context
- Candidate before patch: `124e5584022c8837bfd622b13916ea945d50d429`.
- Current branch: `feat/m8-judge-entry-ux` (head for Draft PR #6 and atomic integration Draft PR #7).
- Production remains HOLD, M9 Hook disabled; no deployment, merge, alias change or native-hook activation authorized.
- Reviewed tree is **not** independently signed or known semantically correct merely because these tests pass.

## Reproduced P0 false CURRENT
An agent can issue a truthful-looking passing claim, then record an explicit **retraction or incompatible subsequent PASS count** with a *backdated timestamp*. The JSONL serialized the contradiction after the original claim, but the parser selected only the greatest timestamp and ignored the later serialized message. Before the patch, these inputs returned `CURRENT_SELF_RECORDED_TEST`:
1. A later `I retract this.` or `The tests failed.` with a timestamp prior to the passing claim.
2. A later `All 12 tests pass, 0 fail.` after a recorded `All 8 tests pass, 0 fail.`, but with a timestamp predating the previous claim.

These are synthetic, deliberately contradictory records. They show a demonstrated unsafe classification, **not evidence that a genuine Kiro transcript exploited it**.

## Minimal fail-closed fix
- `src/kiro-session-import.mjs` records each explicit retraction's **JSONL position and timestamp**. A retraction at or after the chosen claim by either evidence source invalidates the claim; error `LATER_AGENT_TEST_CLAIM_RETRACTED`.
- Preserve the recorded-order sequence of affirmative claims. If their timestamps move backwards in the file, return `NON_MONOTONIC_AGENT_CLAIM_CHRONOLOGY` rather than selecting an allegedly newer claim by timestamp.
- Preserve normal latest-claim behavior when claim timestamps and serialized order agree. No new dependency, no raw agent messages exposed.
- `web/live.js` displays an explanatory, bounded static string for the new error code. `web/kiro-session-import.mjs` is rebuilt from `src/` by the existing `npm run build:live` script.

## Verification
- Targeted adversarial tests: three new cases observed **RED** before remediation and 14/14 total tests **PASS** after remediation.
- Full Node suite: **317/317 PASS**, 0 fail.
- `npm run check` and browser ESM sync: PASS.
- Existing local multi-session Kiro compatibility runner: preserves real M5A session verdict `STALE_LOCAL_TEST_EVIDENCE` (other sessions without support remain NO_VERDICT; no invented PASS). No private raw logs exported.
- Local Chrome real browser with synthetic selected files: **22/22 PASS** (11 checks each desktop and 390px mobile). Two new backdated-agent cases per viewport fail closed; valid CURRENT synthetic recovery remains functional. 0 observed upload requests, 0 console errors; generated synthetic files only.
- Ignored local evidence script/receipt: `qa/private/specter-m7-live-20261104/m84-backdated-claim-browser-qa.mjs`, `m84-backdated-claim-browser-qa-receipt.json`.

## Required before production
- [ ] Commit/push exact remediation SHA, reverify PR #7 base/HEAD, exact SHA CI and Vercel Preview public-browser acceptance.
- [ ] Independent reviewer of complete final integration diff, with explicit attempts to falsify CURRENT. The author of this patch does not count as independent signoff.
- [ ] Do not merge PR #3 -> #4 -> #6 sequentially onto `main`. Atomic Draft PR #7 must integrate all fail-closed fixes together if approved.
- [ ] Confirm Vercel tracked production branch, selected deployment SHA, release owner authorization, rollback, and public production smoke.
- [ ] Re-capture final judge video only after live release, label synthetic vs real Kiro evidence, and verify attribution M6E Kiro vs later ChatGPT/WAG work.

**Release decision: HOLD.**
