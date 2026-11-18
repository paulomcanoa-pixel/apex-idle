(function(root){
'use strict';
const instances=new WeakMap();
function start(options={}){
  const serviceWorker=options.serviceWorker??root.navigator?.serviceWorker;
  if(!serviceWorker)return {ready:Promise.resolve(null),dispose(){}};
  if(instances.has(serviceWorker))return instances.get(serviceWorker);
  const document=options.document??root.document;
  const reload=options.reload??(()=>root.location.reload());
  const schedule=options.setTimeout??root.setTimeout.bind(root);
  const cancel=options.clearTimeout??root.clearTimeout.bind(root);
  const labels={ready:'Nova versão. Recarregar',busy:'Atualizando…',retry:'Tente atualizar novamente',...options.labels};
  let registration=null,button=null,shownWorker=null,pending=null,timer=null,disposed=false,reloaded=false;
  const watched=new Map();
  function clearTimer(){if(timer!==null){cancel(timer);timer=null}}
  function removeButton(){button?.remove();button=null;shownWorker=null}
  function report(error){options.onError?.(error)}
  function finish(){
    if(reloaded||disposed)return;
    reloaded=true;pending=null;clearTimer();removeButton();reload();
  }
  function waiting(){
    const worker=registration?.waiting;
    return worker&&worker.state==='installed'&&worker!==serviceWorker.controller?worker:null;
  }
  function retry(error){
    pending=null;clearTimer();sync();
    if(button){button.disabled=false;button.textContent=labels.retry;button.removeAttribute('aria-busy')}
    report(error);
  }
  function accept(){
    if(pending||reloaded||disposed)return;
    const worker=waiting();
    if(!worker){
      // Activation may have completed between pointer-down and click.
      if(shownWorker&&serviceWorker.controller===shownWorker)finish();
      else sync();
      return;
    }
    pending={worker,previousController:serviceWorker.controller};
    button.disabled=true;button.textContent=labels.busy;button.setAttribute('aria-busy','true');
    timer=schedule(()=>retry(new Error('A atualização ainda não foi ativada.')),15000);
    // The controllerchange listener is installed before sending this message.
    try{worker.postMessage('SKIP_WAITING')}catch(error){retry(error)}
  }
  function watch(worker){
    if(!worker||watched.has(worker))return;
    const changed=()=>{
      if(pending?.worker===worker&&worker.state==='redundant')retry(new Error('A atualização foi substituída.'));
      else sync();
    };
    watched.set(worker,changed);worker.addEventListener('statechange',changed);
  }
  function sync(){
    if(disposed||reloaded)return;
    watch(registration?.installing);watch(registration?.waiting);
    if(pending)return;
    const worker=waiting();
    if(!worker||!serviceWorker.controller){removeButton();return}
    if(!button){
      button=document.createElement('button');button.type='button';button.className='v2-update';
      button.addEventListener('click',accept);document.body.append(button);
    }
    shownWorker=worker;button.disabled=false;button.textContent=labels.ready;button.removeAttribute('aria-busy');
  }
  function changedController(){
    if(pending&&serviceWorker.controller&&serviceWorker.controller!==pending.previousController){finish();return}
    // Another tab may activate a worker. Do not interrupt this tab's game.
    sync();
  }
  function dispose(){
    disposed=true;pending=null;clearTimer();removeButton();
    serviceWorker.removeEventListener('controllerchange',changedController);
    registration?.removeEventListener('updatefound',sync);
    for(const [worker,changed]of watched)worker.removeEventListener('statechange',changed);
    watched.clear();instances.delete(serviceWorker);
  }
  const handle={ready:null,dispose};instances.set(serviceWorker,handle);
  serviceWorker.addEventListener('controllerchange',changedController);
  handle.ready=Promise.resolve().then(()=>serviceWorker.register('/sw.js',{updateViaCache:'none'})).then(reg=>{
    if(disposed)return null;
    registration=reg;registration.addEventListener('updatefound',sync);sync();return reg;
  }).catch(error=>{dispose();report(error);return null});
  return handle;
}
const api={start};root.ApexUpdate=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
