# Specter Audit competitive reset — 2026-11-04

## Verdict on V1
M5L shipped safely, but v1 evaluator matches claim tokens to modified *file
paths*, not semantics and not independent test execution. Real counterexample:
claim `fixed authentication vulnerability` with only modified
`docs/authentication.md` returned `SUPPORTED`. This is within the stated v1
scope but is weak for a hackathon seeking novelty and functional impact.

The production demo is a frozen clearly labeled synthetic snapshot.
GitHub CI panel is a recorded historical source run, not proof of arbitrary
completion claims. 143 green tests support regression safety, not prize score.

## Objective
Compete meaningfully for Kiroween 2026 **Best Costume Contest** ($5k).
Official scoring dimensions (five equal 1–5 scores): Potential Impact,
Technological Implementation / effective Kiro use, Design, Innovation and
Presentation. Kiro's rules warn insufficient Kiro use can disqualify.
Deadline 2026-12-04 22:00Z.

## Product bet
`Agent Alibi Investigator`: audit whether a claimed completion revision
actually has an exact-commit GitHub Actions result and show when the only
supplied successful run is for an ancestor commit.

Primary WOW moment: select a real historical CI run for commit A against a
claim at later merge B; timeline reveals SHA mismatch / proven ancestry.
Then reveal later CI on exactly B and distinguish current provider-reported
pass from correctness. The demo must explain that the app is auditing
**evidence alignment** and not semantic correctness.

## Prioritized roadmap
M6A pure evidence engine (Kiro implementation), M6B real captured case pack,
M6C Haunted evidence timeline and interactive reveal, M6D authentic Kiro
development story and 165-second judge video.

## Hard gates
- Engine detects stale artifact with exact SHAs and ancestry, not merely terms.
- Can demonstrate 2+ *real recorded provider* runs with source URLs.
- No false negative: if exact new successful run exists, output must not say
  the repository has no successful CI; it may say an older cited artifact is
  stale relative to a newer commit.
- Every demo source tagged `recorded-public-provider` vs `synthetic`.
- Kiro genuinely authors significant source and test files; record a real
  session rather than claim all ChatGPT/WAG work as Kiro-authored.
- Browser desktop/mobile acceptance, code review, and contest video pass.

No changes to production until all gates for the next candidate pass.

## M6A–M6C local verification update (2026-11-04)

- Completed pure `analyzeAlibiCase` deterministic engine with exact SHA, Git
  ancestry, recorded CI run identity/attempt and stale evidence analysis.
  27 engine tests, including a case where CI completed only after the
  agent's hypothetical claim, pass. No semantic correctness or signed
  attestation claims.
- Captured two actual public GitHub runs and a bounded Git ancestry graph.
  Historical ancestral success is **stale as a cited artifact**; a later
  success exists for the exact newer commit. Never imply no current CI.
- Built the standalone Alibi Room with haunted interactive timeline,
  revealable verdicts, fixed-source links and client-side fail-closed data
  validation. Desktop/mobile390 real Chrome acceptance PASS, zero console
  errors and zero external browser requests. Local static route test PASS.
- Original v1 behavior remains available. No production deployment yet.
- Genuine Kiro CLI implementation attempts timed out with **no source files
  authored**. Thus v2 engine/UI are ChatGPT/WAG-authored, and the Kiro
  Implementation score remains a serious open competition risk.
- Next gates: independent review, source/CI PR/preview, real Kiro-authored
  contribution, judge video and final Devpost submission.
