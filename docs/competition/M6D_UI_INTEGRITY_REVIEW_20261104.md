# M6D — Scoped adversarial browser integrity review (2026-11-04)

## Scope and authority

Repository: `ShenJun93/specter-audit`. Draft PR: #3.
Previously pushed candidate `eb9d200b1ac8e5f25edb0ca73610896ebb6be9ef`.

This review focuses narrowly on `web/alibi.js`, the static `web/alibi-cases.json`
contract and `test/alibi-ui.test.mjs`. It is a ChatGPT/WAG-assisted adversarial
regression exercise, **not** a comprehensive independent security audit,
cryptographic attestation, semantic bug-fix verification or Kiro-authored work.

## Confirmed findings and regressions

Three contradictory tampering scenarios were accepted by the original browser
validator. All three were reproduced as failing tests **before** remediation:

1. **CI after claim.** A hypothetically observed claim could precede the
   recorded exact-SHA CI completion, yet the UI would still show a positive
   provider verdict. The validator now rejects a `PROVIDER_REPORTED_PASS`
   exhibit if the exact-SHA CI `updatedAt` is later than the observed claim
   timestamp. This is conservative, not proof of actual test completion time.
2. **Timeline omissions/replays.** The UI could omit a supplied CI run event
   or duplicate its event while still displaying the result. It now requires
   precisely one linked timeline CI event for each check record, with matching
   SHA, source link, provenance and timestamp. Claim and commit events must
   also agree with the supplied case.
3. **Selected record mismatch.** The displayed `selectedRun` could differ
   in timestamp from the corresponding input CI check. It now compares
   selected and source record fields, with **timestamp instants**, not exact
   timestamp string bytes. GitHub API `...Z` and engine-normalized
   `...000Z` represent the same instant and are correctly accepted.

Also reject ambiguous repeated Git commit IDs in the browser's graph.
The case payload and ancestry metadata remain unsigned and must not be
described as independently authenticated evidence.

## Reproduction and verification

- Before remediation: 3 newly introduced adversarial regression cases failed
  because the old validator accepted contradictory evidence.
- After remediation: `node --test test/alibi-ui.test.mjs` **15/15 PASS**,
  including a new test reading the exact checked-in `alibi-cases.json`.
- Local actual Chrome headless on desktop and mobile390: three reveal cases
  PASS, no overflow, zero external requests, zero console errors.
- `npm run check`: PASS.
- `node --test` against core alibi/evaluator tests: 67/67 PASS.
- The full local suite was started but the remote command runner timed out
  before completion; **do not claim a full post-remediation suite PASS**.
  Require GitHub Actions on the **new, pushed remediation SHA** before
  PR readiness or merge.

## Prior pushed Preview (before remediation)

- Source: `eb9d200`, exact GitHub Actions run `41759793341`,
  `completed/success` for the original 185-test candidate.
- Vercel deployment: `dpl_7PCxrCW8GMXK7SYesXaJD2vZKjNe`, Preview READY.
- Preview Chrome desktop and mobile390: all three cases PASS, no external
  requests and no console errors.
- HTTP assets CSS/JS/JSON matched checked-in bytes. Vercel appends a
  `vercel.live` feedback Toolbar script after HTML, causing only the
  HTML byte-for-byte comparison to differ; base HTML bytes matched.
  This is **not** a change to the repository's source. The strict
  `script-src 'self'` policy remains in place.
- This Preview has **not** been updated to include the review fixes above.

## Remaining gates

- Push the additional review fix commit; verify GitHub CI on its exact SHA.
- Create a fresh Vercel Preview pinned to the new commit; redo browser QA.
- Do not merge or change production until source/preview acceptance passes.
- Competition value gaps persist: no independent real agent transcript in
  the exhibits; the M6 engine/UI are ChatGPT/WAG-assisted because Kiro CLI
  implementation sessions timed out without authoring these files. Authentic,
  material Kiro-authored work is required before representing this as a
  strong Kiro hackathon entry.
