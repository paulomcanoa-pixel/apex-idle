// Apex Idle: cinema de abertura de caixas (ritual). Global: window.ApexLootCinema.
// Ordem: antecipação -> explosão de luz -> cartas viradas uma a uma (melhor por último) -> resumo com números
// subindo -> "+X" voando ao contador. A recompensa JÁ foi gravada por ApexLoot.open() antes de chamar play():
// fechar a aba no meio nunca perde nada. A animação só MOSTRA o resultado, nunca decide a raridade.
// Texto vindo do modelo entra só por textContent; innerHTML só recebe SVG estático de ApexLootArt.
(function (root) {
'use strict';
const doc = root.document;
const RC = { comum: '#9cafbe', raro: '#65c9ff', epico: '#b38bff', lendario: '#ffcd75' };
const RANK = { comum: 0, raro: 1, epico: 2, lendario: 3 };
const RNAME = { comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário' };
const TIER_COLOR = { bronze: '#f0b27a', prata: '#bfe3ff', ouro: '#ffcd75', lendaria: '#ff86bf' };
const CONFETTI = ['#d4fc5a', '#ffb627', '#35e6a8', '#65c9ff', '#ff86bf', '#eaf2f6'];
const reduced = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const defaultFmt = n => Math.round(n).toLocaleString('pt-BR');
let active = null;

// ---------- som (WebAudio gerado em código; desligável) ----------
function createSfx() {
  let ctx = null, master = null, on = false;
  const AC = root.AudioContext || root.webkitAudioContext;
  function ensure() {
    if (ctx || !AC) return ctx;
    try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.18; master.connect(ctx.destination); }
    catch (e) { console.error('ApexLootCinema: áudio indisponível', e); ctx = null; }
    return ctx;
  }
  function tone(f0, f1, dur, type, vol, delay = 0) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, f0, f1) {
    if (!on || !ensure()) return;
    const t = ctx.currentTime, n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const scale = [523, 659, 784, 1047, 1319];
  return {
    supported: () => !!AC,
    isOn: () => on,
    setOn(v) { on = !!v && !!AC; if (on && ensure() && ctx.state === 'suspended') ctx.resume(); },
    charge() { tone(80, 420, 1.1, 'sawtooth', 0.12); noise(1.1, 0.08, 200, 2400); },
    boom() { tone(110, 38, 0.6, 'sine', 0.7); noise(0.5, 0.25, 3000, 300); },
    flip(rank) { noise(0.12, 0.12, 1800, 900); const n = [1, 2, 3, 5][rank]; for (let i = 0; i < n; i++) tone(scale[i], scale[i], rank === 3 ? 0.8 : 0.35, 'triangle', 0.25, 0.04 + i * 0.07); },
    coin() { tone(1568, 1568, 0.05, 'square', 0.06); },
  };
}

// ---------- partículas (canvas 2D, no máximo 140, para sozinho quando esvazia) ----------
function createFx(canvas) {
  const g = canvas.getContext('2d'), ps = [];
  let raf = 0, last = 0, w = 0, h = 0, dpr = 1;
  function size() { dpr = Math.min(root.devicePixelRatio || 1, 1.5); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr); }
  function frame(t) {
    const dt = Math.min(0.04, (t - last) / 1000 || 0.016); last = t;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]; p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.life <= 0 || p.y > h + 30) { ps.splice(i, 1); continue; }
      g.globalAlpha = Math.min(1, p.life * 1.6); g.fillStyle = p.c;
      if (p.spark) { g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.283); g.fill(); }
      else { g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s); g.restore(); }
    }
    g.globalAlpha = 1;
    if (ps.length) raf = root.requestAnimationFrame(frame); else { raf = 0; last = 0; g.clearRect(0, 0, w, h); }
  }
  return {
    size,
    burst(x, y, color, n, power, confetti) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = power * (0.35 + Math.random() * 0.65);
        ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.25, g: confetti ? 700 : 120, life: 0.8 + Math.random() * (confetti ? 1.1 : 0.6),
          c: confetti && i % 2 ? CONFETTI[i % CONFETTI.length] : color, s: confetti ? 3 + Math.random() * 3 : 1.5 + Math.random() * 2, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, spark: !confetti });
      }
      while (ps.length > 140) ps.shift();
      if (!raf) raf = root.requestAnimationFrame(frame);
    },
    stop() { if (raf) root.cancelAnimationFrame(raf); raf = 0; ps.length = 0; },
  };
}

function countUp(node, to, ms, fmt, tick, cancelled = () => false) {
  if (reduced() || ms <= 0) { node.textContent = fmt(to); return Promise.resolve(); }
  const t0 = root.performance.now();
  return new Promise(res => {
    (function step(t) {
      if(cancelled()){res();return;}
      const k = Math.min(1, Math.max(0, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3); // clamp: nunca mostra número negativo
      node.textContent = fmt(to * e); if (tick) tick(k);
      if (k < 1 && node.isConnected) root.requestAnimationFrame(step); else { node.textContent = fmt(to); res(); }
    })(t0);
  });
}

// ---------- API ----------
// play({kind, result, art, targets:{cr,fragments}, format, sound, onSoundChange, onLand, onDone}) -> {promise, skip, close}
function play(opts = {}) {
  if (active) return active;
  const Art = opts.art || root.ApexLootArt, res = opts.result, fmt = opts.format || defaultFmt;
  if (!Art || !res || !Array.isArray(res.cards) || !res.cards.length) throw new TypeError('ApexLootCinema.play: result.cards ausente');
  if (!doc) throw new Error('ApexLootCinema precisa de DOM');
  const cards = res.cards.slice().sort((a, b) => RANK[a.rarity] - RANK[b.rarity]); // melhor por último; só reordena, nunca muda raridade
  const best = cards[cards.length - 1].rarity, calm = reduced(), sfx = createSfx();
  sfx.setOn(!!opts.sound);
  const prevFocus = doc.activeElement;
  const ctl = { skipped: false, closed: false, tap: null, sleepers: new Set() };

  const ov = el('div', 'lc-overlay'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Abertura de caixa');
  ov.dataset.phase = 'wait'; ov.style.setProperty('--tc', TIER_COLOR[res.tier] || '#ffcd75');
  const fx = el('canvas', 'lc-fx'), flash = el('div', 'lc-flash'), live = el('div', 'lc-sr'); live.setAttribute('aria-live', 'polite');
  const top = el('div', 'lc-top'), title = el('div', 'lc-title', 'Caixa ' + (res.kind === 'afk' ? 'AFK' : 'Online') + ' ' + ({ bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', lendaria: 'Lendária' }[res.tier] || ''));
  const soundBtn = el('button', 'lc-btn', 'Som: ' + (sfx.isOn() ? 'ligado' : 'desligado')); soundBtn.type = 'button'; soundBtn.setAttribute('aria-pressed', String(sfx.isOn()));
  if (!sfx.supported()) soundBtn.hidden = true;
  const skipBtn = el('button', 'lc-btn', 'Pular'); skipBtn.type = 'button';
  top.append(title, soundBtn, skipBtn);
  const stage = el('div', 'lc-stage'), boxBtn = el('button', 'lc-boxbtn'); boxBtn.type = 'button'; boxBtn.setAttribute('aria-label', 'Abrir caixa');
  boxBtn.innerHTML = Art.box(res.kind, res.tier); // SVG estático do próprio jogo
  boxBtn.prepend(el('div', 'lc-halo')); boxBtn.append(el('div', 'lc-hint', 'Toque para abrir'));
  const wrap = el('div', 'lc-cards');
  const nodes = cards.map((c, i) => {
    const card = el('div', 'lc-card'); card.style.setProperty('--rc', RC[c.rarity]); card.style.setProperty('--i', i); card.dataset.rarity = c.rarity;
    const inner = el('div', 'lc-inner'), back = el('div', 'lc-face lc-back'), front = el('div', 'lc-face lc-front'), art = el('div', 'lc-art');
    back.innerHTML = Art.box(res.kind, res.tier); art.innerHTML = Art.card(c.art, c.rarity);
    const badge = c.credits ? '+' + fmt(c.credits) + ' CR' : c.duplicate ? '+' + fmt(c.fragments) + ' frag. (repetido)' : c.fragments ? '+' + fmt(c.fragments) + ' frag.' : c.isNew ? 'NOVO' : RNAME[c.rarity];
    front.append(art, el('div', 'lc-name', c.name), el('div', 'lc-badge', badge));
    inner.append(back, front); card.append(el('div', 'lc-rays'), el('div', 'lc-aura'), inner); wrap.append(card);
    return card;
  });
  stage.append(boxBtn, wrap);
  const summary = el('div', 'lc-summary'), counters = [];
  function row(label, value, key) { const r = el('div', 'lc-row'), v = el('b', '', '0'); r.append(el('span', '', label), v); summary.append(r); counters.push({ node: v, to: value, key }); }
  if (res.credits > 0) row('Créditos', res.credits, 'cr');
  if (res.fragments > 0) row('Fragmentos', res.fragments, 'fragments');
  const fresh = cards.filter(c => c.isNew).length; if (fresh) row('Itens novos', fresh, 'new');
  const doneBtn = el('button', 'lc-btn lc-primary', 'Continuar'); doneBtn.type = 'button';
  const odds = el('div', 'lc-odds', 'Caixas são ganhas só jogando. Probabilidades em Mais > Probabilidades das caixas.');
  summary.append(doneBtn, odds);
  ov.append(fx, flash, top, stage, summary, live);
  doc.body.append(ov); doc.body.classList.add('lc-lock');
  const fxCtl = createFx(fx); fxCtl.size();
  const onResize = () => fxCtl.size(); root.addEventListener('resize', onResize);

  const sleep = ms => new Promise(r => { if (ctl.skipped || ms <= 0) return r(); const t = setTimeout(() => { ctl.sleepers.delete(done); r(); }, ms); const done = () => { clearTimeout(t); r(); }; ctl.sleepers.add(done); });
  const center = n => { const r = n.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const setPhase = p => { ov.dataset.phase = p; };

  function showAll() { // modo instantâneo (Pular / reduzir movimento)
    ov.classList.add('lc-instant');
    nodes.forEach(n => n.classList.add('lc-dealt', 'lc-flipped')); counters.forEach(c => { c.node.textContent = fmt(c.to); });
    live.textContent = cards.map((c, i) => `Carta ${i + 1}: ${c.name}, ${RNAME[c.rarity]}`).join('. ');
    setPhase('summary'); doneBtn.focus();
  }
  function skip() { if (ctl.skipped || ctl.closed) return; ctl.skipped = true; ctl.sleepers.forEach(f => f()); if (ctl.tap) ctl.tap(); fxCtl.stop(); showAll(); }

  async function ritual() {
    await new Promise(r => { ctl.tap = r; boxBtn.addEventListener('click', () => r(), { once: true }); });
    ctl.tap = null; if (ctl.skipped) return;
    if (calm) { showAll(); return; }
    setPhase('charge'); sfx.charge(); await sleep(1100); if (ctl.skipped) return;
    const [cx, cy] = center(stage);
    setPhase('burst'); flash.style.setProperty('--fc', RC[best]); flash.classList.add('lc-on'); sfx.boom();
    fxCtl.burst(cx, cy, RC[best], 24 + RANK[best] * 14, 420 + RANK[best] * 90, false); if (RANK[best] >= 2) fxCtl.burst(cx, cy, '#d4fc5a', 30, 520, true);
    nodes.forEach(n => n.classList.add('lc-dealt')); await sleep(650); if (ctl.skipped) return;
    setPhase('reveal');
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i], rank = RANK[c.rarity], n = nodes[i];
      if (rank >= 2) { n.style.setProperty('--sus', (rank === 3 ? 1 : 0.55) + 's'); n.classList.add('lc-suspense'); await sleep(rank === 3 ? 1000 : 550); if (ctl.skipped) return; n.classList.remove('lc-suspense'); }
      n.style.setProperty('--flip', (rank === 3 ? 0.9 : 0.52) + 's'); n.classList.add('lc-flipped'); sfx.flip(rank);
      live.textContent = `Carta ${i + 1} de ${cards.length}: ${c.name}, ${RNAME[c.rarity]}`;
      await sleep((rank === 3 ? 900 : 520) * 0.6); if (ctl.skipped) return;
      const [x, y] = center(n); fxCtl.burst(x, y, RC[c.rarity], 8 + rank * 14, 160 + rank * 90, rank >= 2);
      if (rank === 3) { flash.classList.remove('lc-on'); void flash.offsetWidth; flash.style.setProperty('--fc', RC.lendario); flash.classList.add('lc-on'); stage.classList.add('lc-quake'); }
      await sleep(rank === 3 ? 700 : rank === 2 ? 600 : 380); if (ctl.skipped) return;
    }
    setPhase('summary'); doneBtn.focus();
    for (const c of counters) { if (ctl.skipped) return; await countUp(c.node, c.to, 900, fmt, k => { if (k < 1 && Math.random() < 0.15) sfx.coin(); }, () => ctl.skipped || ctl.closed); }
    if (ctl.skipped) return;
    fly(); fxCtl.burst(root.innerWidth / 2, root.innerHeight * 0.6, '#d4fc5a', 40, 380, true);
  }
  function fly() { // "+X" voando até o contador do jogo (alvo opcional)
    for (const c of counters) {
      if (c.key !== 'cr' && c.key !== 'fragments') continue;
      const target = typeof opts.targets?.[c.key] === 'string' ? doc.querySelector(opts.targets[c.key]) : opts.targets?.[c.key];
      if (!target || !c.node.isConnected || !c.node.animate) { if (opts.onLand) opts.onLand(c.key); continue; }
      const [fx0, fy0] = center(c.node), [tx, ty] = center(target), chip = el('span', 'lc-fly', '+' + fmt(c.to) + (c.key === 'cr' ? ' CR' : ''));
      doc.body.append(chip);
      const a = chip.animate([{ transform: `translate(${fx0}px,${fy0}px) scale(1.2)`, opacity: 1 }, { transform: `translate(${tx}px,${ty}px) scale(.5)`, opacity: 0.15 }], { duration: 800, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
      a.onfinish = () => { chip.remove(); if (opts.onLand) opts.onLand(c.key); };
    }
  }

  let resolve; const promise = new Promise(r => { resolve = r; });
  function close() {
    if (ctl.closed) return; ctl.closed = true; ctl.skipped = true; if(ctl.tap)ctl.tap(); ctl.sleepers.forEach(f => f());
    fxCtl.stop(); root.removeEventListener('resize', onResize); doc.removeEventListener('keydown', onKey, true);
    ov.remove(); doc.body.classList.remove('lc-lock'); active = null;
    if (prevFocus && prevFocus.focus) prevFocus.focus();
    if (opts.onDone) opts.onDone(res); resolve(res);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); if (ov.dataset.phase === 'summary' && ctl.skipped) close(); else skip(); }
    else if (e.key === 'Tab') { const f = [...ov.querySelectorAll('button:not([hidden])')].filter(b => b.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); } }
  }
  skipBtn.addEventListener('click', skip); doneBtn.addEventListener('click', close); doc.addEventListener('keydown', onKey, true);
  soundBtn.addEventListener('click', () => { sfx.setOn(!sfx.isOn()); soundBtn.textContent = 'Som: ' + (sfx.isOn() ? 'ligado' : 'desligado'); soundBtn.setAttribute('aria-pressed', String(sfx.isOn())); if (opts.onSoundChange) opts.onSoundChange(sfx.isOn()); });
  boxBtn.focus();
  if(calm){ctl.skipped=true;showAll()}else ritual().catch(err => { console.error('ApexLootCinema: falha na animação, mostrando o resultado direto', err); skip(); });
  active = { promise, skip, close };
  return active;
}

const api = { play, isOpen: () => !!active };
root.ApexLootCinema = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
