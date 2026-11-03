# Specter Audit — Public Release Evidence

**Date:** 2026-11-03 (Asia/Ho_Chi_Minh)

## Canonical endpoints

- Public GitHub: https://github.com/ShenJun93/specter-audit
- Production Judge Demo: https://specter-audit.vercel.app/
- Event: https://kiroween.devpost.com/
- Planned category: Costume Contest
- Initial release commit: `9896ccd9851d5559983f511187ac71ce85f0db10`
- Vercel deployment: `dpl_H1oRAr2YFcjKSjDbacw19NzPpyw4`, production READY.
- CI: https://github.com/ShenJun93/specter-audit/actions/runs/41639525541 — completed/success on initial release commit.

## Evidence gates

| Gate | Evidence | Status |
| --- | --- | --- |
| GitHub public repository | Verified through authenticated GitHub API | PASS |
| Open source license | MIT LICENSE included in main | PASS |
| Kiro files | `.kiro/specs/` and `.kiro/steering/` in public Git tree | PASS |
| Local tests | `npm test` 82 pass, 0 fail on MAIN-PC | PASS |
| Code syntax | `npm run check` exit 0 on MAIN-PC | PASS |
| GitHub Actions CI | Run 41639525541 completed/success | PASS |
| Web production deploy | Vercel READY for initial commit | PASS |
| Public GET endpoints | /, /api/inspection, /api/status all HTTP 200 without credentials | PASS |
| Public live POST | All three verdicts verified from real Vercel API | PASS |
| Cross-origin restriction | Foreign Origin -> HTTP 403 | PASS |
| Public Chrome QA | Desktop, 390px mobile, no horizontal overflow or console errors | PASS |
| QA/private not published | `.gitignore` excludes QA and launcher, reviewed staged paths | PASS |
| Devpost final submission | No successful submission receipt yet | PENDING |
| Public YouTube under 3 minutes | Not created/verified yet | PENDING |
| Additional real Kiro involvement | Milestone 1 Kiro development verified; more value recommended | PENDING |

## Truthfulness of evidence

The hosted experience is a **precomputed synthetic Git snapshot**, created from a real disposable Git repo by the read-only inspector and published as a fixed dataset. The hosted evaluator runs on each submitted claim; it does not inspect the visitor's computer, scan GitHub live, or execute tests. The visible banner explicitly discloses this.

The full **local inspector** runs actual read-only Git commands against an explicitly selected repository and can be reproduced with:

`node src/http-server.mjs --repo="/path/to/git/repo"`

A metadata-consistent receipt is NOT proof that a test ran; a SUPPORTED change-only verdict is NOT proof of semantic correctness.

## Source provenance and compliance

Milestone 1 was implemented with Kiro CLI (user-provided session evidence) and independently tested. Milestones 2–4 were developed using ChatGPT-assisted remote editing, with local and public-site acceptance. Do **not** describe M2–M4 as authored by Kiro. The official Kiroween rules require substantive use of Kiro and explain usage in the final video.

The current public demo is suitable for judges to evaluate the product's synthetic evidence mode, not a production-ready general GitHub inspector. The local app remains the live Git-inspection product. Tests, independent provider attestation, CI integration, commit-diff analysis, and source semantics are deliberately not implemented in this release.

## Next actions

1. Run a genuine Kiro-driven next engineering milestone and retain exact code/test provenance.
2. Final independent security/UX review; ensure claims remain conservative.
3. Produce a public YouTube demo under 3 minutes that shows the real product and real Kiro usage.
4. Create Devpost draft and verify final submission before December 4, 2026 2:00 PM PST (December 5, 05:00 Vietnam time).
