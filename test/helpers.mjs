// test/helpers.mjs
//
// Shared helpers for Specter Audit tests. Creates *disposable* local Git
// fixture repositories in the OS temp directory. These helpers NEVER touch
// global Git config: all config is written to the temporary repo's own
// .git/config, and every commit passes -c commit.gpgsign=false so no signing
// agent is invoked.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  rename as fsRename,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileP = promisify(execFile);

/** Run git inside a fixture dir with an argument array (no shell). */
export async function gitIn(dir, args) {
  return execFileP('git', args, {
    cwd: dir,
    shell: false,
    windowsHide: true,
    env: {
      ...process.env,
      // Keep the test environment hermetic and deterministic.
      GIT_TERMINAL_PROMPT: '0',
      GIT_CONFIG_NOSYSTEM: '1',
    },
  });
}

/**
 * Initialise a bare local Git repository at `dir` with deterministic local
 * config (no global config changes).
 */
export async function initRepo(dir, { initialBranch = 'main' } = {}) {
  await gitIn(dir, ['init', '-b', initialBranch]);
  await gitIn(dir, ['config', 'core.autocrlf', 'false']);
  await gitIn(dir, ['config', 'core.eol', 'lf']);
  await gitIn(dir, ['config', 'user.name', 'Specter Test']);
  await gitIn(dir, ['config', 'user.email', 'specter@test.local']);
  await gitIn(dir, ['config', 'commit.gpgsign', 'false']);
}

/** Stage everything and commit with a message. */
export async function commitAll(dir, message) {
  await gitIn(dir, ['add', '-A']);
  await gitIn(dir, ['commit', '-m', message, '--no-verify']);
}

/** Create a temp dir using a custom prefix (which may contain spaces). */
export async function makeTempDir(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

/** Remove a fixture dir, ignoring errors if it was already removed. */
export async function cleanup(dir) {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

/** Write a file with a given relative path, creating parent dirs. */
export async function writeRel(dir, rel, content) {
  const full = path.join(dir, rel);
  const parent = path.dirname(full);
  await mkdir(parent, { recursive: true });
  await writeFile(full, content, 'utf8');
}

/** Move a file within a fixture dir. */
export async function moveRel(dir, fromRel, toRel) {
  const from = path.join(dir, fromRel);
  const to = path.join(dir, toRel);
  await mkdir(path.dirname(to), { recursive: true });
  await fsRename(from, to);
}

/** Resolve the current HEAD hash of a fixture dir (full hash). */
export async function headOf(dir) {
  const { stdout } = await gitIn(dir, ['rev-parse', 'HEAD']);
  return stdout.trim();
}
