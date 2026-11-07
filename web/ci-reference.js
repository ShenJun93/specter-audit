// M16: user-triggered copy of a fixed historical GitHub CI verification recipe.
// Never sign a new artifact, fetch a provider, or infer a verdict for an inspected PR.
const button=document.getElementById('ci-reference-copy');
const status=document.getElementById('ci-reference-copy-status');
const code=document.getElementById('ci-reference-command');
if(button&&status&&code){
 button.addEventListener('click',async()=>{
  const command=code.textContent.trim();
  if(!command){status.textContent='Verification commands are unavailable.';return}
  try{
   if(!navigator.clipboard?.writeText)throw Error('CLIPBOARD_UNAVAILABLE');
   await navigator.clipboard.writeText(command);
   status.textContent='Commands copied. Independently inspect the artifact before trusting it.';
  }catch{
   status.textContent='Clipboard unavailable. Select and copy the commands above manually.';
  }
 });
}
