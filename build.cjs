const fs=require('node:fs');
const files=['circuit-scenery.js','missions-model.js','missions-ui.js','missions.css','traffic-model.js','traffic-view.js','camera-view.js','camera-view.css','circuits-data.js','circuits.css','CIRCUITS-LICENSE.txt','career-model.js','career-ui.js','career.css','ranked-ui.js','main-tabs.js','ranked.css','index.html','style.css','immersive.css','engine.js','game.js','garage.js','start.js','immersive.js','drops.js','scenery.js','race-engine.js','race-ui.js','race.css','car-art.js','car-gallery.html','strategy-ui.js','strategy.css','tactics.js','visual-garage.js','visual-garage.css','parts-shop-model.js','parts-shop-ui.js','parts-shop.css'];
fs.mkdirSync('public',{recursive:true});
for(const file of files)fs.copyFileSync(file,'public/'+file);
fs.mkdirSync('public/car-pack',{recursive:true});
for(const id of ['aurora','vento','scarlatto','solar','eclipse'])fs.copyFileSync('car-pack/'+id+'.png','public/car-pack/'+id+'.png');
console.log('Build estático pronto: '+files.length+' arquivos em public/.');



