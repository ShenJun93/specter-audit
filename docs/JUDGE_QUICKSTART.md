# Specter Audit — Judge Quickstart

Prerequisites: Node.js 24+, Git, and a desktop web browser.

1. Open a terminal in the project root and run: npm run demo
2. Open the localhost URL printed by the command.
3. In "Interrogate a claim", click the three sample buttons. The verdict comes from a fresh read-only Git inspection and HTTP evaluation, not a hardcoded response.

Expected scenarios using the new synthetic Git fixture:

| Example claim | Expected verdict | Meaning |
| --- | --- | --- |
| all tests pass | UNVERIFIED | No independent test execution evidence |
| updated auth login and all tests pass | PARTIAL | Git auth path changed, tests claim unsupported |
| updated auth login validation | SUPPORTED | Path alignment only; correctness not established |

The demo fixture is made under the OS temporary directory and contains a real baseline commit plus a modified tracked auth file. No test is executed by the app. It is isolated from your repository and deleted when the demo ends normally.

OPTIONAL PROVENANCE CHALLENGE: Expand "Include structured test receipt", enter a JSON object with numeric exitCode 0, the currently displayed full HEAD hash (not abbreviated), a valid timestamp and command "npm test". Retry "all tests pass". It must remain UNVERIFIED because the receipt is self-reported, not independently attested.

Verify with: npm test; npm run check.

Security: the app is loopback-only, never reads source contents, cannot execute a user-entered command, does not mutate the inspected repository, blocks cross-origin API POSTs, and uses a static asset allowlist.

Submission caveats: this local demo is not yet a publicly hosted working app; the final Kiroween entry must include a public GitHub repository, open-source license, Kiro usage explanation, hosted/testable app, and a public video under three minutes.
