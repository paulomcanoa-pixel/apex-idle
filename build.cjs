const fs=require('node:fs');
const files=['index.html','style.css','immersive.css','engine.js','game.js','garage.js','start.js','immersive.js','scenery.js'];
fs.mkdirSync('public',{recursive:true});
for(const file of files)fs.copyFileSync(file,'public/'+file);
console.log('Build estático pronto: '+files.length+' arquivos em public/.');
