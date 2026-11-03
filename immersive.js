// Reorganiza os controles existentes sem duplicar estado ou regras do jogo.
document.body.classList.add('immersive');
const dock=document.createElement('nav');dock.className='game-dock';ApexRender.attr(dock,'aria-label','Menus do jogo');ApexRender.html(dock,'<button data-menu="garage">⌁<span>Melhorias</span></button><button data-menu="summon">✦<span>Invocação F1</span></button><button data-menu="setup">◈<span>Meu carro</span></button><button data-menu="circuits">⚑<span>Circuitos</span></button><button data-menu="career">☷<span>Objetivos</span></button><button data-menu="settings">⚙<span>Opções</span></button>');document.body.append(dock);
const drawer=document.createElement('dialog');drawer.className='game-drawer';ApexRender.html(drawer,'<div class="drawer-head"><h2 id="drawerTitle"></h2><button id="closeDrawer" aria-label="Fechar menu">✕</button></div><div id="drawerContent"></div>');ApexRender.attr(drawer,'aria-labelledby','drawerTitle');document.body.append(drawer);
const menus={garage:{title:'Oficina',node:document.querySelector('.garage')},setup:{title:'Meu carro',node:garage},circuits:{title:'Escolher circuito',node:$('circuits')},career:{title:'Sua próxima conquista',node:journey}};
const settings=document.createElement('section');settings.className='settings-content';ApexRender.html(settings,'<p class="muted">Seu progresso é salvo automaticamente neste navegador.</p>');settings.append($('export'),document.querySelector('.import'));const help=document.createElement('p');help.className='muted';ApexRender.text(help,'A corrida continua com o menu aberto. Pause para alterar o acerto. Progresso offline limitado a 8 horas.');settings.append(help);menus.settings={title:'Opções e progresso',node:settings};
const summoning=document.createElement('section');summoning.className='summoning';
ApexRender.html(summoning,'<p class="eyebrow">UM NOVO MONOPOSTO NO SEU BOX</p><h2>Invocação de F1</h2><p class="muted">200 CR por invocação. Carros repetidos viram pontos da loja.</p><label for="wishCar">Lista de desejos · chance dobrada</label><select id="wishCar"><option value="">Sem preferência</option>'+A.cars.slice(1).map(c=>'<option value="'+c.id+'">'+c.name+' · '+c.rarity+'</option>').join('')+'</select><div class="summon-actions"><button id="summonCar" class="primary">Invocar ×1 · 200 CR</button><button id="summonTen">Invocar ×10 · 2.000 CR</button></div><div class="summon-guarantees" id="summonPity"></div><details class="summon-rules"><summary>Chances e garantias</summary><div id="summonRates"></div><p>Base: comum 49,357143%, raro 35%, épico 15%, lendário 0,5%, mítico 0,142857% (1 em 700). O desejo dobra a chance atual do modelo escolhido, redistribuindo proporcionalmente as demais. As taxas acima já incluem a lista de desejos, antes das garantias.</p><p>Épico ou superior em até 10 tentativas; lendário ou superior em até 200. Receber a qualidade correspondente ou superior reinicia o contador. Mítico tem chance fixa de 1 em 700 por tentativa (0,142857%) antes do desejo, sem aumento por tentativas e sem garantia. O desejo mítico dobra para 1 em 350. São probabilidades por sorteio, não uma entrega obrigatória ao completar 700. Garantias podem entregar repetidos. ×10 segue dez sorteios individuais.</p></details><p id="summonBalance" class="muted"></p><div id="summonResult" role="status" aria-live="polite">Seu próximo carro está esperando.</div><h3>Sua garagem</h3><p class="muted">Pause a corrida para equipar. Bônus de ritmo aplicado na previsão.</p><div id="carCollection" class="car-collection"></div><section class="summon-shop"><h3>Loja de invocação</h3><p id="summonPoints"></p><p class="muted">Troque pontos por um carro ainda não desbloqueado. A compra não altera os contadores das invocações.</p><div id="summonShop" class="car-collection"></div></section><details class="summon-rules"><summary>Histórico · últimas 10 invocações</summary><ol id="summonHistory"></ol></details><button id="testCredits" hidden>Receber 1.000.000 CR para testar</button>');
menus.summon={title:'Invocação de F1',node:summoning};
const summonCinema=document.createElement('dialog');summonCinema.className='summon-cinema';ApexRender.attr(summonCinema,'aria-labelledby','cinemaTitle');
ApexRender.html(summonCinema,'<div class="cinema-heading"><p class="eyebrow">A CHEGADA DE UM NOVO MONOPOSTO</p><h2 id="cinemaTitle">Quem vem para a sua garagem?</h2><p id="cinemaProgress"></p></div><div id="cinemaStage" class="cinema-stage" data-phase="mystery"><canvas id="cinemaCanvas" role="img" aria-label="F1 da mesma arte das cartas cruzando a linha de chegada"></canvas><p id="cinemaCaption" role="status" aria-live="polite"></p></div><div class="cinema-controls"><button id="skipSummon">Revelar todos</button><button id="nextSummon" class="primary" disabled>Próximo carro →</button></div>');
document.body.append(summonCinema);
let stopCinemaArt=null;
function drawCinemaArt(phase){if(stopCinemaArt&&phase!=='mystery'&&stopCinemaArt.setPhase){stopCinemaArt.setPhase(phase);return}if(stopCinemaArt){stopCinemaArt();stopCinemaArt=null}if(pendingReveal)stopCinemaArt=DropShowcase.race($('cinemaCanvas'),pendingReveal[revealIndex].car,phase)}

const dropsDialog=document.createElement('dialog');dropsDialog.className='drops-dialog';ApexRender.attr(dropsDialog,'aria-labelledby','dropsTitle');
ApexRender.html(dropsDialog,'<div class="drops-heading"><p class="eyebrow">SEU PRÓXIMO CAPÍTULO COMEÇA NO GRID</p><h2 id="dropsTitle">INVOCAÇÃO CONCLUÍDA</h2><p>Seus monopostos chegaram. O mais raro é o destaque da coleção.</p></div><canvas id="dropsCanvas" role="img" aria-label="Carros invocados, com o mais raro no centro"></canvas><ol id="dropsAccessible" class="sr-only"></ol><div class="drops-controls"><button id="closeDrops" class="primary">Continuar na garagem →</button></div>');
document.body.append(dropsDialog);let stopDrops=null;
function closeDrops(){if(stopDrops){stopDrops();stopDrops=null}if(dropsDialog.open)dropsDialog.close();if(drawer.open)$('summonCar').focus()}
dropsDialog.addEventListener('close',closeDrops);dropsDialog.addEventListener('cancel',e=>{e.preventDefault();closeDrops()});$('closeDrops').onclick=closeDrops;
function showDrops(results){
closeDrops();
$('dropsAccessible').replaceChildren(...DropShowcase.order(results).map(result=>{const li=document.createElement('li');ApexRender.text(li,resultText(result));return li}));
try{dropsDialog.showModal();stopDrops=DropShowcase.mount($('dropsCanvas'),results);$('closeDrops').focus()}catch{closeDrops()}
}


const bank=document.createElement('div');ApexRender.prop(bank,"hidden",true);document.body.append(bank);Object.values(menus).forEach(m=>bank.append(m.node));
let collectionView='',summonBusy=false,revealTimer=null,pendingReveal=null,revealIndex=0;
const testMode=new URLSearchParams(location.search).get('test')==='1';
if(testMode&&A.grantTestCredits(s))save();
ApexRender.prop($('testCredits'),"hidden",!testMode);
$('testCredits').onclick=()=>{if(A.grantTestCredits(s)){save();render()}};
$('wishCar').onchange=()=>{if(!summonBusy&&A.setWish(s,$('wishCar').value)){save();render()}};
function renderSummoning(){
if(typeof LegendsData!=='undefined')return;
ApexRender.prop($('summonCar'),"disabled",summonBusy||s.money<A.summonCost);ApexRender.prop($('summonTen'),"disabled",summonBusy||s.money<A.summonCost*10);
ApexRender.prop($('wishCar'),"disabled",summonBusy);ApexRender.prop($('wishCar'),"value",s.wishCar||'');
ApexRender.prop($('testCredits'),"disabled",!!s.testCreditsGranted);
const p=A.pity(s),rates=A.summonRates(s),percent=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:4});
ApexRender.text($('summonPity'),'Épico+ em até '+(10-p.epic)+' · Lendário+ em até '+(200-p.legendary)+' · Mítico agora: '+percent(rates.find(r=>r.id==='zenith').chance)+'% (sem garantia)');
ApexRender.text($('summonRates'),rates.map(r=>A.cars.find(c=>c.id===r.id).rarity+': '+percent(r.chance)+'%').join(' · '));
ApexRender.text($('summonPoints'),'Seus pontos: '+fmt(A.points(s)));
const shopView=JSON.stringify([A.ownedCars(s),A.points(s),summonBusy]);if($('summonShop').dataset.view!==shopView){$('summonShop').dataset.view=shopView;$('summonShop').innerHTML=A.cars.slice(1).map(car=>{const owned=A.ownedCars(s).includes(car.id);return '<article class="summon-card" style="--car-color:'+car.color+'"><h3>'+car.name+'</h3><p>'+car.rarity+' · Repetido: +'+A.duplicatePoints[car.id]+' pontos</p><button data-shop="'+car.id+'" '+(summonBusy||owned||A.points(s)<A.shopPrices[car.id]?'disabled':'')+'>'+(owned?'Já adquirido':fmt(A.shopPrices[car.id])+' pontos · Comprar')+'</button></article>'}).join('');}
const history=JSON.stringify(s.summonHistory||[]);if($('summonHistory').dataset.view!==history){$('summonHistory').dataset.view=history;$('summonHistory').innerHTML=(s.summonHistory||[]).map(h=>{const c=A.cars.find(c=>c.id===h.id);return '<li>'+c.rarity+' · '+c.name+(h.duplicate?(h.points===undefined?' · repetido (regra antiga: +100 CR)':' · repetido (+'+h.points+' pontos)'):' · novo')+(h.guaranteed?' · garantia':'')+'</li>'}).join('')||'<li>Nenhuma invocação nesta versão ainda.</li>'}
ApexRender.text($('summonBalance'),'Saldo: '+fmt(s.money)+' CR · Coleção: '+A.ownedCars(s).length+'/'+A.cars.length);
const view=JSON.stringify([A.ownedCars(s),A.equippedCar(s).id,s.running,Career.data(s).contracts,Career.data(s).entry]);if(view===collectionView)return;collectionView=view;
$('carCollection').innerHTML=A.cars.map(car=>{const owned=A.ownedCars(s).includes(car.id),active=A.equippedCar(s).id===car.id,reserved=!Career.available(s,car.id);return '<article class="summon-card" style="--car-color:'+car.color+'"><span class="summon-car" aria-hidden="true">🏎</span><h3>'+car.name+'</h3><p>'+car.rarity+' · '+(car.chance?car.chance.toLocaleString('pt-BR')+'% base':'Disponível desde o início')+'</p><p>Ritmo +'+Math.round(car.bonus*100)+'%</p><button data-equip="'+car.id+'" '+(!owned||active||reserved||s.running?'disabled':'')+'>'+(active?'Equipado':reserved?'Reservado na carreira':owned?'Equipar':'Bloqueado')+'</button></article>'}).join('');
}
function resultText(result){return result.car.rarity+' · '+result.car.name+(result.duplicate?' repetido! +'+result.points+' pontos da loja.':' desbloqueado!')+(result.guaranteed?' Garantia ativada.':'')}
function resultCard(result){const card=document.createElement('article');card.className='summon-reveal';card.style.setProperty('--car-color',result.car.color);ApexRender.html(card,'<svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="#080d12" stroke="#3f515d" stroke-width="2"><rect x="58" y="14" width="52" height="31" rx="7"/><rect x="58" y="105" width="52" height="31" rx="7"/><rect x="218" y="22" width="43" height="29" rx="7"/><rect x="218" y="99" width="43" height="29" rx="7"/></g><g fill="currentColor"><path d="M40 49H120L164 61L277 68V82L164 89L120 101H40Z"/><rect x="31" y="23" width="14" height="104" rx="4"/><rect x="273" y="29" width="13" height="92" rx="4"/><path d="M105 45L163 57V93L105 105Z"/></g><path d="M122 60H157Q181 75 157 90H122Z" fill="#101c26" stroke="#87a3ae" stroke-width="3"/><path d="M52 75H110M186 75H263" stroke="white" stroke-opacity=".35" stroke-width="3"/></svg>');const label=document.createElement('p');ApexRender.text(label,resultText(result));card.append(label);return card}
function finishSummon(){
clearTimeout(revealTimer);
if(stopCinemaArt){stopCinemaArt();stopCinemaArt=null}
if(!pendingReveal)return;
const results=pendingReveal;pendingReveal=null;summonBusy=false;
$('summonResult').replaceChildren(...results.map(resultCard));
if(summonCinema.open)summonCinema.close();
render();radio(results.length+' invocaç'+(results.length===1?'ão concluída.':'ões concluídas.'));
showDrops(results)
}
function revealCurrent(){
if(!pendingReveal)return;
const result=pendingReveal[revealIndex];
$('cinemaStage').dataset.phase='revealed';drawCinemaArt('revealed');
$('cinemaStage').style.setProperty('--reveal-color',result.car.color);
ApexRender.text($('cinemaCaption'),'A pintura está surgindo sob os refletores…');
ApexRender.prop($('nextSummon'),"disabled",true);
ApexRender.text($('nextSummon'),revealIndex===pendingReveal.length-1?'Ver todos os drops →':'Próximo carro →');
revealTimer=setTimeout(raceCurrent,matchMedia('(prefers-reduced-motion: reduce)').matches?200:1150)
}
function raceCurrent(){
if(!pendingReveal)return;
$('cinemaStage').dataset.phase='racing';drawCinemaArt('racing');ApexRender.text($('cinemaCaption'),resultText(pendingReveal[revealIndex])+' Acelerando até a chegada!');ApexRender.prop($('nextSummon'),'disabled',false);
revealTimer=setTimeout(nextSummon,1600)
}
function startReveal(){
if(!pendingReveal)return;
$('cinemaStage').dataset.phase='mystery';drawCinemaArt('mystery');$('cinemaStage').style.setProperty('--reveal-color','#a2b6c4');
ApexRender.text($('cinemaProgress'),'CARRO '+(revealIndex+1)+' DE '+pendingReveal.length);
ApexRender.text($('cinemaCaption'),'Um F1 misterioso está chegando…');
ApexRender.prop($('nextSummon'),"disabled",true);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
revealTimer=setTimeout(revealCurrent,reduced?250:750)
}
function nextSummon(){
if(!pendingReveal||$('nextSummon').disabled)return;
clearTimeout(revealTimer);revealIndex++;
if(revealIndex>=pendingReveal.length){finishSummon();return}
startReveal()
}
function invokeCars(count){
if(summonBusy)return;const results=A.summonMany(s,count);if(!results)return;
pendingReveal=results;revealIndex=0;summonBusy=true;save();render();
ApexRender.text($('summonResult'),'Revelação em andamento…');
try{summonCinema.showModal();startReveal();$('skipSummon').focus()}catch{finishSummon()}
}
$('skipSummon').onclick=finishSummon;$('nextSummon').onclick=nextSummon;
summonCinema.addEventListener('cancel',e=>{e.preventDefault();finishSummon()});
summonCinema.addEventListener('close',finishSummon);drawer.addEventListener('close',finishSummon);
$('summonCar').onclick=()=>invokeCars(1);$('summonTen').onclick=()=>invokeCars(10);
$('summonShop').onclick=e=>{const button=e.target.closest('[data-shop]');if(button&&!summonBusy&&A.shopBuy(s,button.dataset.shop)){save();render();radio('Carro adquirido na loja de invocação.')}};
$('carCollection').onclick=e=>{const button=e.target.closest('[data-equip]');if(button&&A.equipCar(s,button.dataset.equip)){save();syncGarage();render();radio(A.equippedCar(s).name+' equipado e pronto para a pista.')}};
function openMenu(id){const m=menus[id];if(!m)return;Object.values(menus).forEach(v=>bank.append(v.node));ApexRender.text($('drawerTitle'),m.title);$('drawerContent').replaceChildren(m.node);if(!drawer.open)drawer.show();$('closeDrawer').focus()}
dock.querySelectorAll('button').forEach(b=>b.onclick=()=>openMenu(b.dataset.menu));$('closeDrawer').onclick=()=>drawer.close();drawer.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)drawer.close()}});
const menuToggle=document.createElement('button');menuToggle.className='menu-toggle';ApexRender.text(menuToggle,'☰ Menu');ApexRender.attr(menuToggle,'aria-expanded','false');ApexRender.attr(menuToggle,'aria-controls','gameDock');dock.id='gameDock';ApexRender.prop(dock,"hidden",true);document.body.append(menuToggle);function toggleDock(){ApexRender.prop(dock,"hidden",!dock.hidden);ApexRender.attr(menuToggle,'aria-expanded',String(!dock.hidden));ApexRender.text(menuToggle,dock.hidden?'☰ Menu':'✕ Fechar');}menuToggle.onclick=toggleDock;
dock.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(!dock.hidden)toggleDock()}));document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||welcome.open||drawer.open)return;if(e.key.toLowerCase()==='m')toggleDock()});
const circuitBadge=document.createElement('div');circuitBadge.className='circuit-badge';document.querySelector('.trackwrap').append(circuitBadge);circuitBadge.append($('circuitName'));const circuitCaption=document.createElement('small');ApexRender.text(circuitCaption,'TREINO LIVRE · MODO IDLE');circuitBadge.append(circuitCaption);
const expand=document.createElement('button');expand.className='expand-game';ApexRender.text(expand,'⛶');expand.title='Tela cheia';ApexRender.attr(expand,'aria-label','Alternar tela cheia');expand.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{radio('Tela cheia indisponível neste navegador.')}};document.body.append(expand);
// Tutorial e objetivos passam a usar os menus, sem rolar a página.
const immersiveRender=render;render=function(){immersiveRender();renderSummoning();$('journeyAction').onclick=()=>{drawer.close();if(s.laps>=1&&!s.levels.some(n=>n>0))openMenu('garage');else if(s.laps>=5)openMenu('circuits');else $('toggle').focus()}};
const initialSubmit=$('welcomeForm').onsubmit;$('welcomeForm').onsubmit=e=>{initialSubmit(e);openMenu('setup')};render();
