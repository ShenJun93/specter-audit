# M9B preflight — safe hook context output (2026-11-08)

**Disposition: SYNTHETIC HARNESS HARDENING PASS / KIRO NATIVE STILL BLOCKED.**

## Scope
- Branch: `test/m9b-safe-hook-output`, based on `8fcb11fac0c925615f7181712b6d13ee65d4ccbd`.
- Changes only to `scripts/kiro-v3-hook-preflight.mjs`, `test/kiro-v3-hook-preflight.test.mjs`, and documentation.
- ChatGPT/WAG authored this **test harness change**, not a Kiro hook or handler. There is **no new file under `.kiro/hooks/`**, no Kiro request, no quota consumption by this hardening, and no production/Devpost change.

## Finding: prefix acceptance permits untrusted output

Kiro's documented command Hook forwards successful stdout to the agent as context. Previously this harness checked whether the stdout `included` the phrase `SPECTER SOURCE CHANGE:` on an allowed source save and did **not** require empty stdout/stderr on non-source events. A misbehaving or adversarial candidate handler could append instructions after a harmless warning or inject unrecognized context via stderr, while the synthetic preflight reported `SYNTHETIC_CONTRACT_PASS_ONLY`.

This was a **test-harness false acceptance risk**, not a demonstrated vulnerability in a real installed hook. No actual Hook was installed or executed by Kiro.

## Remediation

- **Allowed source event:** only a single fixed warning from the M9B design spec, with optional surrounding whitespace. No extra lines, ANSI color sequences, instructions or stderr.
- **Ignored/invalid event:** no stdout and no stderr. A warning on an ignored file remains `FALSE_SOURCE_WARNING`.
- **All unexpected context:** fail closed as `UNEXPECTED_HOOK_OUTPUT`. Missing warning remains `EXPECTED_SOURCE_WARNING`; known fabricated verdicts, sensitive output, oversized output, timeouts and nonzero exit remain blocked by the existing checks.
- The accepted text is a **caution** about possible evidence freshness, not `PASS`, `STALE`, release approval or independent attestations. The harness still uses only explicit synthetic event envelopes.

## Tests performed on MAIN-PC

- Test-first regression: new tests detecting extra instructions and stderr returned **2 red** on the original preflight, with 11 passing tests.
- After hardening and synchronizing the approved warning to the exact M9B spec: **13/13 tests PASS**, 0 fail, 0 skipped, including the 18-scenario mock handler exercise, injected warnings, ANSI contamination, silent-event output, stderr contamination and missing warning.
- `node --check scripts/kiro-v3-hook-preflight.mjs`: PASS.
- `npm run check`: PASS (includes static-live-web check).
- **Full `node --test` was attempted but did not finish** within the WAG foreground execution window (approximately 12 seconds); its result is UNKNOWN, not PASS. A full suite run via a durable verification mechanism remains a separate gate.

## Residual gates

1. The synthetic `file_path` event and case matrix do **not** validate the actual Kiro V3 STDIN keys, matcher semantics or on-agent event behavior. Only a real PostFileSave run can establish those.
2. This is output-content hardening, **not** a network/file-system sandbox; the harness itself explicitly reports `networkIsolationVerified:false` and `noFilesystemMutationVerified:false`.
3. A real Kiro-native handler should be authored by Kiro in a fresh, isolated workspace after usable credits are verified. It must then pass the synthetic harness, a real trigger, rollback, privacy and fresh test/edit/retest evidence. Hook installation requires separate owner approval of the exact JSON.
4. Last CLI usage probe returned `ServiceQuotaExceededException / MONTHLY_REQUEST_COUNT`; an email grant alone does not prove redemption. Do not retry paid prompts without owner confirmation.
5. This experiment is based on an older M9B/M10 branch. Do **not** merge or promote it directly over the newer M16 Preview branch.

**Release status: HOLD.**
