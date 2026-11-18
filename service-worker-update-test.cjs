const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const Update=require('./src/core/service-worker-update');

class Worker extends EventTarget{
  constructor(state='installed'){super();this.state=state;this.messages=[]}
  postMessage(message){this.messages.push(message);this.onPost?.()}
  change(state){this.state=state;this.dispatchEvent(new Event('statechange'))}
}
function fixture({controlled=true,waiting=true,registerError=null}={}){
  const nodes=[],timers=new Map(),errors=[];
  let timerId=0,reloads=0;
  const worker=new Worker(),previous=new Worker('activated');
  const registration=Object.assign(new EventTarget(),{waiting:waiting?worker:null,installing:null});
  const serviceWorker=Object.assign(new EventTarget(),{
    controller:controlled?previous:null,
    async register(url,options){this.registered={url,options};if(registerError)throw registerError;return registration}
  });
  const document={body:{append(node){nodes.push(node)}},createElement(){
    const node=Object.assign(new EventTarget(),{attrs:{},disabled:false,
      setAttribute(key,value){this.attrs[key]=value},removeAttribute(key){delete this.attrs[key]},
      remove(){const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1)},
      click(){if(!this.disabled)this.dispatchEvent(new Event('click'))}
    });return node;
  }};
  const options={serviceWorker,document,reload(){reloads++},onError(error){errors.push(error)},
    setTimeout(fn){const id=++timerId;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}};
  const updater=Update.start(options);
  function activate(){registration.waiting=null;worker.change('activated');serviceWorker.controller=worker;serviceWorker.dispatchEvent(new Event('controllerchange'))}
  return {updater,options,nodes,timers,errors,worker,previous,registration,serviceWorker,activate,get reloads(){return reloads}};
}

test('primeira instalação não pede atualização nem recarrega',async()=>{
  const f=fixture({controlled:false});await f.updater.ready;
  assert.equal(f.nodes.length,0);f.activate();assert.equal(f.reloads,0);assert.equal(f.nodes.length,0);
  assert.deepEqual(f.serviceWorker.registered,{url:'/sw.js',options:{updateViaCache:'none'}});f.updater.dispose();
});

test('eventos repetidos e inicialização duplicada mantêm um único aviso',async()=>{
  const f=fixture();await f.updater.ready;
  const button=f.nodes[0];
  assert.equal(Update.start(f.options),f.updater);
  for(let i=0;i<4;i++){f.registration.dispatchEvent(new Event('updatefound'));f.worker.change('installed')}
  assert.equal(f.nodes.length,1);assert.equal(f.nodes[0],button);assert.equal(button.type,'button');f.updater.dispose();
});

test('recarrega uma vez somente após o novo worker assumir o controle',async()=>{
  const f=fixture();await f.updater.ready;
  f.nodes[0].click();f.nodes[0].click();
  assert.deepEqual(f.worker.messages,['SKIP_WAITING']);assert.equal(f.reloads,0);
  assert.equal(f.nodes[0].disabled,true);assert.equal(f.nodes[0].attrs['aria-busy'],'true');
  f.worker.change('activating');assert.equal(f.reloads,0);
  f.registration.waiting=null;f.worker.change('activated');assert.equal(f.reloads,0);
  f.serviceWorker.controller=f.worker;f.serviceWorker.dispatchEvent(new Event('controllerchange'));
  f.serviceWorker.dispatchEvent(new Event('controllerchange'));
  assert.equal(f.reloads,1);assert.equal(f.nodes.length,0);assert.equal(f.timers.size,0);f.updater.dispose();
});

test('observa controllerchange antes de enviar SKIP_WAITING',async()=>{
  const f=fixture();await f.updater.ready;
  f.worker.onPost=f.activate;f.nodes[0].click();assert.equal(f.reloads,1);assert.equal(f.nodes.length,0);f.updater.dispose();
});

test('instalação encontrada depois da abertura exibe aviso ao ficar pronta',async()=>{
  const f=fixture({waiting:false});await f.updater.ready;assert.equal(f.nodes.length,0);
  f.worker.state='installing';f.registration.installing=f.worker;f.registration.dispatchEvent(new Event('updatefound'));
  assert.equal(f.nodes.length,0);f.registration.waiting=f.worker;f.worker.change('installed');
  assert.equal(f.nodes.length,1);f.updater.dispose();
});

test('ativação por outra aba remove aviso sem interromper a partida',async()=>{
  const f=fixture();await f.updater.ready;f.activate();
  assert.equal(f.nodes.length,0);assert.equal(f.reloads,0);assert.equal(f.worker.messages.length,0);f.updater.dispose();
});

test('clique em aviso cuja ativação acabou de concluir não manda mensagem obsoleta',async()=>{
  const f=fixture();await f.updater.ready;const button=f.nodes[0];
  f.registration.waiting=null;f.worker.state='activated';f.serviceWorker.controller=f.worker;
  button.click();assert.equal(f.reloads,1);assert.equal(f.worker.messages.length,0);assert.equal(f.nodes.length,0);f.updater.dispose();
});

test('worker descartado não deixa aviso permanente nem força recarga',async()=>{
  const f=fixture();await f.updater.ready;f.nodes[0].click();f.registration.waiting=null;f.worker.change('redundant');
  assert.equal(f.nodes.length,0);assert.equal(f.reloads,0);assert.equal(f.timers.size,0);assert.equal(f.errors.length,1);f.updater.dispose();
});

test('falha no envio permite tentar de novo sem perder o controle da atualização',async()=>{
  const f=fixture();await f.updater.ready;f.worker.onPost=()=>{throw new Error('Falha temporária')};
  f.nodes[0].click();assert.equal(f.reloads,0);assert.equal(f.nodes[0].disabled,false);assert.equal(f.timers.size,0);
  assert.equal(f.nodes[0].textContent,'Tente atualizar novamente');assert.equal(f.errors.length,1);
  f.worker.onPost=undefined;f.nodes[0].click();f.activate();assert.equal(f.reloads,1);f.updater.dispose();
});

test('tempo de espera esgotado permite nova tentativa e nunca força recarga prematura',async()=>{
  const f=fixture();await f.updater.ready;f.nodes[0].click();[...f.timers.values()][0]();
  assert.equal(f.reloads,0);assert.equal(f.nodes[0].disabled,false);assert.equal(f.timers.size,0);
  f.nodes[0].click();f.activate();assert.equal(f.reloads,1);f.updater.dispose();
});

test('falha de registro é tratada e uma tentativa posterior pode registrar novamente',async()=>{
  const error=new Error('Offline');const f=fixture({registerError:error});assert.equal(await f.updater.ready,null);
  assert.deepEqual(f.errors,[error]);assert.equal(f.nodes.length,0);assert.equal(f.reloads,0);
  f.serviceWorker.register=async()=>f.registration;const retry=Update.start(f.options);assert.notEqual(retry,f.updater);
  await retry.ready;assert.equal(f.nodes.length,1);retry.dispose();
});

test('encerramento remove eventos e espera pendente sem recarregar',async()=>{
  const f=fixture();await f.updater.ready;f.nodes[0].click();f.updater.dispose();f.activate();
  assert.equal(f.nodes.length,0);assert.equal(f.timers.size,0);assert.equal(f.reloads,0);
});

test('worker mantém o evento de mensagem vivo até concluir skipWaiting',async()=>{
  const listeners={},activation=Promise.resolve();let skipped=0,keptAlive=null;
  vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self:{addEventListener(name,fn){listeners[name]=fn},skipWaiting(){skipped++;return activation}}});
  listeners.message({data:'SKIP_WAITING',waitUntil(promise){keptAlive=promise}});
  assert.equal(skipped,1);assert.equal(keptAlive,activation);await keptAlive;
  listeners.message({data:'IGNORED',waitUntil(){assert.fail('Mensagem não reconhecida')}});assert.equal(skipped,1);
});
