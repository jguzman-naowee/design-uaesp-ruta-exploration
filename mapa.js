/**
 * Mapa: base cartográfica, geometría de recorridos y el motor que los pinta.
 *
 * NO HAY COMPONENTE DE MAPA EN EL SDK. Esto es dibujo propio, todo en tokens
 * --naotech-* (cero hex).
 *
 * Cómo está armado
 * ----------------
 * 1. Una RETÍCULA de manzanas (86×60, calle de 12) en un marco propio, rotado
 *    -5° alrededor de (340,210) para que no se lea como una hoja cuadriculada.
 *    Las calles caen en ejes exactos: Xs(k) = 86k-6 (vertical, a la izquierda
 *    de la manzana k) y Ys(j) = 60j+54 (horizontal, debajo de la manzana j).
 *    Las paradas van al centro de cada manzana sobre su calle: Xc(k) = 86k+37.
 *    Toda la base (avenidas, río, parques, patio) vive en ese mismo marco, así
 *    que cualquier cosa que se calcule con Xs/Ys/Xc queda SOBRE una calle.
 *
 * 2. Un RECORRIDO es un ciclo completo con la base:
 *       base → salida → primera unidad → … → última unidad → retorno → base
 *    `serpentina()` lo genera fila por fila (ida y vuelta, como se recolecta)
 *    con las esquinas incluidas, para que el trazo dobla en las intersecciones
 *    y no corte manzanas en diagonal. Devuelve los vértices ya rotados, las
 *    paradas con su índice y la distancia acumulada en cada vértice.
 *
 * 3. `crear(el, opciones)` pinta un recorrido dentro de un contenedor y
 *    devuelve un controlador: mide el contenedor, ENCUADRA la ruta (viewBox
 *    centrado en su caja + margen, así la ruta queda entera y centrada en
 *    cualquier ventana: card, modal, teléfono, showroom) y dibuja las capas —
 *    traslado punteado, recorrido pendiente a rayas, recorrido hecho sólido,
 *    paradas, hitos (base / primera / última) y el camión. Todo lo que se mide
 *    en píxeles (radios, grosores, tipografía) se convierte a unidades del
 *    viewBox con `u`, para que el mapa se vea igual de grande a cualquier zoom.
 *
 * 4. El camión se MUEVE por el trazo con la Web Animations API: keyframes en
 *    cada vértice del tramo (dobla en las esquinas) y el mismo `easing` del
 *    sistema (--naotech-animation-standard) sobre toda la animación, así frena
 *    al llegar. El recorrido hecho crece en sincronía con stroke-dashoffset.
 *    Con prefers-reduced-motion todo se pone en su lugar de una.
 */
window.MAPA = (function () {
  'use strict';

  /* ------------------------------------------------------------------
     retícula
     ------------------------------------------------------------------ */
  var TW = 86, TH = 60, BW = 74, BH = 48;         /* baldosa y manzana */
  function Xs(k) { return TW * k - (TW - BW) / 2; } /* eje de calle vertical (izq. de la manzana k) */
  function Ys(j) { return TH * j + BH + (TH - BH) / 2; } /* eje de calle horizontal (debajo de la manzana j) */
  function Xc(k) { return TW * k + BW / 2; }        /* centro de manzana → parada */

  var CX = 340, CY = 210, ANG = -5 * Math.PI / 180;
  var COS = Math.cos(ANG), SIN = Math.sin(ANG);
  function rot(p) {
    var dx = p[0] - CX, dy = p[1] - CY;
    return { x: +(CX + dx * COS - dy * SIN).toFixed(2), y: +(CY + dx * SIN + dy * COS).toFixed(2) };
  }
  var ROTAR = 'rotate(-5 ' + CX + ' ' + CY + ')';

  /* Patios de operaciones (las bases). El portón de cada uno da a la calle
     Ys(j), debajo de su manzana. Dos, para que la ruta del sur (R-2401) salga
     de uno cercano y no arrastre media ciudad en el encuadre. */
  var BASES = { norte: { k: 1, j: 1, label: 'Patio Norte' }, sur: { k: 1, j: 8, label: 'Patio Sur' } };
  var RET = Xs(1);   /* avenida por la que se vuelve a la base (izq. de los patios) */

  /* ------------------------------------------------------------------
     geometría de un recorrido
     ------------------------------------------------------------------ */
  function serpentina(o) {
    var n = o.n, k0 = o.k0, k1 = o.k1, j0 = o.j0, BASE = BASES[o.base || 'norte'];
    var izq = Xs(k0), der = Xs(k1 + 1);
    var gate = [Xc(BASE.k), Ys(BASE.j)];
    var V = [];                       /* vértices [x, y] en el marco de la retícula */
    var P = [];                       /* índices de vértice que son paradas */
    var tramo = { salida: [0, 0], retorno: [0, 0] };

    function push(x, y) { var u = V[V.length - 1]; if (!u || u[0] !== x || u[1] !== y) { V.push([x, y]); } }

    /* salida: del portón a la esquina izquierda de la primera fila */
    push(gate[0], gate[1]);
    if (Ys(BASE.j) !== Ys(j0)) { push(izq, Ys(BASE.j)); push(izq, Ys(j0)); } else { push(izq, Ys(j0)); }
    tramo.salida = [0, V.length - 1];

    /* filas ida y vuelta */
    var j = j0, dir = 1, quedan = n, ultimoDir = 1;
    while (quedan > 0) {
      var ks = [];
      for (var k = k0; k <= k1; k++) { ks.push(k); }
      if (dir < 0) { ks.reverse(); }
      for (var i = 0; i < ks.length && quedan > 0; i++) { push(Xc(ks[i]), Ys(j)); P.push(V.length - 1); quedan--; }
      ultimoDir = dir;
      if (quedan > 0) { var fin = dir > 0 ? der : izq; push(fin, Ys(j)); j++; push(fin, Ys(j)); dir = -dir; }
    }
    var jFin = j;

    /* retorno: por la avenida RET, sin pisar el recorrido. Si la última fila
       iba hacia la derecha, se sigue hasta la esquina, se baja a la calle
       siguiente (sin recolectar) y por ahí se vuelve. */
    var iniRet = V.length - 1;
    if (ultimoDir > 0) { push(der, Ys(jFin)); jFin++; push(der, Ys(jFin)); }
    push(RET, Ys(jFin));
    push(RET, Ys(BASE.j));
    push(gate[0], gate[1]);
    tramo.retorno = [iniRet, V.length - 1];

    return armar(V, P, tramo, o);
  }

  function armar(V, P, tramo, o) {
    var pts = V.map(rot);
    var L = [0];
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      L.push(L[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); });
    return {
      pts: pts, L: L, total: L[L.length - 1],
      paradas: P.map(function (i, n) { return { n: n + 1, i: i, x: pts[i].x, y: pts[i].y, L: L[i] }; }),
      salida: pts.slice(tramo.salida[0], tramo.salida[1] + 1).concat([pts[P[0]]]),
      retorno: pts.slice(tramo.retorno[0], tramo.retorno[1] + 1),
      recorrido: pts.slice(P[0], P[P.length - 1] + 1),
      base: pts[0],
      bbox: { x0: x0, y0: y0, x1: x1, y1: y1 },
      zonas: (o.zonas || []).map(zona)
    };
  }

  /* Un sector: rectángulo de manzanas (k0..k1, j0..j1) con sus calles, como
     polígono ya rotado. */
  function zona(z) {
    var x0 = Xs(z.k0) - 6, x1 = Xs(z.k1 + 1) + 6, y0 = Ys(z.j0 - 1) - 6, y1 = Ys(z.j1) + 6;
    var c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(rot);
    return { pts: c, label: z.label, activa: z.activa !== false, esquina: rot([x0 + 10, y0 + 16]) };
  }

  /* Las rutas del demo. La geometría es de este archivo, no de datos.js: la
     cantidad de paradas sí viene de los datos. */
  var RUTAS = {
    /* R-2402 · Sector A, en vivo (operador y showroom): 7 manzanas × 6 calles */
    enVivo:   function (n) { return serpentina({ n: n, k0: 2, k1: 8, j0: 1 }); },
    /* Entrega: R-2401 sale del Patio Sur; R-2402 es la misma que va en vivo. */
    entrega:  function (i, n) { return i === 0 ? serpentina({ n: n, k0: 2, k1: 8, j0: 8, base: 'sur' }) : serpentina({ n: n, k0: 2, k1: 8, j0: 1 }); },
    /* R-2406 · Sector B, la del operario: 2 manzanas × 4 calles, cabe en un cuadrado */
    operario: function (n) { return serpentina({ n: n, k0: 3, k1: 4, j0: 2 }); },
    /* Asistente de nueva ruta */
    trazo: function (modo, n) {
      if (modo === 'auto') {
        return serpentina({ n: n, k0: 2, k1: 7, j0: 2, zonas: [{ k0: 2, k1: 4, j0: 2, j1: 3, label: 'SECTOR A' }, { k0: 5, k1: 7, j0: 2, j1: 3, label: 'SECTOR B' }] });
      }
      return serpentina({ n: n, k0: 2, k1: 4, j0: 2, zonas: [{ k0: 2, k1: 4, j0: 2, j1: 4, label: 'SECTOR A' }] });
    }
  };

  /* ------------------------------------------------------------------
     base cartográfica (defs, va UNA vez en el body; se usa con <use>)
     ------------------------------------------------------------------ */
  function calleH(j, ancho) { return '<path d="M-1400 ' + Ys(j) + 'H2600" stroke="var(--naotech-app-background)" stroke-width="' + ancho + '"></path>'; }
  function calleV(k, ancho) { return '<path d="M' + Xs(k) + ' -1400V2600" stroke="var(--naotech-app-background)" stroke-width="' + ancho + '"></path>'; }
  function bordesH(j, d) { return '<path d="M-1400 ' + (Ys(j) - d) + 'H2600 M-1400 ' + (Ys(j) + d) + 'H2600"></path>'; }
  function bordesV(k, d) { return '<path d="M' + (Xs(k) - d) + ' -1400V2600 M' + (Xs(k) + d) + ' -1400V2600"></path>'; }
  function rotuloH(txt, x, j) { return '<text x="' + x + '" y="' + (Ys(j) + 3) + '" text-anchor="middle">' + txt + '</text>'; }
  function rotuloV(txt, k, y) { return '<text x="' + (Xs(k) + 3) + '" y="' + y + '" text-anchor="middle" transform="rotate(90 ' + (Xs(k) + 3) + ' ' + y + ')">' + txt + '</text>'; }

  var DEFS =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<pattern id="mz" width="' + TW + '" height="' + TH + '" patternUnits="userSpaceOnUse">' +
        '<rect width="' + TW + '" height="' + TH + '" fill="var(--naotech-app-background)"></rect>' +
        '<rect width="' + BW + '" height="' + BH + '" rx="2" fill="var(--naotech-app-color-100)"></rect></pattern>' +
      /* manzanas chicas, corridas -3 para que sus calles caigan en los mismos ejes */
      '<pattern id="mz2" x="-3" y="-3" width="43" height="30" patternUnits="userSpaceOnUse">' +
        '<rect width="43" height="30" fill="var(--naotech-app-background)"></rect>' +
        '<rect width="37" height="24" rx="1.5" fill="var(--naotech-app-color-050)"></rect></pattern>' +
      '<marker id="m-flecha" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">' +
        '<path d="M0 0L10 5L0 10z" fill="var(--naotech-app-color-500)"></path></marker>' +
      '<g id="basemap">' +
        '<rect x="-3000" y="-3000" width="7000" height="7000" fill="var(--naotech-app-background)"></rect>' +
        '<g transform="' + ROTAR + '">' +
          '<rect x="-1400" y="-1400" width="4000" height="4000" fill="url(#mz)"></rect>' +
          /* tejido más fino en los bordes del sector: a la izquierda de la avenida de retorno y arriba de la primera avenida */
          '<rect x="-1400" y="-1400" width="' + (1400 + Xs(1) - 6) + '" height="4000" fill="url(#mz2)"></rect>' +
          '<rect x="-1400" y="-1400" width="4000" height="' + (1400 + Ys(0) - 6) + '" fill="url(#mz2)"></rect>' +
          /* río, al oriente del sector */
          '<path d="M900 -1400 L940 -400 L916 200 L956 700 L928 1300 L972 2600 L2600 2600 L2600 -1400 Z" fill="var(--naotech-informative-color-050)"></path>' +
          '<path d="M900 -1400 L940 -400 L916 200 L956 700 L928 1300 L972 2600" fill="none" stroke="var(--naotech-informative-color-200)" stroke-width="2.5"></path>' +
          /* parques */
          '<rect x="' + (TW * 1) + '" y="' + (TH * 4) + '" width="' + BW + '" height="' + (TH + BH) + '" rx="4" fill="var(--naotech-positive-color-050)"></rect>' +
          '<rect x="' + (TW * 5) + '" y="' + (TH * 8) + '" width="' + (TW + BW) + '" height="' + BH + '" rx="4" fill="var(--naotech-positive-color-050)"></rect>' +
          '<rect x="' + (TW * 4) + '" y="' + (TH * -2) + '" width="' + BW + '" height="' + BH + '" rx="4" fill="var(--naotech-positive-color-050)"></rect>' +
          /* patios de operaciones (las bases): lote gris con dos galpones */
          Object.keys(BASES).map(function (b) { var B = BASES[b]; return (
            '<rect x="' + (TW * B.k) + '" y="' + (TH * B.j) + '" width="' + BW + '" height="' + BH + '" rx="2" fill="var(--naotech-app-color-200)"></rect>' +
            '<rect x="' + (TW * B.k + 6) + '" y="' + (TH * B.j + 6) + '" width="34" height="30" rx="2" fill="var(--naotech-app-color-300)"></rect>' +
            '<rect x="' + (TW * B.k + 46) + '" y="' + (TH * B.j + 6) + '" width="22" height="14" rx="2" fill="var(--naotech-app-color-300)"></rect>'); }).join('') +
          /* avenidas: dos horizontales, dos verticales y una diagonal */
          '<g fill="none" stroke-linecap="square">' + calleH(0, 14) + calleH(7, 14) + calleV(1, 14) + calleV(6, 14) +
            '<path d="M200 1300 L1200 700" stroke="var(--naotech-app-background)" stroke-width="11"></path></g>' +
          '<g stroke="var(--naotech-app-color-200)" stroke-width="1" fill="none">' + bordesH(0, 7) + bordesH(7, 7) + bordesV(1, 7) + bordesV(6, 7) +
            '<path d="M197 1295.5 L1197 695.5 M203 1304.5 L1203 704.5"></path></g>' +
          /* rótulos de calles: a los dos lados del sector para que alguno entre en cada encuadre */
          '<g class="nws-map__calle" font-size="9" font-weight="600" fill="var(--naotech-app-color-500)" paint-order="stroke" stroke="var(--naotech-app-background)" stroke-width="3" stroke-linejoin="round">' +
            rotuloH('Cll 70', 20, 0) + rotuloH('Cll 70', 840, 0) +
            rotuloH('Cll 72', 20, 1) + rotuloH('Cll 72', 840, 1) +
            rotuloH('Cll 74', 20, 3) + rotuloH('Cll 74', 840, 3) +
            rotuloH('Cll 76', 20, 5) + rotuloH('Cll 76', 840, 5) +
            rotuloH('Cll 77', 20, 7) + rotuloH('Cll 77', 840, 7) +
            rotuloH('Cll 80', 20, 10) + rotuloH('Cll 80', 840, 10) +
            rotuloV('Cra 45', 1, 20) + rotuloV('Cra 45', 1, 640) +
            rotuloV('Cra 47', 3, 20) + rotuloV('Cra 47', 3, 640) +
            rotuloV('Cra 51B', 6, 20) + rotuloV('Cra 51B', 6, 640) +
            '<text x="720" y="1000" transform="rotate(-31 720 1000)" text-anchor="middle">Vía 40</text>' +
            '<text x="' + (TW * 1 + BW / 2) + '" y="' + (TH * 4 + 58) + '" text-anchor="middle" fill="var(--naotech-positive-color-700)">Parque Suri</text>' +
            '<text x="' + (TW * 5 + (TW + BW) / 2) + '" y="' + (TH * 8 + 28) + '" text-anchor="middle" fill="var(--naotech-positive-color-700)">Parque Sur</text>' +
            '<text x="990" y="300" transform="rotate(-90 990 300)" text-anchor="middle" fill="var(--naotech-informative-color-600)">Río Magdalena</text>' +
            Object.keys(BASES).map(function (b) { var B = BASES[b]; return '<text x="' + (TW * B.k + BW / 2) + '" y="' + (TH * B.j - 6) + '" text-anchor="middle" fill="var(--naotech-app-color-700)">' + B.label + '</text>'; }).join('') +
          '</g>' +
        '</g>' +
      '</g>' +
    '</defs></svg>';

  /* Glifos del set de iconos dentro de SVG, por codepoint leído de icons.css. */
  var GLIFO = { vehicles: '', user: '', 'gps-pin': '', positive: '', home: '', shipping: '' };
  function glifo(nombre, x, y, size, fill) {
    return '<text x="' + x + '" y="' + (y + size * 0.36) + '" text-anchor="middle" font-family="-naotech-icons" font-size="' + size + '" fill="' + fill + '">' + (GLIFO[nombre] || '') + '</text>';
  }

  function path(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x + ' ' + p.y; }).join(''); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  /* ------------------------------------------------------------------
     leyenda y escala
     ------------------------------------------------------------------ */
  var LEYENDA = {
    recorrido: ['<span class="nws-map__line" style="background:var(--naotech-theme-color-700)"></span>', 'recorrido'],
    propuesto: ['<span class="nws-map__line" style="background:var(--naotech-theme-color-700)"></span>', 'recorrido propuesto'],
    pendiente: ['<span class="nws-map__line nws-map__line--dash"></span>', 'pendiente'],
    traslado:  ['<span class="nws-map__line nws-map__line--dot"></span>', 'salida y retorno'],
    base:      ['<span class="nws-map__sq"></span>', 'base'],
    primera:   ['<span class="nws-map__dot" style="background:var(--naotech-theme-color-700)"></span>', 'primera unidad'],
    ultima:    ['<span class="nws-map__dot nws-map__dot--ring"></span>', 'última unidad'],
    posicion:  ['<span class="nws-map__dot" style="background:var(--naotech-theme-color-700)"></span>', 'camión']
  };
  function leyenda(keys) {
    return '<div class="nws-map__legend nwt-smalltext-font-regular">' +
      keys.map(function (k) { var l = LEYENDA[k]; return l ? '<span class="nws-map__key">' + l[0] + l[1] + '</span>' : ''; }).join('') + '</div>';
  }
  /* Una manzana (86 unidades) son 100 m: la barra mide lo que miden 100 o
     200 m a este zoom, no un texto fijo. */
  function escala(u, arriba) {
    var px100 = TW / u, m = 100, px = px100;
    if (px < 56) { m = 200; px = px100 * 2; }
    if (px > 150) { m = 50; px = px100 / 2; }
    return '<div class="nws-map__scale' + (arriba ? ' nws-map__scale--arriba' : '') + ' nwt-smalltext-font-regular"><i style="width:' + Math.round(px) + 'px"></i>' + m + ' m</div>';
  }
  /* En una caja angosta (< 600px) escala y leyenda no caben en la misma
     línea: la escala sube al borde superior y la leyenda se queda con todo
     el pie. */
  var ANGOSTO = 600;

  /* ------------------------------------------------------------------
     encuadre
     ------------------------------------------------------------------ */
  /* pad = { l, r, t, b } en píxeles: la ruta se centra en la caja que queda
     libre entre esos márgenes (así la leyenda o el título no la tapan). */
  function encuadre(bbox, W, H, pad, uMin) {
    var bw = bbox.x1 - bbox.x0, bh = bbox.y1 - bbox.y0;
    var libreW = Math.max(1, W - pad.l - pad.r), libreH = Math.max(1, H - pad.t - pad.b);
    var u = Math.max(bw / libreW, bh / libreH, uMin || 0.5);
    var vw = W * u, vh = H * u;
    var cx = (bbox.x0 + bbox.x1) / 2, cy = (bbox.y0 + bbox.y1) / 2;
    /* el centro de la caja libre, no el del contenedor */
    var x = cx - (pad.l + libreW / 2) * u, y = cy - (pad.t + libreH / 2) * u;
    return { x: x, y: y, w: vw, h: vh, u: u };
  }
  function bboxCon(ruta) {
    var b = { x0: ruta.bbox.x0, y0: ruta.bbox.y0, x1: ruta.bbox.x1, y1: ruta.bbox.y1 };
    ruta.zonas.forEach(function (z) { z.pts.forEach(function (p) { b.x0 = Math.min(b.x0, p.x); b.y0 = Math.min(b.y0, p.y); b.x1 = Math.max(b.x1, p.x); b.y1 = Math.max(b.y1, p.y); }); });
    return b;
  }
  var VACIO = { x0: 40, y0: 60, x1: 720, y1: 480 };

  function token(nombre, porDefecto) {
    try { return getComputedStyle(document.body).getPropertyValue(nombre).trim() || porDefecto; } catch (e) { return porDefecto; }
  }
  function quieto() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }

  /* ------------------------------------------------------------------
     controlador
     ------------------------------------------------------------------ */
  function crear(el, o) {
    if (!el) { return null; }
    o = o || {};
    var st = {
      ruta: o.ruta || null, hechas: o.hechas || 0, enBase: !!o.enBase,
      camion: o.camion !== false && !!o.ruta, siguiente: o.siguiente !== false,
      /* segundo marcador opcional: el camión que va adelante del supervisor */
      adelante: (typeof o.adelante === 'number') ? o.adelante : null, adelanteFin: !!o.adelanteFin,
      hitos: o.hitos !== false, pad: o.pad || 44, uMin: o.uMin || 0.5,
      extra: { t: 0, b: 0 },   /* lo que ocupan título (arriba) y leyenda/escala (abajo) */
      vb: null, u: 1, anims: [], vivo: true, entrada: o.entrada
    };
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', o.aria || 'Mapa del recorrido');
    el.innerHTML = '';
    el.appendChild(svg);
    var overlay = document.createElement('div');
    overlay.className = 'nws-map__overlay';
    el.appendChild(overlay);

    function medir() { var r = el.getBoundingClientRect(); return { W: r.width || 640, H: r.height || 400 }; }

    /* posición del camión: L (distancia recorrida desde la base) */
    function Lde(n) {
      if (!st.ruta) { return 0; }
      if (n <= 0) { return 0; }
      if (n > st.ruta.paradas.length) { return st.ruta.total; }
      return st.ruta.paradas[n - 1].L;
    }
    function puntoEn(L) {
      var pts = st.ruta.pts, Ls = st.ruta.L;
      if (L <= 0) { return pts[0]; }
      for (var i = 1; i < pts.length; i++) {
        if (Ls[i] >= L) {
          var t = (L - Ls[i - 1]) / ((Ls[i] - Ls[i - 1]) || 1);
          return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t };
        }
      }
      return pts[pts.length - 1];
    }
    function Lactual() { return st.enBase ? st.ruta.total : Lde(st.hechas); }

    /* ---- dibujo ---- */
    function marcador(cls, x, y, inner, style) { return '<g class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + ' transform="translate(' + x + ' ' + y + ')">' + inner + '</g>'; }
    function etiqueta(txt, dy, u) {
      return '<text class="nws-map__lbl" y="' + dy + '" text-anchor="middle" font-size="' + (10.5 * u) + '" font-weight="600" ' +
        'paint-order="stroke" stroke="var(--naotech-app-background)" stroke-width="' + (3.5 * u) + '" stroke-linejoin="round" fill="var(--naotech-app-color-700)">' + esc(txt) + '</text>';
    }
    function numero(n, u, fill) {
      return '<text y="' + (3.6 * u) + '" text-anchor="middle" font-size="' + (10 * u) + '" font-weight="700" fill="' + fill + '">' + n + '</text>';
    }

    function dibujar() {
      var R = st.ruta, u = st.u, html = '<use href="#basemap"></use>';
      if (R) {
        var N = R.paradas.length, hechas = Math.min(st.hechas, N), L = Lactual();
        var sig = (!st.enBase && hechas < N) ? hechas : -1;    /* índice de la siguiente parada */

        /* sectores del asistente */
        html += R.zonas.map(function (z) {
          var c = z.activa ? ['var(--naotech-theme-color-050)', 'var(--naotech-theme-color-700)', 'var(--naotech-theme-color-800)'] : ['var(--naotech-app-color-050)', 'var(--naotech-app-color-500)', 'var(--naotech-app-color-700)'];
          return '<path d="' + path(z.pts) + 'Z" fill="' + c[0] + '" fill-opacity=".8" stroke="' + c[1] + '" stroke-width="' + (2 * u) + '" stroke-dasharray="' + (7 * u) + ' ' + (5 * u) + '"></path>' +
            '<text x="' + z.esquina.x + '" y="' + z.esquina.y + '" font-size="' + (11 * u) + '" font-weight="700" fill="' + c[2] + '" transform="rotate(-5 ' + z.esquina.x + ' ' + z.esquina.y + ')">' + esc(z.label) + '</text>';
        }).join('');

        /* traslados: punteados, con flecha al volver a la base */
        var tras = 'fill="none" stroke="var(--naotech-app-color-500)" stroke-width="' + (2.5 * u) + '" stroke-dasharray="0.1 ' + (6 * u) + '" stroke-linecap="round" stroke-linejoin="round"';
        html += '<path d="' + path(R.salida) + '" ' + tras + '></path>';
        /* el retorno termina un poco antes del portón para que la flecha se
           vea apuntando a la base y no quede debajo del marcador */
        var ret = R.retorno.slice(), z = ret[ret.length - 1], y = ret[ret.length - 2];
        if (y) { var dz = Math.hypot(z.x - y.x, z.y - y.y) || 1, k = Math.max(0, dz - 16 * u) / dz; ret[ret.length - 1] = { x: y.x + (z.x - y.x) * k, y: y.y + (z.y - y.y) * k }; }
        html += '<path d="' + path(ret) + '" ' + tras + ' marker-end="url(#m-flecha)"></path>';
        /* recorrido de recolección pendiente */
        html += '<path d="' + path(R.recorrido) + '" fill="none" stroke="var(--naotech-app-color-300)" stroke-width="' + (5 * u) + '" stroke-dasharray="' + (9 * u) + ' ' + (8 * u) + '" stroke-linecap="round" stroke-linejoin="round"></path>';
        /* lo hecho: todo el ciclo, recortado hasta L */
        html += '<path class="nws-map__hecho" d="' + path(R.pts) + '" fill="none" stroke="var(--naotech-theme-color-700)" stroke-width="' + (5 * u) + '" stroke-linecap="round" stroke-linejoin="round" ' +
          'stroke-dasharray="' + R.total + ' ' + R.total + '" stroke-dashoffset="' + (R.total - L) + '"></path>';

        /* paradas */
        html += '<g class="nws-map__paradas">' + R.paradas.map(function (p, i) {
          var hito = st.hitos && (i === 0 || i === N - 1);
          var hecha = i < hechas, esSig = i === sig;
          var delay = st.entrada ? 'animation-delay:' + (0.08 + i * 0.06).toFixed(2) + 's' : '';
          var cls = 'nws-map__parada' + (st.entrada ? ' nws-map__pt' : '');
          var rotulo = hito ? etiqueta(i === 0 ? 'Primera unidad' : 'Última unidad', (i === 0 ? -17 : 24) * u, u) : '';
          if (esSig && st.camion) {
            return marcador(cls + ' nws-map__parada--sig', p.x, p.y,
              '<circle r="' + (10 * u) + '" fill="var(--naotech-theme-color-100)" stroke="var(--naotech-theme-color-700)" stroke-width="' + (2.5 * u) + '"></circle>' + numero(p.n, u, 'var(--naotech-theme-color-800)') + rotulo, delay);
          }
          if (hito) {
            var lleno = hecha || !st.camion;
            return marcador(cls + ' nws-map__hito', p.x, p.y,
              '<circle r="' + (9.5 * u) + '" fill="' + (lleno ? 'var(--naotech-theme-color-700)' : 'var(--naotech-app-background)') + '" stroke="' + (lleno ? 'var(--naotech-app-background)' : 'var(--naotech-theme-color-700)') + '" stroke-width="' + (2.5 * u) + '"></circle>' +
              numero(p.n, u, lleno ? 'var(--naotech-theme-font-color)' : 'var(--naotech-theme-color-800)') + rotulo, delay);
          }
          return marcador(cls, p.x, p.y, hecha
            ? '<circle r="' + (5 * u) + '" fill="var(--naotech-theme-color-700)" stroke="var(--naotech-app-background)" stroke-width="' + (2 * u) + '"></circle>'
            : '<circle r="' + (4.5 * u) + '" fill="var(--naotech-app-background)" stroke="var(--naotech-app-color-400)" stroke-width="' + (2 * u) + '"></circle>', delay);
        }).join('') + '</g>';

        /* base */
        html += marcador('nws-map__base', R.base.x, R.base.y,
          '<rect x="' + (-11 * u) + '" y="' + (-11 * u) + '" width="' + (22 * u) + '" height="' + (22 * u) + '" rx="' + (6 * u) + '" fill="var(--naotech-app-color-900)" stroke="var(--naotech-app-background)" stroke-width="' + (2.5 * u) + '"></rect>' +
          glifo('home', 0, 0, 12 * u, 'var(--naotech-app-background)') +
          etiqueta('Base', 24 * u, u));

        /* Camión de adelante (21-sep · vista del supervisor en ruta): un
           SEGUNDO marcador, el del camión que va por delante, para que quien
           verifica sepa cuánto le lleva de ventaja. Se dibuja antes que el
           marcador propio para que este quede encima si se cruzan. */
        /* DC-072: morado — se confundía con Base (mismo --naotech-app-
           color-900). El mensaje de arriba (estadoCamion, DC-018) ya explica
           qué es, así que no hace falta una leyenda nueva acá. */
        if (st.adelante !== null) {
          var La = st.adelanteFin ? st.ruta.total : Lde(st.adelante);
          var qa = puntoEn(La);
          html += '<g class="nws-map__adelante" style="transform:translate(' + qa.x + 'px,' + qa.y + 'px)">' +
            /* DC-096: rojo — pedido directo, corrige el morado de DC-072
               (que ya distinguía de Base, pero el color de identidad del
               camión pasó a ser rojo en toda la app). */
            '<circle r="' + (13 * u) + '" fill="var(--naotech-color-red-700)" stroke="var(--naotech-app-background)" stroke-width="' + (3 * u) + '"></circle>' +
            glifo('vehicles', 0, 0, 12 * u, 'var(--naotech-app-background)') +
            etiqueta(st.adelanteFin ? 'Camión · terminó' : 'Camión', 22 * u, u) + '</g>';
        }

        /* camión (o, en la vista del supervisor, su propia posición) */
        if (st.camion) {
          var q = puntoEn(L);
          html += '<g class="nws-map__camion" style="transform:translate(' + q.x + 'px,' + q.y + 'px)">' +
            '<circle class="nws-map__halo" r="' + (24 * u) + '" fill="var(--naotech-theme-color-700)" opacity=".16"></circle>' +
            '<circle r="' + (14 * u) + '" fill="var(--naotech-theme-color-700)" stroke="var(--naotech-app-background)" stroke-width="' + (3 * u) + '"></circle>' +
            glifo(o.icono || 'vehicles', 0, 0, 13 * u, 'var(--naotech-theme-font-color)') +
            (o.yoLabel ? etiqueta(o.yoLabel, 24 * u, u) : '') + '</g>';
        }
      }
      svg.innerHTML = html;

      var ov = '', angosto = medir().W < ANGOSTO && !!(o.leyenda && o.leyenda.length);
      el.classList.toggle('nws-map--angosto', angosto);
      if (o.titulo) { ov += '<div class="nws-map__title nwt-smalltext-font-semibold">' + esc(o.titulo) + '</div>'; }
      if (o.escala !== false) { ov += escala(u, angosto && !o.titulo); }
      if (o.leyenda && o.leyenda.length) { ov += leyenda(o.leyenda); }
      if (o.veil) { ov += '<div class="nws-map__veil nwt-caption-font-semibold">' + esc(o.veil) + '</div>'; }
      overlay.innerHTML = ov;
    }

    function encuadrar(animar) {
      var m = medir();
      /* en cajas bajas (una card de 300px) el margen pedido se achica en
         proporción: 44px arriba y abajo de 300 dejarían la ruta en miniatura */
      var p = Math.min(st.pad, Math.round(Math.min(m.W, m.H) * 0.09));
      var pad = { l: p, r: p, t: p + st.extra.t, b: p + st.extra.b };
      var vb = encuadre(st.ruta ? bboxCon(st.ruta) : VACIO, m.W, m.H, pad, st.uMin);
      var antes = st.vb;
      st.vb = vb; st.u = vb.u;
      if (animar && antes && !quieto()) {
        var t0 = performance.now(), ms = parseFloat(token('--naotech-duration-slow', '320ms')) || 320;
        (function paso(now) {
          if (!st.vivo) { return; }
          var t = Math.min(1, (now - t0) / ms), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          svg.setAttribute('viewBox', [antes.x + (vb.x - antes.x) * e, antes.y + (vb.y - antes.y) * e, antes.w + (vb.w - antes.w) * e, antes.h + (vb.h - antes.h) * e].join(' '));
          if (t < 1) { requestAnimationFrame(paso); }
        })(t0);
      } else {
        svg.setAttribute('viewBox', [vb.x, vb.y, vb.w, vb.h].join(' '));
      }
    }

    /* Dos pasadas la primera vez: se dibuja, se mide cuánto ocupan leyenda y
       título, y si hace falta se vuelve a encuadrar dejando ese espacio. */
    function medirOverlay() {
      var lg = overlay.querySelector('.nws-map__legend'), sc = overlay.querySelector('.nws-map__scale'), ti = overlay.querySelector('.nws-map__title');
      var scArriba = sc && sc.classList.contains('nws-map__scale--arriba');
      var b = Math.max(lg ? lg.offsetHeight : 0, sc && !scArriba ? sc.offsetHeight : 0);
      var t = Math.max(ti ? ti.offsetHeight : 0, scArriba ? sc.offsetHeight : 0);
      return { t: t ? t + 10 : 0, b: b ? b + 10 : 0 };
    }
    function pintar(animarEncuadre) {
      encuadrar(animarEncuadre); dibujar();
      var ex = medirOverlay();
      if (ex.t !== st.extra.t || ex.b !== st.extra.b) { st.extra = ex; encuadrar(animarEncuadre); dibujar(); }
    }
    pintar(false);

    /* si el contenedor cambia de tamaño (modal que abre, ventana, teléfono
       que se escala), se re-encuadra; el dibujo se rehace solo si el zoom
       cambió de verdad, para no cortar una animación en curso por nada */
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () {
        if (!st.vivo) { return; }
        var uAntes = st.u;
        encuadrar(false);
        if (Math.abs(st.u - uAntes) / uAntes > 0.08) { cancelar(); dibujar(); }
      });
      ro.observe(el);
    }

    function cancelar() { st.anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* */ } }); st.anims = []; }

    /* Lleva el camión hasta la parada n (n = paradas+1 → de vuelta a la base).
       Devuelve una promesa que se cumple al llegar. */
    function animarA(n, ms) {
      if (!st.ruta || !st.camion) { return Promise.resolve(); }
      var R = st.ruta, N = R.paradas.length;
      var L0 = Lactual(), L1 = Lde(n);
      st.hechas = Math.min(n, N); st.enBase = n > N;
      var camion = svg.querySelector('.nws-map__camion'), hecho = svg.querySelector('.nws-map__hecho');
      if (!camion || !hecho || quieto() || !camion.animate || L1 <= L0) { dibujar(); return Promise.resolve(); }

      /* la parada a la que va deja de estar "siguiente" recién al llegar; lo
         que sí cambia ya es el resaltado, para que se lea hacia dónde va */
      cancelar();
      var dist = L1 - L0;
      var dur = ms || Math.max(700, Math.min(3600, dist * 14));
      var easing = token('--naotech-animation-standard', 'cubic-bezier(0.4, 0, 0.2, 1)');

      var frames = [{ transform: 'translate(' + puntoEn(L0).x + 'px,' + puntoEn(L0).y + 'px)', offset: 0 }];
      for (var i = 0; i < R.pts.length; i++) {
        if (R.L[i] > L0 && R.L[i] < L1) { frames.push({ transform: 'translate(' + R.pts[i].x + 'px,' + R.pts[i].y + 'px)', offset: (R.L[i] - L0) / dist }); }
      }
      frames.push({ transform: 'translate(' + puntoEn(L1).x + 'px,' + puntoEn(L1).y + 'px)', offset: 1 });
      var a1 = camion.animate(frames, { duration: dur, easing: easing, fill: 'forwards' });
      var a2 = hecho.animate([{ strokeDashoffset: String(R.total - L0) }, { strokeDashoffset: String(R.total - L1) }], { duration: dur, easing: easing, fill: 'forwards' });
      st.anims = [a1, a2];
      return new Promise(function (res) {
        var listo = false;
        function fin() { if (listo) { return; } listo = true; if (st.vivo) { dibujar(); marcar(); } res(); }
        a1.onfinish = fin; a1.oncancel = function () { if (!listo) { listo = true; res(); } };
      });
    }
    /* un latido al llegar a una parada: es el momento en que se marca */
    function marcar() {
      var halo = svg.querySelector('.nws-map__halo'); if (!halo) { return; }
      halo.classList.remove('nws-map__halo--marcando'); void halo.getBoundingClientRect(); halo.classList.add('nws-map__halo--marcando');
    }

    return {
      set: function (s) {
        s = s || {};
        var reencuadrar = false;
        if (s.ruta !== undefined) { st.ruta = s.ruta; reencuadrar = true; }
        if (s.hechas !== undefined) { st.hechas = s.hechas; }
        if (s.enBase !== undefined) { st.enBase = s.enBase; }
        if (s.adelante !== undefined) { st.adelante = s.adelante; }
        if (s.adelanteFin !== undefined) { st.adelanteFin = s.adelanteFin; }
        if (s.veil !== undefined) { o.veil = s.veil; }
        if (s.titulo !== undefined) { o.titulo = s.titulo; }
        cancelar();
        if (reencuadrar) { pintar(true); } else { dibujar(); }
      },
      animarA: animarA,
      marcar: marcar,
      estado: function () { return { hechas: st.hechas, enBase: st.enBase }; },
      destruir: function () { st.vivo = false; cancelar(); if (ro) { ro.disconnect(); } }
    };
  }

  return { DEFS: DEFS, rutas: RUTAS, crear: crear, path: path, rot: rot, glifo: glifo, leyenda: leyenda };
})();
