import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PUBLIC_RELEASE_CI } from '../src/public-ci.mjs';
import { createRecordedCiSnapshot } from '../scripts/capture-public-ci.mjs';
import { createAppServer } from '../src/http-server.mjs';
import { makeTempDir, initRepo, writeRel, commitAll, cleanup } from './helpers.mjs';

const RUN_ID = 41736082288;
const CI_API_URL = 'https://api.github.com/repos/ShenJun93/specter-audit/actions/workflows/405703749/runs?head_sha=' +
  PUBLIC_RELEASE_CI.sha + '&per_page=100&page=1';

function responseForFixedPublicCI() {
  return Response.json({
    total_count: 1,
    workflow_runs: [{
      id: RUN_ID, head_sha: PUBLIC_RELEASE_CI.sha,
      workflow_id: PUBLIC_RELEASE_CI.workflowId,
      run_number: 6, run_attempt: 1,
      status: 'completed', conclusion: 'success',
      updated_at: '2026-11-03T23:04:05Z',
      html_url: 'https://github.com/ShenJun93/specter-audit/actions/runs/' + RUN_ID,
    }],
  });
}

test('hosted CI is a static file with recorded timestamp and exact release provenance', async () => {
  const file = fileURLToPath(new URL('../web/ci-evidence.json', import.meta.url));
  const raw = await readFile(file, 'utf8');
  const record = JSON.parse(raw);
  assert.equal(record.scope, 'FIXED_PUBLIC_RELEASE_CI');
  assert.equal(record.mode, 'RECORDED');
  assert.ok(Number.isFinite(Date.parse(record.capturedAt)));
  assert.equal(record.release.owner, PUBLIC_RELEASE_CI.owner);
  assert.equal(record.release.repo, PUBLIC_RELEASE_CI.repo);
  assert.equal(record.release.workflowId, PUBLIC_RELEASE_CI.workflowId);
  assert.equal(record.release.sha, PUBLIC_RELEASE_CI.sha);
  assert.equal(record.evidence.sha, PUBLIC_RELEASE_CI.sha);
  assert.equal(record.evidence.workflowId, String(PUBLIC_RELEASE_CI.workflowId));
  assert.ok(['PROVIDER_REPORTED_SUCCESS','PROVIDER_REPORTED_FAILED'].includes(record.evidence.verdict));
  assert.equal(record.evidence.sourceUrl,
    'https://github.com/ShenJun93/specter-audit/actions/runs/' + record.evidence.runId);
  assert.equal(record.evidence.cryptographicAttestation, false);
  assert.equal(record.evidence.independentlyAttested, false);
  assert.equal(record.evidence.correctness, false);
  assert.match(record.limitation, /not live/i);
  assert.ok((await stat(file)).size < 16384);
});

test('no publicly deployed dynamic provider API handler remains', () => {
  assert.equal(existsSync(fileURLToPath(new URL('../api/provider-evidence.js', import.meta.url))), false);
});

test('capture refuses wrong SHA, missing run number, and invalid GitHub run URL', () => {
  const evidence = {
    verdict:'PROVIDER_REPORTED_SUCCESS',
    sha:PUBLIC_RELEASE_CI.sha,
    workflowId: String(PUBLIC_RELEASE_CI.workflowId),
    runId:String(RUN_ID), runNumber:6, runAttempt:1,
    sourceUrl:'https://github.com/ShenJun93/specter-audit/actions/runs/'+RUN_ID,
    providerStatus:'completed', conclusion:'success', updatedAt:'2026-11-03T23:04:05Z',
  };
  const source={scope:'FIXED_PUBLIC_RELEASE_CI',evidence};
  const at='2026-11-04T00:00:00Z';
  assert.equal(createRecordedCiSnapshot(source,at).mode,'RECORDED');
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,sha:'0'.repeat(40)}},at),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,runNumber:null}},at),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,sourceUrl:'https://evil.example/runs/1'}},at),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,verdict:'UNKNOWN'}},at),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,providerStatus:'in_progress'}},at),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,conclusion:'failure'}},at),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,updatedAt:'invalid'}},at),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot(source,'2026-11-03T22:00:00Z'),/Refuse/);
  assert.throws(()=>createRecordedCiSnapshot({...source,evidence:{...evidence,sourceUrl:'https://github.com/ShenJun93/specter-audit/actions/runs/2'}},at),/Refuse/);
});

test('local HTTP provider endpoint never calls GitHub without explicit click/consent', async () => {
  const dir = await makeTempDir('specter public ci route ');
  let app;
  let calls = 0;
  let capturedUrl;
  try {
    await initRepo(dir);
    await writeRel(dir, 'README.txt', 'local fixture');
    await commitAll(dir, 'baseline');
    app = await createAppServer({repoPath:dir, port:0, publicCiFetchImpl:async (url) => {
      calls++;
      capturedUrl=url;
      return responseForFixedPublicCI();
    }});
    const u = (path) => app.url + path;
    assert.equal((await fetch(u('/api/inspection'))).status, 200);
    assert.equal((await fetch(u('/api/provider-evidence'))).status, 405);
    assert.equal((await fetch(u('/api/provider-evidence'), {method:'POST'})).status, 403);
    assert.equal((await fetch(u('/api/provider-evidence'), {
      method:'POST', headers:{ Origin:'https://evil.invalid', 'X-Specter-CI-Consent':'public-release' },
    })).status, 403);
    assert.equal((await fetch(u('/api/provider-evidence'), {
      method:'POST', headers:{ 'X-Specter-CI-Consent':'public-release', 'Content-Type':'application/json' },
      body:JSON.stringify({repo:'evil'}),
    })).status, 413);
    assert.equal(calls, 0);
    const r = await fetch(u('/api/provider-evidence?owner=evil&workflowId=0'), {
      method:'POST', headers:{'X-Specter-CI-Consent':'public-release'},
    });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.scope, 'FIXED_PUBLIC_RELEASE_CI');
    assert.equal(body.release.owner, 'ShenJun93');
    assert.equal(body.evidence.verdict, 'PROVIDER_REPORTED_SUCCESS');
    assert.equal(body.evidence.sha, PUBLIC_RELEASE_CI.sha);
    assert.equal(calls, 1);
    assert.equal(capturedUrl, CI_API_URL);
  } finally {
    if (app) await app.close();
    await cleanup(dir);
  }
});
