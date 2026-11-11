---
inclusion: always
description: Security and evidence boundaries that every Specter Audit change must respect
---

# Specter Audit — product standards

These boundaries apply to all work on Specter Audit. They are derived from the
Kiroween 2026 requirements and are non-negotiable for the competition (Costume
Contest category: spooky UI **with** functional engineering).

## Security boundaries

- **Read-only Git.** The inspector only runs a fixed set of read-only Git
  subcommands. It NEVER performs `add`, `reset`, `checkout`, `commit`,
  `push`, `rm`, `stash`, `clean`, `apply`, `rebase`, `merge`, or any other
  mutating operation. No hidden Git writes of any kind.
- **No shell.** Git is always invoked via an argument array with `shell: false`
  (execFile / spawn). User-supplied text is never interpolated into a command
  string, so shell injection is structurally impossible.
- **Explicit repo path.** The inspector operates on one explicitly chosen local
  repository path. It never walks other folders, searches parent directories
  for repos, or touches unrelated worktrees.
- **No file contents.** The inspector reads Git metadata (status, diff
  name-status, HEAD) only. It never reads file contents.
- **No user command execution.** The verifier never runs a command supplied by
  the user. The user may *paste* a command and a run receipt; the verifier
  inspects the receipt as data, it does not execute the command.
- **Bounded execution.** Every Git call has a timeout and a capped output
  buffer so a hostile or pathological repository cannot hang or exhaust memory.
- **No secrets.** Never read `.env`, credential files, private keys, or token
  stores. Never collect or transmit PII, source files, or secrets. The Git inspector remains fully local and offline by default. A separate
  optional public GitHub Actions status reader is permitted only when explicitly
  invoked for a fixed allowlisted public release, without credentials.
  Hosted judges read a timestamped static CI record, not live GitHub requests.
- **No global Git config changes.** Tests use disposable fixture repos with
  local-only config and `commit.gpgsign=false`; global Git config is untouched.

## Evidence boundaries

- **SUPPORTED means alignment, not correctness.** A `SUPPORTED` verdict means
  the claim lines up with Git-recorded changes. It is NEVER a claim that the
  code is correct or that it does what the author intended. We do not measure
  semantic correctness of arbitrary code.
- **File evidence is required for change claims.** A change claim ("fixed X")
  is only supported when actual working-tree / index changes exist and relate
  to the claim. Keyword matching alone never supports a claim, and a clean
  tree yields `UNVERIFIED` even if a test log looks green.
- **Self-reported receipts are not attestation.** A receipt with numeric exitCode=0,
  matching HEAD and a valid timestamp is only `metadata-consistent`. User-supplied
  values cannot prove a test ran. Pure test-pass claims remain UNVERIFIED.
  A combined Git-change+test-pass claim cannot exceed PARTIAL without independent
  test-execution evidence, which this version deliberately does not capture.
- **Missing, stale, failed, malformed or text-only receipts cannot elevate verdicts.**
  No user-entered receipt can independently certify successful execution.
- **Verdict vocabulary is fixed.** Observations are labeled `SUPPORTED`,
  `PARTIAL`, or `UNVERIFIED`. We never say tests "passed" merely because a log
  exists, and we never assert a claim is true — only that evidence does or does
  not align.
- **Red/green is not the sole signal.** The eventual UI must not rely on color
  alone; verdicts carry text labels, and a reduced-motion / keyboard-accessible
  fallback is required.

## Implementation standards

- **Node.js 24, ESM, zero runtime dependencies.** Use built-in `node:test` for
  tests. No third-party packages.
- **Deterministic tests.** Tests create disposable local Git fixture repos,
  clean up after themselves, and do not depend on network or global state.
- **Small, reviewable milestones.** Each milestone is kept minimal and
  reversible. Do not commit, push, or touch other repositories unless the user
  explicitly asks.

## Current release and unreleased M6F status (2026-11-04)

- M5L remains live on Vercel production (merged SHA
  `b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e`), with separately
  recorded post-deploy browser/API acceptance. The CI evidence panel shows
  a labeled *historical* result for release `374af14`, not CI evidence for
  every later revision.
- Draft PR #3 on branch `feat/agent-alibi-v2` currently points to
  `eb9d200b1ac8e5f25edb0ca73610896ebb6be9ef`. M6D hardening,
  M6E authentic session auditor and M6F four-case UI are **uncommitted
  local candidate work**, not pushed or deployed. No production mutation.
- M6A/M6C Git/CI engine + haunted UI were created with ChatGPT/WAG after
  Kiro CLI implementation attempts timed out. M6E local Kiro-session
  staleness auditor **was directly authored and revised by Kiro CLI**
  in five verifiable local sessions (18 successful file edit tool results).
  ChatGPT/WAG wrote the separate adversarial tests, six fixture assertion
  changes, and M6F UI integration. Do not attribute all code to Kiro.
- Four case types coexist in M6F: three *hypothetical completion claims*
  anchored to real GitHub Actions records, and one *actual Kiro CLI session*
  with self-reported passing tests followed by five successful source
  edits. Their respective schemas, provenance and verdict scopes are
  separate; never render an invented GitHub run for Kiro session data.
- `STALE_EVIDENCE` for a cited old CI artifact does not imply no newer CI.
  `STALE_LOCAL_TEST_EVIDENCE` means older local recorded test results
  do not cover later source edits. It does not prove code correctness,
  bugs, or missing test runs in other sessions. Local log SHA-256 is an
  editable-data fingerprint, not signed attestation.
- The original inspector still reads **Git metadata only** using fixed
  read-only operations; it never reads source files, arbitrary local
  transcripts or user credentials. The operator-only M6F capture script
  reads one already scrubbed, ignored local JSON record and calls the
  pure Kiro-authored evidence engine, then emits a fixed static web asset.
  This is **not** a browser-driven ingestion API. Hosted visitors only
  fetch same-origin JSON and never invoke GitHub or Kiro APIs.
- Local browser/Node verification is distinct from public release
  acceptance. Before deployment: authorized Git commit/push,
  exact-SHA CI, reviewed PR, Vercel Preview browser QA and rollback gate.
  The `GIT_COMMIT` gateway previously returned `KILL_SWITCH_ENGAGED`;
  do not use an alternate execution channel to bypass that denial.
