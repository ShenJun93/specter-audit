# M7 — Your Session, Your Evidence: local release review

**Audit date:** 2026-11-05 (Asia/Ho_Chi_Minh)

**State:** Local-only candidate on `feat/agent-alibi-v2`, committed HEAD
`156efb1fb0a5f771af9d39f66aae626432a142a4`.
M7 has **uncommitted** source/UI/spec/tests in the worktree. M7 is **not**
part of Ready-for-review PR #3, its Vercel Preview or production. No
merge, push or production deployment occurred in this audit.

## Top-three product improvement

The four existing Alibi Room cases are prerecorded exhibits. M7 adds
`/live.html`, a user-selectable, client-side Kiro CLI `messages.jsonl`
investigation. The browser runs a pure dependency-free JSONL parser and
the bounded `auditLocalSession` engine, renders a tool-observed timeline
and labels timestamps, source edit counts, redacted paths and
`STALE_LOCAL_TEST_EVIDENCE`/`CURRENT_SELF_RECORDED_TEST`/
`INSUFFICIENT_SESSION_EVIDENCE`. The current verdict is always
**self-recorded local evidence**, not an independent attestation.

The tab does not upload the chosen file; the local browser QA observed
zero network requests after the file selection and zero console errors.
This does not prove privacy against malicious browser extensions or
future changes to same-origin web assets. A session file is editable and
may omit activities that occurred outside the recording.

## Red-team reproduced before remediation

`test/kiro-session-import.temporal-redteam.test.mjs` was executed before
code fixes. Initial results: **1 PASS / 5 FAIL** among six adversarial
cases. Reproduced false-positives included:
1. A test tool finishes after the agent claim but is counted as earlier
   evidence because the importer used tool *call* time.
2. A source edit finishes after a passing test but is counted as
   preceding it.
3. A later failed test tool event is dropped, leaving an old PASS.
4. Negated/conditional claim text is interpreted as affirmative.
5. An unknown PowerShell source modification is ignored.

A second new test for a **failed file-write tool** initially failed too:
partial mutation is possible even when the tool reports failure.

## Remediation and bounded semantics

- All relevant tests/edits use **tool result completion time**.
- Match the latest affirmative agent claim to actual tool result
  evidence; negative, conditional and contradicted statements are
  rejected. A leading complete affirmative sentence may contain a
  bounded parenthetical note, as seen in older Kiro logs.
- A failed/missing/unparsed tool result remains uncertain. A newer
  observed PASS or successful source edit can supersede *earlier*
  uncertainty, but unresolved operations at/after the last observed
  evidence prevent verdict elevation. Unknown shell commands or
  unsupported tools are **not silently assumed read-only**.
- Shell test invocation must start with `node --test` or `npm test`.
  Only a small, quote-aware, read-only output pipeline using
  `Select-String`, `Select-Object` or `Out-String` is recognized.
  Mixed test/write scripts and arbitrary shell chains fail closed.
- Source paths are stripped to bounded repository-relative paths,
  otherwise replaced by redacted synthetic labels. Raw prompts, tool
  commands and local home paths are not returned to the browser UI.
- `src/kiro-session-staleness.mjs` also has an ordering correction:
  latest passing test is selected by normalized timestamp, not input
  array order.

## Evidence and verification

| Gate | Observed result |
| --- | --- |
| Expanded standalone importer red-team + original importer tests | 31/31 PASS |
| Full Node test suite | **276 PASS, 0 FAIL** |
| `npm run check` / deterministic build of web ESM modules | PASS |
| `git diff --check` | PASS |
| Authentic local M5A Kiro log | 288 events, 2 parsed tests, 11 successful edits, 2 redacted paths, `STALE_LOCAL_TEST_EVIDENCE` |
| Authentic older M1 Kiro log | Unsupported/insufficient; **no invented PASS** |
| Chrome desktop file-input test | Real local Kiro log, `STALE_LOCAL_TEST_EVIDENCE`, 14 sanitized chronology events |
| Chrome mobile width 390px | PASS; no horizontal overflow |
| Network requests after local file read | **0** in tested interaction |
| Browser console errors | **0** |

QA artifacts remain in ignored folder:
`qa/private/specter-m7-live-20261104/`. Raw local Kiro logs were not
copied into Git. Full test output, browser receipt and screenshots are
local evidence, not proof of source correctness.

## Kiro authorship

The earlier M6E local-session staleness engine
`src/kiro-session-staleness.mjs` was genuinely created/revised by Kiro
CLI and has recorded successful edit tool calls. The **M7 JSONL parser,
red-team tests, browser flow and integration were authored by
ChatGPT/WAG**. A Kiro CLI attempt to implement M7 timed out without
editing the requested parser. Do not credit M7 implementation to Kiro
unless newer source-level evidence exists.

## 2026-11-05 continuation — regression after a retracted PASS

A new negative test first reproduced an additional false CURRENT verdict: an
agent initially stated `All 8 tests pass` and subsequently wrote
`Not all 8 tests pass`; the importer still chose the earlier affirmative
claim. Remediation now fails closed when a later explicit agent message
retracts that claim, while allowing a genuinely newer affirmative claim to
be evaluated. The browser displays a sanitized error with no raw prose.

- New retraction regression: **2 PASS / 0 FAIL** (original reproducer failed).
- Fresh full Node suite: **278 PASS / 0 FAIL**.
- `npm run build:live` and `npm run check`: **PASS**.
- Compatibility scope is now documented in
  `docs/competition/M7_FORMAT_COMPATIBILITY_20261105.md`.
- No push, PR modification, merge or production deployment in this continuation.

## Remaining release gates

- [ ] Independent review of JSONL parsing, local session semantics and
  privacy boundaries; verify against another real Kiro version/session.
- [ ] Independent novice user tries selecting their own session and can
  correctly interpret `CURRENT` vs `STALE` vs `INSUFFICIENT`.
- [ ] Review unsupported older M1 format and publish a transparent
  compatibility matrix; do not invent an all-version support claim.
- [ ] Make M7 source changes reviewable on a separate feature commit/
  PR after authorization. WAG policy and branch safety must be
  rechecked. Do not bypass a `KILL_SWITCH_ENGAGED` response.
- [ ] GitHub Actions on exact new head SHA, clean Vercel Preview and
  independent real Chrome desktop/mobile acceptance against that SHA.
- [ ] Owner-authorized merge + production release with rollback plan.
- [ ] Regenerate judge video with actual M7 file import (no raw data
  disclosed), update Devpost truthfully, and confirm final submission.

**Competition impact:** M7 addresses the former main weakness — only
static examples — by making the tool useful with a person's own log.
It does **not** guarantee a top-three outcome; correctness, breadth of
supported logs, genuine Kiro workflow integration and judge clarity
remain important.
