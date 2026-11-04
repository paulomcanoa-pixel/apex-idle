(function(){
let lanes=new Map(),stamp=0,frameCars=[],lastCircuit=-1,lastRace=null;
function racers(){const player={id:'player',distance:s.laps+s.progress,color:A.equippedCar(s).id==='aurora'?(s.color||A.equippedCar(s).color):A.equippedCar(s).color,model:A.equippedCar(s).id,number:'01'};
const rivalModels=['vento','scarlatto','solar','eclipse'];
if(race){player.distance=race.distance;return[player,...race.rivals.map((v,i)=>({id:'rival'+i,distance:race.elapsed/v.pace+-(Math.floor(i/3)+1)*.012/layouts[s.circuit].scale*Math.max(0,1-race.distance/.06),color:v.color,model:rivalModels[i%rivalModels.length],number:String(i+2).padStart(2,'0')}))]}
const total=s.laps+s.progress;return[player,...NightLeague.names.map((name,i)=>({id:'rival'+i,distance:total*(1.03-i*.009)+(i+1)*.09,color:NightLeague.colors[i],model:rivalModels[i%rivalModels.length],number:String(i+2).padStart(2,'0')}))]}
function prepare(){const now=performance.now();if(now-stamp<1)return;const dt=(now-stamp)/1000;stamp=now;if(s.circuit!==lastCircuit||race!==lastRace){lanes.clear();lastCircuit=s.circuit;lastRace=race}frameCars=Traffic.targets(racers(),layouts[s.circuit].length).map(car=>{const previous=lanes.get(car.id)??car.lane,lane=Traffic.ease(previous,car.lane,dt);lanes.set(car.id,lane);return{...car,lane}})}
function paint(car){const p=Traffic.offset(position(car.distance),car.lane);if(car.id==='player'&&typeof NightView!=='undefined')NightView.trail(ctx,p,boost>0,s.running);CarArt.draw(ctx,{...p,scale:.17,id:car.model,color:car.id==='player'&&car.model!=='aurora'?undefined:car.color,number:car.number,depth:window.apexPseudo3D===true})}
drawCar=function(t,color){prepare();if(color==='#e17e60'){frameCars.filter(c=>c.id!=='player').forEach(paint);return}if(color==='#8baded')return;const player=frameCars.find(c=>c.id==='player');if(player)paint(player)};
function playerPosition(){return Traffic.offset(position(race?race.distance:s.progress),lanes.get('player')||0)}
window.TrafficView={racers,playerPosition,invalidate(){stamp=0;frameCars=[]}};
})();

