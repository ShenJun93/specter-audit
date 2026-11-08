# M20 — Kiroween 2026 submission candidate (2026-11-08)

**DRAFT FOR OWNER REVIEW — NOT AN OFFICIAL SUBMISSION. NO DEVPOST FIELDS WERE EDITED.**

This file is a copy-ready candidate for the **actual** Devpost fields and uses the **verified M19 Preview**. Never copy historical M8.8 Preview links or the older production alias as the M19 demo.

## Live authority and status, checked 2026-11-08

| Item | Verified observation |
| --- | --- |
| Live Devpost project | [Specter Audit — Trust the Evidence](https://devpost.com/software/specter-audit-trust-the-evidence), project 1526738; state `published` |
| Kiroween entry | **NOT SUBMITTED**: the Devpost project reports `submitted_at: null` |
| Currently configured Devpost website | `https://specter-audit.vercel.app` — older production release |
| Video on Devpost | `video_url: null` |
| Public recommended M19 demo | https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/ |
| Exact M19 source SHA | `09952ed7e2728cdc030051ee14c66e61d0953d98` |
| M19 public GitHub branch | https://github.com/ShenJun93/specter-audit/tree/feat/m19-judge-first-run |
| M19 CI signed receipt | https://github.com/ShenJun93/specter-audit/actions/runs/42451296583 — 524/524 tests, authentic GitHub provenance verified with correct signer/ref/SHA and wrong-SHA negative control rejected |
| M19 Preview acceptance | Six viewport judge E2E + 15 responsive route/viewport checks PASS; 9 static resources match Git bytes and security headers/CSP; 5 sensitive source paths 404; PR #7 read-only opt-in, `OPEN · DRAFT`, `RUNS OBSERVED, NOT CERTIFIED` |
| GitHub repo public license | https://github.com/ShenJun93/specter-audit — public, MIT license detected by GitHub; root `.kiro/specs` and `.kiro/steering` visible on `main` and M19 |
| Default GitHub branch | `main` at `b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e` — **not M19** |
| Production | Older release only; **no promotion authorized** |

**Deadline:** December 4, 2026 at **2:00 PM PST** = December 5, 2026 at **05:00 Vietnam time**. Official rules: https://kiroween.devpost.com/rules and https://kiroween.devpost.com/details/faqs. The public YouTube demo must be under three minutes and show actual functioning software. The live hosted app must stay free and accessible to judges through the judging period.

## Suggested entry

**Title:** Specter Audit — Trust the Evidence

**Tagline:** The tests passed. Then the agent edited the code. Specter follows the evidence.

**Category:** Costume Contest (proposed, **not selected or submitted**). The ghost/dossier courtroom look supports the time-sequenced investigation and is not decoration unrelated to function. Do not claim other categories or special eligibility.

**Code repository:** https://github.com/ShenJun93/specter-audit

**Working demo:** https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/

**Exact version for judges:** https://github.com/ShenJun93/specter-audit/tree/feat/m19-judge-first-run

**Video:** **PENDING** — public YouTube URL only after a real sub-3-minute recording has been reviewed and published. Do not put a local video path or placeholder URL into Devpost.

## Project description — English, copy candidate

> What if an AI agent says "120 tests passed," then changes the source five more times?
>
> **Specter Audit** is a haunted, read-only evidence investigator for AI-assisted software development. It follows the timeline behind completion claims: test receipts, subsequent source edits, Git commit identity and public CI metadata. Instead of turning a fluent "done" into a green badge, it separates what was observed, what can be checked and what remains unknown.
>
> **Start with a real Kiro case — no account or upload.** The Midnight Rewrite uses a redacted, authentic Kiro CLI coding-session exhibit. A recorded tool run reports 120 passing tests, followed by an agent success statement and five successful source edits. No passing retest appears after those edits **within the saved session**. Specter exposes that chronology and returns `STALE_LOCAL_TEST_EVIDENCE`. It does **not** claim the final code is broken or that a test never ran elsewhere.
>
> **Investigate four recorded cases.** Three other exhibits use public GitHub Actions observations and clearly labeled hypothetical claims: a borrowed green result attached to an earlier commit, a run matching the current target SHA, and a dossier without sufficient evidence. Matching provider CI still isn't proof of correctness.
>
> **Inspect a public PR deliberately.** The PR Proof Chain fetches only public GitHub metadata **after the visitor clicks Inspect**. It identifies the observed PR state and matching-head workflows without pretending that green runs certify required checks, source correctness or a Kiro transcript-to-commit link. The public PR #7 currently remains draft.
>
> **Use your own Kiro evidence privately.** The Live Investigator reads a visitor-selected `messages.jsonl` file in the browser, reconstructing supported test/edit/claim chronology without uploading the file. A real local Git inspector can also assess claim-to-path alignment without modifying the repository. Both intentionally return bounded verdicts instead of assuming all statements are independently verified.
>
> **The proof chain has proof boundaries.** M19's GitHub CI ran 524/524 tests; its JSON receipt has verifiable GitHub workflow provenance, which establishes the receipt's source commit and signer. It does **not** sign the local Kiro session or establish semantic correctness.
>
> Built with JavaScript/Node.js 24+, no runtime dependencies, an accessible Halloween-themed investigation UI, and a public MIT-licensed repository. Try the live M19 Preview with no login, inspect the reproducible source or follow the documented exact-SHA CI evidence. Specter Audit: **confidence is earned, not declared.**

## Required field 29622 — How we used Kiro (English; verifiable scope)

> We used **Kiro CLI** for real coding work during the hackathon, not merely to generate a fictional demo. Saved M1 sessions show Kiro editing the original read-only Git inspector and claim evaluator, with a recorded 34-test run. M5A Kiro CLI sessions contributed to the GitHub Actions evidence adapter and test code; a genuine 120-test successful run and later source edits supplied the recorded Midnight Rewrite case. M6E Kiro CLI with Qwen3 Coder Next authored `src/kiro-session-staleness.mjs` and its original tests; five saved implementation sessions contain **18 successful file-write/replacement tool results**. The module was tested, red-teamed and corrected, with clear separation between original Kiro work and later reviews.
>
> The checked-in `.kiro/specs/` and `.kiro/steering/` documents define trust boundaries, chronological evidence rules, requirements and execution tasks. These let us formalize the difference between a tool-observed test, a self-reported claim and a later edit. Kiro sessions directly influenced the product's most memorable example — the agent's own recorded test result became stale relative to its subsequent edits.
>
> **Attribution matters:** ChatGPT/WAG assisted with the haunted frontend, integration work, additional adversarial tests, browser acceptance and CI/release documentation. We do not claim that Kiro authored the whole app. The M9B `PostFileSave` hook was designed and tested synthetically but **was not installed or verified in a real Kiro-native run**, because later CLI requests encountered monthly quota limits. We did not use or verify Kiro Crew, custom running Kiro hooks, MCP, powers or PBT; we do not claim them as completed. See `docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md` and the root `.kiro/` tree for auditability.

## Optional field 29621 — Judge testing instructions (English; no credentials)

> No login is required. Open https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/ and click **Investigate the Midnight Rewrite**. The Alibi Room selects recorded case 04; click **Expose the alibi** to see the 120-test receipt and five later edits and the bounded `STALE_LOCAL_TEST_EVIDENCE` finding. This is a privacy-safe, self-recorded Kiro session excerpt; it is not signed session provenance.
>
> Try cases 01–03 to compare wrong-commit CI, exact-SHA provider CI, and absent evidence. Open **PR proof chain** and click **Inspect this PR** for an opt-in, read-only request to the public PR #7. The PR is draft and any observed CI is not certification. The **Your session** page optionally accepts your own Kiro CLI `messages.jsonl`; processing is browser-local and no personal log is uploaded.
>
> This Preview is the tested **M19** application from `feat/m19-judge-first-run`, SHA `09952ed7e2728cdc030051ee14c66e61d0953d98`. The stable `specter-audit.vercel.app` alias and repository default `main` are older until explicitly promoted/merged. For local setup, use Node.js 24+, Git and the README/Judge Quickstart.

## Optional field 29623 — Preexisting code declaration

**Owner must verify before submission.** The oldest visible repository commit is November 3, 2026, inside the Oct 30–Dec 4 submission period. The project uses native Node/JavaScript, standard tooling, and public GitHub APIs. Do not state "no preexisting code" without separately confirming no assets, copied implementation, proprietary material or substantive pre-hackathon work were reused beyond standard dependencies/templates.

## Form questions: do not guess personal declarations

| Field ID | Expected action |
| --- | --- |
| 29616 | Country of residence: enter truthful country (Vietnam only if accurate) |
| 29617 | Affirm legal age of majority **only if true** |
| 29638 | Affirm eligible jurisdiction **only if true** |
| 29618 | Select **Costume Contest** if proceeding with this category |
| 29619 | Public GitHub repo URL above |
| 29620 | M19 working Preview URL above |
| 29621 | Testing instructions above |
| 29622 | Kiro use and attribution above |
| 29623 | Truthful disclosure of any nonstandard preexisting work |
| 29624–29629 | Optional bonus categories: only opt into categories with actual eligibility and published supporting links. **Best Demo is automatic** |
| 29630 | Whether owner registered for Kiroween 2025: owner must answer |
| 29634 | Submitter type (Individual/Team/Organization): owner must answer |
| 29631 | AWS employment: owner must answer truthfully |
| 29636 | Skill-learning feedback: owner must answer |
| 29637 | Likelihood of using Kiro again: owner must answer |

## Stop-ship and workflow checklist

- [x] Public GitHub repository, MIT license recognized by GitHub, root `.kiro/` exposed.
- [x] M19 exact-SHA CI, GitHub signed artifact, negative control, real-browser Preview acceptance.
- [x] Authentic Kiro CLI implementation and case evidence documented, attribution split explicit.
- [ ] **Public YouTube video under 3 minutes** showing actual M19 site and honest Kiro role; video URL still null.
- [ ] Review and update **live Devpost description and website URL** (currently M8.8 and older production). **Requires explicit owner approval** because it edits a published project.
- [ ] Decide whether to merge the final feature branch into `main`; judges may clone the default branch and otherwise miss M19. No merge without owner approval and independent gates.
- [ ] Complete personal/eligibility questions and category/bonus selection, without invented answers.
- [ ] Press official Devpost Submit, verify submission confirmation and `submitted_at` **before deadline**. Public project publication alone does not submit.
- [ ] Keep judge-accessible URL live through the judging period; verify availability before final submission.
- [ ] If Kiro quota later becomes available, prioritize a genuine M9B PostFileSave capture, but do not make it a false prerequisite for the **already verified M6E Kiro use**.

**Current decision: SUBMISSION NOT READY — video, live Devpost fields, personal declarations, final release/version alignment and official Submit outstanding.**
