# Specter Audit — M5D Opt-in Public CI Panel

Date: 2026-11-03 (Asia/Ho_Chi_Minh)
Status: **LOCAL FEATURE BRANCH VERIFIED; NOT DEPLOYED**.\n\n**HISTORICAL RECORD — SUPERSEDED BY M5E.** The anonymous hosted POST API described below was removed before release. Hosted mode now serves a dated static CI record; local mode retains consent-gated lookup. See docs/M5E_RELEASE_GATE_20261103.md.

## Behavior

- Both local server and future hosted server expose `POST /api/provider-evidence` with same-origin and explicit consent-header checks. GET is rejected.
- The server—not the browser—selects fixed repository `ShenJun93/specter-audit`, workflow ID `405703749`, and initial public-release commit `9896ccd9851d5559983f511187ac71ce85f0db10`.
- The panel shows a **separate** provider-reported CI result for the **initial public release**. It does **not** describe the selected local Git worktree or hosted synthetic judge fixture.
- By default no GitHub query is made. Clicking "Query public GitHub CI" invokes a read-only, fixed-target provider lookup. Browser code uses `textContent`; the source link must match a strict `https://github.com/ShenJun93/specter-audit/actions/runs/{id}` pattern.
- This does not upgrade any `SUPPORTED/PARTIAL/UNVERIFIED` verdict. Status is not signed attestation or proof of correctness.
- No user-controlled owner/repo/SHA/workflow or API URL is accepted by the server.
- No credentials, source contents, or arbitrary commands are accessed.

## Implementation

- `src/github-actions-evidence.mjs`: bounded, fail-closed GitHub adapter.
- `src/public-ci.mjs`: exact, fixed public-release target.
- `src/http-server.mjs`: local consent-gated endpoint, no request body accepted.
- `api/provider-evidence.js`: hosted consent-gated endpoint.
- `web/index.html`, `web/app.js`, `web/styles.css`: opt-in panel, limited provenance text and safe GitHub source links.
- `test/public-ci-route.test.mjs`: deterministic local and hosted API trust-boundary tests.
- `test/github-actions-evidence.test.mjs`: 55 deterministic provider tests.

## Reproducible acceptance on MAIN-PC

- `npm run check`: PASS.
- `npm test`: **142 pass, 0 fail** in M5D acceptance run.
- `node --test test/public-ci-route.test.mjs`: **3 pass, 0 fail**.
- Chrome headless (fresh temporary browser profile, no desktop mouse/profile interference):
  - Desktop: panel click -> fixed provider success with verified source URL; no horizontal overflow
  - 390px mobile viewport: same result, document width exactly 390px
  - Two intentional mocked provider calls total (one per click), zero console/runtime errors
- Browser screenshots and JSON receipt stored under ignored `qa/private/specter-m5d-browser-20261103/`. Do not publish QA data.

## External smoke evidence

A separate read-only direct GitHub API call (without token) verified workflow ID 405703749, initial release SHA 9896ccd..., run 41639525541, run_number 1, run_attempt 1, completed/success. That does not attest to M5D code. The automated and browser tests use injected deterministic mocks, not a real CI invocation.

## Remaining gates

1. Independent review of network use, status semantics, and Vercel function deployment compatibility.
2. Rate-limit protection for a publicly reachable anonymous POST endpoint; current per-request bounded fetch is still susceptible to repeated requests from the public internet.
3. Update the fixed commit/workflow reference to match the actual deployed revision **after** GitHub CI passes, or explicitly retain the "initial release" label.
4. Authorized commit, push, CI inspection, production deploy and live browser acceptance. **None performed in M5D.**
5. Genuine Kiro participation/provenance review, final judge video, and verified Devpost submission.

## Provenance

The genuine Kiro CLI contributed to early M5A and some M5B adapter changes. M5C/M5D hardening, integration and browser QA were done using ChatGPT/WAG. Do not claim these milestones were entirely Kiro-authored.
