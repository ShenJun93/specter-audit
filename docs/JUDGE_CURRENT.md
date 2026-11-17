# Specter Audit — Current Kiroween Judge Guide
Updated: 2026-11-17 (UTC+7). **Current submitted demo: M305** from reviewed main merge commit `4bb872e9`. **V6H was filmed on older M130**, and M204 is a historical post-video demo. M75/V5D, M130 and M204 remain reproducibility anchors, not current judge entries.

## Start here (no account or credentials)

- **Official entry:** https://devpost.com/software/specter-audit-trust-the-evidence — Kiroween submission ID 1281241, originally submitted 2026-11-11 13:01:15 -05:00.
- **Current working demo M305:** https://specter-audit-judge-m305-nvhoa1691993-6852s-projects.vercel.app/
- **Public V6H judge video (2:23):** https://youtu.be/yabjJ5JpsS0 — filmed on M130, not the current M305 demo.
- **Public source:** https://github.com/ShenJun93/specter-audit
- **Current M305 demo source:** [4bb872e96c8a31c88d5ae2876ef2ec7ae3b55a60](https://github.com/ShenJun93/specter-audit/commit/4bb872e96c8a31c88d5ae2876ef2ec7ae3b55a60), the PR #42 merge commit. Post-merge 645/645 CI tests and signed CI receipt passed. The prior independent M300 review addressed the PR head, not general app correctness.
- **Historical M204 source:** [e68b39d7619dc69ab28fd945f7a326961be1f220](https://github.com/ShenJun93/specter-audit/commit/e68b39d7619dc69ab28fd945f7a326961be1f220); [then-current main 8079e6f](https://github.com/ShenJun93/specter-audit/commit/8079e6fcf6e2a9bd24890977443c5d1e27a0d0c1) shared its source tree.
- **V6H filmed source M130:** [d8f8e7a9551db4046f144924a3bfbc8735a09e8b](https://github.com/ShenJun93/specter-audit/commit/d8f8e7a9551db4046f144924a3bfbc8735a09e8b); separate historical preview: https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/
- **Submission receipt:** On 2026-11-17, M305 URL, mandatory demo field, Testing Instructions and public project description were saved and read back from the existing Kiroween submission #1281241. Devpost remained published and SUBMITTED, with original submission time and V6H video unchanged; no Submit/Resubmit. [Historical M204 release gate #30](https://github.com/ShenJun93/specter-audit/issues/30) covers the previous build.

## One-minute judge path — live M305

1. Open **M305** from the link above. Activate **JUDGE FAST PATH → INVESTIGATE THE MIDNIGHT REWRITE**.
2. Wait for **4 recorded exhibits** and the heading **The midnight rewrite** (Case 04). Click **Reveal finding now**. This version fixes the prior delayed Case 04 load/reveal race.
3. Observe **STALE LOCAL TEST EVIDENCE**: a redacted saved Kiro CLI session reports 120 passing tests followed by five successful edits, with no later passing retest observed **in that session**. This does **not** prove the code broke or rule out other test runs.
4. Choose Case 03 (**The empty dossier**) to see **INSUFFICIENT EVIDENCE**; absence of a receipt is not proof of failing tests.
5. Open **Specter Arena**. Its owner-controlled synthetic PR fixture reports **Base FAIL → Head PASS** for one behavior test and classifies `DEMONSTRATED FIX`. The browser displays self-reported evidence and does not independently run Docker, attest external execution or authorize a merge. Optionally try **Copy scoped review note**, introduced after the V6H filming.
6. Optional: **PR Proof Chain** fetches public provider CI after explicit user action. **Your Kiro Session** can analyze visitor-selected `messages.jsonl` in-browser; private logs are not needed for the judge demo.

**Observed 2026-11-17 M305 scope:** homepage → Case 04 → STALE, Case 03 → INSUFFICIENT, Arena DEMONSTRATED FIX and review-note copy feedback; synthetic orphan/failed-edit import cases remained INSUFFICIENT, and a normal passing test remained CURRENT. Chrome mobile 390 px and 320 px passed 16/16 bounded gates, with no console errors/failed requests in the scoped run. These do not constitute an independent human study or general security certification.

**Historical M130 caveat:** simulated delayed loading yielded 1/4 passing checks on M130 versus 4/4 on the historical M204 fix. M305 retains the Case 04 UX fix and adds fail-closed session-importer protections. Use M130 to reproduce V6H filming; M305 is the active judge path.

## Why Kiro matters

For a one-page, cross-linked provenance ledger, see the [Kiro Technology evidence index](competition/KIRO_TECHNOLOGY_EVIDENCE_INDEX_20261116.md); the summary below distinguishes Kiro CLI edits from later ChatGPT/WAG QA.

Kiro CLI was used for actual source/test implementation, distinct from later ChatGPT/WAG development:
- **M1:** Git inspector / claim-evaluator source and tests. [Commit](https://github.com/ShenJun93/specter-audit/commit/9896ccd9851d5559983f511187ac71ce85f0db10).
- **M5A:** GitHub Actions evidence adapter / tests, authentic recorded 120 PASS followed by five source edits. [Commit](https://github.com/ShenJun93/specter-audit/commit/99e210da586c2129de9e306c0aae0bb379bd3e53).
- **M6E:** initial local Kiro-session staleness auditor / tests; redacted saved Kiro sessions. [Commit](https://github.com/ShenJun93/specter-audit/commit/950acf93e92417820d9564c7cd3da7fba6030e99); [evidence report](competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md).
- **M118:** Kiro CLI wrote the first version of `src/arena-case-report.mjs` and corresponding test file; tool permission prevented its noninteractive test run. ChatGPT/WAG performed test corrections and Docker integration. [Bounded Kiro receipt](competition/M118_NATIVE_KIRO_RECEIPT_20261112.md).
- Root `.kiro/specs/` and `.kiro/steering/` provide project requirements, trust boundaries and task records.

Local Kiro transcripts are editable self-records, not signed independent proof of authorship. No functioning deployed Kiro hook, Crew, agent, MCP, power or PBT is claimed here. The later **M204 review-note feature was implemented by ChatGPT/WAG**, not Kiro; its attempted Kiro CLI invocation was blocked before generation.

## Reproduce the filmed source

Node.js 24+ and Git, zero runtime package dependencies:

```sh
git clone https://github.com/ShenJun93/specter-audit.git
cd specter-audit
git checkout --detach d8f8e7a9551db4046f144924a3bfbc8735a09e8b
npm run check
npm test
npm run demo
```

The same source can be explored as a local Git metadata investigator with `node src/http-server.mjs --repo="<path-to-local-repo>"`. This explicitly selected repository is inspected read-only; it does not independently run tests or certify semantic correctness. The CI runner's source and any reported green run have separate scope from local Kiro logs.

## Boundaries for judges

- `SUPPORTED` in the Git-path alignment engine means matching changed-path evidence, **not** passing tests.
- `PROVIDER_REPORTED_UNATTESTED` means provider metadata, **not** full test coverage or correctness.
- `STALE LOCAL TEST EVIDENCE` means the observed test was earlier than later edits in one saved session; other runs are unknown.
- `DEMONSTRATED_FIX` is **one owner-controlled behavior test** passing on head and failing on base; no independent attestation, merge approval, or broad security guarantee.
- No real external adoption or 3–5-person independent reviewer study is claimed. **Current M305 first-use invitation:** [M305 five-minute task and public feedback Issue #28](https://github.com/ShenJun93/specter-audit/issues/28); 0 completed independent human evaluations as of 2026-11-17. The [M203 task sheet](competition/M203_REVIEWER_PROMPT_20261115.md) is historical M130. [Current operator protocol](competition/M203_EVALUATOR_PROTOCOL_20261115.md) keeps scoring separate from the first-use task. The [older M122 study](competition/M122_EXTERNAL_REVIEWER_STUDY_20261112.md) is a historical, not-conducted snapshot and points to an earlier M121 Preview.
- Historical **M75 demo** and **V5D video** are preserved for version comparison, not the current submission.

For longer historical technical notes, see [the previous Judge Quickstart](JUDGE_QUICKSTART.md). The live Devpost entry is the authority for current submission links and status.
