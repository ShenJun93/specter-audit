# Specter Audit

**The agent said "done." What does Git say?**

Specter Audit is a local-first, read-only Git metadata investigator for AI coding-agent completion claims. It turns a confident assertion into an explainable, bounded evidence verdict: **UNVERIFIED**, **PARTIAL** or **SUPPORTED**. *Alignment is not code correctness.*

**Kiroween 2026** — proposed category: **Costume Contest**.

**Live judge demo:** https://specter-audit.vercel.app

**Public repository:** https://github.com/ShenJun93/specter-audit

## Alibi Room v2 — local release candidate

The new **Agent Alibi Investigator** is available at `/alibi.html` when running this branch locally. It is **not yet deployed on the public production domain**. The homepage links to this separate experience.

Alibi Room reconstructs whether cited GitHub Actions results match the exact commit in a hypothetical coding-agent completion claim. Three bounded, inspectable exhibits use actual recorded GitHub CI run metadata:

| Exhibit | GitHub CI evidence | Alibi conclusion |
| --- | --- | --- |
| Borrowed alibi | Successful workflow #6 at ancestor SHA `374af14` reused for `b6e1407` | `STALE_EVIDENCE` (that **artifact** is stale; not all CI absent) |
| Fresh evidence | Exact target SHA `b6e1407`, workflow #9 | `PROVIDER_REPORTED_PASS`, **not** a correctness proof |
| Empty dossier | No CI run supplied in a hypothetical exercise | `INSUFFICIENT_EVIDENCE` |

Recorded source runs: [41736082288](https://github.com/ShenJun93/specter-audit/actions/runs/41736082288) and [41742626694](https://github.com/ShenJun93/specter-audit/actions/runs/41742626694). They are real, publicly inspectable metadata; the claimed agent statements are explicitly hypothetical. A pure deterministic engine checks SHA/workflow/ancestry and the time evidence became available. No token or anonymous visitor-triggered GitHub API access is used.

The engine and UI were implemented with ChatGPT/WAG assistance. **Three Kiro CLI implementation attempts timed out without authoring source**, so this v2 feature is not represented as Kiro-authored. Competition-level Kiro development evidence and the final video remain release gates.


## Try it in 60 seconds

The public demo requires no account or installation. It is visibly labeled **SYNTHETIC SNAPSHOT**, because it uses a frozen Git fixture, not a remote inspection of your machine or repositories. Its claim evaluator still runs on every request.

| Claim | Verdict | Interpretation |
| --- | --- | --- |
| `all tests pass` | `UNVERIFIED` | No independently witnessed test execution |
| `updated auth login and all tests pass` | `PARTIAL` | Changed path aligns; test assertion unsupported |
| `updated auth login validation` | `SUPPORTED` | Relevant path changed, but correctness is not proven |

A separate **Public CI evidence** button shows a timestamped record of the fixed GitHub Actions workflow for the **production merge release** (`374af141...`). Hosted visitors never trigger an outbound GitHub API call. The recorded result is provider-reported CI metadata for that *one published commit*, not an attestation and not proof that arbitrary agent claims are true.

**Live production provenance:** M5L has deployed at merge SHA `b6e1407d...`. Its CI panel intentionally displays the separately labeled historical M5K release record (`374af141...`), not CI proof for M5L. The M5L merge CI is [run 41742626694](https://github.com/ShenJun93/specter-audit/actions/runs/41742626694). Alibi Room v2 remains an unreleased candidate.

## Local read-only inspection

Requires Node.js 24+ and Git. Zero runtime dependencies; no package installation required.

```powershell
git clone https://github.com/ShenJun93/specter-audit.git
cd specter-audit
npm run demo
```

This launches a disposable real Git fixture in the OS temporary directory and prints a loopback URL. Ctrl+C stops the server and normally deletes the fixture.

To inspect a chosen Git repository's working-tree and index metadata:

```powershell
node src/http-server.mjs --repo="C:\path\to\your\git-repository"
```

The process binds to `127.0.0.1` and executes only bounded, fixed Git metadata operations through argument-array `execFile` calls with `shell:false`. It does **not** read source contents, execute claimed test commands, accept arbitrary shell commands, modify the inspected repository or crawl GitHub repos. A locally initiated, fixed-target CI lookup is opt-in only.

A pasted receipt reporting exitCode 0, command, SHA and timestamp is still **self-reported**. It cannot independently prove that tests ran.

## Verify

```powershell
npm run check
npm test
```

Tests cover Git inspection, evaluator verdict semantics, synthetic mode, API limits, CI ordering and provenance gates. The CLI and public hosted replay have different trust boundaries.

## Development provenance

- Kiro CLI genuinely implemented initial M1 Git inspection work, and contributed to the early M5A/M5B GitHub Actions adapter.
- Root `.kiro/specs/specter-audit/` and `.kiro/steering/product.md` capture requirements, tasks and strict read-only/evidence semantics.
- Subsequent API/UI, hosted release engineering, security hardening, testing and targeted remediation were developed with ChatGPT/WAG tooling. Kiro CLI also performed scoped read-only reviews. **Do not attribute all source code to Kiro.**
- The public Git history and milestone documents are the authority for actual authorship and release state.

## Release, security and submission

Production M5L currently serves merge SHA `b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e`; its GitHub workflow was verified separately, with public browser/API post-deploy acceptance. `docs/M5K_PRODUCTION_RELEASE_20261104.md` documents the prior M5K release and limitations; M6C Alibi Room is local-only until reviewed and deployed.

The app is not a security certification or an independent semantic code auditor. `SUPPORTED` means **Git path alignment**, not that tests passed or code works.

Judge resources: `docs/JUDGE_QUICKSTART.md`, `docs/JUDGE_VIDEO_STORYBOARD_20261104.md` and `docs/DEVPOST_SUBMISSION_DRAFT_20261104.md`. The final YouTube demo and confirmed Devpost submission are **not yet complete**.
