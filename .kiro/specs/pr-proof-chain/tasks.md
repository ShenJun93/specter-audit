# M9A tasks — experimental branch only

- [x] Create isolated worktree at `qa/private/specter-proof-chain-experiment` from M8.8+docs HEAD; PR #7 branch untouched.
- [x] Implement canonical GitHub PR URL validation, bounded two-request public API probe, and conservative result output.
- [x] Test malicious URLs, foreign SHA/repo/run links, 403/429/404, timeout, duplication, oversized JSON, truncation, and exact-SHA observations.
- [x] Build keyboard-navigable public PR page with user-initiated network request, fixed safety caveats, sanitized JSON export, and links from existing pages.
- [x] Chrome local acceptance of real GitHub PR #7 on desktop and mobile390: two GETs per valid query, zero before user action, unknown for forged domain, focus and no overflow.
- [ ] Full independent integrated security/accessibility review; source-only Codex inspection found no reproducible P0/P1 in provided excerpts, but is **not full signoff**.
- [x] Commit M9A locally on isolated experimental `feat/m9-pr-proof-chain` after 418 tests and browser QA; no push, merge, production promotion or public Preview without separate acceptance.
- [ ] When Kiro credits restored, use Kiro CLI V3 to independently develop and verify opt-in M9B native hook; keep `.kiro/hooks/` absent until real acceptance and owner authorization.

## Release boundary

M9A is a read-only public-GitHub **observation**, not a session-to-commit proof chain with independent binding. Do not claim Kiro generated M9A code; it was authored with ChatGPT/WAG. Do not claim that three successful workflow runs establish all checks or correctness. M8.8 PR #7 remains Draft/HOLD.
