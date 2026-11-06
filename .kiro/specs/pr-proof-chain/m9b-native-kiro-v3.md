# M9B — native Kiro V3 staleness nudge (SPEC ONLY — NOT INSTALLED)

Status: DESIGN READY / IMPLEMENTATION BLOCKED BY KIRO MONTHLY QUOTA / NO LIVE HOOK ENABLED.
Authorship: this specification was drafted with ChatGPT/WAG and checked against public Kiro V3 documentation on 2026-11-06. It is **not** evidence of a Kiro-authored implementation.

## Why M9B matters for Kiroween

M8.8 can retrospectively examine a saved Kiro session; M9A inspects public GitHub Actions of an exact PR HEAD. Neither changes the *agent's behavior while coding*. M9B makes the app memorable: Kiro itself receives an evidence-freshness reminder after its own source edit, then can explicitly rerun tests. The user can display the before-edit PASS, post-edit unverified status, and new PASS in the existing Specter UI.

A hook reminder is **not** a measured end-to-end proof chain or authentication of test results. It does not establish that the PR HEAD includes the edited file, or that CI was run against the edit.

## Explicit choice: minimal non-blocking implementation before ambitious instrumentation

**M9B.0 (first implementation by Kiro)** should do one thing extremely reliably: when Kiro saves a matching source file in a *deliberately opted-in demo workspace*, print a short warning into Kiro's context:

> SPECTER SOURCE CHANGE: A source file was saved after earlier evidence may have been collected. Any previous PASS claim is not sufficient to verify this new source state. Rerun the relevant tests and inspect the new receipt before claiming current results.

This is an advisory warning, **not** proof that tests were run or that a specific prior receipt has become stale. It never blocks Kiro execution. It does not read Git credentials, transcripts or test logs. It does not execute any tests automatically. It is deliberately distinct from the M8.8 `STALE LOCAL TEST EVIDENCE` classification, which requires recognized test/edit chronology.

A future M9B.1 may bind receipt timestamps to Kiro session IDs after the actual STDIN event schema and saved session format are observed locally; it must **not** infer this binding from synthetic JSON alone.

## Publicly documented Kiro V3 behavior

As of 2026-11-06, official Kiro V3 supports:
- Standalone `.kiro/hooks/*.json` with `"version":"v1"`, `hooks[]`, `trigger:"PostFileSave"`, path matcher, and `action:{type:"command",command:"..."}`.
- The hook command is invoked from the project root and receives session context on **STDIN** as JSON.
- A successful command can return brief STDOUT as Kiro context.
- `.kiro/hooks/*.json` starts being loaded automatically on session start. Global `~/.kiro/hooks/` may load alongside workspace hooks.
- Kiro CLI V3 has different schema and trigger names from legacy CLI 2.x; no legacy `.kiro.hook` or old `postToolUse` config should be installed.

Reference pages:
- https://kiro.dev/docs/hooks/
- https://kiro.dev/docs/cli/v3/hooks-migration/
- https://kiro.dev/docs/hooks/actions/
- https://kiro.dev/docs/hooks/best-practices/

**Not yet verified:** actual Kiro 3.1.0 `PostFileSave` STDIN keys, Windows command-escaping behavior, matcher path normalization and real output routing. Their values must be captured with synthetic safe source files only. No actual claim of working Kiro integration before these gates.

## Threat model and operating limits

1. No actual Hook JSON is to be created under `.kiro/hooks/` in the current repo, user home or any global directory until independent review and user authorization of the **exact** hook content.
2. Implement a standalone **pure, zero-dependency, bounded Node script** in the separate M9B branch to accept one STDIN JSON event (max 8 KiB, timeout max 2 s). Reject invalid JSON and unknown/untrusted events. If file path cannot be validated, emit at most a generic UNKNOWN warning, never echo arbitrary input.
3. Scope only to source code beneath the workspace `src/` tree with `.js`, `.mjs`, `.ts`, `.tsx` suffixes. **Kiro V3 file-event `matcher` is a regular expression, NOT a glob**: `src/**/*.{...}` must not be copied into the hook JSON. Choose a regex after observing the actual Windows path representation, then independently validate the canonical normalized relative path in the handler. Exclude `.env`, credentials, lockfiles, `.git`, `.kiro`, user home, qa/private, temp directories and other repos. Never concatenate an input path into a shell command.
4. No absolute paths, prompts, commands, API keys, full STDIN JSON, session IDs or user identifiers may appear in output. No persistence in V0, no telemetry, no networking, no filesystem mutations.
5. A malformed/oversized STDIN event or unknown Kiro schema is **UNKNOWN**, never a fabricated PASS/STALE. The hook should exit 0 with a safe no-claims message for routine unknowns so it cannot block editing.
6. Log outputs for judging must be made from a new synthetic sample repository and synthetic source file. Real `messages.jsonl` should remain private. If a real session is explicitly shown, sanitize prior to screen recording and retain the raw file locally only.
7. Hooks are opt-in, run only after a separate owner-approved setup, and must have a one-command rollback. No publication, PR merge or production deployment is implied by live hook acceptance.

## Kiro implementation runbook once credits are restored

1. Confirm `kiro-cli --version`, authenticated status and usable request quota with a minimal prompt. Do not paste token/identity values into repo or chat. Record result only as `KIRO_AUTH_OK` / `KIRO_QUOTA_BLOCKED`.
2. Start **fresh Kiro CLI V3 session** in an isolated temp/demo worktree. Have *Kiro* read this spec, inspect current tools and author the minimal zero-dependency handler plus deterministic tests (none of those authored by ChatGPT/WAG should be attributed to Kiro).
3. First run handler tests **without** a hook JSON: empty STDIN, invalid JSON, oversized payload, path traversal, Windows path separators, false matcher, real allowed synthetic source filename, stdout privacy leak tests, repeated event idempotence, no writes/network.
4. Have Kiro propose and explain the standalone hook JSON **outside** `.kiro/hooks/`; independently inspect its exact matcher and action command. Do not install automatically.
5. Owner authorizes the precise temporary hook installation in the sandbox demo worktree only; never in global hooks. Run a new CLI V3 session and make Kiro save one synthetic source file. Capture the actual event keys and minimal warning output, do not disclose private session IDs.
6. End-to-end demo: Kiro does a real passing test (recorded test receipt), saves source file, receives M9B warning, reruns tests and produces a new receipt, then Specter Live Investigator examines the saved session. Negative control: no later rerun results in an unverified/stale state, not PASS. Cross-check Kiro output with actual file/test logs and time order.
7. Run independent reviewer and privacy audit. Confirm zero regressions in M8.8/M9A; then discuss optional Preview. Keep PR #7 and production frozen until owner accepts release plan.
8. Remove temporary hook and confirm next session does not load it. Preserve only sanitized, explicitly approved demonstration evidence in the eventual public repo.

## Acceptance / NO-GO table

| Gate | PASS means | Otherwise |
|---|---|---|
| Kiro quota | Kiro can run in V3 and actually author the handler | BLOCKED; no fake Kiro evidence |
| Hook schema | Current V3 STDIN/matcher/action validated by live tool | UNKNOWN; no live installation |
| Source edit | Hook fires on Kiro write to allowed synthetic source | NO-GO |
| Non-source files | No warning for ignored files/paths | NO-GO |
| Privacy | No raw session/paths/prompts/tokens or extra network/write | NO-GO |
| Correctness | No invented PASS, no inferred self-recorded-to-PR binding | NO-GO |
| Footage | Real test → source edit → warning → retest and receipts visible | NO-GO for demo claim |
| Cleanup | Demo worktree hook removed and no auto-trigger after cleanup | NO-GO |

## Scope decision

M9B.0 is likely a **small, reviewable, reversible** Kiro-native demonstration that materially improves contest evidence without building a daemon, database, marketplace extension or external infrastructure. Do not attempt M9B.1 receipts/commit binding unless M9B.0 proves useful and Kiro credits allow an independently verified implementation.

**Current verdict:** design-only. No file was added under `.kiro/hooks/`. No Kiro tool test or new Kiro-authored source occurred.
