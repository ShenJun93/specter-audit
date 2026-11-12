# M125 — Automated accessibility audit and keyboard acceptance

Status: development candidate on `audit/m125-gate-security-20261112`, based on `main` commit `4a818097b2a2f5d9ba2589323c5cf5187e0f1080`. **Not** a new judge deployment. Do not claim WCAG conformance or independent security attestation.

## Method

- Used **axe-core 4.10.3 + Playwright-core + installed Microsoft Edge**, with a loopback Node app server serving the exact main worktree.
- Checked five routes: `/`, `/alibi.html`, `/live.html`, `/pr-proof.html` and `/arena.html`, each at 390px, 768px and 1440px (**15 automated scans**).
- Ran axe tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`.
- Did not disable or relax application CSP. The first attempt to inject an inline audit script was blocked by `script-src 'self'`, as expected. A same-origin test-only Playwright response route served axe-core without modifying runtime files or headers. QA dependencies and full raw report were kept outside the repository.
- The audit covers automated rules only; **axe incomplete checks** still need manual review, and screen-reader testing was not performed.

## Reproduced issues and minimal corrections

| Route | Issue | Before | Correction |
| --- | --- | --- | --- |
| `/alibi.html` | `landmark-complementary-is-top-level` (moderate): nested `aside.case-selector` inside another landmark | 1 per viewport | Replace the nested `aside` with an explicitly labelled `div role="group"` containing the same four case buttons |
| `/alibi.html` | `scrollable-region-focusable` (serious): evidence timeline scrolls but did not accept keyboard focus | 1 per viewport | Add `tabindex="0"` to the labelled `ol#timeline`; preserve CSS focus-visible outline |

**Automated result before:** 6 violation occurrences across 15 scans; two unique rules, both on Alibi Room at 390/768/1440.

**Automated result after:** **0 axe violations across 15 scans** using the same routes, viewport sizes and rule tags. No observed JavaScript exceptions or failed requests. An automated zero is **not** a WCAG accessibility certification.

## Real keyboard/interaction acceptance

At 390/768/1440px, Playwright navigated to Alibi Room after loading the case files, focused `ol#timeline`, pressed **End**, and observed actual scroll positions (390px scrollTop 427; 768/1440px scrollTop 147). The four-case switcher remained functional; selecting the fourth case updated `aria-pressed` to `true`. No page exceptions.

A Node integration assertion in `test/alibi-page.test.mjs` protects the corrected group role, labelled focusable timeline and existing selected button semantics. This protects the structural contract; it does not substitute for runtime accessibility testing.

## Non-goals and remaining release blockers

- The M118–M122 **Gate Docker runner is unchanged**. The local Docker fixture is owner-controlled and its receipts are not independently attested. This accessibility audit does **not** certify Docker isolation for hostile PR code.
- No security review from independent external experts and no 3–5 real volunteer reviewer study have been completed. Do not fabricate human results.
- Preserve submitted M75 Devpost link, original V5D video, current Vercel production and prior filmed demo. Changes here should be reviewed in a separate PR before any release promotion.
