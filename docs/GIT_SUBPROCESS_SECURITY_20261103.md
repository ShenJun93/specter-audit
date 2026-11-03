# Specter Audit — Git subprocess hardening review (2026-11-03)

## Finding

A Git repository may define `core.fsmonitor` as an external hook command. `git status` can invoke that command while consulting index metadata. Git may also support external diff helpers or textconv through attributes/configuration. Using Node `execFile` with `shell:false` prevents argument interpolation into a shell, but it does **not** by itself prevent Git from dispatching repository-configured helpers.

Official sources:

- https://git-scm.com/docs/git-config (core.fsmonitor)
- https://git-scm.com/docs/git-status (FSMonitor)
- https://git-scm.com/docs/diff-options (--no-ext-diff / --no-textconv)

## Mitigation

`src/git-inspector.mjs` now applies these overrides to every inspected Git invocation:

- `-c core.fsmonitor=false` to prevent invoking repo-selected FSMonitor hooks;
- `-c core.untrackedCache=false` to avoid relying on cached filesystem claims;
- `-c diff.external=` and `GIT_EXTERNAL_DIFF=''` to suppress external diff helpers;
- Git diff uses `--no-ext-diff --no-textconv`;
- Existing `GIT_OPTIONAL_LOCKS=0`, `GIT_TERMINAL_PROMPT=0`, bounded output and timeout remain.

These mitigate the specific Git subprocess configuration risks. They are **not** an OS-level sandbox or a security certification. The local operator explicitly chooses the inspected repository, and adversarial Git/version/platform combinations may need additional review.

## Verification

- `npm run check`: PASS
- `npm test`: 84 tests, 84 pass, 0 fail
- Two disposable Git fixture regressions:
  1. Repository-configured `core.fsmonitor` points at a harmless marker script; marker must not be created.
  2. Repository-configured `diff.external` points at a harmless marker script; marker must not be created.
- `git diff --check`: PASS
- Source changes scoped to `src/git-inspector.mjs` and `test/git-inspector.test.mjs`.

## Development provenance

This change was authored and independently verified using ChatGPT-assisted editing on the MAIN-PC. It was **not** authored by Kiro. The separate `docs/NEXT_KIRO_MILESTONE.md` remains the handoff for genuine Kiro-assisted development.

## Release validation required

Commit and push the patch, confirm GitHub Actions CI passes on the patch commit, confirm Vercel deployment status, and verify local + hosted production behavior. Provider CI evidence is still not implemented.
