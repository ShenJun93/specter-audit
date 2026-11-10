// Tests for the M9B.0 handler. Event shapes here are SYNTHETIC; the real
// Kiro CLI V3 PostFileSave STDIN keys are unverified.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/kiro-postsave-evidence-nudge.mjs', import.meta.url));
const WARNING =
  'SPECTER SOURCE CHANGE: A source file was saved after earlier evidence may have been collected. ' +
  'Any previous PASS claim is not sufficient to verify this new source state. ' +
  'Rerun the relevant tests and inspect the new receipt before claiming current results.';
const UNKNOWN = 'SPECTER UNKNOWN: Event not recognized; no evidence claims made.';

function run(input) {
  const r = spawnSync(process.execPath, [SCRIPT], { input, encoding: 'utf8', timeout: 10000 });
  return { status: r.status, out: r.stdout, err: r.stderr };
}
const ev = (file_path, extra = {}) =>
  JSON.stringify({ hook_event_name: 'PostFileSave', file_path, ...extra });

test('valid synthetic source save prints exact warning, exit 0', () => {
  const r = run(ev('src/lib/a.mjs'));
  assert.equal(r.status, 0);
  assert.equal(r.out, WARNING + '\n');
  assert.equal(r.err, '');
});

test('Windows separators are supported', () => {
  assert.equal(run(ev('src\\lib\\a.tsx')).out, WARNING + '\n');
});

test('unknown schema yields UNKNOWN, never PASS/STALE', () => {
  for (const input of ['{}', '[]', 'null', '"x"', JSON.stringify({ file_path: 'src/a.js' }), ev(42)]) {
    const r = run(input);
    assert.equal(r.status, 0);
    assert.equal(r.out, UNKNOWN + '\n');
    assert.doesNotMatch(r.out, /PASS|STALE/);
  }
});

test('malformed and empty input yields UNKNOWN', () => {
  for (const input of ['', '{not json', '\u0000']) {
    const r = run(input);
    assert.equal(r.status, 0);
    assert.equal(r.out, UNKNOWN + '\n');
  }
});

test('oversize input yields UNKNOWN', () => {
  const big = ev('src/a.js', { pad: 'x'.repeat(9000) });
  const r = run(big);
  assert.equal(r.status, 0);
  assert.equal(r.out, UNKNOWN + '\n');
});

test('traversal, dot segments, control chars rejected', () => {
  for (const p of ['src/../x.js', '../src/a.js', 'src/./a.js', 'src//a.js', 'src/a\u0007.js', 'src/a.js\n']) {
    assert.equal(run(ev(p)).out, UNKNOWN + '\n', JSON.stringify(p));
  }
});

test('absolute, drive and UNC paths rejected', () => {
  for (const p of ['/src/a.js', 'C:\\proj\\src\\a.js', 'C:/proj/src/a.js', '\\\\host\\share\\src\\a.js', '//host/src/a.js']) {
    assert.equal(run(ev(p)).out, UNKNOWN + '\n', p);
  }
});

test('non-source extensions, outside src, and ignored dirs rejected', () => {
  for (const p of ['src/a.json', 'src/a.md', 'src/a', 'lib/a.js', 'src/.env', 'src/.env.js',
    'src/node_modules/x.js', 'src/.git/x.js', 'src/.kiro/x.js', 'src/qa/x.js']) {
    assert.equal(run(ev(p)).out, UNKNOWN + '\n', p);
  }
});

test('duplicate critical keys (incl. unicode-escaped aliases) yield UNKNOWN', () => {
  const inputs = [
    '{"hook_event_name":"Other","hook_event_name":"PostFileSave","file_path":"src/a.js"}',
    '{"hook_event_name":"PostFileSave","file_path":"../private/a.js","file_path":"src/a.js"}',
    '{"hook_event_name":"PostFileSave","file_path":"src/a.js","file_path":"src/b.js"}',
    '{"hook_event_name":"PostFileSave","file_path":"../x.js","file\\u005fpath":"src/a.js"}',
    '{"hook_event_name":"Other","hook\\u005fevent_name":"PostFileSave","file_path":"src/a.js"}',
    '{"hook_event_name":"PostFileSave","file_path":"src/\\u0061.js"}',
    '{"hook_event_name":"PostFileSave","file_path":"src/a.js","n":{"k":1,"k":2}}',
  ];
  for (const input of inputs) {
    const r = run(input);
    assert.equal(r.status, 0);
    assert.equal(r.out, UNKNOWN + '\n', input);
  }
});

test('same key in different objects is not a duplicate; normal paths still WARN', () => {
  const nested = '{"hook_event_name":"PostFileSave","file_path":"src/a.mjs","a":{"k":1},"b":{"k":2}}';
  assert.equal(run(nested).out, WARNING + '\n');
  assert.equal(run(ev('src/a.mjs')).out, WARNING + '\n');
  assert.equal(run(ev('src\\lib\\a.tsx')).out, WARNING + '\n');
});

test('Windows-normalized aliases (trailing dot/space) rejected', () => {
  for (const p of ['src/.git./x.js', 'src/.. /x.js', 'src/a. /x.js', 'src/lib /a.js', 'src/lib./a.js',
    'src/a.js.', 'src/a.js ', 'src\\.git.\\x.js']) {
    assert.equal(run(ev(p)).out, UNKNOWN + '\n', JSON.stringify(p));
  }
});

test('bidi and Unicode control characters in path rejected', () => {
  for (const p of ['src/a\u202e.js', 'src/\u2066a.js', 'src/a\u2069.js', 'src/a\u200f.js',
    'src/a\u0085.js', 'src/a\u2028.js', 'src/a\u061c.js', 'src/a\ufeff.js']) {
    assert.equal(run(ev(p)).out, UNKNOWN + '\n', JSON.stringify(p));
  }
});

test('false trigger (other event name) yields UNKNOWN', () => {
  const r = run(JSON.stringify({ hook_event_name: 'PostToolUse', file_path: 'src/a.js' }));
  assert.equal(r.out, UNKNOWN + '\n');
});

test('privacy: output never leaks input values', () => {
  const secret = 'SECRET_TOKEN_abc123';
  const valid = run(ev('src/a.js', { prompt: secret, session_id: secret, command: secret, cwd: secret }));
  assert.equal(valid.out, WARNING + '\n');
  assert.ok(!valid.out.includes(secret) && !valid.err.includes(secret));
  const invalid = run(ev(`src/../${secret}.js`, { prompt: secret }));
  assert.equal(invalid.out, UNKNOWN + '\n');
  assert.ok(!invalid.out.includes(secret) && !invalid.err.includes(secret));
  const bad = run(`{"x":"${secret}`);
  assert.ok(!bad.out.includes(secret) && !bad.err.includes(secret));
});

test('non-blocking: exit code 0 in every case, repeat is idempotent', () => {
  for (const input of ['', 'garbage', ev('/etc/passwd'), ev('src/a.js')]) {
    assert.equal(run(input).status, 0);
  }
  assert.equal(run(ev('src/a.js')).out, run(ev('src/a.js')).out);
});
