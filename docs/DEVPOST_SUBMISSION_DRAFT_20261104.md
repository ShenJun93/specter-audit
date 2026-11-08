# Kiroween 2026 — Specter Audit submission draft (historical 2026-11-04)

**SUPERSEDED FOR FINAL PREPARATION:** This document describes the older M5L/M8.8 experience. Use [M20 Devpost submission candidate](competition/M20_DEVPOST_SUBMISSION_CANDIDATE_20261108.md) for the M19 exact-SHA Preview, current Devpost field status, attribution and submission gates. **NOT OFFICIALLY SUBMITTED; no YouTube video is available.**

**Historical status: DRAFT, NOT SUBMITTED.** Based on verified production behavior as of 2026-11-04. Preserve below for provenance; do not copy the old production URL into the live submission.

## Required details

- Title: **Specter Audit — Trust the Evidence**
- Suggested category: **Costume Contest** (the project uses a haunting investigator UI and visible evidence boundaries; this category is a proposal, not yet selected in Devpost).
- Public GitHub: https://github.com/ShenJun93/specter-audit
- Working application: https://specter-audit.vercel.app
- License: MIT (`LICENSE`); root `.kiro/` exists.
- Video: **PENDING** — publish to public YouTube under 3 minutes and insert the actual URL.
- Submission deadline: **2026-12-04 22:00 UTC / 2026-12-05 05:00 UTC+7**, confirmed via Devpost.
- Devpost account: registered for Kiroween 2026; Specter Audit submission **not yet submitted** at time of this draft.

## Tagline

When an AI agent says "done," Specter asks what Git actually proves.

## Description (English)

Specter Audit is a local-first, read-only evidence investigator for AI-generated completion claims. Rather than trusting an agent's confident "all tests pass," it compares the natural-language claim with Git working-tree and index metadata and explains which parts of the statement are supported, partially aligned, or unverified.

Three high-contrast verdicts make the trust boundary visible: **UNVERIFIED** when no independent test-run evidence exists, **PARTIAL** when the changed files relate to a claim but its test assertion is unsupported, and **SUPPORTED** when Git path evidence aligns with a change-only claim. SUPPORTED explicitly does **not** mean the code is correct.

The application deliberately does not execute untrusted commands, open source contents, modify the inspected repository or treat pasted test receipts as independent attestation. Git subprocesses are called with argument arrays, no shell execution. The local server binds to loopback.

The public hosted judge demo makes this inspectable in seconds using a conspicuously labeled **synthetic Git snapshot** and the same live claim evaluator. Judges can reproduce three examples without credentials or installing anything, or run a disposable local Git fixture for a real read-only inspection. A separate optional CI evidence panel shows a timestamped GitHub Actions record pinned to a published commit. It is not a signature, cannot validate arbitrary repository claims and never upgrades the claim verdict.

This is a working, bounded evidence tool rather than an autonomous code auditor that claims to understand code correctness.

## Kiro use (accurate authorship statement)

Kiro CLI was used for the initial Git inspector implementation (M1) and contributed to the early opt-in GitHub Actions adapter (M5A/M5B). The checked-in `.kiro/specs/specter-audit/` requirements and tasks and `.kiro/steering/product.md` describe the read-only trust boundary, verdict semantics, design and constraints. Genuine Kiro CLI read-only security-review sessions also identified targeted warnings that were remediated. **Subsequent API/UI, security hardening, hosted release engineering and regression work were performed using ChatGPT/WAG-assisted tooling**, so those parts are not presented as Kiro-authored. The full public Git history and documents are the audit trail.

Before final submission, independently verify and capture Kiro session artifacts that support each claim above. Do not claim use of Kiro Crew, Kiro hooks, MCP or property-based testing unless implementation and evidence exist.

## Judge testing instructions

1. Open https://specter-audit.vercel.app (no login required).
2. Try `all tests pass` -> `UNVERIFIED`.
3. Try `updated auth login and all tests pass` -> `PARTIAL`.
4. Try `updated auth login validation` -> `SUPPORTED` (path alignment only).
5. Inspect the evidence/gaps, then open the separate Public CI evidence panel to view a timestamped GitHub run and source link.
6. For true local Git inspection, clone the repo and run `npm run demo` (Node 24+, Git); see `docs/JUDGE_QUICKSTART.md`.

The hosted demonstration cannot inspect your local filesystem. The GitHub CI record refers only to its pinned published commit, not a test execution of your arbitrary claim.

## Pending form details (do NOT invent)

Country of residence, age-of-majority and eligible-jurisdiction affirmations, 2025 Kiroween participation, submitter type, AWS employment status, Kiro learning feedback, and future usage preference require truthful answers from the submitter. Bonus prizes should be selected only where eligibility and required evidence are real. The **Best Demo** bonus requires no separate entry according to current Devpost requirements.

## Submission checklist

- [ ] Confirm exact production commit and public CI snapshot matches the intended release.
- [ ] Confirm license detectable on GitHub About and root `.kiro/` public.
- [ ] Publish real under-three-minute YouTube video, with clear audible Kiro proof and no copyrighted audio.
- [ ] Verify actual Kiro session provenance and capture reproducible screen footage.
- [ ] Enter all required personal/eligibility fields accurately.
- [ ] Submit project through Devpost and record confirmation URL/time before deadline.
