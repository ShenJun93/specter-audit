# M131 — First-time reviewer validation, consent-first

**Status: NOT CONDUCTED — 0 actual external people, 0 responses.**

Purpose: determine whether a first-time developer/reviewer can understand Specter Audit's key decision within 60–90 seconds. The result must not be misrepresented as verified adoption, independence of execution or security certification.

## Links and consent

Provisional **M130 development Preview**, not the official M75 Devpost entry:
- Start: https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/
- Arena: https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/arena.html
- Source and scope: https://github.com/ShenJun93/specter-audit/commit/19dff09130178995e1cdbe63be7da6704a3770e3

Please ask permission to time or retain anonymized answers. No signup, credentials, private repos, uploaded session logs, person names, emails, screen recordings or private screenshots are needed. The displayed public PR fixture is **owner-controlled**. Anyone who knows the answer in advance should not count as a blind first-time reviewer.

## Shareable invitation (send only after the owner approves recipients)

> I'm testing a free, read-only browser demo built for Kiroween. Could you spend about 3 minutes as a first-time code reviewer? It uses public and recorded example evidence; no account or files are needed. I'm checking whether its claims and limits are understandable, not asking for a positive testimonial. Participation is voluntary. Please say whether I may record an anonymous 0–4 task score and approximate time. Preview: https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/

## Task A — no hints, first 60 seconds

Show only the homepage link. Say:

> An AI agent reports its code is done. Use this application to decide what the supplied evidence does or does not justify. Explore on your own. Tell me your conclusion and the next action you would take.

**Observer notes**, not to be read to participant until afterward:
- Did the reviewer find the primary Judge Fast Path?
- Did they discover the finding without prompting?
- Did they recognize that 120 past passing tests followed by later edits is **stale evidence**, not evidence of a broken application?
- Did they suggest rerunning tests after the latest edit?
- How long until a useful explanation? Record seconds only with consent.

## Task B — new link, 90 seconds

Show the Arena link without giving the expected verdict:

> This case contains public PR information and a separate reviewer-controlled behavior challenge. Tell me what the green CI result shows, what the base/head challenge shows, and whether it is enough to approve a merge.

Do **not** give participants the terms DEMONSTRATED_FIX, UNKNOWN or attestation in advance.

**Observer notes:** can they locate the base/head SHA, distinguish provider-reported success from the approved single test, understand the reported result's limitations, and recommend a further test/review rather than treating it as approval? A locally fabricated but internally consistent report is **not** authenticated execution.

## Anonymous scoring rubric — 0 to 4

One point each:
1. Finds the core finding unaided.
2. Correctly distinguishes stale evidence from proven broken code.
3. Distinguishes CI report from the bounded reviewer test; does not claim independent attestation.
4. Recommends a sensible next action (e.g. rerun relevant tests, verify exact SHA, independently review changes).

Track critical confusion and adverse feedback verbatim **only with specific consent**, stripping identifying details. Time-to-useful-answer can be unknown; do not force a guessed number.

| Reviewer | Consent | Role category (optional) | Task A time | Task B time | Score /4 | Misread/blocked step | Suggested change |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E01 | NOT CONDUCTED | — | — | — | — | — | — |
| E02 | NOT CONDUCTED | — | — | — | — | — | — |
| E03 | NOT CONDUCTED | — | — | — | — | — | — |
| E04 | NOT CONDUCTED | — | — | — | — | — | — |
| E05 | NOT CONDUCTED | — | — | — | — | — | — |

Only when at least 3 actual external people have participated may the report discuss observed reviewer comprehension, with denominators, failures and method limitations. If nobody volunteers, report **0 external evaluation**. Do not ask an AI to invent participant identities, quotes or success metrics.

## Decision interpretation

- **Revise UX explanation** if participants mistake a stale test for confirmed broken code, a CI green badge for proof of correctness, or the single Docker challenge for authenticated/independent attestation.
- **Prioritize navigation/CTA** if reviewers cannot reach the finding inside 60 seconds.
- **Do not broaden Gate execution to hostile PRs** as a response to reviewer feedback. This would require independent security review and stronger isolation outside local Docker.
- This is a **usability study**, not a penetration test or certification; it supplements but does not replace the M122 security reviewer protocol.

**No invitation has been sent and no responses have been collected as part of this document.**
