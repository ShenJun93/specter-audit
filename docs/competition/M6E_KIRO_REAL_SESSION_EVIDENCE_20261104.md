# M6E — Authentic Kiro Session Evidence (2026-11-04)

**Status:** Local candidate, NOT shipped, NOT merged. Do not treat this as proof that arbitrary agent completion claims are correct.

## Why this is different from M6A–M6C

M6A Alibi Engine and M6C UI were created with ChatGPT/WAG assistance after
earlier Kiro CLI implementation attempts timed out without source edits.
M6E has independently verified **successful Kiro CLI source/test file edits**,
plus a safe extract from saved real Kiro coding sessions. The new source module
is **Kiro-authored**; the separate adversarial regression suite and final six
test-fixture adjustments were made using ChatGPT/WAG.

## Authentic earlier Kiro contributions

Kiro CLI local session records for Specter Audit were inspected read-only,
with tool calls paired to their recorded `tool_result.success` values.

| Phase | Recorded session finding | Source files |
| --- | --- | --- |
| M1 (2026-11-03) | Genuine Kiro source writes/replacements; terminal run **34 PASS, 0 FAIL, exit code 0**; agent statement at `2026-11-03T11:36:00.033Z` | `src/git-inspector.mjs`, `src/claim-evaluator.mjs` and test helpers/tests |
| M5A (2026-11-03) | Genuine Kiro edits to provider adapter and tests; terminal run **120 PASS, 0 FAIL, exit code 0**; agent statement at `2026-11-03T13:42:53.083Z` | `src/github-actions-evidence.mjs` and `test/github-actions-evidence.test.mjs` |

Exact M1 statement: *“All 34 tests pass (33 real test cases + the helpers module).”*

Exact M5A statement: *“All 120 tests pass, 0 fail.”*

These statements and tool outputs are **local Kiro CLI session evidence**,
not signed attestations or independent correctness certification.

## A real within-session stale-test case

The recorded M5A workflow contains a meaningful order of events:

1. `2026-11-03T13:42:38.312Z`: Kiro runs test; tool result includes
   `pass 120`, `fail 0`, `Exit Code: 0`.
2. `2026-11-03T13:42:53.083Z`: agent states all 120 tests pass.
3. `2026-11-03T15:06:27.965Z` to `15:07:21.514Z`:
   **five successful source replacements** in `src/github-actions-evidence.mjs`.
4. No new test execution was found **after those edits in the saved M5A
   session**.

This is **STALE_LOCAL_TEST_EVIDENCE relative to the later edits**, not proof
of broken code or that tests were never executed somewhere else.
A separate subsequent GitHub Actions run for a later published revision
cannot retroactively establish what passed at an earlier agent claim time.

The original raw Kiro session logs remain locally stored, **not uploaded**.
The operator-generated privacy-safe evidence pack strips raw prompts,
terminal output, home paths, session IDs and source contents.

## M6E: new Kiro-authored module and independent QA

Kiro CLI 2.37.1 with the Qwen3 Coder Next model created
`src/kiro-session-staleness.mjs` and
`test/kiro-session-staleness.test.mjs`.

Five M6E Kiro CLI sessions were independently checked; there were **18
successful file-write/replacement tool results** involving those two files.
Their private session message logs were hashed (SHA-256) and captured in
an ignored QA receipt, so the session content can be compared later without
publishing it.

`auditLocalSession(input)` analyzes a bounded set of local tool-observed
test outcomes, source edits and claim/session timestamps. Its three statuses
are `CURRENT_SELF_RECORDED_TEST`, `STALE_LOCAL_TEST_EVIDENCE` and
`INSUFFICIENT_SESSION_EVIDENCE`. Every report explicitly says
`independentAttestation:false` and `semanticCorrectnessVerified:false`.

**Verified locally after Kiro remediation:**

- Kiro module and original tests: 29/29 PASS.
- Separate ChatGPT/WAG adversarial tests: 6/6 PASS. These first reproduced
  four false positives before Kiro corrected them.
- Authentic M5A redacted exhibit: `STALE_LOCAL_TEST_EVIDENCE` with
  120 PASS followed by five recorded source edits.
- Full repository Node test suite: **225 PASS, 0 FAIL**.
- Syntax checks, `npm run check`, `git diff --check`: PASS.

The separate red-team test file is
`test/kiro-session-staleness.adversarial.test.mjs`.
The original v1 inspector and released public website remain unchanged.

## Source integrity and limits

The receipt folder is ignored by Git:

`qa/private/specter-m6e-kiro-provenance-20261104/`

It contains `capture.mjs`, `capture-stale.mjs`, `receipt.json`,
`public-safe.json`, `real-session-stale-public-safe.json` and
`kiro-authorship-receipt.json`.

A SHA-256 hash detects modifications relative to this capture only. It does
not authenticate an unsigned local transcript and cannot establish that a
coding agent fixed a bug. No user data should be published directly from
the raw Kiro store.

## Release gates and product next step

- PR #3 still references commit `eb9d200`; the M6D hardening and M6E
  Kiro-authored module are **not on that PR head or Vercel Preview**.
- WAG commit gateway refused `GIT_COMMIT` with `KILL_SWITCH_ENGAGED`
  even though the workspace discovery reads `CLEAR`. No workaround was used.
- Once authorized: commit M6D hardening independently, commit M6E source/tests,
  push through owner-approved Git, verify GitHub CI on the exact new commit,
  inspect Vercel Preview before any merge.
- Design a **fourth Alibi Room exhibit** using the sanitized actual M5A
  session timeline. Label it `RECORDED LOCAL KIRO SESSION`; do not pass it
  off as a GitHub CI provider check or show private raw tool commands.
- Record authentic Kiro session and code/test evidence in the under-three-minute
  judge video, then independently review Devpost submission eligibility.

**Competition honesty:** This materially improves the demonstrability of Kiro
use, but the overall M6A engine and haunted UI remain ChatGPT/WAG-authored.
