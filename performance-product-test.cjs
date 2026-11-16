const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('./engine');
const Adapter=require('./src/v2-adapter');
const V=require('./src/progression-v2');
const Shop=require('./src/shop');
const Vehicle=require('./src/vehicle-performance');
const Data=require('./legends-data');

function player(){const s=A.initial();s.money=1e12;s.stage=11;s.maxCircuit=23;s.escuderia=20;Shop.init(s);s.championship.tickets=1000;s.championship.gems=1000;return s}
function sampleFor(id,banner='banner-padrao',misses=0){let before=0;for(const row of Shop.bannerRates(banner,undefined,misses)){if(row.car.id===id)return(before+row.chance/2)/100;before+=row.chance}throw Error('Carro ausente: '+id)}

test('todos os históricos têm o mesmo desempenho quando vêm da garagem antiga ou da invocação',()=>{
  for(const car of Data.cars){
    const old=player(),fresh=player();
    old.garage.owned.push(car.id);old.garage.equipped=car.id;old.shop.selectedCar='';
    fresh.shop.inventory.cars.push(car.id);fresh.shop.selectedCar=car.id;
    assert.equal(A.equippedCar(old).id,car.id);
    assert.equal(A.equippedCar(fresh).id,car.id);
    assert.equal(Adapter.pi(old),Adapter.pi(fresh),car.id);
    assert.equal(A.duration(old),A.duration(fresh),car.id);
    assert.equal(Adapter.performance(old).base,Shop.get(car.id).effect.piPct,car.id);
  }
});

test('atributos diferenciam retas, curvas, pneus e afinidade e a comparação prevê a troca real',()=>{
  const s=player(),straight=Vehicle.performance(s,'lotus49',{trackProfile:'potencia'}),corners=Vehicle.performance(s,'lotus49',{trackProfile:'curvas'});
  assert(straight.bonus>corners.bonus);
  assert.equal(straight.synergy,true);
  assert.equal(straight.synergyLabel,'Dupla de afinidade');
  assert(Vehicle.performance(s,'bgp001').windowMult>Vehicle.performance(s,'mp423').windowMult);
  const wet=Vehicle.performance(s,'lotus49',{wet:true});assert(wet.staffBonus>Vehicle.performance(s,'lotus49').staffBonus);
  const forecast=Adapter.compare(s,'rb19'),before=A.duration(s);
  s.shop.inventory.cars.push('rb19');s.shop.selectedCar='rb19';
  assert(Math.abs((A.duration(s)-before)-forecast.lapDelta)<1e-10);
  assert.equal(Adapter.pi(s),forecast.candidatePI);
});

test('migração de funcionários mantém estrelas, cópias, XP e seleção uma única vez',()=>{
  const s=player();s.championship.roster.enzo={stars:1,copies:1};
  s.shop.inventory.staff['piloto-enzo-vale']={stars:3,copies:4,xp:600};s.shop.selectedPilot='piloto-enzo-vale';
  Shop.init(s);assert.deepEqual(s.championship.roster.enzo,{stars:3,copies:5});
  assert.equal(Shop.driver(s).id,'enzo');assert.equal(Shop.driver(s).xp,600);assert.equal(Shop.driver(s).level,3);
  for(let i=0;i<10;i++)Shop.init(s);
  assert.deepEqual(s.championship.roster.enzo,{stars:3,copies:5});
  const restored=JSON.parse(JSON.stringify(s));Shop.init(restored);
  assert.deepEqual(restored.championship.roster.enzo,{stars:3,copies:5});
  assert.equal(Shop.driver(restored).xp,600);assert(A.validate(restored));
});

test('pilotos exigem Academia mesmo com saldo, desconto ou troca; engenheiros continuam compráveis',()=>{
  const s=player();s.cat=5;s.money=1e30;s.shop.pts=1e6;
  for(const item of Shop.catalog.items.filter(x=>x.category==='pilotos')){
    const before=JSON.stringify(s);
    assert.equal(Shop.buy(s,item.id).ok,false);
    assert.equal(Shop.buyOffer(s,{id:item.id,currency:'cr',offerPrice:1,offerKey:'forged:'+item.id}).ok,false);
    assert.equal(JSON.stringify(s),before);
  }
  assert.equal(Shop.tradeExtra(s,'staff'),false);
  assert(Shop.dailyShop(s).every(offer=>offer.category!=='pilotos'));
  assert(Shop.buy(s,'engenheiro-ana-circuito').ok);
  assert(Shop.equipStaff(s,'ana'));assert.equal(Shop.engineer(s).id,'ana');
});

test('treino concede XP ao piloto escolhido no início e melhora seu desempenho após equipá-lo',()=>{
  const s=player(),now=1800000000000;
  s.stage=2;s.maxCircuit=4;s.circuit=4;s.levels=Array(6).fill(10);
  assert(Shop.equipStaff(s,'lia'));
  const before=Shop.driver(s).bonus,lapBefore=A.duration(s);
  assert(Shop.buy(s,'treino-basico',{now}).ok);
  assert.equal(Shop.finishTraining(s,false,now+299999),false);
  assert(Shop.equipStaff(s,'real_clark'));
  assert(Shop.finishTraining(s,false,now+300000));
  assert.equal(Shop.driver(s).xp,0);
  assert(Shop.equipStaff(s,'lia'));assert.equal(Shop.driver(s).xp,100);assert.equal(Shop.driver(s).level,2);
  assert(Shop.driver(s).bonus>before);assert(A.duration(s)<lapBefore);
  assert.equal(Shop.finishTraining(s,false,now+300000),false);
  assert(A.validate(JSON.parse(JSON.stringify(s))));
});

test('chance mítica cresce sem garantia absoluta e a espera média principal é de aproximadamente 700',()=>{
  assert.equal(Shop.mythicChance('banner-padrao',0),.001);
  assert(Shop.mythicChance('banner-padrao',700)>Shop.mythicChance('banner-padrao',100));
  assert(Shop.mythicChance('banner-padrao',1e9)<1);
  let survival=1,mean=0;
  for(let misses=0;misses<100000&&survival>1e-14;misses++){mean+=survival;survival*=1-Shop.mythicChance('banner-padrao',misses)}
  assert(Math.abs(mean-700)<.01,`Espera média: ${mean}`);
  const s=player();s.shop.pity['banner-padrao']={epic:0,legendary:0,mythic:100000};
  assert.notEqual(Shop.summon(s,'banner-padrao',1,()=>0)[0].car.rarity,'mitico');
  assert.equal(s.shop.pity['banner-padrao'].mythic,100001);
});

test('taxas ficam normalizadas em todos os banners e desejo dobra somente o carro escolhido',()=>{
  for(const banner of ['banner-padrao','banner-destaque','banner-lendas'])for(const misses of [0,100,700,100000]){
    const base=Shop.bannerRates(banner,undefined,misses),wish=Shop.bannerRates(banner,'rb19',misses);
    for(const rows of [base,wish]){assert(Math.abs(rows.reduce((sum,row)=>sum+row.chance,0)-100)<1e-8);assert(rows.every(row=>row.chance>=0&&Number.isFinite(row.chance)))}
    if(banner!=='banner-lendas')assert.equal(wish.find(row=>row.car.id==='rb19').chance,2*base.find(row=>row.car.id==='rb19').chance);
  }
});

test('invocação reseta o contador mítico ao obter um e preserva garantias épica e lendária',()=>{
  const s=player();s.shop.pity['banner-padrao']={epic:0,legendary:0,mythic:700};
  assert.equal(Shop.summon(s,'banner-padrao',1,()=>sampleFor('rb19','banner-padrao',700))[0].id,'rb19');
  assert.deepEqual(s.shop.pity['banner-padrao'],{epic:0,legendary:0,mythic:0});
  s.shop.pity['banner-padrao']={epic:9,legendary:9,mythic:9};
  assert.equal(Shop.summon(s,'banner-padrao',1,()=>0)[0].car.rarity,'epico');
  s.shop.pity['banner-padrao']={epic:0,legendary:199,mythic:199};
  const last=Shop.summon(s,'banner-padrao',1,()=>0)[0];assert.equal(last.car.rarity,'lendario');assert(last.guaranteed);
  assert.equal(s.shop.pity['banner-padrao'].mythic,200);
});

test('projetos respeitam desbloqueio, preço, propriedade e exclusividade sem consumir saldo em falha',()=>{
  const s=player();s.materials=1e6;s.catProgress=true;s.stage=4;
  const before=s.materials;assert.equal(Shop.buildProject(s,'lotus72'),false);assert.equal(s.materials,before);
  s.stage=5;
  for(const car of Data.cars.filter(x=>!x.exclusive&&x.id!=='lotus49')){
    const cost=Shop.projectCost(car.id);s.materials=cost-1;assert.equal(Shop.buildProject(s,car.id),false);assert.equal(s.materials,cost-1);
    s.materials=cost;assert(Shop.buildProject(s,car.id));assert.equal(s.materials,0);assert(Shop.owned(s,Shop.get(car.id)));
    s.materials=1e6;assert.equal(Shop.buildProject(s,car.id),false);assert.equal(s.materials,1e6);
  }
  for(const id of ['lotus97t','jordan191','car-f1-raro','unknown']){assert.equal(Shop.projectCost(id),Infinity);assert.equal(Shop.buildProject(s,id),false)}
});

test('repetidos históricos dão metade do preço de troca, incluindo os exclusivos',()=>{
  for(const car of Data.cars){
    const s=player();s.cat=5;s.shop.inventory.cars.push(car.id);const banner=car.exclusive?'banner-lendas':'banner-padrao';
    const result=Shop.summon(s,banner,1,()=>sampleFor(car.id,banner))[0];
    assert.equal(result.id,car.id);assert(result.duplicate);assert.equal(result.points,Data.prices[car.rarity]/2);assert.equal(s.shop.pts,result.points);
  }
});

test('loja adiciona campos ausentes em saves antigos sem apagar inventário, pontos ou extensões',()=>{
  const absent=V.initial();assert(Shop.valid(absent));assert(V.valid(absent));
  absent.summonPoints=650;const q=Shop.init(absent);assert.equal(q.pts,650);assert(Shop.valid(absent));
  const s=V.initial();s.shop={inventory:{cars:['car-f1-raro','f2004'],staff:{'piloto-enzo-vale':{stars:2,copies:3,xp:400}}},pts:900,pity:{'banner-padrao':{mythic:45}},customExtension:{note:'preservar'}};
  const before=JSON.stringify(s);assert(Shop.valid(s));assert.equal(JSON.stringify(s),before,'Validar não deve migrar ou modificar o save');
  Shop.init(s);assert.deepEqual(s.shop.inventory.cars,['car-f1-raro','f2004']);assert.equal(s.shop.pts,900);
  assert.deepEqual(s.shop.pity['banner-padrao'],{epic:0,legendary:0,mythic:45});assert.deepEqual(s.shop.customExtension,{note:'preservar'});
  assert.equal(Shop.teamRoster(s).find(x=>x.id==='enzo').xp,400);assert(V.valid(s));
  const restored=JSON.parse(JSON.stringify(s));Shop.init(restored);assert.deepEqual(restored.shop,s.shop);assert(V.valid(restored));
  const empty=V.initial();empty.shop={};assert(Shop.valid(empty));assert.doesNotThrow(()=>Shop.init(empty));assert(Shop.valid(empty));
});

test('importação rejeita formatos perigosos e XP inválido antes de inicializar a loja',()=>{
  const invalid=[null,[],1,'loja',{inventory:null},{inventory:{cars:{}}},{inventory:{cars:[42]}},{inventory:{staff:{lia:null}}},
    {inventory:{staff:{lia:{stars:6}}}},{staffXp:{lia:NaN}},{staffXp:{lia:Infinity}},{staffXp:{lia:-1}},
    {staffMigrated:{lia:1}},{pity:{'banner-padrao':null}},{pity:{'banner-padrao':{mythic:-1}}},{pts:-1},
    {boosts:{cr:'amanhã'}},{training:{pilot:'lia',xp:100,end:0}},{presets:{1:{setup:{wing:'5',suspension:5}}}},
    JSON.parse('{"inventory":{"staff":{"__proto__":{"stars":2}}}}'),JSON.parse('{"staffXp":{"constructor":100}}')];
  for(const shop of invalid){const s=V.initial();s.shop=shop;assert.equal(Shop.valid(s),false,JSON.stringify(shop));assert.equal(V.valid(s),false);assert.equal(A.validate(s),false)}
  assert.equal(Object.prototype.stars,undefined);
});
