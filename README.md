# Specter Audit

**The agent said "done." What does Git say?**

Specter Audit is a local-first, read-only Git metadata investigator for AI coding-agent completion claims. It turns a confident assertion into an explainable, bounded evidence verdict: **UNVERIFIED**, **PARTIAL** or **SUPPORTED**. *Alignment is not code correctness.*

**Kiroween 2026** — proposed category: **Costume Contest**.

**Live judge demo:** https://specter-audit.vercel.app

**Public repository:** https://github.com/ShenJun93/specter-audit

## M7 — Analyze your own Kiro session (draft PR #4; production unreleased)

**New local-only user flow:** start the Node server and open `/live.html`.
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

**Release gate (2026-11-05):** M7 is committed as `937da7876bf7766e85e77b94e540843e11151294` in [draft PR #4](https://github.com/ShenJun93/specter-audit/pull/4), stacked on still-open PR #3. Exact-SHA GitHub Actions completed successfully with 296 passing Node tests. The no-Toolbar Vercel Preview and its Chrome acceptance were verified only for the **previous** SHA `0e5a22b`; a current-SHA Preview and production release remain **unverified/unreleased**. Never describe the prior Preview as validating the new Judge Journey.

## Alibi Room v2 — four evidence exhibits (M6F local candidate)

**Unreleased candidate:** `/alibi.html` on the local Node server. The current
public Vercel production site remains the earlier M5L release. The branch
`feat/agent-alibi-v2` contains M6D–M6F in **Ready for review PR #3**
at SHA `156efb1fb0a5f771af9d39f66aae626432a142a4`, with exact-SHA
Preview acceptance. M7 is committed in a separate draft PR #4; it has not been deployed to production.

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
- Kiro CLI also wrote and revised the M6E local-session staleness auditor. Five new Kiro session records show 18 successful source/test file edits; independent tests verified its bounded behavior. The M6F UI integration is ChatGPT/WAG-assisted.
- Root `.kiro/specs/specter-audit/` and `.kiro/steering/product.md` capture requirements, tasks and strict read-only/evidence semantics.
- Subsequent API/UI, hosted release engineering, security hardening, testing and targeted remediation were developed with ChatGPT/WAG tooling. Kiro CLI also performed scoped read-only reviews. **Do not attribute all source code to Kiro.**
- The public Git history and milestone documents are the authority for actual authorship and release state.

## Release, security and submission

Production M5L currently serves merge SHA `b6e1407d1218e4ff4b44cb2dd3cae1388a5f533e`; its GitHub workflow was verified separately, with public browser/API post-deploy acceptance. `docs/M5K_PRODUCTION_RELEASE_20261104.md` documents the prior M5K release and limitations; M6F four-case Alibi Room is local-only until reviewed, committed, CI-verified and deployed.

The app is not a security certification or an independent semantic code auditor. `SUPPORTED` means **Git path alignment**, not that tests passed or code works.

Judge resources: `docs/JUDGE_QUICKSTART.md`, `docs/JUDGE_VIDEO_STORYBOARD_20261104.md` and `docs/DEVPOST_SUBMISSION_DRAFT_20261104.md`. The final YouTube demo and confirmed Devpost submission are **not yet complete**.
