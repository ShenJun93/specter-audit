# M8 Judge Entry — Release Gate (2026-11-05)

## Strategy
Three independent judge audits agreed: bring the strongest M8 workflow into a verified public release, show authentic Kiro contributions, reduce first-use friction, and complete the final demo/submission. Avoid more synthetic test count or widening scope.

## M8 exact-SHA Preview — VERIFIED
- PR #4 (Draft): https://github.com/ShenJun93/specter-audit/pull/4
- SHA: 73068263f5c50c5a1dcb8c50d2747d3ab61f2c20
- READY Preview deployment: dpl_2ZcGXCkAhZm8hgFZHhxqS6vAuSm7
- URL: https://specter-audit-96h1fqej1-nvhoa1691993-6852s-projects.vercel.app/live.html
- Six shipped assets byte-matched local M8 files; browser Chrome synthetic verdicts: 3/3 desktop and 3/3 mobile390 PASS.
- No JS console errors or horizontal overflow, no click-triggered analysis requests. A delayed favicon request in the first QA attempt was unrelated to file analysis.
- No raw private Kiro log was opened on the hosted site. QA receipts and six images are local and ignored under qa/private/specter-m7-live-20261104/.

## UX branch — NOT YET DEPLOYED
- Branch: feat/m8-judge-entry-ux, based on M8. This branch deliberately excludes M9.
- Root: real navigation to Your Kiro session and Recorded cases, visible primary Kiro session call-to-action.
- Session page: guidance for selecting messages.jsonl without disk scanning or server upload.
- After a supported verdict: Copy next step copies only fixed advice, not raw session data and never executes commands.
- Structural regression tests plus local Chrome six-case acceptance. No added runtime dependency.

## Release checklist
- [x] M8 exact SHA Vercel Preview and browser QA.
- [x] UX branch local regression and Chrome smoke.
- [ ] UX branch exact SHA CI, new Preview, and visual/accessibility QA.
- [ ] Review and merge PR #3 then #4 in ancestor order; recheck exact production release SHA and click paths.
- [ ] Kiro V3 native acceptance for M9 Hook before enabling it. M9 is ChatGPT/WAG authored and is NOT operational.
- [ ] Authenticate a sanitized real Kiro session with M6E provenance, without publishing raw private logs.
- [ ] Classify insufficient logs in a real-session compatibility benchmark with manual ground truth.
- [ ] Final public YouTube demo under three minutes and Devpost submission.

## Trust boundaries
A passing self-reported tool receipt does not prove correctness or exact tested source snapshot. Do not claim synthetic fixtures are real logs, that zero requests in one QA prove absolute privacy, or that disabled M9 is live. No production changes were made in this milestone.
