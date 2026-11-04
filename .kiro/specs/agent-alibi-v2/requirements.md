# Agent Alibi Investigator v2 — Kiroween 2026 (2026-11-04)

## Problem
AI coding agents claim "fixed X, all tests pass" but receipts may be stale, on a
different commit, only self-reported or contradicted by an authoritative CI run.
Specter v1 matches wording to changed file paths. That is insufficient evidence
for test success or bug repair, and looks like a dashboard rather than a
memorable investigation.

## Competition outcome
Target Best Costume Contest with meaningful spooky interactions plus serious
evidence semantics. Judges need a visually legible, reproducible end-to-end
investigation of **real public GitHub Actions metadata** within 90 seconds.
Strong Kiro development provenance (authentic sessions/specs/code review) is
critical. No fabricated CI failures or source-code correctness claims.

## Milestone M6A — Alibi Engine (ChatGPT/WAG implemented; Kiro CLI attempts timed out)
Pure, deterministic, offline ESM function `analyzeAlibiCase(input)` in
`src/alibi-engine.mjs`; uses no network, Git, shell, browser, dependencies,
filesystem or external AI. Contract:

- input: `{schema:"SPECTER_ALIBI_CASE_V1",repo:{owner, name,workflowId},
  target:{sha,claim,observedAt},commits:[{sha,parents,committedAt}],
  checks:[{runId,sha,workflowId,runNumber,runAttempt,status,conclusion,
  updatedAt,sourceUrl,origin}],capturedAt}`.
- Every `sha` exactly 40 lowercase or uppercase hex, normalize to lowercase.
  `repo.owner/repo.name` safe GitHub slug components only. `workflowId`,
  `runId`, runNumber/attempt positive safe integers. Timestamp valid ISO with
  offset and no future provider updatedAt relative to capturedAt. Bound all
  arrays and strings (commits <= 100, checks <= 50, claim <= 2000). No
  arbitrary URL origins or string-to-HTML rendering.
- `origin` is explicitly `RECORDED_GITHUB_PROVIDER` or `SYNTHETIC_FIXTURE`,
  and output preserves it. A recorded check's link must point to exact
  `https://github.com/<owner>/<repo>/actions/runs/<runId>` with no
  credentials, query or hash. No provider authentication or signed attestation
  is claimed. Case JSON can still be tampered with; source links are inspectable
  but not cryptographic evidence.
- Checks must match EXACT repo workflow. Nonmatching checks cannot produce
  an aligned/pass/contradiction verdict (reject bad input or ignore with gap,
  but never silently present as verified).
- Duplicate run number and attempt with conflicting contents must not select a
  winner; fail closed. Select the newest FINAL `completed` check for exact
  target SHA based on runNumber, runAttempt and timestamp deterministic tie
  break. `success` -> `PROVIDER_REPORTED_PASS`; `failure`,
  `cancelled`, `timed_out`, `action_required` -> `PROVIDER_REPORTED_FAILURE`;
  pending/in-progress -> `INSUFFICIENT_EVIDENCE`.
- If NO exact target completed check, and prior successful check belongs to
  a commit strictly proven ancestor of target SHA via the provided parent
  graph, result `STALE_EVIDENCE`. Treat unknown/missing genealogy, forks or
  not-descendant as `INSUFFICIENT_EVIDENCE` with explicit gap. A successful
  check for the wrong SHA NEVER supports a claim at the target SHA.
- If several valid checks exist, a newer success on exact target SHA supersedes
  earlier failure/stale; a newer failure supersedes earlier success for that
  workflow+SHA (record latest attempt and relevant earlier history).
- No test run in this case may infer whether a coding agent fixed the bug.
  The output must state `providerReportedOnly:true`,
  `semanticCorrectnessVerified:false`, `independentAttestation:false`.
  **Never** output bare "VERIFIED" for a code-correctness claim.
- Output: stable, serializable object `{schema:"SPECTER_ALIBI_VERDICT_V1",
  status,headline,reason,selectedRun,observations,events,gaps,limitations,
  provenance}`; no PII or source contents. Events have sortable timestamps,
  explicit sourceKinds and no invented durations. Avoid arbitrary HTML.
- Invalid/malformed input fails closed with typed safe exception rather than a
  "green" result; tests assert malformed/provider attacks cannot elevate.
- Keep existing v1 inspector, `evaluateClaim`, hosted demo & tests unchanged
  during M6A. No commits/push/deploy until verification.

## M6B — Real proof case pack (separate milestone)
Use actual public GitHub runs from `ShenJun93/specter-audit` with linked
provider URLs and real Git commit graph. The historical successful CI on
`374af14` is **insufficient on its own** for later merge `b6e1407` (stale
artifact); a separate latest successful run `41742626694` for `b6e1407`
provides current same-SHA provider report. Treat this as an investigation of
specific evidence artifacts, not that *all tests were unrun* or that any CI
pass proves source correctness. No invented failed GitHub run.
Generate operator-reviewed static pack with capture time and check validation;
user-supplied case packs are UNATTESTED by default.

## M6C — Haunted investigation experience (separate milestone)
Interactive case selector with 3–4 contrasting cases, chronological
evidence timeline, source links, evidence-gaps summary, "Reveal alibi" decision
and a visible specimen/synthetic provenance chip. Keyboard, reduced motion,
responsive. 90-second reproducible judge path. Integrate without altering
existing production semantics until E2E tests pass.

## M6D — Kiro showcase and entry
Kiro CLI implements significant v2 source. Record exact Kiro sessions,
output diff and tests. Judge video <= 180s shows real app, local and provider
source, Kiro work, and consistent caveats. Devpost publication needs user
eligibility declarations; no auto-submit.

## Explicit prohibited shortcuts
- Never claim a mismatched SHA's successful run proves current claim.
- Never present synthetic fixture failures as provider facts.
- Never call public unauthenticated Github API on every hosted page view.
- Never execute test commands or read source files from untrusted repositories
  as part of this engine.
- Never weaken previous local read-only security boundaries or v1 tests.
