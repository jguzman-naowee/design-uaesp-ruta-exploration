// Corre una composición completa y reporta: errores, clics fuera del objetivo, momentos < 3 s y
// una captura por subtítulo en videos/.revision/<comp>/. Uso: node guion/verificar.mjs operador
import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const comp = process.argv[2] || 'admin';
const base = process.env.BASE || 'http://127.0.0.1:8765';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'videos', '.revision', comp);
await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errores = [];
p.on('pageerror', (e) => errores.push(e.message));
p.frames(); p.on('frameattached', (f) => f.page().on('pageerror', (e) => errores.push(e.message)));
await p.goto(`${base}/guion.html?comp=${comp}&grabar=1`);
let n = 0, tomadas = 0;
const t = setInterval(async () => {
  try {
    const k = await p.evaluate(() => window.__guion.subs.length);
    while (tomadas < k) { tomadas++; const i = tomadas; setTimeout(() => p.screenshot({ path: join(dir, String(i).padStart(2, '0') + '.png') }).catch(() => {}), 2600); }
  } catch {}
}, 200);
await p.waitForFunction(() => window.__guion.fin != null || window.__guion.error, null, { timeout: 900000, polling: 250 });
clearInterval(t); await p.waitForTimeout(2800);
const g = await p.evaluate(() => window.__guion);
await b.close();

const tiempos = g.subs.map((s) => s.t).concat(g.fin || g.subs.at(-1)?.t || 0);
const cortos = g.subs.map((s, i) => [(tiempos[i + 1] - s.t) / 1000, s.texto]).filter(([d]) => d < 3);
console.log(`${comp}: ${g.error ? 'ERROR ' + g.error : 'terminó'} · ${((g.fin || 0) / 1000).toFixed(1)} s · ${g.subs.length} subtítulos`);
console.log(`clics: ${g.clics.length}, fuera del objetivo: ${g.clics.filter((c) => !c.ok).length}`);
g.clics.forEach((c, i) => { if (!c.ok) console.log(`  clic ${i + 1} fuera, en (${c.x}, ${c.y}) a los ${(c.t / 1000).toFixed(1)} s`); });
if (cortos.length) console.log('momentos < 3 s:', cortos.map(([d, s]) => d.toFixed(1) + 's «' + s.slice(0, 50) + '»').join(' | '));
if (errores.length) console.log('errores de página:', [...new Set(errores)].join(' | '));
if (g.escenas && g.escenas.length) console.log('escenas (meta → real):', g.escenas.map((e) => `${e.i}:${(e.dur / 1000).toFixed(1)}→${(e.real / 1000).toFixed(1)}${e.real > e.dur ? '!' : ''}`).join('  '));
g.subs.forEach((s, i) => console.log(String(i + 1).padStart(2, '0'), (s.t / 1000).toFixed(1).padStart(6), s.texto));
console.log('capturas:', dir);
