(function(root){
const cache=new WeakMap;
function fitCircuit(points,{w,h},margin=.08){const key=w+'x'+h+':'+margin,map=cache.get(points)||new Map;if(map.has(key))return map.get(key);const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs)-32,maxX=Math.max(...xs)+32,minY=Math.min(...ys)-32,maxY=Math.max(...ys)+32,scale=Math.min(w*(1-2*margin)/(maxX-minX),h*(1-2*margin)/(maxY-minY));const result={scale,centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,offsetX:w/2-(minX+maxX)/2*scale,offsetY:h/2-(minY+maxY)/2*scale};if(map.size>=4)map.delete(map.keys().next().value);map.set(key,result);cache.set(points,map);return result}
// An orthographic tilt changes only presentation; circuit coordinates stay untouched.
function fitProjected(points,viewport,verticalScale=1,margin=.08){
  const tilt=Math.max(.5,Math.min(1,verticalScale));
  const fitted=fitCircuit(points,{w:viewport.w,h:viewport.h/tilt},margin);
  return {...fitted,verticalScale:tilt,offsetY:viewport.h/2-fitted.centerY*fitted.scale*tilt};
}
function minCarSizePx(w){return w<760?14:18}
const api={fitCircuit,fitProjected,minCarSizePx};root.ApexCamera=api;if(typeof module!=='undefined')module.exports=api
})(typeof window!=='undefined'?window:globalThis);
