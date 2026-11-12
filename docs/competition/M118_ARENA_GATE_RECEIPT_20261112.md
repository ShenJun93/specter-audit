# M118 — Specter Arena + Gate: bounded evidence receipt

Status: development candidate; **not** the submitted M75/filmed V5D release. Owner-controlled public fixture, not evidence of external customer adoption or agent-authored changes.

## End-to-end verified case

- PR: https://github.com/ShenJun93/specter-arena-evidence-fixture/pull/1
- Repo origin: a separate public, synthetic repository controlled by Specter's owner; created expressly for this challenge.
- Base: `4014554a6577e0a9369b9fb53e6b06da96772289` — deliberately floors half-cent ties.
- Head: `df89b5d477693a0e4bacc27cd46179ad1a334019` — changes to integer half-up rounding.
- GitHub Actions: exact-head pull_request run https://github.com/ShenJun93/specter-arena-evidence-fixture/actions/runs/43148508938 and push run https://github.com/ShenJun93/specter-arena-evidence-fixture/actions/runs/43148501470 both provider-reported success. Base run https://github.com/ShenJun93/specter-arena-evidence-fixture/actions/runs/43148416130 also provider-reported success. Those workflows only test the integer-cent happy path.
- Reviewer-controlled test bytes are published in Specter under reviewer/challenges/half-cent-rounding.challenge.mjs, outside the fixture repository and PR. The companion reviewer/challenges/half-cent-rounding.manifest.example.json provides a replace-path-only manifest. The test hashes to SHA-256 `00bad83ddc1823b8df795c75136e1cdaf881919b4b2015e089345199b96ab239`. It challenges two fractional-cent ties (101 and 99 cents discounted by 50%).
- Docker image ID `sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5` (Node 24 Alpine image observed on host).
- Same reviewer test, two immutable Git blobs: **BASE exit code 1, HEAD exit code 0** with TAP results observed locally in containers. Result `DEMONSTRATED_FIX` for these specific test inputs only.
- Boundaries applied: explicit reviewer flag, test file SHA-256 check, Git remote and exact commit checks, no Docker image pulls during execution, `--network=none`, read-only source/test mounts and root, non-root UID, caps dropped, no new privileges, CPU/memory/pid/output/wall-time limits.
- Generated normalized report: `web/arena-fixture-case.json`, schema `SPECTER_ARENA_CASE_V1`, SHA-256 `4e518b27976d2649c23e9f5b169d308dada17a7a78fe0fb3495769c5a1b8c93b`. It contains five attributed statements; no private reviewer path or raw test output. `independentlyAttested=false`, `releaseApproved=false`.
- `scripts/arena-case-cli.mjs` re-observes PR before/after GitHub Actions inspection; mismatched base/head/SHA, wrong repository, missing runs or partial provider page yield `UNKNOWN`. Produces the same JSON for Arena and a bounded Markdown PR-review draft. It **does not** publish a GitHub comment/check.

## Reproduction

On a safe, owner-controlled system with Docker Engine, Node.js 24+, Git and a clean clone of Specter and the fixture:

1. Clone the public fixture into a separate local Git checkout. Use the exact published reviewer test in Specter/reviewer/challenges/half-cent-rounding.challenge.mjs **outside that fixture checkout**, and verify SHA-256 against the value above.
2. Copy reviewer/challenges/half-cent-rounding.manifest.example.json, replace the two absolute-path placeholders, and inspect the test before explicitly approving. The example conforms to `SPECTER_REVIEWER_CHALLENGE_V1` with `repository`, `repoPath`, immutable `baseSha`/`headSha`, `sourcePath: src/pricing.mjs`, `testPath`, `testSha256` and `expectedBehavior`. Inspect its contents and test before approving.
3. Run `node scripts/arena-challenge-runner.mjs --manifest <manifest.json> --out <challenge.json> --i-reviewed-test-and-accept-execution` from Specter's repository. For **this owner-controlled fixture only**, the approved test should fail base and pass head. Any environment/setup failure is `UNKNOWN`, not a successful challenge.
4. Run `node scripts/arena-case-cli.mjs --pr https://github.com/ShenJun93/specter-arena-evidence-fixture/pull/1 --challenge <challenge.json> --out <case.json> --markdown <review.md>`.
5. Run `npm run check` and `node --test`. To inspect the UI locally, run `node src/http-server.mjs --repo=<path-to-clean-Specter-repo> --port=0` and open `/arena.html`.

**Do not run random/hostile PR code in this local Docker configuration**; use stronger isolation such as an independent ephemeral VM for genuinely untrusted contributors. Neither green CI nor a single passing behavioral challenge establishes semantic code correctness, broad test coverage, compliance, security or release approval.

## Quality evidence and limitations

- On 2026-11-12, exact M118 worktree completed `npm run check` and 554/554 Node tests before final guard refinements; a fresh exact-HEAD CI pass is still required after push.
- An independent Playwright-core + installed Edge session on the owner machine checked 390, 768, 1024 and 1440px viewport sizes. Initially found 111px horizontal overflow at 390px due an unbroken SHA token; after CSS correction all four had 0px overflow, the case displayed five evidence statements, invalid JSON was rejected, console errors 0, failed requests 0. QA dependencies were installed outside Specter's repo.
- Static accessibility heuristic passed but **does not** cover WCAG, live screen-reader behavior or full keyboard navigation.
- Real Kiro CLI 3.1.0 contributed the initial normalized case module and tests; ChatGPT/WAG independently ran and corrected them and integrated runner, browser UI, GitHub inspection, docs and tests. See M118 native Kiro receipt.
- No genuine external-user observations have been obtained. Owner consent and feedback are still needed for a top-three impact narrative.
