(function(root){
const lanes=[-15,-5,5,15];
function gap(a,b){return Math.abs(((a-b+.5)%1+1)%1-.5)}
// Four side-by-side slots inside 44 world units of asphalt. Stable IDs prevent lane swaps each frame.
function targets(cars,trackLength){const near=38/trackLength;return cars.map((car,i)=>{const close=cars.some((other,j)=>i!==j&&gap(car.distance,other.distance)<near);return{...car,lane:close?lanes[i%4]:Math.sin(car.distance*Math.PI*6+i)*1.5}})}
function offset(p,lane){return{x:p.x-Math.sin(p.a)*lane,y:p.y+Math.cos(p.a)*lane,a:p.a}}
function ease(current,target,dt){return current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(.1,dt))*5))}
const api={lanes,gap,targets,offset,ease};root.Traffic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
