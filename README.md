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

The demo launcher writes a fresh, disposable Git repository into the OS temporary directory, with a baseline commit and tracked modification. It does not modify the Specter Audit repo or execute user-provided commands. Ctrl+C stops the server and cleans the fixture. The running app makes only loopback HTTP calls.

## Evidence boundaries

- SUPPORTED: path-level Git alignment for a change-only claim; NOT proof a bug is fixed.
- PARTIAL: real Git path alignment plus an unsupported test/build assertion.
- UNVERIFIED: no adequate change-path evidence or a standalone test-pass assertion.
- A user-entered receipt can be "metadata-consistent", but is never independently attested. Even a matching HEAD hash, exitCode=0, and timestamp do not prove a test ran.
- The inspector only sees worktree and index metadata; it does not analyze commit diffs, read source contents, run tests, connect to CI or accept arbitrary command execution.
- Git sometimes reports an untracked directory instead of individual files.

## Security and accessibility

Server binds 127.0.0.1 only; selected repository fixed at launch; origin and Host validation, CSP, bounded request bodies, statically allowlisted routes. Read-only Git commands run through execFile argument arrays, shell=false. Client renders paths with textContent and supports keyboard navigation and reduced motion.

## Development provenance

Milestone 1 was implemented in a genuine Kiro CLI session and independently checked at 34/34 Node tests. Milestones 2–3 were authored by ChatGPT-assisted remote editing and independently tested on MAIN-PC. Those changes must not be represented as produced by Kiro. Root .kiro specs and steering provide the basis for further genuine Kiro development.

## Hosted replay and local live inspection

The hosted Vercel app replays a frozen snapshot of a **real synthetic Git fixture**
captured using the local Git inspector. The public UI conspicuously labels this
mode **SYNTHETIC GIT SNAPSHOT**. All claim evaluations are computed at request
time by the same `evaluateClaim()` engine; the hosted API does not scan the
visitor's machine, arbitrary remote repos, or GitHub. See
`scripts/build-hosted-snapshot.mjs`, `hosted/snapshot.mjs`, `api/`, and
`vercel.json`.

To analyze your own Git repository, run the local app as described above.
The two modes are deliberately separated to avoid misleading evidence claims.

## Submission limitations

The full live Git inspector remains a local-only application. Public GitHub, license selection, initial project Git commit, publicly accessible working demo, and final YouTube judge video remain separate submission requirements. This project does not claim production readiness, human validation, independent test attestation or security certification.

More details: docs/JUDGE_QUICKSTART.md and docs/RECEIPT_PROVENANCE.md.
