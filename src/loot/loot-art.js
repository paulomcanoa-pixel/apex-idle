// Apex Idle: arte das caixas de loot em SVG desenhado no código (nada baixado de fora).
// Global: window.ApexLootArt. Cada função devolve uma STRING SVG estática (sem texto externo dentro).
// Visual: azul-noite (#0b1014), verde-limão (#d4fc5a), âmbar (#ffb627). Cores de raridade = as do jogo.
(function (root) {
'use strict';

const C = { night: '#0b1014', panel: '#131b21', line: '#283139', lime: '#d4fc5a', amber: '#ffb627', green: '#35e6a8', red: '#f0243e', ice: '#eaf2f6', metal: '#9cafbe', metal2: '#5d6f7b', dark: '#1b252c' };
const RARITY = {
  comum: { c: '#9cafbe', d: '#4b5b66', name: 'Comum' },
  raro: { c: '#65c9ff', d: '#1d5f86', name: 'Raro' },
  epico: { c: '#b38bff', d: '#55318f', name: 'Épico' },
  lendario: { c: '#ffcd75', d: '#a8661a', name: 'Lendário' },
};
const TIER = {
  bronze: { a: '#f0b27a', b: '#8d4f22', glow: '#f0b27a', aura: 0.22, name: 'Bronze' },
  prata: { a: '#eef4f8', b: '#7d8e9a', glow: '#bfe3ff', aura: 0.32, name: 'Prata' },
  ouro: { a: '#ffd36b', b: '#b27413', glow: '#ffcd75', aura: 0.5, name: 'Ouro' },
  lendaria: { a: '#d9b8ff', b: '#5a2fa0', glow: '#ff86bf', aura: 0.75, name: 'Lendária' },
};
let counter = 0;
const uid = () => 'la' + (++counter);
const fmt = n => +n.toFixed(2);
const svg = (vb, label, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" role="img" aria-label="${label}">${inner}</svg>`;
const sparkle = (x, y, s, fill) => `<path d="M${x} ${y - s}L${fmt(x + s * 0.26)} ${fmt(y - s * 0.26)}L${x + s} ${y}L${fmt(x + s * 0.26)} ${fmt(y + s * 0.26)}L${x} ${y + s}L${fmt(x - s * 0.26)} ${fmt(y + s * 0.26)}L${x - s} ${y}L${fmt(x - s * 0.26)} ${fmt(y - s * 0.26)}Z" fill="${fill}"/>`;
const ring = (n, cx, cy, r, fn) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return fn(fmt(cx + Math.cos(a) * r), fmt(cy + Math.sin(a) * r), i, a * 180 / Math.PI); }).join('');

// ---------------- caixas (160x160) ----------------
function box(kind, tier) {
  if (kind !== 'afk' && kind !== 'online') throw new RangeError('caixa: afk ou online');
  const T = TIER[tier]; if (!T) throw new RangeError('tier inválido: ' + tier);
  const u = uid(), ti = Object.keys(TIER).indexOf(tier);
  let s = `<defs>
<linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.a}"/><stop offset="1" stop-color="${T.b}"/></linearGradient>
<linearGradient id="${u}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".25" stop-color="${T.a}"/><stop offset="1" stop-color="${T.b}"/></linearGradient>
<radialGradient id="${u}g"><stop offset="0" stop-color="${T.glow}" stop-opacity="${T.aura}"/><stop offset="1" stop-color="${T.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="${u}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.lime}"/><stop offset=".5" stop-color="#ff86bf"/><stop offset="1" stop-color="#65c9ff"/></linearGradient></defs>`;
  s += `<circle cx="80" cy="92" r="74" fill="url(#${u}g)"/>`;
  if (tier === 'lendaria') s += ring(12, 80, 92, 1, (x, y, i, a) => `<path d="M80 92L${fmt(80 + Math.cos(a * Math.PI / 180) * 78)} ${fmt(92 + Math.sin(a * Math.PI / 180) * 78)}" stroke="${i % 2 ? C.lime : '#ff86bf'}" stroke-width="2" opacity=".35"/>`);
  s += `<ellipse cx="80" cy="140" rx="54" ry="8" fill="#000" opacity=".4"/>`;
  s += `<rect x="32" y="70" width="96" height="62" rx="9" fill="url(#${u}b)" stroke="${C.night}" stroke-width="3"/>`;
  s += `<rect x="32" y="70" width="96" height="8" fill="#000" opacity=".22"/>`;
  [44, 106].forEach(x => { s += `<rect x="${x}" y="46" width="10" height="86" fill="${T.b}" opacity=".55"/><rect x="${x + 2}" y="46" width="3" height="86" fill="#fff" opacity=".25"/>`; });
  s += `<rect x="26" y="44" width="108" height="32" rx="9" fill="url(#${u}l)" stroke="${C.night}" stroke-width="3"/>`;
  [38, 122].forEach(x => [52, 124].forEach(y => { s += `<circle cx="${x}" cy="${y}" r="2.6" fill="${C.night}" opacity=".7"/>`; }));
  if (kind === 'online') { // bandeira quadriculada na tampa
    for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) s += `<rect x="${60 + c * 5}" y="${55 + r * 5}" width="5" height="5" fill="${(r + c) % 2 ? C.ice : C.night}"/>`;
    s += `<rect x="60" y="55" width="40" height="10" fill="none" stroke="${C.night}" stroke-width="1.5"/>`;
  } else { // lua e estrelas na tampa
    s += `<path d="M84 52a10 10 0 1 0 6 17a8 8 0 1 1-6-17z" fill="${C.amber}" stroke="${C.night}" stroke-width="1.5"/>` + sparkle(66, 56, 4, C.ice) + sparkle(98, 52, 3, C.ice) + sparkle(100, 66, 2.4, C.ice);
  }
  s += `<rect x="67" y="70" width="26" height="20" rx="5" fill="${C.lime}" stroke="${C.night}" stroke-width="2.5"/><circle cx="80" cy="78" r="3.2" fill="${C.night}"/><rect x="78.6" y="79" width="2.8" height="7" rx="1" fill="${C.night}"/>`;
  s += `<circle cx="80" cy="110" r="17" fill="${C.night}" stroke="${C.lime}" stroke-width="2.5"/>`;
  if (kind === 'afk') s += `<circle cx="80" cy="110" r="11" fill="none" stroke="${C.lime}" stroke-width="2"/><path d="M80 110V102M80 110L86 113" stroke="${C.lime}" stroke-width="2.4" stroke-linecap="round"/>` + ring(12, 80, 110, 9, (x, y, i) => (i % 3 ? '' : `<circle cx="${x}" cy="${y}" r="1" fill="${C.lime}"/>`));
  else s += `<path d="M85 95L72 112H80L76 126L90 107H82Z" fill="${C.amber}" stroke="${C.night}" stroke-width="1.2" stroke-linejoin="round"/>`;
  if (ti >= 1) s += sparkle(30, 48, 6, C.ice) + sparkle(132, 80, 4, C.ice);
  if (ti >= 2) s += `<path d="M48 44L56 28L68 40L80 22L92 40L104 28L112 44Z" fill="${C.amber}" stroke="${C.night}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="80" cy="34" r="3.4" fill="${C.red}" stroke="${C.night}" stroke-width="1.5"/>` + sparkle(122, 34, 6, C.lime);
  if (ti >= 3) s += `<rect x="26" y="44" width="108" height="88" rx="10" fill="none" stroke="url(#${u}p)" stroke-width="3"/>` + sparkle(22, 96, 7, C.lime) + sparkle(140, 52, 6, '#ff86bf') + sparkle(138, 118, 5, '#65c9ff') + sparkle(80, 12, 8, C.ice);
  return svg(160, `Caixa ${kind === 'afk' ? 'AFK' : 'Online'} ${T.name}`, s);
}

// ---------------- itens (128x128) ----------------
// Cada ícone recebe a cor da raridade (c) e a escura (d).
const ICONS = {
  motor: (c, d) => `<rect x="26" y="58" width="66" height="40" rx="7" fill="${C.metal}" stroke="${C.night}" stroke-width="3"/>` +
    [0, 1, 2].map(i => `<rect x="${32 + i * 20}" y="42" width="14" height="20" rx="3" fill="${c}" stroke="${C.night}" stroke-width="2.5"/><rect x="${34 + i * 20}" y="36" width="10" height="7" rx="2" fill="${C.dark}"/>`).join('') +
    `<path d="M26 70H14V86H26" fill="none" stroke="${C.metal2}" stroke-width="7" stroke-linejoin="round"/><circle cx="102" cy="78" r="17" fill="${C.dark}" stroke="${c}" stroke-width="3.5"/>` +
    ring(6, 102, 78, 1, (x, y, i, a) => `<path d="M102 78L${fmt(102 + Math.cos(a * Math.PI / 180) * 13)} ${fmt(78 + Math.sin(a * Math.PI / 180) * 13)}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`) +
    `<circle cx="102" cy="78" r="3.5" fill="${C.ice}"/><rect x="34" y="82" width="50" height="5" rx="2" fill="${d}"/>`,
  pneu: (c, d) => `<circle cx="64" cy="64" r="44" fill="#10161b" stroke="${C.night}" stroke-width="3"/><circle cx="64" cy="64" r="39" fill="none" stroke="#2a343c" stroke-width="6" stroke-dasharray="7 5"/>` +
    `<circle cx="64" cy="64" r="26" fill="${c}" stroke="${C.night}" stroke-width="3"/><circle cx="64" cy="64" r="20" fill="${C.dark}"/>` +
    ring(5, 64, 64, 1, (x, y, i, a) => `<path d="M64 64L${fmt(64 + Math.cos(a * Math.PI / 180) * 20)} ${fmt(64 + Math.sin(a * Math.PI / 180) * 20)}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`) +
    `<circle cx="64" cy="64" r="6" fill="${C.ice}" stroke="${C.night}" stroke-width="2"/><path d="M30 44A40 40 0 0 1 52 26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".25"/>`,
  asa: (c, d) => `<rect x="9" y="38" width="9" height="58" rx="3" fill="${C.dark}" stroke="${c}" stroke-width="2.5"/><rect x="110" y="38" width="9" height="58" rx="3" fill="${C.dark}" stroke="${c}" stroke-width="2.5"/>` +
    `<rect x="57" y="88" width="14" height="24" rx="3" fill="${C.metal2}" stroke="${C.night}" stroke-width="2.5"/><polygon points="14,80 114,72 114,86 14,94" fill="${C.metal}" stroke="${C.night}" stroke-width="3" stroke-linejoin="round"/>` +
    `<polygon points="14,56 114,46 114,64 14,76" fill="${c}" stroke="${C.night}" stroke-width="3" stroke-linejoin="round"/><path d="M20 62L108 54" stroke="#fff" stroke-width="2.5" opacity=".35"/><rect x="50" y="74" width="28" height="6" rx="2" fill="${d}"/>`,
  freio: (c, d) => `<circle cx="64" cy="66" r="42" fill="${C.metal}" stroke="${C.night}" stroke-width="3"/><circle cx="64" cy="66" r="14" fill="${C.dark}" stroke="${C.night}" stroke-width="2.5"/>` +
    ring(10, 64, 66, 27, (x, y) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${C.dark}"/>`) + ring(5, 64, 66, 8, (x, y) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${C.metal}"/>`) +
    `<path d="M86 22H104A6 6 0 0 1 110 28V58A6 6 0 0 1 104 64H86Z" fill="${c}" stroke="${C.night}" stroke-width="3"/><rect x="92" y="30" width="12" height="4" rx="2" fill="${C.night}" opacity=".5"/><rect x="92" y="42" width="12" height="4" rx="2" fill="${C.night}" opacity=".5"/>`,
  cambio: (c, d) => ring(10, 64, 64, 1, (x, y, i, a) => `<rect x="57" y="14" width="14" height="18" rx="3" fill="${C.metal}" stroke="${C.night}" stroke-width="2.5" transform="rotate(${fmt(a + 90)} 64 64)"/>`) +
    `<circle cx="64" cy="64" r="34" fill="${C.metal}" stroke="${C.night}" stroke-width="3"/><circle cx="64" cy="64" r="25" fill="none" stroke="${c}" stroke-width="5"/><circle cx="64" cy="64" r="11" fill="${C.dark}" stroke="${C.night}" stroke-width="3"/>` +
    ring(3, 64, 64, 18, (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="${C.dark}"/>`),
  ers: (c, d) => `<rect x="20" y="38" width="76" height="56" rx="10" fill="${C.dark}" stroke="${c}" stroke-width="4"/><rect x="96" y="55" width="12" height="22" rx="4" fill="${c}" stroke="${C.night}" stroke-width="2.5"/>` +
    [0, 1, 2, 3].map(i => `<rect x="${27 + i * 16}" y="76" width="12" height="11" rx="2" fill="${i < 3 ? c : d}"/>`).join('') +
    `<path d="M62 44L44 68H57L50 88L74 60H61Z" fill="${C.lime}" stroke="${C.night}" stroke-width="2" stroke-linejoin="round"/>` + sparkle(104, 38, 6, C.lime) + sparkle(16, 102, 4, c),
  chassi: (c, d) => { const half = `<polygon points="8,64 36,59 50,50 70,46 78,36 90,36 92,47 112,50 120,56 120,64" fill="${c}" stroke="${C.night}" stroke-width="3" stroke-linejoin="round"/>`;
    return `<rect x="26" y="26" width="20" height="12" rx="3" fill="${C.dark}"/><rect x="26" y="90" width="20" height="12" rx="3" fill="${C.dark}"/><rect x="92" y="24" width="22" height="14" rx="3" fill="${C.dark}"/><rect x="92" y="90" width="22" height="14" rx="3" fill="${C.dark}"/>` +
      half + `<g transform="translate(0 128) scale(1 -1)">${half}</g><ellipse cx="68" cy="64" rx="15" ry="7" fill="${C.dark}" stroke="${C.night}" stroke-width="2"/><path d="M52 64A16 10 0 0 1 84 64" fill="none" stroke="${C.metal}" stroke-width="3.5"/><path d="M16 61H100" stroke="#fff" stroke-width="2" opacity=".35"/><rect x="2" y="52" width="6" height="24" rx="2" fill="${d}"/>`; },
  combustivel: (c, d) => `<path d="M42 42V28H72V42" fill="none" stroke="${C.metal2}" stroke-width="7" stroke-linejoin="round"/><rect x="28" y="40" width="62" height="68" rx="9" fill="${c}" stroke="${C.night}" stroke-width="3"/>` +
    `<rect x="86" y="46" width="18" height="12" rx="3" fill="${C.metal}" stroke="${C.night}" stroke-width="2.5"/><path d="M104 52H112V40" fill="none" stroke="${C.metal2}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M59 56C59 56 46 72 46 82A13 13 0 0 0 72 82C72 72 59 56 59 56Z" fill="${C.night}" opacity=".85"/><path d="M52 82A7 7 0 0 0 59 90" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M34 46H84" stroke="#fff" stroke-width="2.5" opacity=".3"/>`,
  moeda: (c, d) => `<defs><linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#b27413"/></linearGradient></defs><circle cx="64" cy="64" r="42" fill="url(#gm)" stroke="${C.night}" stroke-width="4"/>` +
    `<circle cx="64" cy="64" r="32" fill="none" stroke="${C.night}" stroke-width="3" opacity=".55"/><text x="64" y="75" text-anchor="middle" font-family="Hanken Grotesk,Arial,sans-serif" font-size="30" font-weight="800" fill="#7a4a0a">CR</text><path d="M32 46A36 36 0 0 1 50 30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>`,
  moedas: (c, d) => [0, 1, 2, 3].map(i => { const y = 100 - i * 15; return `<rect x="28" y="${y}" width="72" height="14" fill="#a8661a" stroke="${C.night}" stroke-width="2.5"/><ellipse cx="64" cy="${y}" rx="36" ry="12" fill="#ffd36b" stroke="${C.night}" stroke-width="2.5"/><ellipse cx="64" cy="${y}" rx="26" ry="7.5" fill="none" stroke="#b27413" stroke-width="2"/>`; }).join('') + sparkle(100, 30, 8, C.lime) + sparkle(26, 44, 5, C.ice),
  fragmento: (c, d) => crystal(c, d, 1, 0, 0),
  fragmentos: (c, d) => `<g opacity=".95">` + crystal(c, d, 0.62, -26, 40) + crystal(c, d, 0.62, 34, 44) + crystal(c, d, 0.85, 4, 8) + `</g>` + sparkle(104, 26, 7, C.ice),
  capacete: (c, d) => `<path d="M22 84C22 46 44 26 70 26C98 26 110 50 110 76V90H40C30 90 22 88 22 84Z" fill="${c}" stroke="${C.night}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<path d="M58 50H106V74H50C50 62 52 54 58 50Z" fill="${C.dark}" stroke="${C.metal}" stroke-width="3"/><path d="M60 56H96" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>` +
    `<path d="M32 66C40 40 62 30 84 30" fill="none" stroke="${C.ice}" stroke-width="5" stroke-linecap="round" opacity=".85"/><rect x="36" y="88" width="70" height="12" rx="6" fill="${C.metal2}" stroke="${C.night}" stroke-width="3"/><circle cx="30" cy="80" r="4" fill="${C.lime}"/>`,
  pintura: (c, d) => `<rect x="38" y="46" width="44" height="70" rx="9" fill="${C.metal}" stroke="${C.night}" stroke-width="3"/><rect x="38" y="68" width="44" height="28" fill="${c}"/><path d="M38 76H82M38 88H82" stroke="${C.night}" stroke-width="2" opacity=".35"/>` +
    `<rect x="46" y="28" width="28" height="20" rx="5" fill="${C.dark}" stroke="${C.night}" stroke-width="3"/><rect x="56" y="20" width="9" height="9" rx="2" fill="${c}"/>` + ring(7, 0, 0, 1, (x, y, i) => `<circle cx="${[96, 104, 92, 108, 98, 112, 90][i]}" cy="${[26, 34, 40, 20, 50, 44, 14][i]}" r="${[4, 3, 2.4, 3.2, 2, 2.6, 2.4][i]}" fill="${c}" opacity="${0.95 - i * 0.08}"/>`) + `<path d="M46 52V104" stroke="#fff" stroke-width="3" opacity=".3"/>`,
  trofeu: (c, d) => `<defs><linearGradient id="gt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#b27413"/></linearGradient></defs>` +
    `<path d="M38 36H24C22 56 32 66 44 68M90 36H104C106 56 96 66 84 68" fill="none" stroke="url(#gt)" stroke-width="7" stroke-linecap="round"/><path d="M38 24H90V52C90 72 78 84 64 84C50 84 38 72 38 52Z" fill="url(#gt)" stroke="${C.night}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<rect x="57" y="84" width="14" height="18" fill="#b27413" stroke="${C.night}" stroke-width="2.5"/><rect x="38" y="100" width="52" height="14" rx="4" fill="${C.dark}" stroke="${c}" stroke-width="3"/>` + sparkle(64, 50, 12, C.ice) + `<path d="M46 32V54" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>`,
  volante: (c, d) => `<rect x="12" y="38" width="104" height="58" rx="20" fill="${C.dark}" stroke="${C.metal2}" stroke-width="4"/><rect x="8" y="42" width="18" height="50" rx="9" fill="${C.metal}" stroke="${C.night}" stroke-width="3"/><rect x="102" y="42" width="18" height="50" rx="9" fill="${C.metal}" stroke="${C.night}" stroke-width="3"/>` +
    `<rect x="40" y="48" width="48" height="28" rx="5" fill="${C.night}" stroke="${c}" stroke-width="2.5"/><path d="M46 68L54 60L62 64L72 54L82 60" fill="none" stroke="${C.lime}" stroke-width="2.4" stroke-linejoin="round"/>` +
    [0, 1, 2, 3, 4].map(i => `<circle cx="${44 + i * 10}" cy="42" r="2.8" fill="${[C.green, C.green, C.amber, C.amber, C.red][i]}"/>`).join('') + `<circle cx="38" cy="86" r="5" fill="${c}"/><circle cx="90" cy="86" r="5" fill="${c}"/><circle cx="64" cy="86" r="5" fill="${C.lime}"/>`,
  ficha: (c, d) => `<path d="M12 34H116V54A10 10 0 0 0 116 74V94H12V74A10 10 0 0 0 12 54Z" fill="${c}" stroke="${C.night}" stroke-width="3.5" stroke-linejoin="round"/><path d="M34 40V88" stroke="${C.night}" stroke-width="2.5" stroke-dasharray="4 4" opacity=".6"/>` +
    `<path d="M76 42L58 66H70L62 88L90 58H76Z" fill="${C.night}" stroke="${C.lime}" stroke-width="2" stroke-linejoin="round"/>` + sparkle(108, 28, 7, C.ice),
};
function crystal(c, d, k, dx, dy) {
  return `<g transform="translate(${dx} ${dy}) scale(${k})"><polygon points="64,10 90,44 82,106 64,118 46,106 38,44" fill="${c}" stroke="${C.night}" stroke-width="${fmt(3.5 / k)}" stroke-linejoin="round"/>` +
    `<polygon points="64,10 90,44 64,54" fill="#fff" opacity=".4"/><polygon points="64,54 90,44 82,106 64,118" fill="${d}" opacity=".55"/><polygon points="38,44 64,54 46,106" fill="#fff" opacity=".12"/></g>`;
}
const ITEM_KEYS = Object.keys(ICONS);
function item(key, rarity = 'comum') {
  if (!ICONS[key]) throw new RangeError('item desconhecido: ' + key);
  const R = RARITY[rarity]; if (!R) throw new RangeError('raridade inválida: ' + rarity);
  let body = ICONS[key](R.c, R.d);
  if (body.includes('id="gm"') || body.includes('id="gt"')) { const u = uid(); body = body.replace(/id="g([mt])"/g, `id="${u}$1"`).replace(/url\(#g([mt])\)/g, `url(#${u}$1)`); }
  return svg(128, key, body);
}

// ---------------- molduras por raridade (128x128) ----------------
function frame(rarity) {
  const R = RARITY[rarity]; if (!R) throw new RangeError('raridade inválida: ' + rarity);
  const u = uid(), ri = Object.keys(RARITY).indexOf(rarity);
  let s = `<defs><linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a33"/><stop offset="1" stop-color="${C.night}"/></linearGradient>
<radialGradient id="${u}r" cx=".5" cy=".55"><stop offset="0" stop-color="${R.c}" stop-opacity="${[0.1, 0.22, 0.3, 0.42][ri]}"/><stop offset="1" stop-color="${R.c}" stop-opacity="0"/></radialGradient>
<linearGradient id="${u}e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.lime}"/><stop offset=".5" stop-color="#ffcd75"/><stop offset="1" stop-color="#ff86bf"/></linearGradient></defs>`;
  s += `<rect x="5" y="5" width="118" height="118" rx="14" fill="url(#${u}f)"/><rect x="5" y="5" width="118" height="118" rx="14" fill="url(#${u}r)"/>`;
  s += `<rect x="5" y="5" width="118" height="118" rx="14" fill="none" stroke="${ri === 3 ? `url(#${u}e)` : R.c}" stroke-width="${[2.5, 3.5, 4, 5][ri]}"/>`;
  if (ri >= 1) [[12, 12, 1, 1], [116, 12, -1, 1], [12, 116, 1, -1], [116, 116, -1, -1]].forEach(([x, y, a, b]) => { s += `<path d="M${x} ${y + 14 * b}V${y}H${x + 14 * a}" fill="none" stroke="${R.c}" stroke-width="2.5" stroke-linecap="round"/>`; });
  if (ri >= 2) s += `<rect x="12" y="12" width="104" height="104" rx="9" fill="none" stroke="${R.c}" stroke-width="1.2" opacity=".6"/><path d="M64 4L71 12L64 20L57 12Z" fill="${R.c}" stroke="${C.night}" stroke-width="1.5"/>`;
  if (ri >= 3) s += sparkle(20, 22, 7, C.lime) + sparkle(110, 104, 8, '#ff86bf') + sparkle(108, 22, 5, C.ice) + `<path d="M24 118H104" stroke="url(#${u}e)" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
  return svg(128, 'Moldura ' + R.name, s);
}
// Carta completa = moldura + ícone (usa a cor da raridade). Ícone vai em <g> reduzido.
function card(key, rarity = 'comum') {
  const f = frame(rarity), it = item(key, rarity);
  const inner = it.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return f.replace(/<\/svg>$/, `<g transform="translate(20 18) scale(.69)">${inner}</g></svg>`).replace(/aria-label="[^"]*"/, `aria-label="${key} ${RARITY[rarity].name}"`);
}
const BOXES = ['afk', 'online'].flatMap(k => Object.keys(TIER).map(t => ({ kind: k, tier: t })));
function all() { // usado por tools/export-svg.mjs e pela demo
  return [
    ...BOXES.map(b => ({ file: `caixa-${b.kind}-${b.tier}.svg`, svg: box(b.kind, b.tier) })),
    ...ITEM_KEYS.map(k => ({ file: `item-${k}.svg`, svg: item(k, 'epico') })),
    ...Object.keys(RARITY).map(r => ({ file: `moldura-${r}.svg`, svg: frame(r) })),
  ];
}
const api = { palette: C, RARITY, TIER, ITEM_KEYS, BOXES, box, item, frame, card, all, toDataUri: str => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str) };
root.ApexLootArt = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
