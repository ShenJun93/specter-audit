# M129 — Judge Fast Path: first-viewport finding shortcut

Date: 2026-11-12 (Asia/Ho_Chi_Minh)

Source authority: main commit 5101ab187f6854fddd92f38c4de1fce41fbf737a. Candidate branch: feat/m129-judge-reveal-shortcut-20261112.

## Verified user journey before the change

Playwright + Microsoft Edge was run against two real public deployments: the officially submitted M75 demo and the exact-main M128 Preview. The judge flow is homepage primary CTA → Alibi Room case 04 → reveal the bounded recorded Kiro finding.

The homepage CTA is already visible inside the first viewport, and case 04 is selected automatically after its recorded session artifact loads. These were not bugs.

The existing "Expose the alibi" button appears well below the initial viewport after the jump to the case room. Measured positions from the top of the viewport after CSS smooth scrolling settled:

| Viewport | M128 original reveal top | Initial viewport height | Initially visible? |
| --- | ---: | ---: | --- |
| 390 × 844 | 1,439 px | 844 px | No |
| 768 × 900 | 1,237 px | 900 px | No |
| 1440 × 900 | 956 px | 900 px | No |

The M75 submitted demo has the same usability issue, independently observed at all three sizes. We did not rewrite the historical M75 release.

## Minimal remediation

- Add one explicit, initially disabled "Reveal finding now" button immediately after the selected case title.
- The quick button is enabled only when a validated case is loaded. It invokes the same existing revealVerdict function as the original button; there is **no duplicated verdict logic**.
- Its accessible state resets on case changes, and the revealed verdict heading receives focus. The original lower "Expose the alibi" button and complete evidence timeline remain intact.
- Nearby caution explicitly says the finding is based on recorded evidence only and does not certify correctness.
- The quick button remains disabled when the recorded provider pack cannot be loaded. If only the Kiro session exhibit fails, cases 01–03 remain usable; no false case-04 finding is shown.
- Changes are limited to web/alibi.html, web/alibi.js, web/alibi.css, one integration regression test, and this receipt. No changes to the evaluator, GitHub provider, Docker runner or synthetic case data.

## Acceptance evidence on development worktree

Playwright + Edge checked the real homepage CTA → case 04 flow at four viewport sizes after allowing browser smooth-scroll to settle:

| Viewport | New quick button top–bottom | In initial viewport? | Case 04 finding |
| --- | --- | --- | --- |
| 390 × 844 | 561–605 px | Yes | STALE LOCAL TEST EVIDENCE |
| 768 × 900 | 527–571 px | Yes | STALE LOCAL TEST EVIDENCE |
| 1024 × 768 | 234–278 px | Yes | STALE LOCAL TEST EVIDENCE |
| 1440 × 900 | 266–310 px | Yes | STALE LOCAL TEST EVIDENCE |

Across all four sizes, the new action correctly exposes the recorded Kiro finding and moves keyboard focus to the verdict title. Switching to case 01 clears the old verdict and allows a separate STALE EVIDENCE finding; switching back to case 04 still supports the original lower reveal button. Horizontal overflow: zero.

Negative QA with deliberate HTTP 404 fixture responses:
- Missing recorded Kiro session: case 04 remains disabled; case 01 remains available and shows only its own provider-backed finding.
- Missing case pack: both reveal buttons remain disabled; no verdict is shown.
- JavaScript page errors: zero. Unexpected request failures: zero.

Node: npm run check PASS; npm test 569 PASS, 0 FAIL. One regression test was added, retaining canonical explicit test discovery.

Accessibility: axe-core 4.10.3 with Playwright on five routes at 390/768/1440px (15 scans), selected WCAG A/AA and best-practice tags, zero automated violations or page exceptions. The existing incomplete manual checks and independent screen-reader validation remain outstanding.

## Trust boundary and competition release

This change improves the discoverability of an already recorded, self-reported verdict. It does not prove the local Kiro log was independently attested, nor does it prove correctness of the code, real external usage, or hostile-PR sandbox safety. It is not an independent human usability study.

The official Devpost URL remains the separate M75 historical judge demo. Video V5D, stable aliases and production are intentionally unchanged. Deploy only a SHA-matched isolated Preview for testing; coordinate explicit owner approval before changing the judged submission or video.

Next gates: CI at exact PR SHA, public Preview first-viewport QA at the same breakpoints, accessibility smoke check, independent reviewer study and an explicit release decision.
