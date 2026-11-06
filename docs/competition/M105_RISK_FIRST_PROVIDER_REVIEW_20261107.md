# M10.5 — Risk-first evidence interpretation (2026-11-07)

**Scope:** isolated local candidate on `feat/m105-risk-first-evidence`, forked from exact M10 `8fcb11fac0c925615f7181712b6d13ee65d4ccbd`. Implemented by ChatGPT/WAG, **not by Kiro CLI**.

## Verified defect and concrete value

M10 already counted provider-reported GitHub Actions results separately, but treated **any observed exact-SHA run** as a positive/green status in the PR status panel and the Evidence Trial provider panel. Consequently an exact-SHA workflow that failed or had not completed could still appear in a green status panel labeled `RUNS OBSERVED`. This was misleading, even though the details and immutable release caveat were present.

M10.5 changes **presentation and remediation priority**, not the source trust level or the independent session-to-commit binding:

| Observed provider sample (validated only) | Finding | Next action |
| --- | --- | --- |
| One or more failure/cancellation/timeout-like results | `FAILED_RUNS_OBSERVED` | Investigate failures and rerun |
| No failure, one or more in-progress results | `RUNS_IN_PROGRESS` | Wait for completion and inspect again |
| No above, one or more neutral/skipped/stale results | `NON_PASS_RUNS_OBSERVED` | Review non-success runs |
| Only success, but first response page truncated | `PARTIAL_RUN_SAMPLE` | Inspect unobserved history / required checks |
| Observed successful runs without above signals | `SUCCESSFUL_RUNS_OBSERVED` | Inspect session and independently verify required checks |
| Malformed/unknown provider input | `CI_UNVERIFIED` | Treat as unknown |

For cases with multiple signals the most consequential warning takes priority; raw validated counts and the truncation flag remain visible. Observed success is **not** a certification of required status checks, Kiro authorship, source correctness or release approval. The immutable final finding remains `RELEASE_EVIDENCE_INCOMPLETE`; independent session-to-commit link remains absent.

## Files changed

- `web/evidence-trial.mjs`: derived `workflowFinding` and risk-prioritized safe `suggestedAction`; no new network, credentials or persistence.
- `web/pr-proof.js`: risk/pending/incomplete/observed presentation and non-certifying summary copy.
- `web/trial-ui.mjs`: risk-aware second evidence exhibit; no longer marks all observed workflows as positive green; explicit next actions.
- `web/pr-proof.css`: separate risk and pending emphasis, neutral observed marker.
- `test/evidence-trial-risk-first.test.mjs`: eight new adversarial and presentation regressions.

## Verification

- **RED before remediation:** new tests failed for missing failure, pending, nonpassing and truncation findings, and for misleading UI labels.
- **GREEN after remediation:** targeted `node --test test/evidence-trial-risk-first.test.mjs` = 8 passed / 0 failed.
- **FULL suite:** `node --test --test-reporter=dot` exited 0 in isolated worktree.
- **Checks:** `npm run check` exited 0, `git diff --check` exited 0.
- **Local browser (actual Chrome headless):** opened `/pr-proof.html`; clicked expressly synthetic `After source edit`, verified `STALE RECEIPT` with synthetic label and `RELEASE EVIDENCE INCOMPLETE`. Clicked Inspect for actual public GitHub PR #7: three provider-reported successful exact-SHA runs observed; UI showed `RUNS OBSERVED, NOT CERTIFIED`, second exhibit `RUNS OBSERVED` with unverified required checks, and final incomplete disposition. Browser telemetry: 0 console errors, 0 failed requests, 0 unhandled exceptions.
- Browser checks are **local happy-path acceptance**, NOT independent integrated security review, adversarial browser coverage of forged failures, Web Content Accessibility Guidelines attestation, or proof of no background transmissions outside this checked flow.

## Release / provenance boundaries

- M9B Kiro V3 hook remains quota-blocked, uninstalled and unverified; this patch is **not Kiro-authored**.
- Saved Kiro `messages.jsonl` remains user-selected browser-only. The workflow observation is public GitHub metadata; no independent identity-binding exists between them.
- No main branch, PR #7, PR #8, production, existing Preview, YouTube visibility, or Devpost submission is altered by this local experiment.
- **HOLD** merge, production deployment and official submission pending integrated review and owner release approval.

## Top-3 strategy / highest-value next gates

1. **Actual Kiro-native proof:** use the official Kiroween credits request mechanism (before its official deadline) to unblock the CLI. With Kiro, implement and observe a *real* hook transition: test receipt -> later saved source edit -> retest required -> actual retest; record exact version, hook payload, source commit and run receipts. Synthetic harness does not count.
2. **Close the evidence gap with independent, opt-in binding:** design a bounded `commit + CI observation + session observation` trace with source-identity checks and clear unknown states. Do not treat a copied SHA in an editable log as an attestation. Keep local log data private and avoid writing custom authentication/attestation infrastructure without necessity.
3. **Make remediation actionable:** surface concise per-issue evidence requests and recheck workflow, not a universal generic `incomplete` action; preserve fail-closed semantics.
4. **Independent integrated audit:** obtain external read-only review of the exact candidate branch, verify adversarial browser flows, CSP, keyboard/screen-reader, and reproducible tests.
5. **Judges' self-service release:** refresh README/English Devpost narrative, pin exact-SHA live deployment, ship under-three-minute video only after human full audio/video review, verify a real timestamped submission. Maintain truthful Kiro-vs-ChatGPT authorship labels.

**Decision: M10.5 local technical acceptance PASS; competition/production release NO-GO pending the gates above.**
