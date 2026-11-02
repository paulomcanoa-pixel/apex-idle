// Navegação principal sob o circuito; Menu contém somente configurações.
const mainTabs=document.createElement('nav');mainTabs.className='main-game-tabs';mainTabs.setAttribute('aria-label','Abas do jogo');
const tabDefinitions=[['track','Pista'],['setup','Meu F1'],['farm','Farm idle'],['garage','Melhorias'],['parts','Peças'],['summon','Invocação'],['circuits','Circuitos'],['missions','Missões'],['contracts','Contratos'],['weekly','GP semanal'],['album','Álbum'],['projects','Projetos'],['stats','Progresso'],['pvp','PvP Ranked'],['rankings','Ranking']];
mainTabs.innerHTML=tabDefinitions.map(([id,label])=>'<button data-main-tab="'+id+'" aria-pressed="'+(id==='track')+'">'+label+'</button>').join('');
circuitBadge.append(mainTabs);
const priorTabsOpen=openMenu;
openMenu=function(id){
let target=id;
if(['contracts','weekly','album','projects','stats'].includes(id)){careerTab=id;careerCache='';target='career'}
if(id==='track'){drawer.close();drawer.dataset.section='track';markMainTab(id);openOnline(id);return}
priorTabsOpen(target);drawer.dataset.section=id;markMainTab(id);if(target==='career')renderCareer();openOnline(id)
};
function markMainTab(id){mainTabs.querySelectorAll('[data-main-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mainTab===id)))}
mainTabs.onclick=e=>{const b=e.target.closest('[data-main-tab]');if(b)openMenu(b.dataset.mainTab)};
dock.replaceChildren();dock.hidden=true;drawer.id='gameSettingsPanel';menuToggle.setAttribute('aria-controls',drawer.id);
menuToggle.onclick=()=>openMenu('settings');menuToggle.textContent='⚙ Menu';menuToggle.removeAttribute('aria-expanded');menuToggle.setAttribute('aria-label','Menu de configurações');
toggleDock=function(){openMenu('settings')};
const cameraSettings=document.querySelector('.camera-controls');if(cameraSettings)settings.append(cameraSettings);
settings.append(expand);
const settingsHeading=document.createElement('h3');settingsHeading.textContent='Câmera e tela';settings.insertBefore(settingsHeading,cameraSettings||expand);
const mapSetting=document.createElement('label');mapSetting.className='map-setting';mapSetting.innerHTML='<input type="checkbox" id="showMiniMap" checked> Exibir minimapa';settings.append(mapSetting);
$('showMiniMap').onchange=()=>{const map=document.querySelector('.race-minimap');if(map)map.hidden=!$('showMiniMap').checked};
drawer.addEventListener('close',()=>{markMainTab('track');drawer.dataset.section='track';if(onlinePolling)clearInterval(onlinePolling)});

