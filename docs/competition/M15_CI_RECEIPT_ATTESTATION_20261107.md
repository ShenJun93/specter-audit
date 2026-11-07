# M15 — GitHub-attested CI test receipt (2026-11-07)

**Decision at preparation: LOCAL TECHNICAL PASS / REMOTE ATTESTATION PENDING / RELEASE HOLD.**

## Why this matters

Specter Audit previously displayed public GitHub workflow-run metadata for an exact SHA, without an independently verified CI *artifact* tied to the execution. M15 adds the smallest standard artifact-provenance step: a bounded self-reported Node TAP receipt and a GitHub Actions artifact attestation. **This does not independently bind a private, editable Kiro session to any Git commit.**

## Provenance and permissions

- Base: `b905070aedf371e822ccbecfb01b7922fa4cf58f` (M14).
- Candidate: `feat/m15-attested-ci-receipts`, separate worktree `qa/private/specter-m15-attested-ci-20261107`.
- Code developed and tested by ChatGPT/WAG, **not Kiro CLI**.
- `node-verification`: read-only `contents: read`, exact checkout and pinned Node 24; `npm run check` then `node --test --test-reporter=tap`.
- `scripts/build-ci-receipt.mjs`: rejects missing/malformed, failed, incomplete, skipped or cancelled TAP summaries. It reports test counts and an SHA-256 digest of the original UTF-8 TAP, a self-recorded source SHA, repository, run ID, attempt and event. It does not include raw test lines, private local sessions or file paths in the JSON.
- On push only, `actions/upload-artifact` publishes `receipt.json` and `test.tap` as `specter-ci-evidence`, with a 30-day retention.
- `attest-ci-receipt` requires `node-verification` to PASS, runs only on `push`, with isolated `id-token: write` and `attestations: write` permissions. It downloads the same artifact, does not check out source or run user code, and invokes SHA-pinned `actions/attest@v4` on `out/ci/receipt.json`.
- All additional Actions tags were resolved to concrete SHA pins from the official public `actions/*` repository refs.
- `out/ci/` is Git-ignored to avoid accidental raw report commits.

## Local acceptance

- Test-first checks cover valid passing TAP, nested test counts, fail, skip, cancellation, TODO, missing or injected footer, oversized or UTF-16 input, invalid SHA/repo/GitHub event/run metadata, privacy boundaries and workflow permission isolation.
- A full real Node 24 TAP run was converted into `SPECTER_CI_TEST_RECEIPT_V1` with 505 passing tests, 0 failures. The report SHA-256 was independently compared with `Get-FileHash out/ci/test.tap`: **MATCH**.
- The first local PowerShell redirect generated UTF-16; the parser correctly rejected it rather than treating invalid bytes as evidence. The real local end-to-end test used `cmd /c` redirection to create UTF-8 TAP. GitHub's Ubuntu runner uses shell redirection with UTF-8 output.
- The locally created receipt is **unsigned** and has `independentlyAttested:false`; this is intentionally not an attestation PASS.
- After additional clean-source guard regressions, the final integrated Node suite was **512/512 PASS**, with 0 failed, 0 cancelled, 0 skipped and 0 TODO; `npm run check` and `git diff --check` also passed.
- `validateCiCheckout` now checks the declared SHA against `git rev-parse HEAD` and rejects a dirty worktree using fixed read-only Git argument arrays. The actual local dirty worktree was rejected with `UNVERIFIED_WORKTREE` (expected fail-closed behavior), and the added guard tests passed. The clean exact-commit positive path remains to be verified after committing this branch.

## Judge self-verification (after remote CI, not yet executed)

1. Push the exact candidate branch, then inspect the `Specter Evidence Checks` **push** run for that commit. Both `node-verification` and `attest-ci-receipt` must be successful; do not substitute a PR event or a different SHA.
2. Find the run ID and download the `specter-ci-evidence` artifact:

```powershell
$repo = 'ShenJun93/specter-audit'
$sha = '<40-character-exact-push-sha>'
$run = '<successful-push-run-id>'
gh run download $run -R $repo -n specter-ci-evidence -D .\ci-evidence
```

3. Verify the exact report bytes against GitHub's trusted attestation and constrain signer identity and source SHA:

```powershell
gh attestation verify .\ci-evidence\receipt.json -R $repo `
  --signer-workflow 'ShenJun93/specter-audit/.github/workflows/ci.yml' `
  --source-digest $sha
if ($LASTEXITCODE -ne 0) { throw 'No matching GitHub attestation' }
```

4. Compare report metadata with verified source and original TAP bytes:

```powershell
$r = Get-Content .\ci-evidence\receipt.json -Raw | ConvertFrom-Json
if ($r.sourceCommit -ne $sha -or $r.sourceRepository -ne $repo) {
  throw 'Receipt source mismatch'
}
$tapDigest = (Get-FileHash .\ci-evidence\test.tap -Algorithm SHA256).Hash.ToLowerInvariant()
if ($tapDigest -ne $r.tapSha256) { throw 'TAP digest mismatch' }
if ($r.testSummary.fail -ne 0 -or $r.testSummary.pass -ne $r.testSummary.tests) {
  throw 'Tests not all passing'
}
```

If attestation is missing, GitHub Actions skipped, mismatched or inaccessible, **do not label it verified**. A successful workflow does not prove all required checks for branch protection, semantic correctness or a Kiro session-to-commit link.

## Outstanding gates

- **NOT VERIFIED:** GitHub push run, artifact upload, actual Sigstore attestation issuance, `gh attestation verify` success, and production deployment. These require the exact code to be pushed and its remote run checked.
- **NOT VERIFIED:** Kiro-native M9B hook; credits may be pending issuance/activation.
- **NOT VERIFIED:** independent session-to-commit provenance. A signed CI test report is a distinct evidence layer only.
- Do not merge, promote production, change Devpost or claim contest readiness from local checks alone.
