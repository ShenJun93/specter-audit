# Specter Audit

**The agent said "done." What does Git say?**

Specter Audit is a local-first, read-only Git metadata investigator for AI coding-agent completion claims. It turns a confident assertion into an explainable, bounded evidence verdict: **UNVERIFIED**, **PARTIAL** or **SUPPORTED**. *Alignment is not code correctness.*

**Kiroween 2026** — proposed category: **Costume Contest**.

## Judge entry - filmed M19 and verified main release (2026-11-11)

**Start with the [public M19 judge Preview](https://specter-audit-bc84gljaz-nvhoa1691993-6852s-projects.vercel.app/)** (the filmed application, not the older stable production). Follow **JUDGE FAST PATH — Investigate the Midnight Rewrite**, then **Expose the alibi**. A saved, redacted genuine Kiro CLI session records 120 passing tests, an agent success claim and five subsequent successful source edits without a later test observed in that same record. The bounded verdict is `STALE_LOCAL_TEST_EVIDENCE`, not a claim that the code is broken or that no other tests ran.

- **Public [V5D judge video](https://youtu.be/kQKkw7Dkp-M)** — filmed against application source [`09952ed7e2728cdc030051ee14c66e61d0953d98`](https://github.com/ShenJun93/specter-audit/commit/09952ed7e2728cdc030051ee14c66e61d0953d98).

- **[Corrected M75 Preview](https://specter-audit-2v5dynndc-nvhoa1691993-6852s-projects.vercel.app/)** - reviewed, source-matched runtime `0ce4565bf608ff497b913d76d930250861a73de1` with M68-M70 parser fixes and passing browser acceptance. It was not rebuilt from current `main`; the final main merge preserves the complete reviewed M19 Git tree. The filmed Preview and video remain tied to `09952ed7e2728cdc030051ee14c66e61d0953d98`.
- **[Devpost project](https://devpost.com/software/specter-audit-trust-the-evidence)** - public but **not formally submitted** as last verified 2026-11-11; its writeup still needs an approved correction for the main release.
- **[Released default main](https://github.com/ShenJun93/specter-audit/commit/13192ce2719aaabfda1aa1ca6148d33b741a2cb1)** - source at `13192ce2719aaabfda1aa1ca6148d33b741a2cb1` contains the filmed app plus reviewed parser fixes and PR #12 documentation. The previous [M19 branch](https://github.com/ShenJun93/specter-audit/tree/feat/m19-judge-first-run) is historical; `09952ed7e2728cdc030051ee14c66e61d0953d98` remains the immutable filmed SHA.
- **[Exact-SHA GitHub Actions push run](https://github.com/ShenJun93/specter-audit/actions/runs/42451296583)** — Node verification and CI-receipt attestation succeeded for filmed SHA; the signed receipt is evidence of the CI artifact's origin, **not** cryptographic authentication of Kiro logs or semantic code correctness.
- **[M19 release PR #10](https://github.com/ShenJun93/specter-audit/pull/10)** - **MERGED into `main` on 2026-11-11**. The separately hosted stable production at https://specter-audit.vercel.app is still the older M5L app; there was **no production deployment** during GitHub merge.

Reproduce **exactly the filmed application commit** using Node.js 24+ and Git:

```sh
git clone https://github.com/ShenJun93/specter-audit.git
cd specter-audit
git checkout --detach 09952ed7e2728cdc030051ee14c66e61d0953d98
npm run check
node --test
npm run demo
```

The exact filmed SHA `09952ed7e2728cdc030051ee14c66e61d0953d98` passed **524/524** tests ([filmed CI](https://github.com/ShenJun93/specter-audit/actions/runs/42451296583)). The reviewed final [`main` merge `13192ce2719aaabfda1aa1ca6148d33b741a2cb1`](https://github.com/ShenJun93/specter-audit/commit/13192ce2719aaabfda1aa1ca6148d33b741a2cb1) passed **533/533** on [exact-HEAD CI](https://github.com/ShenJun93/specter-audit/actions/runs/42928423759) with a verified signed CI receipt. [M75 Preview](https://specter-audit-2v5dynndc-nvhoa1691993-6852s-projects.vercel.app/) is built from earlier corrected source `0ce4565bf608ff497b913d76d930250861a73de1`, but its served runtime matches the main release code; it is not a new deployment from `main`. CI receipts do not prove semantic correctness or authenticate editable Kiro transcripts. Stable production and Devpost Submit remain separate actions.

**Trust and authorship boundaries:** The local Kiro transcript is genuine but editable and self-recorded; it is not independently tied to a particular PR HEAD. No active Kiro `PostFileSave` hook is claimed. Kiro CLI contributed foundational Git inspection, CI adapter work and the session-staleness engine; ChatGPT/WAG also contributed UI, integration, tests and documentation. `SUPPORTED`/CI green do not certify functional correctness. Optional visitor-selected `messages.jsonl` remains browser-local in the tested experience.

## Historical milestones (not the current judge application)

**M16 Preview:** https://specter-audit-750p0my50-nvhoa1691993-6852s-projects.vercel.app/ (commit `2e6cfe2d4852defa16ccad3d1311cb710b9ffab1`).

**M8.8 Preview:** https://specter-audit-bc2qeacr6-nvhoa1691993-6852s-projects.vercel.app/ (commit `8fc24affba4cfa00ee91b9ed0a65ad5941cdfe24`).

**M18 CI:** [historical successful CI run 42436943389](https://github.com/ShenJun93/specter-audit/actions/runs/42436943389); not the filmed M19 SHA.

The sections below document prior milestones and retain their original verification scopes; they are **not** instructions to evaluate the current M19 submission.

## Historical M8.8 release candidate (2026-11-06)

At the historical M8.8 milestone (2026-11-06), the tested app was [`8fc24af`](https://github.com/ShenJun93/specter-audit/commit/8fc24affba4cfa00ee91b9ed0a65ad5941cdfe24) in [Draft PR #7](https://github.com/ShenJun93/specter-audit/pull/7). At that time, `main` and stable production were on M5L; since then PR #10 merged M19 into `main` (2026-11-11). This older M8.8 candidate is **not** the current judged release.

M8.8 local verification: **335/335 Node tests PASS** and `npm run check` PASS. Exact-application-SHA public Chrome file-picker regression: **80/80 synthetic checks PASS** on desktop and mobile 390 px; 0 observed unexpected analysis uploads. Keyboard navigation was checked on the same Preview. These checks are bounded and **not an independent whole-PR security or accessibility certification**. PR #7 remains Draft and its integrated independent review is still open.

At the M8.8 review milestone, the 116.6-second video candidate had not been published and Devpost still pointed at this historical Preview. **This status is superseded by the M19 video and Preview linked at the top of this document.** M9 hooks remain disabled.

Three proof boundaries matter: a stale test is not proof code is broken; a matching CI PASS is provider-reported, not semantic correctness; and `CURRENT_SELF_RECORDED_TEST` is derived only from an editable saved session, never independent attestation. The Live Investigator parses visitor-selected files only in the browser. Authentic Kiro-authored core work is documented below and separately from ChatGPT/WAG contributions.

## Historical M7 milestone — now integrated into M8.8 Preview

**Originally local-only in M7; also available on the public M8.8 Preview:** start the Node server and open `/live.html` when evaluating locally.
Select a Kiro CLI `messages.jsonl` file (up to 8 MiB, 4,000 lines).
The tab reads and processes the selected file in memory; the browser does
**not** upload it. The privacy-focused output shows tool-observed test
receipts, completion timestamps, sanitized source edit counts, and a bounded
verdict: `CURRENT_SELF_RECORDED_TEST`, `STALE_LOCAL_TEST_EVIDENCE`, or
`INSUFFICIENT_SESSION_EVIDENCE`.

The import parser treats failed or missing tool results, ambiguous agent
claims, unsupported source mutation tools and compound shell commands
conservatively. Unknown evidence is not silently upgraded to a PASS. Only
the selected saved log is analyzed; it can be edited and is not a signed
attestation. The importer cannot guarantee complete capture of all agents,
test tools, mutations, repository versions or tests run outside that file.

**Provenance:** Kiro CLI authored and revised the earlier M6E session
staleness engine. The M7 JSONL parser, website and red-team tests were
implemented by ChatGPT/WAG; a separate Kiro implementation attempt timed
out and did not create this module. Do not attribute M7 parser authorship
to Kiro. See `docs/competition/M7_LOCAL_RELEASE_REVIEW_20261105.md`.

**Historical M8.0 release gate (2026-11-05; superseded by M8.8 above):** [Draft PR #4](https://github.com/ShenJun93/specter-audit/pull/4) at SHA `73068263f5c50c5a1dcb8c50d2747d3ab61f2c20` has a [matching READY Vercel Preview](https://specter-audit-96h1fqej1-nvhoa1691993-6852s-projects.vercel.app/live.html). Browser QA checked six desktop/mobile synthetic verdict flows, asset bytes against source and absence of unexpected click-triggered requests. **Production remains unreleased for M8.** The separate M8.1 UX branch improves discoverability, file-selection help and actionable next-step copying; it requires its own CI/Preview. M9 Hook remains disabled and unverified on actual Kiro V3. See `docs/competition/M8_JUDGE_ENTRY_RELEASE_GATE_20261105.md`.

## Alibi Room v2 — four evidence exhibits (public M8.8 Preview)

**Available now on the M8.8 public Preview:** `/alibi.html`; also available locally from the Node server. The stable production site remains the earlier M5L release. Historical PRs #3 and #4 were staged milestones and must **not** be merged separately; the reviewed integrated candidate is Draft PR #7.

Alibi Room asks two different questions: *Is the cited CI for the correct
commit?* and *Was the recorded test result still current after the agent
continued editing?* Four distinct exhibits illustrate those boundaries:

| Exhibit | Evidence source | Bounded conclusion |
| --- | --- | --- |
| The borrowed alibi | Real GitHub Actions success #41736082288 on ancestor `374af14` used in a hypothetical later-commit claim | `STALE_EVIDENCE` — the **cited artifact** is older; later CI also exists |
| Fresh evidence | Real successful run #41742626694 at exact target `b6e1407` | `PROVIDER_REPORTED_PASS`; never a semantic correctness guarantee |
| The empty dossier | Hypothetical claim with **no CI receipt supplied** | `INSUFFICIENT_EVIDENCE`; not an assertion GitHub lacked CI |
| **The midnight rewrite** | **Authentic recorded Kiro CLI session M5A**, with 120 tests passing, a genuine agent statement and five later successful edits to `src/github-actions-evidence.mjs` | `STALE_LOCAL_TEST_EVIDENCE` for the earlier test report relative to later edits |

The fourth case is selected by default for judges and uses a **separate
schema/validator** from GitHub provider evidence. It displays seven
chronological events and a verdict only after revealing it. No raw session
transcript, private paths, tokens or terminal output are published. An
unsigned local transcript can be edited; its SHA-256 digest is a captured
fingerprint, not signed independent attestation. No tests observed after the
five edits **within this saved Kiro session**; tests elsewhere remain unknown.

The pure `auditLocalSession(input)` in
`src/kiro-session-staleness.mjs` was **authored and revised by Kiro CLI**
in five recorded M6E sessions. ChatGPT/WAG independently supplied adversarial
tests and made six small fixture-assertion changes. The original M6A CI
engine and M6C UI were ChatGPT/WAG-assisted after earlier Kiro attempts timed
out. Do **not** attribute the entire repository to Kiro.

The operator-only `npm run capture:kiro-session` command creates the public
JSON snapshot from a **pre-scrubbed, ignored** local exhibit; it is not a
visitor-facing ingestion API and requires its private input to exist.
Regular visitors fetch only the fixed same-origin `alibi-session-case.json`
asset; the browser makes no Kiro or GitHub API requests.

The original recorded CI run links remain public:
[41736082288](https://github.com/ShenJun93/specter-audit/actions/runs/41736082288) and
[41742626694](https://github.com/ShenJun93/specter-audit/actions/runs/41742626694).

For verified Kiro authorship, source-timeline limits and local checks see
`docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md` and
`docs/competition/M6F_FOUR_CASE_LOCAL_ACCEPTANCE_20261104.md`.

## Historical M5L stable-production walkthrough

The public demo requires no account or installation. It is visibly labeled **SYNTHETIC SNAPSHOT**, because it uses a frozen Git fixture, not a remote inspection of your machine or repositories. Its claim evaluator still runs on every request.

| Claim | Verdict | Interpretation |
| --- | --- | --- |
| `all tests pass` | `UNVERIFIED` | No independently witnessed test execution |
| `updated auth login and all tests pass` | `PARTIAL` | Changed path aligns; test assertion unsupported |
| `updated auth login validation` | `SUPPORTED` | Relevant path changed, but correctness is not proven |

A separate **Public CI evidence** button shows a timestamped record of the fixed GitHub Actions workflow for the **production merge release** (`374af141...`). Hosted visitors never trigger an outbound GitHub API call. The recorded result is provider-reported CI metadata for that *one published commit*, not an attestation and not proof that arbitrary agent claims are true.

**Live production provenance:** M5L has deployed at merge SHA `b6e1407d...`. Its CI panel intentionally displays the separately labeled historical M5K release record (`374af141...`), not CI proof for M5L. The M5L merge CI is [run 41742626694](https://github.com/ShenJun93/specter-audit/actions/runs/41742626694). Alibi Room v2 is available in the M8.8 Preview but not yet in stable production.

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

## Attested CI receipt (M15 candidate)

On a **push** to a branch containing M15, GitHub Actions first runs the syntax checks and deterministic Node tests with read-only repository access, produces a bounded `receipt.json` and `test.tap`, and uploads them as the `specter-ci-evidence` artifact. A **separate job**, with scoped OIDC/attestation permission and no source checkout, can then sign provenance for the exact receipt bytes using GitHub Artifact Attestations.

This feature is not considered verified merely because the workflow file exists. After the remote push workflow completes, obtain its run ID, download the artifact, and verify the report with `gh attestation verify` against the expected repository, signer workflow and **exact push commit SHA**. Compare the report's `sourceCommit` and `tapSha256` to the verified source and downloaded TAP bytes.

The attestation proves where the *report artifact* originated, **not** that a local Kiro session ran on that SHA, that every required check passed, or that the software is correct. Missing, invalid, or nonmatching attestations stay **UNKNOWN**. See [M15 verifier steps](docs/competition/M15_CI_RECEIPT_ATTESTATION_20261107.md).

## Verify

```powershell
npm run check
npm test
```

Tests cover Git inspection, evaluator verdict semantics, synthetic mode, API limits, CI ordering and provenance gates. The CLI and public hosted replay have different trust boundaries.

## Development provenance

- Kiro CLI genuinely implemented initial M1 Git inspection work, and contributed to the early M5A/M5B GitHub Actions adapter.
- Kiro CLI also wrote and revised the M6E local-session staleness auditor. Five new Kiro session records show 18 successful source/test file edits; independent tests verified its bounded behavior. The M6F UI integration is ChatGPT/WAG-assisted.
- Root `.kiro/specs/specter-audit/` and `.kiro/steering/product.md` capture requirements, tasks and strict read-only/evidence semantics.
- Subsequent API/UI, hosted release engineering, security hardening, testing and targeted remediation were developed with ChatGPT/WAG tooling. Kiro CLI also performed scoped read-only reviews. **Do not attribute all source code to Kiro.**
- The public Git history and milestone documents are the authority for actual authorship and release state.

## Release, security and submission

As of 2026-11-11, GitHub `main` is at merged M19 release `13192ce2719aaabfda1aa1ca6148d33b741a2cb1`, while the stable Vercel production https://specter-audit.vercel.app remains the previously deployed M5L application. The filmed M19 video continues to refer to its original immutable Preview. The corrected M75 Preview has matching reviewed runtime bytes, but not the new merge SHA. [Merged PR #10](https://github.com/ShenJun93/specter-audit/pull/10) and `docs/M5K_PRODUCTION_RELEASE_20261104.md` preserve release history.

The app is not a security certification or an independent semantic code auditor. `SUPPORTED` means **Git path alignment**, not that tests passed or code works.

Judge instructions: [M19 Judge Quickstart](docs/JUDGE_QUICKSTART.md); [public V5D demo](https://youtu.be/kQKkw7Dkp-M); [Devpost project](https://devpost.com/software/specter-audit-trust-the-evidence). The video is Public; the formal Kiroween submission remains **pending** as last verified 2026-11-11.
