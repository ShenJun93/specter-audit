# Specter Audit — Judge Quickstart

**Live hosted demo:** https://specter-audit.vercel.app

**Public source:** https://github.com/ShenJun93/specter-audit

**Category proposal:** Costume Contest (Kiroween 2026).

## Try the live app in 60 seconds

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

The under-three-minute public YouTube demo and final Devpost submission are separate deliverables, not implied by the existence of this quickstart.
