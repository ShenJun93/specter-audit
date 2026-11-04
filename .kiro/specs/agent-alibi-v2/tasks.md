# Agent Alibi Investigator v2 — gated progress (2026-11-04)

## Completed with evidence
- [x] M6A requirements, design and threat boundaries captured in Kiro spec.
- [x] Pure `src/alibi-engine.mjs`, deterministic `test/alibi-engine.test.mjs` (27/27 tests including claim-time freshness).
- [x] M6B pinned two *real* public GitHub Actions run records and the real Git DAG: `41736082288` and `41742626694`.
- [x] M6B recorded three distinct case reports, with a hypothetical-claim / real-provider separation.
- [x] M6C new `/alibi.html` judge experience, strict browser input guards, timeline, source links, three reveal states, reduced-motion and responsive design.
- [x] M6C local HTTP allowlist/CSP, Node/browser verification desktop + mobile390; no external browser requests or console errors.
- [x] Prior source inspector and production release remain unchanged; no push or deploy for M6C.

## Open gates — required for a credible contest entry
- [ ] Independent adversarial security/code review of M6A/M6C and corrective remediation.
- [ ] Git commit, user-authorized push, GitHub CI on exact SHA, reviewed PR and Vercel Preview browser acceptance.
- [ ] Production release with verified exact SHA and post-deploy rollback guard.
- [ ] **Meaningful authentic Kiro-authored source work.** Three Kiro CLI implementation attempts timed out and wrote no code; the M6 engine/UI are ChatGPT/WAG-authored. Do not claim otherwise. A bounded follow-up Kiro task must actually create verifiable code/diffs, or recognize Kiro eligibility risk.
- [ ] Authentic recorded Kiro screen/session evidence, under-3-minute YouTube judge video.
- [ ] Devpost eligibility and submission confirmation. The current project remains DRAFT.

## Reproducibility
- `npm run check`
- `npm test`
- `node qa/private/specter-m6c-alibi-browser-20261104/acceptance.mjs`
- `npm run capture:alibi` only when intentionally refreshing the fixed provider snapshot with public GitHub API data.

Important: the `STALE_EVIDENCE` exhibit means an **older cited CI run** cannot prove the later commit, not that the later commit lacks successful CI.
