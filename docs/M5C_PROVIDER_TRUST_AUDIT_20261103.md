# Specter Audit — M5C Provider Trust Audit

Date: 2026-11-03 (Asia/Ho_Chi_Minh)
Scope: local `feat/kiro-provider-evidence` worktree only. NOT released or deployed.

## Source of truth

- Git branch before changes: `feat/kiro-provider-evidence`, HEAD `f0c0a9115185f00fdcb416f67c96a61dc9ef770b`.
- `src/github-actions-evidence.mjs`: opt-in GitHub Actions reader, **offline by default**.
- `test/github-actions-evidence.test.mjs`: injected-fetch, deterministic regressions.
- `package.json`: syntax checker includes new adapter.
- Public site still uses a **fixed synthetic snapshot**; this adapter is NOT connected to any production HTTP route or UI.
- Current M5C local changes are uncommitted; do not infer public release from a passing local test.

## Trust model and boundary

- Exact caller-selected owner/repo (strict input validation), 40-hex commit SHA and **required numeric workflow ID**.
- Only `https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflowId}/runs?head_sha={sha}&per_page=100&page=1` can be requested by the adapter. No arbitrary URL, redirects, tokens or user-selected alternate hosts.
- The response must include `total_count` and a complete first page; incomplete pagination / next Link -> `UNKNOWN`, not cherry-picked success. This deliberately sacrifices availability when a large page is incomplete.
- Every eligible run must match SHA **and** workflow identity. A run's `html_url` must match the exact GitHub owner/repo and run ID.
- Newness uses **run_number** (new workflow execution) and then **run_attempt** (rerun of that execution); never `updated_at`. Missing/ambiguous ordering fields -> `UNKNOWN`.
- Provider-reported success is NOT a signature, independent execution attestation, test-log verification, or code correctness guarantee.
- `PROVIDER_REPORTED_SUCCESS` cannot upgrade `SUPPORTED/PARTIAL/UNVERIFIED` without independently defined evaluator semantics (not implemented here).
- Bounded streamed JSON (128 KiB), no unbounded text fallback, request deadline across headers **and** body, redirects rejected, 403/429/error/timeout -> `UNKNOWN`.
- No repository mutation, no process execution from provider input, no credentials/secret reads.

## Verification on MAIN-PC

- `node --test test/github-actions-evidence.test.mjs`: **55 pass / 0 fail**.
- `npm run check`: PASS.
- `npm test`: **139 pass / 0 fail** (2026-11-03 local verification).
- `git diff --check`: PASS on **tracked** changes; does not cover the untracked adapter/test files. The adapter and test files separately passed JavaScript syntax and unit verification.

## Remaining risk / next gate

1. Provider response is live and unauthenticated, rate-limited; no real GitHub API smoke verification has been performed in M5C. All adapter tests are deterministic mocks.
2. Fail-closed pagination means many matching runs or oversized API JSON yield UNKNOWN. Pagination must remain strictly host/path bounded if added.
3. A response is GitHub **provider reported**, not cryptographically signed.
4. Do not expose owner/repo/workflowId as arbitrary browser-request parameters on public hosting.
5. M5D: add a fixed-repository, explicit-consent presentation of provider CI evidence, with link, exact SHA, workflow, run/attempt, and source legend; keep the existing evaluator untouched. Add browser security and accessibility acceptance before release.
6. Verify Kiro-authored provenance separately. An actual Kiro CLI session contributed to M5A/M5B but timed out during M5B; subsequent regression repairs and M5C were done with ChatGPT/WAG, **not authored entirely by Kiro**.
7. Human approval is required before commit/push/deploy/final submission.

## Public reference

- GitHub REST: https://docs.github.com/en/rest/actions/workflow-runs
- GitHub Actions contexts: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
