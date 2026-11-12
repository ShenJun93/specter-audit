# M121 — Gate trust-boundary audit + responsive navigation integration

Status: review candidate based on Draft PR #18 at `d9c1bd255208b40e3b98f99e7c091f42aadb8929`. The worktree is independent of `main` and both Draft PR branches; no merge, public judge alias, Devpost or YouTube mutation.

## Observed defects and treatments

| Severity | Observation | Remedy | Verification |
| --- | --- | --- | --- |
| P0 trust consistency | The case CLI could label `DEMONSTRATED_FIX` when the input challenge report explicitly claimed `UNKNOWN` or `BOTH_PASS`, or when TAP was absent/inconsistent, because it trusted only synthetic status + exit code. | Validate the closed result, reviewer approval marker, declared Docker isolation metadata, source image id, SHA-256, per-side TAP totals/skips/cancellations and consistency of exit code with the derived outcome. Contradictions return `UNKNOWN`. This is schema consistency, not cryptographic proof. | A red regression first demonstrated `DEMONSTRATED_FIX` from a self-contradictory report; after the fix it and additional forgery cases return `UNKNOWN`. |
| P1 privacy | Runner persisted up to 1,800 raw stdout characters in a local receipt. A test/candidate can emit sensitive or misleading content. | Do not persist stdout/stderr samples; retain bounded SHA-256 hashes and byte sizes only. | New test prohibits `outputSample` and checks required hashes/size fields. |
| P2 manifest | A commit SHA supplied with mixed upper/lower case could represent the same commit twice and bypass the distinct-base/head check. | Normalize comparison before acceptance. | Adversarial manifest regression. |
| P2 non-text source | UTF-8 decoding or NUL-containing Git blob should not silently produce a changed executable candidate. | Reject source buffers containing replacement characters or NUL, fail closed. | Syntax and regression coverage. |
| P1 judge navigation | The Git inspector sidebar at <=960px hid all workspace links. PR #17 already implements an accessible mobile/tablet toggle, but PR #18 introduced an Arena page without sidebar navigation. | Reuse PR #17 JavaScript/CSS/test exactly, adapt index markup to retain the judge-first-run link while exposing recorded cases, Arena challenge, PR proof chain and local Kiro session. | Responsive Node tests and browser viewport interaction. |

## Trust limitations (unchanged)

- `SPECTER_ARENA_CASE_V1` is **not** independently attested; parsed local JSON cannot prove Docker execution, test ownership or authorship. More validation reduces contradictions, not fabrication.
- The runner executes only one reviewer-approved source file via Docker. It does not test arbitrary large repositories; image authenticity is not independently verified, and Docker alone is not adequate isolation for hostile PR code.
- Reviewer test and output digest do not demonstrate overall correctness or security. A provider-reported green CI does not imply all required checks passed.
- The live fixture is owner-controlled. There is **no** verified external reviewer study yet and no evidence of commercial adoption.
- Native Kiro work is limited to the documented real Kiro CLI-created report module and tests. No confirmed native hook, Kiro-to-PR linkage or newly signed Kiro receipt is implied.

## Release gate

1. Fresh full suite on exact branch SHA and GitHub Push/PR CI.
2. Fresh isolated Preview, functional 390/768/1024/1440 browser checks and source-to-Preview SHA readback.
3. Independent security assessment of challenge runner, content integrity and trust-boundary labels before any promotion.
4. External evaluator study (3–5 volunteers with consent) and honest findings.
5. Separate owner decision before merging, replacing M75 judge deployment, editing Devpost or recording a replacement video.

No implication that a strong top-three outcome is guaranteed.

## M121 local QA and review independence

- Existing canonical owner-controlled case remained `DEMONSTRATED_FIX` after the stricter JSON consistency validator, with exact fixture head `df89b5d477693a0e4bacc27cd46179ad1a334019` and 5 source-tagged statements.
- Playwright-core with installed Edge (browser tooling kept outside repository) checked the root Git inspector and Arena at true 390/768/1024/1440px. Menu open/Escape/focus, nav-to-Arena, CI and behavioral lead buttons all passed. Horizontal overflow 0px, JS errors 0, network failures 0.
- New Arena links on Alibi Room and Your session initially introduced 54px overflow at 768px, reproduced in Playwright. Added a 631–1100px shared topbar wrapping rule and regression test. Repeated 390/768/1440px on Alibi, Your session, and Proof Chain: links reachable, overflow 0px, JS exceptions 0.
- Independent coding-agent review gate remains **INCOMPLETE**. Codex CLI review failed due account usage cap; a Kiro CLI read-only attempt did not yield an auditable report. These are operational blockers, **not** successful external security review.
- Tests and browser results describe a development worktree, not a production-certified release. Further review is required before merge or Devpost changes.
