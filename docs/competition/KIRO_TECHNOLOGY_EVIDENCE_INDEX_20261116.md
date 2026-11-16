# Specter Audit — Kiro implementation evidence

**Kiroween 2026 · Technology Implementation · evidence index, updated 2026-11-16.** This page is a navigational aid for judges, **not** new Kiro-generated code, a Kiro feature demo, or independent authorship attestation. The [live Devpost entry](https://devpost.com/software/specter-audit-trust-the-evidence) is authoritative for submission status.

## The 60-second verification route

1. Open the **[submitted M204 demo](https://specter-audit-io6tf1aor-nvhoa1691993-6852s-projects.vercel.app/)**, choose **JUDGE FAST PATH → INVESTIGATE THE MIDNIGHT REWRITE**, wait for Case 04 to load, then reveal **STALE LOCAL TEST EVIDENCE**. It shows an *editable, saved Kiro CLI session*: 120 reported passing tests **before** five later recorded source edits with no newer passing retest *observed in that session*. This does **not** establish broken code or that no tests ran elsewhere.
2. Open the **M1, M5A and M6E source commits** below. These establish committed code and their historical scope; they do not cryptographically establish which agent wrote every line. Compare their filenames with the [current source tree](../../src/).
3. Read the [M6E redacted-session evidence report](M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md) and the [M118 bounded CLI implementation receipt](M118_NATIVE_KIRO_RECEIPT_20261112.md). The original unredacted CLI transcripts remain private.
4. Inspect the [current judge guide](../JUDGE_CURRENT.md) for the exact M204 demo / older M130-filmed V6H distinction and which claims the UI does not make.

## Public provenance ledger

| Milestone | What the saved Kiro CLI receipts support | Public verification | Attribution boundary |
| --- | --- | --- | --- |
| **M1 · 2026-11-03** | Kiro CLI created foundational Git inspector / claim evaluator source and tests. The saved session recorded **34 PASS / 0 FAIL**. | [Commit 9896ccd](https://github.com/ShenJun93/specter-audit/commit/9896ccd9851d5559983f511187ac71ce85f0db10), [current inspector](../../src/git-inspector.mjs), [claim evaluator](../../src/claim-evaluator.mjs) | Later security maintenance modified the inspector; do **not** ascribe all present-day code to Kiro. |
| **M5A · 2026-11-03** | Kiro CLI implemented the public GitHub Actions evidence adapter and its tests. A stored CLI run reported **120 PASS / 0 FAIL**; **five successful source replacements** followed in that same saved session, with no later passing retest observed there. | [Commit 99e210d](https://github.com/ShenJun93/specter-audit/commit/99e210da586c2129de9e306c0aae0bb379bd3e53), [adapter](../../src/github-actions-evidence.mjs), [adapter tests](../../test/github-actions-evidence.test.mjs), [evidence report](M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md) | The recorded passing result is stale with respect to later edits in that session; neither local logs nor public CI certify correctness. |
| **M6E · 2026-11-04** | Kiro CLI 2.37.1 with Qwen3 Coder Next created and revised an initial local-session staleness auditor and its tests; five saved sessions recorded **18 successful file-write/replace results**. | [Commit 950acf9](https://github.com/ShenJun93/specter-audit/commit/950acf93e92417820d9564c7cd3da7fba6030e99), [M6E report](M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md), [current auditor](../../src/kiro-session-staleness.mjs) | Additional red-team tests, fixture corrections and later auditor changes were performed with ChatGPT/WAG and other tools. |
| **M118 · 2026-11-12** | Kiro CLI 3.1.0 performed actual source/test **Write File** actions for an early Arena case-report module and tests; its noninteractive **Run Command** was denied by tool permissions. | [Bounded receipt](M118_NATIVE_KIRO_RECEIPT_20261112.md), [current report module](../../src/arena-case-report.mjs), [tests](../../test/arena-case-report.test.mjs) | No Kiro test-run success is claimed for M118. ChatGPT/WAG corrected tests and integrated the Docker-based reviewer challenge. |

## Strategy and experimentation (aligned with the judging criterion)

- **Thoughtful AI-development strategy:** committed [Kiro steering](../../.kiro/steering/product.md) defines read-only Git, no arbitrary shell execution, limited trust vocabulary and evidence provenance. [Root Kiro specs](../../.kiro/specs/) specify requirements and tasks. Their presence is verifiable; their authorship by a particular agent is **not** independently attested.
- **Core Kiro coding work:** actual CLI file edits to engine/adapter/auditor/test code, not just ideation. Public commits and bounded local session reports establish the *scope of the claim*.
- **Experimentation and failure handling:** the M5A stale-test sequence became a public Case 04; M6E adversarial tests reproduced false positives before remediation; M118 explicitly records the blocked tool permission instead of inventing a passing test.
- **Variety of Kiro features — known limit:** verified CLI file-edit workflow and project specs/steering are the primary Kiro evidence. **No functioning native Kiro hook, Crew app, custom agent, MCP, power or PBT is claimed.** These are opportunities not proven contributions, and should not be added to a score narrative without real receipts.

## Current release and no-overclaim checklist

- **Live M204 source:** [e68b39d](https://github.com/ShenJun93/specter-audit/commit/e68b39d7619dc69ab28fd945f7a326961be1f220); its deployed Git tree matches merged [8079e6f](https://github.com/ShenJun93/specter-audit/commit/8079e6fcf6e2a9bd24890977443c5d1e27a0d0c1). The currently submitted demo is a specific Vercel deployment; later `main` merges are **not** silently deployed.
- **Official V6H video** [on YouTube](https://youtu.be/yabjJ5JpsS0) was filmed from **older M130 source d8f8e7a**, before the M204 Case 04 loading-race fix and Arena review-note copy feature. Do not claim video and current demo use the same exact commit.
- **M204 Arena review-note copy** was implemented by ChatGPT/WAG, **not** Kiro. Do not attribute unrelated UI integration or independent review/security certification to Kiro.
- Original raw Kiro session logs are **not** published; the local reports are editable self-records. Their SHA-256 fingerprints only detect differences relative to captured bytes; they are **not signatures**.
- No independent human evaluations completed as of 2026-11-16; [voluntary reviewer issue #28](https://github.com/ShenJun93/specter-audit/issues/28) is a separate, optional user study, not Kiro authorship proof.

**Judge takeaway:** there are multiple real Kiro-assisted source/test milestones with clear, reproducible public source links, a distinctive experiment that identifies stale local test evidence, and explicit boundaries. The evidence supports meaningful Kiro CLI usage, **not** breadth across unimplemented Kiro features or independently verified authorship/correctness.
