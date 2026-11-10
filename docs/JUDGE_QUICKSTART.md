# Specter Audit — Judge Quickstart

## Evaluate filmed M19 — current judge entry (2026-11-10)

**Live M19 Preview:** https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/ (the demo linked from Devpost and filmed in V5D). This is **not** the old stable production at https://specter-audit.vercel.app.

**V5D video:** https://youtu.be/kQKkw7Dkp-M

**Exact filmed application SHA:** [`09952ed7e2728cdc030051ee14c66e61d0953d98`](https://github.com/ShenJun93/specter-audit/commit/09952ed7e2728cdc030051ee14c66e61d0953d98). [Public push CI for this SHA](https://github.com/ShenJun93/specter-audit/actions/runs/42451296583) succeeded. The currently active [M19 source branch](https://github.com/ShenJun93/specter-audit/tree/feat/m19-judge-first-run) can advance with **documentation-only** corrections, so branch HEAD need not equal the filmed SHA. [Draft release PR #10](https://github.com/ShenJun93/specter-audit/pull/10) targets `main` but remains **HOLD**, not merged.

**Devpost:** https://devpost.com/software/specter-audit-trust-the-evidence — publicly visible, **not officially submitted** as of 2026-11-10.

### No-login judge path

1. Open the **M19 Preview**. Activate **JUDGE FAST PATH — Investigate the Midnight Rewrite** to open `/alibi.html#case-room`.
2. The **recorded Kiro case 04 (The Midnight Rewrite)** is selected by default. Select **Expose the alibi**. The saved, redacted genuine Kiro CLI session records 120 passing tests, a completion claim, then five successful source edits without a later passing retest **observed in that saved session**. The bounded verdict is `STALE_LOCAL_TEST_EVIDENCE`.
3. Open **PR proof chain**, then explicitly select **Inspect this PR** to request public GitHub provider metadata. A provider PASS for a matching commit does **not** certify code correctness or required-check compliance; the Kiro log is not signed to that PR.
4. Optionally open **Your session** to select a local Kiro CLI `messages.jsonl`. The tested importer processes the selected file in the browser rather than uploading its contents to the app server. Do not upload or publish private raw session logs.

A stale receipt is **not** proof code is broken. The log could be edited, and testing outside the observed session remains unknown. This is not a cryptographic attestation of Kiro execution, and no active Kiro `PostFileSave` hook is claimed.

### Reproduce the exact filmed source

Requires Node.js 24+ and Git (zero runtime dependencies). Clone the public branch, then **detach at the filmed SHA** so later docs-only commits cannot change the reproducibility target:

```sh
git clone --branch feat/m19-judge-first-run --single-branch https://github.com/ShenJun93/specter-audit.git
cd specter-audit
git checkout --detach 09952ed7e2728cdc030051ee14c66e61d0953d98
npm run check
node --test
npm run demo
```

A separately documented fresh public Windows clone at this SHA passed 524/524 tests; [GitHub Actions push run 42451296583](https://github.com/ShenJun93/specter-audit/actions/runs/42451296583) separately passed both its verification and attestation jobs. The attestation concerns the CI receipt artifact, not the editable Kiro session. The current documentation-only release work did not independently replay the M19 browser Preview.

## Historical reference — M5L stable production and M16 Preview

**Stable production (older M5L):** https://specter-audit.vercel.app

**M16 Preview (earlier candidate):** https://specter-audit-750p0my50-nvhoa1691993-6852s-projects.vercel.app/ at `2e6cfe2d4852defa16ccad3d1311cb710b9ffab1`. The M16 link is **not** the filmed M19 deployment.

## Try the older stable production app in 60 seconds

No signup, credentials, CLI, or extension is required to use the hosted demo.

1. Open the hosted link and check the visible `SYNTHETIC SNAPSHOT` label. The app is **not** scanning your local computer, your account, or GitHub repository.
2. In **Interrogate a claim**, select or enter these three claims in order:

   | Claim | Expected verdict | What it establishes |
   | --- | --- | --- |
   | `all tests pass` | `UNVERIFIED` | No independently observed test execution |
   | `updated auth login and all tests pass` | `PARTIAL` | Relevant Git path changed; test-pass claim remains unsupported |
   | `updated auth login validation` | `SUPPORTED` | Path-level Git alignment **only**, not functional correctness |

3. Open the evidence and gaps sections. Note that a `SUPPORTED` verdict **does not** mean the code is correct or tests were independently witnessed.
4. Optionally select **Public CI evidence**. Hosted mode reads a **timestamped static record** for the fixed production merge release `374af141...`. Open its GitHub source link to check the original workflow run. It is *provider-reported status*, not a signature, proof of correctness, or CI for arbitrary claims.

These three verdict cases were read back from the live hosted `/api/evaluate` endpoint on 2026-11-04 (UTC+7).

## Run the live local Git inspector

Prerequisites: Node.js 24+, Git, desktop browser. No npm package installation is required.

```powershell
git clone --branch feat/m19-judge-first-run --single-branch https://github.com/ShenJun93/specter-audit.git
cd specter-audit
git checkout --detach 09952ed7e2728cdc030051ee14c66e61d0953d98
npm run demo
```

Open the loopback URL printed by the launcher. It generates a fresh **disposable real Git fixture** with a baseline commit and changed tracked auth file, then interrogates that fixture read-only. Ctrl+C stops the server and normally removes the fixture.

To inspect an existing Git repository's **working-tree and index metadata**, run:

```powershell
node src/http-server.mjs --repo="C:\path\to\your\git-repository"
```

Only the selected repository is inspected. No source contents are read, test commands executed or Git writes performed by the app. The local CI button can make a fixed-target, read-only GitHub request **only after a click**.

Optional adversarial test: enter a self-reported JSON receipt for `all tests pass` with exitCode 0, a matching full HEAD, timestamp, and `npm test` command. The verdict must remain `UNVERIFIED`; self-reporting is not independent test execution.

## Verify source and test suite

```powershell
npm run check
npm test
```

The checked-in `.kiro/` specs and steering docs and Git history show development scope. See `docs/M5F_RELEASE_CANDIDATE_AUDIT_20261103.md` and `docs/M5K_PRODUCTION_RELEASE_20261104.md`. The production interface is hosted and synthetic; the full inspector is local-first and **is not a remote repository analysis service**.

## Historical M16 candidate: self-verify a signed CI reference

**M16 was deployed and verified on its own Preview:** https://specter-audit-750p0my50-nvhoa1691993-6852s-projects.vercel.app/pr-proof.html#ci-reference. Stable production still does not include M16. The separate **filmed M19 Preview** is linked at the top of this page.

On the M16 local app or an owner-approved Preview, open `/pr-proof.html#ci-reference`. This panel links to the actual [GitHub Actions run 42323178158](https://github.com/ShenJun93/specter-audit/actions/runs/42323178158) and presents reproducible `gh attestation verify` commands for the historical M15 source commit `70eec77327fee7e86e6b52b57e9ab539c372bd94`.

The signed report attests the origin of the **CI receipt artifact**, not any local Kiro session and not the currently inspected PR. Judges can inspect the public run without a CLI, but cryptographic verification needs GitHub CLI. The historical reference was independently verified on 2026-11-07; no dynamic revalidation happens when the page loads.

M16 local acceptance: `docs/competition/M16_JUDGE_SELFVERIFY_LOCAL_ACCEPTANCE_20261107.md`. M15's full verification steps: `docs/competition/M15_CI_RECEIPT_ATTESTATION_20261107.md`.

The M19 V5D video is public; the Kiroween Devpost project has **not been formally submitted** as of 2026-11-10. Its final eligibility declarations must be completed by the project owner.
