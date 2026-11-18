'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const Shop = require('./src/shop');
const { buildReport, PROFILES, simulateRun } = require('./scripts/simulate-integrated-economy.cjs');

test('o relatório integrado é reproduzível e concilia saldos e rotas concorrentes', () => {
  const options = { days: 14, runs: 2, seed: 20261118 };
  const report = buildReport(options);
  assert.deepEqual(report, buildReport(options));
  for (const profile of report.profiles) {
    const { routes, meanLedger } = profile;
    assert.equal(profile.validSaves, options.runs);
    assert.equal(routes.car.completed, routes.gacha.completed + routes.trade.completed + routes.project.completed);
    assert.equal(routes.car.completed + routes.car.censored, options.runs);
    assert(routes.trade.completed > 0);
    assert.equal(meanLedger.points.trade, Shop.get('mp44').price.pts * routes.trade.completed / options.runs);
    assert(meanLedger.cr.upgrades > 0);
    assert(meanLedger.cr.team > 0);
    assert(meanLedger.cr.gacha > 0);
  }
  const [active, casual, offline] = report.profiles;
  assert(active.mean.races > casual.mean.races);
  assert(active.milestones.firstPromotion.completed > 0);
  assert.equal(offline.mean.offlineHours, (14 * 3 - 1) * 8);
  assert.equal(offline.mean.races, 0);
  assert.equal(offline.meanLedger.materials.races, 0);
  assert.equal(offline.meanAcademyProofs.trials, 0);
  assert.equal(offline.routes.academy.p50Days, null);
  assert.equal(offline.milestones.projectUnlock.completed, 0);
});

test('o projeto pode concluir sem invocações e divide a trajetória com o contrato da Academia', () => {
  const profile = { ...PROFILES[0], pulls: 0 };
  const result = simulateRun(profile, 30, 20261118);
  assert.equal(result.carRoute, 'project');
  assert(result.outcome.project > result.milestones.projectUnlock);
  assert.equal(result.outcome.gacha, null);
  assert.equal(result.outcome.trade, null);
  assert.equal(result.ledger.materials.project, Shop.projectCost('mp44'));
  assert.equal(result.ledger.materials.races, result.races * 3);
  assert.equal(result.ledger.cr.gacha, 0);
  assert.equal(result.ledger.points.duplicates, 0);
  assert(Number.isFinite(result.outcome.academy));
  assert.equal(result.ledger.cr.academy, 10000);
  assert.equal(result.ledger.fragments.contract, 30);
});
