// src/git-inspector.mjs
//
// Specter Audit — Milestone 1: read-only Git inspector.
//
// `inspectRepository(repoPath)` runs a small, fixed set of read-only Git
// subcommands against an explicitly chosen local repository and returns
// structured, plain-data evidence. It NEVER:
//   * opens a shell (uses execFile with argument arrays, shell:false)
//   * reads file contents
//   * invokes a command supplied by the user
//   * mutates the repository (no add / reset / checkout / commit / push)
//   * touches global Git config
//
// Every Git call is bounded by a timeout and a max output buffer so a hostile
// or pathological repository cannot hang or exhaust memory.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { realpath, stat } from 'node:fs/promises';

const execFileP = promisify(execFile);

/** Git binary, overridable for tests. */
const GIT_BIN = process.env.SPECTER_GIT_BIN || process.env.GIT_BIN || 'git';

/** Per-command hard timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 8000;

/** Largest stdout/stderr buffer we will accept from any single Git call. */
const DEFAULT_MAX_BUFFER = 2 * 1024 * 1024; // 2 MiB

/**
 * Run a single read-only Git subcommand with an argument array (never a
 * shell). Returns a normalized result object whether or not the command
 * succeeded, so callers never throw on a non-zero Git exit status.
 *
 * @param {string} cwd - absolute directory to run Git in
 * @param {string[]} args - argument array (no shell interpolation)
 * @param {{timeout?: number, maxBuffer?: number}} [opts]
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string, code: number|null, timedOut: boolean, overflow: boolean, message: string, durationMs: number}>}
 */
async function git(cwd, args, opts = {}) {
  const timeout = opts.timeout ?? DEFAULT_TIMEOUT_MS;
  const maxBuffer = opts.maxBuffer ?? DEFAULT_MAX_BUFFER;
  const started = Date.now();
  try {
    const result = await execFileP(GIT_BIN, args, {
      cwd,
      shell: false,
      timeout,
      maxBuffer,
      windowsHide: true,
      // Git status can otherwise refresh index metadata via optional locks.
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
    });
    return {
      ok: true,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      code: 0,
      timedOut: false,
      overflow: false,
      message: '',
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const timedOut = err.killed === true && err.signal === 'SIGTERM';
    const overflow =
      err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ||
      (err.message && /maxbuffer/i.test(err.message));
    return {
      ok: false,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      code: typeof err.status === 'number' ? err.status : null,
      timedOut,
      overflow,
      message: err.message ? String(err.message) : '',
      durationMs: Date.now() - started,
    };
  }
}

/**
 * Parse `git status --porcelain=v1 -z` output into status entries.
 *
 * Each entry is `{ x, y, path, oldPath }` where:
 *   - x  = staged (index) status code, e.g. 'M','A','D','R','C','U',' ','?'
 *   - y  = unstaged (worktree) status code
 *   - path = current path
 *   - oldPath = original path for renames/copies, else null
 *
 * Renames/copies carry their original path as the next NUL-delimited chunk.
 *
 * @param {string} output - raw -z output (may contain NULs)
 * @returns {{x: string, y: string, path: string, oldPath: string|null}[]}
 */
export function parsePorcelainZ(output) {
  if (typeof output !== 'string' || output.length === 0) return [];
  const chunks = output.split('\0');
  const entries = [];
  let i = 0;
  while (i < chunks.length) {
    const chunk = chunks[i];
    if (chunk === '') {
      i += 1;
      continue;
    }
    // Porcelain v1 line: XY<space>PATH  (>=3 chars)
    if (chunk.length < 3) {
      i += 1;
      continue;
    }
    const x = chunk[0];
    const y = chunk[1];
    const path = chunk.slice(3);
    let oldPath = null;
    if (x === 'R' || x === 'C') {
      // The original path is the following NUL-delimited chunk.
      const next = chunks[i + 1];
      if (next !== undefined && next !== '') oldPath = next;
      i += 2;
    } else {
      i += 1;
    }
    entries.push({ x, y, path, oldPath });
  }
  return entries;
}

/**
 * Parse `git diff --name-status -z` (or `--cached`) output.
 *
 * The status field may be a single letter (M/A/D/U) or a letter plus a
 * similarity score for renames/copies (R100, C050). For R/C the chunk after
 * the path is the original path.
 *
 * @param {string} output - raw -z output
 * @returns {{status: string, path: string, oldPath: string|null}[]}
 */
export function parseNameStatusZ(output) {
  if (typeof output !== 'string' || output.length === 0) return [];
  const chunks = output.split('\0');
  const entries = [];
  let i = 0;
  while (i < chunks.length) {
    const statusField = chunks[i];
    if (statusField === '') {
      i += 1;
      continue;
    }
    const code = statusField[0];
    if (code === 'R' || code === 'C') {
      // git diff --name-status -z emits: R<score>\x00<source/old>\x00<dest/new>\x00
      // Normalize to the porcelain convention: path = dest/current, oldPath = source.
      if (i + 2 >= chunks.length) break;
      const sourcePath = chunks[i + 1];
      const destPath = chunks[i + 2];
      entries.push({ status: code, path: destPath, oldPath: sourcePath });
      i += 3;
    } else {
      const path = chunks[i + 1];
      if (path === undefined) break;
      entries.push({ status: code, path, oldPath: null });
      i += 2;
    }
  }
  return entries;
}

/**
 * Build a normalized error result object.
 * @param {string} code - machine-readable error code
 * @param {string} message - human-readable message
 */
function errorResult(code, message) {
  return {
    ok: false,
    errorCode: code,
    error: message,
    root: null,
    head: null,
    unborn: false,
    clean: false,
    dirty: false,
    status: [],
    staged: [],
    unstaged: [],
    untracked: [],
    renamed: [],
    diff: { unstaged: [], staged: [] },
    errors: [message],
  };
}

/**
 * Inspect a single local Git repository read-only.
 *
 * @param {string} repoPath - explicit path to the repository (or a path inside it)
 * @param {{timeout?: number, maxBuffer?: number}} [options]
 * @returns {Promise<object>} structured inspection evidence (see fields below)
 *
 * Returned shape (success):
 *   {
 *     ok: true,
 *     root: string,            // absolute repository root
 *     head: string|null,       // full HEAD commit hash, or null if unborn
 *     unborn: boolean,         // true when HEAD does not yet resolve
 *     clean: boolean,          // true when nothing is staged/unstaged/untracked
 *     dirty: boolean,          // inverse of clean
 *     status: [{x,y,path,oldPath}],           // parsed porcelain entries
 *     staged: [{path,status,oldPath}],       // index changes
 *     unstaged: [{path,status,oldPath}],     // worktree changes
 *     untracked: string[],                     // untracked paths
 *     renamed: [{path,oldPath,stage,status}], // detected renames/copies
 *     diff: { unstaged: [{status,path,oldPath}], staged: [...] }, // diff name-status
 *     errors: string[]                         // non-fatal warnings
 *   }
 */
export async function inspectRepository(repoPath, options = {}) {
  // 1. Validate the input is a usable path string.
  if (typeof repoPath !== 'string' || repoPath.trim() === '') {
    return errorResult('INVALID_PATH', 'repoPath must be a non-empty string');
  }

  // 2. Confirm the path exists and is a directory, then resolve to absolute.
  let absPath;
  try {
    const info = await stat(repoPath);
    if (!info.isDirectory()) {
      return errorResult(
        'NOT_A_DIRECTORY',
        `path is not a directory: ${repoPath}`,
      );
    }
    absPath = await realpath(repoPath);
  } catch (err) {
    return errorResult(
      'PATH_NOT_FOUND',
      `cannot resolve repo path "${repoPath}": ${err.message}`,
    );
  }

  const errors = [];

  // 3. Verify this is actually a Git worktree by resolving its top-level.
  const toplevel = await git(absPath, ['rev-parse', '--show-toplevel'], options);
  if (!toplevel.ok || toplevel.timedOut || toplevel.overflow) {
    if (toplevel.timedOut) {
      return errorResult('TIMEOUT', `git rev-parse timed out after ${options.timeout ?? DEFAULT_TIMEOUT_MS}ms`);
    }
    if (toplevel.overflow) {
      return errorResult('OUTPUT_TOO_LARGE', 'git rev-parse output exceeded the buffer limit');
    }
    return errorResult(
      'NOT_A_GIT_REPO',
      `not a git repository (or git unavailable): ${(toplevel.stderr || toplevel.message || '').trim()}`,
    );
  }
  const root = toplevel.stdout.trim();
  if (!root) {
    return errorResult('NOT_A_GIT_REPO', 'git rev-parse --show-toplevel returned an empty root');
  }

  // 4. Resolve HEAD. An unborn repository (no commits yet) is allowed.
  let head = null;
  let unborn = false;
  const headResult = await git(root, ['rev-parse', 'HEAD'], options);
  if (headResult.ok) {
    head = headResult.stdout.trim();
    if (!head) {
      // Defensive: treat empty-but-successful as unborn.
      head = null;
      unborn = true;
    }
  } else {
    if (headResult.timedOut || headResult.overflow) {
      return errorResult(headResult.timedOut ? 'TIMEOUT' : 'OUTPUT_TOO_LARGE', 'Git HEAD inspection was incomplete');
    }
    // Repo is confirmed; an unresolvable HEAD may be unborn.
    unborn = true;
  }

  // 5. Working-tree + index status (untracked, staged, unstaged, renames).
  const statusResult = await git(
    root,
    ['status', '--porcelain=v1', '-z'],
    options,
  );
  if (statusResult.overflow) errors.push('git status output exceeded the buffer limit; results may be truncated');
  if (statusResult.timedOut) errors.push('git status timed out; results may be incomplete');
  if (!statusResult.ok) {
    return errorResult(statusResult.timedOut ? 'TIMEOUT' : statusResult.overflow ? 'OUTPUT_TOO_LARGE' : 'GIT_STATUS_FAILED',
      'Git status inspection failed; cannot conclude whether the worktree is clean');
  }
  const statusEntries = parsePorcelainZ(statusResult.stdout);

  // 6. Unstaged name-status (worktree vs index).
  const diffResult = await git(root, ['diff', '--name-status', '-z'], options);
  if (diffResult.overflow) errors.push('git diff output exceeded the buffer limit; results may be truncated');
  if (!diffResult.ok) {
    return errorResult(diffResult.timedOut ? 'TIMEOUT' : diffResult.overflow ? 'OUTPUT_TOO_LARGE' : 'GIT_DIFF_FAILED',
      'Git unstaged diff inspection failed');
  }
  const unstagedDiff = parseNameStatusZ(diffResult.stdout);

  // 7. Staged name-status (index vs HEAD). Works against an unborn HEAD too.
  const cachedResult = await git(
    root,
    ['diff', '--cached', '--name-status', '-z'],
    options,
  );
  if (cachedResult.overflow) errors.push('git diff --cached output exceeded the buffer limit; results may be truncated');
  if (!cachedResult.ok) {
    return errorResult(cachedResult.timedOut ? 'TIMEOUT' : cachedResult.overflow ? 'OUTPUT_TOO_LARGE' : 'GIT_STAGED_DIFF_FAILED',
      'Git staged diff inspection failed');
  }
  const stagedDiff = parseNameStatusZ(cachedResult.stdout);

  // Derive structured, plain-data views from the porcelain status.
  const staged = [];
  const unstaged = [];
  const untracked = [];
  const renamed = [];
  for (const e of statusEntries) {
    const isUntracked = e.x === '?' && e.y === '?';
    if (isUntracked) {
      untracked.push(e.path);
      continue;
    }
    // Index (staged) changes: X is set and not '?'.
    if (e.x !== ' ' && e.x !== '?') {
      staged.push({ path: e.path, status: e.x, oldPath: e.oldPath });
      if (e.x === 'R' || e.x === 'C') {
        renamed.push({ path: e.path, oldPath: e.oldPath, stage: 'staged', status: e.x });
      }
    }
    // Worktree (unstaged) changes: Y is set and not '?'.
    if (e.y !== ' ' && e.y !== '?') {
      unstaged.push({ path: e.path, status: e.y, oldPath: e.oldPath });
      if (e.y === 'R' || e.y === 'C') {
        renamed.push({ path: e.path, oldPath: e.oldPath, stage: 'unstaged', status: e.y });
      }
    }
  }

  const dirty =
    staged.length > 0 || unstaged.length > 0 || untracked.length > 0;

  return {
    ok: true,
    root,
    head,
    unborn,
    clean: !dirty,
    dirty,
    status: statusEntries.map((e) => ({
      x: e.x,
      y: e.y,
      path: e.path,
      oldPath: e.oldPath,
    })),
    staged,
    unstaged,
    untracked,
    renamed,
    diff: { unstaged: unstagedDiff, staged: stagedDiff },
    errors,
  };
}

export { git as _git };
