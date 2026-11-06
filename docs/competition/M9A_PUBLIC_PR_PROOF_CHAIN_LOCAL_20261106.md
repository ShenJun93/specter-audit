# M9A Public PR Proof Chain — local acceptance, 2026-11-06

**Status: LOCAL CANDIDATE. RELEASE HOLD.** This report does not authorize pushing, merging, deployment, modifying PR #7, adding a Kiro hook or changing Devpost.

## Repository authority

- Base: `bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d` (M8.8 + README documentation).
- Experimental branch: `feat/m9-pr-proof-chain`, worktree: `qa/private/specter-proof-chain-experiment`.
- Existing M8.8 app source SHA: `8fc24affba4cfa00ee91b9ed0a65ad5941cdfe24`; no changes to PR #7 branch, public M8.8 Preview or stable production.
- M9A implementation by **ChatGPT/WAG**, not Kiro CLI. Kiro credits unavailable. No native hook added or enabled.

## Delivered, scoped

- `web/public-pr-evidence.mjs`: only a canonical `https://github.com/OWNER/REPO/pull/N` is accepted. Two preconstructed allowlisted `https://api.github.com` unauthenticated GET requests: PR metadata, then first 30 Actions workflow runs for its exact 40-hex HEAD.
- Head SHA, base repository, PR identity and each displayed run ID/SHA/source link validated; redirects rejected; request timeout and response byte cap; errors collapse into fixed UNKNOWN codes without raw response bodies.
- `web/pr-proof.html`, `web/pr-proof.js`, `web/pr-proof.css`: user-triggered, keyboard-navigable public PR evidence view; read-only result, unjoined Kiro-session-to-commit boundary, validated GitHub run links, sanitized copy/download. Provider strings inserted using text nodes, not HTML.
- Explicit route allowlist in `src/http-server.mjs`; only `/pr-proof.html` allows CSP `connect-src https://api.github.com`. Existing session pages stay `connect-src 'self'`.
- Matching exclusive route header patterns in `vercel.json`. Vercel deployed behavior **not yet validated**; local regex test is not a substitute.
- Navigation entrypoints added to `web/index.html`, `web/live.html`, `web/alibi.html`. `npm run check` now checks both M9A JavaScript modules.
- No new dependency, no GitHub token or authentication, no private-session reading, no local storage or provider mutations.

## Grounded acceptance

- Full `npm test`: **418/418 PASS**, 0 failed/skipped (all previous M8.8 tests included).
- `npm run check`: PASS. `git diff --check`: PASS.
- New targeted Node tests: 71 security/provider tests + 12 static/server/navigation tests = **83 tests**; last test checks input lock for in-flight requests.
- Chrome real local UI, **desktop 1280px and mobile390**: PASS at the same M9A worktree. Both navigations made **zero provider requests** before click. A forged github.com lookalike URL returned **UNKNOWN**, **zero external requests**. Opt-in PR #7 check issued exactly two GET requests per device, returned 3 provider-reported successes and full SHA `bba991f7ecc3eb9b4fda5404c7b6dcbcb60d7a5d`, with three validated clickable workflow-source links. Keyboard skip, result focus, and no horizontal scroll passed; console/runtime errors observed: 0.
- Static `browser_a11y_audit` on M9A HTML: score 100 / 0 heuristic violations. Not WCAG or real screen-reader certification.
- An independent Codex **source-only excerpt review** returned no reproducible P0/P1 for the supplied five files. It did **not** run tests, inspect all of PR #7 or verify live Vercel configuration. It noted the browser fetch needs to honor AbortSignal and the non-streaming mock fallback checks size after receipt. Not release approval.
- `vercel.json` negative lookahead syntax was cross-checked against Vercel official configuration docs; public deploy headers not yet tested.

## Scope and product truth

- Three GitHub Actions successes are **provider-reported** only. They do not certify required status checks, semantic correctness, independent execution, or that every CI provider was observed.
- The system **does not link** a Kiro session to the PR HEAD SHA; `localSessionLinkedToPr:false`, `independentlyAttested:false`, `semanticCorrectnessVerified:false`, `allRequiredChecksVerified:false` even for green results.
- The browser page contacts GitHub only on user opt-in, and GitHub receives PR identifiers and user network IP. Never imply no network traffic at all; the private Kiro session investigator remains offline.
- An API rate limit, empty run list, invalid metadata or network failure fails closed to UNKNOWN.
- Production, Vercel aliases, PR #7 and Devpost remain unchanged.

## Open gates

1. Separate review of complete integrated worktree, especially Vercel deployed header/path behavior and actual Chrome screen-reader accessibility.
2. Owner decision whether the observed feature justifies public Preview, then exact-SHA GitHub CI and deployed browser QA. Do not reuse M8.8 evidence as M9A proof.
3. Kiro CLI V3 acceptance and real authored evidence for future **separate** M9B hook if credits restored; no automatic hook activation.
4. Only after full acceptance: considered merge into the integrated release branch, separate owner-approved production promotion and video/Devpost update.

**Release decision: HOLD.**
