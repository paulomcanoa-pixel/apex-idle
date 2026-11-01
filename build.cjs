const fs=require('node:fs');
const files=['index.html','style.css','immersive.css','engine.js','game.js','garage.js','start.js','immersive.js','scenery.js','race-engine.js','race-ui.js','race.css','car-art.js','car-gallery.html'];
fs.mkdirSync('public',{recursive:true});
for(const file of files)fs.copyFileSync(file,'public/'+file);
console.log('Build estático pronto: '+files.length+' arquivos em public/.');


