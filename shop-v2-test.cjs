const {test}=require('node:test'),assert=require('node:assert/strict'),V=require('./src/progression-v2'),Shop=require('./src/shop'),catalog=require('./src/data/shop-catalog.json');Shop.loadCatalog(catalog);
function player(){const s=V.initial();s.money=1e12;s.maxCircuit=23;s.stage=11;s.escuderia=20;Shop.init(s);s.championship.gems=10000;s.championship.tickets=1000;return s}
test('catálogo ativo com 159 itens; treino recebe desbloqueio explícito',()=>{assert.equal(Shop.catalog.items.length,159);assert(Shop.get('treino-basico').unlock);assert.throws(()=>Shop.loadCatalog({items:[]}),/167/)});
test('100 mil giros sem garantias: distribuição do catálogo e garantias 10/200',()=>{const s=player(),rng=Shop.rng(12345);let n=0;for(let i=0;i<200;i++){const r=Shop.summon(s,'banner-padrao',1,rng);assert(r);if(r[0].car.rarity==='lendario'||r[0].car.rarity==='mitico')n++}assert(n>=1);const q=player();for(let i=0;i<9;i++)assert(Shop.summon(q,'banner-padrao',1,()=>0));assert.equal(Shop.summon(q,'banner-padrao',1,()=>0)[0].car.rarity,'epico');const counts=Array(5).fill(0),random=Shop.rng(17),rates=[49.357,35,15,.5,.143];for(let i=0;i<100000;i++){let r=random()*100,k=0;for(;k<4;k++){r-=rates[k];if(r<0)break}counts[k]++}counts.forEach((n,i)=>assert(Math.abs(n/1000-rates[i])<.3))});
test('compras sem saldo e produtos reais não alteram estado',()=>{const s=player();s.money=0;const before=JSON.stringify(s);assert(!Shop.buy(s,'comp-motor-club').ok);assert.equal(JSON.stringify(s),before);assert(!Shop.buy(s,'real-starter').ok);assert.equal(JSON.stringify(s),before)});
test('lojas determinísticas, cosméticos sem poder e limites diários',()=>{const s=player(),now=1800000000000;assert.deepEqual(Shop.dailyShop(s,now),Shop.dailyShop(s,now));const before=Shop.componentBonus(s)+Shop.carBonus(s)+Shop.staffBonus(s);assert(Shop.buy(s,'cos-pintura-1',{now}).ok);assert.equal(Shop.componentBonus(s)+Shop.carBonus(s)+Shop.staffBonus(s),before);assert(!Shop.dailyShop(s,now).some(x=>x.id==='cos-pintura-1'));s.shop.selectedPilot='pil-lia';s.shop.inventory.staff['pil-lia']={stars:1,copies:0,xp:0};for(let i=0;i<5;i++){assert(Shop.buy(s,'treino-basico',{now}).ok);assert(!Shop.buy(s,'treino-basico',{now}).ok);assert(Shop.finishTraining(s,false,now+300000))}assert(!Shop.buy(s,'treino-basico',{now}).ok)});

test('20 carros históricos nos banners principal e destaque, com duas exclusivas por fichas',()=>{
  const main=Shop.bannerCars('banner-padrao'),special=Shop.bannerCars('banner-lendas');
  assert.equal(main.length,20);
  assert.deepEqual(Shop.bannerCars('banner-destaque').map(car=>car.id),main.map(car=>car.id));
  assert(main.every(car=>car.historical&&!car.exclusive));
  assert.deepEqual(special.filter(car=>car.exclusive).map(car=>car.id),['lotus97t','jordan191']);
  const s=player();s.cat=5;
  assert(Shop.summon(s,'banner-lendas',1,()=>.9999)[0].car.exclusive);
  for(const car of special.filter(car=>car.exclusive)){
    for(const currency of ['cr','pts'])assert(!Shop.buy(s,car.id,{currency,price:1}).ok);
    assert(!Shop.buyOffer(s,{id:car.id,currency:'cr',offerPrice:1,offerKey:'forged:'+car.id}).ok);
  }
  assert(Shop.weeklyShop(s).every(offer=>!offer.exclusive&&!offer.id.startsWith('car-')));
  assert(!Shop.buy(s,'car-f1-raro').ok);
  assert(Shop.get('car-f1-raro'));
});
test('desejo dobra só o modelo histórico e preserva 100% de chance total',()=>{
  const base=Shop.bannerRates('banner-padrao'),wish=Shop.bannerRates('banner-padrao','lotus49');
  const chance=rows=>rows.find(row=>row.car.id==='lotus49').chance;
  assert.equal(chance(wish),2*chance(base));
  assert(Math.abs(wish.reduce((n,row)=>n+row.chance,0)-100)<1e-8);
});
test('carro histórico de um save antigo vira pontos ao repetir',()=>{
  const s=player();s.garage={owned:['aurora','lotus49'],equipped:'lotus49'};
  const [result]=Shop.summon(s,'banner-padrao',1,()=>0);
  assert.equal(result.id,'lotus49');
  assert.equal(result.duplicate,true);
  assert.equal(s.shop.pts,50);
  assert.equal(s.garage.equipped,'lotus49');
});

test('carros históricos e fictícios já possuídos continuam equipáveis após recarregar',()=>{
  const A=require('./engine');
  require('./src/v2-adapter');
  const s=player();
  const [pull]=Shop.summon(s,'banner-padrao',1,()=>0);
  s.shop.inventory.cars.push('car-f1-raro');
  for(const id of [pull.id,'car-f1-raro']){
    s.shop.selectedCar=id;
    const restored=JSON.parse(JSON.stringify(s));
    assert(A.validate(restored));
    assert.equal(A.equippedCar(restored).id,id);
  }
  assert.equal(A.equippedCar({...s,shop:{...s.shop,selectedCar:pull.id}}).color,Shop.get(pull.id).color);
});
