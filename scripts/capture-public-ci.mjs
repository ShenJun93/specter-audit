// Operator-invoked only: refresh the fixed public-release CI record.
// NEVER imported by an HTTP handler. No credentials or arbitrary URL inputs.
import { writeFile, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPublicReleaseCI, PUBLIC_RELEASE_CI } from '../src/public-ci.mjs';

export function createRecordedCiSnapshot(source, capturedAt) {
  const e = source?.evidence;
  if (source?.scope !== 'FIXED_PUBLIC_RELEASE_CI' ||
      e?.verdict === 'UNKNOWN' ||
      !['PROVIDER_REPORTED_SUCCESS', 'PROVIDER_REPORTED_FAILED'].includes(e?.verdict) ||
      e.sha !== PUBLIC_RELEASE_CI.sha ||
      String(e.workflowId) !== String(PUBLIC_RELEASE_CI.workflowId) ||
      !/^[1-9]\d*$/.test(String(e.runId)) ||
      !Number.isSafeInteger(e.runNumber) || e.runNumber < 1 ||
      !Number.isSafeInteger(e.runAttempt) || e.runAttempt < 1 ||
      e.sourceUrl !== 'https://github.com/' + PUBLIC_RELEASE_CI.owner +
        '/' + PUBLIC_RELEASE_CI.repo + '/actions/runs/' + e.runId ||
      !Number.isFinite(Date.parse(capturedAt)) ||
      e.providerStatus !== 'completed' ||
      !Number.isFinite(Date.parse(e.updatedAt)) ||
      Date.parse(e.updatedAt) > Date.parse(capturedAt) ||
      (e.verdict === 'PROVIDER_REPORTED_SUCCESS'
        ? e.conclusion !== 'success'
        : (typeof e.conclusion !== 'string' || !e.conclusion || e.conclusion === 'success'))) {
    throw new Error('Refuse to publish incomplete, mismatched or unverified provider status');
  }
  return {
    scope: 'FIXED_PUBLIC_RELEASE_CI',
    mode: 'RECORDED',
    capturedAt,
    release: PUBLIC_RELEASE_CI,
    evidence: {
      verdict: e.verdict,
      provider: 'github-actions',
      sha: e.sha,
      workflowId: String(e.workflowId),
      runId: String(e.runId),
      runNumber: e.runNumber,
      runAttempt: e.runAttempt,
      sourceUrl: e.sourceUrl,
      providerStatus: e.providerStatus,
      conclusion: e.conclusion,
      updatedAt: e.updatedAt,
      independentlyAttested: false,
      cryptographicAttestation: false,
      correctness: false,
    },
    limitation: 'Recorded status from GitHub as of capturedAt, not live at viewing time. Provider report is not signed attestation or proof of correctness; it does not evaluate local or synthetic fixture code.',
  };
}

async function main() {
  if (process.argv.slice(2).join(' ') !== '--capture') {
    throw new Error('Explicit --capture required. No network call or file write made.');
  }
  const source = await readPublicReleaseCI();
  const capturedAt = new Date().toISOString();
  const snapshot = createRecordedCiSnapshot(source, capturedAt);
  const target = fileURLToPath(new URL('../web/ci-evidence.json', import.meta.url));
  const tmp = target + '.tmp-' + process.pid;
  try {
    await writeFile(tmp, JSON.stringify(snapshot, null, 2) + '\n', {flag:'wx'});
    await rename(tmp, target);
  } finally {
    await rm(tmp,{force:true}).catch(()=>{});
  }
  process.stdout.write(JSON.stringify({
    result:'RECORDED_PUBLIC_CI_CAPTURED',capturedAt,verdict:snapshot.evidence.verdict,
    runId:snapshot.evidence.runId,runNumber:snapshot.evidence.runNumber,
    runAttempt:snapshot.evidence.runAttempt,
  })+'\n');
}

if (process.argv[1] &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write('Public CI capture failed: ' + error.message + '\n');
    process.exitCode = 1;
  });
}
