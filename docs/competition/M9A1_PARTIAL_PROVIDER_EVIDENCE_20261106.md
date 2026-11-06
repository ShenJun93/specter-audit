# M9A.1 — provider provenance partial-observation fix (2026-11-06)

Status: **LOCAL CANDIDATE / RELEASE HOLD**. Experimental worktree only; PR #7, stable production, M8.8 Preview and Devpost not modified.

## Baseline and finding

Source baseline: `b4dd02b9520f6d2e90867b3c9a3e7ab385138b32` on `feat/m9-pr-proof-chain`.

Two accuracy defects were reproduced by newly added failing regression tests before the fix:

1. If the first GitHub API GET returned validated PR HEAD `head.sha` but the second Actions-run GET returned HTTP 429, the inspector returned `UNKNOWN` with `headSha:null`. This discarded an already verified observation. Fix: preserve only validated `headSha` in the existing conservative UNKNOWN result, while `runs:[]`, `counts:null`, `independentlyAttested:false`, `allRequiredChecksVerified:false` remain unchanged.
2. For a malformed user-supplied PR URL that triggered **zero** GitHub requests, `web/pr-proof.js` still displayed `PUBLIC GITHUB · OBSERVED`. Fix: distinguish `NO PROVIDER EVIDENCE`, `PR HEAD OBSERVED · CI UNKNOWN` and `PUBLIC GITHUB · WORKFLOWS OBSERVED`.

The fix does not introduce a new API request, GitHub token, server-side behavior, personal log upload, dependency or automatically activated Kiro hook.

## Red/green and real browser evidence

- Added three regression cases: (a) preserve validated SHA but do not imply a CI pass when second request is rate-limited; (b) never invent SHA when PR fetch itself fails; (c) no provider-observed label for invalid URL.
- Pre-fix selected tests: **RED**, demonstrating the two exact defects.
- Post-fix selected tests: **86/86 PASS**.
- Post-fix full `npm test`: **421/421 PASS**, zero fail/skipped.
- `npm run check` and `git diff --check`: **PASS**.
- Local Chrome real UI desktop 1280px and mobile 390px, through `qa/private/specter-m7-live-20261104/m9a-browser-regression-v2.mjs`: **PASS**. Both sizes rejected `https://github.com.evil.test/a/b/pull/7` with `NO PROVIDER EVIDENCE`, zero outgoing requests, then inspected the real public PR #7 via exactly two GET requests per viewport and showed 3 provider-reported successful runs on GitHub HEAD `bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d`; keyboard focus, skip link, no horizontal overflow and zero browser console/runtime errors confirmed.
- All local Chrome requests are **read-only public GitHub GETs**. GitHub provides workflow metadata, not independent proof of code correctness or required CI gates.

## Limitations / release disposition

- M9A and M9A.1 code is **ChatGPT/WAG-authored**, not Kiro-authored. Kiro CLI 3.1.0 review attempt failed due `ServiceQuotaExceededException: MONTHLY_REQUEST_COUNT`. No Kiro hooks installed.
- The separate broad integrated Codex review attempts were limited/timed out and are **not** independent full signoff. Do not infer the whole release is secure.
- Verified Vercel `vercel.json` route/header syntax is consistent with official documentation and local regex tests, but **no exact-SHA hosted Vercel Preview** or HTTP response CSP verification has been performed for M9A.1.
- The local session-to-PR commit binding remains `false`; actual workflow tests can belong to independent CI, not an attested Kiro transcript.
- **DO NOT push, merge, deploy, promote or update Devpost from this experiment without separate acceptance.**

Next priority: restore Kiro credits via official Kiroween credits request form (owner identity verification required), then independently implement/test a narrowly opt-in native Kiro V3 trigger in a separate worktree before any hook activation.
