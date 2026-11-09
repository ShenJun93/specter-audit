# Specter Audit — Trust the Evidence

**The agent said "done." What does the evidence actually support?**

Specter Audit is a Halloween-themed, local-first, **read-only evidence investigator** for AI-assisted software development. It distinguishes passing tests **before** a later source change from tests actually covering the recorded final state, and distinguishes a green GitHub Actions run from one for the **right commit**.

Built for **Kiroween 2026** using genuine Kiro CLI development sessions, Kiro specifications and steering. Registered draft competition category: **Costume Contest**.

## Judge entry — public video and demo

- **[Live M19 judge demo](https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/)** — no login required; this is the deployed app shown in the video.
- **[V5D judge video — YouTube Public](https://youtu.be/kQKkw7Dkp-M)** — about 2 minutes 4 seconds, under the contest's 3-minute limit.
- **[Devpost project page](https://devpost.com/software/specter-audit-trust-the-evidence)** — descriptive project page; **official Kiroween submission is not yet complete**.
- **[Exact filmed M19 source](https://github.com/ShenJun93/specter-audit/tree/feat/m19-judge-first-run)** — commit 09952ed7e2728cdc030051ee14c66e61d0953d98, not the earlier default main release.

## Try the judge demo in 90 seconds

**[Open the verified M19 judge demo](https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/)** — public browser demo, no credentials or file uploads.

1. Select **JUDGE FAST PATH — RECORDED KIRO EVIDENCE** and open *The Midnight Rewrite* (case 04).
2. Click **Expose the alibi**: the saved Kiro session contains 120 passing tests, an agent completion statement and **five subsequent source edits**, with **no later passing test observed in that saved session**. Verdict: `STALE_LOCAL_TEST_EVIDENCE`.
3. Explore *Wrong-commit CI*, *matching-commit CI* and *UNKNOWN*. A green provider result for the wrong revision cannot certify the revision under review.
4. Open **PR proof chain** and deliberately click **Inspect this PR**. Specter then fetches public PR/workflow metadata. It makes **no GitHub API request before that click**. A reported provider run is *not* proof that all required checks are certified.

**Other views:** [The Midnight Rewrite](https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/alibi.html#case-room) · [PR Proof Chain](https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/pr-proof.html) · [Your session — browser-local importer](https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/live.html).

The **Your session** view optionally analyzes a user-selected Kiro `messages.jsonl` locally in the browser; it does not send the file to Specter servers. The record is editable and may be incomplete, so its conclusions are bounded to **that saved session**, not cryptographic provenance.

## Three evidence boundaries that matter

| Evidence | What Specter can say | What it cannot say |
| --- | --- | --- |
| Recorded test PASS followed by source edits | Earlier PASS may not cover the later recorded state | That the final code is broken or never tested elsewhere |
| Exact-SHA GitHub Actions run | GitHub reports a workflow result for that commit | That arbitrary agent claims, local sessions, or code correctness were independently certified |
| Incomplete or conflicting record | `INSUFFICIENT_SESSION_EVIDENCE` / UNKNOWN | An invented green check or a confident verdict without support |

The app does not execute arbitrary shell commands or tests for visitors. Local Git inspection is intentionally read-only and bounded.

## How Kiro was actually used

- **Kiro CLI** authored the original Git inspection work and contributed to the GitHub Actions evidence adapter.
- In authentic recorded Kiro sessions, an agent reported 120 passing tests and later changed code. Specter uses that **redacted self-recorded chronology** as a real demonstration of the stale-test problem, not as a signed attestation.
- **Kiro CLI** also authored and revised the session-staleness analyzer (`src/kiro-session-staleness.mjs`); adversarial regressions and broader integration were independently reviewed.
- The public root [`.kiro/specs/`](.kiro/specs/) and [`.kiro/steering/`](.kiro/steering/) preserve requirements, workflow and explicit trust boundaries.
- **ChatGPT/WAG** contributed parts of the frontend, integration, red-team cases, browser verification, CI/release engineering and documentation. **Not all code was Kiro-authored.**

The shipped M19 demo does **not** have an installed, active `PostFileSave` warning hook or independently signed Kiro session logs. See [Kiro development evidence](https://github.com/ShenJun93/specter-audit/blob/feat/m19-judge-first-run/docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md) for the authoring split and technical limits.

## Reproduce and verify

The exact version filmed for judges is **M19**, commit `09952ed7e2728cdc030051ee14c66e61d0953d98`.

Prerequisites for local use: **Node.js 24+ and Git**. Zero runtime npm dependencies.

```bash
git clone --branch feat/m19-judge-first-run --single-branch https://github.com/ShenJun93/specter-audit.git
cd specter-audit
npm test
npm run check
npm run demo
```

`npm run demo` launches a local loopback Git-inspection demonstration. The public judge story uses the linked browser Preview above; these are distinct entry points.

**Verification:** [M19 GitHub Actions run](https://github.com/ShenJun93/specter-audit/actions/runs/42451296583) reports **524 passing tests** for the exact filmed source SHA. Its signed CI artifact attests the **origin of the CI receipt**, not Kiro-transcript integrity or semantic code correctness.

More detail: [Judge Quickstart](https://github.com/ShenJun93/specter-audit/blob/feat/m19-judge-first-run/docs/JUDGE_QUICKSTART.md) · [M19 browser acceptance](https://github.com/ShenJun93/specter-audit/blob/feat/m19-judge-first-run/docs/competition/M19_JUDGE_FIRST_RUN_LOCAL_ACCEPTANCE_20261108.md) · [M6E real Kiro evidence](https://github.com/ShenJun93/specter-audit/blob/feat/m19-judge-first-run/docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md). Older milestone notes remain in [docs/competition](https://github.com/ShenJun93/specter-audit/tree/feat/m19-judge-first-run/docs/competition).

## Public release boundary (November 2026)

| Surface | What it actually contains |
| --- | --- |
| [M19 verified Preview](https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/) | The **working judge version** filmed in the video |
| [`feat/m19-judge-first-run`](https://github.com/ShenJun93/specter-audit/tree/feat/m19-judge-first-run) | Exact filmed source |
| [`fix/m25-m19-release-hygiene`](https://github.com/ShenJun93/specter-audit/tree/fix/m25-m19-release-hygiene) | Same runtime as M19 plus judge-documentation updates |
| GitHub default `main` and [stable production](https://specter-audit.vercel.app/) | **Earlier M5L version**, not the linked M19 judge demo |

The public Preview is not claimed to be stable production. Do not assume an old `main` checkout or production URL reproduces the filmed M19 features. Historical draft PR states and CI statuses can change.

**License:** [MIT](LICENSE). Public source, root `.kiro/`, local-first read-only implementation. Public video and Devpost project links above do not mean the official Kiroween submission has been filed or stable production has been promoted.
