# M10 Evidence Trial — Local acceptance (2026-11-06)

**Verdict: LOCAL EXPERIMENT PASSED CORE + CHROME; RELEASE HOLD.**

## User-visible value
The public PR Proof Chain page now presents a Haunting Evidence Trial. It composes (1) user-selected browser-only Kiro session test/edit chronology, (2) opt-in live GitHub PR HEAD and observed Actions workflow runs, and (3) a deliberately unclosed, labeled session-to-commit evidence gap. It presents an actionable next step and exports a sanitized JSON hearing. One click lets judges see synthetic pre-edit PASS become stale after an edit, then a later genuine synthetic retest become self-recorded CURRENT, without ever claiming that the PR HEAD was tested. The synthetic scenes are **explicitly marked** and do not count as Kiro development provenance.

## Source / worktree
- Base: `8f16ea5` (M9A.1 + M9B synthetic preflight).
- Current experimental branch: `feat/m10-evidence-trial` in `qa/private/specter-m10-evidence-trial`.
- M10 developed with **ChatGPT/WAG**, not Kiro. Kiro V3 monthly quota is exhausted and real Kiro hook remains absent.
- Original M8.8 PR #7, `main`, stable production, M8.8 Preview, private YouTube video and Devpost submission were **not modified**.

## Implementation
- `web/evidence-trial.mjs`: pure, bounded session reducer reusing existing `parseKiroSession` + `auditLocalSession`, plus source-limited `combineTrial`. No network or persistence.
- `web/trial-ui.mjs`: opt-in file input, status grid and redacted report; only safe metadata from `pr-proof.js` is passed by custom DOM event. The file is cleared after inspection.
- `web/pr-proof.html`, `web/pr-proof.css`: three exhibits and visually distinctive broken-chain status, responsive and keyboard-operable. M10 does not replace M8.8 pages.
- `src/http-server.mjs`: two new static allowlisted ESM modules. `package.json` syntax checks both. Existing Vercel output directory continues to be `web`.
- `test/evidence-trial.test.mjs`, `test/evidence-trial-page.test.mjs`: correctness, provenance, privacy and route/CSP tests.

## Verified evidence
- Full Node suite on final M10 implementation: **456/456 PASS**, zero fail/skipped. New core and page tests: **25/25 PASS**. Tested application source commit: `d1dd7ebc52f5d43a0f51a8075cb390e96e0242c7`.
- M10 `npm run check` and `git diff --check`: PASS.
- **Chrome real PR #7** at localhost M10; desktop 1280 and mobile390: **PASS**, 2 public GitHub GETs per valid explicit user inspection, zero GETs for forged host or synthetic clicks. Three provider-reported successful runs at HEAD `bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d`. Stale and retest local synthetic both result in `NOT LINKED` and `RELEASE EVIDENCE INCOMPLETE`. No unexpected browser console/runtime errors or horizontal overflow. Keyboard skip and post-fetch focus passed.
- Actual WAG browser selected a 787-byte explicitly synthetic JSONL fixture from ignored `qa/private`. After clicking Analyze, the UI labeled it `USER SELECTED · BROWSER ONLY`, reported `STALE RECEIPT` and cleared the file selection. The fixture and browser-script files are gitignored; **no genuine private user log was uploaded**.
- Static WAG accessibility heuristic on the experimental HTML: score 100/100, 0 reported heuristic violations. Not a WCAG or real screen-reader signoff.

## M10.1 — async file-read invalidation regression (red/green verified)

A real Chrome test reproduced a UI race on the original M10 commit: start an asynchronous `File.text()` read, press **Clear session** before the read finishes, then resolve the previous read. The cleared local exhibit incorrectly revived as `STALE RECEIPT` (expected `NOT INSPECTED`). This is a state/privacy control defect; no external upload was observed. The test is retained as a gitignored, reproducible local Chrome CDP harness: `qa/private/m10-race-qa.mjs`.

Fix: increment `sessionEpoch` on file selection, reading, clearing and switching to synthetic examples; ignore late completions whose captured epoch is no longer current. A superseded read cannot override the selected hearing, even when it resolves after Clear or after choosing another example. The file input is re-enabled when invalidated. `test/evidence-trial-page.test.mjs` includes a permanent regression contract for the invalidation code.

**Post-fix evidence:** local Chrome real PR #7 + adversarial deferred `File.text()` with Clear and synthetic switch: **PASS on 1280px desktop and mobile 390px**, 2 deliberate GitHub public GETs per device, no additional requests on local-file interactions and no browser console/runtime errors. `npm test`: **457/457 PASS** (zero fail/skipped); `npm run check` PASS; `git diff --check` PASS. QA harness self-starts and stops its local server and exits code 0.

Independent-review caveat: Codex broad integrated review timed out; a separate read-only Claude CLI review failed with `OAuth session expired and could not be refreshed`. **No independent full signoff** was obtained; do not call the release security-approved.

## Remaining gates
1. Full suite and local Chrome acceptance: PASS as documented. Keep independent integrated review and actual hosted Preview/CSP acceptance separate; neither can be inferred from local tests.
2. Independent audit of integrated PR and actual Vercel deployed CSP/header behavior, before any exact-SHA Preview release.
3. Deploy only a separate opt-in Preview after technical signoff and owner permission; do not merge PR #7 without release gates.
4. Await Kiro credits and implement/test M9B Hook with genuine Kiro CLI V3 authorship. Present a real test → source save → warning → retest sequence.
5. Review the full judge video, then create a new M10/Kiro demo video only after live workflow acceptance. YouTube currently holds a **Private** 116.6s M8.8 video; Devpost remains without a final public video link and has an older stable website URL.
6. Use Devpost owner attestations and obtain final submitted timestamp before competition deadline.

## Trust boundaries
- A CURRENT local result is self-recorded and editable.
- A matching provider workflow reports GitHub's metadata, not semantic correctness or completeness of required checks.
- `NO_INDEPENDENT_SESSION_TO_PR_COMMIT_BINDING` is immutable in this release.
- `releaseApproved:false` is immutable for all cases.
- Synthetic evidence is never genuine Kiro provenance.
- Local QA is not a full system assurance, independent audit or release authorization.

**Release decision: HOLD.**
