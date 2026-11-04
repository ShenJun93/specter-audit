# M6F — Four-case Alibi Room local acceptance (2026-11-04)

**State:** LOCAL VERIFIED candidate on `feat/agent-alibi-v2`; source HEAD remains
`eb9d200b1ac8e5f25edb0ca73610896ebb6be9ef`. M6D–M6F modifications are
uncommitted and not deployed. Existing Draft PR #3 and production M5L remain
unchanged.

## Product advancement

The investigation now has **four distinct recorded exhibits** instead of
three. The first three are hypothetical claims using real GitHub Actions CI
records; the **fourth is a real historical Kiro CLI session**. Case 04 is
selected by default when its static evidence passes validation, so judges
see genuine agent development evidence immediately after entering the room.

Case 04 **The midnight rewrite** is intentionally separate from GitHub CI:
- Original, locally recorded Kiro statement at
  `2026-11-03T13:42:53.083Z`: `All 120 tests pass, 0 fail.`
- Its earlier `execute_pwsh` test output recorded `pass 120`,
  `fail 0` and `Exit Code: 0` at `13:42:38.312Z`.
- Kiro successfully edited `src/github-actions-evidence.mjs` five times
  during `15:06:27.965–15:07:21.514Z`.
- No newer test run after those edits was found **within that saved session**.
  Later results elsewhere were not checked and are unknown.
- Kiro-authored `auditLocalSession` computes
  `STALE_LOCAL_TEST_EVIDENCE` for the earlier report *relative to later edits*.
  No bug, corrected code, universal test absence or independent attestation
  is claimed.

## Trust architecture

- `scripts/capture-kiro-session-exhibit.mjs` is an **operator-only**
  explicit `--capture` script. It reads a previously scrubbed ignored JSON
  source, **not** the raw Kiro session logs, validates fixed identity and
  timestamps, and calls the Kiro-authored auditor before emitting
  `web/alibi-session-case.json`.
- The browser reads fixed same-origin `/alibi-session-case.json`. It is
  served only from a fixed local HTTP allowlist and from the static Vercel
  output. Browser clients cannot initiate local CLI execution or query Kiro.
- `web/alibi.js` has a **separate strict validator** for this exhibit.
  Hard-pinned trace fingerprint, original claim/test values, edit chronology,
  self-reported scope and bounded verdict must agree. No arbitrary link is
  rendered for the private Kiro transcript. All UI text uses
  `textContent` rather than `innerHTML`.
- An absent or invalid local exhibit **disables only case 04**; the three
  independently validated GitHub cases remain available. The local session
  case does not masquerade as a GitHub workflow.
- The captured raw trace SHA-256 is an unsigned local fingerprint, **not**
  cryptographic proof of genuine origin. The raw session, prompts, private
  paths and tool output remain outside Git.

## Verification

- `node --test test/alibi-session-ui.test.mjs`: **11/11 PASS**:
  fake run counts/exits, forged timestamp, reordering/adding/removing source
  edits, source path substitution, altered fingerprint, overstated attestation,
  malicious extra field and fake GitHub URLs fail closed.
- `node --test test/alibi-page.test.mjs test/alibi-session-ui.test.mjs test/alibi-ui.test.mjs`:
  **32/32 PASS** at the M6F integration milestone.
- Real **Chrome headless desktop and mobile390** on local loopback:
  four cases selectable; Kiro exhibit has seven chronology events, contains
  no GitHub CI link, reveal shows `STALE LOCAL TEST EVIDENCE` with the
  local trust caveat; the original three CI verdicts and exact source links
  remain working. Zero console errors, zero external browser requests,
  zero horizontal overflow. Screenshots/receipt are saved in ignored QA.
- Visual inspection of the actual desktop and 390px screenshots:
  four distinct selectable cases, highlighted Kiro exhibit, readable proof
  labels, timeline and mobile layout.
- Full repository Node test suite **237 PASS, 0 FAIL** after M6F integration.
- `npm run check` and `git diff --check`: PASS.
- Operator-only recapture reproduced the exact same published JSON SHA-256
  `1049ee4fdfc3fbbd891171af187042247614f838c1e73ff3ee9d6319c8995b73`.
- Official 2026 Devpost FAQ prerequisites checked locally: root `.kiro/`
  tracked and `LICENSE` (MIT) tracked. Public GitHub license detection
  and final video/submission still need release-time confirmation.

## Release boundary

DO NOT claim the public Vercel deployment currently contains M6F. PR #3
still points to the previous `eb9d200` release candidate. WAG's
`GIT_COMMIT` gateway has returned `KILL_SWITCH_ENGAGED` despite its
discovery metadata claiming `CLEAR`. No alternative commit channel was
used to evade that policy. Owner-authorized commit/push, exact-SHA GitHub
Actions, fresh Vercel Preview, review, production approval and a truthful
under-three-minute judge video remain required.

See `docs/competition/M6E_KIRO_REAL_SESSION_EVIDENCE_20261104.md`
for independent Kiro authorship evidence and its limitations.
