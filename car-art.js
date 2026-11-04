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
if(shadow){ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(2,5,43,22,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#00000030';ctx.beginPath();ctx.ellipse(5,7,35,18,0,0,Math.PI*2);ctx.fill()}
// Carbon-fibre floor, wheels, suspension and brake ducts.
poly([[-30,-10],[-12,-m.width-4],[12,-m.width-2],[23,-7],[25,7],[12,m.width+2],[-12,m.width+4],[-30,10]],'#10202a','#42525d');
for(const side of [-1,1]){
  const y=side*(Number.isFinite(suspension)?18+suspension*.4:20);
  for(const axle of [-24,22]){
    ctx.strokeStyle='#a4b6bb';ctx.lineWidth=1.1;ctx.beginPath();
    ctx.moveTo(axle-4,side*7);ctx.lineTo(axle-6,y);
    ctx.moveTo(axle+5,side*7);ctx.lineTo(axle+4,y);ctx.stroke();
    const rubber=ctx.createLinearGradient(0,y-5,0,y+5);
    rubber.addColorStop(0,'#47545a');rubber.addColorStop(.22,'#10171a');
    rubber.addColorStop(.7,'#080e12');rubber.addColorStop(1,'#303c40');
    ctx.fillStyle='#03090d';ctx.beginPath();ctx.roundRect(axle-8,y-5,15,10,2.5);ctx.fill();
    ctx.fillStyle=rubber;ctx.beginPath();ctx.roundRect(axle-7.5,y-4.5,14,9,2);ctx.fill();
    rect(axle-5,y-3.7,9,.7,'#7f8d8b77');rect(axle-5,y+3,9,.5,'#aab8ac44');
    rect(axle-5,y-3.5,.8,7,'#c6a45a');rect(axle+4,y-3.5,.8,7,'#c6a45a');
    rect(axle-1,y-.8,2,1.6,'#8b9894');
  }
}
// Broad rear wing, two front-wing elements and coloured endplates.
rect(-38,-26,9,52,'#07151c');rect(-37,-24,2,48,paint);rect(-34,-23,1,46,'#dae5df88');rect(-38,-26,10,3,m.accent);rect(-38,23,10,3,m.accent);
poly([[m.nose-8,-m.wing],[m.nose-1,-m.wing],[m.nose+1,-6],[m.nose+1,6],[m.nose-1,m.wing],[m.nose-8,m.wing],[m.nose-4,5],[m.nose-4,-5]],'#182833','#789098');rect(m.nose-6,-m.wing,5,3,paint);rect(m.nose-6,m.wing-3,5,3,paint);
// Sculpted sidepods and long nose.
const g=ctx.createLinearGradient(0,-16,0,16);g.addColorStop(0,'#f4ffff');g.addColorStop(.1,paint);g.addColorStop(.55,paint);g.addColorStop(1,m.accent);
poly([[-31,-4],[-17,-m.width],[0,-m.width],[14,-6],[m.nose-2,-3],[m.nose-2,3],[14,6],[0,m.width],[-17,m.width],[-31,4]],g,'#ffffff88');
poly([[-29,-2],[-17,-5],[-6,-4],[8,-2],[m.nose-5,-1],[m.nose-5,1],[8,2],[-6,4],[-17,5],[-29,2]],'#ffffff24');
for(const side of [-1,1]){poly([[-20,side*7],[-8,side*(m.width-1)],[6,side*9],[-3,side*6]],m.accent);rect(-13,side*8-1,11,2,'#08151c');for(let i=0;i<4;i++)rect(-21+i*2,side*9,1,3,'#18242b')}
// Engine spine, cockpit, halo and helmet.
poly([[-31,-3],[-12,-5],[-4,-4],[-4,4],[-12,5],[-31,3]],m.accent);rect(-28,-.7,16,1.4,paint);poly([[-8,-4],[5,-5],[10,0],[5,5],[-8,4]],'#09141d','#9eaeb2');ctx.fillStyle='#dce7e5';ctx.beginPath();ctx.ellipse(1,0,3,3.2,0,0,Math.PI*2);ctx.fill();rect(1,-2.5,2,5,'#1b303d');ctx.strokeStyle='#a6b6b8';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-4,-5);ctx.quadraticCurveTo(13,-7,14,0);ctx.quadraticCurveTo(13,7,-4,5);ctx.stroke();rect(8,-.7,9,1.4,'#bbc8c7');
// Fine reflections and aerodynamic highlights add depth at close zoom.
ctx.strokeStyle='#ffffff55';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-24,-4);ctx.lineTo(-14,-8);ctx.lineTo(2,-7);ctx.stroke();
ctx.strokeStyle='#00000055';ctx.beginPath();ctx.moveTo(-19,10);ctx.lineTo(0,11);ctx.lineTo(14,6);ctx.stroke();
ctx.strokeStyle='#d9ffff66';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(16,-3);ctx.lineTo(m.nose-8,-2);ctx.moveTo(-23,-11);ctx.lineTo(-12,-14);ctx.stroke();
rect(-35,-.75,8,1.5,'#f3b54b');rect(-34,-.3,6,.6,'#fff3b3');
// Each model has its own livery marks and nose number.
for(let i=0;i<=m.fin;i++)poly([[17+i*3,-3],[19+i*3,-3],[16+i*3,3],[14+i*3,3]],m.accent);
ctx.save();ctx.translate(m.nose-6,0);ctx.rotate(Math.PI/2);ctx.fillStyle='#10202a';ctx.font='bold 5px Arial';ctx.textAlign='center';ctx.fillText(number,0,2);ctx.restore();ctx.restore()}
const api={models,draw};root.CarArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

