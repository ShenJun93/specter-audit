# Specter Audit — M5E Public CI Release Gate

Date: 2026-11-03 (Asia/Ho_Chi_Minh)
Status: **LOCAL VERIFIED / NOT COMMITTED / NOT PUSHED / NOT DEPLOYED**.

## Decision: static CI record on hosted, live lookup only on localhost

The M5D anonymous `POST /api/provider-evidence` hosted function could issue an
outbound public GitHub API request on every visitor POST. GitHub's unauthenticated
REST API budget is 60 requests/hour per source IP (official documentation).
Vercel Functions may scale across instances, so in-process caching alone would
not guarantee a global request limit. Introducing Redis/KV merely to serve one
judge-facing CI record would add avoidable cost, lock-in and operational risk.

M5E therefore **removed the untracked hosted CI function before release**.
The hosted browser now reads `web/ci-evidence.json` when the user clicks the
button. This is a statically served, dated capture with an original GitHub run
link. It requires **zero Vercel Function invocations and zero outbound GitHub
requests per CI panel view**. It is not live, and the UI explicitly says so.

The local loopback server retains a separate, consent-gated fixed-target,
read-only provider endpoint for the initial public release. Its outbound
network path stays disabled until a user manually clicks the panel.

## Fixed provenance and capture

- Public repo: https://github.com/ShenJun93/specter-audit
- Fixed release commit: `9896ccd9851d5559983f511187ac71ce85f0db10`.
- Fixed workflow ID: `405703749`, Specter Evidence Checks.
- Captured at: `2026-11-03T15:56:07.174Z`.
- Provider run: `41639525541`, run_number 1, run_attempt 1, completed/success.
- Source link: https://github.com/ShenJun93/specter-audit/actions/runs/41639525541
- Capture command: `npm run capture:ci`. This invokes
  `node scripts/capture-public-ci.mjs --capture`, validates the exact
  SHA/workflow/run identity and run URL and atomically replaces static JSON
  only when provider evidence is complete and non-UNKNOWN.
- A published static snapshot is a **record of provider-reported status at
  capture time**, NOT cryptographic attestation, current live status, test-log
  proof, proof of correctness or CI on the pending local M5 changes.
- No browser-request-selected owner, workflow, SHA, URL or credentials.
- This does not change `SUPPORTED/PARTIAL/UNVERIFIED` evaluator semantics.

## Security review — verified local assertions

- Git metadata inspector remains offline by default, read-only, loopback-only.
- Public Vercel API has no provider-evidence function. Hosting serves static
  `ci-evidence.json` without a remote provider dependency.
- Client only loads the static CI file after click in hosted mode; local mode
  sends the fixed-consent POST to loopback and receives a server-owned result.
- Client checks fixed release identity and validates the GitHub source URL
  (host, owner/repo, numeric run ID), then uses `textContent` for all data.
- Adapter bounds network time including stalled body, refuses redirects and
  oversized responses, requires exact workflow/SHA, compares run_number then
  run_attempt, and fails closed on incomplete pagination.
- Recorded manifest forbids an UNKNOWN result and records
  independentlyAttested/cryptographicAttestation/correctness as false.
- No new runtime packages, external datastore, queue, token or WAF policy
  required for the hosted CI feature.

## Local evidence

- `npm run check`: PASS (2026-11-03).
- `npm test`: **143 pass, 0 fail** (2026-11-03).
- `git diff --check`: PASS on tracked files; untracked files are NOT covered.
- `node --test test/public-ci-route.test.mjs`: 4 pass (static manifest,
  no hosted provider route, capture validation, local consent boundary).
- Prior 55 adapter regression cases remain in the full test suite.
- Headless Chrome **hosted-mode simulator** on desktop and 390px mobile: PASS,
  no horizontal overflow, zero JS/console errors, exactly two local static
  JSON fetches after two clicks, zero external network requests and zero
  hosted dynamic provider API calls.
- Headless Chrome prior local-mode browser acceptance: PASS; source links
  validated; CI provider result was injected for deterministic testing.
- QA screenshots / receipt in ignored
  `qa/private/specter-m5e-hosted-browser-20261103/`.
- Live public GitHub adapter smoke read with no token: completed/success for
  initial release SHA, workflow 405703749, run 41639525541.
- Tests and browser simulation use local fixtures/mocks; these do NOT verify
  the new uncommitted code in GitHub CI or production.

## Release gates (remaining)

1. Independent adversarial code review (including UI provenance text and
   browser behavior) and any remediation, with evidence.
2. Human-authorized local commit of the exact reviewed worktree, then
   authorized GitHub push / PR and verification of GitHub Actions **on that
   specific new commit**.
3. Authorized deployment and public hosted acceptance on its deployed SHA,
   including all static assets and no unexpected GitHub network requests.
4. Verify the static provider record still labels the **initial release**;
   never describe it as CI for the new deployment commit. Refresh explicitly
   if the selected target is intentionally changed and verified.
5. Confirm genuine Kiro implementation/review provenance for submission,
   create truthful public demo video under 3 minutes and verify Devpost final
   submission. Deadline in repository records: 2026-12-04 22:00 UTC.

## Authorship

M1 and early M5A/M5B have actual Kiro CLI involvement. M2–M4 and later
M5B/M5C/M5D/M5E work were performed through ChatGPT/WAG. This document
makes no broader Kiro-authorship claim.
## Focused independent Kiro CLI review — 2026-11-03

- A genuine **read-only** Kiro CLI session examined exactly three files:
  `web/app.js`, `web/ci-evidence.json` and
  `scripts/capture-public-ci.mjs`. The broad initial Kiro review timed out;
  it is not counted as a completed independent full security audit.
- Narrow review returned **no blocker in those three files**, two WARNINGS
  and one INFO finding. Scope explicitly excluded server, HTML and evaluator.
- Warning 1: sticky topbar `providerQueried` could confuse CI activity and
  Git inspection mode. Resolved: topbar now labels only the current Git
  inspection mode; provider state is expressed separately inside the panel.
- Warning 2: browser URL host/path validation did not check that the GitHub
  source link's run ID equals the displayed run ID. Resolved in
  `safePublicRunUrl(input, runId)`: exact run ID matching is mandatory.
- Info finding: capture accepted `providerStatus`, `conclusion` and
  `updatedAt` without final consistency checks. Resolved: a captured run
  must have completed status, valid updated timestamp and conclusion agreeing
  with the reported verdict; tests reject contradictory records.
- Chrome hosted-mode tampering acceptance now tests a source URL with the
  wrong run ID: source link remains hidden. Static requests: 3; GitHub
  outbound requests: 0; console errors: 0.
- The targeted review and remediation add **evidence**, not a claim of a
  completed project-wide penetration test or secure production release.
