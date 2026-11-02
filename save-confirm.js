(function(){
const dialog=document.createElement('dialog');dialog.id='saveRestoreConfirm';dialog.className='night-season-dialog';dialog.setAttribute('aria-labelledby','saveRestoreConfirmTitle');dialog.innerHTML='<h2 id="saveRestoreConfirmTitle">Restaurar progresso?</h2><p id="saveRestoreConfirmMessage"></p><p>Uma cópia do progresso atual será preservada neste navegador.</p><button id="saveRestoreCancel">Cancelar</button><button class="primary" id="saveRestoreApply">Restaurar progresso</button>';document.body.append(dialog);let pending=null;
function finish(value){if(!pending)return;const done=pending;pending=null;dialog.close();done(value)}
document.getElementById('saveRestoreCancel').onclick=()=>finish(false);document.getElementById('saveRestoreApply').onclick=()=>finish(true);dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false)});dialog.addEventListener('close',()=>finish(false));
window.SaveConfirmation={ask(message){if(pending)return Promise.resolve(false);return new Promise(resolve=>{pending=resolve;document.getElementById('saveRestoreConfirmMessage').textContent=message;dialog.showModal()})}};
})();
