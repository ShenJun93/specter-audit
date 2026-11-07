# M16 — Judge self-verification acceptance (2026-11-07)

**Decision: LOCAL TECHNICAL PASS / REMOTE PREVIEW & CONTEST RELEASE HOLD.**

## Source and authorship

- Candidate branch: `feat/m16-judge-selfverify`, derived from exact M15 `70eec77327fee7e86e6b52b57e9ab539c372bd94`.
- Isolated worktree: `qa/private/specter-m16-judge-selfverify-20261107`.
- Implemented and verified via **ChatGPT/WAG**, not Kiro CLI. No new Kiro V3 hook or genuine Kiro-native runtime execution has been claimed.
- No existing PR, deployed production/Preview, YouTube, Devpost or GitHub branch mutated by local acceptance.

## Judge problem addressed

M15 successfully produced a cryptographically verifiable GitHub Artifact Attestation for a test receipt, but the M10–M15 Proof Chain page exposed only provider-reported workflow metadata. A judge could not find the *separate attested example* without reading repository release notes. M16 adds a discoverable **historical signed CI reference** to the Proof Chain.

- Visible jump link from the top hero to `#ci-reference`.
- Original GitHub Actions run: `https://github.com/ShenJun93/specter-audit/actions/runs/42323178158`.
- Fixed source SHA: `70eec77327fee7e86e6b52b57e9ab539c372bd94`.
- Original run: 512/512 PASS; both `node-verification` and `attest-ci-receipt` jobs PASS.
- Actual downloaded artifact: `receipt.json` SHA-256 attested by GitHub and `test.tap` digest matched receipt, confirmed on 2026-11-07.
- `gh attestation verify` was successful with `--signer-workflow`, `--source-digest`, and `--source-ref` constraints. Deliberately incorrect SHA returned exit 1, an expected negative control.
- CLI instructions are in an accessible collapsible `details`; a copy button uses Clipboard API strictly after user interaction. No automated remote lookup or new network/cookie/storage permissions.
- The status is **static historical evidence**, not a live revalidation of any user-selected PR, an independent Kiro session-to-commit link, or release approval. The page says this explicitly.
- Corrected pre-JavaScript placeholder from misleading `Three independent checks` to `Three separate reviews; independent attestation absent`.

## Exact touched scope

- `web/pr-proof.html`: bounded historical-reference exhibit with immutable run/SHA, limitations, progressive disclosure and explicit self-verification commands.
- `web/pr-proof.css`: mobile-responsive cards and *internal* horizontal scroll for long CLI commands.
- `web/ci-reference.js`: click-only clipboard copy and accessible status; zero network, storage, DOM HTML insertion.
- `src/http-server.mjs`: add only one fixed static script route (no new API or origin exception).
- `package.json`: syntax check for new browser module.
- `test/m16-judge-selfverify.test.mjs`: 8 static/functional regressions, from **8 RED** before implementation to **8 GREEN**.
- `qa/private/m16_viewport_probe.py`: local-only, Git-ignored Playwright QA harness (not distributed).

## Local test evidence

- Full Node suite: **520/520 PASS**, 0 failures, 0 skipped, 0 cancelled; `npm run check` and `git diff --check` PASS.
- Chrome headless/Playwright browser test against loopback UI at widths **320, 375, 390, 768, 1024, 1440**:
  - Page and body scroll width equal viewport width; no page-level horizontal overflow even with long CLI section expanded.
  - Hero jump navigates to signed reference.
  - Native `details` opens by keyboard **Enter**.
  - Copy action succeeds; clipboard contains exact SHA, signer workflow and source ref at all six viewports.
  - **0 JavaScript exceptions** and **0 automatic GitHub API requests** in all six tested runs.
  - The command block scrolls internally (for example, 320 px viewport: 258 px client width, 1752 px content width).
  - Local QA screenshots at 320 px and 1440 px are saved under ignored `qa/private/` only.
- Static HTML accessibility heuristic: **100/100, zero detected violations**. This is **not WCAG certification**, not a contrast study or full screen-reader test.
- Separate integrated Chrome run: explicitly synthetic source-edit → retest, followed by opt-in public GitHub PR #7 inspection. Observed `RUNS OBSERVED, NOT CERTIFIED`, `OPEN · DRAFT`, 2 user-triggered `api.github.com` requests, `UNBOUND` session-to-commit link, **unchanged** fixed M15 signed-CI reference SHA, and 0 JavaScript exceptions.
- The source of truth for attestation remains GitHub, never these browser test claims.

## Limits and next gates

1. **Remote M16 CI and immutable SHA Preview:** NOT YET RUN. New local M16 worktree must be owner-pushed; CI and the actual Preview must be rechecked at that exact SHA.
2. **Human end-to-end video audio/visual review:** NOT PERFORMED for M16.
3. **Independent accessibility, security and adversarial browser audit:** Not certified by local Playwright + static heuristic.
4. **Kiro-native M9B hook:** REMAINS QUOTA BLOCKED/PENDING ISSUED CREDITS. M16 is not a substitute.
5. **Release/contest submission:** HOLD until an integrated, owner-approved candidate and exact verified judge resources.

**Conclusion:** M16 is a bounded judge-experience improvement with clear provenance boundaries; no false evidence bridge or synthetic Kiro success is introduced.
