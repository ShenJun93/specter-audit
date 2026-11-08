# Specter Audit — Judge Quickstart

**Stable production (older M5L):** https://specter-audit.vercel.app

**Verified M16 public Preview (feature-complete earlier candidate):** https://specter-audit-750p0my50-nvhoa1691993-6852s-projects.vercel.app/ — exact deployed commit `2e6cfe2d4852defa16ccad3d1311cb710b9ffab1`.

**M19 first-run improvement (this branch):** LOCAL ONLY until its exact SHA is independently deployed and checked. It is not yet on the M16 URL above.

**Public source:** https://github.com/ShenJun93/specter-audit

**Category proposal:** Costume Contest (Kiroween 2026).

## M19 judge-first-run candidate (local until separately deployed)

No file upload, login or Kiro credits are needed for the first judge scenario. On the **M19 local candidate** home page:

1. Activate **JUDGE FAST PATH — Investigate the Midnight Rewrite**. It opens `/alibi.html#case-room`.
2. The Alibi Room loads **case 04, The Midnight Rewrite**, from a redacted authentic saved Kiro CLI session. Select **Expose the alibi** to see `STALE_LOCAL_TEST_EVIDENCE`: 120 recorded passing tests, an agent assertion, then five successful source edits without a further test observed in that saved session.
3. Go to **PR proof chain** and explicitly choose **Inspect this PR** to see current public GitHub provider metadata. PR #7 is not approved and its CI evidence is not independently bound to the Kiro session.
4. If a judge has their own `messages.jsonl`, **Your session** analyzes it locally in the browser. Never upload or publish raw private Kiro logs.

The M19 first-run and narrow-screen navigation change have **local browser acceptance only**; the M16 Preview predates them. The old production Git inspector three-claim path below is retained as a separate, historical demo. Do not show M19 as deployed until a distinct exact-SHA Preview is tested.

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

## M16 candidate: self-verify the signed CI reference

**M16 was deployed and verified on its own Preview:** https://specter-audit-750p0my50-nvhoa1691993-6852s-projects.vercel.app/pr-proof.html#ci-reference. Stable production still does not include M16. M19 is not deployed.

On the M16 local app or an owner-approved Preview, open `/pr-proof.html#ci-reference`. This panel links to the actual [GitHub Actions run 42323178158](https://github.com/ShenJun93/specter-audit/actions/runs/42323178158) and presents reproducible `gh attestation verify` commands for the historical M15 source commit `70eec77327fee7e86e6b52b57e9ab539c372bd94`.

The signed report attests the origin of the **CI receipt artifact**, not any local Kiro session and not the currently inspected PR. Judges can inspect the public run without a CLI, but cryptographic verification needs GitHub CLI. The historical reference was independently verified on 2026-11-07; no dynamic revalidation happens when the page loads.

M16 local acceptance: `docs/competition/M16_JUDGE_SELFVERIFY_LOCAL_ACCEPTANCE_20261107.md`. M15's full verification steps: `docs/competition/M15_CI_RECEIPT_ATTESTATION_20261107.md`.

The under-three-minute public YouTube demo and final Devpost submission are separate deliverables, not implied by the existence of this quickstart.
