# M122 — Adversarial Gate audit receipt

Status: development candidate, stacked on M121 PR #19. **Not merged, not the submitted M75 judge demo.**

## Threat model and independent evidence boundaries

M118/M121 Gate compares exact public PR base/head SHAs and provider-reported GitHub Actions runs with a local reviewer-controlled Docker test. The local JSON report is self-reported and can be fabricated. `DEMONSTRATED_FIX` means one approved test is reported failing on base and passing on head; it does **not** establish independent attestation, semantic correctness, general coverage or release approval.

A Docker container is not an independent untrusted-code security boundary. Docker's official Engine security documentation explains the importance of kernel isolation, daemon attack surface and user namespaces: https://docs.docker.com/engine/security/ . GitHub's secure-use guidance separately cautions against running untrusted code in privileged workflow contexts: https://docs.github.com/en/actions/reference/security/secure-use . This M122 verification intentionally uses only a **safe owner-controlled public fixture**. Never feed an unknown third-party PR into the local Docker runner on a sensitive machine.

## M122 security defects repaired

1. **P1 reviewer-test time-of-check/time-of-use:** the runner formerly verified the SHA-256 of `testPath` but mounted that same mutable original path into Docker. An on-disk change between verification and container startup could execute different bytes. The runner now copies the **verified in-memory bytes** into a private temporary staging path with `writeFile(...,{flag:'wx',mode:0o444})`, re-hashes the staged copy and mounts it for both base/head. It removes the staging directory afterward. This mitigates this specific file-substitution window; it does not authenticate the local operator or protect against a compromised same-user host process.
2. **P2 malformed provider run handling:** an array containing `null` caused `buildCaseFromSources` to throw `TypeError` rather than return `UNKNOWN`. A red-before/green-after regression now verifies fail-closed behavior for null, booleans, strings and other invalid run elements.

## Deterministic adversarial matrix

Source: `test/arena-adversarial-corpus.test.mjs` (pure, dependency-free Node tests). Synthetic labels are specified explicitly, not generated post hoc.

- **54 mutation families × 4 internally consistent outcome classes = 216 invalid/tampered cases**. All 216 must result in `UNKNOWN`, with 0 exceptions or unexpected positive verdicts.
- **Four valid pairs:** (base 0, head 0) `BOTH_PASS`; (0, 1) `REGRESSION`; (1, 0) `DEMONSTRATED_FIX`; (1, 1) `BOTH_FAIL`. All remain `independentlyAttested=false` and `releaseApproved=false`.
- Mutations cover wrong PR/commit binding, moved base/head, wrong GitHub run records/status, truncated/missing runs, malformed provider arrays, reviewer test approval/sha, Docker image identity/isolation, raw challenge TAP consistency, skipped/canceled tests, exit-status mismatch and forged verdict.
- Injected arbitrary `secret` fields must not be echoed in the normalized report. This is scoped to injected extras, not a full data-leak proof.
- A **fabricated but internally consistent** challenge JSON can still yield a derived positive classification. The test intentionally demonstrates that this module does not independently verify execution; the attestation flags remain false.

**Observed in this worktree:** 216/216 invalid inputs returned `UNKNOWN`, 4/4 valid outcomes were classified correctly, 0 unexpected positive verdicts. This is **not** a measured operational false-positive/false-negative rate, not an independent security audit, and not evidence on third-party repositories.

## Functional reproduction

Using the separate owner-controlled `ShenJun93/specter-arena-evidence-fixture` local clone and the published reviewer test, re-run `node scripts/arena-challenge-runner.mjs` only with an inspected manifest and the explicit reviewer approval flag. Then use `node scripts/arena-case-cli.mjs` to correlate the result with the public fixture PR. The expected narrow result is **BASE exit 1 → HEAD exit 0 → DEMONSTRATED_FIX** and `independentlyAttested=false`. Required official repo gates remain `npm run check`, `node --test` and GitHub CI at exact SHA.

## Remaining blockers before merge/release

- Independent **human/agent security review** of runner, exact-HEAD binding, VM isolation and private data handling is still outstanding. Previous Codex CLI review was blocked by account usage limits; Kiro read-only audit yielded no auditable report. Internal adversarial tests do not replace it.
- The reviewer test is under the owner’s control. This is **not** real third-party usage data.
- Testing of genuine malicious source code remains **out of scope** for this local Windows + Docker configuration. Use isolated ephemeral VMs and a separate risk-approved environment before such work.
- No proof that this project has won, or is guaranteed to win, top-three placement.
