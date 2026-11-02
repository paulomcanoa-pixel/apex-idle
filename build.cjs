const fs=require('node:fs');
const files=['lineup-model.js','lineup-ui.js','night-model.js','night-ui.js','night.css','cloud-model.js','cloud-ui.js','src/lib/supabase.js','idle-ui.js','idle.css','game/format.js','game/state.js','game/economy.js','game/tick.js','game/save.js','academy-model.js','academy.css','summon-cinema.js','summoning-hub.js','summoning-hub.css','legends-data.js','legends-model.js','legends-art.js','legends-ui.js','legends.css','championship-model.js','championship-ui.js','championship.css','farm-model.js','farm-ui.js','farm.css','circuit-scenery.js','missions-model.js','missions-ui.js','missions.css','traffic-model.js','traffic-view.js','camera-view.js','camera-view.css','circuits-data.js','circuits.css','CIRCUITS-LICENSE.txt','career-model.js','career-ui.js','career.css','ranked-ui.js','main-tabs.js','ranked.css','index.html','style.css','immersive.css','engine.js','game.js','garage.js','start.js','immersive.js','drops.js','scenery.js','race-engine.js','race-ui.js','race.css','car-art.js','car-gallery.html','strategy-ui.js','strategy.css','tactics.js','visual-garage.js','visual-garage.css','parts-shop-model.js','parts-shop-ui.js','parts-shop.css'];
fs.mkdirSync('public',{recursive:true});
for(const file of files){fs.mkdirSync(require('node:path').dirname('public/'+file),{recursive:true});fs.copyFileSync(file,'public/'+file)}
fs.mkdirSync('public/car-pack',{recursive:true});
for(const id of ['aurora','vento','scarlatto','solar','eclipse'])fs.copyFileSync('car-pack/'+id+'.png','public/car-pack/'+id+'.png');
process.stdout.write('Build estático pronto: '+files.length+' arquivos em public/.\n');




const path=require('node:path');
let local={};if(fs.existsSync('.env'))for(const line of fs.readFileSync('.env','utf8').split(/\r?\n/)){const match=line.match(/^([A-Z_]+)\s*=\s*(.*)$/);if(match)local[match[1]]=match[2].replace(/^['"]|['"]$/g,'')}
const env=name=>process.env[name]??local[name]??'';
const supabaseUrl=env('SUPABASE_URL').replace(/\/$/,''),supabaseAnonKey=env('SUPABASE_ANON_KEY');
if(!!supabaseUrl!==!!supabaseAnonKey)throw Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY juntas.');
if(supabaseUrl&&!/^https:\/\/[^/]+\.supabase\.co$/.test(supabaseUrl))throw Error('URL pública Supabase inválida.');
if(supabaseAnonKey){let allowed=supabaseAnonKey.startsWith('sb_publishable_');if(supabaseAnonKey.split('.').length===3){try{allowed=JSON.parse(Buffer.from(supabaseAnonKey.split('.')[1],'base64url')).role==='anon'}catch{allowed=false}}if(!allowed)throw Error('Use somente a chave pública publishable/anon; nunca service_role.')}
fs.writeFileSync('public/config.js','window.APEX_PUBLIC_CONFIG='+JSON.stringify({supabaseUrl,supabaseAnonKey,googleEnabled:env('SUPABASE_GOOGLE_ENABLED')==='true'})+';\n');
fs.mkdirSync('public/vendor',{recursive:true});
fs.copyFileSync(process.env.SUPABASE_SDK_PATH||path.join('node_modules','@supabase','supabase-js','dist','umd','supabase.js'),'public/vendor/supabase.js');
process.stdout.write('Supabase SDK local e configuração pública preparados. Conta '+(supabaseUrl?'habilitada':'em modo convidado')+'.\n');

