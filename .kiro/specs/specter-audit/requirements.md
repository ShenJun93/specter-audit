# Specter Audit — Kiroween 2026 new project

## User story

As a solo builder coordinating AI coding agents, I want a local evidence-driven verifier that checks each "done" claim against actual repository modifications and test artifacts, so I can identify unsupported completion assertions before shipping. A haunting visual theme makes the verification state instantly understandable, rather than replacing function.

## Competition grounding

- Kiroween 2026 new projects only, starting 2026-10-30. This project starts 2026-10-31.
- Category: Costume Contest (polished spooky UI **with functional engineering**).
- GitHub public repository, root `/.kiro` including specs/steering, build/run instructions, public demo, and a public video <=3 minutes are needed for eventual submission.
- Deadline: Dec 4, 2026 22:00 UTC.
- No preexisting project code used. This workspace is independent from Fair Trial, Zetaris and the No Dumb Tax repo.

## MVP user-visible behavior

1. Local Node.js 24 CLI starts a loopback-only server for an explicitly selected local Git repository; never silently walks other folders.
2. User enters a narrow claim (e.g. "fixed auth regression"), plus a command that actually ran in that repo and optionally a test output artifact.
3. The verifier reads **Git status/diff and commit context** read-only (use spawn argument arrays, no shell interpolation) to compare claim/changed files and recorded run receipt.
4. It labels observations `SUPPORTED`, `PARTIAL`, `UNVERIFIED` without saying tests passed merely because a log exists. No hidden Git add/reset/checkout/commit/push. No automatic test execution or destructive mutations.
5. UI uses spooky purple/teal visual storytelling: a "Haunted Worktree" timeline, spectral evidence ledger, a confidence indicator explaining uncertainty. Accessible keyboard and reduced-motion fallback. Red/green not sole signal.
6. Demo works with a local fixture git repo created for acceptance tests and 3 sample claims — no credentials or network API necessary.

## Non-goals

- Do not use GitHub APIs, network lookups, shell execution from user input, payment APIs or external AI. No claims of measuring semantic correctness of arbitrary code.
- No collecting secrets, no reading `.env` content, no uploading source files.
- No claims of production readiness until unit and browser tests actually pass.

## Verification goals

- Tests for dirty/clean tree, renamed files, missing receipts, paths with spaces, empty repo, dangerous commands rejected.
- Recorded Kiro CLI sessions and `.kiro` spec updates provide actual usage evidence, no fabricated Kiro activity.
- Reviewer can run `npm test` and `npm start` locally in a fresh checkout without additional credentials.
