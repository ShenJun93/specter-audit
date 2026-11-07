# M17 — Adversarial browser review of exact M16 Preview (2026-11-07)

**Disposition: TARGETED ADVERSARIAL CASES PASS / OVERALL RELEASE HOLD.**

This is an adversarial technical review performed by ChatGPT/WAG, which also helped implement previous milestones. It is **not an independent third-party security assessment**, penetration test, accessibility certification, or proof of Kiro-native integration.

## Exact authority and scope

- **Tested source:** `2e6cfe2d4852defa16ccad3d1311cb710b9ffab1` (`feat/m16-judge-selfverify`).
- **Actual Vercel Preview (not production):** `https://specter-audit-750p0my50-nvhoa1691993-6852s-projects.vercel.app/pr-proof.html`
- **Vercel deployment:** `dpl_CdJakSyPyfT3SFfuS73fxNFqCVgV`; Vercel API reported `READY`, `target:null`, exact GitHub source SHA and only a Preview alias.
- **Existing remote CI provenance:** GitHub Actions run `42335670600`, two jobs PASS, 520/520 tests, downloaded `receipt.json` and `test.tap` digests MATCH, `gh attestation verify` for exact SHA/signer/ref exit 0.
- **Execution:** actual Google Chrome via Python Playwright on MAIN-PC, navigating the real Preview. Mocked responses intercepted with `page.route('https://api.github.com/**', ...)`; they were **not** real provider claims and did not mutate any GitHub PR or repository.
- **Local QA reproduction script:** ignored, private worktree file `qa/private/m17_adversarial_preview_20261107.py` in `specter-m16-judge-selfverify-20261107`. It is intentionally not committed or uploaded to Vercel.
- No feature source change, merge, production deployment, Devpost update, Kiro CLI request or hook activation in M17.

## Adversarial scenarios and observations

| Scenario | Expected protective behavior | Observed |
| --- | --- | --- |
| Three invalid PR URLs (foreign origin, HTTP, query token) | Block request; no provider call; unknown verdict | PASS; 0 GitHub calls |
| One successful exact-SHA run with draft PR | Provider success observed only; draft explicit; no release approval | PASS |
| Success and failure for same SHA | Failure takes precedence over green | PASS — `FAILED RUNS OBSERVED` |
| Success and in-progress for same SHA | Pending results prevent success-only presentation | PASS — `RUNS STILL ACTIVE` |
| Closed PR with green run | Never infer merge | PASS — `CLOSED · MERGE NOT DETERMINED` |
| Run's head SHA differs from PR HEAD | Fail closed | PASS — `EVIDENCE UNKNOWN` |
| Forged PR HTML URL with appended script-like query | Reject first provider payload | PASS — `EVIDENCE UNKNOWN`; one GET |
| Truncated first-page workflow observation | Do not treat green sample as complete | PASS — `PARTIAL WORKFLOW SAMPLE` |
| Private `messages.jsonl` containing unique secret canary | No provider transmission or echoed canary; unknown session state | PASS — 0 new provider calls, no visible canary |

Each scenario retained the page disposition `RELEASE EVIDENCE INCOMPLETE` and session-to-commit bridge `UNBOUND`. Browser test returned `M17_ADVERSARIAL_PREVIEW_PASS`, **0 JavaScript page errors, 0 failed requests, 0 unexpected non-GET provider mutations**.

A test harness assertion initially expected an invalid URL to hide the report entirely; this expectation was corrected because the existing UI intentionally renders a clearly labeled **UNKNOWN** dossier. No application bug was found in that behavior.

## Previously verified M16 acceptance (not repeated by every M17 case)

- Six viewport widths (320, 375, 390, 768, 1024, 1440 px) on the actual Preview: no horizontal overflow, keyboard details disclosure PASS, clipboard copy PASS, zero console/network failures.
- All six requested HTTP assets returned 200; actual Preview CSP restricted scripts to `'self'` and permitted GitHub API connect only on PR Proof Chain.
- Explicit opt-in PR #7 inspection on the real Preview showed `OPEN · DRAFT`, `RUNS OBSERVED, NOT CERTIFIED`, and preserved the fixed historical M15 signed receipt reference.
- The static HTML accessibility heuristic passed; **no full screen-reader/contrast certification**.

## Residual risks and nonclaims

1. **Critical for contest eligibility:** a real Kiro-native M9B PostFileSave hook/test/edit/retest demonstration has not been observed. The Didit verification was completed by the owner, and Gmail subsequently confirmed a one-time grant of **4,000 Kiro credits** on 2026-11-07, but credits must be **redeemed in the owner's Kiro account** and verified on its usage dashboard before another Kiro CLI attempt.
2. A GitHub-signed CI test receipt proves workflow/artifact provenance, not that a separate, editable Kiro CLI transcript tested the same commit; local session-to-commit binding remains unverified.
3. Browser-mocked responses are useful adversarial boundary tests but not a broad third-party penetration test. In particular: comprehensive XSS payload corpus, malicious service workers/browser extensions, cross-origin privacy telemetry, real screen-reader operation, and all future GitHub API shape changes have not been exhaustively assessed.
4. The historical M15 signed-CI reference must remain labeled as historical; it must never become a dynamic certificate for another PR.
5. Submission/promotion needs an owner-approved integrated candidate, truthful project/author attribution, current exact-SHA Preview/production links, and full human review of the English video and Devpost submission.

## Conclusion

**No P0/P1 defect was detected in the nine targeted adversarial scenario groups**, but this is absence of findings in the stated test scope, not evidence that no other defects exist. No product code change was necessary from the M17 run. **M16 remains Preview PASS / release HOLD**; immediately prioritize redeeming the issued Kiro credits and then producing actual M9B native evidence.

---
This report is technical evidence documentation only. No new source acceptance, Kiro authorship, production approval or official Devpost submission is implied.
