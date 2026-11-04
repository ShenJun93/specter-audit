# M7 — Your Session, Your Evidence (Kiroween 2026)

## User problem and prize target
A working hosted demo made of four recorded exhibits is not a useful everyday tool.
Visitors should be able to inspect their own Kiro CLI session logs without
disclosing prompts, source code, paths or secrets to Specter, GitHub or a cloud API.
This is the main Potential Impact and Technological Implementation upgrade.

## Non-negotiable trust boundary
1. User selects `messages.jsonl` using a native `<input type=file>` in their
   browser. No upload, network request, backend API or persistence.
2. Raw session events are read client-side **only in memory**. Render **no**
   prompts, tool input/output, private file paths, home directories or raw data
   to the DOM, logs, analytics, or downloadable report.
3. File max **8 MiB**; max **4000 JSONL lines**, max 2 MiB per individual
   line, finite normalized timeline max 120 source/test events, reject
   malformed/unsupported input fail-closed. Expose deterministic safe error
   messages without embedding raw input.
4. Recognize actual Kiro CLI shape: event timestamp; `payload.type`:
   `tool_call` `tool_result` or `assistant` + `operationType: Say`;
   associate a result to its call by `toolCallId`. `tool_result.success`
   must be true, and command string on the matching `execute_pwsh` tool
   call must actually invoke `node --test` or `npm test` (not a search
   command mentioning those words). Tool result content must contain explicit
   `pass N`, `fail N`, `Exit Code: N` or identical safe forms.
   Do NOT infer PASS from agent narrative alone.
5. Source edits are tool calls with successful results from `fs_write` or
   `str_replace`, including absolute source paths only when they contain an
   explicit segment `/src/`, `/test/` or `/web/`. Drop directory prefix;
   only expose safe repo-relative path **after** validation. If path cannot
   be sanitized reliably, count the successful edit using an explicitly
   redacted synthetic placeholder and record how many paths were redacted.
   Never discard a successful edit and misrepresent the session as clean.
   Missing/unmatched tool results remain INSUFFICIENT.
6. Detect actual agent **test-passed** claims from `assistant / Say`
   content, accept simple forms such as `All 120 tests pass, 0 fail.`;
   never expose claim text; produce a synthetic label such as
   `Agent asserted 120 passing tests`.
7. Provide candidate claim timestamps and show a conservative single
   selected claim: latest recognized claim, with explicit scope.
   Return only sanitized `{input,summary,errors,scope}`: `input` matches
   `auditLocalSession({sourceKind,claimAt,sessionEndedAt,tests,edits})`,
   with all timestamps absolute UTC and edited files repo-relative.
   No claim => no verdict. Multiple sessions in one file => fail closed.
8. Distinguish result categories, don't claim independent attestation,
   code correctness, absence of tests in another session, or guarantees
   outside the exact saved file. Local browser can still load external JS
   from same origin; don't claim *cryptographic* privacy.
9. Respect existing v1 Git inspector and four exhibits unchanged.
10. Use Node built-in tests on sanitized fixtures including: authentic-shape
    M5A case, latest passing test, failed-after-pass, no claim, duplicate
    calls/results, malformed JSON, over-limit inputs, unsafe paths, failed
    edits, test command false positives, all-private-fields never included,
    identical-time timestamps and unsorted events.

## Release gates
- [ ] Kiro CLI authors a substantial M7 parser/test contribution. **NOT
  MET:** a Kiro implementation attempt timed out without source changes.
  The current M7 importer/UI and red-team tests are ChatGPT/WAG-authored.
  The separate M6E session-staleness engine is genuinely Kiro-authored.
  Any future Kiro contribution must be evidenced by successful tool writes,
  not by a prompt or an unverified model response.
- Independent adversarial review with safe, private real-session fixture.
- Use existing core module `src/kiro-session-staleness.mjs` without
  weakening its safe verdicts.
- Browser-only functional flow on Chrome desktop/mobile; zero requests
  carrying user input; no production deploy without owner approval.
- Correct all false-positive status elevation before release.
