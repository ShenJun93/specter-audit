# Specter Audit — 2:45 judge video storyboard (DRAFT)

**Format:** English voiceover + real product screen recording at 1920x1080; clean captions; no copyrighted soundtrack. Target **165 seconds** (strictly less than 3:00). Primary path: https://specter-audit.vercel.app. Do not use generated fake terminal output or fabricated Kiro sessions.

**Core promise:** "Agents claim completion. Specter asks what Git actually supports." The product distinguishes Git path alignment from correctness and refuses self-reported test success.

| Time | Exact screen action | Narration / on-screen key message |
| --- | --- | --- |
| 0:00–0:15 | Hero then close-up of input `all tests pass` | "AI coding agents often say 'done.' But a completion claim is not evidence. Specter Audit interrogates the claim against Git metadata without modifying the repository." |
| 0:15–0:42 | Click first sample; show `UNVERIFIED` and test gap | "A claim that all tests pass remains unverified: no independently witnessed run has been supplied. Self-reported receipts cannot turn this into proof." |
| 0:42–1:10 | Click `updated auth login and all tests pass`, then expand evidence/gaps | "The changed auth file aligns with part of the claim, but no observed test result exists. Specter reports PARTIAL, not a misleading green success." |
| 1:10–1:31 | Click `updated auth login validation`, zoom `SUPPORTED` and disclaimer | "For a path-level change claim, Git alignment is supported. That still does not establish that the code works correctly." |
| 1:31–1:51 | Reveal top `SYNTHETIC SNAPSHOT` label, switch to real local fixture via `npm run demo` and loopback URL | "The public judge page uses a labeled synthetic Git snapshot. The local app can inspect a real selected Git repository read-only." |
| 1:51–2:12 | Back to hosted CI panel, click, show recorded timestamp, workflow source link | "GitHub Actions metadata is available for an exact published commit. The public result is a static, dated provider report—not a CI attestation for the synthetic claim." |
| 2:12–2:36 | Show actual `.kiro/specs/specter-audit/` and `.kiro/steering/product.md`, then authentic Kiro CLI session footage **only if verifiable** | "Kiro CLI helped implement the initial Git inspection milestone and early provider adapter. Specs and steering defined the read-only trust boundary; additional hardening was independently implemented and tested. The repository documents the division of work." |
| 2:36–2:45 | Final split screen: repository + live URL | "Specter Audit: confidence is earned, not declared. Try the live demo or inspect the source." |

## Filming gates

- Show actual results and screenshots captured from a verified site. Use the live demo only, **never edit verdict text in postproduction**.
- Keep `SYNTHETIC SNAPSHOT` visible at least once and explain it accurately; do not imply that the hosted website accesses a judge's filesystem.
- Verify authentic Kiro screen/session evidence before filming. Do not describe M5C–M5F ChatGPT/WAG work as Kiro-authored.
- Use the exact observed trio: `all tests pass` -> `UNVERIFIED`, `updated auth login and all tests pass` -> `PARTIAL`, `updated auth login validation` -> `SUPPORTED`.
- Video must be publicly hosted on YouTube, accessible without sign-in, and shorter than 3 minutes. Preserve an editable source project and a private QA receipt.

## Capture assets to produce

- Desktop browser screen recording with click paths (no synthetic compositing of results).
- Terminal screen recording of the local `npm run demo` command (use a disposable fixture).
- Authentic `.kiro/` and Kiro CLI evidence, no secrets or private unrelated repos.
- Short spoken narration with subtitles. Good audio, legibility, pacing and a restrained soundbed (or silence) matter more than elaborate motion graphics.
