# M204 — Arena review-note export (bounded Kiro implementation brief)
Provenance: specification authored by ChatGPT/WAG on 2026-11-15; Kiro may implement against it.
Scope: edit only `web/arena.html`, `web/arena.js`, `web/arena.css`, and new `test/arena-review-note.test.mjs`. No deployment.
Problem: Node CLI already creates bounded Markdown via `scripts/arena-case-cli.mjs:renderArenaMarkdown`, but browser Arena offers no user-initiated export.

Requirements:
1. Add keyboard-accessible "Copy scoped review note" button by **Next Action** with adjacent aria-live status. Disabled unless currently loaded report is valid.
2. On explicit user click, construct deterministic Markdown **review draft** from validated report: public PR URL or UNVERIFIED, base/head exact SHA, classification, test SHA-256 if available, scope of evidence, next verification action and explicit "NOT ATTESTED / NOT MERGE APPROVAL". Label bundled synthetic owner-controlled fixture vs unverified user-imported JSON.
3. Only use clipboard.writeText after click. Failure/missing permissions -> truthful error, not success. No auto-post, upload or PR mutation.
4. No innerHTML. Escape newlines and Markdown metacharacters of imported free text to prevent spoofed links/headings and approvals. Never echo raw logs.
5. Clear stale copy state on reload, import and error; maintain existing focus/navigation.
6. Add automated regression tests for all above (fixture, unknown, imported, injection, rejected/missing clipboard, no unexpected calls).
7. Node24, no additional packages. Test execution may require separate WAG verification.
## M204 implementation provenance (2026-11-15)
- Kiro CLI 3.3.0 was present on MAIN-PC. A bounded noninteractive implementation invocation was attempted in an isolated worktree.
- WAG rejected the command before execution: `Invalid verify profile argv`; it did not reach Kiro generation. **No M204 code or tests are attributed to Kiro.**
- Application edits and added tests were written by ChatGPT/WAG and independently checked via Node tests. Existing historical M1/M5A/M6E/M118 Kiro contributions remain documented separately.
- Neither clipboard output nor a repository-local spec is proof of correctness, adoption, independently attested test execution or merge safety.
