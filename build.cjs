const fs=require('node:fs');
const files=['index.html','style.css','immersive.css','engine.js','game.js','garage.js','start.js','immersive.js','scenery.js','race-engine.js','race-ui.js','race.css','car-art.js','car-gallery.html','strategy-ui.js','strategy.css','tactics.js'];
fs.mkdirSync('public',{recursive:true});
for(const file of files)fs.copyFileSync(file,'public/'+file);
fs.mkdirSync('public/car-pack',{recursive:true});
for(const id of ['aurora','vento','scarlatto','solar','eclipse'])fs.copyFileSync('car-pack/'+id+'.png','public/car-pack/'+id+'.png');
console.log('Build estático pronto: '+files.length+' arquivos em public/.');



