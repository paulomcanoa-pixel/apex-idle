// Modelo de balanceamento do Apex Idle 1.0 (parametros = fonte unica; o Codex deve copiar para src/balance.js)
export const P = {
  laps: 5, lapScreenK: 0.25, lapMin: 16, lapMax: 26, paceGamma: 0.5, paceMin: 0.8, paceMax: 1.35,
  r0: 14, rg: 1.30,            // CR por volta na pista n (0-based): r0 * rg^n
  prizeK: 0.6,                 // premio = lapReward*(11-place)*prizeK (formula atual)
  d0: 1.3, dg: 1.19, dg2: 1.075, dgBreak: 9,          // PI do lider da IA: d0 * dg^n
  aiStep: 0.018,               // cada vaga abaixo do lider perde 1.8% de PI
  pts: [25,18,15,12,10,8,6,4,3,2],
  repA: 5, repB: 2.2,         // REP acumulado p/ abrir pista n (n>=1): round(repA * n^repB)
  g: 1.16,                     // crescimento de custo por nivel
  ms: [10,25,50,100], msMult: 1.25,
  branches: [ // k = efeito de PI por nivel; base = custo nivel 0->1
    {id:'motor', k:.030, base:50}, {id:'aero', k:.026, base:75}, {id:'pneus', k:.020, base:110},
    {id:'piloto', k:.014, base:180}, {id:'pit', k:.010, base:260},
  ],
  patro: {base: 120, g: 1.17, perLevel: .10},   // +10%/nivel (com marcos) na renda de corrida
  gens: [{base:15,rate:.1},{base:100,rate:1},{base:1100,rate:8},{base:12000,rate:47},{base:130000,rate:260},{base:1400000,rate:1400}],
  genG: 1.15, genRateMul: 1, genUnlock: [1,1,3,6,10,16],      // pista minima para cada gerador aparecer
  overhead: 6,                                  // s entre corridas (contagem + resultado)
};
export const REAL_LAP = [70.54,75.743,91.447,79.813,92.238,90.965,90.734,89.708,73.078,72.909,67.924,87.097,104.701,76.627,71.097,80.901,95.587,103.009,93.808,96.169,77.774,93.365,82.384,85.637];
export const NAMES = ['Interlagos','Barcelona-Catalunya','Bahrain','Albert Park','Shanghai','Suzuka','Jeddah','Miami','Gilles-Villeneuve','Mônaco','Red Bull Ring','Silverstone','Spa-Francorchamps','Hungaroring','Zandvoort','Monza','Madrid','Baku','Marina Bay','COTA','Hermanos Rodríguez','Las Vegas','Lusail','Yas Marina'];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const msFactor=(L,p=P)=>p.msMult**p.ms.filter(m=>L>=m).length;
export const effect=(L,k,p=P)=>k*L*msFactor(L,p);
export const upCost=(base,g,L)=>Math.ceil(base*g**L);
export const screenLap=(n,p=P)=>clamp(p.lapScreenK*REAL_LAP[n],p.lapMin,p.lapMax);
export const lapReward=(n,p=P)=>Math.floor(p.r0*p.rg**n);
export const aiLeaderPI=(n,p=P)=>p.d0*p.dg**Math.min(n,p.dgBreak)*p.dg2**Math.max(0,n-p.dgBreak);
export const aiPI=(n,i,p=P)=>aiLeaderPI(n,p)*(1-p.aiStep*i);
export const repToOpen=(n,p=P)=>n<=0?0:Math.round(p.repA*n**p.repB);
export const paceFactor=(pi,d,p=P)=>clamp((pi/d)**p.paceGamma,p.paceMin,p.paceMax);
export const placeOf=(pi,n,p=P)=>{let pl=1;for(let i=0;i<9;i++)if(aiPI(n,i,p)>pi)pl++;return pl};
export const playerPI=(lv,titles=0,p=P)=>(1+p.branches.reduce((s,b,i)=>s+effect(lv[i],b.k,p),0))*(1+0.08*titles);
export const patroMult=(L,p=P)=>1+effect(L,p.patro.perLevel,p);
export const raceIncome=(n,place,patL,titles,p=P)=>(p.laps*lapReward(n,p)+Math.floor(lapReward(n,p)*(11-place)*p.prizeK))*patroMult(patL,p)*(1+0.25*titles);
export const raceSeconds=(n,pi,p=P)=>p.laps*screenLap(n,p)/paceFactor(pi,aiLeaderPI(n,p),p)+p.overhead;
