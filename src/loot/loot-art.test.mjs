// Testes da arte. Rodar: node --test loot/loot-art.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Art = require('./loot-art.js');
const Loot = require('./loot-model.js');

test('toda carta do modelo tem ícone, e toda raridade tem moldura', () => {
  for (const x of Loot.ITEMS) assert.ok(Art.ITEM_KEYS.includes(x.art), 'sem arte: ' + x.id + ' -> ' + x.art);
  for (const r of Loot.RARITIES) assert.ok(Art.RARITY[r]);
  assert.ok(Art.ITEM_KEYS.length >= 16);
});
test('8 caixas (AFK/Online x 4 tiers) e SVG bem formado, sem NaN/undefined e ids únicos', () => {
  assert.equal(Art.BOXES.length, 8);
  for (const f of Art.all()) {
    const s = f.svg;
    assert.match(s, /^<svg [^>]*viewBox="0 0 (128|160) (128|160)"/, f.file);
    assert.doesNotMatch(s, /NaN|undefined|Infinity|<script|on\w+=/, f.file);
    const ids = [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'id repetido em ' + f.file);
    const open = (s.match(/<(?!\/|!)[a-zA-Z]+(?:\s[^>]*[^/])?>/g) || []).filter(t => !/^<(rect|circle|path|polygon|ellipse|stop|text)\b/.test(t) || /^<text/.test(t)).length;
    const close = (s.match(/<\/[a-zA-Z]+>/g) || []).length;
    assert.equal(open, close, 'tags desbalanceadas em ' + f.file);
  }
});
test('duas caixas na mesma página não repartem ids de gradiente', () => {
  const a = Art.box('afk', 'ouro'), b = Art.box('afk', 'ouro');
  const ida = a.match(/id="([^"]+)"/)[1], idb = b.match(/id="([^"]+)"/)[1];
  assert.notEqual(ida, idb);
});
test('entradas inválidas lançam erro', () => {
  assert.throws(() => Art.box('x', 'ouro')); assert.throws(() => Art.box('afk', 'x'));
  assert.throws(() => Art.item('nada')); assert.throws(() => Art.frame('mitico'));
});
test('carta composta traz moldura e ícone', () => {
  const c = Art.card('motor', 'lendario');
  assert.match(c, /Moldura|Lendário/); assert.ok(c.length > 1500);
});
