# M12 Evidence Repair Plan — local technical acceptance (2026-11-07)

**Decision:** LOCAL TECHNICAL PASS / RELEASE HOLD. This is not independent security sign-off, production certification, Kiro-native acceptance, or completed contest submission.

## Provenance and scope

- Worktree: `qa/private/specter-m12-evidence-repair-20261107`; branch `feat/m12-evidence-repair`.
- Based on M10.5 local commit `7e726eada43b1e3855989e5dba734e9875aa939a`.
- M12 implementation and QA authored by **ChatGPT/WAG**, not by Kiro CLI.
- M9B native Kiro V3 hook remains quota-blocked; it was not created, enabled or demonstrated.
- No production, existing Preview, PR #7/#8, YouTube or Devpost changes.

## User benefit / bounded design

Prior UI offered only one prioritized suggested action, even when a saved agent test was stale and an observed GitHub Actions run had failed. M12 adds **three simultaneous, independently actionable evidence checks** to the Evidence Trial screen and redacted JSON export.

1. **Kiro test chronology:** no session, stale real receipt, current self-recorded receipt, unsupported evidence, or explicitly synthetic example.
2. **Exact-commit CI:** no query, invalid/unknown, failed, pending, neutral/non-pass, truncated, or observed GitHub-reported success.
3. **Independent session-to-commit link:** always `UNBOUND`; a self-recorded test, pasted commit SHA or observed successful CI does not prove the tests ran against the PR HEAD.

Each check contains a bounded fixed `id`, `state`, `label` and `nextAction`. Values are derived only from the already normalized `combineTrial` evidence. No new provider API, external network call, private log upload, storage, package dependency or executable automation has been introduced.

The UI uses DOM `textContent` and safe nodes, not untrusted HTML. The report schema is `SPECTER_UNJOINED_EVIDENCE_TRIAL_V1` with a nested `repairPlan.schema = SPECTER_EVIDENCE_REPAIR_PLAN_V1`. It retains `localSessionLinkedToPr:false`, `independentlyAttested:false`, `allRequiredChecksVerified:false`, `releaseApproved:false`. The plan always reports `readyForRelease:false`.

## Verified tests (exact local candidate before commit)

- New RED regression: 7/8 failed before implementation (missing repair states and UI).
- New GREEN regression: **8/8 passed** after implementation.
- Full Node suite: **477/477 PASS**, 0 failed, 0 skipped.
- `npm run check`: exit 0 (run through `cmd /c` to avoid PowerShell's stderr-as-error handling for npm notices).
- `git diff --check`: exit 0.
- Local WAG-owned headless Chrome opened the M12 `/pr-proof.html` from the worktree read-only server:
  - Initial plan: two NOT INSPECTED and one UNBOUND.
  - Clicked explicitly synthetic `After source edit`: observed `SYNTHETIC STALE`, next-step retest action.
  - Clicked explicitly synthetic `After fresh retest`: observed `SYNTHETIC CURRENT`; link remained `UNBOUND` and final disposition `RELEASE EVIDENCE INCOMPLETE`.
  - Explicitly inspected public GitHub PR #7 using the existing browser-only provider flow: 3 GitHub-reported successful exact-SHA runs, plan `PROVIDER SUCCESS OBSERVED`, still `UNBOUND` and release incomplete.
  - Browser telemetry: **0 console errors, 0 failed requests, 0 unhandled exceptions** in tested flow.
- Negative provider variants are covered by deterministic Node tests. **No new full adversarial browser suite or actual screen-reader inspection** was performed.

## Why M12 is NOT an independent proof bridge

The third edge deliberately remains unbound. A credible actual link would require independent test execution provenance for the same exact source commit (for example, a trusted CI attestation verified against issuer policy), not a copied hash or an editable local session. This milestone does **not** implement verification of such attestations.

## Follow-up release gates

1. Restore Kiro quota legitimately, then implement and observe the actual native Kiro V3 PostFileSave test-edit-warning-retest workflow. Preserve truthful origin labels.
2. Seek independent adversarial review of the **integrated exact branch/merge tree** and public Preview CSP, mobility, focus, privacy and invalid provider responses.
3. Determine a minimal native/standard way to independently bind test execution evidence to PR HEAD rather than writing custom PKI or a bespoke attestation service.
4. Deploy an owner-approved exact-SHA Preview, rehearse judge self-service flow and review M10/M12 video AV end to end.
5. Synchronize English Devpost write-up, category, public YouTube video, public licensed GitHub repo including root `/.kiro` and functional public URL; submit and verify before Dec 4, 2026 2:00 PM Pacific.

**Release HOLD** until independent review and deliberate owner authorization.
