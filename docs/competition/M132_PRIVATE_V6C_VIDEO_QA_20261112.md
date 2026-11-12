# M132 — Private V6C judge video capture and QA receipt

Date: 2026-11-12 (ICT)

**Status: PRIVATE REVIEW CANDIDATE. NOT UPLOADED, NOT PUBLISHED, NOT SUBMITTED.**

This document records video candidate evidence and release limits. It **does not** mean the V6C video has passed human visual/audio acceptance, gained external reviewer validation, or replaced the live Kiroween submission.

## Exact source and artifact identity

| Item | Verifiable identity |
| --- | --- |
| Public captured application | [M130 SHA-matched Vercel Preview](https://specter-audit-pi5tpg7i7-nvhoa1691993-6852s-projects.vercel.app/) |
| Captured Preview SHA | `d8f8e7a9551db4046f144924a3bfbc8735a09e8b` |
| Integrated GitHub main SHA | `19dff09130178995e1cdbe63be7da6704a3770e3` (source tree compared with Preview source in M130 review) |
| Private MP4 file | `SPECTER_M132_JUDGE_V6C_PRIVATE_CANDIDATE_159s.mp4` — stored on the owner's local Windows machine **outside the Git repo** |
| Exact video SHA-256 | `ae7d58b90eaf94d698a851cff94c685d21f2add72c2447c3511a925576e459de` |
| Duration / resolution / codecs | **159.021333 sec**; **1920×1080**, H.264, **30 fps**; AAC English narration |
| Verified private review ZIP | `SPECTER_M132_V6C_PRIVATE_REVIEW_PACKAGE_VERIFIED.zip`, SHA-256 `a3e0289651e280bba0ef84ee5f8247b4fca89b70900ca0165d5477d4403a158e`; 18,113,841 bytes |
| Existing official submitted demo | M75 at `https://specter-audit-2v5dynndc-nvhoa1691993-6852s-projects.vercel.app/` — **unchanged** |
| Existing official public video | V5D at `https://youtu.be/kQKkw7Dkp-M` — **unchanged** |

No MP4 or ZIP binary has been pushed into this public repository.

## Eight real browser scenes

Captured with Playwright controlling an installed Microsoft Edge, using the fixed M130 public Preview rather than mockups:

1. Real homepage → Judge Fast Path → case 04.
2. Redacted saved genuine Kiro CLI session: 120 prior PASS and five later source edits; **no subsequent retest observed within that session**.
3. M129–M130 quick reveal: `STALE LOCAL TEST EVIDENCE` with bounded next steps; does not claim the final code is broken.
4. Case 01 stale older SHA versus case 02 exact matching provider-reported CI; not semantic correctness or merge approval.
5. Specter Arena's **owner-controlled** public PR fixture, separate CI and reviewer-approved challenge leads, **Base FAIL / Head PASS**; single-test `DEMONSTRATED FIX` only, **`independentlyAttested=false`**. No claim of external adoption.
6. Clearly labelled synthetic insufficient Kiro-claim evidence (the UI shows no supported test-pass claim; **not** a forged PASS).
7. Real public GitHub `.kiro/` tree and session-staleness analyzer source, at merged main SHA.
8. Return to the working application and explicit “Trust the evidence, not the claim” close.

There are **eight local real browser recordings** in the private M132 workspace. Automated capture checks recorded **zero page JavaScript exceptions and zero app/repository mutating requests**. The voiceover is **AI-generated English neural speech**, not live human speech. Video captions were generated from word timings, burned into the MP4, with an independent **50-cue SRT** included.

## Rendering and QA

- Video was produced from recorded Edge browser clips, with FFmpeg timing/scale/captions only. The evidence, verdicts and UI were **not reconstructed in synthetic frames**.
- During visual review, initial versions V6/V6B contained a real browser-loading white frame. V6C trims **only recorded loading frames** before opening dark-app scenes; a short GitHub page-loading transition was also cut. The GitHub code page's light background is genuine.
- FFprobe confirmed 159.021333 seconds, 1920×1080 H.264 30 fps and an AAC audio stream.
- A full FFmpeg decode across the entire MP4 completed with no decode errors.
- Independently sampled **16 actual video frames** into a private contact sheet; frame luminance/variance checks passed. The opening scan confirmed dark application frames at t=0 for the hook, Kiro, CI and outro; no 4.5-second browser-white intro remains.
- SHA-256 of the final video matches both the render and independently computed visual-QA receipt; the verified ZIP passed archive integrity checks.
- The private review package includes the exact MP4, 16-frame contact sheet, English transcript, 50-cue SRT, capture manifest, narrator manifest and JSON QA receipts.

Automated media QA does not establish clear narration volume, human comprehensibility, screen-reader access, or that a judge can read every small on-screen source line. **Human start-to-finish viewing/listening and 3–5 actual external reviewer studies are still required.**

## Release decision and exact guardrails

**Current disposition: CONDITIONAL GO for private review only; NO-GO for publishing a V6C replacement yet.**

Before changing the Kiroween submission:

1. Human-review **the entire 159-second MP4**, particularly readability of Kiro tool evidence, Arena Base/Head labels, on-screen captions, voice intelligibility, unverified claims and source parity. If a scene is confusing, revise and regenerate the SHA-bound receipt.
2. Confirm the selected video and exactly one pinned, public, stable, source-matched Preview. Avoid swapping demo URL while keeping unrelated historical footage presented as current.
3. Confirm the explicit owner decision to publish a new video to YouTube Public and update the actual **hackathon submission** demo URL, video URL and writeup in one coordinated change before the official deadline. Do not use a Git branch merge or deployment Preview as implicit release approval.
4. Verify YouTube public visibility and under-three-minute playback, external app routes and Kiro evidence, Devpost's saved submission fields, and leave M75/V5D historical links intact for reproducibility.
5. Do not claim independent security certification of Docker Gate, cryptographic attestation of editable Kiro session logs, or 3–5 human reviews that have not happened.

**No production, YouTube visibility, existing YouTube video, Devpost fields, Vercel aliases, or M75 deployment were changed by M132.**
