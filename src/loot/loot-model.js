// Apex Idle: caixas de loot (AFK e Online). Modelo puro: sem DOM, sem rede, sem dinheiro real.
// Global: window.ApexLoot (como ApexShop/ApexRetention). Colar em src/loot/loot-model.js.
// REGRA DE CONFORMIDADE: caixas só são ganhas jogando (tempo fora, corridas, missões). Nunca vendidas.
(function (root) {
'use strict';

const VERSION = 1;
const RARITIES = ['comum', 'raro', 'epico', 'lendario']; // mesmos ids de shop-catalog.json
const TIERS = ['bronze', 'prata', 'ouro', 'lendaria'];
const RARITY_NAME = { comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário' };
const TIER_NAME = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', lendaria: 'Lendária' };

// SUPOSIÇÃO: todos os números abaixo são de design, ainda não testados com jogadores.
const CFG = {
  afk: { capHours: 8, thresholdsHours: [1, 3, 6, 8] },          // espelha o teto offline de 8 h (doc §7.3)
  online: { cap: 130, thresholds: [20, 45, 80, 130] },           // pontos
  points: { win: 6, podium: 4, top5: 3, other: 2, perfect: 1, daily: 8, weekly: 20 },
  draws: [2, 3, 4, 5],                                           // cartas por tier
  weights: {                                                     // % por carta: comum, raro, épico, lendário
    bronze: [74, 21, 4.5, 0.5],
    prata: [58, 31, 9.5, 1.5],
    ouro: [40, 38, 17, 5],
    lendaria: [20, 40, 28, 12],
  },
  guarantee: { ouro: 1, lendaria: 2 },                           // ao menos 1 carta >= raro / >= épico por caixa
  pity: { epico: 20, lendario: 80 },                             // garantia após N cartas sem épico+/lendário
  kindWeights: { credits: 25, fragments: 15, part: 40, cosmetic: 20 },
  creditSeconds: [10, 15, 40, 120],                           // CR = renda(CR/s) x segundos
  fragmentValue: [10, 30, 90, 250],                              // carta de fragmentos
  dupFragments: [8, 25, 70, 200],                                // duplicata vira fragmentos
  craftCost: [30, 90, 250, 700],                                 // fragmentos para forjar item que falta
  piPct: [0.001, 0.0025, 0.005, 0.01],                           // peça por raridade (fração de PI)
  piCap: 0.03,                                                   // teto do bônus total de PI das peças de loot
  moneyLimit: 1e100,                                             // mesmo limite de progression-v2 valid()
  historySize: 5,
};

// ---------- catálogo de itens (nomes fictícios, sem marca real) ----------
const PART_SLOTS = [
  { slot: 'motor', art: 'motor', catalogSlot: 'motor', names: ['Motor de Kart', 'Motor Sprint', 'Motor Elite', 'Motor Apex V6'] },
  { slot: 'pneu', art: 'pneu', catalogSlot: 'pneus', names: ['Pneu Duro', 'Pneu Médio', 'Pneu Macio', 'Pneu Qualify'] },
  { slot: 'asa', art: 'asa', catalogSlot: 'aero', names: ['Asa Básica', 'Asa Dupla', 'Asa Aero Pro', 'Asa Fantasma'] },
  { slot: 'freio', art: 'freio', catalogSlot: 'freios', names: ['Freio de Disco', 'Freio Ventilado', 'Freio Carbono', 'Freio Cerâmico X'] },
  { slot: 'cambio', art: 'cambio', catalogSlot: 'cambio', names: ['Câmbio Manual', 'Câmbio Sequencial', 'Câmbio Rápido', 'Câmbio Relâmpago'] },
  { slot: 'ers', art: 'ers', catalogSlot: null, names: ['ERS Compacto', 'ERS Pulso', 'ERS Turbo', 'ERS Surto Solar'] },
  { slot: 'chassi', art: 'chassi', catalogSlot: null, names: ['Chassi de Aço', 'Chassi Leve', 'Chassi Monocoque', 'Chassi Fibra Aurora'] },
  { slot: 'combustivel', art: 'combustivel', catalogSlot: null, names: ['Tanque Padrão', 'Mistura Rica', 'Mistura Pro', 'Mistura Estrela'] },
];
const COSMETIC_SLOTS = [
  { slot: 'capacete', art: 'capacete', names: ['Capacete Listrado', 'Capacete Neon', 'Capacete Holo', 'Capacete Aurora Dourado'] },
  { slot: 'pintura', art: 'pintura', names: ['Pintura Fosca', 'Pintura Metálica', 'Pintura Perolada', 'Pintura Prisma'] },
  { slot: 'trofeu', art: 'trofeu', names: ['Taça Local', 'Taça Regional', 'Taça Mundial', 'Taça Apex'] },
  { slot: 'volante', art: 'volante', names: ['Volante Clássico', 'Volante Esportivo', 'Volante Digital', 'Volante Cristal'] },
];
const CREDIT_NAMES = ['Trocados', 'Bolsa de CR', 'Cofre de CR', 'Tesouro de CR'];
const FRAGMENT_NAMES = ['Fragmentos Soltos', 'Fragmentos de Oficina', 'Fragmentos Raros', 'Núcleo de Fragmentos'];

const ITEMS = [];
RARITIES.forEach((r, i) => {
  ITEMS.push({ id: 'loot-cr-' + r, kind: 'credits', rarity: r, name: CREDIT_NAMES[i], art: i < 2 ? 'moeda' : 'moedas', ownable: false });
  ITEMS.push({ id: 'loot-frag-' + r, kind: 'fragments', rarity: r, name: FRAGMENT_NAMES[i], art: i < 2 ? 'fragmento' : 'fragmentos', ownable: false, amount: CFG.fragmentValue[i] });
  PART_SLOTS.forEach(p => ITEMS.push({ id: 'loot-part-' + p.slot + '-' + r, kind: 'part', slot: p.slot, rarity: r, name: p.names[i], art: p.art, ownable: true, piPct: CFG.piPct[i] }));
  COSMETIC_SLOTS.forEach(c => ITEMS.push({ id: 'loot-cos-' + c.slot + '-' + r, kind: 'cosmetic', slot: c.slot, rarity: r, name: c.names[i], art: c.art, ownable: true }));
});
const BY_ID = Object.fromEntries(ITEMS.map(x => [x.id, x]));
const POOL = {}; // POOL[kind][rarity] = [itens]
ITEMS.forEach(x => { ((POOL[x.kind] = POOL[x.kind] || {})[x.rarity] = POOL[x.kind][x.rarity] || []).push(x); });
const get = id => BY_ID[id] || null;

// ---------- RNG ----------
function createRng(seed) { // mulberry32: mesma semente, mesma sequência (testes)
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function defaultRng() {
  if (root.crypto && root.crypto.getRandomValues) { const b = new Uint32Array(1); root.crypto.getRandomValues(b); return b[0] / 4294967296; }
  return Math.random();
}
function pickWeighted(weights, r) {
  if(!Number.isFinite(r)||r<0||r>=1)throw new TypeError('RNG inválido');
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) { acc += weights[i]; if (r * total < acc) return i; }
  return weights.length - 1;
}

// ---------- estado no save: s.loot (init nunca apaga nada) ----------
const num = (v, d, min = 0, max = Infinity) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d);
function init(s, now = Date.now()) {
  if (!s || typeof s !== 'object') throw new TypeError('save inválido');
  const L = (s.loot && typeof s.loot === 'object') ? s.loot : (s.loot = {});
  L.v = Number.isInteger(L.v) ? L.v : VERSION;
  const afk = L.afk && typeof L.afk === 'object' ? L.afk : (L.afk = {});
  afk.seconds = num(afk.seconds, 0, 0, CFG.afk.capHours * 3600);
  afk.since = num(afk.since, now);
  const on = L.online && typeof L.online === 'object' ? L.online : (L.online = {});
  on.points = num(on.points, 0, 0, CFG.online.cap);
  const pity = L.pity && typeof L.pity === 'object' ? L.pity : (L.pity = {});
  pity.epico = Math.floor(num(pity.epico, 0)); pity.lendario = Math.floor(num(pity.lendario, 0));
  if (!L.owned || typeof L.owned !== 'object' || Array.isArray(L.owned)) L.owned = {};
  L.fragments = Math.floor(num(L.fragments, 0));
  const st = L.stats && typeof L.stats === 'object' ? L.stats : (L.stats = {});
  st.opened = Math.floor(num(st.opened, 0));
  st.byTier = st.byTier && typeof st.byTier === 'object' ? st.byTier : {};
  st.byRarity = st.byRarity && typeof st.byRarity === 'object' ? st.byRarity : {};
  if (!Array.isArray(L.history)) L.history = [];
  if (!L.settings || typeof L.settings !== 'object') L.settings = {};
  if (typeof L.settings.notify !== 'boolean') L.settings.notify = false;
  if (typeof L.settings.sound !== 'boolean') L.settings.sound = false; // som começa desligado
  return L;
}
const nowOf = o => (o && Number.isFinite(o.now) ? o.now : Date.now());
function clone(x) { return JSON.parse(JSON.stringify(x)); }

// ---------- enchimento das caixas ----------
function tierIndex(value, thresholds) { let t = -1; thresholds.forEach((x, i) => { if (value >= x) t = i; }); return t; }
function capSeconds(opts) { return (Number.isFinite(opts && opts.capHours) ? opts.capHours : CFG.afk.capHours) * 3600; }

// Chamar com os segundos fora devolvidos por Ret.offline (já limitados). Tempo com a aba aberta NÃO conta.
function creditAway(s, seconds, opts = {}) {
  const L = init(s, opts.now);
  if (!Number.isFinite(seconds) || seconds < 0) { console.error('ApexLoot.creditAway: segundos inválidos', seconds); return { added: 0, error: 'segundos inválidos' }; }
  const before = L.afk.seconds;
  L.afk.seconds = Math.min(capSeconds(opts), before + seconds);
  return { added: L.afk.seconds - before, full: L.afk.seconds >= capSeconds(opts) };
}
function racePoints(r) {
  const base = r.place === 1 ? CFG.points.win : r.place <= 3 ? CFG.points.podium : r.place <= 5 ? CFG.points.top5 : CFG.points.other;
  return base + (r.place === 1 && r.ers && r.pitWindow ? CFG.points.perfect : 0);
}
function addOnline(L, n) { const before = L.online.points; L.online.points = Math.min(CFG.online.cap, before + n); return { added: L.online.points - before }; }
function onRace(s, result) { // chamar ao fim de cada corrida jogada (ex.: em N.finish)
  const L = init(s);
  if (!result || !Number.isInteger(result.place) || result.place < 1) { console.error('ApexLoot.onRace: posição inválida', result); return { added: 0, error: 'posição inválida' }; }
  return addOnline(L, racePoints(result));
}
function onMission(s, kind) { // 'daily' ou 'weekly'
  const L = init(s);
  if (kind !== 'daily' && kind !== 'weekly') { console.error('ApexLoot.onMission: tipo inválido', kind); return { added: 0, error: 'tipo inválido' }; }
  return addOnline(L, CFG.points[kind]);
}

function status(s, kind, opts = {}) {
  const L = init(s, opts.now);
  const isAfk = kind === 'afk';
  if (!isAfk && kind !== 'online') throw new RangeError('tipo de caixa: afk ou online');
  const cap = isAfk ? capSeconds(opts) : CFG.online.cap;
  const value = isAfk ? L.afk.seconds : L.online.points;
  const th = isAfk ? CFG.afk.thresholdsHours.map(h => h * 3600) : CFG.online.thresholds;
  if (isAfk && cap !== th[3]) th[3] = Math.max(th[2], cap);
  const i = tierIndex(value, th);
  return {
    kind, value, cap, fraction: Math.min(1, value / cap), full: value >= cap,
    tier: i < 0 ? null : TIERS[i], tierIndex: i, ready: i >= 0,
    next: i + 1 < TIERS.length ? TIERS[i + 1] : null,
    remainingToNext: i + 1 < TIERS.length ? th[i + 1] - value : 0,
    thresholds: th,
  };
}

// ---------- sorteio ----------
function creditAmount(income, rank) {
  if (!Number.isFinite(income) || income < 0) throw new TypeError('income (CR/s) deve ser número >= 0');
  return Math.max(10, Math.round(income * CFG.creditSeconds[rank])); // renda 0 ainda paga o mínimo
}
function freeOwnables(L, rarity) {
  return ITEMS.filter(x => x.ownable && x.rarity === rarity && !(L.owned[x.id] > 0));
}
function resolveCard(L, rank, rng, income) {
  const rarity = RARITIES[rank];
  const kinds = Object.keys(CFG.kindWeights);
  const kind = kinds[pickWeighted(kinds.map(k => CFG.kindWeights[k]), rng())];
  const pool = POOL[kind][rarity];
  let item = pool[Math.floor(rng() * pool.length)];
  const card = { id: item.id, kind, rarity, rank, name: item.name, art: item.art, isNew: false, duplicate: false };
  if (item.ownable && L.owned[item.id] > 0) {
    const free = freeOwnables(L, rarity); // sem duplicata inútil: prefere um item que falta da mesma raridade
    if (free.length) { item = free[Math.floor(rng() * free.length)]; Object.assign(card, { id: item.id, kind: item.kind, name: item.name, art: item.art }); }
    else { card.duplicate = true; card.fragments = CFG.dupFragments[rank]; L.fragments += card.fragments; }
  }
  if (kind === 'credits') card.credits = creditAmount(income, rank);
  if (kind === 'fragments') { card.fragments = item.amount; L.fragments += item.amount; }
  if (item.ownable && !card.duplicate) { L.owned[item.id] = (L.owned[item.id] || 0) + 1; card.isNew = true; }
  if (item.ownable && item.kind === 'part') card.piPct = item.piPct;
  return card;
}
// Núcleo puro: recebe o estado s.loot e devolve cópia nova + resultado. opts: pity=false / guarantee=false (só testes).
function rollBox(loot, tier, rng, income, opts = {}) {
  const ti = TIERS.indexOf(tier);
  if (ti < 0) throw new RangeError('tier inválido: ' + tier);
  if(!Number.isFinite(income)||income<0)throw new TypeError('income inválido');
  const L = clone(loot);
  const cards = [];
  const n = CFG.draws[ti];
  for (let i = 0; i < n; i++) {
    let rank = pickWeighted(CFG.weights[tier], rng());
    if (opts.pity !== false) {
      if (L.pity.lendario >= CFG.pity.lendario - 1) rank = 3;
      else if (L.pity.epico >= CFG.pity.epico - 1 && rank < 2) rank = 2;
    }
    const need = CFG.guarantee[tier];
    if (opts.guarantee !== false && need !== undefined && i === n - 1 && !cards.some(c => c.rank >= need) && rank < need) rank = need;
    L.pity.epico = rank >= 2 ? 0 : L.pity.epico + 1;
    L.pity.lendario = rank >= 3 ? 0 : L.pity.lendario + 1;
    const card = resolveCard(L, rank, rng, income);
    L.stats.byRarity[card.rarity] = (L.stats.byRarity[card.rarity] || 0) + 1;
    cards.push(card);
  }
  cards.sort((a, b) => a.rank - b.rank); // ritual: a melhor carta sai por último
  const result = {
    tier, cards,
    credits: cards.reduce((t, c) => t + (c.credits || 0), 0),
    fragments: cards.reduce((t, c) => t + (c.fragments || 0), 0),
    newItems: cards.filter(c => c.isNew).map(c => c.id),
    best: cards[cards.length - 1].rarity,
  };
  L.stats.opened += 1;
  L.stats.byTier[tier] = (L.stats.byTier[tier] || 0) + 1;
  return { loot: L, result };
}

// Abre a caixa pronta; consome o enchimento (o excedente acima do tier fica para a próxima: sem desperdício).
function open(s, kind, opts = {}) {
  if(!Number.isFinite(s.money)||s.money<0||s.money>=CFG.moneyLimit)throw new TypeError('Caixa inválida: limite de dinheiro');
  if(!Number.isFinite(opts.income)||opts.income<0)throw new TypeError('income inválido');
  const st = status(s, kind, opts);
  if (!st.ready) return null;
  const income = opts.income;
  const out = rollBox(s.loot, st.tier, opts.rng || defaultRng, income, opts);
  const L = out.loot;
  if(s.money+out.result.credits>=CFG.moneyLimit)throw new RangeError('Limite de dinheiro: caixa preservada');
  if(s.idle&&['totalEarned','cycleEarned'].some(k=>s.idle[k]+out.result.credits>=1e99))throw new RangeError('Limite de renda: caixa preservada');
  if (kind === 'afk') { L.afk.seconds = Math.max(0, st.value - st.thresholds[st.tierIndex]); L.afk.since = nowOf(opts); }
  else L.online.points = Math.max(0, st.value - st.thresholds[st.tierIndex]);
  L.history = [{ at: nowOf(opts), kind, tier: st.tier, best: out.result.best }, ...L.history].slice(0, CFG.historySize);
  out.result.kind = kind;
  out.result.moneyApplied = false;
  if (s.money + out.result.credits < CFG.moneyLimit) { s.money += out.result.credits; out.result.moneyApplied = true; }
  else console.error('ApexLoot.open: crédito ignorado por exceder o limite de dinheiro');
  if(s.idle){s.idle.totalEarned+=out.result.credits;s.idle.cycleEarned+=out.result.credits}
  s.loot = L;
  return out.result;
}

// ---------- forja, bônus, probabilidades ----------
function craft(s, id) {
  const L = init(s), item = get(id);
  if (!item || !item.ownable) return { ok: false, reason: 'Item não pode ser forjado' };
  if (L.owned[id] > 0) return { ok: false, reason: 'Você já tem este item' };
  const cost = CFG.craftCost[RARITIES.indexOf(item.rarity)];
  if (L.fragments < cost) return { ok: false, reason: 'Faltam ' + (cost - L.fragments) + ' fragmentos' };
  L.fragments -= cost; L.owned[id] = 1;
  return { ok: true, cost, item };
}
function piBonus(s) { // SUPOSIÇÃO: somar a power() em v2-adapter, dentro do teto .15 existente de peças
  const L = init(s), best = {};
  Object.keys(L.owned).forEach(id => { const x = BY_ID[id]; if (x && x.kind === 'part' && L.owned[id] > 0) best[x.slot] = Math.max(best[x.slot] || 0, x.piPct); });
  return Math.min(CFG.piCap, Object.values(best).reduce((a, b) => a + b, 0));
}
function odds(tier) { // para a tela de probabilidades (sempre acessível)
  const ti = TIERS.indexOf(tier);
  if (ti < 0) throw new RangeError('tier inválido');
  const total = CFG.weights[tier].reduce((a, b) => a + b, 0);
  return {
    tier, name: TIER_NAME[tier], draws: CFG.draws[ti],
    rarities: RARITIES.map((r, i) => ({ rarity: r, name: RARITY_NAME[r], percent: +(CFG.weights[tier][i] / total * 100).toFixed(2) })),
    guarantee: CFG.guarantee[tier] === undefined ? null : 'Pelo menos uma carta ' + RARITY_NAME[RARITIES[CFG.guarantee[tier]]] + ' ou melhor',
    pity: 'Garantia: Épico ou melhor a cada ' + CFG.pity.epico + ' cartas; Lendário a cada ' + CFG.pity.lendario + ' cartas sem um.',
  };
}
function expectedCreditSeconds(tier) { // por caixa, valor nominal (sem garantias), em segundos de renda
  const ti = TIERS.indexOf(tier), w = CFG.weights[tier], tw = w.reduce((a, b) => a + b, 0);
  const kw = CFG.kindWeights, kt = Object.values(kw).reduce((a, b) => a + b, 0);
  return CFG.draws[ti] * w.reduce((t, x, i) => t + x / tw * kw.credits / kt * Math.max(0, CFG.creditSeconds[i]), 0);
}
// Jogador simulado para o balanceamento. Abre cada caixa assim que fica pronta (pior caso de frequência).
function simulate({ hours, racesPerHour = 35, avgPlace = 4, awayHours = 0, awayStint = 8, income = 1, seed = 1, wait = false, perfect = false }) {
  const s = { money: 0, loot: null }; init(s, 0);
  const rng = createRng(seed); let credits = 0, boxes = 0;
  const tryOpen = kind => { const st = status(s, kind); if (st.ready && (!wait || st.full)) { const r = open(s, kind, { rng, income, now: 0 }); credits += r.credits; boxes++; } };
  for (let h = 0; h < hours; h++) {
    for (let r = 0; r < racesPerHour; r++) { onRace(s, { place: Math.max(1,Math.min(10,avgPlace + (r % 3 === 0 ? -2 : 0))), ers: perfect, pitWindow: perfect }); tryOpen('online'); }
    if (awayHours > 0) { for (let k = 0; k < awayHours / awayStint; k++) { creditAway(s, awayStint * 3600); tryOpen('afk'); } }
  }
  return { creditSeconds: credits / income, boxes, fragments: s.loot.fragments, loot: s.loot };
}

const api = {
  VERSION, CFG, RARITIES, TIERS, RARITY_NAME, TIER_NAME, ITEMS, PART_SLOTS, COSMETIC_SLOTS,
  get, createRng, init, creditAway, onRace, onMission, status, rollBox, open, craft, piBonus, odds, expectedCreditSeconds, simulate,
};
root.ApexLoot = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

