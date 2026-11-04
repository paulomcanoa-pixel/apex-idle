// Testes do modelo de loot. Rodar: node --test loot/loot-model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const L = require('./loot-model.js');
const here = path.dirname(fileURLToPath(import.meta.url));

// Catálogo REAL (mocks mentem). Ordem: variável de ambiente, repositório, pasta de entregas.
function loadCatalog() {
  const options = [process.env.APEX_CATALOG, path.join(here, '../src/data/shop-catalog.json'), path.join(here, '../../src/data/shop-catalog.json'), path.join(here, '../../shop-catalog.json')].filter(Boolean);
  const file = options.find(existsSync);
  assert.ok(file, 'shop-catalog.json não encontrado; defina APEX_CATALOG');
  return JSON.parse(readFileSync(file, 'utf8'));
}
const newSave = (extra = {}) => { const s = { money: 1000, ...extra }; L.init(s, 0); return s; };
const sigma = (p, n) => 4 * Math.sqrt(p * (1 - p) / n);

test('catálogo de loot: ids únicos, 4 raridades em cada tipo, textos sem HTML', () => {
  const ids = L.ITEMS.map(x => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 50);
  for (const kind of ['credits', 'fragments', 'part', 'cosmetic'])
    for (const r of L.RARITIES) assert.ok(L.ITEMS.some(x => x.kind === kind && x.rarity === r), kind + '/' + r);
  for (const x of L.ITEMS) assert.doesNotMatch(x.name, /[<>&"]/);
});

test('integração com o catálogo REAL da loja: sem colisão de id e mesma escala de raridade', () => {
  const cat = loadCatalog();
  const catIds = new Set(cat.items.map(i => i.id));
  for (const x of L.ITEMS) assert.ok(!catIds.has(x.id), 'colisão de id: ' + x.id);
  const catRarities = new Set(cat.items.map(i => i.rarity));
  for (const r of L.RARITIES) assert.ok(catRarities.has(r), 'raridade fora do catálogo: ' + r);
  const compSlots = new Set(cat.items.filter(i => i.category === 'componentes').map(i => i.slot));
  for (const p of L.PART_SLOTS) if (p.catalogSlot) assert.ok(compSlots.has(p.catalogSlot), 'slot de componente inexistente: ' + p.catalogSlot);
  const cosSlots = new Set(cat.items.filter(i => i.category === 'cosmeticos').map(i => i.slot));
  assert.ok(cosSlots.has('capacete') && cosSlots.has('pintura'));
  assert.ok(cat.items.every(i => i.category !== 'real' || i.rarity), 'itens reais existem; loot nunca os usa');
});

test('probabilidades: 10 mil aberturas por tier batem com a tabela publicada (sem pity/garantia)', () => {
  for (const tier of L.TIERS) {
    const o = L.odds(tier), counts = [0, 0, 0, 0], rng = L.createRng(42 + tier.length);
    let cards = 0;
    for (let i = 0; i < 10000; i++) {
      const out = L.rollBox(newSave().loot, tier, rng, 1, { pity: false, guarantee: false });
      for (const c of out.result.cards) { counts[c.rank]++; cards++; }
    }
    o.rarities.forEach((r, i) => {
      const p = r.percent / 100;
      assert.ok(Math.abs(counts[i] / cards - p) <= sigma(p, cards) + 0.002, `${tier}/${r.rarity}: obs ${(counts[i] / cards).toFixed(4)} esp ${p}`);
    });
  }
});

test('odds publicadas somam 100% e descrevem a garantia', () => {
  for (const t of L.TIERS) {
    const o = L.odds(t);
    assert.ok(Math.abs(o.rarities.reduce((a, r) => a + r.percent, 0) - 100) < 0.05);
    assert.match(o.pity, /Lendário/);
  }
  assert.match(L.odds('lendaria').guarantee, /Épico/);
});

test('garantia por caixa: ouro >= raro, lendária >= épico (10 mil aberturas)', () => {
  const rng = L.createRng(7);
  for (const [tier, min] of [['ouro', 1], ['lendaria', 2]])
    for (let i = 0; i < 10000; i++) {
      const out = L.rollBox(newSave().loot, tier, rng, 1, { pity: false });
      assert.ok(out.result.cards.some(c => c.rank >= min), tier);
    }
});

test('pity: 79 cartas sem lendário força lendário na seguinte; 19 sem épico força épico+', () => {
  const s = newSave(); s.loot.pity.lendario = 79;
  const a = L.rollBox(s.loot, 'bronze', () => 0.0001, 1); // rng que sempre sai comum
  assert.ok(a.result.cards.some(c => c.rarity === 'lendario'));
  assert.equal(a.loot.pity.lendario <= 1, true);
  const s2 = newSave(); s2.loot.pity.epico = 19;
  const b = L.rollBox(s2.loot, 'bronze', () => 0.0001, 1);
  assert.ok(b.result.cards.some(c => c.rank >= 2));
});

test('pity em volume: contadores nunca passam de 79 / 19 em 5000 caixas bronze', () => {
  const s = newSave(), rng = L.createRng(99);
  let maxL = 0, maxE = 0;
  for (let i = 0; i < 5000; i++) {
    s.loot.online.points = 20;
    L.open(s, 'online', { rng, income: 1, now: 0 });
    maxL = Math.max(maxL, s.loot.pity.lendario); maxE = Math.max(maxE, s.loot.pity.epico);
  }
  assert.ok(maxL <= 79 && maxE <= 19, `maxL=${maxL} maxE=${maxE}`);
  assert.ok(s.loot.stats.byRarity.lendario >= 10000 / 80 * 0.9, 'o pity garante ao menos ~1 lendário a cada 80 cartas');
});

test('caixa AFK: tiers 1h/3h/6h/8h e teto de horas', () => {
  const s = newSave();
  L.creditAway(s, 1800); assert.equal(L.status(s, 'afk').ready, false);
  L.creditAway(s, 1800); assert.equal(L.status(s, 'afk').tier, 'bronze');
  L.creditAway(s, 2 * 3600); assert.equal(L.status(s, 'afk').tier, 'prata');
  L.creditAway(s, 3 * 3600); assert.equal(L.status(s, 'afk').tier, 'ouro');
  const r = L.creditAway(s, 100 * 3600);
  assert.equal(s.loot.afk.seconds, 8 * 3600);
  assert.equal(r.full, true);
  assert.equal(L.status(s, 'afk').tier, 'lendaria');
  L.creditAway(s, 3600);
  assert.equal(s.loot.afk.seconds, 8 * 3600, 'teto não passa de 8 h');
});

test('caixa AFK: tempo inválido gera erro visível, não zero silencioso', () => {
  const s = newSave(), prev = console.error; let logged = 0; console.error = () => { logged++; };
  try {
    assert.ok(L.creditAway(s, -5).error); assert.ok(L.creditAway(s, NaN).error);
  } finally { console.error = prev; }
  assert.equal(logged, 2); assert.equal(s.loot.afk.seconds, 0);
});

test('abrir: consome o tier, guarda o excedente, paga CR e é atômico', () => {
  const s = newSave({ money: 100 });
  assert.equal(L.open(s, 'afk', { income: 5 }), null, 'vazia não abre');
  L.creditAway(s, 4 * 3600); // prata (3 h) + 1 h de sobra
  const r = L.open(s, 'afk', { rng: L.createRng(5), income: 5, now: 0 });
  assert.equal(r.tier, 'prata'); assert.equal(r.cards.length, 3);
  assert.equal(s.money, 100 + r.credits);
  assert.equal(s.loot.afk.seconds, 3600, 'sobra de 1 h preservada');
  assert.equal(L.status(s, 'afk').tier, 'bronze');
  s.loot.online.points = 20;
  const before = JSON.stringify(s);
  assert.throws(() => L.open(s, 'online', { rng: L.createRng(1), income: -1 }), /income/);
  assert.equal(JSON.stringify(s), before, 'falha não altera o save');
});

test('caixa Online: pontos por corrida/missão, tiers 20/45/80/130 e teto', () => {
  const s = newSave();
  assert.equal(L.onRace(s, { place: 1 }).added, 6);
  assert.equal(L.onRace(s, { place: 1, ers: true, pitWindow: true }).added, 7);
  assert.equal(L.onRace(s, { place: 3 }).added, 4);
  assert.equal(L.onRace(s, { place: 5 }).added, 3);
  assert.equal(L.onRace(s, { place: 9 }).added, 2);
  assert.equal(s.loot.online.points, 22); assert.equal(L.status(s, 'online').tier, 'bronze');
  L.onMission(s, 'daily'); L.onMission(s, 'weekly'); assert.equal(L.status(s, 'online').tier, 'prata');
  s.loot.online.points = 80; assert.equal(L.status(s, 'online').tier, 'ouro');
  L.onMission(s, 'weekly'); L.onMission(s, 'weekly'); L.onMission(s, 'weekly'); L.onMission(s, 'weekly'); L.onMission(s, 'weekly');
  assert.equal(s.loot.online.points, 130); assert.equal(L.status(s, 'online').tier, 'lendaria');
  const prev = console.error; console.error = () => {};
  try { assert.ok(L.onRace(s, { place: 0 }).error); assert.ok(L.onMission(s, 'x').error); } finally { console.error = prev; }
});

test('sem duplicata inútil: item que falta é preferido; tudo completo vira fragmentos', () => {
  const s = newSave(); const comuns = L.ITEMS.filter(x => x.ownable && x.rarity === 'comum');
  comuns.slice(1).forEach(x => { s.loot.owned[x.id] = 1; });
  const falta = comuns[0].id, rng = L.createRng(3);
  let achou = false;
  for (let i = 0; i < 400 && !achou; i++) {
    const out = L.rollBox(s.loot, 'bronze', rng, 1);
    out.result.cards.filter(c => c.rarity === 'comum' && (c.kind === 'part' || c.kind === 'cosmetic')).forEach(c => { assert.equal(c.id, falta); assert.equal(c.duplicate, false); achou = true; });
  }
  assert.ok(achou);
  const t = newSave(); L.ITEMS.filter(x => x.ownable).forEach(x => { t.loot.owned[x.id] = 1; });
  for (let i = 0; i < 300; i++) {
    const out = L.rollBox(t.loot, 'lendaria', rng, 1);
    for (const c of out.result.cards) if (c.kind === 'part' || c.kind === 'cosmetic') { assert.equal(c.duplicate, true); assert.ok(c.fragments > 0); assert.equal(c.isNew, false); }
    assert.equal(out.loot.fragments - t.loot.fragments, out.result.fragments, 'fragmentos contabilizados');
  }
});

test('RNG com semente: mesma semente repete a abertura', () => {
  const run = seed => { const s = newSave(); s.loot.online.points = 130; return L.open(s, 'online', { rng: L.createRng(seed), income: 10, now: 0 }); };
  assert.deepEqual(run(11), run(11));
  assert.notDeepEqual(run(11), run(12));
});

test('forja e bônus de PI: custo em fragmentos, teto de 3%', () => {
  const s = newSave(); const id = 'loot-part-motor-lendario';
  assert.equal(L.craft(s, id).ok, false);
  s.loot.fragments = 700; assert.equal(L.craft(s, id).ok, true);
  assert.equal(s.loot.fragments, 0); assert.equal(L.craft(s, id).ok, false);
  assert.equal(L.craft(s, 'loot-cr-comum').ok, false);
  assert.equal(L.piBonus(s), 0.01);
  L.ITEMS.filter(x => x.kind === 'part').forEach(x => { s.loot.owned[x.id] = 1; });
  assert.equal(L.piBonus(s), 0.03);
});

test('save antigo: init só ACRESCENTA s.loot, preserva tudo, é idempotente e sobrevive a JSON', () => {
  const old = { version: 2, money: 12345.5, rep: 80, laps: 40, levels: [5, 3, 2, 4, 0, 0], circuit: 3, maxCircuit: 3, cat: 0, stage: 1,
    idle: { units: [3, 1, 0, 0, 0, 0], upgrades: [0, 0, 0, 0, 0, 0], at: 1700000000000, totalEarned: 9999, fragments: 4 },
    shop: { inventory: { components: ['comp-motor-club@0'], cars: [], staff: {}, cosmetics: ['cos-pintura-1'] }, equipped: {}, boosts: {} },
    championship: { gems: 12, tickets: 2 }, season: { n: 1, titles: 0 }, meta: { playerId: 'x', checksum: 'abc' }, retention: { drop: { none: 1, rare: 2, legendary: 3 } } };
  const snapshot = JSON.parse(JSON.stringify(old));
  const s = JSON.parse(JSON.stringify(old));
  L.init(s, 1700000500000);
  const { loot, ...rest } = s;
  assert.deepEqual(rest, snapshot, 'nenhuma chave existente foi alterada');
  assert.equal(loot.v, 1); assert.equal(loot.afk.since, 1700000500000); assert.equal(loot.settings.sound, false);
  const again = JSON.parse(JSON.stringify(s)); L.init(again, 9); assert.deepEqual(again, s, 'idempotente');
  const round = JSON.parse(JSON.stringify(s)); assert.deepEqual(round, s);
});

test('save com loot corrompido é reparado sem apagar o resto nem lançar', () => {
  const s = { money: 5, loot: { afk: { seconds: 'x', since: NaN }, online: { points: -9 }, pity: { epico: null }, owned: { 'loot-cr-comum': 2, futuro: 1 }, fragments: Infinity, extra: 'fica', v: 7, settings: { sound: 'sim' } } };
  L.init(s, 50);
  assert.equal(s.loot.afk.seconds, 0); assert.equal(s.loot.afk.since, 50); assert.equal(s.loot.online.points, 0);
  assert.equal(s.loot.pity.epico, 0); assert.equal(s.loot.fragments, 0); assert.equal(s.loot.settings.sound, false);
  assert.equal(s.loot.owned.futuro, 1); assert.equal(s.loot.extra, 'fica'); assert.equal(s.loot.v, 7); assert.equal(s.money, 5);
  assert.throws(() => L.init(null), /inválido/);
});

test('economia: injeção de CR por hora dentro do orçamento e sem exploit de frequência', () => {
  const online = L.simulate({ hours: 50, income: 1 });
  const perHour = online.creditSeconds / 50;
  assert.ok(perHour <= 0.10 * 3600, 'online injeta ' + perHour.toFixed(0) + ' s de renda por hora ativa (limite 360)');
  const afkOpenNow = L.simulate({ hours: 1, racesPerHour: 0, awayHours: 800, awayStint: 1, income: 1, seed: 3 });
  const afkWait = L.simulate({ hours: 1, racesPerHour: 0, awayHours: 800, awayStint: 8, income: 1, seed: 3 });
  const a = afkOpenNow.creditSeconds / 800, b = afkWait.creditSeconds / 800;
  assert.ok(a <= 150 && b <= 150, `AFK por hora fora: ${a.toFixed(0)} / ${b.toFixed(0)} s de renda`);
  assert.ok(Math.max(a, b) / Math.min(a, b) <= 1.5, 'abrir sempre cedo não pode render >1,5x esperar');
  const rich = L.simulate({ hours: 10, income: 100 }).creditSeconds;
  assert.ok(Math.abs(rich - L.simulate({ hours: 10, income: 1 }).creditSeconds) < 1, 'CR escala com a renda (não quebra a progressão)');
});

test('renda zero ainda paga o mínimo (vazio é diferente de zero)', () => {
  const s = newSave(); s.loot.online.points = 20;
  const r = L.open(s, 'online', { rng: () => 0.3, income: 0, now: 0 });
  assert.ok(r && Number.isFinite(r.credits));
  for (const c of r.cards) if (c.kind === 'credits') assert.ok(c.credits >= 10);
});
