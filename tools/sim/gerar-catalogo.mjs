// Gera entregas/apex-idle/shop-catalog.json. Precos em CR = formula sobre CR_volta do estagio.
import fs from 'node:fs';
const CATS=['Kart','F4','F3','F2','F1','Lendas'];
const R=[1,22,480,1e4,2.3e5,5e6];
const lapR=(n,c)=>Math.floor(14*1.3**n*R[c]);
const item=(o)=>({limit:'ilimitado',rarity:'comum',appears:['loja'],...o});
const items=[];
// componentes: 6 slots x 4 tiers
const slots=[['motor','Motor','potencia'],['aero','Aerodinamica','curvas'],['suspensao','Suspensao','curvas'],['freios','Freios','aderencia'],['cambio','Cambio','potencia'],['pneus','Pneus','aderencia']];
const tiers=[['club','Club','comum',0.005,3,{c:0,n:3}],['pro','Pro','raro',0.012,8,{c:0,n:8}],['elite','Elite','epico',0.020,20,{c:2,n:0}],['lenda','Lenda','lendario',0.025,50,{c:4,n:0}]];
const compNames={motor:['Unidade Faisca','Unidade Corisco','Unidade Trovao','Unidade Eclipse'],aero:['Asa Brisa','Asa Falcao','Asa Aurora','Asa Zenite'],suspensao:['Mola Terra','Mola Dunas','Mola Prisma','Mola Horizonte'],freios:['Disco Pedra','Disco Ferro','Disco Basalto','Disco Meteoro'],cambio:['Caixa Linha','Caixa Rio','Caixa Delta','Caixa Origem'],pneus:['Borracha Seixo','Borracha Trilha','Borracha Cometa','Borracha Rubi']};
for(const [sid,sn,type] of slots) tiers.forEach(([tid,tn,rar,pi,races,unl],ti)=>{
  items.push(item({id:'comp-'+sid+'-'+tid,name:compNames[sid][ti],category:'componentes',slot:sid,tier:tn,
    description:sn+' '+tn+': +'+(pi*100).toFixed(1)+'% de PI; x1,6 em pistas de '+type+', x0,7 nas demais.',
    currency:'cr',price:{formula:'races * 6.3 * lapReward(unlockStageIdx) * cScale[category]',races},
    example_price_at_unlock:Math.round(races*6.3*lapR(unl.c===0?unl.n-1:0,unl.c)),
    effect:{piPct:pi,matchType:type,matchMult:1.6,otherMult:0.7},
    unlock:{category:CATS[unl.c],stage:unl.c===0?unl.n:1},
    limit:'1 por slot e categoria (fica no inventario apos Nova Temporada)',rarity:rar,appears:['loja/componentes']}));
});
// carros: 5 raridades x 6 categorias
const carBase=['Kestrel','Falcao','Tempest','Meridian','Aurora','Panteon'];
const rar=[['comum',0.03,49.357,100,50],['raro',0.06,35,300,150],['epico',0.10,15,800,400],['lendario',0.15,0.5,4000,2000],['mitico',0.22,0.143,15000,7500]];
const sfx=['Alfa','Beta','Gama','Delta','Omega'];
CATS.forEach((cn,c)=>rar.forEach(([r,pi,rate,pts,dup],i)=>items.push(item({id:'car-'+cn.toLowerCase()+'-'+r,name:carBase[c]+' '+sfx[i],category:'carros',tier:cn,
  description:'Carro '+r+' da categoria '+cn+': +'+(pi*100)+'% de PI na categoria.',currency:'giro|pts',
  price:{giro:'40 * lapReward(maxStageIdx) * cScale[cat]',pts},effect:{piPct:pi},unlock:{category:cn,stage:3},rarity:r,rate_pct:rate,duplicate_pts:dup,appears:['loja/invocacao','loja/troca']}))));
const banners=[
 {id:'banner-padrao',name:'Banner da Categoria',pool:'carros da categoria atual',rates:{comum:49.357,raro:35,epico:15,lendario:0.5,mitico:0.143},pity:{epico:10,lendario:200},cost:'40 x CR_volta(maior estagio) por giro (ou 1 ficha); x10 pelo mesmo preco por giro'},
 {id:'banner-destaque',name:'Banner de Destaque (semanal)',pool:'1 carro lendario em destaque + padrao',rates:'taxa do destaque x2 (0,5 para 1,0%), demais proporcionais',pity:{lendario:100},cost:'1 ficha de destaque ou 60 gemas por giro; 1 ficha/dia gratis por missao'},
 {id:'banner-lendas',name:'Banner Lendas',pool:'carros ficticios da categoria Lendas',rates:{raro:60,epico:32,lendario:7,mitico:1},pity:{lendario:50,mitico:150},cost:'fichas apenas (ganhas jogando)',unlock:'Categoria F1'}];
// pilotos e engenheiros (nomes ja ficticios no jogo)
const staff=[['Lia Monteiro','piloto',0],['Enzo Vale','piloto',1],['Maya Veloz','piloto',2],['Nico Solari','piloto',3],['Ines Costa','piloto',3],['Rui Prado','engenheiro',0],['Ana Circuito','engenheiro',1],['Leo Ventura','engenheiro',2],['Iris Brandao','engenheiro',3],['Tomas Luz','engenheiro',3]];
const rb=[0.02,0.04,0.07,0.12],hire=[5,25,150,900],rn=['comum','raro','epico','lendario'];
staff.forEach(([n,role,r])=>items.push(item({id:role+'-'+n.toLowerCase().replace(/[^a-z]+/g,'-'),name:n,category:role==='piloto'?'pilotos':'engenheiros',
  description:role+' '+rn[r]+': +'+(rb[r]*100)+'% de PI; +10% do bonus por estrela (max 5).',currency:'cr',price:{formula:hire[r]+' * 6.3 * lapReward(maxStageIdx) * cScale[cat]'},
  effect:{piPct:rb[r],starPct:0.1,synergy:'+3% PI se o estilo do piloto bate com o perfil do carro'},unlock:{category:'Kart',stage:r*3+2},limit:'1 (copias viram estrelas: 1,2,4,8,16)',rarity:rn[r],appears:['equipe/pilotos','loja/diaria']})));
items.push(item({id:'treino-basico',name:'Sessao de treino',category:'treino',description:'+100 XP de piloto; 5 min.',currency:'cr',price:{formula:'2 * 6.3 * lapReward(maxStageIdx)'},effect:{pilotXp:100},limit:'diario x5',appears:['equipe/pilotos']}));
items.push(item({id:'treino-intensivo',name:'Treino intensivo',category:'treino',description:'+500 XP de piloto; 30 min de espera ou pular com 8 gemas.',currency:'cr',price:{formula:'12 * 6.3 * lapReward(maxStageIdx)'},effect:{pilotXp:500},limit:'diario x2',appears:['equipe/pilotos']}));
// boosts e offline
const boosts=[
['boost-renda-30','Patrocinio em dobro (30 min)','CR x2 (corrida e Equipe) por 30 min',20,'diario x3 (mais ilimitado via anuncio, recarga 4 h)',{crMult:2,min:30}],
['boost-renda-120','Patrocinio em dobro (2 h)','CR x2 por 2 h',70,'diario x2',{crMult:2,min:120}],
['boost-xp-30','Foco da escuderia (30 min)','XP de escuderia x2 por 30 min',15,'diario x3',{xpMult:2,min:30}],
['auto-ers-60','ERS automatico (1 h)','Aciona o ERS sozinho por 1 h',10,'diario x3',{autoErsMin:60}],
['pular-1h','Pular 1 h','Credita 1 h de ganho offline (so CR, sem REP)',15,'diario x3',{offlineHours:1}],
['pular-4h','Pular 4 h','4 h de ganho offline',50,'diario x2',{offlineHours:4}],
['pular-8h','Pular 8 h','8 h de ganho offline',90,'diario x1',{offlineHours:8}],
['cofre-offline','Cofre de offline','Teto offline +4 h (permanente)',300,'unico',{offlineCapHours:4}],
['seguro-retorno','Seguro de retorno','Garante 4 h de ganho na proxima volta',25,'semanal x1',{minOfflineHours:4}]];
boosts.forEach(([id,n,d,g,l,e])=>items.push(item({id,name:n,category:'boosts',description:d,currency:'gemas',price:g,effect:e,limit:l,unlock:{escuderiaLevel:10},appears:['loja/boosts','loja/diaria']})));
// cosmeticos
const cos=[
['pintura','Pintura',['Aurora Boreal','Cromo Polar','Por do Sol','Jade','Magma','Safira','Neon Rosa','Carvao','Marfim','Ouro Velho','Orquidea','Tempestade','Oceano','Savana','Cobre','Grafite','Limao','Rubi','Ametista','Areia','Ciano','Vinho','Bronze','Vidro','Camuflagem Urbana','Listras Taxi','Xadrez','Chama','Galaxia','Holografica']],
['capacete','Capacete',['Falcao','Raio','Coruja','Onda','Estrela','Dragao','Lobo','Pixel','Sol','Lua','Cometa','Trevo','Aguia','Folha','Coroa','Escudo','Chama','Geometrico','Mosaico','Listra']],
['rodas','Rodas',['Classica','Turbina','Raios','Disco','Aro Neon','Hexagono','Flor','Engrenagem','Cristal','Fogo']],
['efeito-chegada','Efeito de chegada',['Confete','Faiscas','Fumaca Colorida','Raios','Serpentina','Fogos','Neve','Petalas']],
['tema-pit','Tema do pit',['Noturno','Neon','Retro 80','Industrial','Tropical','Minimalista']],
['emote','Emote de podio',['Salto','Trofeu ao ar','Danca','Saudacao','Brinde','Selfie','Bandeira','Abraco']]];
const cprice={comum:40,raro:120,epico:250,lendario:500};
cos.forEach(([k,label,names])=>names.forEach((nm,i)=>{const n=names.length;const r=i<n*0.4?'comum':i<n*0.7?'raro':i<n*0.9?'epico':'lendario';
  const src=i%7===6?'passe':i%11===10?'evento':i%13===12?'conquista':'loja';
  items.push(item({id:'cos-'+k+'-'+(i+1),name:label+' '+nm,category:'cosmeticos',slot:k,description:'Somente visual. Nao altera PI, CR nem REP.',
    currency:src==='loja'?'gemas':src,price:src==='loja'?cprice[r]:0,effect:{cosmetic:true},limit:'unico',rarity:r,unlock:{escuderiaLevel:5},
    appears:src==='loja'?['loja/cosmeticos','loja/diaria','loja/semanal']:[src]}))}));
// dinheiro real
const brl=[
['starter','Pacote inicial (unico)',9.90,{gemas:300,cosmeticos:['cos-pintura-1','cos-capacete-1'],fichas:5,semAnunciosDias:3},'unico'],
['mensal','Cartao Garagem (30 dias)',14.90,{gemasImediatas:100,gemasPorDia:30,offlineCapHoras:2},'mensal renovavel'],
['sem-anuncios','Remover anuncios',19.90,{removeAds:true,boostGratisPorDia:1},'unico'],
['passe-premium','Passe de Temporada premium',19.90,{premiumTrack:true},'por temporada'],
['gemas-1','Gemas 55',4.90,{gemas:55},'ilimitado'],['gemas-2','Gemas 115',9.90,{gemas:115,bonusPct:4},'ilimitado'],
['gemas-3','Gemas 240',19.90,{gemas:240,bonusPct:8},'ilimitado'],['gemas-4','Gemas 500',39.90,{gemas:500,bonusPct:12},'ilimitado'],
['gemas-5','Gemas 1050',79.90,{gemas:1050,bonusPct:17},'ilimitado'],['gemas-6','Gemas 2000',149.90,{gemas:2000,bonusPct:19},'ilimitado']];
brl.forEach(([id,n,p,e,l])=>items.push(item({id:'real-'+id,name:n,category:'real',description:'Compra com dinheiro real. Nunca altera PI, CR, REP nem PvP.',currency:'brl',price:p,price_range_note:'faixa sugerida +-30% (suposicao)',effect:e,limit:l,unlock:{tutorialDone:true},appears:['loja/premium']})));
// passe 40 niveis
const pass=[];
for(let L=1;L<=40;L++){
  const free=L%10===0?{gemas:50,fichas:2}:L%5===0?{gemas:20}:L%2===0?{crChestMinutes:10+L}:{fichas:1};
  const prem=L===40?{cosmetic:'pintura exclusiva da temporada + capacete'}:L%10===0?{cosmetic:'item raro exclusivo',gemas:60}:L%5===0?{cosmetic:'item comum de temporada'}:L%2===0?{gemas:10}:{crChestMinutes:20+L};
  pass.push({level:L,xp:100+25*L,free,premium:prem});
}
const rotating={
 daily:{slots:6,renew:'00:00 America/Fortaleza',seed:'hash(playerId + data)',reroll:{costGemas:10,perDay:1},showOdds:true,noDuplicates:'nao oferece cosmetico ou componente ja possuido',
  rules:[{slot:1,type:'componente da categoria atual',off:'15-30%',pay:'cr'},{slot:2,type:'boost ou ficha',pay:'cr|gemas'},{slot:3,type:'treino ou pular 1 h',pay:'cr|gemas'},{slot:4,type:'cosmetico (pesos: comum 60, raro 28, epico 10, lendario 2)',pay:'gemas'},{slot:5,type:'copias de piloto/engenheiro (pesos: comum 55, raro 30, epico 12, lendario 3)',pay:'cr'},{slot:6,type:'Oferta do dia: um dos slots 1-5 com 20% extra de desconto',pay:'cr|gemas'}]},
 weekly:{slots:4,renew:'segunda 00:00',showOdds:true,rules:[{slot:1,type:'carro garantido >= raro da categoria atual',pay:'cr (25x o preco do giro)'},{slot:2,type:'componente Elite/Lenda com 25% off',pay:'cr'},{slot:3,type:'cosmetico exclusivo da semana',pay:'gemas'},{slot:4,type:'bau semanal (CR de 60 min + 3 fichas)',pay:'pts'}]}};
const trade={name:'Troca de repetidos',currency:'pts',earn:{comum:50,raro:150,epico:400,lendario:2000,mitico:7500},shop:[{item:'carro garantido',pts:{comum:100,raro:300,epico:800,lendario:4000,mitico:15000}},{item:'ficha de destaque',pts:200,limit:'semanal x3'},{item:'copias de piloto lendario',pts:600,limit:'semanal x1'},{item:'bau semanal',pts:150,limit:'semanal x1'}]};
const evento={name:'Loja de evento (GP semanal e eventos mensais)',currency:'fichas de evento',earn:'10 por corrida do evento, +20 por top 3; cerca de 250 por semana (30 min/dia)',items:[{name:'Pintura do evento',cost:400},{name:'Capacete do evento',cost:300},{name:'Efeito de chegada do evento',cost:250},{name:'Bau de CR (60 min)',cost:50,limit:'x5'},{name:'Ficha de destaque',cost:120,limit:'x2'},{name:'Gemas x30',cost:100,limit:'x3'}],end:'sobra converte em CR a 50% apos o fim'};
fs.writeFileSync(process.argv[2],JSON.stringify({version:1,generatedAt:'2026-11-02',notes:'Todos os nomes sao ficticios (sem marca real). Preco em CR = formula sobre lapReward; example_price_at_unlock e o valor numerico na categoria Kart. Valores sao suposicoes de design (ver doc-design.md).',currencies:['cr','gemas','fichas','pts','brl'],items,banners,passe40:pass,rotating,trade,evento},null,1));
console.log('itens',items.length,JSON.stringify(items.reduce((a,i)=>(a[i.category]=(a[i.category]||0)+1,a),{})));
