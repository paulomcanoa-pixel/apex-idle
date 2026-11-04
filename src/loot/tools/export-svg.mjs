// Gera loot/arte/*.svg a partir de loot-art.js. Rodar: node loot/tools/export-svg.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const Art = createRequire(import.meta.url)('../loot-art.js');
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../arte');
mkdirSync(out, { recursive: true });
const files = Art.all();
for (const f of files) writeFileSync(path.join(out, f.file), f.svg, 'utf8');
console.log('SVGs gravados:', files.length, 'em', out);
