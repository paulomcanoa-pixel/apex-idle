// Arte vetorial original do autódromo, desenhada no mesmo Canvas do jogo.
const plainDraw=draw;
function tree(x,y,r){ctx.fillStyle='#071e1d55';ctx.beginPath();ctx.ellipse(x+5,y+7,r*1.05,r*.7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#123b2b';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#24513a';ctx.beginPath();ctx.arc(x-3,y-4,r*.72,0,Math.PI*2);ctx.fill();ctx.fillStyle='#346247';ctx.beginPath();ctx.arc(x-5,y-6,r*.36,0,Math.PI*2);ctx.fill()}
draw=function(){plainDraw();ctx.save();
// Bosques nas bordas, fora da faixa de corrida.
for(let i=0;i<25;i++){const x=30+i*39,y=55+Math.sin(i*2.3)*13;tree(x,y,11+(i%4)*2)}for(let i=0;i<12;i++){tree(35+Math.sin(i*3)*12,125+i*33,12+i%3*2);tree(955+Math.sin(i*2)*13,140+i*31,13+i%3)}
// Boxes, telhados, garagens e uma via de serviço.
ctx.fillStyle='#101e26';ctx.fillRect(565,464,280,48);ctx.fillStyle='#566c70';ctx.fillRect(560,457,290,36);ctx.fillStyle='#79908e';ctx.fillRect(560,457,290,5);for(let i=0;i<9;i++){ctx.fillStyle=i===0?(s.color||'#d4fc5a'):'#263e48';ctx.fillRect(570+i*30,465,23,22);ctx.fillStyle='#b2c4bb';ctx.fillRect(576+i*30,470,11,2)}ctx.fillStyle='#23332f';ctx.fillRect(554,517,300,15);ctx.fillStyle='#81958c';ctx.font='8px Arial';ctx.fillText('P I T   L A N E',650,528);
// Arquibancada e público estilizado.
ctx.save();ctx.translate(330,82);for(let row=0;row<4;row++){ctx.fillStyle=row%2?'#55706d':'#3d5656';ctx.fillRect(-95,row*7,190,6);for(let col=0;col<45;col++){ctx.fillStyle=['#d7ba8a','#c7d5cf','#657eae','#b76254'][(col*7+row*3)%4];ctx.fillRect(-91+col*4.1,row*7+1,2,2)}}ctx.restore();
// Marquage infield e zona de apoio.
ctx.fillStyle='#ffffff10';ctx.font='italic bold 40px Arial';ctx.fillText('AURORA',633,386);ctx.font='9px Arial';ctx.fillStyle='#a7bdac88';ctx.fillText('R A C E W A Y   /   S E T O R   0 2',638,402);for(let i=0;i<5;i++)tree(320+i*36,365+Math.sin(i)*8,10);ctx.restore()};
