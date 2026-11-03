import * as B from './balance.mjs'; const {P}=B;
const f=n=>n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'k':String(Math.round(n));
console.log('## custo (CR) e efeito de PI acumulado por ramo');
for(const b of P.branches){console.log(b.id, [1,5,10,25,50].map(L=>`N${L}: custo ${f(B.upCost(b.base,P.g,L-1))} / total ${f(Array.from({length:L},(_,i)=>B.upCost(b.base,P.g,i)).reduce((a,c)=>a+c))} / +${(B.effect(L,b.k)*100).toFixed(0)}%PI`).join(' | '))}
console.log('patro', [1,5,10,25,50].map(L=>`N${L}: custo ${f(B.upCost(P.patro.base,P.patro.g,L-1))} / renda x${B.patroMult(L).toFixed(2)}`).join(' | '));
console.log('## pistas: n|nome|volta tela|CR/volta|PI lider|PI ultimo|REP p/ abrir|vol real');
for(let n=0;n<24;n++)console.log([n+1,B.NAMES[n],B.screenLap(n).toFixed(1)+'s',f(B.lapReward(n)),B.aiLeaderPI(n).toFixed(2),B.aiPI(n,8).toFixed(2),B.repToOpen(n)].join('|'));
console.log('lap start (pista1, PI1.0):', (B.screenLap(0)/B.paceFactor(1,B.aiLeaderPI(0))).toFixed(1),'s; corrida', B.raceSeconds(0,1).toFixed(0),'s');
