// Start the real Specter UI against a new, isolated synthetic Git fixture.
// The fixture is created under OS temp, never inside the user's own repository.
import {rm} from 'node:fs/promises';
import {createJudgeFixture} from './create-judge-fixture.mjs';
import {createAppServer} from '../src/http-server.mjs';

let fixture,app,closing=false;
async function shutdown(){
  if(closing)return;
  closing=true;
  try{
    if(app)await app.close();
    if(fixture)await rm(fixture.dir,{recursive:true,force:true});
  }catch(e){process.stderr.write('Demo cleanup warning: '+e.message+'\n');}
}
try{
  fixture=await createJudgeFixture();
  app=await createAppServer({repoPath:fixture.dir,port:0});
  process.stdout.write('\nSPECTER AUDIT — SYNTHETIC JUDGE DEMO\n');
  process.stdout.write('Open: '+app.url+'\n');
  process.stdout.write('Three sample claim buttons return UNVERIFIED, PARTIAL, and SUPPORTED from real Git metadata.\n');
  process.stdout.write('The synthetic test receipt is not independently attested; no tests are executed by the application.\n');
  process.stdout.write('This demo creates a disposable Git repo under OS temp and cleans it up on exit.\n');
  process.stdout.write('Press Ctrl+C to stop.\n');
  process.on('SIGINT',()=>{void shutdown().then(()=>process.exit(0));});
  process.on('SIGTERM',()=>{void shutdown().then(()=>process.exit(0));});
}catch(err){
  process.stderr.write('Judge demo start failed: '+err.message+'\n');
  await shutdown();
  process.exitCode=1;
}
