# M9B.0 Hook Preflight — Independent Synthetic Contract (2026-11-06)

**Status: TEST HARNESS ONLY. NO KIRO HOOK INSTALLED. NO KIRO CODING CLAIM.**
Base experiment branch: `feat/m9-pr-proof-chain`, after M9A.1 and M9B design spec. Authored by ChatGPT/WAG.

## What was added

- `scripts/kiro-v3-hook-preflight.mjs`: bounded Node subprocess checker for a **future Kiro-authored** hook handler.
- `test/kiro-v3-hook-preflight.test.mjs`: regression tests for the checker itself using temporary **MOCK** handler scripts.
- `.kiro/specs/pr-proof-chain/m9b-native-kiro-v3.md`: corrected matching guidance. Kiro V3 uses **regular expressions** for `matcher`, not a glob.

The runner executes a candidate handler against 18 explicitly synthetic scenarios: JavaScript/TypeScript source saves, Windows path separators, ignored configuration/private files, traversal, wrong event, missing/bad JSON, and oversized STDIN. It detects unsafe output, fabricated attestations, overlong stdout/stderr, non-zero exit and timeout.

It does **not** verify the true Kiro PostFileSave stdin schema, real hook triggering, network access or filesystem side effects. The child is started with a minimal environment and shell disabled, but this does **not** constitute OS-level sandboxing.

## How to run — AFTER Kiro actually writes a handler

```powershell
# In this experimental repository only, with a reviewed handler path:
node scripts/kiro-v3-hook-preflight.mjs --handler scripts/kiro-v3-staleness-hook.mjs
```

Possible result labels:
- `BLOCKED_NO_HANDLER`: exit 3; no handler exists (correct current state).
- `SYNTHETIC_CONTRACT_FAIL`: exit 3; static synthetic contract failed.
- `SYNTHETIC_CONTRACT_PASS_ONLY`: exit 0; the handler passed the **mock envelope**, NOT a live Kiro hook execution.

A successful synthetic run never sets `schemaVerified`, `liveKiroVerified`, `networkIsolationVerified`, or `noFilesystemMutationVerified` to true. Only actual live acceptance with Kiro V3, consent and independent observation can close those gates.

## Mandatory live Kiro follow-up (blocked by monthly quota)

1. Obtain usable credits. Have Kiro CLI v3 author/modify the candidate handler from `m9b-native-kiro-v3.md` in a **separate demo worktree**; do not misattribute the harness to Kiro.
2. Capture the real `PostFileSave` event **field names only**, using a synthetic sample file; verify Windows-path normalization and actual matcher behavior.
3. Adjust the synthetic contract to match the observed event shape; repeat tests.
4. Independently review the exact hook JSON. Obtain the owner's authorization **before** creating anything under `.kiro/hooks/`.
5. Observe a real Kiro test -> source edit -> warning -> retest sequence. Validate the resulting session log and final file state without publishing private content.
6. Verify cleanup removes the hook and new Kiro sessions no longer load it; review for networking or filesystem side effects with an actual sandbox.

## Release / competition boundary

This is a **testing prerequisite**, not the winning feature itself. Kiro-native implementation, review, Preview acceptance and final judge video remain outstanding. PR #7, production, YouTube and Devpost are unchanged; no hook was enabled.

Authoritative docs:
- https://kiro.dev/docs/hooks/
- https://kiro.dev/docs/cli/v3/hooks-migration/
- https://kiro.dev/docs/hooks/actions/
