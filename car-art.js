(function(root){
const models=[
{id:'aurora',name:'Aurora 01',color:'#d4fc5a',accent:'#143b32',nose:40,width:13,wing:27,fin:0},
{id:'vento',name:'Vento 02',color:'#b9d2de',accent:'#348ac3',nose:43,width:11,wing:24,fin:1},
{id:'scarlatto',name:'Scarlatto 03',color:'#ff594c',accent:'#f4cf8b',nose:38,width:14,wing:29,fin:2},
{id:'solar',name:'Solar 04',color:'#ffbd57',accent:'#403159',nose:41,width:14,wing:30,fin:3},
{id:'eclipse',name:'Eclipse 05',color:'#b498ff',accent:'#55ded8',nose:45,width:12,wing:28,fin:4}
];
function draw(ctx,{x=0,y=0,a=0,scale=1,id='aurora',color,number='01',shadow=true,wing,suspension}={}){const original=models.find(v=>v.id===id)||models[0],m={...original,wing:Number.isFinite(wing)?20+wing*1.4:original.wing},paint=color||m.color;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(scale,scale);
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke()}}
function rect(x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)}
if(shadow){ctx.shadowColor='#0009';ctx.shadowBlur=6;ctx.shadowOffsetY=3;poly([[-37,-19],[m.nose+2,-24],[m.nose+2,24],[-37,19]],'#00000008');ctx.shadowBlur=0;ctx.shadowOffsetY=0}
// Carbon-fibre floor, wheels, suspension and brake ducts.
poly([[-30,-10],[-12,-m.width-4],[12,-m.width-2],[23,-7],[25,7],[12,m.width+2],[-12,m.width+4],[-30,10]],'#10202a','#42525d');
for(const side of [-1,1]){const y=side*(Number.isFinite(suspension)?18+suspension*.4:20);for(const axle of [-24,22]){ctx.strokeStyle='#80949c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(axle-4,side*7);ctx.lineTo(axle-6,y);ctx.moveTo(axle+5,side*7);ctx.lineTo(axle+4,y);ctx.stroke();rect(axle-8,y-5,15,10,'#071016');rect(axle-7,y-4,13,1,'#455059');rect(axle-7,y+3,13,1,'#222b30');rect(axle-5,y-4,2,8,'#b59b5b');rect(axle+3,y-4,2,8,'#b59b5b')}}
// Broad rear wing, two front-wing elements and coloured endplates.
rect(-37,-25,6,50,'#0a141d');rect(-37,-24,2,48,paint);rect(-38,-26,10,3,m.accent);rect(-38,23,10,3,m.accent);
poly([[m.nose-8,-m.wing],[m.nose-1,-m.wing],[m.nose+1,-6],[m.nose+1,6],[m.nose-1,m.wing],[m.nose-8,m.wing],[m.nose-4,5],[m.nose-4,-5]],'#182833','#789098');rect(m.nose-6,-m.wing,5,3,paint);rect(m.nose-6,m.wing-3,5,3,paint);
// Sculpted sidepods and long nose.
const g=ctx.createLinearGradient(0,-16,0,16);g.addColorStop(0,'#f4ffff');g.addColorStop(.1,paint);g.addColorStop(.55,paint);g.addColorStop(1,m.accent);
poly([[-31,-4],[-17,-m.width],[0,-m.width],[14,-6],[m.nose-2,-3],[m.nose-2,3],[14,6],[0,m.width],[-17,m.width],[-31,4]],g,'#ffffff55');
for(const side of [-1,1]){poly([[-20,side*7],[-8,side*(m.width-1)],[6,side*9],[-3,side*6]],m.accent);rect(-13,side*8-1,11,2,'#08151c');for(let i=0;i<4;i++)rect(-21+i*2,side*9,1,3,'#18242b')}
// Engine spine, cockpit, halo and helmet.
poly([[-31,-3],[-12,-5],[-4,-4],[-4,4],[-12,5],[-31,3]],m.accent);rect(-28,-.7,16,1.4,paint);poly([[-8,-4],[5,-5],[10,0],[5,5],[-8,4]],'#09141d','#9eaeb2');ctx.fillStyle='#dce7e5';ctx.beginPath();ctx.ellipse(1,0,3,3.2,0,0,Math.PI*2);ctx.fill();rect(1,-2.5,2,5,'#1b303d');ctx.strokeStyle='#a6b6b8';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-4,-5);ctx.quadraticCurveTo(13,-7,14,0);ctx.quadraticCurveTo(13,7,-4,5);ctx.stroke();rect(8,-.7,9,1.4,'#bbc8c7');
// Each model has its own livery marks and nose number.
for(let i=0;i<=m.fin;i++)poly([[17+i*3,-3],[19+i*3,-3],[16+i*3,3],[14+i*3,3]],m.accent);
ctx.save();ctx.translate(m.nose-6,0);ctx.rotate(Math.PI/2);ctx.fillStyle='#10202a';ctx.font='bold 5px Arial';ctx.textAlign='center';ctx.fillText(number,0,2);ctx.restore();ctx.restore()}
const api={models,draw};root.CarArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

