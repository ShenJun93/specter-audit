# Specter Audit

The agent said "done." What does Git say?

Specter Audit is a local-first, read-only Git metadata inspector and claim-to-evidence evaluator for AI coding agents. It compares a natural-language completion claim with actual changed paths and optional user-provided receipt metadata. A supported finding describes alignment, NEVER semantic correctness.

Kiroween 2026 / proposed category: Costume Contest.

## Quick start

Requires Node.js 24+ and Git. Zero runtime dependencies, no install needed.

- Run the synthetic judge demo: npm run demo
- Open the printed loopback URL, e.g. http://127.0.0.1:PORT.
- Click the three sample claims to exercise UNVERIFIED / PARTIAL / SUPPORTED against a real, freshly created Git fixture.
- Run tests: npm test
- Check JS syntax: npm run check
- Inspect your own repository: node src/http-server.mjs --repo="ABSOLUTE_GIT_REPO_PATH"

The demo launcher writes a fresh, disposable Git repository into the OS temporary directory, with a baseline commit and tracked modification. It does not modify the Specter Audit repo or execute user-provided commands. Ctrl+C stops the server and cleans the fixture. The app contacts only localhost by default. In local mode, a separate button can trigger one fixed-target, read-only GitHub Actions query. Hosted mode instead serves a recorded CI JSON file; no visitor action invokes GitHub.

## Evidence boundaries

- SUPPORTED: path-level Git alignment for a change-only claim; NOT proof a bug is fixed.
- PARTIAL: real Git path alignment plus an unsupported test/build assertion.
- UNVERIFIED: no adequate change-path evidence or a standalone test-pass assertion.
- A user-entered receipt can be "metadata-consistent", but is never independently attested. Even a matching HEAD hash, exitCode=0, and timestamp do not prove a test ran.
- The Git inspector only sees worktree and index metadata; it does not analyze commit diffs, read source contents, run tests or accept arbitrary command execution. A separate opt-in provider reader reports CI metadata for the fixed initial public release; this never changes the claim verdict.
- Git sometimes reports an untracked directory instead of individual files.

## Security and accessibility

Server binds 127.0.0.1 only; selected repository fixed at launch; origin and Host validation, CSP, bounded request bodies, statically allowlisted routes. Read-only Git commands run through execFile argument arrays, shell=false. Client renders paths with textContent and supports keyboard navigation and reduced motion.

## Development provenance

Milestone 1 was implemented in a genuine Kiro CLI session. Milestones 2–4 were developed using ChatGPT-assisted tools. Kiro CLI contributed to the optional M5A/M5B adapter, while later hardening, integration, and regression fixes used ChatGPT/WAG. The code and Git evidence distinguish this provenance; no blanket Kiro-authorship claim is made.

## Hosted replay and local live inspection

**Public judge demo:** https://specter-audit.vercel.app/

**Public source:** https://github.com/ShenJun93/specter-audit


The hosted Vercel app replays a frozen snapshot of a **real synthetic Git fixture**
captured using the local Git inspector. The public UI conspicuously labels this
mode **SYNTHETIC GIT SNAPSHOT**. All claim evaluations are computed at request
time by the same `evaluateClaim()` engine; the hosted API does not scan the
visitor's machine or arbitrary remote repositories. The new opt-in public CI feature on the **unreleased local feature branch** displays a timestamped JSON snapshot of the initial public release on hosted Vercel, and only queries GitHub live in local mode on explicit request. The recorded CI result is not about the synthetic fixture and does not change the evaluator or inspect visitor source files. See
`scripts/build-hosted-snapshot.mjs`, `hosted/snapshot.mjs`, `api/`, and
`vercel.json`.

To analyze your own Git repository, run the local app as described above.
The two modes are deliberately separated to avoid misleading evidence claims.

## Submission limitations

The full live Git inspector remains a local-only application. The public GitHub repository, MIT license and hosted synthetic replay exist, but M5C/M5D/M5E improvements are not yet committed or deployed. Genuine Kiro usage documentation, final public YouTube judge video and verified Devpost submission remain pending. This project does not claim production readiness, human validation, independent test attestation or security certification.

To refresh the hosted CI record, an operator must explicitly run `npm run capture:ci`, which queries only the hardcoded public workflow and updates `web/ci-evidence.json`. The hosted site reads that file on click; it never makes a GitHub API request per visitor. The capture is a dated provider report, not independent attestation.

More details: docs/JUDGE_QUICKSTART.md, docs/M5E_RELEASE_GATE_20261103.md and docs/RECEIPT_PROVENANCE.md.

M5F release candidate security review: `docs/M5F_RELEASE_CANDIDATE_AUDIT_20261103.md`. Changes remain local and uncommitted; CI on the candidate SHA and live production acceptance are not yet complete.
