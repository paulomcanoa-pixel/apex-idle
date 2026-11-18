'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const Model=require('./server/ranked-model.cjs'),API=require('./api/ranked');
function isolatedServer(){
  let db=Model.initial(),clock=Date.UTC(2026,10,18,12);
  const handler=API.createHandler(async action=>{
    const next=structuredClone(db);
    const value=action(next);
    db=next;
    return value;
  },()=>clock+=2000);
  return {handler,get db(){return db},advance(ms){clock+=ms}};
}
function environment(server=isolatedServer()){
  const {handler}=server;
  let cookie='';
  const requests=[],metrics=[];
  const node=()=>({className:'',html:'',append(){},querySelector(){return null},querySelectorAll(){return[]}});
  const ctx=vm.createContext({document:{createElement:node,activeElement:null},menus:{},bank:node(),location:{hash:'',origin:'https://apex.test'},Date,JSON,Math,Set,Map,Error,AbortController,setTimeout,clearTimeout,crypto,s:{},drawer:{open:true,dataset:{section:'pvp'}},SaveConfirmation:{ask:async()=>true},CarArt:{draw(){}},ApexCommercial:{record:(_,event,data)=>metrics.push({event,data})},ApexRender:{html:(el,html)=>{el.html=html},schedule:()=>()=>{}},openMenu(){}});
  ctx.window=ctx;ctx.fetch=async(url,options)=>{const body=options.body?JSON.parse(options.body):{};requests.push(body);let status,payload;const res={setHeader(key,value){if(key==='Set-Cookie')cookie=value.split(';')[0]},status(n){status=n;return this},json(data){payload=data}};await handler({method:options.method,headers:{host:'apex.test',origin:'https://apex.test',cookie},body,query:{}},res);return{ok:status>=200&&status<300,json:async()=>payload}};
  for(const file of ['src/social-view.js','ranked-ui.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
  const run=code=>vm.runInContext(code,ctx);return{ctx,run,requests,metrics,get db(){return server.db},get cookie(){return cookie},get player(){return Model.authenticate(server.db,cookie.slice(11))}};
}
test('interface online → API → escuderia → três tentativas produz estado e HTML coerentes',async()=>{
 const e=environment();await e.run("fetchRanked('register',{name:'Aurora teste'})");await e.run("submitSocial('crewCreate',{name:'Aurora coletiva'})");assert.equal(e.run('onlineError'),'');assert(!Object.hasOwn(e.requests.at(-1),'sort'));assert(e.requests.at(-1).requestId);e.run("onlineTab='crew';renderOnline()");assert.match(e.run('rankedPanel.html'),/Aurora coletiva/);assert.match(e.run('rankedPanel.html'),/crewProgressArt/);
 for(let i=0;i<3;i++){await e.run("onlineClick({target:{matches:()=>false,closest:selector=>selector==='[data-online]'?{dataset:{online:'trial'}}:null}})");while(e.run('onlineBusy'))await new Promise(r=>setTimeout(r,1))}assert.equal(e.run('onlineState.social.crew.points'),30);assert.equal(e.run('onlineState.social.crew.dailyRemaining'),0);assert.equal(e.run('onlineState.challenge.remaining'),2);assert.equal(e.run('onlineError'),'');
});
test('formulários preservam rascunho em erro e repetem pedido com o mesmo identificador',async()=>{
 const e=environment();await e.run("fetchRanked('register',{name:'Piloto local'})");e.run("socialDrafts.crewCode='E-000000000000'");await e.run("submitSocial('crewJoin',{code:socialDrafts.crewCode})");const id=e.requests.at(-1).requestId;assert.match(e.run('onlineError'),/não encontrada/);assert.equal(e.run('socialDrafts.crewCode'),'E-000000000000');await e.run("submitSocial('crewJoin',{code:socialDrafts.crewCode})");assert.equal(e.requests.at(-1).requestId,id);
});
test('interface exibe pedido recebido e permite aceite pela API sem compartilhar segredo',async()=>{
 const e=environment();await e.run("fetchRanked('register',{name:'Piloto local'})");const friend=Model.register(e.db,{id:'friend-local',key:'secret-only-test',name:'Outro piloto',ip:'test'},Date.now());Model.socialAction(e.db,friend,{action:'friendRequest',code:Model.socialView(e.db,e.player,Date.now()).friendCode,requestId:'friend-request-local'},Date.now(),'unused');await e.run('fetchRanked()');e.run("onlineTab='friends';renderOnline()");assert.match(e.run('rankedPanel.html'),/friendAccept/);assert(!e.run('rankedPanel.html').includes('secret-only-test'));const code=Model.socialView(e.db,friend,Date.now()).friendCode;await e.run('submitSocial("friendAccept",{code:'+JSON.stringify(code)+'})');assert.equal(e.run('onlineState.social.friends.length'),1);assert.equal(e.run('onlineState.social.incoming.length'),0);
});
test('polling silencioso não bloqueia ação e uma resposta antiga não desfaz a escuderia criada',async()=>{const e=environment();await e.run("fetchRanked('register',{name:'Piloto polling'})");const original=e.ctx.fetch;let release,held=true;const barrier=new Promise(r=>release=r);e.ctx.fetch=async(...args)=>{const response=await original(...args);if(held){held=false;await barrier}return response};const poll=e.run('fetchRanked(undefined,{}, {background:true})');await new Promise(r=>setTimeout(r,5));assert.equal(e.run('onlineBusy'),false);await e.run("submitSocial('crewCreate',{name:'Equipe nova'})");release();await poll;assert.equal(e.run('onlineState.social.crew.name'),'Equipe nova');assert.equal(e.run('onlinePollInFlight'),false)});
test('resposta de polling preserva campo que ganhou foco durante a requisição',async()=>{const e=environment();await e.run("fetchRanked('register',{name:'Piloto foco'})");let paints=0;e.ctx.ApexRender.html=()=>paints++;const original=e.ctx.fetch;let release;const barrier=new Promise(r=>release=r);e.ctx.fetch=async(...args)=>{const response=await original(...args);await barrier;return response};const poll=e.run('fetchRanked(undefined,{}, {background:true})');await new Promise(r=>setTimeout(r,5));e.ctx.document.activeElement={matches:()=>true};release();await poll;assert.equal(paints,0);assert.equal(e.run('onlineBusy'),false)});

test('polling recuperado remove erro transitório sem exigir ação manual',async()=>{const e=environment();await e.run("fetchRanked('register',{name:'Piloto recuperação'})");const original=e.ctx.fetch;e.ctx.fetch=async()=>{throw Error('Falha temporária')};await e.run('fetchRanked(undefined,{}, {background:true})');assert.equal(e.run('onlineError'),'Falha temporária');e.ctx.fetch=original;await e.run('fetchRanked(undefined,{}, {background:true})');assert.equal(e.run('onlineError'),'');assert(e.run('onlineState.me'))});

test('duas sessões independentes entram por convite, contribuem, repetem a tentativa e viram a semana',async()=>{
  const server=isolatedServer();
  const owner=environment(server),guest=environment(server);
  await owner.run("fetchRanked('register',{name:'Aurora teste'})");
  await guest.run("fetchRanked('register',{name:'Piloto visitante'})");
  assert.notEqual(owner.cookie,guest.cookie);

  await owner.run("submitSocial('crewCreate',{name:'Escuderia teste'})");
  const code=owner.run('onlineState.social.crew.code');
  await guest.run("submitSocial('crewJoin',{code:"+JSON.stringify(code)+"})");
  assert.equal(guest.run('onlineState.social.crew.members.length'),2);
  assert.equal(guest.run('onlineState.social.crew.isOwner'),false);

  for(const [i,session] of [owner,guest].entries()){
    const payload={car:session.run('onlineState.challenge.cars[0].id'),style:'balanced',requestId:'coop-pilot-0'+i};
    const submit=()=>session.run("fetchRanked('timeTrial',"+JSON.stringify(payload)+")");
    await submit();
    assert.equal(session.run('onlineError'),'');
    assert.equal(session.run('onlineState.social.crew.ownPoints'),10);
    await submit();
    assert.equal(session.run('onlineState.social.crew.ownPoints'),10);
    assert.equal(session.run('onlineState.challenge.attempts'),1);
  }

  await owner.run('fetchRanked()');
  assert.equal(owner.run('onlineState.social.crew.points'),20);
  const week=owner.run('onlineState.social.crew.week');
  server.advance(7*86400000);
  await owner.run('fetchRanked()');
  await guest.run('fetchRanked()');
  for(const session of [owner,guest]){
    assert.notEqual(session.run('onlineState.social.crew.week'),week);
    assert.equal(session.run('onlineState.social.crew.points'),0);
    assert.equal(session.run('onlineState.social.crew.members.length'),2);
    assert.equal(session.run('onlineState.social.crew.dailyRemaining'),3);
  }
});
