# Specter Audit — Current Kiroween Judge Guide
Updated: 2026-11-14 (UTC+7). This is the current submission reference; older M75/V5D references elsewhere in this repository are historical snapshots.

## Start here (no account or credentials)

- **Official entry:** https://devpost.com/software/specter-audit-trust-the-evidence — existing Kiroween submission ID 1281241, originally submitted 2026-11-11 at 13:01:15 -05:00.
- **Working demo M130:** https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/
- **Public judge video V6H (2:23):** https://youtu.be/yabjJ5JpsS0
- **Public source:** https://github.com/ShenJun93/specter-audit
- **Video's exact filmed source:** [d8f8e7a9551db4046f144924a3bfbc8735a09e8b](https://github.com/ShenJun93/specter-audit/commit/d8f8e7a9551db4046f144924a3bfbc8735a09e8b).
- **Integrated main at 2026-11-14 verification:** [19dff09130178995e1cdbe63be7da6704a3770e3](https://github.com/ShenJun93/specter-audit/commit/19dff09130178995e1cdbe63be7da6704a3770e3). Distinct Git commits, equivalent source tree as documented in the M182 release receipt. New main commits may appear later.

## One-minute judge path

1. Open M130. Activate **JUDGE FAST PATH → INVESTIGATE THE MIDNIGHT REWRITE**.
2. Select **Case 04: The Midnight Rewrite** if not already selected; click **EXPOSE THE ALIBI**.
3. Observe **STALE LOCAL TEST EVIDENCE**: a redacted saved Kiro CLI session records 120 passing tests, followed by five successful source edits, without a later passing retest observed **in that session**. This does **not** prove the code broke or rule out testing elsewhere.
4. Open **Specter Arena**. The owner-controlled synthetic PR fixture shows **Base FAIL → Head PASS** for one reviewer-selected behavior test, classified **DEMONSTRATED_FIX**. The browser displays a saved self-reported runner receipt; it does not execute Docker or attest to a real customer's PR.
5. Optional: **PR Proof Chain** inspects public GitHub provider metadata after explicit click. **Your Kiro Session** handles a visitor-selected messages.jsonl in-browser; no private file is needed to try the judge path.

The M130 home → Case 04 → EXPOSE THE ALIBI flow and Arena page were exercised in headless browser QA on 2026-11-14. This is a bounded smoke check, not comprehensive cross-browser/security certification.

## Why Kiro matters

Kiro CLI was used for actual source/test implementation, distinct from later ChatGPT/WAG development:
- **M1:** Git inspector / claim-evaluator source and tests. [Commit](https://github.com/ShenJun93/specter-audit/commit/9896ccd9851d5559983f511187ac71ce85f0db10).
- **M5A:** GitHub Actions evidence adapter / tests, authentic recorded 120 PASS followed by five source edits. [Commit](https://github.com/ShenJun93/specter-audit/commit/99e210da586c2129de9e306c0aae0bb379bd3e53).
- **M6E:** initial local Kiro-session staleness auditor / tests; redacted saved Kiro sessions. [Commit](https://github.com/ShenJun93/specter-audit/commit/950acf93e92417820d9564c7cd3da7fba6030e99); [evidence report](competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md).
- **M118:** Kiro CLI wrote the first version of `src/arena-case-report.mjs` and corresponding test file; tool permission prevented its noninteractive test run. ChatGPT/WAG performed test corrections and Docker integration. [Bounded Kiro receipt](competition/M118_NATIVE_KIRO_RECEIPT_20261112.md).
- Root `.kiro/specs/` and `.kiro/steering/` provide project requirements, trust boundaries and task records.

Local Kiro transcripts are editable self-records, not signed independent proof of authorship. No functioning deployed Kiro hook, Crew, agent, MCP, power or PBT is claimed here.

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
- No real external adoption or 3–5-person independent reviewer study is claimed. **Current M130 first-use invitation:** [neutral reviewer tasks](competition/M203_REVIEWER_PROMPT_20261115.md) · [Issue #28](https://github.com/ShenJun93/specter-audit/issues/28); 0 completed independent human evaluations as of 2026-11-15. [Current operator protocol](competition/M203_EVALUATOR_PROTOCOL_20261115.md) keeps scoring separate from the first-use task. The [older M122 study](competition/M122_EXTERNAL_REVIEWER_STUDY_20261112.md) is a historical, not-conducted snapshot and points to an earlier M121 Preview.
- Historical **M75 demo** and **V5D video** are preserved for version comparison, not the current submission.

For longer historical technical notes, see [the previous Judge Quickstart](JUDGE_QUICKSTART.md). The live Devpost entry is the authority for current submission links and status.
