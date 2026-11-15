# M203 — independent developer first-use study: operator protocol

Date: 2026-11-15. **Status: PREPARED, NOT CONDUCTED. Independent participants: 0/5.**

## Why this is a release-relevant study

Kiroween 2026 explicitly scores **Potential Impact** (real audience, demonstrated usefulness, whether someone would use it), plus Design and Presentation. Automated CI, synthetic case fixtures, browser smoke tests and AI-generated critiques are not evidence that human developers understand or would adopt Specter Audit.

The question to test: **Can an unfamiliar developer turn an AI coding-agent completion claim into a properly scoped review decision and a concrete next verification action, without treating a green test badge as proof of correctness?**

## Current, exact study surface

- **Submitted M130 demo, no-login:** https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/
- **Filmed source commit:** d8f8e7a9551db4046f144924a3bfbc8735a09e8b
- **One task sheet for volunteers (do not add answers):** [M203_REVIEWER_PROMPT_20261115.md](M203_REVIEWER_PROMPT_20261115.md)
- **Voluntary public reply channel:** https://github.com/ShenJun93/specter-audit/issues/28
- **Filmed V6H:** https://youtu.be/yabjJ5JpsS0
- **M196 separate QA Preview:** https://specter-audit-6w9iolc2n-nvhoa1691993-6852s-projects.vercel.app/ — **not the submitted study entry**.
- **Historical protocol:** [M122 study](M122_EXTERNAL_REVIEWER_STUDY_20261112.md) referenced an earlier M121 Preview. Do not silently treat those two earlier URLs as the present submitted demo.

## Known UI priming — do not score recall as independent reasoning

Verified against the exact submitted M130 Preview on 2026-11-15 using an actual pointer-driven browser journey: the **homepage's Judge Fast Path CTA already states that 120 tests passed and five later edits occurred**, and Case Room describes that same chronology **before** the Reveal interaction. A fresh reviewer can therefore repeat these facts without having inferred anything from the evidence timeline. **This is a first-use usability/comprehension exercise, not a blind inference or controlled experiment.** Score the *explanation of the evidence gap*, its limits and a specific follow-up action; do not award points for merely repeating the pre-disclosed 120/5 numbers. Report this priming limitation in any study outcome, including a positive one.

## Execution and ethical boundaries

Recruit **3–5 adults with relevant software review, testing or AI coding-agent experience**, outside the project's author/contributor/tester circle. Avoid automated outreach or unsolicited mass messages; share the study link voluntarily in appropriate channels whose rules allow it. **No one has been recruited or counted merely by opening issue #28.** Do not request personal identities, private repository links, company details, screenshots or unpublished agent transcripts.

Present only the [neutral task sheet](M203_REVIEWER_PROMPT_20261115.md) before the reviewer begins. Do not give them the expected verdict, direct them to this operator scoring protocol, coach them, or mention which UI is under test. If observing or timing a session, ask for explicit permission first. A GitHub issue comment is public and non-anonymous; anyone who does not want that disclosure may skip the comment.

In the first minute, ask the participant to find and explain the Case 04 finding and choose a next verification action. A complete five-minute session may also include the Arena task and adoption question. Record time **only with the reviewer's agreement**. When a session is interrupted or timed out, mark it **not completed**, not a pass or failure.

## Scoring after the participant responds (not before)

Score each completed response 0–4, one point per category, and preserve verbatim **non-identifying** misunderstandings when consented:

| Criterion | 1 point if participant independently demonstrates |
| --- | --- |
| A — reasoning | The reviewer explains **in their own words why** an earlier passing test record cannot establish that the later edited source was tested. Simply reciting “120 passed, five later edits” from the UI does not earn a point |
| A — limits | They do **not** infer code is broken or no other testing happened; external tests and exact repository binding remain unknown |
| A — next action | A specific action to close the gap, e.g. rerun relevant tests on the exact final source/commit and inspect the resulting evidence |
| B — trust boundary | Arena's Base FAIL / Head PASS is one owner-controlled, self-reported behavior test; provider CI is provider metadata; neither alone certifies merge safety or customer adoption |

A "yes, would use" response is a **stated preference, not evidence of actual adoption**. Record no invented testimonials, external test run counts or user statistics. Report negative and positive feedback together. **3–5 purposively recruited people do not establish statistical representativeness**.

## Blank scorecard — DO NOT pre-populate observations

| Reviewer code | Consented? | A reasoning | A limits | A next action | B boundary | Time to first useful answer (opt-in) | Adoption answer | Major friction |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | NOT CONDUCTED | — | — | — | — | — | — | — |
| E02 | NOT CONDUCTED | — | — | — | — | — | — | — |
| E03 | NOT CONDUCTED | — | — | — | — | — | — | — |
| E04 | NOT CONDUCTED | — | — | — | — | — | — | — |
| E05 | NOT CONDUCTED | — | — | — | — | — | — | — |

The operator must distinguish **responded**, **completed**, and **consented**; do not infer from mere GitHub comments that reviewers are independent. Do not count Codex, Kiro, ChatGPT, WAG, owner, contributors or scripted tests as human participants.

## Interpreting results and planning changes

- **Potential Impact supported by qualitative evidence:** at least 3 real, consented complete evaluations, with both comprehension and adoption-blocker responses documented.
- **Actionable product signal:** recurrent confusion or a reproducible navigation defect should drive a small source change with a test rather than an additional AI-generated dashboard.
- **Presentation signal:** if reviewers cannot explain the value proposition in their own words, revise the short pitch before implementing new architecture.
- **Do not change the submitted Devpost M130 link** based on reviewer feedback without a separately verified supported edit flow. Devpost submission #1281241 remains authoritative, and its filmed V6H is a historical M130 snapshot.
- **Do not conflate self-reported adoption intention with product-market fit, security attestation or proof of developer outcome.**

As of creation, **the study is not conducted; no independent human responses have been recorded**. Any future summary must cite exact collected source evidence and note sampling bias.
