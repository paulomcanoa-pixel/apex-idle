const {test}=require('node:test');
const assert=require('node:assert/strict');
const Apex=require('./engine');
const V2=require('./src/v2-adapter');
const Shop=require('./src/shop');
const Academy=require('./academy-model');
const Product=require('./src/product-view');

const now=1800000000000;
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} deveria ser ${b}`);

test('a prévia usa o bônus efetivo do contexto de corrida e concede o mesmo XP do treino',()=>{
  const s=Apex.initial();
  s.stage=2;
  s.money=1e9;
  s.season.titles=4;
  s.season.legacyPath='academy';
  s.championship.roster.real_senna={copies:0,stars:5};
  s.championship.roster.iris={copies:0,stars:5};
  assert(Shop.equipStaff(s,'real_senna'));
  assert(Shop.equipStaff(s,'iris'));
  s.shop.inventory.cars.push('mp44');
  s.shop.selectedCar='mp44';

  const wet={wet:true,trackProfile:'curvas'},dry={wet:false,trackProfile:'potencia'};
  const before=Shop.trainingPreview(s,'treino-intensivo',wet);
  const dryBefore=Shop.trainingPreview(s,'treino-intensivo',dry);
  assert.equal(before.xp,650);
  near(before.teamBonusBefore,.36);
  near(before.teamBonusAfter,.364);
  near(before.effectiveBonusBefore,.4);
  near(before.effectiveBonusAfter,.4);
  assert.equal(before.effectiveGain,0);
  assert(before.capped);
  assert.match(before.contextLabel,/Chuva/);
  near(dryBefore.effectiveBonusBefore,.39);
  near(dryBefore.effectiveGain,.004);
  assert(!dryBefore.capped);
  const current=V2.performance(s,undefined,wet);
  assert.equal(current.affinityBonus,.03);
  near(current.effectiveAffinityBonus,.004);
  assert.match(Product.garage(s,wet),/catálogo · \+3 p\.p\. de afinidade · \+0,4 p\.p\. efetivos/);

  assert(Shop.buy(s,'treino-intensivo',{now}).ok);
  assert(Shop.finishTraining(s,false,now+before.minutes*60000));
  assert.equal(Shop.driver(s).xp,before.xp);
  near(V2.performance(s,undefined,wet).staffBonus,before.effectiveBonusAfter);
  near(V2.performance(s,undefined,dry).staffBonus,dryBefore.effectiveBonusAfter);
  near(V2.performance(s,undefined,wet).effectiveAffinityBonus,0);
});

test('cada dossiê novo conta telemetria da especialidade e valida os limites',()=>{
  const s=Apex.initial();
  const cases=[
    ['real_senna','Controle na chuva',{place:6,event:'rain'},{place:5,event:'rain'}],
    ['real_button','Gestão de pneus',{trial:{pitWindow:true,pitStops:1,wornSeconds:1.01}},{trial:{pitWindow:true,pitStops:1,wornSeconds:1}}],
    ['real_hakkinen','Volta rápida',{trial:{bestLap:10.21,referenceLap:10}},{trial:{bestLap:10.2,referenceLap:10}}],
    ['enzo','Ataque no pelotão',{place:3,trial:{startPlace:4}},{place:2,trial:{startPlace:4}}]
  ];
  for(const [id,label,fail,pass] of cases){
    assert(Academy.choose(s,id,now));
    const project=s.academy.projects[id],req=Academy.requirements(s,id);
    assert.equal(project.trialVersion,1);
    assert.equal(req.trialLabel,label);
    assert.equal(req.wet,0);
    assert(Academy.record(s,{place:3}));
    assert(Academy.record(s,{place:3,...fail}));
    assert.equal(project.trials,0);
    assert(Academy.record(s,{place:3,...pass}));
    assert.equal(project.trials,1);
    project.trials=100000;
    assert(Academy.record(s,{place:3,...pass}));
    assert.equal(project.trials,100000);
  }
  const enzo=s.academy.projects.enzo;
  Object.assign(enzo,{trials:0,fragments:30,races:24,podiums:3,combos:4});
  s.money=10000;
  s.academy.licence=10;
  assert(!Academy.ready(s,'enzo'));
  assert(Academy.record(s,{place:1,trial:{startPlace:2}}));
  assert.equal(enzo.trials,1);
  assert(Academy.ready(s,'enzo'));
  assert(Academy.valid(JSON.parse(JSON.stringify(s))));
  s.academy.projects.enzo.trials=-1;
  assert(!Academy.valid(s));
});

test('dossiês e contratos salvos sem versão mantêm os requisitos e o progresso',()=>{
  const s=Apex.initial();
  s.money=1e9;
  const a=Academy.init(s,now);
  a.licence=40;
  a.projects.real_senna={fragments:140,races:120,podiums:24,wet:5,combos:30};
  assert(Academy.choose(s,'real_senna',now));
  const p=a.projects.real_senna;
  const req=Academy.requirements(s,'real_senna');
  assert.equal(p.trialVersion,undefined);
  assert.equal(req.wet,6);
  assert.equal(req.credits,150000);
  assert(!Academy.ready(s,'real_senna'));
  assert(Academy.record(s,{place:10,event:'rain'}));
  assert(Academy.negotiate(s,now));
  const restored=JSON.parse(JSON.stringify(s));
  assert(Academy.valid(restored));
  assert.equal(Academy.sign(restored,now+req.minutes*60000),'real_senna');
  const copy=Academy.requirements(restored,'real_senna');
  assert(copy.copy);
  assert.equal(copy.trials,undefined);
  assert.equal(copy.wet,0);
  assert.equal(copy.credits,37500);
});
