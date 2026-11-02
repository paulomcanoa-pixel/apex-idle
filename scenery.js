// Geographic layouts reserve the outer edge for scenery, keeping the centerline unobstructed.
const plainDraw=draw;
draw=function(){plainDraw();ctx.save();const c=A.circuits[s.circuit];if(c.terrain==='night'){for(let i=0;i<28;i++){ctx.fillStyle=['#16414b','#35424b','#224c49'][i%3];const x=20+i*35;ctx.fillRect(x,20,23,16+i%3*8);ctx.fillStyle='#f9d58380';ctx.fillRect(x+4,25,3,3);ctx.fillRect(x+14,25,3,3)}}else{for(let i=0;i<30;i++){ctx.fillStyle=c.terrain==='desert'?'#9e88662a':'#447b4f35';ctx.beginPath();ctx.arc(22+i*33,30+Math.sin(i*2)*10,7+i%4,0,Math.PI*2);ctx.fill()}}ctx.restore()};
const facts=document.createElement('div');facts.id='circuitFacts';facts.className='circuit-facts';document.querySelector('.circuit-badge').append(facts);
const clock=document.createElement('strong');clock.id='lapClock';clock.className='lap-clock';clock.textContent='0:00.000';document.querySelector('.overlay').append(clock);
const credits=document.createElement('p');credits.className='circuit-credits';credits.innerHTML='24 pistas · coleção do calendário anunciado para 2026. Mapas geográficos: <a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noopener">Bacinger</a> · <a href="CIRCUITS-LICENSE.txt" target="_blank" rel="noopener">MIT</a>. Tempos de referência publicados pela F1; sua volta depende do carro e da estratégia.';$('circuits').prepend(credits);
render();
