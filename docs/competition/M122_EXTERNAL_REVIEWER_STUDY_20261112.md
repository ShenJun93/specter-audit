# M122 — External reviewer study: execution-ready, **not yet conducted**

Objective: independently assess whether a first-time reviewer understands the difference between a GitHub green CI result and a bounded reviewer-owned behavior challenge. We seek **3–5 actual external volunteers**. A synthetic fixture review performed by the project owner or an AI agent does **not** count as an independent human evaluation.

## How to run

Share the exact SHA-matched **separate Specter Arena Preview** (not production). The currently validated M121 Preview is `https://specter-audit-gx47pvaqg-nvhoa1691993-6852s-projects.vercel.app/arena.html`; update it only after validating the new M122 Preview. No login, file upload, access token or source edit is required.

Ask permission before observing timing or collecting answers. Inform the reviewer that the fixture is **owner-controlled synthetic**, not an external customer's PR. Collect no personal identity, screenshots of private windows, repository credentials or private logs. Do not record identifiable comments without specific consent.

Give these instructions **without stating the answer**:

> Open the case file as if you were reviewing a coding agent’s claim that a PR is safe to merge. Inspect the two evidence leads. Determine what the evidence shows, what it cannot show, and the next action you would recommend. Stop whenever you have an answer.

Record independently:

1. In 60 seconds, can you find the public PR and its exact base/head commits?
2. Does a green CI status prove the single reviewer-controlled test passed on both commits? Explain.
3. Which classification is supported by the reviewer test (fix, regression, both pass, both fail, or unknown), and how is that limited?
4. What would you verify before approving merge or release?

## Anonymous scorecard

Each reviewer gets an arbitrary local code E01–E05. The operator may record only an opt-in anonymous category (e.g. developer / tester / AI tooling user), elapsed seconds and answer accuracy, if explicitly approved.

| ID | Consent | PR/SHA found | CI vs challenge correct | Verdict + scope correct | Next action sensible | Time to useful answer | Major confusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | NOT CONDUCTED | — | — | — | — | — | — |
| E02 | NOT CONDUCTED | — | — | — | — | — | — |
| E03 | NOT CONDUCTED | — | — | — | — | — | — |
| E04 | NOT CONDUCTED | — | — | — | — | — | — |
| E05 | NOT CONDUCTED | — | — | — | — | — | — |

Suggested per-person score: 0–4, one point for each of the four questions above. Report every sampled result, including misunderstandings; do not select only favorable testimonials. "Understandable to external reviewers" requires at least three actual evaluations; zero responses means **no external validation**.

If an independent reviewer reports confusion about the scope, change the explanation before adding new functionality. Do not invent a customer success story or use these synthetic fixture tasks as proof of production adoption.

## Release recommendation conditions

- **GO for consideration, not automatic merge:** independent code audit completed, exact SHA GitHub CI/Preview green, three or more consented external studies with documented results, no severe provenance confusion and no P0/P1 security gaps.
- **NO-GO:** any unvalidated claim of attestation, user adoption, hostile-PR isolation or complete correctness; unresolved P0/P1 issue; unexplained CI failure; mistaken external-test statistics.
