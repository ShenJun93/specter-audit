// Generate a verifiable, immutable hosted snapshot from a real disposable Git repository.
// Run locally before committing/deploying; Vercel does NOT need Git at runtime.
import {writeFile} from 'node:fs/promises';
import {createJudgeFixture} from './create-judge-fixture.mjs';
import {inspectRepository} from '../src/git-inspector.mjs';
import {rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

let fixture;
try{
  fixture=await createJudgeFixture();
  const i=await inspectRepository(fixture.dir);
  if(!i.ok||i.head!==fixture.head||!i.dirty||i.unstaged.length<1)throw Error('Fixture Git evidence invalid');
  const basename='synthetic-judge-fixture';
  const truncate=a=>a.slice(0,100);
  const snapshot={
    schema:'SPECTER_VERIFIED_SYNTHETIC_GIT_SNAPSHOT_V1',
    generatedAt:new Date().toISOString(),
    provenance:'Precomputed from a real disposable Git repository using inspectRepository(); this is NOT a live scan of the visitor filesystem.',
    demoMode:true,
    ok:true,
    repo:basename,
    head:i.head,
    unborn:i.unborn,
    clean:i.clean,
    dirty:i.dirty,
    staged:truncate(i.staged),
    unstaged:truncate(i.unstaged),
    untracked:truncate(i.untracked),
    renamed:truncate(i.renamed),
    total:{staged:i.staged.length,unstaged:i.unstaged.length,untracked:i.untracked.length,renamed:i.renamed.length},
    truncated:false,
    warnings:[],
  };
  // Never serialize the absolute OS temp path or user-specific environment.
  const data=JSON.stringify(snapshot,null,2);
  if(data.includes(fixture.dir))throw Error('Unexpected path disclosure');
  const target=new URL('../hosted/snapshot.mjs',import.meta.url);
  await writeFile(target,'// Generated from actual synthetic Git evidence; see scripts/build-hosted-snapshot.mjs\nexport const snapshot = Object.freeze('+data+');\n','utf8');
  process.stdout.write('HOSTED_SNAPSHOT_GENERATED='+fileURLToPath(target)+'\n');
  process.stdout.write('EVIDENCE_HEAD='+i.head+'\n');
  process.stdout.write('REAL_CHANGED_PATHS='+JSON.stringify(i.unstaged.map(x=>x.path))+'\n');
}finally{
  if(fixture)await rm(fixture.dir,{recursive:true,force:true});
}
