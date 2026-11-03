# M5K — Verified production release (2026-11-04)

## Release identification

- GitHub repo: https://github.com/ShenJun93/specter-audit
- Merged PR: https://github.com/ShenJun93/specter-audit/pull/1
- Reviewed candidate: `99e210da586c2129de9e306c0aae0bb379bd3e53`
- Main merge commit: `374af1417b714619d9edc1af790f7e7db15a71ca`
- Exact merge GitHub Actions run: https://github.com/ShenJun93/specter-audit/actions/runs/41736082288 (workflow `405703749`, run #6, attempt #1, `completed/success`).
- Production: https://specter-audit.vercel.app
- Project: `specter-audit`; Vercel deployment `dpl_3kHKSCufgrbgDTECc57mhitCstU1`
- Previous production: `dpl_CYttPWrbnfn5wQ3SvTgF9PpT7nrS` (rollback reference only).

## What actually shipped

- The production build was prepared from a temporary **clean detached Git worktree pinned to the merge commit** and uploaded with Vercel CLI `--prod --skip-domain`.
- The staging deployment was verified before promotion. Vercel alias `specter-audit.vercel.app` was then independently confirmed to target the new deployment.
- The Vercel deployment's Git metadata was empty because of the CLI upload. Therefore the source SHA is grounded in the pinned detached worktree plus asset equivalence, **not** in Vercel Git metadata.
- Public post-deploy HTTP gate: **11/11 PASS**, including rejected wrong-origin POST and malformed/oversized JSON.
- Six static/API responses matched staging **byte-for-byte by SHA-256**.
- Chrome headless on public production: **desktop + 390px mobile PASS**. The three verdict cases and static CI link were exercised; zero observed browser console errors, zero browser calls to GitHub or a dynamic provider API.
- Vercel runtime error/fatal log query for a 10-minute window returned no matching logs. This is **not** a long-term error-free assertion.
- Full private acceptance receipt is kept under ignored `qa/private/specter-m5k-production-20261104/release-receipt.json`, outside the public source package.

## Evidence limits and post-release correction

The production UI originally displayed a fixed **initial-release CI snapshot** pinned to `9896ccd...`. This was truthfully labeled, but it was **not CI for the newly deployed merge commit**.

M5L adds a recorded CI snapshot for the actual deployed merge commit `374af14...`, with original run `41736082288` and an explicit capture timestamp. This **new snapshot and revised wording are not on production until the M5L change is reviewed, merged and deployed**. It does not alter the synthetic evaluator or enable outbound GitHub calls for public visitors.

`SUPPORTED` always means path alignment only. GitHub Actions status is provider-reported metadata, not cryptographic attestation, proof of code correctness, or independent validation of the arbitrary claim being tested.

## Status

Production release M5K: **verified**. M5L evidence refresh: **local update, separate PR/release gate**. Public judge video and confirmed Devpost submission: **not yet completed**.
