(function(){
'use strict';
const Loot=ApexLoot,Art=ApexLootArt,Ret=ApexRetention,fmt=n=>GameFormat.format(n,s.idle.settings.notation);
const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const dialog=make('dialog',undefined,'loot-panel'),title=make('h2','Caixas da escuderia'),close=make('button','Fechar');
const message=make('p','Ganhe caixas jogando. Elas não expiram.','loot-note');
const error=make('p',undefined,'loot-error');error.setAttribute('role','alert');
dialog.setAttribute('aria-label','Caixas da escuderia');close.onclick=()=>dialog.close();dialog.append(close,title,message,error);document.body.append(dialog);
const cards=new Map;
function action(label,handler){const b=make('button',label);b.type='button';b.onclick=handler;return b}
function svg(parent,markup){parent.innerHTML=markup} // Apenas arte estática do módulo local.
for(const kind of ['afk','online']){
  const card=make('article',undefined,'loot-box'),art=make('div',undefined,'loot-box-art'),h=make('h3',kind==='afk'?'Caixa AFK':'Caixa Online');
  const status=make('p'),bar=make('progress'),info=make('p'),open=action('Abrir caixa',()=>openBox(kind)),odds=action('Probabilidades',()=>showOdds());
  bar.max=1;bar.setAttribute('aria-label','Enchimento da '+h.textContent);
  card.append(art,h,status,bar,info,open,odds);dialog.append(card);cards.set(kind,{card,art,status,bar,info,open,tier:null});
}
const oddsDialog=make('dialog',undefined,'loot-panel loot-odds');oddsDialog.setAttribute('aria-label','Probabilidades das caixas');document.body.append(oddsDialog);
function showOdds(){
  oddsDialog.replaceChildren(action('Fechar',()=>oddsDialog.close()),make('h2','Probabilidades das caixas'));
  oddsDialog.append(make('p','Probabilidades por carta, antes das garantias.'));
  for(const tier of Loot.TIERS){
    const data=Loot.odds(tier),section=make('section');section.append(make('h3',data.name+' · '+data.draws+' cartas'));
    for(const r of data.rarities)section.append(make('p',r.name+': '+r.percent.toLocaleString('pt-BR')+'%'));
    section.append(make('p',data.guarantee||'Sem garantia adicional por caixa.'),make('p',data.pity));oddsDialog.append(section);
  }
  oddsDialog.showModal();
}
function report(failure){console.error('ApexLootUI:',failure);error.textContent=failure.message||String(failure);if(!dialog.open)dialog.showModal()}
function refresh(){
  const state=Loot.init(s);let ready=0;
  for(const [kind,row]of cards){
    const st=Loot.status(s,kind),tier=st.tier||'bronze';if(st.ready)ready++;
    if(row.tier!==tier){svg(row.art,Art.box(kind,tier));row.tier=tier}
    ApexRender.text(row.status,st.full?'Cheia · abra quando quiser':st.tier?'Tier '+Loot.TIER_NAME[st.tier]:'Em preparação');
    ApexRender.prop(row.bar,'value',st.fraction);
    ApexRender.text(row.info,kind==='afk'?(st.value/3600).toFixed(1)+' / 8 h fora':Math.floor(st.value)+' / 130 pontos');
    ApexRender.prop(row.open,'disabled',!!openingKind||!st.ready||!ApexAccess.canWrite());
    ApexRender.text(row.open,openingKind===kind?'Abrindo…':st.ready?'Abrir '+Loot.TIER_NAME[st.tier]:'Continue para subir de tier');
  }
  ApexRender.text(launch,'Caixas · '+ready+'/2');ApexRender.text(fragmentCount,fmt(state.fragments)+' fragmentos de caixa');
  if(s.lootError){error.textContent=s.lootError;delete s.lootError}
  if(collection.open)renderCollection();
}
function show(){refresh();if(!dialog.open)dialog.showModal()}
let openingKind = null;
function openBox(kind){
  if(openingKind||!ApexAccess.canWrite())return;
  const player = s;
  openingKind = kind;
  for(const row of cards.values()) row.open.disabled = true;
  cards.get(kind).open.textContent = 'Abrindo…';
  // Mostre o botão ocupado antes da rolagem e da gravação síncrona do save.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try{
      if(!dialog.open||s!==player||!ApexAccess.canWrite())return;
      const result=ApexLootTransaction.open(s,kind,{income:Ret.income(s),now:Date.now(),persist:()=>save()});
      if(!result)return;error.textContent='';dialog.close();
      if(resultDialog.open)resultDialog.close();
      ApexLootCinema.play({kind,result,targets:{cr:'#wallet_money',fragments:fragmentCount},format:fmt,sound:s.loot.settings.sound,
        onSoundChange:value=>{s.loot.settings.sound=value;save()},onLand:()=>{const target=$('wallet_money');if(target&&s.idle.settings.effects!=='off')ApexEffects.pulse(target)},onDone:()=>{refresh();launch.focus()}});
    }catch(failure){report(failure)}
    finally{openingKind=null;if(dialog.open)refresh();}
  }));
}
const fragmentCount=make('p'),collection=make('dialog',undefined,'loot-panel');collection.setAttribute('aria-label','Itens e forja das caixas');document.body.append(collection);
let collectionStamp='';
function renderCollection(){
  const state=Loot.init(s),stamp=JSON.stringify([state.owned,state.fragments,state.equipped]);if(stamp===collectionStamp)return;collectionStamp=stamp;
  collection.replaceChildren(action('Fechar',()=>collection.close()),make('h2','Itens e forja'),make('p',fmt(state.fragments)+' fragmentos'));
  collection.append(make('p','Peças das caixas são colecionáveis nesta versão e não alteram o PI.'));
  for(const item of Loot.ITEMS.filter(x=>x.ownable)){
    const row=make('article',undefined,'loot-item'),picture=make('div');svg(picture,Art.card(item.art,item.rarity));
    row.append(picture,make('h3',item.name),make('p',Loot.RARITY_NAME[item.rarity]));
    if(state.owned[item.id])row.append(make('strong','Obtido'));
    else{const cost=Loot.CFG.craftCost[Loot.RARITIES.indexOf(item.rarity)],button=action('Forjar · '+cost,()=>{
      if(!ApexAccess.canWrite())return;const before=JSON.parse(JSON.stringify(s.loot));
      try{const result=Loot.craft(s,item.id);if(!result.ok)throw Error(result.reason);if(!save()){s.loot=before;throw Error('Não foi possível salvar. Fragmentos preservados.')}renderCollection();refresh()}
      catch(failure){report(failure)}
    });button.disabled=state.fragments<cost;row.append(button)}collection.append(row);
  }
}
dialog.append(fragmentCount,action('Itens e forja',()=>{renderCollection();collection.showModal()}),action('Probabilidades das caixas',showOdds));
const launch=action('Caixas · 0/2',show);launch.id='lootOpenPanel';document.querySelector('.track-shortcuts').append(launch);
const moreButton=action('Caixas AFK e Online',show),oddsButton=action('Probabilidades das caixas',showOdds);
menus.compactMore.node.append(moreButton,oddsButton);
const notify=make('label'),notifyInput=make('input');notifyInput.type='checkbox';notify.append(notifyInput,document.createTextNode(' Avisar quando uma caixa estiver cheia (opcional)'));dialog.append(notify);
notifyInput.checked=s.loot.settings.notify===true;notifyInput.onchange=async()=>{
  if(notifyInput.checked&&'Notification'in window){const permission=await Notification.requestPermission();s.loot.settings.notify=permission==='granted';notifyInput.checked=s.loot.settings.notify}
  else s.loot.settings.notify=false;save();
};
window.addEventListener('apex-loot-error',event=>{error.textContent=event.detail;radio(event.detail)});
ApexRender.schedule('loot-panel',refresh,1000);
ApexRender.schedule('loot-notification',()=>{
  if(!document.hidden||!s.loot.settings.notify||typeof Notification==='undefined'||Notification.permission!=='granted')return;
  const day=ApexShop.day();if(s.loot.notifiedDay===day||!['afk','online'].some(kind=>Loot.status(s,kind).full))return;
  navigator.serviceWorker?.ready.then(reg=>reg.showNotification('Apex Idle',{body:'Uma caixa está cheia. Abra quando quiser.',tag:'apex-loot',icon:'/icons/icon-192.png'})).then(()=>{s.loot.notifiedDay=day;save()}).catch(failure=>console.error('Lembrete de caixa:',failure));
},60000,{background:true});
refresh();
})();
