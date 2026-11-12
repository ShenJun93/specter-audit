# Specter Audit — Judge Quickstart

## Judge entry — submitted M75 demo, filmed V5D source and verified main (2026-11-12)

**Current Kiroween working demo — corrected M75 Preview:** https://specter-audit-2v5dynndc-nvhoa1691993-6852s-projects.vercel.app/ (no signup). This is the main demo submitted to Devpost; it is **not** the old stable production at https://specter-audit.vercel.app.

**Historical filmed V5D Preview:** https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/ — filmed at `09952ed7e2728cdc030051ee14c66e61d0953d98`. **Stable mirror of the same filmed deployment:** https://specter-audit-kiroween-v5d-2026.vercel.app/. The submitted M75 Preview was built at corrected source `0ce4565bf608ff497b913d76d930250861a73de1`, not at the later main merge SHA.

**V5D video:** https://youtu.be/kQKkw7Dkp-M

**Filmed source:** [`09952ed7e2728cdc030051ee14c66e61d0953d98`](https://github.com/ShenJun93/specter-audit/commit/09952ed7e2728cdc030051ee14c66e61d0953d98), [filmed CI](https://github.com/ShenJun93/specter-audit/actions/runs/42451296583) **524/524 PASS**. **Current verified GitHub main:** [`1230272391c958597d7c858510f195da00ccfcbc`](https://github.com/ShenJun93/specter-audit/commit/1230272391c958597d7c858510f195da00ccfcbc), [exact-main CI](https://github.com/ShenJun93/specter-audit/actions/runs/42947264036) **533/533 PASS** with signed CI artifact receipt. PR #10 and PR #15 are merged. The stable production deployment was not changed.

**Devpost:** https://devpost.com/software/specter-audit-trust-the-evidence — officially submitted 2026-11-12 at 01:01 ICT (Devpost submitted_at), with corrected M75 as the working demo and V5D video as the historical recorded walkthrough.

### No-login judge path

1. Open the **submitted corrected M75 Preview**. Activate **JUDGE FAST PATH — Investigate the Midnight Rewrite** to open `/alibi.html#case-room`.
2. The **recorded Kiro case 04 (The Midnight Rewrite)** is selected by default. Select **Expose the alibi**. The saved, redacted genuine Kiro CLI session records 120 passing tests, a completion claim, then five successful source edits without a later passing retest **observed in that saved session**. The bounded verdict is `STALE_LOCAL_TEST_EVIDENCE`.
3. Open **PR proof chain**, then explicitly select **Inspect this PR** to request public GitHub provider metadata. A provider PASS for a matching commit does **not** certify code correctness or required-check compliance; the Kiro log is not signed to that PR.
4. Optionally open **Your session** to select a local Kiro CLI `messages.jsonl`. The tested importer processes the selected file in the browser rather than uploading its contents to the app server. Do not upload or publish private raw session logs.

A stale receipt is **not** proof code is broken. The log could be edited, and testing outside the observed session remains unknown. This is not a cryptographic attestation of Kiro execution, and no active Kiro `PostFileSave` hook is claimed.

**Kiro provenance (bounded, public source history):** [M1 inspector](https://github.com/ShenJun93/specter-audit/commit/9896ccd9851d5559983f511187ac71ce85f0db10), [M5A CI adapter](https://github.com/ShenJun93/specter-audit/commit/99e210da586c2129de9e306c0aae0bb379bd3e53), [M6E session-staleness engine](https://github.com/ShenJun93/specter-audit/commit/950acf93e92417820d9564c7cd3da7fba6030e99), [historical M6E session report](https://github.com/ShenJun93/specter-audit/blob/1230272391c958597d7c858510f195da00ccfcbc/docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md). The report's original "NOT shipped" note reflects its historical date; the engine was subsequently merged. Commit history does not cryptographically verify editable Kiro-session authorship.

### Reproduce the exact filmed source

Requires Node.js 24+ and Git (zero runtime dependencies). Clone the public repository, then **detach at the filmed SHA** so the video can be reproduced independently of the changing default branch:

```sh
git clone https://github.com/ShenJun93/specter-audit.git
cd specter-audit
git checkout --detach 09952ed7e2728cdc030051ee14c66e61d0953d98
npm run check
node --test
npm run demo
```

Filmed source `09952ed7e2728cdc030051ee14c66e61d0953d98` passed **524/524** tests ([historical CI](https://github.com/ShenJun93/specter-audit/actions/runs/42451296583)). Reviewed [main `1230272391c958597d7c858510f195da00ccfcbc`](https://github.com/ShenJun93/specter-audit/commit/1230272391c958597d7c858510f195da00ccfcbc) passed **533/533** ([exact-main CI](https://github.com/ShenJun93/specter-audit/actions/runs/42947264036)). The [M75 corrected Preview](https://specter-audit-2v5dynndc-nvhoa1691993-6852s-projects.vercel.app/) is deployed from earlier parser-fix source `0ce4565bf608ff497b913d76d930250861a73de1`, not from the later main merge SHA. CI attestation covers the receipt artifact, not Kiro transcripts or code correctness. Devpost has been submitted; stable production remains older.

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
git clone https://github.com/ShenJun93/specter-audit.git
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

The V5D video is Public; Devpost reports the Kiroween project was formally submitted on 2026-11-12 at 01:01 ICT. This page is a documentation snapshot, not a guarantee about future submission revisions. All eligibility declarations and custom answers belong to the submitter.
