// test/git-inspector.test.mjs
//
// Deterministic tests for the read-only Git inspector. Each test builds a
// disposable local Git fixture repo in the OS temp dir and tears it down
// afterwards. No global Git config is ever modified.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';

import { inspectRepository, parsePorcelainZ, parseNameStatusZ } from '../src/git-inspector.mjs';
import {
  initRepo,
  commitAll,
  makeTempDir,
  cleanup,
  writeRel,
  moveRel,
  gitIn,
  headOf,
} from './helpers.mjs';

test('clean tree: one commit, no changes', async (t) => {
  const dir = await makeTempDir('specter-clean-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'README.md', '# hi\n');
  await commitAll(dir, 'init');

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.equal(r.errorCode, undefined);
  assert.ok(r.root && existsSync(r.root), 'root resolves to an existing dir');
  assert.equal(r.unborn, false);
  assert.ok(typeof r.head === 'string' && r.head.length >= 7, 'head is a hash');
  assert.equal(r.clean, true);
  assert.equal(r.dirty, false);
  assert.deepEqual(r.staged, []);
  assert.deepEqual(r.unstaged, []);
  assert.deepEqual(r.untracked, []);
  assert.deepEqual(r.renamed, []);
});

test('dirty tree: unstaged modification of a tracked file', async (t) => {
  const dir = await makeTempDir('specter-dirty-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'src/auth.js', 'export const a = 1;\n');
  await commitAll(dir, 'add auth');
  await writeRel(dir, 'src/auth.js', 'export const a = 2;\n'); // modify, not staged

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.equal(r.dirty, true);
  assert.equal(r.clean, false);
  assert.equal(r.unstaged.length, 1);
  assert.equal(r.unstaged[0].path, 'src/auth.js');
  assert.equal(r.unstaged[0].status, 'M');
  assert.deepEqual(r.staged, []);
  assert.deepEqual(r.untracked, []);
});

test('staged change: new file added to the index', async (t) => {
  const dir = await makeTempDir('specter-staged-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'keep.txt', 'x\n');
  await commitAll(dir, 'init');
  await writeRel(dir, 'newfile.txt', 'y\n');
  await gitIn(dir, ['add', 'newfile.txt']);

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.equal(r.staged.length, 1);
  assert.equal(r.staged[0].path, 'newfile.txt');
  assert.equal(r.staged[0].status, 'A');
  assert.deepEqual(r.untracked, []);
  assert.deepEqual(r.unstaged, []);
  assert.equal(r.dirty, true);
});

test('both staged and unstaged: file modified then re-modified', async (t) => {
  const dir = await makeTempDir('specter-both-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'f.txt', 'one\n');
  await commitAll(dir, 'init');
  await writeRel(dir, 'f.txt', 'two\n');
  await gitIn(dir, ['add', 'f.txt']); // stage "two"
  await writeRel(dir, 'f.txt', 'three\n'); // further unstaged change

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.equal(r.staged.length, 1);
  assert.equal(r.staged[0].path, 'f.txt');
  assert.equal(r.staged[0].status, 'M');
  assert.equal(r.unstaged.length, 1);
  assert.equal(r.unstaged[0].path, 'f.txt');
  assert.equal(r.unstaged[0].status, 'M');
  assert.equal(r.dirty, true);
});

test('renamed file: git mv stages a rename', async (t) => {
  const dir = await makeTempDir('specter-rename-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'old_name.js', 'export const x = 1;\n');
  await commitAll(dir, 'add old');
  await gitIn(dir, ['mv', 'old_name.js', 'new_name.js']); // staged rename

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.equal(r.renamed.length, 1);
  assert.equal(r.renamed[0].path, 'new_name.js');
  assert.equal(r.renamed[0].oldPath, 'old_name.js');
  assert.equal(r.renamed[0].stage, 'staged');
  assert.equal(r.staged.length, 1);
  assert.equal(r.staged[0].status, 'R');
  // diff --cached name-status also reflects the rename.
  assert.ok(r.diff.staged.length >= 1, 'cached name-status has the rename');
  const dr = r.diff.staged.find((d) => d.path === 'new_name.js');
  assert.ok(dr, 'rename present in diff.staged');
  assert.equal(dr.status, 'R');
  assert.equal(dr.oldPath, 'old_name.js');
});

test('untracked file appears in untracked list', async (t) => {
  const dir = await makeTempDir('specter-untracked-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'tracked.txt', 'a\n');
  await commitAll(dir, 'init');
  await writeRel(dir, 'untracked.txt', 'b\n'); // not added

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.deepEqual(r.untracked, ['untracked.txt']);
  assert.deepEqual(r.staged, []);
  assert.deepEqual(r.unstaged, []);
  assert.equal(r.dirty, true);
});

test('unborn HEAD: fresh repo with no commits', async (t) => {
  const dir = await makeTempDir('specter-unborn-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'staged.txt', 's\n');
  await gitIn(dir, ['add', 'staged.txt']); // staged but no commit yet

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.equal(r.unborn, true);
  assert.equal(r.head, null);
  assert.equal(r.staged.length, 1);
  assert.equal(r.staged[0].path, 'staged.txt');
  assert.equal(r.staged[0].status, 'A');
  assert.equal(r.dirty, true);
});

test('non-repo directory is rejected as NOT_A_GIT_REPO', async (t) => {
  const dir = await makeTempDir('specter-notgit-');
  t.after(() => cleanup(dir));
  // deliberately no git init

  const r = await inspectRepository(dir);
  assert.equal(r.ok, false);
  assert.equal(r.errorCode, 'NOT_A_GIT_REPO');
  assert.equal(r.root, null);
  assert.equal(r.head, null);
});

test('path with spaces in the directory name works', async (t) => {
  const dir = await makeTempDir('specter space dir '); // prefix has spaces
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'a b c.txt', 'content with spaces\n');
  await commitAll(dir, 'init');

  const r = await inspectRepository(dir);
  assert.equal(r.ok, true);
  assert.ok(r.root.includes(' '), 'root retains the space');
  assert.equal(r.clean, true);
});

test('subdirectory path resolves to repository root', async (t) => {
  const dir = await makeTempDir('specter-sub-');
  t.after(() => cleanup(dir));
  await initRepo(dir);
  await writeRel(dir, 'nested/deep/file.txt', 'x\n');
  await commitAll(dir, 'init');

  const r = await inspectRepository(path.join(dir, 'nested', 'deep'));
  assert.equal(r.ok, true);
  // The resolved root must be the repo top-level (contains .git), tolerant of
  // the separator style Git emits on this platform.
  assert.ok(existsSync(path.join(r.root, '.git')), 'root contains .git');
  assert.notEqual(
    path.resolve(r.root).toLowerCase(),
    path.resolve(path.join(dir, 'nested', 'deep')).toLowerCase(),
    'root is the repo top-level, not the subdirectory',
  );
});

test('empty and non-existent paths are rejected safely', async () => {
  const empty = await inspectRepository('');
  assert.equal(empty.ok, false);
  assert.equal(empty.errorCode, 'INVALID_PATH');

  const whitespace = await inspectRepository('   ');
  assert.equal(whitespace.ok, false);
  assert.equal(whitespace.errorCode, 'INVALID_PATH');

  const missing = await inspectRepository(
    'C:\\definitely\\not\\a\\real\\path\\specter-' + Date.now(),
  );
  assert.equal(missing.ok, false);
  assert.equal(missing.errorCode, 'PATH_NOT_FOUND');

  const notString = await inspectRepository(null);
  assert.equal(notString.ok, false);
  assert.equal(notString.errorCode, 'INVALID_PATH');
});

test('parsePorcelainZ parses rename with old path', () => {
  const out = ['R  new.js\u0000old.js\u0000', 'M  mod.js\u0000', '?? un.js\u0000'].join('');
  const entries = parsePorcelainZ(out);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries[0], { x: 'R', y: ' ', path: 'new.js', oldPath: 'old.js' });
  assert.deepEqual(entries[1], { x: 'M', y: ' ', path: 'mod.js', oldPath: null });
  assert.deepEqual(entries[2], { x: '?', y: '?', path: 'un.js', oldPath: null });
});

test('parseNameStatusZ parses R100 rename (source first) and plain statuses', () => {
  // git diff --name-status -z emits renames as R<score>\x00<source>\x00<dest>\x00.
  // The parser normalizes to porcelain convention: path=dest, oldPath=source.
  const out = ['R100\u0000old.js\u0000new.js\u0000', 'M\u0000mod.js\u0000', 'A\u0000add.js\u0000'].join('');
  const entries = parseNameStatusZ(out);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries[0], { status: 'R', path: 'new.js', oldPath: 'old.js' });
  assert.deepEqual(entries[1], { status: 'M', path: 'mod.js', oldPath: null });
  assert.deepEqual(entries[2], { status: 'A', path: 'add.js', oldPath: null });
});
