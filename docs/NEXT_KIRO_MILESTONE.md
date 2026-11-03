# M5 candidate — Provider-reported CI evidence (implement with Kiro)

**Status:** PROPOSED, NOT IMPLEMENTED. This document is a bounded handoff
for a future genuine Kiro coding session. Do not claim Kiro implemented it
merely because this proposal lives in the repository.

## User problem

Specter can observe Git file-path changes, but a pasted exitCode 0 is easy
to fabricate. A judge needs to see how external CI provider status can
improve evidence quality while retaining explicit trust limits.

## Scope

- Add an **opt-in, read-only** GitHub Actions status reader for a PUBLIC
  repository, with a fixed allowlisted API host `api.github.com`.
- Take only strict owner, repo, 40-character commit SHA inputs. Never fetch
  a user-controlled arbitrary URL. No credentials, tokens, secrets or source
  contents. Enforce short timeout, response-size bound and GitHub rate-limit
  handling. Fail closed with UNKNOWN.
- Compare GitHub's provider-reported `head_sha`, run status and conclusion
  against the exact selected commit. Capture run ID/URL/updated timestamp.
  A provider-reported success is **not** signed attestation or proof of
  functional correctness. Expose the source link to judges.
- Keep the existing local Git inspector **offline by default**. The new
  provider-backed feature must be explicitly enabled, with clear consent.
  Any change to `.kiro/steering/product.md` must explain the optional
  network boundary and must not silently weaken existing protections.
- The hosted public demo may query only a fixed configured public GitHub
  repository, initially `ShenJun93/specter-audit`, without accepting a
  different arbitrary repository from browser requests.
- Preserve `SUPPORTED/PARTIAL/UNVERIFIED` semantics. Never trust
  `providerEvidence` pasted by the caller. Only evidence retrieved by
  the server from the provider can be considered provider-reported.
  Do not upgrade a claimed test result based solely on GitHub run status
  unless the exact commit+workflow+run identity is established.

## Kiro implementation plan

1. In Kiro, read the M1–M4 source and current steering; propose precise trust
   semantics and threat model BEFORE code changes.
2. Implement a small dependency-free provider adapter with injected fetch
   for deterministic tests; no general-purpose web fetch/proxy.
3. Add at least 12 tests: wrong SHA, no runs, successful completed run,
   failed/cancelled/in-progress, malicious owner, remote 403/429, timeout,
   oversized JSON, malformed response, supplied fake provider data, network
   disabled by default, and provider-run URL validation.
4. Extend dashboard with readable source/provenance legend, keyboard access,
   mobile check, safe links and no unsupported guarantees.
5. Run npm test, npm run check, browser acceptance. Update design/steering and
   record Kiro CLI session evidence privately with secrets redacted.
6. Make a new small reviewable Git commit only after the tests pass and the
   owner explicitly authorizes release/deployment.

## Success criteria

A real externally reported GitHub Actions result is distinguishable from a
self-reported receipt without implying signed provenance. No arbitrary
network/command execution, no repo mutation, and no CI/provider data loss
in test failures. Judges can inspect the run source independently.

**Kiro usage requirement:** Implement/review this feature through the actual
Kiro IDE/CLI, not by adding the .kiro folder after the fact.
