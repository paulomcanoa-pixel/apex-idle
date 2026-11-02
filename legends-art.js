(function(root){
const D=LegendsData,base=CarArt.draw;
function draw(ctx,o={}){const m=D.cars.find(c=>c.id===o.id);if(!m)return base(ctx,o);const {x=0,y=0,a=0,scale=1,shadow=true}=o;
ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(scale,scale);const N=m.nose,W=m.width,modern=m.year>=2018,grooves=m.year>=1998&&m.year<=2008;
function p(pts,c,stroke){ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));ctx.closePath();ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.6;ctx.stroke()}}
function r(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function line(pts,c,width=1){ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke()}
if(shadow){ctx.shadowColor='#000a';ctx.shadowBlur=6;ctx.shadowOffsetY=3;p([[-39,-22],[N+3,-25],[N+3,25],[-39,22]],'#0001');ctx.shadowBlur=0;ctx.shadowOffsetY=0}
if(m.shape!=='cigar')p([[-30,-W-3],[10,-W-4],[25,-7],[25,7],[10,W+4],[-30,W+3]],'#0a1017','#40515c');
const axles=m.shape==='cigar'?[-25,23]:[-24,24],track=m.shape==='cigar'?18:modern?24:21;
for(const side of [-1,1])for(const axle of axles){line([[axle-5,side*5],[axle-7,side*track],[axle+5,side*7]],'#9ba8ad',1);line([[axle+5,side*6],[axle+5,side*track]],'#9ba8ad',.9);const tw=m.year<1990&&axle<0?18:modern?17:15,th=modern?12:11;r(axle-tw/2,side*track-th/2,tw,th,'#070b11');r(axle-tw/2+1,side*track-th/2+.7,tw-2,1,'#4d535b');r(axle-tw/2+1,side*track+th/2-1.8,tw-2,1,'#252b34');if(grooves)for(let k=-3;k<=3;k+=2)r(axle-tw/2+1,side*track+k,tw-2,.35,'#63717a');if(modern){ctx.strokeStyle='#697077';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(axle,side*track,5,th/2-1,0,0,7);ctx.stroke()}}
if(m.wing){const rear=m.year>=2009&&m.year<2017?18:26;r(-39,-rear,7,rear*2,'#101722');r(-39,-rear,2,rear*2,m.color);r(-41,-rear-1,11,2,m.accent);r(-41,rear-1,11,2,m.accent);const fw=m.wing;p([[N-10,-fw],[N-2,-fw],[N+2,-6],[N+2,6],[N-2,fw],[N-10,fw],[N-5,5],[N-5,-5]],m.year>=2009?'#19232e':m.color,'#b6c2c777');for(let i=0;i<(modern?4:2);i++)line([[N-8+i,-fw+2],[N-4+i,-8],[N-4+i,8],[N-8+i,fw-2]],i===0?m.accent:'#61717a',.65)}
if(m.shape==='cigar'){p([[-30,-5],[-12,-8],[15,-7],[N,-2],[N,2],[15,7],[-12,8],[-30,5]],m.color,'#e9e7be88');r(-28,-1.4,58,2.8,m.accent);for(let i=0;i<6;i++){r(-30+i*2,-7,1.2,4,'#a1a7a8');r(-30+i*2,3,1.2,4,'#a1a7a8')}line([[-28,-9],[-12,-9]],'#bac2c5',1.5);line([[-28,9],[-12,9]],'#bac2c5',1.5)}
else{
const g=ctx.createLinearGradient(0,-W,0,W);g.addColorStop(0,'#ffffff');g.addColorStop(.14,m.color);g.addColorStop(.72,m.color);g.addColorStop(1,'#101b2c');
const body=m.shape==='wedge'? [[-32,-W],[-5,-W],[25,-9],[N,-3],[N,3],[25,9],[-5,W],[-32,W]]:m.shape==='skirts'?[[-32,-W],[10,-W],[13,-7],[N,-2],[N,2],[13,7],[10,W],[-32,W]]:[[-32,-4],[-19,-W],[1,-W],[18,-7],[N,-2.5],[N,2.5],[18,7],[1,W],[-19,W],[-32,4]];
p(body,g,'#eff7fb66');
if(m.shape==='skirts')for(const side of [-1,1]){r(-30,side*W-1,40,2,m.accent);line([[-30,side*(W-3)],[8,side*(W-3)]],m.accent,.5)}
for(const side of [-1,1]){p([[-23,side*8],[-9,side*(W-1)],[4,side*(W-2)],[10,side*8]],m.team==='Renault'?m.accent:m.team==='McLaren'&&m.year===1988?'#f5f2e6':m.color);line([[-25,side*(W-1)],[1,side*(W-1)],[16,side*6]],m.accent,modern?2.5:1.5);r(-9,side*9-1,12,2,'#111820');if(m.shape==='ground'){p([[-21,side*W],[-2,side*(W+2)],[16,side*8],[0,side*9]],'#111a26');line([[-20,side*(W-1)],[0,side*(W+1)],[15,side*8]],m.accent,1.2)}}
if(m.team==='Ferrari'){r(22,-2.2,N-27,4.4,m.color);r(-37,-19,4,38,'#f4eee8');for(let i=0;i<3;i++)r(-22+i*3,-7,1,14,'#121923');p([[18,-4],[24,-3],[24,3],[18,4]],'#f0d45b')}
if(m.id==='mp44'){p([[N,-2.5],[N-15,-6],[N-6,0],[N-15,6],[N,2.5]],'#ef4037');p([[-32,-4],[-18,-7],[-12,0],[-18,7],[-32,4]],'#ef4037')}
if(m.team==='Jordan'){for(const side of [-1,1])p([[-24,side*7],[-10,side*W],[4,side*W],[14,side*6]],'#3c7bab');line([[18,-3],[N,-2],[N,2],[18,3]],'#e7f5e9',1)}
if(m.shape==='turbo'){for(const side of [-1,1]){r(-31,side*10,15,3,'#c7a756');p([[2,side*W],[7,side*(W+4)],[11,side*W]],m.accent)}}
if(m.team==='Williams'){r(18,-3,N-23,6,m.id==='fw14b'?'#f6cf3d':'#f0eee6');for(const side of [-1,1]){line([[-20,side*W],[0,side*W],[18,side*5]],m.accent,3);line([[-20,side*(W-3)],[0,side*(W-3)]],'#c9aa60',.8)}}
if(m.team==='Renault')p([[10,-5],[N,-2.5],[N,2.5],[10,5],[17,0]],'#f5d731');
if(m.team==='Red Bull'){p([[N-18,-4],[N,-2.5],[N,2.5],[N-18,4],[N-21,0]],'#f8d82e');for(const side of [-1,1])p([[-20,side*9],[-6,side*12],[2,side*8],[-12,side*6]],m.id==='rb9'?'#a46bc2':'#df3534')}
if(m.team==='Mercedes')for(const side of [-1,1])line([[-28,side*6],[-13,side*(W-1)],[5,side*11],[18,side*5]],'#3dd9c5',2.2);
if(m.id==='bgp001'){p([[N-20,-4],[N,-2.5],[N,2.5],[N-20,4]],'#dcff39');for(const side of [-1,1])line([[-28,side*W],[0,side*W],[13,side*8]],'#dbff39',2.5)}
if(m.shape==='winglets')for(const side of [-1,1])for(let i=0;i<3;i++)p([[i*4,side*W],[i*4+3,side*(W+5)],[i*4+5,side*W]],m.accent);
if(m.shape==='stepped')p([[17,-4],[25,-4],[30,-2],[25,2],[17,4]],'#d5ae37');
p([[-30,-3],[-10,-5],[-4,-4],[-4,4],[-10,5],[-30,3]],m.year<1990?m.accent:m.color);line([[-28,0],[-9,0]],m.accent,1.2);
}
p([[-7,-4.5],[6,-5],[11,0],[6,5],[-7,4.5]],'#050e16','#7f949c');ctx.fillStyle='#eadb61';ctx.beginPath();ctx.ellipse(0,0,3.6,3.4,0,0,7);ctx.fill();r(1,-2.7,2,5.4,'#172f3f');
if(modern){line([[-4,-6],[10,-6],[15,0],[10,6],[-4,6]],'#8f9ea5',1.7);line([[9,0],[18,0]],'#a1afb6',1.4)}else{ctx.strokeStyle='#b4b9b7';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(-9,0,1.7,5,0,0,7);ctx.stroke()}
ctx.save();ctx.translate(N-10,0);ctx.rotate(Math.PI/2);ctx.fillStyle=m.team==='Red Bull'?'#b3222d':m.color==='#151c25'?'#f0f1e9':'#152534';ctx.font='bold 5.5px Arial';ctx.textAlign='center';ctx.fillText(m.number,0,2);ctx.restore();ctx.restore();
}
function helmet(ctx,{x=0,y=0,scale=1,id}={}){const d=D.drivers.find(d=>d.id===id);if(!d)return;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle=d.color;ctx.beginPath();ctx.roundRect(-34,-31,68,62,[28,28,16,16]);ctx.fill();ctx.strokeStyle='#ffffff66';ctx.lineWidth=1.2;ctx.stroke();ctx.fillStyle=d.accent;ctx.fillRect(-32,-12,64,9);ctx.fillRect(-26,18,52,5);ctx.fillStyle='#0a1526';ctx.beginPath();ctx.roundRect(-29,-6,58,20,6);ctx.fill();const g=ctx.createLinearGradient(-20,0,20,10);g.addColorStop(0,'#3a899f');g.addColorStop(1,'#111d37');ctx.fillStyle=g;ctx.fillRect(-25,-3,50,11);ctx.fillStyle='#ffffff77';ctx.fillRect(-24,-2,36,2);for(let i=0;i<3;i++){ctx.fillStyle=d.accent;ctx.fillRect(-13+i*9,29,4,2)}ctx.fillStyle='#eff2e4';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(d.name.split(' ').at(-1).toUpperCase().slice(0,10),0,25);ctx.restore()}
CarArt.draw=draw;root.LegendsArt={draw,helmet};
})(typeof window!=='undefined'?window:globalThis);
