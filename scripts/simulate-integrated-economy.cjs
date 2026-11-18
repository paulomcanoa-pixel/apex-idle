'use strict';

const assert = require('node:assert/strict');
const V = require('../src/progression-v2');
const Shop = require('../src/shop');
const Retention = require('../src/retention');
const Apex = require('../engine');
const Team = require('../game/economy');
const Tick = require('../game/tick');
const Academy = require('../academy-model');
const Adapter = require('../src/v2-adapter');
const { distribution } = require('./simulate-acquisition.cjs');

const START = Date.UTC(2026, 10, 18, 12);
const DAY = 86400000;
const CAR = 'mp44';
const DRIVER = 'real_fittipaldi';
const PROFILES = [
  { id: 'ACTIVE', visits: 3, minutes: 40, order: ['upgrades', 'team', 'gacha'], shares: [.35, .30, .24], purchases: 12, pulls: 20, cleanPitChance: .60, cars: ['project', 'trade'] },
  { id: 'CASUAL', visits: 1, minutes: 20, order: ['upgrades', 'gacha', 'team'], shares: [.30, .22, .25], purchases: 8, pulls: 10, cleanPitChance: .35, cars: ['project', 'trade'] },
  { id: 'OFFLINE', visits: 3, minutes: 0, order: ['team', 'gacha', 'upgrades'], shares: [.08, .53, .25], purchases: 6, pulls: 5, cleanPitChance: 0, cars: ['trade', 'project'] },
];

function startingState(freshStart=false) {
  const s = Apex.initial();
  if (!freshStart) {
    s.rep = V.openRep(s, 3);
    V.unlock(s);
    s.levels = [8, 6, 4, 3, 0, 0];
    s.idle.units = [10, 5, 1, 0, 0, 0];
    s.money = 0;
  }
  s.idle.at = START;
  Shop.init(s).wish = CAR;
  Retention.init(s, START);
  assert(Academy.choose(s, DRIVER, START));
  return s;
}

function assertLedger(s, ledger) {
  const { cr, materials, points, fragments } = ledger;
  const expectedCR = cr.initial + cr.offline + cr.track + cr.laps + cr.prizes + cr.contracts
    - cr.weather - cr.upgrades - cr.team - cr.gacha - cr.academy;
  const scale = Math.max(1, cr.initial + cr.offline + cr.track + cr.laps + cr.prizes + cr.contracts);
  assert(Math.abs(s.money - expectedCR) <= scale * 1e-10, 'CR ledger does not reconcile');
  assert.equal(s.materials, materials.races + materials.contracts - materials.project);
  assert.equal(s.shop.pts, points.duplicates - points.trade);
  assert.equal(s.academy.projects[DRIVER].fragments, fragments.observation - fragments.contract);
  assert([s.money, s.materials, s.shop.pts].every(n => Number.isFinite(n) && n >= 0));
  assert(Apex.validate(s) && Academy.valid(s), 'Integrated scenario produced an invalid save');
}

function academyVisit(s, ledger, outcome, now) {
  if (outcome.academy !== null) return;
  const a = s.academy;
  const recorded = a.projects[DRIVER];
  const fragments = recorded.fragments;
  if (Academy.collect(s, now)) ledger.fragments.observation += recorded.fragments - fragments;
  if (Academy.sign(s, now)) {
    outcome.academy = (now - START) / DAY;
    return;
  }
  if (a.assignment || a.contract) return;
  const money = s.money;
  const before = recorded.fragments;
  if (Academy.negotiate(s, now)) {
    ledger.cr.academy += money - s.money;
    ledger.fragments.contract += before - recorded.fragments;
  } else {
    Academy.start(s, 'endurance', now);
  }
}

function nextUpgrade(s) {
  return V.B.branches
    .map((_, index) => ({ index, cost: V.cost(s, index) }))
    .filter(({ index }) => V.unlockedBranch(s, index) && s.levels[index] < 100)
    .sort((a, b) => a.cost - b.cost)[0];
}

function nextTeam(s) {
  const candidates = [];
  for (let index = 0; index < Team.generators.length; index++) {
    if (!Adapter.teamUnlocked(s, index)) continue;
    candidates.push({ index, cost: Team.cost(s.idle, index), buy: Team.buy });
    if (s.idle.units[index] >= Team.milestones[s.idle.upgrades[index]]) {
      candidates.push({ index, cost: Team.upgradeCost(s.idle, index), buy: Team.upgrade });
    }
  }
  return candidates.sort((a, b) => a.cost - b.cost)[0];
}

function simulateRun(profile, days, seed, { teamContracts = false, freshStart = false } = {}) {
  const s = startingState(freshStart);
  const summonRandom = Shop.rng(seed);
  const raceRandom = Shop.rng(seed ^ 0x5f3759df);
  const outcome = { gacha: null, project: null, trade: null, academy: null };
  const milestones = { projectUnlock: null, firstPromotion: null, firstPull: null };
  const ledger = {
    cr: { initial: s.money, offline: 0, track: 0, laps: 0, prizes: 0, contracts: 0, weather: 0, upgrades: 0, team: 0, gacha: 0, academy: 0 },
    materials: { races: 0, contracts: 0, project: 0 },
    points: { duplicates: 0, trade: 0 },
    fragments: { observation: 0, contract: 0 },
  };
  let races = 0;
  let pulls = 0;
  let offlineHours = 0;
  let carRoute = null;
  let promotions = 0;

  function visitContracts(now) {
    if (!teamContracts) return;
    const balance = s.money;
    const materials = s.materials;
    for (const contract of [...Retention.contracts(s)]) Retention.claimContract(s, contract.id, now);
    ledger.cr.contracts += s.money - balance;
    ledger.materials.contracts += s.materials - materials;
    if (s.cat===0&&(s.catProgress?s.stage:s.maxCircuit)<5) return;
    const equipped=Apex.equippedCar(s).id;
    const owned=Shop.bannerCars('banner-padrao')
      .filter(car=>car.id!==equipped&&Shop.owned(s,car))
      .map(car=>car.id);
    for (const car of owned.slice(0, 3)) Retention.startContract(s, car, 15, owned, now);
  }

  function obtainCar(route, now) {
    assert.equal(carRoute, null);
    carRoute = route;
    outcome[route] = (now - START) / DAY;
  }

  function exchangeOrBuild(now) {
    if (carRoute) return;
    for (const route of profile.cars) {
      if (route === 'project') {
        const before = s.materials;
        if (!Shop.buildProject(s, CAR)) continue;
        ledger.materials.project += before - s.materials;
      } else {
        const result = Shop.buy(s, CAR, { currency: 'pts', now });
        if (!result.ok) continue;
        ledger.points.trade += result.spent;
      }
      obtainCar(route, now);
      break;
    }
  }

  function spend(now) {
    const academy = s.academy;
    const requirement = Academy.requirements(s, DRIVER);
    const project = academy.projects[DRIVER];
    const nearContract = outcome.academy === null && !academy.contract
      && ['races', 'podiums', 'wet', 'combos', 'trials'].every(key => (project[key] || 0) >= (requirement[key] || 0));
    const reserve = V.reward(s) * V.B.P.laps + (nearContract ? requirement.credits : 0);
    const [upgrades, team, gacha] = profile.shares;
    const shares = { upgrades, team, gacha };
    for (const route of profile.order) {
      let budget = Math.max(0, s.money - reserve) * shares[route];
      if (route === 'gacha') {
        const price = Shop.summonPrice(s);
        for (let i = 0; !carRoute && i < profile.pulls && budget >= price; i++) {
          const before = s.money;
          const result = Shop.summon(s, 'banner-padrao', 1, summonRandom, { currency: 'cr' });
          if (!result) break;
          const spent = before - s.money;
          ledger.cr.gacha += spent;
          ledger.points.duplicates += result[0].points;
          pulls++;
          budget -= spent;
          if (milestones.firstPull === null) milestones.firstPull = (now - START) / DAY;
          if (result[0].id === CAR) obtainCar(route, now);
          exchangeOrBuild(now);
        }
      } else {
        for (let i = 0; i < profile.purchases; i++) {
          const next = route === 'upgrades' ? nextUpgrade(s) : nextTeam(s);
          if (!next || next.cost > budget) break;
          const before = s.money;
          const bought = route === 'upgrades' ? V.buy(s, next.index).bought : next.buy(s, next.index);
          assert(bought, 'A quoted eligible purchase failed');
          const spent = before - s.money;
          ledger.cr[route] += spent;
          budget -= spent;
        }
      }
    }
    assert(s.money >= 0);
  }

  for (let day = 0; day < days; day++) {
    for (let visit = 0; visit < profile.visits; visit++) {
      const start = START + day * DAY + visit * DAY / profile.visits;
      const end = start + profile.minutes * 60000;
      const offline = Retention.offline(s, start, Team.production(s.idle));
      offlineHours += offline.seconds / 3600;
      ledger.cr.offline += offline.amount;

      visitContracts(start);
      academyVisit(s, ledger, outcome, start);
      exchangeOrBuild(start);
      spend(start);

      let at = start;
      while (at < end) {
        const laps = V.B.P.laps;
        const seconds = Apex.duration(s) * laps + V.B.P.overhead;
        const finish = Math.ceil(at + seconds * 1000);
        if (finish > end) break;
        const event = Retention.weather(raceRandom);
        const place = Math.max(1, Math.min(10, Adapter.place(s) + Math.floor(raceRandom() * 5) - 2));
        const affinity = Adapter.performance(s).synergy;
        ledger.cr.track += Tick.tick(s, (finish - at) / 1000, finish);
        const lapIncome = Apex.reward(s) * laps;
        s.money += lapIncome;
        ledger.cr.laps += lapIncome;
        s.laps += laps;
        at = finish;

        const before = s.materials;
        const result = V.finish(s, place, seconds, ++races);
        assert(result);
        ledger.cr.prizes += result.prize;
        ledger.materials.races += s.materials - before;
        const money = s.money;
        Retention.raceDone(s, result, raceRandom, { event });
        ledger.cr.weather += money - s.money;
        const pitWindow = raceRandom() < profile.cleanPitChance;
        const trial = { pitWindow, pitStops: 1, wornSeconds: pitWindow ? 0 : 2 };
        Academy.record(s, { place, event, affinity, trial });

        if (milestones.projectUnlock === null && s.stage >= 5) milestones.projectUnlock = (at - START) / DAY;
        exchangeOrBuild(at);
      }
      ledger.cr.track += Tick.tick(s, (end - at) / 1000, end);
      if (end>start) visitContracts(end);
      exchangeOrBuild(end);
      academyVisit(s, ledger, outcome, end);
      if (V.promote(s)) {
        promotions++;
        if (milestones.firstPromotion === null) milestones.firstPromotion = (end - START) / DAY;
      }
      Tick.tick(s, 0, end);
      assertLedger(s, ledger);
    }
  }
  assert.equal(Boolean(carRoute), Shop.owned(s, Shop.get(CAR)));
  assert.equal(outcome.academy !== null, Boolean(s.championship.roster[DRIVER]));
  return {
    outcome: { ...outcome, car: carRoute ? outcome[carRoute] : null },
    milestones, carRoute, ledger, races, pulls, promotions, offlineHours,
    proofs: Object.fromEntries(['fragments', 'races', 'podiums', 'wet', 'combos', 'trials', 'licence']
      .map(key => [key, (key === 'licence' ? s.academy.licence : s.academy.projects[DRIVER][key]) || 0])),
    ending: { cr: s.money, points: s.shop.pts, materials: s.materials, category: s.cat, stage: s.stage + 1, escuderia: s.escuderia, levels: s.levels, team: s.idle.units },
  };
}

function buildReport({ days = 30, runs = 16, seed = 20261118, teamContracts = false, freshStart = false } = {}) {
  assert(Number.isInteger(days) && days >= 1 && days <= 90);
  assert(Number.isInteger(runs) && runs >= 1 && runs <= 128);
  assert(Number.isSafeInteger(seed) && Number.isSafeInteger(seed + (runs - 1) * 997));
  const average = values => Number((values.reduce((sum, n) => sum + n, 0) / runs).toFixed(2));
  return {
    days, runs, seed, teamContracts, freshStart, start: new Date(START).toISOString(), targetCar: CAR, targetDriver: DRIVER,
    academyRequirements: Academy.requirements(startingState(freshStart), DRIVER),
    profiles: PROFILES.map(profile => {
      const rows = Array.from({ length: runs }, (_, i) => simulateRun(profile, days, seed + i * 997, { teamContracts, freshStart }));
      return {
        ...profile,
        routes: Object.fromEntries(Object.keys(rows[0].outcome).map(key => [
          key, distribution(rows.map(row => row.outcome[key]), runs, days),
        ])),
        milestones: Object.fromEntries(Object.keys(rows[0].milestones).map(key => [
          key, distribution(rows.map(row => row.milestones[key]), runs, days),
        ])),
        meanLedger: Object.fromEntries(Object.entries(rows[0].ledger).map(([currency, entries]) => [
          currency, Object.fromEntries(Object.keys(entries).map(key => [
            key, average(rows.map(row => row.ledger[currency][key])),
          ])),
        ])),
        mean: Object.fromEntries(['races', 'pulls', 'promotions', 'offlineHours'].map(key => [
          key, average(rows.map(row => row[key])),
        ])),
        meanEnding: Object.fromEntries(['cr', 'points', 'materials', 'category', 'stage', 'escuderia'].map(key => [
          key, average(rows.map(row => row.ending[key])),
        ])),
        meanAcademyProofs: Object.fromEntries(Object.keys(rows[0].proofs).map(key => [
          key, average(rows.map(row => row.proofs[key])),
        ])),
        validSaves: rows.length,
      };
    }),
  };
}

if (require.main === module) {
  const [days, runs, seed] = process.argv.slice(2).map(Number);
  process.stdout.write(JSON.stringify(buildReport({ days, runs, seed, teamContracts: process.argv.includes("--contracts"), freshStart: process.argv.includes("--fresh") }), null, 2) + '\n');
}

module.exports = { buildReport, PROFILES, simulateRun };
