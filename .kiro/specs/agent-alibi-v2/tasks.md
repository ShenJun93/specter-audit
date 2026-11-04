# Agent Alibi Investigator v2 — M6F local gate (2026-11-04)

## Completed and checked locally
- [x] M6A pure Git/CI ancestry verdict engine and fail-closed tests; requirements/design retained in Kiro spec.
- [x] M6B two genuine public GitHub Actions run snapshots `41736082288` and `41742626694` against the actual Git DAG; three distinct hypothetical-claim cases.
- [x] M6C hosted-compatible haunted Alibi Room, explicit provenance labels, responsive desktop/mobile and no visitor provider API access.
- [x] M6D adversarial review found and fixed CI-after-claim, omitted/duplicated CI timeline events, selected record mismatch, duplicate commits.
- [x] M6E read-only examination of actual Kiro session records and a privacy-safe capture of M1/M5A genuine agent statements, observed tool results and successful edits.
- [x] M6E new `src/kiro-session-staleness.mjs` **Kiro CLI-authored**, plus its original tests. Five Kiro implementation sessions: 18 successful edit tool results. Separate ChatGPT/WAG adversarial tests and six small fixture corrections are not attributed to Kiro.
- [x] M6F fourth exhibit **The midnight rewrite**: authentic M5A recorded test 120 PASS, genuine claim, then five successful source replacements; earlier test receipt is stale relative to those edits. No post-edit test rerun was observed **in that saved session**.
- [x] M6F standalone, pinned public-safe JSON, operator-only capture through the Kiro-authored engine, independent browser guard, fixed loopback GET route and real Chrome desktop/mobile390 acceptance. Four cases selectable, case 04 default, no external requests or console errors.

## Open gates — not cleared
- [ ] Independent product/security review including cross-case source/provenance boundaries and a skeptical judge read-through.
- [ ] Verify *full repository* Node suite, syntax, diffcheck and reproducible capture on final M6F worktree.
- [ ] Commit M6D, M6E, M6F as reviewable units after WAG `GIT_COMMIT` gateway policy is genuinely enabled. No bypass if it reports `KILL_SWITCH_ENGAGED`.
- [ ] Owner-authorized push; GitHub CI on the **new exact head SHA**; reviewed PR #3 and new Vercel Preview desktop/mobile real browser acceptance.
- [ ] Merge + production release only after exact-SHA/rollback gate and owner authorization.
- [ ] Authentic under-three-minute Kiro CLI+four-case judge video and Devpost eligibility/submission confirmation.

## Reproduce local candidate
- `npm run check`
- `npm test`
- `node qa/private/specter-m6e-kiro-provenance-20261104/m6f-browser.mjs`
- `npm run capture:kiro-session` only with the existing ignored scrubbed private exhibit, explicitly operator-run.
- Never publish `qa/private` or full Kiro session logs.

## Evidence interpretation
- `STALE_EVIDENCE` (GitHub) means the specifically cited ancestral CI artifact cannot prove the newer commit; valid exact-SHA CI is also recorded.
- `STALE_LOCAL_TEST_EVIDENCE` (Kiro) means the last observed passing test occurred before later edits; it **does not** assert later tests never ran elsewhere or that the edited code is broken.
- Raw local logs are editable. Their captured SHA-256 fingerprint is not signed independent attestation.
- M6A CI engine / M6C and M6F UI are ChatGPT/WAG-authored; M6E session staleness module has source-level Kiro authorship evidence.
