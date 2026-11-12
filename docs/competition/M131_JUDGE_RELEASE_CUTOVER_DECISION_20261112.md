# M131 — Kiroween judge-release cutover decision

Status: **prepared; NOT APPROVED, NOT RELEASED**. Evidence checked 2026-11-12 (ICT). This document does not alter the existing submission.

## The judging problem

The *live Devpost submission* still directs judges to **M75** and filmed **V5D**, and says GitHub main's current release is `1230272391c958597d7c858510f195da00ccfcbc` with 533 passing tests. That statement is historical now. The actual main contains M118–M130 Arena/Gate, navigation, accessibility and a faster Kiro finding shortcut. Updating README alone does **not** update Devpost's separate hackathon submission record or its demo video.

| Surface | Verified source/status | Role |
| --- | --- | --- |
| Devpost official demo | https://specter-audit-2v5dynndc-nvhoa1691993-6852s-projects.vercel.app/ — deployment `dpl_6jDfU94quJ4FKT97kwoajGQ3rbJw`, source `0ce4565bf608ff497b913d76d930250861a73de1` | **Submitted M75**, must remain functional |
| Video V5D | https://youtu.be/kQKkw7Dkp-M — original filmed app source `09952ed7e2728cdc030051ee14c66e61d0953d98` | **Submitted video**, matches earlier filmed release |
| M130 verified Preview | https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/ — deployment `dpl_DgGfR9dMruo51Y38ZzsWFCd1idVs`, source `d8f8e7a9551db4046f144924a3bfbc8735a09e8b` | Development Preview; source **tree matches** merged main |
| GitHub main | `19dff09130178995e1cdbe63be7da6704a3770e3`; exact-SHA CI https://github.com/ShenJun93/specter-audit/actions/runs/43188414718 PASS; `npm test` 569/569 PASS | Authoritative integrated source, NOT automatically deployed to production |
| Historical production | https://specter-audit.vercel.app/ | Older M5L; do **not** substitute for current judge demo |

The M130 Preview was tested on 390/768/1024/1440px for Judge Fast Path and at 200%/300% test-only simulated zoom for focus. It remains a **Preview**, not an official submitted URL. M130 is not a new filmed video.

## Verified contest constraints

Official rules: https://kiroween.devpost.com/rules
Help on editing a **hackathon submission**, not only its portfolio project: https://help.devpost.com/article/123-how-to-edit-a-submission

- Submission changes are allowed **until Friday, December 4, 2026, 2:00 PM Pacific Standard Time**, corresponding to **Saturday, December 5, 2026, 05:00 ICT**. After that, portfolio updates are not submitted-content edits.
- The video should be **under 3 minutes**, must be public on YouTube, and judges are not required to watch beyond three minutes.
- The live application must run as depicted in the video/text; accessible free of charge for the judging period.
- GitHub must remain public, with visible OSI license, root `.kiro/`, truthful Kiro usage and source instructions.

## Options (do not confuse them)

A. **Keep M75 + V5D** — lowest immediate risk, but new Arena and M129–M130 Judge Fast Path improvements are invisible at the submitted working-demo URL. Leaving the Devpost description's historical “current main” references uncorrected is also a presentation risk.

B. **Change only demo URL to M130** — *not recommended*: video V5D demonstrates a different source/UI and recorded navigation. A judge could reasonably perceive inconsistency even though historical demo evidence is genuine.

C. **Coordinated M130-derived judge cutover** — **recommended candidate**: pin one **exact immutable release SHA**, validate an externally accessible deployment at that SHA, record a **new genuine** under-3-minute video using that deployment, update Devpost's **hackathon submission** demo/video/writeup together, and perform external readback of every link. Keep original M75/V5D as labelled historical evidence; never rewrite their authorship claims.

Do not attempt C until one deployment is locked to a specific source tree and the video footage actually demonstrates it. Changes to source after filming require a fresh parity decision.

## Proposed V6 video evidence storyboard (165 seconds target, not yet recorded)

| Elapsed | Actual proof required | Judge purpose |
| --- | --- | --- |
| 0–18s | Real title/primary CTA; show AI agent tests-then-edits question | Immediate differentiation |
| 18–43s | Real Kiro session 120 PASS and five later successful edits; include clear “saved, editable” limitation | Substantive Kiro provenance, bounded |
| 43–78s | Click **JUDGE FAST PATH → Reveal finding now** on new source; show **STALE LOCAL TEST EVIDENCE** with a readable close-up | Fast impact demonstration |
| 78–106s | Show a green CI record attached to wrong SHA, then exact-match provider observation (no correctness guarantee) | Engineering trust boundary |
| 106–138s | Open Arena and the owner-controlled public PR. Contrast GitHub reported CI vs reviewer-approved BASE fail / HEAD pass test; show **DEMONSTRATED_FIX** and `independentlyAttested=false` | Differentiation; do not claim attestation |
| 138–153s | Brief UNKNOWN/no evidence demonstration | Safe fail-closed behavior |
| 153–165s | Public GitHub/.kiro root + final next action, no false approval claim | Reproducible Kiro build evidence |

Only use real recorded browser footage and readable source/tool evidence. Do not show synthetic animation as if it were execution, or claim a hook is installed when it is not. Leave time for proper narration and scene transitions. This storyboard is **unfilmed** and does not replace the actual V5D video.

## Explicit release gates

1. **Claim integrity:** Label saved Kiro session *self-recorded and editable*. Arena challenge is a safe owner-controlled fixture; never call self-reported Docker JSON independently attested. Distinguish live provider status from immutable CI record. No general hostile-PR security claim.
2. **Source parity:** selected release SHA = deployed Preview SHA = SHA used during every filmed scene = publicly reproducible GitHub source, or clearly identify and explain the historical scenes.
3. **Behavioral:** Judge CTA → case 04 → quick reveal → correct bounded verdict; change cases and use legacy reveal; public Arena PR/commit links; all public routes HTTP 200; 390/768/1440 responsive and no browser JS/network errors.
4. **Security/quality:** exact-SHA GitHub CI, canonical tests, Kiro evidence links, no P0/P1 finding on release scope. An independent *human* Gate security review is desirable before any claim of hostile-PR execution; without it, keep owner-controlled scope only.
5. **Accessibility:** keyboard navigation, focused heading visible under zoom, manual checks for previously axe-incomplete elements. Automated axe zero violations is not WCAG certification.
6. **Release operations:** before changing **the submission**, owner approves the final SHA, public deployment, new video URL, exact text update and rollback; screenshot the current submission fields; after changes, verify submission history, live video public visibility and working-demo URL. Do not promote production or repoint shared aliases as a shortcut.
7. **Freeze:** preserve M75/V5D stable links through judging. Do not alter official submission before all gates and explicit approval. Confirm new demo remains publicly available for judging.

## Independent reviewer status

`docs/competition/M122_EXTERNAL_REVIEWER_STUDY_20261112.md` is a prepared protocol, **zero documented external studies** so far. Use the supplemental M131 scorecard to test first-use judge clarity. AI-simulated reviews and Codex are **not human reviewer results**.

**Decision now: CONDITIONAL GO for preparing a coordinated replacement; NO-GO for editing Devpost or declaring V6 finished.** A stronger demo is only valuable if judges can reproduce the recorded path and understand what the evidence does *not* prove.
