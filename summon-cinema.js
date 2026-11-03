// The unified banners reuse the original gacha cinema and animated card finale.
// Results are already committed by the banner model; this file only presents them.
(function(){
window.LegendsReveal=function(results){
if(!Array.isArray(results)||!results.length||summonBusy)return;
pendingReveal=results.map(result=>{const source=Legends.get(result.id);if(!source)throw Error('Monoposto desconhecido na revelação.');return {car:{...source,rarity:LegendsData.names[source.rarity],color:LegendsData.colors[source.rarity]},duplicate:result.duplicate,guaranteed:result.guaranteed,points:result.points||0}});
revealIndex=0;summonBusy=true;
try{summonCinema.showModal();startReveal();$('skipSummon').focus()}catch{finishSummon()}
};
resultCard=function(result){
const card=document.createElement('article');card.className='summon-reveal';card.style.setProperty('--car-color',result.car.color);
const canvas=document.createElement('canvas');canvas.width=360;canvas.height=180;ApexRender.attr(canvas,'aria-label',result.car.name+' em Canvas');const g=canvas.getContext('2d');g.fillStyle='#101b2a';g.fillRect(0,0,360,180);CarArt.draw(g,{x:180,y:85,a:-.1,scale:2.7,id:result.car.id});
const label=document.createElement('p');ApexRender.text(label,resultText(result));card.append(canvas,label);return card;
};
closeDrops=function(){
if(stopDrops){stopDrops();stopDrops=null}if(dropsDialog.open)dropsDialog.close();
if(drawer.open){const target=document.querySelector('.summon-hub [data-hub-pull="1"]:not(:disabled)')||document.querySelector('.summon-hub [data-hub-tab]');target?.focus()}
};
$('closeDrops').onclick=closeDrops;
})();
