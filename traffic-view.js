(function(){
let lanes=new Map(),stamp=0,frameCars=[],lastCircuit=-1,lastRace=null;
function racers(){const player={id:'player',distance:s.laps+s.progress,color:A.equippedCar(s).id==='aurora'?(s.color||A.equippedCar(s).color):A.equippedCar(s).color,model:A.equippedCar(s).id,number:'01'};
const rivalModels=['vento','scarlatto','solar','eclipse'];
if(race){player.distance=race.distance;return[player,...race.rivals.map((v,i)=>({id:'rival'+i,distance:race.elapsed/v.pace+-(Math.floor(i/3)+1)*.012/layouts[s.circuit].scale*Math.max(0,1-race.distance/.06),color:v.color,model:rivalModels[i%rivalModels.length],number:String(i+2).padStart(2,'0')}))]}
const total=s.laps+s.progress;return[player,...NightLeague.names.map((name,i)=>({id:'rival'+i,distance:total*(1.03-i*.009)+(i+1)*.09,color:NightLeague.colors[i],model:rivalModels[i%rivalModels.length],number:String(i+2).padStart(2,'0')}))]}
function prepare(){const now=performance.now();if(now-stamp<1)return;const dt=(now-stamp)/1000;stamp=now;if(s.circuit!==lastCircuit||race!==lastRace){lanes.clear();lastCircuit=s.circuit;lastRace=race}frameCars=Traffic.targets(racers(),layouts[s.circuit].length).map(car=>{const previous=lanes.get(car.id)??car.lane,lane=Traffic.ease(previous,car.lane,dt);lanes.set(car.id,lane);return{...car,lane}})}
const rivalSprites=new Map();
function paintRival(car,p,depth){
  const key=[car.model,car.color,car.number,depth].join(':');
  let sprite=rivalSprites.get(key);
  if(!sprite){
    sprite=document.createElement('canvas');
    sprite.width=208;
    sprite.height=152;
    const g=sprite.getContext('2d');
    if(!g)return false;
    CarArt.draw(g,{x:104,y:76,scale:2,id:car.model,color:car.color,number:car.number,depth});
    if(rivalSprites.size>=24)rivalSprites.delete(rivalSprites.keys().next().value);
    rivalSprites.set(key,sprite);
  }
  const transform=ctx.getTransform();
  const zoom=Math.hypot(transform.a,transform.b)/(window.devicePixelRatio||1);
  const scale=Math.max(.17,ApexCamera.minCarSizePx(innerWidth)/(80*Math.max(.01,zoom)));
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.rotate(p.a);
  ctx.drawImage(sprite,-52*scale,-38*scale,104*scale,76*scale);
  ctx.restore();
  return true;
}
function paint(car){const p=Traffic.offset(position(car.distance),car.lane);const depth=window.apexPseudo3D===true;if(car.id!=='player'&&s.version===2&&window.ApexCamera&&paintRival(car,p,depth))return;if(car.id==='player'&&typeof NightView!=='undefined')NightView.trail(ctx,p,boost>0,s.running);CarArt.draw(ctx,{...p,scale:.17,id:car.model,color:car.id==='player'&&car.model!=='aurora'?undefined:car.color,number:car.number,depth})}
drawCar=function(t,color){prepare();if(color==='#e17e60'){frameCars.filter(c=>c.id!=='player').forEach(paint);return}if(color==='#8baded')return;const player=frameCars.find(c=>c.id==='player');if(player)paint(player)};
function playerPosition(){return Traffic.offset(position(race?race.distance:s.progress),lanes.get('player')||0)}
window.TrafficView={racers,playerPosition,invalidate(){stamp=0;frameCars=[]}};
})();

