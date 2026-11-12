# M118 — Specter Arena + Gate: evidence-driven vertical slice

Status: development candidate, not the submitted Kiroween release. Attribution: ChatGPT/WAG unless an authentic Kiro session establishes additional Kiro-authored work.

## Product decision
Two reviews agree that a stronger claim requires external practical evidence rather than more dashboards: the existing Kiro auditor, PR proof chain, and signed CI receipt are reused, not recreated. Goal: one non-Specter PR, reviewer-approved behavior, isolated base/head runs, and one shared report consumed by Gate and Arena.

## Data flow and trust
1. Canonical public PR URL is inspected using the existing bounded GitHub REST client; read the base SHA and recheck head after the run. Any head drift invalidates prior observations.
2. Reviewer approves an exact behavior test stored outside both checkouts, including SHA-256, expected behavior, and purpose.
3. Runner materializes exact immutable base/head trees without executing their code on the host. Run the same test in separate Docker containers under non-root UID, without network/secrets, with read-only root/mounts, limited CPU/memory/pids and bounded output/time.
4. A versioned case file records provider-reported SHA/CI, observed local test output and independent provenance boundaries.
5. CLI/PR commentary and Arena UI render this same JSON, never manually synchronized verdict strings.

Trust categories: OBSERVED_LOCAL (bounded runner output, not attested), PROVIDER_REPORTED (public GitHub REST), SELF_RECORDED (editable Kiro transcript), ATTESTED (only externally verified signature+subject), INFERRED (case finding), UNKNOWN (missing/contradictory/stale evidence). Never infer correctness from green CI or a saved editable SHA.

## Security
Do not run arbitrary npm scripts or untrusted code on Windows/public web servers. No dependency install, outbound network, secrets, or host Docker socket mounts. Docker is containment but not a security certification. Exercise the first live case in an owner-controlled disposable public Node.js repository; use stronger ephemeral VM isolation for hostile third-party repositories. Fail closed if any safety condition is missing. Do not activate hooks or claim Kiro authored work without an authentic native-session receipt.

## Milestone gates
A: pure evidence report + adversarial tests.
B: reviewer-approved Docker behavior challenge and exact HEAD validation, proven on one non-Specter public PR.
C: one interactive Arena case file plus readable PR summary from identical JSON, verified on phone/desktop.
D: optionally real Kiro CLI V3 PostToolUse advisory hook with observable proof; PR check only with opt-in.
E: one canonical release/video/Devpost story after owner approval; existing M75 submission stays untouched until then.

Critical failure states: force push, absent/mismatched SHA, wrong CI workflow, canceled/zero-test runs, malformed/retracted claim, stale test, both-fail or unexecutable test, Docker absent, incomplete telemetry. Unknown stays UNKNOWN, never SUPPORTED.
