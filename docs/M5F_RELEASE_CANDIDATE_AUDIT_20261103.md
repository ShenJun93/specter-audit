# Specter Audit — M5F Release Candidate Security Review

Date: 2026-11-03 (Asia/Ho_Chi_Minh)
Branch: `feat/kiro-provider-evidence`
Base HEAD: `f0c0a9115185f00fdcb416f67c96a61dc9ef770b`
Disposition: **LOCAL RELEASE CANDIDATE / REMOTE RELEASE NOT APPROVED**.

## Scope and provenance

M5F was implemented by ChatGPT/WAG, then independently examined using narrow
read-only Kiro CLI review sessions. The sessions did **not** author code.
The initial broad Kiro review in M5E timed out and was not counted as completed.
The narrower completed reviews read these sets:

- `web/app.js`, `web/ci-evidence.json`, `scripts/capture-public-ci.mjs`
  (Kiro found two warnings and one info; M5E remediated them).
- `src/http-server.mjs`, `src/public-ci.mjs`,
  `hosted/api-common.mjs`, `api/evaluate.js`
  (no demonstrated HIGH blocker; one medium residual trade-off).
- `src/claim-evaluator.mjs`, `hosted/snapshot.mjs`,
  `api/inspection.js`, `api/status.js`
  (no demonstrated vulnerability in scope; API helper was not read in this
  specific session, but was examined in the preceding independent session).

This is **targeted static code review**, not a penetration test, security
certification or claim that every source line was independently examined.
Earlier read-only Git subprocess and integration audits remain in
`docs/GIT_SUBPROCESS_SECURITY_20261103.md` and project test files.

## Additional M5F trust-boundary remediation

- `web/app.js`: GitHub source URL must match displayed run ID exactly.
  A provider result now fails closed before display when exact release SHA,
  workflow, run identity, runNumber/runAttempt, completed status, conclusion,
  timestamp or source URL is inconsistent.
- In hosted mode `UNKNOWN` is not accepted as a *recorded success/failure*
  artifact. A recorded CI run must have source evidence and the run's
  `updatedAt` must not exceed `capturedAt`.
- Malicious/corrupt static CI JSON can no longer display a green CI result
  with only its source link hidden: the panel instead reports provider
  unavailable and leaves facts and links hidden.
- `scripts/capture-public-ci.mjs`: reject attempts to create a recorded CI
  snapshot whose `updatedAt` is later than `capturedAt`; test added.
- Never allow a GitHub CI result to independently elevate
  `SUPPORTED/PARTIAL/UNVERIFIED` claim verdicts.

## Accepted residual trade-offs

- Local and hosted `validateOrigin`/`requestOkay` allow native HTTP
  clients that omit both `Origin` and `Sec-Fetch-Site`. This is intentional
  for CLI clients, not authentication. Cross-origin browsers cannot add the
  non-simple consent header or JSON request without a CORS preflight, which
  has no permissive CORS response. Host is pinned on the loopback server.
- Hosted CI is a **static dated initial-release record**, not CI evidence for
  the current uncommitted M5F code and not the live status at viewing time.
  It is deliberately separated from the synthetic judge repository and
  the local read-only inspector.
- The local opt-in endpoint queries a fixed unauthenticated GitHub workflow.
  It can still be rate-limited by GitHub and return `UNKNOWN`.
- GitHub provider-reported status is not signed or independent attestation.
- Full independent threat modeling and public production browser acceptance
  remain gate items; no product claims production security certification.

## Verification evidence on MAIN-PC

- `npm run check`: **PASS**.
- `npm test`: **143 PASS, 0 FAIL** after M5F code and snapshot timestamp
  validation tests.
- `git diff --check`: **PASS** on tracked files; untracked files are not
  included in that check.
- `qa/private/specter-m5e-hosted-browser-20261103/acceptance.mjs`:
  Chrome desktop and mobile 390px PASS. The corrupted-record test changes
  GitHub run URL to a different run ID; the UI displays **no CI facts**,
  **no source link**, and reports provider unavailable.
- Hosted simulator network results: **zero external calls, zero live provider
  endpoint hits, zero console errors**, static JSON fetched on click only.
- `qa/private/specter-m5d-browser-20261103/acceptance.mjs`:
  Chrome local-mode desktop/mobile 390px PASS, injected deterministic
  provider mock, no console errors.
- Earlier real GitHub smoke query was scoped to initial commit
  `9896ccd9851d5559983f511187ac71ce85f0db10`,
  workflow ID `405703749`, run `41639525541`, not to M5F changes.

## Remaining release gates

1. Explicit owner decision to create a local reviewed Git commit.
2. Owner-authorized GitHub push/PR; inspect CI on the exact candidate SHA
   (the existing initial-release CI cannot prove changes on this branch).
3. Authorized Vercel deployment; confirm deployed SHA and HTTP behavior
   against the *public* URL with desktop/mobile browser acceptance.
4. Verify Kiro provenance, publish truthful judge demo video and complete
   Devpost submission. Avoid claiming ChatGPT/WAG-authored source was
   implemented using Kiro.
5. Keep prior user work intact; do not reset the dirty worktree.

No Git commit, push or production deployment was carried out in M5F.
