# Specter Audit — Implementation milestones

Status is based on observable files, actual tests and browser QA. The
repository now has committed public release history; local M5 work remains
uncommitted. git diff --check does not cover untracked files.

## Milestone 1 — Git inspector and evaluator: VERIFIED

Implemented in an actual Kiro CLI session, November 3 2026:
- Node 24 ESM, zero runtime dependencies, typed result objects.
- Read-only Git metadata with argv arrays, timeouts, bounded output.
- SUPPORTED/PARTIAL/UNVERIFIED with alignment—not-correctness semantics.
- Kiro steering and spec files, disposable Git fixture tests.

Subsequently hardened: Git optional locks disabled, fail-closed on incomplete
status/diff commands, and receipt provenance cannot claim test execution.

## Milestone 2 — Local server and Haunted Worktree UI: VERIFIED

Implemented via ChatGPT-assisted remote editing (not Kiro-authored):
- Loopback-only Node HTTP server, fixed repo root on launch and safe static routes.
- Responsive Haunted Worktree dashboard, semantic verdict labels, reduced motion.
- Host/Origin checks, CSP, request bounds, source-file non-disclosure.
- Browser and API integration tests.

## Milestone 3 — Provenance honesty and Evidence Theater: VERIFIED

Implemented via ChatGPT-assisted remote editing (not Kiro-authored):
- User-supplied run receipt is metadata-consistent, NEVER independently attested.
- Standalone test-pass claim always UNVERIFIED.
- Mixed change+test claim max PARTIAL without independent test execution.
- Disposable judge fixture with real initial commit and actual changed tracked file.
- Three scenario buttons evaluate through live HTTP and Git metadata, not hardcoded.
- npm run demo / npm run check, README and judge quickstart, no external dependencies.
- Final regression: `npm run check` PASS, `npm test` 70/70 PASS, 0 fail
  (includes favicon and provenance regression), exit code 0 on MAIN-PC.
- Git inspector additionally disables optional Git locks and fails closed on
  incomplete HEAD/status/diff results. No claimed semantic code verification.
- Headless Chrome browser acceptance PASS: three verdicts, 390px mobile without
  horizontal overflow, zero JavaScript errors and zero console errors.
- `.gitignore` excludes private QA logs/screenshots and local Kiro auto-approve
  launcher, while keeping root `.kiro` available for public submission.
- `git diff --check` exit 0 is NOT a meaningful whitespace check yet because
  there are no tracked files or commits in this worktree.

## Milestone 4 — Public source + hosted synthetic replay: VERIFIED

- Public GitHub repo: https://github.com/ShenJun93/specter-audit
  (main, MIT LICENSE, .kiro at root; initial commit 9896ccd).
- Production hosted demo: https://specter-audit.vercel.app/
  (synthetic Git snapshot, not a live visitor filesystem scan).
- Vercel deploy from Git SHA 9896ccd, deployment dpl_H1oRAr2YFcjKSjDbacw19NzPpyw4 READY,
  publicly accessible, no Vercel Authentication.
- Live production GET /, /api/inspection, /api/status all HTTP 200.
- Production POST /api/evaluate: UNVERIFIED / PARTIAL / SUPPORTED all tested; foreign Origin -> 403.
- Public-site Chrome desktop and 390px mobile browser acceptance PASS,
  0 JavaScript and console errors. Private QA receipts excluded from Git.
- Local regression + hosted API tests: 82/82 PASS, syntax PASS.
- GitHub Actions CI run 41639525541 for initial commit: completed/success.
- Deployment and source publish used ChatGPT-assisted tooling, NOT additional Kiro-authored work.

## Milestone 5 — Provider evidence and competition readiness: LOCAL VERIFIED / RELEASE PENDING

- M5A: optional read-only GitHub Actions adapter started through genuine Kiro CLI;
  Kiro-authored work must be distinguished from later ChatGPT/WAG remediation.
- M5B/M5C: trust hardening for exact workflow+SHA, run_number/run_attempt,
  pagination fail-closed, bounded response body and explicit no-attestation semantics.
- M5D: fixed initial public release CI panel and consent-gated endpoints for local
  and hosted modes; does not alter SUPPORTED/PARTIAL/UNVERIFIED claim evaluator.
- Local acceptance 2026-11-03: npm run check PASS, npm test **142/142** PASS;
  headless Chrome desktop and 390px mobile click-path QA PASS, no console
  errors, no horizontal page overflow. CI adapter also passed a separate
  read-only live GitHub API smoke query against the initial published commit.
- M5C/M5D is UNCOMMITTED, UNPUSHED, NOT DEPLOYED. GitHub Actions did NOT run
  against these local changes. See docs/M5C_PROVIDER_TRUST_AUDIT_20261103.md
  and docs/M5D_OPTIN_PUBLIC_CI_PANEL_20261103.md for exact limits.
- Remaining: independent security/UX review, rate-limit abuse mitigation,
  authorized commit/push/release gates, more genuine Kiro usage evidence,
  public <3-minute YouTube judge video and verified Devpost submission.
- Competition deadline in project records: 2026-12-04 22:00 UTC.
## Milestone 5E — Static hosted CI record: LOCAL VERIFIED / RELEASE PENDING

- Removed the anonymous Vercel provider API function before production release.
- Hosted CI panel reads the dated static web/ci-evidence.json record on click;
  no visitor triggers an outbound GitHub API request or provider function.
- Local loopback retains explicit-consent fixed-target GitHub live lookup.
- scripts/capture-public-ci.mjs requires --capture and refuses incomplete or
  mismatched SHA/workflow/run metadata before atomically refreshing the record.
- Recorded 2026-11-03T15:56:07.174Z; original GitHub run 41639525541.
- 143/143 Node tests PASS; npm run check PASS; tracked git diff --check PASS.
- Hosted simulator Chrome desktop and mobile 390px PASS, zero external requests,
  zero provider-route hits, zero JS/console errors, no horizontal overflow.
- No commit, push or production deployment; independent review and real CI on
  the eventual new commit remain required gates.
- See docs/M5E_RELEASE_GATE_20261103.md.
## Milestone 5F — Candidate security review: LOCAL VERIFIED / RELEASE PENDING

- Tightened browser CI provenance: reported success/failure is rejected if the
  source URL, SHA, workflow ID, run identity, attempt, conclusion or timestamps
  disagree; no green UI verdict may survive missing provenance.
- Recorded-snapshot capture refuses updatedAt later than capturedAt.
- Kiro CLI completed two additional scoped read-only security reviews of the
  server/hosted boundary and evaluator/synthetic read endpoints; no demonstrated
  HIGH finding in reviewed scopes. The absent Origin header for native clients
  remains an accepted, documented tradeoff; it is not authentication.
- 143/143 Node tests PASS; Chrome local/hosted desktop and 390px mobile PASS,
  including a tampered GitHub run URL that hides the whole CI result.
- M5F is not committed, pushed or deployed. The initial release's green CI is
  not evidence about the candidate commit. See
  docs/M5F_RELEASE_CANDIDATE_AUDIT_20261103.md.