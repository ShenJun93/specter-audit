# M7 — Kiro CLI session compatibility matrix (2026-11-05)

This matrix describes **verified inputs**, not all Kiro CLI versions. A valid JSONL file alone does not guarantee a verdict. The parser operates on one selected local `messages.jsonl`; a claim requires tool-result evidence, and all statuses are scoped to **self-recorded** events in that saved file.

| Input family | Evidence | Status | User-facing claim allowed |
| --- | --- | --- | --- |
| Actual M5A Kiro CLI session | Observed locally: 288 events, 2 parsed tests (120 PASS before claim; 36 PASS after claim), 11 successful edits with 6 later than both tests, 2 redacted paths | `STALE_LOCAL_TEST_EVIDENCE` | Later edits establish staleness **in this file**; post-claim tests cannot retroactively support the claim |
| Actual other Kiro sessions in the same Specter workspace | 14 additional local files in a bounded 15-file scan: 13 without a supported explicit test-passed claim; one with incomplete tool evidence | Insufficient, without inventing CURRENT or STALE | Missing a supported claim **does not prove** tests were absent; only sanitized event/tool counts shown |
| Supported synthetic modern Kiro event shape | Node tests cover `tool_call`/`tool_result` with shared ID, `assistant/Say`, `node --test` and `npm test`, PowerShell output-only filtering | `CURRENT_SELF_RECORDED_TEST` or `STALE_LOCAL_TEST_EVIDENCE`, according to chronology | Self-recorded only; **not** independent evidence |
| Actual older M1 Kiro session | Earlier local audit found insufficient or unsupported test receipts for parser-recognized shapes | `INSUFFICIENT_SESSION_EVIDENCE` or a safe parser error | Cannot assert that tests passed; exact legacy coverage remains unverified |
| Failed/incomplete/unknown tools; mixed shell commands | Negative red-team tests cover failures, unmatched results and unknown shell effects | Fail closed / insufficient | No promotion to `CURRENT` without supported evidence |
| Later explicit agent correction retracting a PASS | Two new regression tests: retraction prevents old PASS; later new affirmative claim can be independently evaluated | Safe error `LATER_AGENT_TEST_CLAIM_RETRACTED` until a newer valid claim | Previous PASS is not active |
| Other Kiro releases, IDE-only activity, exported schemas, merged sessions | Not independently tested | **Unknown / unsupported** | No broad version-compatibility claim |

## What is recognized

- Timestamped Kiro CLI JSONL with `payload.type` values `tool_call`, `tool_result`, and `assistant` with `operationType: Say`; unique `toolCallId` pairing.
- Completed test tools: only bounded `execute_pwsh` test invocations and output-only filters with explicit matching pass/fail/exit counts.
- Completed source mutations: `fs_write` and `str_replace`, with sanitized paths or synthetic redacted file names.
- Claims: limited explicit affirmative test-passed statements; a later explicit retraction blocks the earlier affirmative claim.
- When there is **no supported affirmative claim**, the importer still returns `input:null` and `NO_RECORDED_AGENT_TEST_CLAIM`, plus only bounded event/tool-call/tool-result counts. The browser displays an `INSUFFICIENT` panel with no inferred test freshness.
- Unsupported source-modifying shell calls and missing or unsuccessful tool results are not silently treated as clean.
- Parentheses within a quoted read-only `Select-String` regex filter are supported; PowerShell expansion, backtick escape and unquoted grouping fail closed.
- Later test completions are observed chronology, not proof of an earlier claim. To return STALE with post-claim tests, there must also be a valid pre-claim PASS, every post-claim test must pass and a successful source edit must finish after all tests. Otherwise the post-claim chronology is insufficient.
- Test and edit/unverified operation intervals are compared from tool call to tool result. Overlap, including same-millisecond boundaries, is insufficient; a test finishing after an edit does **not** prove it began after that edit. The parser returns `OVERLAPPING_RELEVANT_TOOL_OPERATIONS` rather than inventing CURRENT or STALE.

The 15-file scan covers one existing Kiro workspace, not a representative
sample of all Kiro versions. A private second-session Chrome test was
blocked by tool safety checks; synthetic Chrome QA passed. Neither
substitutes for independent human review.

## Limitations and independent test protocol

1. Ask an independent reviewer to use a **different real Kiro session**, without sending or uploading its raw content. Record only Kiro version, event counts, supported/unsupported tool families, sanitized verdict and a manual chronology agreement result.
2. Verify three cases independently: a known stale session, a known-current *self-recorded* session, and a genuinely insufficient/unsupported session.
3. Record Chrome desktop/mobile results and inspect network requests **after** file selection. Do not equate zero requests in one QA interaction with a privacy guarantee.
4. If old M1 syntax is confirmed, add a narrow parser extension and adversarial regression first; never silently reinterpret an unknown command as a valid PASS.
5. Only after a separate branch commit: require exact-commit CI, Vercel Preview and live Chrome acceptance. Do not change PR #3 or production without owner approval.

**Source-of-truth:** implementation and tests in this repository. The prior M5A/M1 observations are documented in `M7_LOCAL_RELEASE_REVIEW_20261105.md`; they are not a new independent review.
