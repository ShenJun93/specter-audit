# Specter Proof Chain — M9A public PR evidence requirements

Date: 2026-11-06. Status: EXPERIMENT / NO RELEASE APPROVAL.
Provenance: spec drafted using ChatGPT/WAG; NOT Kiro-authored. Kiro credits were unavailable at drafting time. Kiro may later review/implement separately once credit access is restored.

## User problem

An AI coding agent can assert that tests passed without binding the receipt to the PR HEAD under review. Specter M8.8 already handles editable Kiro self-recorded test chronology and frozen GitHub CI exhibits separately. A reviewer needs a live, inspectable **public GitHub PR** evidence check and an honest view of gaps between agent-session tests, exact commit and provider CI.

## Requirements

1. Only after an explicit user action, accept a public GitHub pull request URL in the strict form `https://github.com/OWNER/REPO/pull/NUMBER`. Reject credentials, query, fragment, alternate domains, Unicode lookalikes, encoded path traversal, invalid slugs and unbounded input. Do not fetch a user-supplied arbitrary origin or a private repository.
2. Fetch GitHub REST `GET /repos/{owner}/{repo}/pulls/{number}` from a fixed allowlisted `https://api.github.com` host. Validate the returned PR's identity, full 40-hex `head.sha`, and base repository. Fetch **only** `GET /repos/{owner}/{repo}/actions/runs?head_sha={sha}&per_page=30&page=1`. Do not follow redirects.
3. Make at most two bounded, unauthenticated GET requests, with per-request timeout and streaming byte cap; no auth, no local storage, no cookies, no query containing private session content, no command execution, no mutations. Fail closed on 403/404/429, timeout, malformed payload, unsafe run URLs, inconsistent repo/SHA, truncation errors, redirects and network errors.
4. Display GitHub PR number, exact HEAD SHA, observed run counts, and inspectable *validated* run links. Every run has the source and explicit limits: provider-reported, not independent attestation; list may be truncated; some workflows, external checks, or future edits may not be represented. **Never** render global `ALL_TESTS_PASS`, `VERIFIED`, `RELEASE_APPROVED` or semantic correctness.
5. Clearly state the **unjoined link** from an imported self-recorded Kiro session to the exact PR commit. Without independently verifiable binding, do not certify end-to-end freshness. A CURRENT self-recorded session does not prove the PR commit was tested.
6. Provide a sanitized, portable review summary, containing only validated public PR/CI metadata and fixed limitations; no raw user logs, commands, source paths or session contents. Native copy/download can be added after core evidence checks pass.
7. No Kiro hook is activated as part of M9A. M9B (later) may ship an **opt-in** hook only after Kiro V3 real integration QA, review of hook STDIN schema, credit availability, and explicit owner authorization. Auto-creating `.kiro/hooks/*.json` now is forbidden because it activates on session start.
8. Keep M8.8 PR #7, demo video, stable production and all previously approved behavior untouched. Implement in isolated experimental Git branch/worktree and treat the release state as HOLD.

## Acceptance criteria

- 20+ deterministic source tests, including rate limits, malicious URLs, mismatched head SHA, forged run URLs, bounded response, mixed/empty runs and never-assert-all-pass.
- Browser UI desktop/mobile, keyboard and screen reader accessible semantics, no source text inserted through HTML, no external connection without explicit click.
- Live real public PR smoke showing exact source commit and one or more valid GitHub provider links **or** conservative UNKNOWN when rate-limited.
- Every response includes `localSessionLinkedToPr:false`, `independentlyAttested:false`, `semanticCorrectnessVerified:false`.
- Independent review before merge/Preview/production. No PR #7 mutation and no public Devpost wording until separately accepted.

## Non-goals

- GitHub authentication, private repositories, arbitrary CI providers, installing an app, execution of tests, source-code scanning, claiming all required checks completed, Kiro session-to-commit attestation, automatic hook enablement, or guessing GitHub API information.
