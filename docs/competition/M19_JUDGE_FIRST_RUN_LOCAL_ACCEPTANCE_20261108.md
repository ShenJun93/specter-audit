# M19 — Judge-first-run UX and mobile navigation acceptance (2026-11-08)

**Disposition: LOCAL UX + REGRESSION PASS / REMOTE AND RELEASE HOLD.**

## Baseline and scope

- **Branch:** `feat/m19-judge-first-run`.
- **Exact baseline:** M18 `b6eb16d6c22cc40ade477ab1158cdccbfba993cd`, previously independently verified with 523/523 GitHub CI and signed `receipt.json` (run `42436943389`).
- **Worktree:** `qa/private/specter-m19-judge-first-run-20261108`.
- **Authorship:** ChatGPT/WAG wrote the M19 interface wording, CSS, tests and documentation. **No new Kiro code, session, hook, quota request or attestation** was generated here.

## UX finding and change

M18's public landing-page **START HERE** CTA sent first-time judges to `/live.html`, which primarily asks for a private Kiro `messages.jsonl` file. That is an unnecessary barrier for an unauthenticated evaluator. The product already offers four recorded exhibits and a carefully redacted **real Kiro session** with 120 observed passing tests, a recorded agent claim, and five later successful source edits without a post-edit rerun seen in the selected log.

M19 changes the primary `web/index.html` hero CTA to `/alibi.html#case-room`, labels the accessible zero-setup judge fast path and explicitly guides the judge to **case 04, The Midnight Rewrite**. The existing `alibi.js` already selects valid case 04 by default once the static public-safe session file validates; **no evidence parser, status logic or case data changed**. Secondary links take the judge to the public PR inspector or browser-local private Kiro analysis.

A genuine browser E2E test detected **481 px document width at a 320 px viewport**, traced to the shared `web/alibi.css` topbar nav with unwrapped flex content. A narrow-screen rule now stacks the header and wraps navigation at up to 630 px. This CSS is also shared by `/live.html` and `/pr-proof.html`; all three routes were retested.

## Test-first and real browser evidence

- Existing M19 judge entry test: **RED** on the original M18 CTA `/live.html`, then GREEN when primary CTA moved to the recorded Kiro case.
- New mobile-nav test: **RED** before CSS fix, GREEN after.
- Google Chrome headless + Python Playwright on the **actual local Node server** at `127.0.0.1:58617` (not the public M16 Preview).
- Full first-run interaction at **320, 375, 390, 768, 1024 and 1440 px**: homepage CTA `/alibi.html#case-room` -> valid recorded cases loaded -> authentic case 04 selected with `aria-pressed=true` -> user-triggered Reveal -> `STALE_LOCAL_TEST_EVIDENCE`, with no fabricated CI link.
- **6/6 first-run viewports PASS**, no horizontal document overflow, zero JavaScript exceptions, zero request failures, zero outbound network requests. Screenshots and scripts remain in ignored `qa/private/`, not committed or exposed to Vercel.
- Shared nav regression: `/alibi.html`, `/live.html`, and `/pr-proof.html` at **320, 375, 390, 768, 1440 px** each: **15/15 route/viewport checks PASS**, zero document overflow, errors, or outbound requests before user opt-in.
- Entire `node --test --test-reporter=tap` suite: **524/524 tests PASS**, 11 suites, 0 fail, 0 skipped, 0 cancelled, 0 TODO; ~16.1 seconds. Local TAP receipt `qa/private/m19-full-v2.tap`.
- `npm run check`: PASS; `git diff --check`: PASS.

## Documentation correction

`README.md` and `docs/JUDGE_QUICKSTART.md` distinguish:
1. Stable production M5L (older).
2. Publicly accepted M16 Preview at exact source `2e6cfe2d4852defa16ccad3d1311cb710b9ffab1`.
3. M18 signed CI artifact at exact source `b6eb16d6c22cc40ade477ab1158cdccbfba993cd`.
4. **M19 as a local-only user-journey improvement**. This repo branch has not yet been pushed/attested or Preview-deployed as of writing.

Historical M8.8 documentation is retained, but the current evaluation references appear at the top of the README. No Devpost link, public video, production alias, PR lifecycle or official submission was modified.

## Limitations / next gates

1. A recorded Kiro CLI test plus later edits is evidence of **stale earlier test results relative to those edits**; this does not prove the code is broken, that no tests ran elsewhere, or that the local log is an independently verified provider attestation.
2. Kiro CLI quota previously reported `MONTHLY_REQUEST_COUNT`. Real M9B `PostFileSave` handler is still missing and must not be claimed as implemented.
3. Once M19 is pushed, verify **M19 exact SHA** GitHub test receipt, signer workflow and negative control. A future M19 **Preview** requires its own approval and URL/HTTP/CSP/browser acceptance; the already verified M16 Preview does not contain this change.
4. Final judge demo video must use a tested deployed version and real Kiro evidence, remain under 3 minutes, and comply with Kiroween submission rules. Submission and production promotion remain owner-approved separate decisions.

**Release decision: LOCAL PASS / REMOTE + PREVIEW + PRODUCTION HOLD.**
