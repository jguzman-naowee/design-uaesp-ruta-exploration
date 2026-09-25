// Exporta una composición a mp4 1920×1080 (+ .srt con los subtítulos).
// Uso: node guion/grabar.mjs admin [--arriba] [--sin-barra] [--sin-subs] [--sin-puntero] [--sin-intro] | todas
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'videos');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const pedido = args.find((a) => !a.startsWith('--')) || 'admin';
const opciones = { barra: !flags.has('--sin-barra'), subs: !flags.has('--sin-subs'), puntero: !flags.has('--sin-puntero'), intro: !flags.has('--sin-intro'), arriba: flags.has('--arriba') };
const TODAS = ['admin', 'operador', 'conductor', 'supervisor-ruta', 'supervisor', 'flota'];

function servir() {
  const srv = createServer(async (req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    try {
      const cuerpo = await readFile(join(RAIZ, ruta === '/' ? 'guion.html' : ruta));
      res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] || 'application/octet-stream' }).end(cuerpo);
    } catch { res.writeHead(404).end(); }
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

const srt = (s) => { const ms = Math.max(0, Math.round(s)); const h = (n, l = 2) => String(n).padStart(l, '0');
  return `${h(Math.floor(ms / 3600000))}:${h(Math.floor(ms / 60000) % 60)}:${h(Math.floor(ms / 1000) % 60)},${h(ms % 1000, 3)}`; };

async function grabar(comp, base) {
  const sufijo = [opciones.arriba && opciones.barra && 'arriba', !opciones.barra && 'sin-barra', !opciones.subs && 'sin-subs', !opciones.puntero && 'sin-puntero', !opciones.intro && 'sin-intro'].filter(Boolean).join('-');
  const nombre = comp + (sufijo ? '-' + sufijo : '');
  const tmp = join(SALIDA, '.tmp-' + nombre);
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: tmp, size: { width: 1920, height: 1080 } } });
  const pagina = await ctx.newPage();
  const t0 = Date.now();
  const q = new URLSearchParams({ comp, grabar: '1' });
  for (const k of ['barra', 'subs', 'puntero', 'intro']) { if (!opciones[k]) q.set(k, '0'); }
  if (opciones.arriba) q.set('pos', 'arriba');
  await pagina.goto(`${base}/guion.html?${q}`);
  await pagina.waitForFunction(() => window.__guion && window.__guion.inicio != null, null, { timeout: 30000 });
  const inicio = await pagina.evaluate(() => performance.timeOrigin + window.__guion.inicio);
  await pagina.waitForFunction(() => window.__guion.fin != null || window.__guion.error, null, { timeout: 600000, polling: 500 });
  const g = await pagina.evaluate(() => window.__guion);
  await pagina.waitForTimeout(400);
  const video = pagina.video();
  await ctx.close(); await navegador.close();
  if (g.error) { throw new Error(`${comp}: ${g.error}`); }

  const corte = Math.max(0, (inicio - t0) / 1000 - 0.3);
  const mp4 = join(SALIDA, nombre + '.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', corte.toFixed(3), '-i', await video.path(),
    '-t', ((g.fin + 700) / 1000).toFixed(3), '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  await rm(tmp, { recursive: true, force: true });

  const lineas = g.subs.map((s, i) => {
    const hasta = (g.subs[i + 1] ? g.subs[i + 1].t : g.fin) + 300;
    return `${i + 1}\n${srt(s.t + 300)} --> ${srt(hasta)}\n${s.texto}\n`;
  });
  await writeFile(join(SALIDA, nombre + '.srt'), lineas.join('\n'));
  console.log(`✓ ${mp4}  (${(g.fin / 1000).toFixed(1)} s, ${g.subs.length} subtítulos)`);
}

await mkdir(SALIDA, { recursive: true });
const srv = await servir();
const base = `http://127.0.0.1:${srv.address().port}`;
try {
  for (const c of pedido === 'todas' ? TODAS : [pedido]) { await grabar(c, base); }
} finally { srv.close(); }
