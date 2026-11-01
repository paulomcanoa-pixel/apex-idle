(function(root){
function start(duration){return {countdown:3,distance:0,elapsed:0,duration,done:false,rivals:[{name:'Costa',pace:15.8,color:'#66b8ff'},{name:'Vega',pace:17.2,color:'#ff685c'},{name:'Norte',pace:18.1,color:'#bd9aff'}]}}
function step(r,seconds,boostSeconds=0){if(r.done||!Number.isFinite(seconds)||seconds<=0)return 0;const wait=Math.min(r.countdown,seconds);r.countdown-=wait;seconds-=wait;if(!seconds)return 0;const rate=1+Math.min(seconds,Math.max(0,boostSeconds))/seconds;const used=Math.min(seconds,(5-r.distance)*r.duration/rate);r.elapsed+=used;r.distance=Math.min(5,r.distance+used*rate/r.duration);if(r.distance>=5-1e-9){r.distance=5;r.done=true}return used*rate}
function order(r){return [{name:'Você',distance:r.distance,time:r.distance===5?r.elapsed:Infinity,player:true},...r.rivals.map(v=>({...v,distance:Math.min(5,r.elapsed/v.pace),time:5*v.pace}))].sort((a,b)=>b.distance-a.distance||a.time-b.time)}
function advance(r,s,seconds,extra,reward){const before=Math.floor(r.distance);step(r,seconds,extra);const laps=Math.floor(r.distance)-before;s.progress=r.distance%1;s.laps+=laps;s.rep+=laps;s.money+=laps*reward;return laps}
const api={start,step,order,advance};root.Race=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
