(function(){
let lanes=new Map(),stamp=0,frameCars=[],lastCircuit=-1,lastRace=null;
function racers(){const player={id:'player',distance:s.laps+s.progress,color:s.color||A.equippedCar(s).color,model:A.equippedCar(s).id,number:'01'};
if(race){player.distance=race.distance;return[player,...race.rivals.map((v,i)=>({id:'rival'+i,distance:race.elapsed/v.pace+(3-i)*.008/layouts[s.circuit].scale*Math.max(0,1-race.distance/.06),color:v.color,model:'vento',number:String(i+2).padStart(2,'0')}))]}
const total=s.laps+s.progress;return[player,{id:'rival0',distance:total*.975+.008,color:'#e17e60',model:'solar',number:'02'},{id:'rival1',distance:total*1.02-.012,color:'#8baded',model:'vento',number:'03'}]}
function prepare(){const now=performance.now();if(now-stamp<1)return;const dt=(now-stamp)/1000;stamp=now;if(s.circuit!==lastCircuit||race!==lastRace){lanes.clear();lastCircuit=s.circuit;lastRace=race}frameCars=Traffic.targets(racers(),layouts[s.circuit].length).map(car=>{const previous=lanes.get(car.id)??car.lane,lane=Traffic.ease(previous,car.lane,dt);lanes.set(car.id,lane);return{...car,lane}})}
function paint(car){const p=Traffic.offset(position(car.distance),car.lane);CarArt.draw(ctx,{...p,scale:.17,id:car.model,color:car.color,number:car.number})}
drawCar=function(t,color){prepare();if(color==='#e17e60'){frameCars.filter(c=>c.id!=='player').forEach(paint);return}if(color==='#8baded')return;const player=frameCars.find(c=>c.id==='player');if(player)paint(player)};
function playerPosition(){return Traffic.offset(position(race?race.distance:s.progress),lanes.get('player')||0)}
window.TrafficView={racers,playerPosition};
})();
