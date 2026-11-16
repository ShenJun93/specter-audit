# Specter Audit — Current Kiroween Judge Guide
Updated: 2026-11-16 (UTC+7). **Current submitted demo: M204**. The existing public **V6H video was filmed on older M130**; these represent different source commits. M75/V5D and M130 source links are historical reproducibility anchors, not the new judge entry.

## Start here (no account or credentials)

- **Official entry:** https://devpost.com/software/specter-audit-trust-the-evidence — Kiroween submission ID 1281241, originally submitted 2026-11-11 13:01:15 -05:00.
- **Current working demo M204:** https://specter-audit-io6tf1aor-nvhoa1691993-6852s-projects.vercel.app/
- **Public V6H judge video (2:23):** https://youtu.be/yabjJ5JpsS0 — **filmed on M130**, not M204.
- **Public source:** https://github.com/ShenJun93/specter-audit
- **M204 demo source:** [e68b39d7619dc69ab28fd945f7a326961be1f220](https://github.com/ShenJun93/specter-audit/commit/e68b39d7619dc69ab28fd945f7a326961be1f220). [Merged main checkpoint 8079e6f](https://github.com/ShenJun93/specter-audit/commit/8079e6fcf6e2a9bd24890977443c5d1e27a0d0c1) shared its exact Git source tree.
- **V6H filmed source M130:** [d8f8e7a9551db4046f144924a3bfbc8735a09e8b](https://github.com/ShenJun93/specter-audit/commit/d8f8e7a9551db4046f144924a3bfbc8735a09e8b); separate historical preview: https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/
- **Submission receipt:** On 2026-11-16, owner-approved M204 demo, Testing Instructions and Kiro Technology answers were saved and read back from the existing authenticated Additional info form. Devpost project description/links were updated to M204; project remained `published` and the original submit timestamp was unchanged. [Release-gate issue #30 completed](https://github.com/ShenJun93/specter-audit/issues/30). No Submit/Resubmit used.

## One-minute judge path — live M204

1. Open **M204** from the link above. Activate **JUDGE FAST PATH → INVESTIGATE THE MIDNIGHT REWRITE**.
2. Wait for **4 recorded exhibits** and the heading **The midnight rewrite** (Case 04). Click **Reveal finding now**. This version fixes the prior delayed Case 04 load/reveal race.
3. Observe **STALE LOCAL TEST EVIDENCE**: a redacted saved Kiro CLI session reports 120 passing tests followed by five successful edits, with no later passing retest observed **in that session**. This does **not** prove the code broke or rule out other test runs.
4. Choose Case 03 (**The empty dossier**) to see **INSUFFICIENT EVIDENCE**; absence of a receipt is not proof of failing tests.
5. Open **Specter Arena**. Its owner-controlled synthetic PR fixture reports **Base FAIL → Head PASS** for one behavior test and classifies `DEMONSTRATED FIX`. The browser displays self-reported evidence and does not independently run Docker, attest external execution or authorize a merge. Optionally try **Copy scoped review note**, introduced after the V6H filming.
6. Optional: **PR Proof Chain** fetches public provider CI after explicit user action. **Your Kiro Session** can analyze visitor-selected `messages.jsonl` in-browser; private logs are not needed for the judge demo.

**Observed 2026-11-16 M245–M246 scope:** unauthenticated browser path homepage → Case 04 → STALE verdict, Case 03 → INSUFFICIENT verdict, Arena DEMONSTRATED FIX, and review-note copy feedback; zero console errors, failed requests or uncaught exceptions in the scoped run. This is **not** a full cross-browser, independent security, or correctness certification.

**Historical M130 caveat (not applicable to the updated submitted demo):** deterministic simulated slow responses yielded 1/4 passing checks on M130 versus 4/4 on the M204 fix, because pre-load Reveal and late case-selection could race. Use old M130 only to reproduce the V6H filmed behavior; M204 is the active judge path.

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
- No real external adoption or 3–5-person independent reviewer study is claimed. **Current M204 first-use invitation:** [current M204 five-minute task and public feedback Issue #28](https://github.com/ShenJun93/specter-audit/issues/28); 0 completed independent human evaluations as of 2026-11-16. The [M203 task sheet](competition/M203_REVIEWER_PROMPT_20261115.md) is historical M130. [Current operator protocol](competition/M203_EVALUATOR_PROTOCOL_20261115.md) keeps scoring separate from the first-use task. The [older M122 study](competition/M122_EXTERNAL_REVIEWER_STUDY_20261112.md) is a historical, not-conducted snapshot and points to an earlier M121 Preview.
- Historical **M75 demo** and **V5D video** are preserved for version comparison, not the current submission.

For longer historical technical notes, see [the previous Judge Quickstart](JUDGE_QUICKSTART.md). The live Devpost entry is the authority for current submission links and status.
