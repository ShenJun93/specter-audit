# M20 — Kiroween judge demo: 2:45 capture and edit blueprint (2026-11-08)

**DRAFT PRODUCTION PLAN — NOT A FINISHED VIDEO; NO YOUTUBE LINK EXISTS.**

## Exact capture authority

- **Public browser source:** https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/
- **Version:** `feat/m19-judge-first-run` at `09952ed7e2728cdc030051ee14c66e61d0953d98`. Verify URL before filming, reject later unreviewed builds.
- **GitHub evidence:** https://github.com/ShenJun93/specter-audit/actions/runs/42451296583 — exact-M19 524/524 CI tests with signed JSON receipt. *This is CI receipt provenance, not Kiro-session attestation.*
- **Kiro-authorship narrative:** `docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md`; root `.kiro/specs` and `.kiro/steering`. No new running Kiro hook.
- **Target:** 165 seconds at 1920×1080, 30 fps, English audio and embedded readable English captions. Hard stop **under 180 seconds**; no login, no private session logs, no fabricated terminal output, no copyrighted music or footage.

## Director's timeline — 8 scenes / 165 seconds

| Time | Real screen/action | Voiceover (original script) | Judge evidence goal |
| --- | --- | --- | --- |
| 00:00–00:12 | Browser on M19 home. Focus on the primary Judge Fast Path card. | “An AI agent reports one hundred and twenty passing tests. Then it edits the source five more times. Can we still trust that earlier green result?” | Problem + memorable hook |
| 00:12–00:37 | Click **Investigate the Midnight Rewrite**. The URL becomes `/alibi.html#case-room`; case 04 is selected. Keep **AUTHENTIC KIRO CLI SESSION · LOCAL SELF-RECORD** visible. | “Specter Audit follows evidence rather than confidence. This is a redacted, genuine Kiro CLI coding-session record. We can inspect it here without uploading a file or creating an account.” | Authentic use and zero-friction UX |
| 00:37–01:03 | Scroll timeline: tool-observed 120 tests and reported PASS, then five source edits. Click **Expose the alibi**; display `STALE LOCAL TEST EVIDENCE` and caveat. | “The saved session records a passing test and the agent’s success claim. Five later edits appear, but no later successful retest appears in that saved record. The old result is stale—not proof that the final code is broken.” | Clear chronological logic + bounded verdict |
| 01:03–01:25 | Switch among a **wrong-commit CI** exhibit and a **matching-commit CI** exhibit. Select Reveal on each. Briefly emphasize the source revision and warning that reported CI is not correctness. | “A green CI result on the wrong commit is a borrowed alibi. A run on the matching commit is better evidence, but it still doesn’t prove the software is correct. Specter preserves that boundary.” | Novel evidence/commit reasoning |
| 01:25–01:52 | Navigate to `/pr-proof.html`. Show PR #7 input, **no auto-fetch**. Click **Inspect this PR**. Wait for actual GitHub API response; zoom `OPEN · DRAFT` and `RUNS OBSERVED, NOT CERTIFIED`, plus `UNBOUND`/incomplete evidence. | “On a public pull request, inspection is explicit and read-only. We observe the head revision, draft state and provider workflow metadata. We do not pretend the public CI run independently links to a private Kiro session or approves a release.” | Real external integration + integrity |
| 01:52–02:17 | Open `/live.html`. Show built-in synthetic scenarios. If using a fixture, label it **SYNTHETIC** continuously. No private file chooser, log or real user data in footage. | “For another Kiro session, a developer can inspect their own message log in their browser. The parser looks for recorded test outcomes, later source edits, and corrections. Private logs stay local; these visible examples are synthetic.” | Usable workflow + privacy |
| 02:17–02:35 | Display public GitHub repository at M19 branch, root `.kiro/specs` and `.kiro/steering`, and M6E provenance note with file names and recorded 18 write/replacements. Optionally show exact-M19 CI run number with signer proof. | “Kiro CLI implemented the original Git inspector, contributed to GitHub evidence handling, and authored the session-staleness analyzer. Specs and steering captured our evidence boundaries. Additional UI, audits and release work used separate tooling—and we disclose that division.” | Honest, tangible Kiro engineering |
| 02:35–02:45 | Return to M19 app and source URL. End frame: **Trust the evidence, not the claim.** | “Specter Audit: when the agent says done, ask what the evidence actually supports.” | Clear close and action |

**Timing sum: 12 + 25 + 26 + 22 + 27 + 25 + 18 + 10 = 165 seconds.** This provides a 15-second legal margin; do not insert an intro bumper or end slate that pushes duration to three minutes.

## Filming workflow (actual product footage, not a scripted fake)

1. **Lock source:** record the SHA, deployment ID `dpl_AhiY61BS1PVR4UuQ5Z4PzSDzU5VJ`, verified URL and date in the private capture receipt. Use the M19 Preview, not `specter-audit.vercel.app` production and not the older M8.8 Preview.
2. **Desktop capture:** 1920×1080 Chrome/Edge, browser zoom 110–125% if text is small, hide personal browser profile and extensions, turn off notifications. Record each scene as a separate take, including actual clicks, loading, and real verdict DOM.
3. **Evidence checks before each take:** case 04 `real-kiro-session` is actually enabled; timeline shows 120 successful tests followed by five later edits; reveal is `STALE_LOCAL_TEST_EVIDENCE`; never imply a test did not run outside the recorded transcript. PR #7 state comes from a fresh opt-in GitHub GET, can change over time; **do not hard-code or overlay its state** if live data changes. If provider rate-limits, record a truthful UNKNOWN result or postpone that take, do not mock in footage.
4. **Synthetic clips:** when demonstrating Live Investigator examples, keep the synthetic label visible. Never insert real `messages.jsonl` into public recording and never make a fabricated terminal look like Kiro CLI output.
5. **Kiro-authorship proof:** show checked-in source/spec references with independent M6E local self-record limitations. Do not claim a running PostFileSave hook; M9B remains quota blocked. No fake Kiro session animation.
6. **Postproduction:** short hard cuts, clean text callouts for status names and commit boundaries; optional subtle ghost sound design made with original/rights-cleared audio only. Do not replace the actual verdict text or source URL through overlays, cropping, AI generation, or editing.
7. **Accessibility:** English voiceover transcribed verbatim to captions; high contrast labels; keyboard focus and 2-second holds on each final verdict; check comprehension at normal playback speed with a first-time viewer.
8. **Export QA:** MP4 H.264/AAC 1080p, 30 fps; check duration below 180s, visible tooltips/clicks, audible English narration, accurate subtitle spelling, no private tokens, browser user data or third-party copyrighted music.
9. **YouTube:** user-authorized public upload only; check public anonymous playback and timestamp, copy actual YouTube URL into Devpost candidate, then seek approval for official submission.

## Cutaway/QA checklist

- [ ] Homepage CTA click on the **exact M19 Preview**
- [ ] Verified genuine Kiro exhibit case 04 and chronology, privacy-safe
- [ ] Verdict clearly states **STALE LOCAL TEST EVIDENCE**, not "broken code"
- [ ] Wrong vs matching GitHub CI cases and evidence limitations
- [ ] PR #7 real GET path with draft/unknown status **as actually observed at filming time**
- [ ] Live Investigator labeled synthetic (unless separate consented private evidence is explicitly approved)
- [ ] Actual `.kiro/` and Kiro-authored module/provenance reference
- [ ] No invented live Kiro PostFileSave or production merge
- [ ] English captions and audio, actual runtime footage, no copyrighted tracks
- [ ] Independent viewer acceptance, public YouTube link, length 165s target (strictly <180s)
- [ ] Devpost fields point at same version filmed and app remains accessible during judging

## Optional alternate ending if Kiro credits are redeemed before recording

If genuine native M9B `PostFileSave` hook is created by Kiro and its installation receives explicit approval, **then** consider replacing the 18-second Kiro provenance scene with verified hook test/edit/retest footage. Recut the entire voiceover to remain under three minutes; do not add a claimed hook based on synthetic harness tests alone.

**Status: STORYBOARD READY / VIDEO NOT CAPTURED OR PUBLISHED.**
