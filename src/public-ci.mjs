// Fixed, public GitHub release CI evidence. Never accepts request-selected URLs.
// Separate from the live local Git inspector and synthetic hosted Git fixture.
import { fetchGithubActionsEvidence } from './github-actions-evidence.mjs';

export const PUBLIC_RELEASE_CI = Object.freeze({
  owner: 'ShenJun93',
  repo: 'specter-audit',
  sha: '374af1417b714619d9edc1af790f7e7db15a71ca',
  workflowId: 405703749,
  label: 'Production merge release (2026-11-04, 374af14)',
});

export async function readPublicReleaseCI({ fetchImpl = globalThis.fetch } = {}) {
  const evidence = await fetchGithubActionsEvidence({
    owner: PUBLIC_RELEASE_CI.owner,
    repo: PUBLIC_RELEASE_CI.repo,
    sha: PUBLIC_RELEASE_CI.sha,
    workflowId: PUBLIC_RELEASE_CI.workflowId,
    enabled: true,
    fetchImpl,
  });
  return {
    scope: 'FIXED_PUBLIC_RELEASE_CI',
    release: PUBLIC_RELEASE_CI,
    evidence,
    limitation: 'GitHub provider status is not signed attestation, not code correctness, and not the inspected local/synthetic repository.',
  };
}
