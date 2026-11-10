#!/usr/bin/env node
// M9B.0 advisory PostFileSave handler. Zero dependencies, Node 24 ESM.
//
// UNVERIFIED INTERFACE: genuine Kiro CLI V3 PostFileSave STDIN keys have NOT
// been observed. The event shape accepted below (`hook_event_name` equal to
// "PostFileSave" plus a string `file_path`) is a SYNTHETIC ASSUMPTION for
// testing only. It must not be claimed as a verified Kiro interface until the
// real keys are captured from a live session on a synthetic source file.
//
// Behavior: reads at most 8192 bytes of STDIN JSON (2 s timeout), prints one
// static line, always exits 0. The warning is advisory; it is not evidence
// that any test ran, nor of actual chronology. Never echoes input. No network,
// no process spawn, no filesystem writes, no persistence.

const MAX_BYTES = 8192;
const TIMEOUT_MS = 2000;
const MAX_PATH_LEN = 260;

export const WARNING =
  'SPECTER SOURCE CHANGE: A source file was saved after earlier evidence may have been collected. ' +
  'Any previous PASS claim is not sufficient to verify this new source state. ' +
  'Rerun the relevant tests and inspect the new receipt before claiming current results.';
export const UNKNOWN = 'SPECTER UNKNOWN: Event not recognized; no evidence claims made.';

const SOURCE_EXT = /\.(?:js|mjs|ts|tsx)$/;
const IGNORED_SEGMENTS = new Set([
  'node_modules', '.git', '.kiro', 'qa', 'private', 'tmp', 'temp', 'dist', 'coverage',
]);

// Returns true only for a canonical relative path under src/ with a source extension.
export function isAllowedSourcePath(p) {
  if (typeof p !== 'string' || p.length === 0 || p.length > MAX_PATH_LEN) return false;
  if (/[\u0000-\u001f\u007f]/.test(p)) return false;
  // Unicode control/format (incl. bidi U+202A-202E, U+2066-2069, U+200E/F) and line/paragraph separators.
  if (/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(p)) return false;
  if (p.includes(':') || p.includes('~')) return false; // drive letters, ADS, home
  const n = p.replaceAll('\\', '/'); // accept Windows and POSIX separators
  if (n.startsWith('/')) return false; // absolute and UNC (//host, \\host)
  const segs = n.split('/');
  if (segs.length < 2 || segs[0] !== 'src') return false;
  for (const s of segs) {
    if (s === '' || s === '.' || s === '..') return false;
    // Windows strips trailing dots/whitespace, so "x. " or ".git." alias other names.
    if (/[.\s]$/u.test(s)) return false;
    const lower = s.toLowerCase();
    if (IGNORED_SEGMENTS.has(lower) || lower.startsWith('.env')) return false;
  }
  return SOURCE_EXT.test(n);
}

// Fail-closed ambiguity scan over text that JSON.parse already accepted.
// Returns true if any object has a duplicate key (after decoding simple
// escapes) or any string contains a \uXXXX escape (unverifiable key alias;
// conservatively rejected everywhere rather than decoded).
export function hasAmbiguousJson(raw) {
  const stack = []; // Set for objects, null for arrays
  let expectKey = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      let j = i + 1;
      for (; j < raw.length; j++) {
        if (raw[j] === '\\') {
          if (raw[j + 1] === 'u') return true;
          j++;
        } else if (raw[j] === '"') break;
      }
      if (j >= raw.length) return true;
      const top = stack[stack.length - 1];
      if (expectKey && top instanceof Set) {
        let key;
        try {
          key = JSON.parse(raw.slice(i, j + 1));
        } catch {
          return true;
        }
        if (top.has(key)) return true;
        top.add(key);
        expectKey = false;
      }
      i = j;
    } else if (c === '{') {
      stack.push(new Set());
      expectKey = true;
    } else if (c === '[') {
      stack.push(null);
      expectKey = false;
    } else if (c === '}' || c === ']') {
      stack.pop();
      expectKey = false;
    } else if (c === ',') {
      expectKey = stack[stack.length - 1] instanceof Set;
    } else if (c === ':') {
      expectKey = false;
    }
  }
  return false;
}

// Pure decision function: returns the single line to print.
export function decide(raw) {
  let ev;
  try {
    ev = JSON.parse(raw);
    if (hasAmbiguousJson(raw)) return UNKNOWN;
  } catch {
    return UNKNOWN;
  }
  if (ev === null || typeof ev !== 'object' || Array.isArray(ev)) return UNKNOWN;
  if (ev.hook_event_name !== 'PostFileSave') return UNKNOWN; // synthetic assumption
  if (!isAllowedSourcePath(ev.file_path)) return UNKNOWN; // synthetic assumption
  return WARNING;
}

function main() {
  const chunks = [];
  let total = 0;
  let done = false;
  const finish = (line) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    process.stdin.removeAllListeners('data');
    process.stdin.destroy();
    process.stdout.write(line + '\n');
    process.exitCode = 0;
  };
  const timer = setTimeout(() => finish(UNKNOWN), TIMEOUT_MS);
  process.stdin.on('error', () => finish(UNKNOWN));
  process.stdin.on('data', (c) => {
    total += c.length;
    if (total > MAX_BYTES) return finish(UNKNOWN);
    chunks.push(c);
  });
  process.stdin.on('end', () => {
    if (done) return;
    let line = UNKNOWN;
    try {
      line = decide(Buffer.concat(chunks).toString('utf8'));
    } catch {
      line = UNKNOWN;
    }
    finish(line);
  });
}

main();
