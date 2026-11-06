# M9A design — bounded public PR inspection

## Architecture

New `web/public-pr-evidence.mjs` exports `parsePublicPrUrl(input)` and `inspectPublicPr(input,{fetchImpl,now,timeoutMs})`. A `fetchImpl` injection exists **only** for tests; UI passes default global fetch. No server or external npm dependency. The browser never reads visitor local Kiro files as part of the PR workflow.

Two fixed endpoints:
1. `https://api.github.com/repos/OWNER/REPO/pulls/NUMBER`
2. `https://api.github.com/repos/OWNER/REPO/actions/runs?head_sha=FULL_SHA&per_page=30&page=1`

The service checks safe ASCII repo names, URL and PR identity; validates each displayed GitHub Actions URL and run SHA, ID and workflow ID. Output includes strict source provenance, fetched-at timestamp (client clock, not provider attestation), counts and at most thirty validated runs. Pagination means all checks and required branch protection cannot be inferred, even if all observed runs succeeded. No positive global gate is ever returned.

The failure contract is `{status:'UNKNOWN',reason:<fixed allowed enum>,... fixed limitations}` and never includes raw provider errors or raw response body. Build `redirect:'error', credentials:'omit', referrerPolicy:'no-referrer'`, capped response stream, AbortController timeout, allowed endpoint and method GET.

UI in `web/pr-proof.html` + `web/pr-proof.js` + `web/pr-proof.css`; separate experimental route under existing static web deployment and existing local HTTP server if static file routing supports it. Status panel uses `textContent` for all external strings; rel=noopener noreferrer on validated run anchors. Clicking a PR URL is intentionally an external network action, unlike private Kiro session inspection.

One crucial line in the UI:
> CURRENT self-recorded Kiro session ≠ tests executed against this PR HEAD. No session-to-commit binding has been verified.

Result shape (conceptual):
```json
{"schema":"SPECTER_PUBLIC_PR_OBSERVATION_V1",
 "source":"LIVE_GITHUB_REST_PUBLIC","status":"OBSERVED_EXACT_SHA_RUNS",
 "repository":"owner/repo","prNumber":7,"headSha":"<full 40-hex>",
 "counts":{"success":1,"failure":0,"inProgress":0,"other":0},
 "truncated":false,"localSessionLinkedToPr":false,
 "independentlyAttested":false,"semanticCorrectnessVerified":false,
 "allRequiredChecksVerified":false}
```

No hidden inference of required GitHub branch-protection checks. UI should show `UNKNOWN` when the list is empty or the fetch is blocked, and distinguish `0 observed` from `0 exist`.

## Security and reliability

Bounded 2-request public API; no Authorization, no user controlled outbound host, no redirects, no URL query containing user logs, no persistence; aggregate-only structured return. Zero remote mutation. Response headers/Content-Type validated. Every returned workflow run must match full SHA, exact base repository and validated `github.com/owner/repo/actions/runs/{run_id}` link. Invalid record fails closed, rather than skipping it to make data appear green.

## Delivery plan

A. Spec + standalone evidence module + tests.
B. Accessible browser page + synthetic network mocking and real public PR smoke.
C. Evaluate benefit: can a developer use it for a real PR? Document rate-limit/partial observability.
D. Kiro V3 review/implementation of separate opt-in M9B hook once credits are available. Keep hooks disabled until real Kiro acceptance. No production gate changes in A–D.
