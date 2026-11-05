# M9 Design — Event-only Kiro Freshness Witness
## Authority and interfaces
Use the Kiro 3.0 standalone Hook format documented at https://kiro.dev/docs/cli/v3/hooks-migration/ and https://kiro.dev/docs/hooks/.
The Hook receives a JSON event on stdin (expected keys hook_event_name, session_id, tool_name, tool_input, tool_response). Real runtime envelope MUST be observed before claiming compatibility. Unsupported schema fields => insufficient.

Suggested Kiro-owned file set:
1. src/freshness-witness.mjs — pure, deterministic reducer; no filesystem or network.
2. scripts/kiro-freshness-witness-hook.mjs — bounded stdin reader, local metadata-only state machine, exact safe stdout.
3. .kiro/hooks/freshness-witness.json — v1 standalone PostToolUse Hook; fixed literal action command.
4. test/freshness-witness.kiro.test.mjs — Kiro-authored adversarial and integration tests.
ChatGPT/WAG-authored external contract checks live in test/freshness-witness.contract.test.mjs.

## API contract for independent review
- export function createInitialWitnessState(): state
- export function reduceWitnessEvent(state, event): {state, advice}
- export function summarizeWitness(state): {code, message, independentAttestation:false, semanticCorrectnessVerified:false}

state is plain serializable JSON, at most 4 KiB, contains NO user-originated strings, paths or timestamps. Replay hardening may retain up to 16 SHA-256 digests of explicit tool_use_id/tool_call_id values; never the raw identifiers. Duplicate IDs inside the bounded window fail closed; ID-less and older evicted events cannot be independently deduplicated. Fixed schema SPECTER_FRESHNESS_WITNESS_V1, bounded integer eventCount, testCount, editCount and lastPassOrder / lastEditOrder or null. The advice object contains only known codes and constant literal English messages. The module never mutates the input state.

## Safe classification
- A successful source mutation matches a known explicit file-write tool with tool_response.success true. A failed write or malformed result => INSUFFICIENT, since partial mutation cannot be excluded.
- A recognized test receipt requires an isolated npm test or node --test command, explicit pass/fail/exit counts in the matching tool response, plus tool_response.success true. Never execute command text.
- A passing receipt observed after the last write yields PASS_RECEIPT_OBSERVED; a later successful write yields RETEST_REQUIRED; unknown shell commands mark INSUFFICIENT.
- Treat supported read-only file reads as no-op. Unrecognized tool types must be treated as uncertain when their effects cannot be ruled out.
- No event is grounds for promoting the project's M7 verdict CURRENT. Hook completion order is not a source snapshot proof.
- A repeated identified tool result after a source write must not erase RETEST_REQUIRED. Track a bounded rolling digest set for explicit tool IDs and fail closed on collisions/ambiguous IDs.

## Persistence and concurrency
The CLI wrapper processes bounded stdin to completion, validates session_id format/length, derives SHA-256 digest of it, and stores only safe metadata under an OS-temp user-private directory. Never log the digest or raw session ID. A lock or atomic compare-and-swap is required to prevent concurrent update-loss. If locking fails, print fixed INSUFFICIENT and exit without persisting claims. No file paths from tool inputs are used as filesystem paths. Use temp state TTL or SessionEnd cleanup; corrupted state => fail closed. Tests must simulate contested lock and invalid state. Never call source tests automatically.

## True-Kiro provenance gate
Run a FRESH Kiro CLI V3 session, inspect real tool-call IDs and successful Kiro writes to the files above, then trigger the installed Hook on a bounded test-and-edit sequence. Save only an ignored private receipt and sanitized, reproducible evidence in competition docs. A prepared prompt, static code produced by another agent, or synthetic Hook tests DO NOT establish Kiro authorship.

## Reviewer gate
- External contract tests PASS and Kiro's own adversarial tests PASS.
- CLI subprocess tests PASS with temp-dir isolation and zero network.
- Fresh Kiro session demonstrably triggers Hook and emits a bounded RETEST_REQUIRED warning after a successful source edit following an observed PASS.
- No unsupported "green" behavior and no altered M7/M8 baseline verdicts.
- Genuinely Kiro-authored source and tests tracked, independently reviewed, and committed only after verification.
