/**
 * Director: corre un guion sobre el prototipo real (se inyecta en el iframe de guion.html).
 * Portada del módulo → rol → entrada real al portal → misiones (tarjeta a pantalla completa + barra con los pasos).
 */
(function () {
  'use strict';

  var G = window.GUION, S = window.SDK, D = window.UAESP_DATOS;
  var cfg = Object.assign({ comp: 'admin', barra: true, subs: true, puntero: true, intro: true, pos: 'abajo' }, window.GUION_CFG || {});
  var comp = G.composicion(cfg.comp), guion = G.guionDe(comp);
  /* Spot: video de venta. Sin barra ni tarjetas de misión; titulares, cámara y cambio de rol visible. */
  var SPOT = guion.tipo === 'spot';
  if (SPOT) { cfg.barra = false; cfg.intro = true; guion.misiones = []; }
  var rol = D.roles.filter(function (r) { return r.id === comp.rol; })[0] || D.roles[0];
  var raiz = document.documentElement;
  var EASE = getComputedStyle(raiz).getPropertyValue('--naotech-animation-standard').trim() || 'cubic-bezier(0.4, 0, 0.2, 1)';
  var t0 = 0;
  var MIN = 3000; /* ningún momento del video dura menos que esto */

  function avisar(tipo, datos) { parent.postMessage(Object.assign({ guion: tipo, t: t0 ? performance.now() - t0 : 0 }, datos || {}), '*'); }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------- capa: puntero + barra ---------- */
  var capa = document.createElement('div');
  capa.className = 'nws-guion';
  capa.setAttribute('nwt-theme', rol.theme);
  capa.innerHTML =
    '<div class="nws-guion-puntero" aria-hidden="true"><svg viewBox="0 0 28 28" width="88" height="88">' +
      '<path transform="rotate(-30 14 2)" d="M14 2 L23 15 L16.6 14 L16.6 20.5 L11.4 20.5 L11.4 14 L5 15 Z"/></svg></div>' +
    '<div class="nws-guion-final"><div class="nws-guion-final__marca"><span class="nws-guion-final__logo">' + window.NAOWEE.logo + '</span>' +
      '<span class="nws-guion-final__eslogan">¡Listos para hacerlo bien!</span></div></div>' +
    '<div class="nws-guion-titular" aria-hidden="true"></div>' +
    '<div class="nws-guion-esquina" aria-hidden="true">' + window.NAOWEE.logo + '</div>' +
    '<div class="nws-guion-aro" aria-hidden="true"></div>' +
    '<div class="nws-guion-destacado" aria-hidden="true"></div>' +
    '<div class="nws-guion-barra">' +
      '<div class="nws-guion-barra__mision"><div class="nws-guion-barra__mision-in">' +
        '<span class="nws-guion-barra__num"></span><span class="nws-guion-barra__div"></span>' +
        '<span class="nws-guion-barra__titulo"></span>' +
      '</div></div>' +
      '<div class="nws-guion-barra__texto"><span class="nws-guion-barra__sub"></span></div>' +
      '<div class="nws-guion-barra__fin">' + viendoComo('nws-guion-viendo') + '</div>' +
      '<div class="nws-guion-barra__avance">' +
        guion.misiones.slice(1).map(function (m, k) { return '<i style="left:' + ((k + 1) / guion.misiones.length * 100) + '%"></i>'; }).join('') +
        '<b></b>' +
      '</div>' +
    '</div>' +
    '<div class="nws-guion-telon nws-guion-portada">' +
      '<div class="nws-guion-portada__escena nws-guion-portada__modulo">' +
        '<div class="nws-guion-portada__logos">' +
          '<span class="nws-guion-portada__naowee">' + window.NAOWEE.logo + '</span>' +
          '<span class="nws-guion-portada__div"></span>' +
          '<span class="nws-guion-portada__entidad"><img src="' + D.entidad.logo + '" alt=""><b>' + S.esc(D.entidad.sigla) + '</b></span>' +
        '</div>' +
        '<div class="nws-guion-portada__titulo">Módulo de Rutas</div>' +
        '<div class="nws-guion-portada__bajada">' + S.esc(D.entidad.nombre) + '<br>' + S.esc(D.entidad.gobierno) + '</div>' +
      '</div>' +
      '<div class="nws-guion-portada__escena nws-guion-portada__texto"></div>' +
      '<div class="nws-guion-portada__escena nws-guion-portada__presenta">' +
        '<div class="nws-guion-presenta__logo">' + window.NAOWEE.logo + '</div>' +
        '<div class="nws-guion-presenta__label">presenta</div>' +
        '<div class="nws-guion-presenta__bloque">' +
          '<span class="nws-guion-portada__entidad"><img src="' + D.entidad.logo + '" alt=""><b>' + S.esc(D.entidad.sigla) + '</b></span>' +
          '<div class="nws-guion-portada__titulo">Módulo de Rutas</div>' +
          '<div class="nws-guion-portada__bajada">' + S.esc(D.entidad.nombre) + ' · ' + S.esc(D.entidad.gobierno) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="nws-guion-portada__escena nws-guion-portada__rol">' + viendoComo('nws-guion-viendo nws-guion-viendo--portada') + '</div>' +
    '</div>' +
    '<div class="nws-guion-telon nws-guion-intro">' +
      '<div class="nws-guion-intro__caja">' +
        '<span class="nws-guion-intro__num"></span>' +
        '<div class="nws-guion-intro__titulo"></div>' +
        '<div class="nws-guion-intro__historia"></div>' +
        viendoComo('nws-guion-viendo nws-guion-viendo--grande') +
      '</div>' +
    '</div>';
  document.body.appendChild(capa);

  var puntero = capa.querySelector('.nws-guion-puntero');
  var barra = { caja: q('.nws-guion-barra__mision'), mision: q('.nws-guion-barra__mision-in'), num: q('.nws-guion-barra__num'), titulo: q('.nws-guion-barra__titulo'), sub: q('.nws-guion-barra__sub'), avance: q('.nws-guion-barra__avance') };
  var intro = { el: q('.nws-guion-intro'), num: q('.nws-guion-intro__num'), titulo: q('.nws-guion-intro__titulo'), historia: q('.nws-guion-intro__historia') };
  var portada = { el: q('.nws-guion-portada'), modulo: q('.nws-guion-portada__modulo'), rol: q('.nws-guion-portada__rol'), texto: q('.nws-guion-portada__texto'), presenta: q('.nws-guion-portada__presenta') };
  function q(sel) { return capa.querySelector(sel); }
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function viendoComo(cls) {
    return '<div class="' + cls + '"><span class="nws-guion-viendo__pill">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>Viendo como</span>' +
      '<span class="nws-guion-viendo__rol">' + S.esc(rol.rol) + '</span></div>';
  }

  function aplicarCfg() {
    raiz.classList.toggle('nws-guion--barra', !!cfg.barra);
    raiz.classList.toggle('nws-guion--sin-subs', !cfg.subs);
    raiz.classList.toggle('nws-guion--sin-puntero', !cfg.puntero);
    raiz.classList.toggle('nws-guion--arriba', cfg.pos === 'arriba');
    window.dispatchEvent(new Event('resize'));
  }
  aplicarCfg();
  raiz.classList.add('nws-guion--app-llena', 'nws-guion--barra-fuera', 'nws-guion--puntero-oculto');
  if (SPOT) { raiz.classList.add('nws-guion--spot'); }
  if (cfg.intro) { portada.el.classList.add('is-visible', 'is-previa'); }

  /* ---------- pausa (entre pasos) ---------- */
  var pausado = false, reanudar = null;
  function puerta() { return pausado ? new Promise(function (r) { reanudar = r; }) : Promise.resolve(); }
  window.addEventListener('message', function (ev) {
    var m = ev.data || {};
    if (m.guion === 'cfg') { Object.assign(cfg, m.cfg); aplicarCfg(); }
    if (m.guion === 'pausa') { pausado = !!m.valor; if (!pausado && reanudar) { reanudar(); reanudar = null; } avisar('estado', { pausado: pausado }); }
  });

  /* ---------- puntero ---------- */
  var pos = { x: innerWidth * 0.62, y: innerHeight * 0.55 };
  function tr(p) { return 'translate(' + p.x + 'px,' + p.y + 'px)'; }
  puntero.style.transform = tr(pos);

  var rapido = false; /* el tramo que sale del texto del paso también va rápido */
  function mover(p, ms) {
    var dist = Math.hypot(p.x - pos.x, p.y - pos.y);
    var dur = ms || (rapido ? Math.min(520, Math.max(300, 220 + dist * 0.22)) : Math.min(1100, Math.max(420, 320 + dist * 0.5)));
    rapido = false;
    var a = puntero.animate([{ transform: tr(pos) }, { transform: tr(p) }], { duration: dur, easing: EASE, fill: 'forwards' });
    pos = p;
    return a.finished.then(function () { puntero.style.transform = tr(p); a.cancel(); });
  }

  /* Clic: la flecha baja de escala sobre su punta y vuelve, rápido (80 ms abajo, 140 ms de regreso).
     Se escala el svg, no el contenedor: el contenedor lleva la posición y escalarlo la arrastraría. */
  function pulsar() {
    return puntero.firstChild.animate([
      { scale: 1, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
      { scale: 0.72, offset: 0.36, easing: 'cubic-bezier(0, 0, 0.2, 1)' },
      { scale: 1 }
    ], { duration: 220 }).finished;
  }

  /* ---------- objetivos ---------- */
  function visible(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  function buscar(sel, n, ms) {
    var hasta = performance.now() + (ms || 8000);
    return new Promise(function (ok, mal) {
      (function mirar() {
        var els = [].filter.call(document.querySelectorAll(sel), visible);
        if (els[n || 0]) { return ok(els[n || 0]); }
        if (performance.now() > hasta) { return mal(new Error('No encontré ' + sel)); }
        requestAnimationFrame(mirar);
      })();
    });
  }
  function centro(el) {
    var r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }
  /* Deja constancia (para grabar.mjs y el escenario) de si la punta cayó dentro del objetivo. */
  function acertar(el) {
    capa.style.display = 'none';
    var bajo = document.elementFromPoint(pos.x, pos.y);
    capa.style.display = '';
    avisar('clic', { ok: !!bajo && (el === bajo || el.contains(bajo)), x: pos.x, y: pos.y });
  }
  /* Si el objetivo se movió mientras el puntero viajaba (modal entrando, repintado), se corrige antes del clic. */
  function apuntar(sel, n) {
    return buscar(sel, n).then(function (el) {
      return alcanzar(el).then(function () { return mover(centro(el)); })
        .then(function () { return esperar(60); })
        .then(function () { return buscar(sel, n); })
        .then(function (el2) { var c = centro(el2); return Math.hypot(c.x - pos.x, c.y - pos.y) > 2 ? mover(c).then(function () { return el2; }) : el2; });
    });
  }
  /* Antes de apuntar: si el BLOQUE que contiene al objetivo (card, mapa, lista) está cortado, la página
     se desplaza suave hasta mostrarlo entero. Es un movimiento de cámara, no un paso del guion. */
  var BLOQUE = '.nwt-card, .nws-map, .nws-stats, .nws-tabla';
  function contenedorScroll(el) {
    for (var n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.scrollHeight > n.clientHeight + 4) { return n; }
    }
    return null;
  }
  function alcanzar(el) {
    var sc = contenedorScroll(el);
    if (!sc) { return Promise.resolve(); }
    var rc = sc.getBoundingClientRect(), barra = cfg.barra ? 120 : 0;
    var arriba = Math.max(rc.top, cfg.pos === 'arriba' ? barra : 0), abajo = Math.min(rc.bottom, innerHeight - (cfg.pos === 'arriba' ? 0 : barra));
    var b = (el.closest(BLOQUE) || el).getBoundingClientRect(), t = el.getBoundingClientRect(), aire = 16, d = 0;
    if (b.height <= abajo - arriba - 2 * aire) {
      if (b.bottom > abajo - aire) { d = b.bottom - (abajo - aire); } else if (b.top < arriba + aire) { d = b.top - (arriba + aire); }
    } else {
      d = b.top - (arriba + aire);
      if (t.bottom - d > abajo - aire) { d = t.bottom - (abajo - aire); }
    }
    var desde = sc.scrollTop, hasta = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, desde + d / cam.z));
    if (Math.abs(hasta - desde) < 2) { return Promise.resolve(); }
    var dur = Math.min(1400, Math.max(700, Math.abs(hasta - desde) * 2.4)), ini = performance.now();
    return new Promise(function (ok) {
      (function cuadro(ahora) {
        var k = Math.min(1, (ahora - ini) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        sc.scrollTop = desde + (hasta - desde) * e;
        if (k < 1) { requestAnimationFrame(cuadro); } else { esperar(150).then(ok); }
      })(ini);
    });
  }

  /* ---------- barra ---------- */
  var subDesde = 0, subLectura = 0;
  function lectura(txt) { return Math.min(4200, Math.max(1500, txt.split(/\s+/).length * 300)); }
  function subtitular(txt) {
    var falta = subLectura - (performance.now() - subDesde);
    return esperar(Math.max(0, falta)).then(function () {
      var el = barra.sub;
      return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).finished.then(function () {
        el.innerHTML = '<span class="nws-guion-barra__sub-base"></span><span class="nws-guion-barra__sub-lleno" aria-hidden="true"></span>';
        el.firstChild.textContent = el.lastChild.textContent = txt;
        el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE, fill: 'forwards' });
        subDesde = performance.now(); subLectura = lectura(txt);
        avisar('sub', { texto: txt });
      });
    });
  }
  /* Durante el karaoke el puntero se para a la derecha del texto del paso, apuntándolo; llega y se va rápido. */
  function senalarPaso() {
    var base = barra.sub.firstChild;
    if (!base || !cfg.barra || !cfg.subs || !cfg.puntero) { return Promise.resolve(); }
    var r = base.getBoundingClientRect();
    puntero.classList.add('is-lector');
    var d = Math.hypot(r.right + 14 - pos.x, r.top + r.height / 2 - pos.y);
    return mover({ x: Math.round(r.right + 14), y: Math.round(r.top + r.height / 2) }, Math.min(480, Math.max(260, 200 + d * 0.2)));
  }
  function dejarDeLeer() { puntero.classList.remove('is-lector'); rapido = true; return esperar(150); }

  /* Karaoke: el texto del paso se llena de izquierda a derecha, pasa a blanco y recién ahí arranca la acción. */
  function karaoke(txt) {
    var base = barra.sub.firstChild, lleno = barra.sub.lastChild;
    if (!lleno || !cfg.subs || !cfg.barra) { return esperar(600); }
    var dur = Math.min(3200, Math.max(1400, txt.length * 38));
    return lleno.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: dur, easing: 'cubic-bezier(0.3, 0, 0.7, 1)', fill: 'forwards' }).finished
      .then(function () {
        base.animate([{ color: getComputedStyle(base).color }, { color: '#fff' }], { duration: 320, easing: EASE, fill: 'forwards' });
        return lleno.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: EASE, fill: 'forwards' }).finished;
      });
  }

  function progreso(i, frac) {
    barra.avance.style.setProperty('--avance', ((i + frac) / guion.misiones.length * 100).toFixed(2) + '%');
  }

  /* ---------- pasos ---------- */
  function paso(p) {
    var cadena = puerta();
    var sel = p.clic || p.mover || (p.escribir && p.escribir[0]);
    if (p.sub) { cadena = cadena.then(function () { return subtitular(p.sub); }).then(senalarPaso).then(function () { return karaoke(p.sub); }).then(dejarDeLeer); }
    if (p.esperar) { cadena = cadena.then(function () { return typeof p.esperar === 'number' ? esperar(p.esperar) : buscar(p.esperar, 0, 12000); }); }
    if (sel) { cadena = cadena.then(function () { return apuntar(sel, p.n); }); }
    if (p.clic) {
      cadena = cadena.then(function (el) { return esperar(120).then(function () { return pulsar(pos); }).then(function () { acertar(el); el.click(); }); });
    }
    if (p.escribir) {
      cadena = cadena.then(function () { return escribir(p.escribir[0], p.escribir[1]); });
    }
    return cadena.then(function () { return esperar(Math.max(MIN, p.pausa || 0)); });
  }

  /* La pantalla puede repintar el input en cada tecla: se vuelve a buscar cada vez. */
  function escribir(sel, texto) {
    var i = 0;
    return (function tecla() {
      if (i >= texto.length) { return Promise.resolve(); }
      return buscar(sel).then(function (el) {
        el.focus(); el.value = texto.slice(0, ++i);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return esperar(70).then(tecla);
      });
    })();
  }

  /* ---------- telones ---------- */
  function entrarPiezas(cont, sel, desde) {
    [].forEach.call(cont.querySelectorAll(sel), function (el, k) {
      el.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: (desde || 0) + k * 140, easing: EASE, fill: 'backwards' });
    });
  }
  function fundir(el, de, a, ms) { return el.animate([{ opacity: de }, { opacity: a }], { duration: ms, easing: EASE, fill: 'forwards' }).finished; }

  /* Portada (3,6 s) → "Viendo como" (2,4 s) → se abre sobre el selector de perfil. */
  function mostrarPortada() {
    avisar('sub', { texto: 'Módulo de Rutas · ' + D.entidad.sigla });
    entrarPiezas(portada.modulo, '.nws-guion-portada__logos, .nws-guion-portada__titulo, .nws-guion-portada__bajada', 250);
    portada.el.classList.remove('is-previa');
    return esperar(Math.max(MIN, 3600)).then(puerta)
      .then(function () { return fundir(portada.modulo, 1, 0, 450); })
      .then(function () {
        avisar('sub', { texto: 'Viendo como ' + rol.rol });
        portada.rol.style.opacity = 1;
        entrarPiezas(portada.rol, '.nws-guion-viendo__pill, .nws-guion-viendo__rol', 0);
        return esperar(MIN);
      }).then(puerta)
      .then(function () { return fundir(portada.el, 1, 0, 700); })
      .then(function () { portada.el.classList.remove('is-visible'); });
  }

  /* Entrada real: el puntero aparece, elige el perfil y se deja cargar el portal. Sin barra todavía. */
  function preludio() {
    var P = guion.preludio || {};
    var sel = P.entrar || '[data-rol="' + comp.rol + '"]';
    return (cfg.intro ? mostrarPortada() : Promise.resolve())
      .then(function () { return buscar(sel, 0, 12000); })
      .then(function () { return esperar(MIN); })
      .then(function () { raiz.classList.remove('nws-guion--puntero-oculto'); return esperar(600); })
      .then(function () { return buscar(sel); })
      .then(function () { return apuntar(sel); })
      .then(function (el) { return esperar(350).then(function () { return pulsar(pos); }).then(function () { acertar(el); el.click(); }); })
      .then(function () { return typeof P.esperar === 'string' ? buscar(P.esperar, 0, 12000) : esperar(P.esperar || 800); })
      .then(cargado)
      .then(function () { return esperar(MIN); });
  }

  var SILUETAS = '.nws-skel, [class*="--skeleton"], [class*="__skeleton"]';
  function cargado() {
    var hasta = performance.now() + 10000;
    return new Promise(function (ok) {
      (function mirar() {
        var quedan = [].some.call(document.querySelectorAll(SILUETAS), visible);
        if (!quedan || performance.now() > hasta) { return ok(); }
        requestAnimationFrame(mirar);
      })();
    });
  }

  /* La primera misión trae la barra: con la tarjeta opaca la app cede su alto, y la barra sube al irse la tarjeta. */
  function traerBarra(cubierta) {
    if (!raiz.classList.contains('nws-guion--barra-fuera')) { return; }
    if (cubierta) { raiz.classList.remove('nws-guion--app-llena'); window.dispatchEvent(new Event('resize')); return; }
    raiz.classList.remove('nws-guion--app-llena', 'nws-guion--barra-fuera');
    window.dispatchEvent(new Event('resize'));
  }

  /* ---------- misión: tarjeta a pantalla completa + cambio animado en la barra ---------- */
  function presentar(m, i) {
    intro.num.textContent = dos(i + 1);
    intro.titulo.textContent = m.titulo;
    intro.historia.textContent = m.historia;
    intro.el.classList.add('is-visible');
    avisar('sub', { texto: 'Misión ' + (i + 1) + ' · ' + m.titulo + ' — ' + m.historia });
    subLectura = 0;
    var piezas = intro.el.querySelectorAll('.nws-guion-intro__num, .nws-guion-intro__titulo, .nws-guion-intro__historia, .nws-guion-viendo--grande');
    /* Con la tarjeta ya opaca se cambia la misión de la barra: el cambio nunca se ve. */
    intro.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: EASE, fill: 'forwards' }).finished.then(function () { ponerMision(m, i); traerBarra(true); });
    [].forEach.call(piezas, function (el, k) {
      el.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 620, delay: 150 + k * 110, easing: EASE, fill: 'backwards' });
    });
    var sostener = Math.max(3400, m.historia.split(/\s+/).length * 260 + 1400);
    return esperar(sostener).then(puerta).then(function () {
      traerBarra(false);
      return intro.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: EASE, fill: 'forwards' }).finished;
    }).then(function () { intro.el.classList.remove('is-visible'); });
  }

  /* La caja se mide antes de que el texto se parta: se ajusta al renglón más ancho para no dejar aire. */
  function ajustarTitulo() {
    var t = barra.titulo, r = document.createRange();
    t.style.width = '';
    r.selectNodeContents(t);
    var anchos = [].map.call(r.getClientRects(), function (x) { return x.width; });
    if (anchos.length) { t.style.width = Math.ceil(Math.max.apply(null, anchos)) + 'px'; }
  }

  function ponerMision(m, i) {
    barra.num.textContent = dos(i + 1);
    barra.titulo.textContent = m.titulo;
    ajustarTitulo();
  }

  function cambiarMision(m, i) {
    var el = barra.mision, primera = !barra.titulo.textContent;
    var salir = primera ? Promise.resolve() : el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-110%)', opacity: 0 }], { duration: 280, easing: EASE, fill: 'forwards' }).finished;
    return salir.then(function () {
      barra.num.textContent = dos(i + 1);
      barra.titulo.textContent = m.titulo;
      ajustarTitulo();
      el.animate([{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 460, easing: EASE, fill: 'forwards' });
      barra.caja.animate([{ scale: 1 }, { scale: 1.04 }, { scale: 1 }], { duration: 520, easing: EASE });
    });
  }

  function mision(m, i) {
    avisar('mision', { i: i, titulo: m.titulo, historia: m.historia });
    var entrar = cfg.intro
      ? presentar(m, i).then(function () { return esperar(400); })
      : cambiarMision(m, i).then(function () { traerBarra(false); return esperar(MIN); });
    return entrar.then(function () { return m.pasos.reduce(function (c, p, k) {
      return c.then(function () { progreso(i, k / m.pasos.length); avisar('paso', { mision: i, paso: k }); return paso(p); });
    }, Promise.resolve()); }).then(function () { progreso(i, 1); });
  }

  /* Cierre: todo se funde al color de Naowee y se sostiene. */
  function cierre() {
    var f = q('.nws-guion-final');
    raiz.classList.add('nws-guion--puntero-oculto');
    f.classList.add('is-visible');
    return fundir(f, 0, 1, 1400).then(function () { return esperar(MIN); });
  }

  function correr() {
    t0 = performance.now();
    avisar('inicio', { comp: comp.id });
    return guion.misiones.reduce(function (c, m, i) { return c.then(function () { return mision(m, i); }); }, preludio())
      .then(function () { return esperar(Math.max(1200, subLectura - (performance.now() - subDesde))); })
      .then(cierre)
      .then(function () { avisar('fin'); })
      .catch(function (err) { barra.sub.textContent = '⚠ ' + err.message; avisar('error', { mensaje: err.message }); });
  }

  /* ================= spot ================= */
  var cam = { z: 1, x: 0, y: 0 }, appEl = document.getElementById('app');
  appEl.style.transformOrigin = '0 0';

  /* Cámara: zoom y paneo sobre la app; el puntero viaja con el contenido, como en una grabación con zoom. */
  function ir(z, x, y, ms) {
    var de = 'translate(' + cam.x + 'px,' + cam.y + 'px) scale(' + cam.z + ')', a = 'translate(' + x + 'px,' + y + 'px) scale(' + z + ')';
    var p = { x: Math.round((pos.x - cam.x) / cam.z * z + x), y: Math.round((pos.y - cam.y) / cam.z * z + y) };
    cam = { z: z, x: x, y: y };
    var an = appEl.animate([{ transform: de }, { transform: a }], { duration: ms, easing: EASE, fill: 'forwards' });
    return Promise.all([an.finished.then(function () { appEl.style.transform = a; an.cancel(); }), mover(p, ms)]);
  }
  var movil = null;
  /* Con texto en pantalla el teléfono se corre a la derecha; sin texto vuelve al centro. */
  function reencuadrar() { return movil ? camara({ foco: movil.foco, n: movil.n, zoom: movil.zoom, en: true, ms: 900 }) : Promise.resolve(); }
  function camara(c) {
    var W = innerWidth, H = innerHeight;
    if (c === 'reset') { movil = null; q('.nws-guion-esquina').classList.remove('is-visible'); return cam.z === 1 && !cam.x && !cam.y ? Promise.resolve() : ir(1, 0, 0, 1100).then(function () { document.body.style.background = ''; }); }
    /* `en`: fracción del ancho donde queda el foco (0,66 = a la derecha, texto a la izquierda). Fuera de
       los bordes se ve el fondo del escenario, así que el body toma ese color. */
    return buscar(c.foco, c.n).then(function (el) {
      var r = el.getBoundingClientRect(), z = c.zoom || 1.6, fx = c.en ? (titular.classList.contains('is-visible') || destacado.classList.contains('is-visible') ? 0.66 : 0.5) : 0.5;
      movil = c.en ? { foco: c.foco, n: c.n, zoom: z } : null;
      q('.nws-guion-esquina').classList.toggle('is-visible', !!movil);
      var cx = (r.left + r.width / 2 - cam.x) / cam.z, cy = (r.top + r.height / 2 - cam.y) / cam.z;
      var x = W * fx - z * cx, y = Math.min(0, Math.max(H - z * H, H / 2 - z * cy));
      if (c.en) { document.body.style.background = fondoDe(el); } else { x = Math.min(0, Math.max(W - z * W, x)); }
      return ir(z, Math.round(x), Math.round(y), c.ms || 1300);
    });
  }

  function fondoDe(el) {
    for (var n = el; n && n !== document.documentElement; n = n.parentElement) {
      var b = getComputedStyle(n).backgroundColor;
      if (b && b !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(b)) { return b; }
    }
    return '';
  }

  /* Scroll visible: el puntero se para sobre la lista y esta baja (o sube) suave, como con la rueda. */
  function desplazar(sel, px) {
    return buscar(sel).then(function (el) {
      var sc = /(auto|scroll)/.test(getComputedStyle(el).overflowY) ? el : contenedorScroll(el);
      if (!sc) { return; }
      var r = el.getBoundingClientRect();
      return mover({ x: Math.round(r.left + r.width * 0.6), y: Math.round(r.top + Math.min(r.height, innerHeight - r.top) * 0.45) }).then(function () {
        var desde = sc.scrollTop, hasta = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, desde + px)), dur = Math.min(1500, Math.max(800, Math.abs(hasta - desde) * 3)), ini = performance.now();
        return new Promise(function (ok) {
          (function cuadro(ahora) {
            var k = Math.min(1, (ahora - ini) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
            sc.scrollTop = desde + (hasta - desde) * e;
            if (k < 1) { requestAnimationFrame(cuadro); } else { ok(); }
          })(ini);
        });
      });
    });
  }

  /* Titular: pocas palabras grandes que entran de a una. `lado`: 'abajo' (sobre la UI) o 'izq' (junto al teléfono). */
  var titular = q('.nws-guion-titular');
  function titulo(txt, lado) {
    if (!txt) { return Promise.resolve(); }
    titular.className = 'nws-guion-titular is-visible nws-guion-titular--' + (lado || 'abajo');
    if (lado === 'izq') { reencuadrar(); }
    titular.innerHTML = '<p>' + txt.split(' ').map(function (w) { return '<span>' + S.esc(w) + '</span>'; }).join(' ') + '</p>';
    avisar('sub', { texto: txt });
    fundir(titular, 0, 1, 450);
    /* Entra con un fundido; karaoke palabra por palabra de gris claro a blanco, y se oculta hasta el próximo. */
    var ws = titular.querySelectorAll('span'), n = ws.length, k0 = 750, fin = k0 + n * 150 + 250, tok = ++tituloTok;
    titular.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: EASE, fill: 'backwards' });
    [].forEach.call(ws, function (w, k) {
      w.animate([{ color: GRIS }, { color: '#fff' }], { duration: 240, delay: k0 + k * 150, easing: EASE, fill: 'both' });
    });
    setTimeout(function () { if (tok === tituloTok) { sinTitulo(); } }, fin + 1100);
    return esperar(400);
  }
  /* Destacado: una tarjeta que resalta sobre la UI (no un paso más), con un aro sobre lo que explica. */
  var destacado = q('.nws-guion-destacado'), aro = q('.nws-guion-aro');
  function mostrarDestacado(d) {
    destacado.innerHTML =
      '<div class="nws-guion-destacado__sobre"><i></i>' + S.esc(d.sobre) + '</div>' +
      '<div class="nws-guion-destacado__titulo">' + S.esc(d.titulo) + '</div>' +
      '<ul>' + d.filas.map(function (f) { return '<li>' + S.icon(f[0]) + '<span>' + S.esc(f[1]) + '</span></li>'; }).join('') + '</ul>';
    destacado.classList.add('is-visible');
    avisar('sub', { texto: d.titulo + ' — ' + d.filas.map(function (f) { return f[1]; }).join(' · ') });
    return reencuadrar().then(function () {
      if (d.aro) {
        var rs = [].map.call(document.querySelectorAll(d.aro), function (el) { return el.getBoundingClientRect(); });
        if (rs.length) {
          var x0 = Math.min.apply(null, rs.map(function (r) { return r.left; })), y0 = Math.min.apply(null, rs.map(function (r) { return r.top; }));
          var x1 = Math.max.apply(null, rs.map(function (r) { return r.right; })), y1 = Math.max.apply(null, rs.map(function (r) { return r.bottom; }));
          aro.style.cssText = 'left:' + (x0 - 10) + 'px;top:' + (y0 - 10) + 'px;width:' + (x1 - x0 + 20) + 'px;height:' + (y1 - y0 + 20) + 'px';
          aro.classList.add('is-visible');
          aro.animate([{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: EASE, fill: 'both' });
        }
      }
      destacado.animate([{ opacity: 0, transform: 'translateY(-50%) translateX(-24px) scale(.97)' }, { opacity: 1, transform: 'translateY(-50%)' }], { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' });
      [].forEach.call(destacado.querySelectorAll('li'), function (li, k) {
        li.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 450 + k * 160, easing: EASE, fill: 'backwards' });
      });
    });
  }
  function sinDestacado() {
    if (!destacado.classList.contains('is-visible')) { return Promise.resolve(); }
    aro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    return destacado.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: EASE, fill: 'forwards' }).finished.then(function () {
      destacado.classList.remove('is-visible'); aro.classList.remove('is-visible');
      destacado.getAnimations().forEach(function (a) { a.cancel(); }); aro.getAnimations().forEach(function (a) { a.cancel(); });
    });
  }

  var SALIENDO = false, tituloTok = 0, GRIS = getComputedStyle(raiz).getPropertyValue('--naotech-color-gray-300').trim() || '#d0d3e6';
  /* Cuando el puntero empieza a actuar, el velo baja para que la UI se lea. */
  function aclarar() { titular.classList.add('is-leve'); }
  function sinTitulo() {
    tituloTok++;
    if (!titular.classList.contains('is-visible')) { return Promise.resolve(); }
    var p = titular.firstChild;
    if (p) { p.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-24px)' }], { duration: 320, easing: EASE, fill: 'forwards' }); }
    return fundir(titular, 1, 0, 360).then(function () { titular.classList.remove('is-visible', 'is-leve'); if (!SALIENDO) { reencuadrar(); } });
  }

  function escenaPortada(cual) {
    ['modulo', 'rol', 'texto', 'presenta'].forEach(function (k) { portada[k].style.opacity = k === cual ? 1 : 0; });
  }
  function cubrir() {
    if (portada.el.classList.contains('is-visible') && getComputedStyle(portada.el).opacity === '1') { return Promise.resolve(); }
    portada.el.classList.add('is-visible');
    return fundir(portada.el, 0, 1, 380);
  }
  function descubrir() { return fundir(portada.el, 1, 0, 650).then(function () { portada.el.classList.remove('is-visible'); }); }

  /* Telón de texto (gancho): líneas grandes sobre fondo oscuro. */
  function spotTelon(lineas) {
    return cubrir().then(function () {
      portada.el.classList.remove('is-previa');
      portada.texto.innerHTML = lineas.map(function (l) { return '<div class="nws-guion-portada__linea">' + S.esc(l) + '</div>'; }).join('');
      escenaPortada('texto');
      avisar('sub', { texto: lineas.join(' ') });
      entrarPiezas(portada.texto, '.nws-guion-portada__linea', 200);
    });
  }
  /* Marca: Naowee solo → "presenta" → el logo se achica y sube → entran UAESP y el módulo. */
  function spotMarca() {
    var logo = q('.nws-guion-presenta__logo'), label = q('.nws-guion-presenta__label'), bloque = q('.nws-guion-presenta__bloque');
    return cubrir().then(function () {
      portada.el.classList.remove('is-previa');
      label.style.opacity = 0; bloque.style.opacity = 0;
      return fundir(portada.texto, 1, 0, 400);
    }).then(function () {
      escenaPortada('presenta');
      avisar('sub', { texto: 'Naowee presenta · Módulo de Rutas · ' + D.entidad.sigla });
      return logo.animate([{ opacity: 0, transform: 'translate(-50%,-50%) scale(.94)' }, { opacity: 1, transform: 'translate(-50%,-50%)' }], { duration: 800, easing: EASE, fill: 'forwards' }).finished;
    }).then(function () { return esperar(450); })
      .then(function () { return label.animate([{ opacity: 0, transform: 'translate(-50%, 12px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 500, easing: EASE, fill: 'forwards' }).finished; })
      .then(function () { return esperar(1000); })
      .then(function () { return label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: EASE, fill: 'forwards' }).finished; })
      .then(function () {
        logo.animate([{ transform: 'translate(-50%,-50%)' }, { transform: 'translate(-50%, calc(-50% - 270px)) scale(.56)' }], { duration: 900, easing: EASE, fill: 'forwards' });
        bloque.style.opacity = 1;
        entrarPiezas(bloque, '.nws-guion-portada__entidad, .nws-guion-portada__titulo, .nws-guion-portada__bajada', 380);
        return esperar(900);
      });
  }

  /* Entrada o cambio de rol, a la vista: (Cambiar de perfil) → "Viendo como" → selector → clic → la pantalla se presenta. */
  var enSesion = false;
  function spotRol(id, presenta) {
    var r = D.roles.filter(function (x) { return x.id === id; })[0];
    var salir = enSesion
      ? camara('reset').then(function () { return apuntar('[data-logout]'); })
          .then(function (el) { return esperar(250).then(pulsar).then(function () { acertar(el); el.click(); }); })
          .then(function () { return buscar('[data-rol="' + id + '"]', 0, 12000); }).then(function () { return esperar(700); })
      : fundir(portada.presenta, 1, 0, 400);
    return salir.then(function () {
        portada.rol.querySelector('.nws-guion-viendo__rol').textContent = r.rol;
        escenaPortada('rol');
        avisar('sub', { texto: 'Viendo como ' + r.rol });
        entrarPiezas(portada.rol, '.nws-guion-viendo__pill, .nws-guion-viendo__rol', 100);
        return Promise.all([cubrir(), esperar(MIN)]);
      })
      .then(function () { return buscar('[data-rol="' + id + '"]', 0, 12000); })
      .then(descubrir)
      .then(function () { raiz.classList.remove('nws-guion--puntero-oculto'); return esperar(600); })
      .then(function () { return apuntar('[data-rol="' + id + '"]'); })
      .then(function (el) { return esperar(300).then(pulsar).then(function () { acertar(el); el.click(); }); })
      .then(function () { enSesion = true; return finZoomLogin(); })
      .then(cargado)
      .then(function () { return esperar(400); })
      .then(function () { return presentarPantalla(presenta || r.portal); });
  }

  /* La card elegida crece en rojo hasta tapar todo (login.js, .nws-zoom): se espera a que se vaya. */
  function finZoomLogin() {
    var hasta = performance.now() + 4000, vio = false;
    return new Promise(function (ok) {
      (function mirar() {
        var z = document.querySelector('.nws-zoom');
        if (z) { vio = true; }
        if ((vio && !z) || performance.now() > hasta || (!vio && performance.now() > hasta - 3200)) { return ok(); }
        requestAnimationFrame(mirar);
      })();
    });
  }

  /* Capa de presentación: la pantalla entra enmarcada y chica, con su nombre arriba, y después llena el cuadro. */
  function presentarPantalla(texto) {
    var W = innerWidth, H = innerHeight, z = 0.76;
    raiz.classList.add('nws-guion--marco');
    /* Nada pendiente de titulares anteriores, y el nombre invisible desde el primer cuadro: sin parpadeo. */
    tituloTok++;
    titular.getAnimations().forEach(function (an) { an.cancel(); });
    titular.innerHTML = '<p>' + S.esc(texto) + '</p>';
    titular.className = 'nws-guion-titular is-visible nws-guion-titular--marco';
    var entra = titular.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 800, easing: EASE, fill: 'both' });
    avisar('sub', { texto: texto });
    return ir(z, Math.round(W * (1 - z) / 2), Math.round(H * (1 - z) / 2 + 30), 800)
      .then(function () { return entra.finished; })
      .then(function () { return esperar(1800); })
      .then(function () { return titular.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: EASE, fill: 'forwards' }).finished; })
      .then(function () { titular.classList.remove('is-visible'); titular.getAnimations().forEach(function (an) { an.cancel(); }); return ir(1, 0, 0, 1100); })
      .then(function () { raiz.classList.remove('nws-guion--marco'); });
  }

  function pasoSpot(p) {
    var c = puerta(), sel = p.clic || p.mover || (p.escribir && p.escribir[0]);
    if (sel || p.desplazar) { c = c.then(aclarar); }
    if (p.camara) { c = c.then(function () { return camara(p.camara); }); }
    if (p.esperar) { c = c.then(function () { return typeof p.esperar === 'number' ? esperar(p.esperar) : buscar(p.esperar, 0, 12000); }); }
    if (sel) { c = c.then(function () { return apuntar(sel, p.n); }); }
    if (p.clic) { c = c.then(function (el) { return esperar(160).then(pulsar).then(function () { acertar(el); el.click(); }); }); }
    if (p.escribir) { c = c.then(function () { return escribir(p.escribir[0], p.escribir[1]); }); }
    if (p.desplazar) { c = c.then(function () { return desplazar(p.desplazar, p.px || 240); }); }
    return c.then(function () { return esperar(p.pausa != null ? p.pausa : 700); });
  }

  /* Cada escena tiene su duración: se completa con espera si la acción terminó antes. */
  function escena(e, i) {
    var ini = performance.now(), hacer;
    if (e.telon) { hacer = spotTelon(e.telon); }
    else if (e.marca) { hacer = spotMarca(); }
    else if (e.rol) { hacer = sinTitulo().then(function () { return spotRol(e.rol, e.presenta); }); }
    else if (e.cierre) { hacer = sinTitulo().then(function () { raiz.classList.add('nws-guion--puntero-oculto'); q('.nws-guion-esquina').classList.remove('is-visible'); var f = q('.nws-guion-final'); f.classList.add('is-visible', 'is-spot');
      fundir(f, 0, 1, 900); q('.nws-guion-final__logo').animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 1100, delay: 450, easing: EASE, fill: 'backwards' });
      q('.nws-guion-final__eslogan').animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 1500, easing: EASE, fill: 'backwards' });
      avisar('sub', { texto: '¡Listos para hacerlo bien!' }); }); }
    else if (e.destacado) {
      hacer = sinTitulo().then(function () { return (e.pasos || []).reduce(function (c, p) { return c.then(function () { return pasoSpot(p); }); }, Promise.resolve()); })
        .then(function () { return mostrarDestacado(e.destacado); });
    }
    else {
      /* Entre dos titulares seguidos el teléfono no vuelve al centro: el nuevo texto ya lo corre. */
      SALIENDO = true;
      hacer = (titular.textContent === e.titular ? Promise.resolve() : sinTitulo().then(function () { SALIENDO = false; return titulo(e.titular, e.lado); }))
        .then(function () { return (e.pasos || []).reduce(function (c, p) { return c.then(function () { return pasoSpot(p); }); }, Promise.resolve()); });
    }
    return hacer.then(function () {
      var real = performance.now() - ini;
      if (e.destacado) { return esperar(Math.max(0, (e.dur || MIN) - real)).then(sinDestacado).then(function () { avisar('escena', { i: i, dur: e.dur || 0, real: Math.round(real) }); }); }
      avisar('escena', { i: i, dur: e.dur || 0, real: Math.round(real) });
      return esperar(Math.max(0, (e.dur || MIN) - real));
    });
  }

  function correrSpot() {
    t0 = performance.now();
    avisar('inicio', { comp: comp.id });
    return guion.escenas.reduce(function (c, e, i) { return c.then(function () { return escena(e, i); }); }, Promise.resolve())
      .then(function () { avisar('fin'); })
      .catch(function (err) { avisar('error', { mensaje: err.message }); });
  }

  if (!SPOT) { progreso(0, 0); } else { escenaPortada('texto'); }
  avisar('listo', { comp: comp.id, misiones: SPOT ? guion.escenas.length : guion.misiones.length });
  esperar(cfg.demora != null ? cfg.demora : 600).then(SPOT ? correrSpot : correr);
})();
