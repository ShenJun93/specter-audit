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

## Current status (M5E feature branch — not released)

- M1 inspector/evaluator was genuinely implemented using Kiro CLI; M2–M4 were
  implemented using ChatGPT-assisted tools. Kiro contributed to M5A/M5B;
  later M5C/M5D/M5E hardening used ChatGPT/WAG.
- Public GitHub repository, MIT LICENSE and synthetic Vercel replay are already
  available; current local M5 changes are not published or deployed.
- Local inspector and claim evaluator remain read-only and offline by default.
- Optional local CI lookup is restricted to a fixed public GitHub repository,
  exact commit and workflow and requires explicit user action. No tokens.
- Hosted CI evidence is a dated static JSON record from the initial release,
  never an anonymous request-triggered GitHub API fetch; it remains separate
  from the synthetic judge fixture and cannot elevate claim verdicts.
- Provider-reported CI is not signed attestation or proof of correctness.
- See docs/M5E_RELEASE_GATE_20261103.md for local evidence and release gates.
