(function(root){
const color=id=>'hsl('+((root.ApexShop||require('./shop')).hash(id||'aurora')%360)+' 76% 62%)';
function paintColor(equipped,fallback){return equipped?.pintura?color(equipped.pintura):fallback}
function decorate(ctx,o,equipped={}){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a||0);ctx.scale(o.scale||1,o.scale||1);if(equipped.capacete){ctx.fillStyle=color(equipped.capacete);ctx.strokeStyle='#EEF0FF';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(-3,0,4.5,0,7);ctx.fill();ctx.stroke()}if(equipped.rodas){const spokes=3+root.ApexShop.hash(equipped.rodas)%8;ctx.strokeStyle=color(equipped.rodas);ctx.lineWidth=.8;for(const x of [-24,22])for(const y of [-20,20]){ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.stroke();for(let i=0;i<spokes;i++){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4*Math.cos(i*7/spokes),y+4*Math.sin(i*7/spokes));ctx.stroke()}}}ctx.restore()}
root.ApexCosmetics={paintColor,decorate,color};if(typeof module!=='undefined')module.exports=root.ApexCosmetics;
})(typeof window!=='undefined'?window:globalThis);

