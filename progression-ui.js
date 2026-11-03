(function(){
const N=NightLeague,E=GameEconomy,P=Progression;GameState.init(s);GarageState.init(s);
const goal=document.createElement('section');goal.className='night-goal';ApexRender.attr(goal,'aria-label','Próximo objetivo');ApexRender.html(goal,'<span id="progressGoalText"></span><progress id="progressGoalBar"></progress>');document.body.append(goal);
const tutorial=document.createElement('section');tutorial.className='night-tutorial';ApexRender.attr(tutorial,'role','status');document.body.append(tutorial);
const titles=document.createElement('article');ApexRender.html(titles,'<div><small>Títulos</small><strong id="wallet_titles">0</strong></div>');document.querySelector('.game-wallet').append(titles);
const label=(id,text)=>ApexRender.text($(id).parentElement.querySelector('small'),text);label('wallet_money','Caixa');label('wallet_xp','Pontos');label('wallet_rep','Reputação do campeonato');
const rps=document.createElement('small');rps.id='progressRps';$('wallet_money').after(rps);
const extra=document.createElement('button');ApexRender.text(extra,'Configurações e saves');extra.onclick=()=>openMenu('settings');document.querySelector('.night-directory').append(extra);
const liveTactics=document.querySelector('.tactics');if(liveTactics)settings.append(liveTactics);
const maintain=document.createElement('button');ApexRender.text(maintain,'Programar manutenção após a corrida');maintain.onclick=()=>{NightView.setMaintenance(!NightView.maintenance);ApexRender.text(maintain,NightView.maintenance?'Retomar corridas automáticas':'Programar manutenção após a corrida')};settings.append(maintain);
const endGoal=document.createElement('p');endGoal.className='result-next';$('nightResultReward').after(endGoal);
let levelSum=s.levels.reduce((a,b)=>a+b,0),unitSum=s.idle.units.reduce((a,b)=>a+b,0),lastGuide=0,lastResult=null;
$('boost').addEventListener('click',()=>{if(boost>0&&N.init(s).tutorial===2){N.init(s).tutorial=3;save()}});
function refresh(){if(s.version===2)return;
const n=N.init(s),g=P.goal(s,A);ApexRender.text($('progressGoalText'),g.label);ApexRender.prop($('progressGoalBar'),"max",g.max);ApexRender.prop($('progressGoalBar'),"value",g.value);
ApexRender.text($('progressRps'),'≈ '+fmt(P.rate(s,A,E,N))+' CR/s');ApexRender.text($('wallet_titles'),fmt(n.titles));
const total=s.levels.reduce((a,b)=>a+b,0),units=s.idle.units.reduce((a,b)=>a+b,0);
if(n.tutorial===0&&race&&race.countdown<=0){n.tutorial=1;save()}
if(n.tutorial===1&&(total>levelSum||units>unitSum)){n.tutorial=2;save()}levelSum=total;unitSum=units;
ApexRender.prop(tutorial,"hidden",n.tutorial>=3);ApexRender.text(tutorial,['1/3 · Veja seu F1 largar. A corrida é automática.','2/3 · Abra Carro e compre sua primeira melhoria.','3/3 · Use o ERS para ganhar ritmo.'][n.tutorial]||'');
ApexRender.prop(document.querySelector('[data-night-tab="sponsor"]'),"hidden",n.races<1&&total===0&&s.levels[3]===0);
ApexRender.prop(document.querySelector('[data-night-tab="season"]'),"hidden",n.seasonEarned<100000&&n.titles===0);
if(n.lastResult!==lastResult){lastResult=n.lastResult;ApexRender.text(endGoal,g.label)}
if(performance.now()-lastGuide>12000&&!document.querySelector('dialog:modal')){lastGuide=performance.now();radio(cooldown<=0&&boost<=0?'ERS pronto, aperte agora!':g.label+'.')}
}
const previous=render;render=function(){previous();refresh()};refresh();
})();
