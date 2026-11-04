# Alibi Engine M6A — design and tradeoffs

**Source of truth:** Exact CI status is *provider-reported* by GitHub Actions
for one workflow and one commit, not independent execution attestation.
A Git commit ancestry graph can establish that a previous CI run is an artifact
for a different ancestral revision. If the graph is incomplete, fail closed.

## Pure module
`src/alibi-engine.mjs` exports `analyzeAlibiCase(input)`.
No I/O. Use `node:test` in `test/alibi-engine.test.mjs`.

Normalization and validation happen before verdict. Reject malformed fields,
unknown source origins, mismatched workflow, invalid GitHub run URL,
inconsistent duplicate records, nonmonotonic timestamps, unsafe arrays.
Do not accept external clocks as authoritative proof.

Build commit map and DFS/BFS ancestor search with a visited set and bounded
depth. Strict ancestry only if the graph includes a connected chain from
target to checked SHA. Missing graph nodes give UNKNOWN, not false NO; cycles
are invalid. A merge commit with two parents is supported. Each node's
committedAt is metadata, not a proof test ran before/after the user's claim.

Choose latest run FOR THE EXACT TARGET SHA first; if current pending run is
newer than prior success, show `INSUFFICIENT_EVIDENCE`, not stale pass.
On no matching run, consider other workflow-matching previous success whose
SHA is a proven ancestor. Only then `STALE_EVIDENCE`; preserve all source
links and the target SHA in the event log. Otherwise insufficient.

Verdict vocabulary purposely avoids `VERIFIED`:
`PROVIDER_REPORTED_PASS`, `PROVIDER_REPORTED_FAILURE`,
`STALE_EVIDENCE`, `INSUFFICIENT_EVIDENCE`.
Never use `SUPPORTED` as a surrogate for code correctness.
Return `selectedRun` and sorted event timeline in JSON-safe primitives.
Provider source errors never elevate outcomes. Lowercase the exact SHAs.

## Minimal acceptance matrix
1. current SHA success => PROVIDER_REPORTED_PASS with limitation.
2. current SHA failure => PROVIDER_REPORTED_FAILURE.
3. earlier SHA success ancestor of target => STALE_EVIDENCE.
4. earlier SHA success not proven ancestor => INSUFFICIENT_EVIDENCE.
5. current SHA pending later run than success => INSUFFICIENT_EVIDENCE.
6. two runs for exact SHA, later attempt success supersedes failure.
7. wrong workflow/source URL=> throw/fail closed.
8. wrong sha string, absurd array sizes, cycle, duplicate conflicting ID=> throw.
9. provider-reported pass never marked attested or semantic verified.
10. handles merge-parent ancestry and missing branch edges without inventing facts.

## Provenance (actual, verified 2026-11-04)
The intent was to use Kiro CLI as M6A implementer. Multiple genuine Kiro CLI
v2/v3 sessions read the spec but timed out before writing either source or
tests. The resulting M6A engine, tests and M6C UI were therefore implemented
through ChatGPT/WAG; these files must **not** be described as Kiro-authored.
Kiro's early M1 and M5A/M5B contributions remain documented separately.
A later bounded Kiro-authored feature is still a contest gate.
