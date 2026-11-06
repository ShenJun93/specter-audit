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

## UX branch — initial Preview VERIFIED, mobile UX follow-up pending
- Branch: feat/m8-judge-entry-ux, based on M8. This branch deliberately excludes M9.
- Root: real navigation to Your Kiro session and Recorded cases, visible primary Kiro session call-to-action.
- Session page: guidance for selecting messages.jsonl without disk scanning or server upload.
- After a supported verdict: Copy next step copies only fixed advice, not raw session data and never executes commands.
- Initial M8.1 HEAD 66280a921a3320d589e64042b5ef0f250c8089dd: Draft PR #6 https://github.com/ShenJun93/specter-audit/pull/6, [GitHub Actions run 41987099919](https://github.com/ShenJun93/specter-audit/actions/runs/41987099919) SUCCESS, Vercel Preview dpl_CTQQddodicvhtJFfjE8w6demuSDm READY (https://specter-audit-o0d8yjgk6-nvhoa1691993-6852s-projects.vercel.app/live.html).
- Eight assets byte-matched committed files, all three synthetic verdicts passed desktop/mobile, generated file import did not cause network uploads, and fixed-text clipboard behavior was tested with a mock. No added runtime dependency.

## Mobile verdict visibility — local remediation
- Independent screenshot review found a usability flaw: on mobile, the generated verdict was below the fold after choosing an example.
- Fix: in viewports at or below 850px, move accessible focus to a tabindex=-1 results heading and use **instant** scrollIntoView to display the result. Explicit instant behavior avoids inheriting CSS smooth scroll when a verdict needs immediate visibility. Desktop retains its existing position.
- Red/green local Chrome evidence: before fix mobile STALE verdict top ~1661px in an 844px viewport, even though heading was focused; after fix STALE/CURRENT/INSUFFICIENT each appeared at ~92px with heading focus, no overflow or console errors. The native parser and verdict semantics were not changed.
- QA receipt: ignored local qa/private/specter-m7-live-20261104/m81-mobile-verdict-focus-qa-receipt.json.
- This follow-up commit is **not represented by the earlier 66280a9 Preview**. It requires fresh exact-SHA GitHub CI and Vercel Preview acceptance.

## Release checklist
- [x] M8 exact SHA Vercel Preview and browser QA.
- [x] UX branch local regression and Chrome smoke.
- [x] Initial M8.1 SHA 66280a9 exact CI, Preview and six-case Chrome functional acceptance.
- [x] Follow-up mobile result visibility: local Chrome desktop/mobile STALE, CURRENT and INSUFFICIENT PASS, accessible result focus verified.
- [ ] Follow-up mobile fix exact-SHA GitHub CI and separate Vercel Preview/browser acceptance.
- [ ] Independent comprehensive visual/accessibility review on final chosen release (not claimed by basic functional checks).
- [ ] Review and merge PR #3 then #4 in ancestor order; recheck exact production release SHA and click paths.
- [ ] Kiro V3 native acceptance for M9 Hook before enabling it. M9 is ChatGPT/WAG authored and is NOT operational.
- [ ] Authenticate a sanitized real Kiro session with M6E provenance, without publishing raw private logs.
- [ ] Classify insufficient logs in a real-session compatibility benchmark with manual ground truth.
- [ ] Final public YouTube demo under three minutes and Devpost submission.

## Trust boundaries
A passing self-reported tool receipt does not prove correctness or exact tested source snapshot. Do not claim synthetic fixtures are real logs, that zero requests in one QA prove absolute privacy, or that disabled M9 is live. No production changes were made in this milestone.
