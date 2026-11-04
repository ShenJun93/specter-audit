# M7 — Your Session, Your Evidence: local release review

**Audit date:** 2026-11-05 (Asia/Ho_Chi_Minh)

**State as of latest local review:** M7 is isolated on the local branch
`feat/m7-local-session-investigator`. Its first local commit is
`74005e4af42b3932614a39d4250704e1ac0391e5`; later hardening is covered
by the continuation evidence below. Refer to Git HEAD for the exact current
version. The M7 branch has not been pushed or deployed. Ready-for-review PR #3,
its Preview and production remain unchanged.

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

## 2026-11-05 continuation — M5A compatibility and post-claim hardening

A second red-team batch first reproduced four false CURRENT verdicts:
post-claim failed test; orphan tool result; identical claim/test completion
timestamp; and dynamic PowerShell expression substitution. Four synthetic
reproducers were red before the parser changes and green afterward.
The older M5A Chrome QA temporarily failed after overrestricting the
read-only PowerShell output filter. Local, non-disclosing analysis established
the actual safe chronology: a 120-PASS test completes before the claim,
a narrower 36-PASS test completes afterward, and six source edits follow
both. Parenthesized regex text in quoted output-only filters is now
recognized without accepting executable PowerShell expressions.

The parser only retains a STALE conclusion with a valid preceding PASS,
successful later test receipts, and a successful edit strictly after all
tests. Post-claim FAIL, equal timestamps, missing pre-claim evidence or
a later passing test without a newer edit remains insufficient. The later
test never retroactively substantiates the earlier claim.

| Local verification gate | Latest result |
| --- | --- |
| Full Node regression | **288 PASS, 0 FAIL** |
| `npm run build:live` / `npm run check` | PASS |
| M5A real Kiro session | 288 events, 2 parsed tests, 11 edits, 2 redacted paths; STALE |
| Chrome desktop real Kiro file | PASS; 14 sanitized chronology events |
| Chrome mobile width 390px | PASS; no overflow |
| Requests after file selection / console errors | **0 / 0** observed |
| Synthetic new post-claim/PowerShell red-team | 10/10 PASS |

All observations above are local and self-recorded. No independent reviewer,
exact-commit remote CI, new Preview or production acceptance is claimed.
The raw Kiro file remains outside Git.

## Remaining release gates

- [ ] Independent review of JSONL parsing, local session semantics and
  privacy boundaries; verify against another real Kiro version/session.
- [ ] Independent novice user tries selecting their own session and can
  correctly interpret `CURRENT` vs `STALE` vs `INSUFFICIENT`.
- [x] Publish a transparent M1/M5A compatibility matrix. M1 remains
  unsupported/insufficient; expand coverage only with independently validated fixtures.
- [x] Isolate M7 in its own local feature branch and initial commit.
- [ ] Push that branch and open a separate PR after checking WAG policy;
  never bypass `KILL_SWITCH_ENGAGED` or rewrite PR #3.
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
