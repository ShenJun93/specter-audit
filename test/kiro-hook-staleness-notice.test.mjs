import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {evaluateHandler} from '../scripts/kiro-v3-hook-preflight.mjs';
import {decide,isSourcePath} from '../scripts/kiro-hook-staleness-notice.mjs';

const handler=fileURLToPath(new URL('../scripts/kiro-hook-staleness-notice.mjs',import.meta.url));
const hookConfig=fileURLToPath(new URL('../.kiro/hooks/m260-source-change-warning.json',import.meta.url));
const WARNING='SPECTER SOURCE CHANGE: A source file was saved after earlier evidence may have been collected. Any previous PASS claim is not sufficient to verify this new source state. Rerun the relevant tests and inspect the new receipt before claiming current results.';
const ev=(name,file,extra={})=>JSON.stringify({hook_event_name:name,file_path:file,session_id:'CANARY_PRIVATE_SESSION_123',prompt:'CANARY_PRIVATE_PROMPT_123',api_key:'CANARY_PRIVATE_KEY_123',...extra});
const warn=(name,payload)=>({name,kind:'warn',payload});
const silent=(name,payload)=>({name,kind:'silent',payload});

test('real handler passes the 18-case M9B synthetic contract only',async()=>{
  const r=await evaluateHandler(handler);
  assert.equal(r.status,'SYNTHETIC_CONTRACT_PASS_ONLY',JSON.stringify(r.failed));
  assert.equal(r.tested,18);assert.equal(r.passed,18);
  assert.equal(r.liveKiroVerified,false);assert.equal(r.schemaVerified,false);
});

const extraCases=[
  warn('v3-filesave-ts',ev('FileSave','src/app.ts')),
  warn('v3-filesave-nested-tsx',ev('FileSave','src/ui/panel.tsx')),
  warn('v3-filesave-win',ev('FileSave','src\\ui\\panel.js')),
  silent('v3-filesave-readme',ev('FileSave','README.md')),
  silent('pre-tool-use',ev('PreToolUse','src/app.ts')),
  silent('stop',ev('Stop','src/app.ts')),
  silent('user-prompt',ev('UserPromptSubmit','src/app.ts')),
  silent('lowercase-event',ev('filesave','src/app.ts')),
  silent('event-padded',ev(' FileSave','src/app.ts')),
  silent('event-nonstring',JSON.stringify({hook_event_name:['FileSave'],file_path:'src/app.ts'})),
  silent('json-array',JSON.stringify([{hook_event_name:'FileSave',file_path:'src/app.ts'}])),
  silent('json-null','null'),
  silent('json-string','"FileSave"'),
  silent('trailing-garbage',ev('FileSave','src/app.ts')+'x'),
  silent('absolute-posix',ev('FileSave','/src/app.ts')),
  silent('absolute-win',ev('FileSave','C:\\repo\\src\\app.ts')),
  silent('unc',ev('FileSave','\\\\host\\share\\src\\app.ts')),
  silent('dot-segment',ev('FileSave','src/./app.ts')),
  silent('dot-traversal-win',ev('FileSave','src\\..\\.env')),
  silent('git-dir',ev('FileSave','src/git/hook.js')),
  silent('dotgit',ev('FileSave','src/.git/hook.js')),
  silent('env-file-ts',ev('FileSave','src/env.ts')),
  silent('env-dir',ev('FileSave','src/env/config.ts')),
  silent('qa-private',ev('FileSave','src/qa/private/x.ts')),
  silent('private-dir',ev('FileSave','src/private/x.ts')),
  silent('wrong-ext',ev('FileSave','src/app.json')),
  silent('bak-ext',ev('FileSave','src/app.ts.bak')),
  silent('src-prefix-trick',ev('FileSave','srcx/app.ts')),
  silent('uppercase-src',ev('FileSave','SRC/app.ts')),
  silent('null-byte',ev('FileSave','src/app.ts\u0000.md')),
  silent('newline-path',ev('FileSave','src/app.ts\nsrc/b.ts')),
  silent('space-path',ev('FileSave','src/my app.ts')),
  silent('unicode-path',ev('FileSave','src/\u0430pp.ts')),
  silent('empty-path',ev('FileSave','')),
  silent('number-path',JSON.stringify({hook_event_name:'FileSave',file_path:42})),
  silent('object-path',JSON.stringify({hook_event_name:'FileSave',file_path:{p:'src/app.ts'}})),
  silent('just-over-limit',JSON.stringify({hook_event_name:'FileSave',file_path:'src/app.ts',pad:'a'.repeat(8193)})),
  silent('multibyte-over-limit',JSON.stringify({hook_event_name:'FileSave',file_path:'src/app.ts',pad:'\u00e9'.repeat(4100)}))
];

test('V3 FileSave, unrelated events, malformed, boundary and private-data cases',async()=>{
  const r=await evaluateHandler(handler,{cases:extraCases});
  assert.equal(r.status,'SYNTHETIC_CONTRACT_PASS_ONLY',JSON.stringify(r.failed));
  assert.equal(r.passed,extraCases.length);
});

test('payload at exactly the stdin limit still warns',async()=>{
  const base=JSON.stringify({hook_event_name:'FileSave',file_path:'src/app.ts',pad:''});
  const payload=JSON.stringify({hook_event_name:'FileSave',file_path:'src/app.ts',pad:'a'.repeat(8192-Buffer.byteLength(base))});
  assert.equal(Buffer.byteLength(payload),8192);
  const r=await evaluateHandler(handler,{cases:[warn('exact-limit',payload)]});
  assert.equal(r.status,'SYNTHETIC_CONTRACT_PASS_ONLY',JSON.stringify(r.failed));
});

test('pure decision function: fixed output only, never echoes input',()=>{
  assert.equal(decide(ev('FileSave','src/app.ts')),WARNING);
  assert.equal(decide(ev('PostFileSave','src/a/b.mjs')),WARNING);
  assert.equal(decide(ev('FileSave','README.md')),null);
  assert.equal(decide(''),null);
  assert.equal(decide('{'),null);
  assert.equal(decide(undefined),null);
  const out=decide(ev('FileSave','src/canary_private_key.ts'));
  assert.equal(out,WARNING);
  assert.ok(!/canary/i.test(out));
  assert.ok(Buffer.byteLength(WARNING+'\n')<=512);
  assert.ok(!/\b(passed|verified|correct)\b/i.test(WARNING));
});

test('path validator rejects non-strings and traversal',()=>{
  for(const v of [undefined,null,1,{},[],'src/../a.ts','src/./a.ts','../src/a.ts','src/.env','src/a.TS'])
    assert.equal(isSourcePath(v),false,String(v));
  assert.equal(isSourcePath('src/a.ts'),true);
});

test('hook config uses official PostFileSave, command, timeout<=5 and disabled by default',async()=>{
  const cfg=JSON.parse(await readFile(hookConfig,'utf8'));
  assert.equal(cfg.version,'v1');
  assert.equal(cfg.hooks.length,1);
  const h=cfg.hooks[0];
  assert.equal(h.name,'specter-source-change-warning');
  assert.equal(h.trigger,'PostFileSave');
  assert.equal(h.enabled,false);
  assert.equal(h.action.type,'command');
  assert.equal(h.action.command,'node scripts/kiro-hook-staleness-notice.mjs');
  assert.ok(Number.isInteger(h.timeout)&&h.timeout>0&&h.timeout<=5);
  const re=new RegExp(h.matcher);
  assert.ok(re.test('src/app.ts'));
  assert.ok(!re.test('README.md'));
});
