# M10.4 — PR target selection provenance invalidation (2026-11-06)

**Status: LOCAL RED/GREEN ACCEPTANCE — RELEASE HOLD.** Base `0194bc3`, experimental branch `feat/m10-evidence-trial`. Source changed with ChatGPT/WAG; not Kiro-authored.

## Confirmed regression
- Real Chrome with publicly observed GitHub PR #7 and green provider workflow results.
- Change the URL input to a different canonical PR URL, without clicking Inspect yet.
- **Pre-fix actual:** the green PR #7 report remained visible and the separate Evidence Trial continued to show PR #7 as observed, although the selected target had changed. The browser assertion expected the old report to be hidden and Evidence Trial to show `NOT INSPECTED`; it failed.
- **Fix:** `invalidatePrObservation()` immediately clears `latest`, hides prior PR report, shows the no-evidence panel, clears the provenance badge and copy-status, and dispatches a null PR observation to Evidence Trial. It runs on user URL input changes and before any new explicit Inspect request. No private session is modified, no GitHub GET is initiated by typing, and the existing synchronous disabled-input guard still prevents overlapping user-initiated PR fetches.
- Real browser regression harness: gitignored `qa/private/m10-pr-selection-qa.mjs`, runs local app with ephemeral port and Chrome desktop/mobile. **Source fixtures and test use public PR #7 only**; no raw Kiro transcript.
- Independent integrated Codex run was attempted but timed out while discovering the outer repository/worktree and reported no findings. This is **not independent release signoff**.

## Release boundary
- Keep main, M8.8 Preview, Draft PR #7, production, private YouTube video, and Devpost unchanged.
- Require an independent review covering the exact candidate and hosted Preview CSP/network behavior before changing submission links or promoting production.
