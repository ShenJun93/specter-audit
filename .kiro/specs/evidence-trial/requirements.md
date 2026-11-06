# M10 — Evidence Trial (experimental PR review cockpit)

Status: implemented local candidate on `feat/m10-evidence-trial`; author: ChatGPT/WAG, NOT Kiro CLI. This spec is not proof of Kiro implementation.

## User job
Given a public GitHub pull request and a saved Kiro CLI session, a reviewer must determine what the two independent sources actually establish, why they cannot be assumed to refer to the same commit, and what to verify next.

## Acceptance
- One meaningful page under `/pr-proof.html`; accessible on desktop and mobile; three labeled exhibits: local Kiro chronology, public Actions observations, missing link.
- Public PR inspected only by explicit click. The selected local Kiro JSONL is parsed only after explicit local Analyze and does not enter any network request or browser persistence.
- Use the existing pure M8.8 parser and auditor; no new regex/evidence inference. Synthetic stale and retest scenes must use real parser, with obvious "synthetic" labels.
- A stale local receipt + green GitHub workflow remains `RELEASE_EVIDENCE_INCOMPLETE`; a CURRENT self-recorded receipt + green provider workflows also remains incomplete.
- Never infer a session-to-commit binding, required CI status, correctness, Kiro implementation or release approval.
- Export only normalized counts, validated public HEAD and static caveats; never source paths, prompts, commands, session IDs, raw lines or local filenames.
- Keyboard focus and readable mobile layout, correct source labels, no horizontal overflow or runtime/console error. Preserve source-restricted CSP of Live Investigator.
- Full unit suite and actual Chrome pass at identical local application source. Not a whole-release/security certification.

## Non-goals
- Automatic Kiro hook (M9B remains blocked by quota), cryptographic attestation, GitHub authentication, private repos, branch protection evaluator, new CI provider, server-side log storage or upload, production deployment.
