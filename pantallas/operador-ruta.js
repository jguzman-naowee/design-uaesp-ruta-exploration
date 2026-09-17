/**
 * Operador · detalle de ruta en vivo.
 * El camión recorre el trazo solo (mapa.js → animarA): viaja hasta la
 * siguiente unidad, se detiene a marcarla y sigue. Al terminar la última
 * vuelve a la base por el retorno y queda ahí; el botón de reinicio arranca
 * de nuevo desde el patio.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['operador-ruta'] = {
  menu: 'recibidas',
  titulo: 'Detalle de ruta',

  toolbar: function (ctx) {
    var S = ctx.S, R = ctx.D.rutaEnVivo, rol = ctx.rol;
    return {
      body: S.iconButton({ icon: 'chevron-left', size: 'medium', variant: 'mute', theme: 'neutral', label: 'Volver a hoy', attrs: { 'data-ir': '#/operador' } }) +
            S.title({ text: R.codigo + ' · ' + R.sector, subtitle: 'Rutas recibidas / Detalle de ruta' }),
      actions: S.button({ label: 'Reasignar', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'reasignar' } }) +
               S.avatar({ text: rol.iniciales, size: 'small', variant: 'loud', theme: rol.theme })
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, R = D.rutaEnVivo, T = ctx.rol.theme, e = S.esc;
    var k = ctx.cargando;
    var est = D.estados[R.estado];
    var eq = D.equipos.filter(function (q) { return q.nombre === R.conductor.vehiculo; })[0];

    var hero = S.card({
      cls: 'nws-card--none', style: 'flex:none',
      header: S.h('div', { class: 'nws-card-head' },
        S.h('div', { class: 'nws-grow nws-col', style: 'gap:var(--naotech-sizing-4)' },
          S.h('div', { class: 'nws-row nws-row--sm', style: 'align-items:baseline' },
            S.h('span', { class: 'nwt-subtitle-font-bold', style: 'font-size:var(--naotech-sizing-24);line-height:var(--naotech-sizing-28);color:var(--naotech-primary-color-700)' }, 'Ruta'),
            S.h('span', { class: 'nwt-subtitle-font-bold', style: 'font-size:var(--naotech-sizing-24);line-height:var(--naotech-sizing-28)' }, e(R.codigo + ' · ' + R.sector))),
          S.h('div', { class: 'nws-row', style: 'margin-top:var(--naotech-sizing-2);gap:var(--naotech-sizing-8)' },
            S.badge({ label: est.label, size: 'medium', theme: est.theme }),
            S.h('span', { class: 'nws-live nws-live--strong nwt-smalltext-font-regular' }, S.h('span', { class: 'nws-live__dot' }), 'en vivo · hace ', S.h('span', { 'data-bind': 'hace' }, '—'), ' s')),
          S.h('span', { class: 'nwt-smalltext-font-regular nws-dark', style: 'margin-top:var(--naotech-sizing-8)' }, e(R.zona + ' · ' + R.sector + ' · trazada por la ' + R.trazadaPor + ' · ' + R.trazado))),
        S.h('div', { class: 'nws-divider-v' }),
        k ? S.h('div', { class: 'nws-row', style: 'flex:none;align-items:stretch;gap:var(--naotech-sizing-12)' },
              S.h('span', { class: 'nws-skel', style: 'width:216px;height:128px' }),
              S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-12);justify-content:center;margin-right:var(--naotech-sizing-16)' },
                [0, 1, 2].map(function () {
                  return S.h('div', { class: 'nws-row nws-row--sm' },
                    S.h('span', { class: 'nws-skel nws-skel--circle', style: 'width:24px;height:24px' }),
                    S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-4)' }, S.h('span', { class: 'nws-skel', style: 'width:80px;height:12px' }), S.h('span', { class: 'nws-skel', style: 'width:56px;height:10px' })));
                })))
          : S.h('div', { class: 'nws-row', style: 'flex:none;align-items:stretch;gap:var(--naotech-sizing-12)' },
              S.h('div', { class: 'nws-pick__foto nws-pick__foto--tall nws-pick__foto--xwide', style: eq && eq.foto ? 'background-image:url(' + eq.foto + ');background-size:cover;background-position:center' : '' },
                eq && eq.foto ? S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: R.conductor.vehiculo, size: 'medium', theme: 'neutral' })) : S.icon('vehicles')),
              S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-12);justify-content:center;margin-right:var(--naotech-sizing-16)' },
                [{ nombre: R.conductor.nombre, rol: 'Conductor' }]
                  .concat(R.cuadrilla.filter(function (c) { return c.nombre !== R.conductor.nombre; }))
                  .map(function (c) {
                    return S.h('div', { class: 'nws-row nws-row--sm' },
                      S.avatar({ text: c.nombre.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').slice(0, 2), size: 'tiny', variant: 'quiet', theme: 'neutral' }),
                      S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(c.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(c.rol))));
                  })))),
      /* La primera tarjeta de la fila está armada a mano porque ninguna stat
         card del SDK acepta barra de avance ni el botón de reinicio. Para el
         esqueleto no hace falta reproducir eso: en carga es una stat card más
         del SDK, y recién con los datos aparece la versión compuesta. */
      content: S.h('div', { class: 'nws-stats nws-stats--5' },
        k ? S.statCard({ skeleton: true, theme: T })
          : S.h('div', { class: 'nwt-stat-card', style: 'position:relative' },
            S.iconButton({ icon: 'refresh', size: 'small', variant: 'mute', theme: 'neutral', label: 'Reiniciar animación', cls: 'nws-stat-reset', attrs: { 'data-reset': 'avance' } }),
            S.h('div', { class: 'nwt-stat-card__content' },
              S.h('span', { class: 'nwt-stat-card__label' }, 'Avance'),
              S.h('span', { class: 'nwt-stat-card__value', 'data-bind': 'hechas' }, '—'),
              S.h('span', { class: 'nwt-stat-card__hint', 'data-bind': 'avanceHint' }),
              S.progress({ value: 0, size: 'medium', theme: T, cls: 'nws-stat-progress' }).replace('class="nwt-progress-bar', 'data-bind-progress="pct" class="nwt-progress-bar'))),
        S.statCard({ skeleton: k, label: 'Ritmo', bindValue: 'ritmo', value: '—', hint: 'unidades por hora', icon: 'fast-shipping', theme: T }),
        S.statCard({ skeleton: k, label: 'Próxima', bindValue: 'proxMin', bindHint: 'proxHint', value: '—', icon: 'gps-pin', theme: T }),
        S.statCard({ skeleton: k, label: 'Última marca', bindValue: 'ultima', bindHint: 'ultimaHint', value: '—', icon: 'dispatch-time', theme: T }),
        S.statCard({ skeleton: k, label: 'Fin estimado', value: R.finEstimado, bindHint: 'finHint', icon: 'calendar', theme: T }))
    });

    var mapa = S.card({
      cls: 'nws-card--fill', style: 'flex:1.5;min-width:0',
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Recorrido'),
        S.h('span', { class: 'nws-live nwt-smalltext-font-regular', id: 'pos-flash' }, S.h('span', { class: 'nws-live__dot' }), 'posición actualizada'),
        S.h('div', { class: 'nws-grow' }),
        S.button({ label: 'Pantalla completa', icon: 'zoom-in', size: 'small', variant: 'mute', theme: T, attrs: { 'data-abrir-mapa': true } })),
      /* El mapa lo pinta MAPA.crear desde mount: acá solo va el marco. */
      content: S.h('div', { class: 'nws-map', id: 'mapa-vivo' }),
      attrs: { 'nwt-theme': T }
    });

    var actividad = S.card({
      cls: 'nws-card--fill nws-card--flush nws-card--aside', attrs: { 'nwt-theme': T },
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Actividad de la ruta'),
        S.h('div', { class: 'nws-grow' })),
      content:
        S.h('div', { class: 'nws-row nws-row--md nwt-smalltext-font-regular nws-muted', style: 'padding:var(--naotech-sizing-10) var(--naotech-sizing-18);border-bottom:1px solid var(--naotech-app-color-200);flex:none' },
          S.h('span', null, S.h('b', { 'data-bind': 'hechas', class: 'nws-ink' }, '—'), ' marcadas'),
          S.h('span', null, S.h('b', { 'data-bind': 'faltan', class: 'nws-ink' }, '—'), ' pendientes'),
          S.h('div', { class: 'nws-grow' }),
          S.h('span', null, 'de ', S.h('span', { 'data-bind': 'total' }, '—'), ' paradas')) +
        /* Las paradas las llena pintarStops desde mount. La cabecera de conteos
           de arriba ya arranca en '—' y no se toca: es un dato vacío declarado,
           no una silueta. */
        S.h('div', { class: k ? 'nws-stack--sm' : 'nws-stops', id: 'stops', style: k ? 'padding:var(--naotech-sizing-16)' : undefined },
          k ? [0, 1, 2, 3].map(function () { return S.card({ skeleton: true, size: 'small' }); }) : '')
    });

    /* Pantalla completa: otra instancia del mismo mapa, creada al abrir (el
       modal cerrado mide 0 y no se puede encuadrar) y destruida al cerrar. */
    var mapaModal = S.modal({
      id: 'modal-mapa', theme: T, title: 'Recorrido', subtitle: R.codigo + ' · ' + R.sector, cls: 'nws-modal-mapa',
      body: S.h('div', { class: 'nws-map', id: 'mapa-full' })
    });

    /* La fila mapa+actividad ocupa lo que queda de la vista (flex:1 sobre el
       contenido del shell), así el mapa nunca queda cortado por abajo; en
       pantallas bajas manda el mínimo y aparece scroll. */
    return hero + S.h('div', { class: 'nws-split', style: 'min-height:80vh;max-height:80vh' }, mapa, actividad) + mapaModal;
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, R = D.rutaEnVivo, M = window.MAPA;
    var total = R.totalParadas;
    var ruta = M.rutas.enVivo(total);
    var paradas = ruta.paradas.map(function (p, i) {
      var mm = 40 + i * 6;
      return {
        n: i + 1,
        direccion: R.calles[i % 6] + ' #72-' + (10 + ((i * 14) % 86)),
        tipo: R.tipos[i % 6],
        hora: '0' + (6 + Math.floor(mm / 60)) + ':' + ('0' + (mm % 60)).slice(-2),
        distancia: 30 + ((i * 17) % 120), camion: (i % 7) !== 5, fotos: i % 3 === 0 ? 2 : 1
      };
    });
    var st = { hechas: R.avanceInicial, enBase: false, hace: 4, seguir: true, primer: true, scrollPropio: 0, vivo: true };
    /* base, primera y última ya van rotuladas sobre el mapa; la leyenda
       explica solo los tres tipos de línea */
    var LEYENDA = ['recorrido', 'pendiente', 'traslado'];

    function bind(k, v) { root.querySelectorAll('[data-bind="' + k + '"]').forEach(function (n) { n.textContent = v; }); }

    function flashPosicion() {
      var f = root.querySelector('#pos-flash'); if (!f) { return; }
      f.classList.add('nws-live--flash');
      clearTimeout(f._flashTimer);
      f._flashTimer = setTimeout(function () { f.classList.remove('nws-live--flash'); }, 1500);
    }

    /* ---- mapas: el de la card siempre; el del modal mientras esté abierto ---- */
    var mapa = M.crear(root.querySelector('#mapa-vivo'), { ruta: ruta, hechas: st.hechas, leyenda: LEYENDA, aria: 'Mapa del recorrido de la ruta' });
    var mapaFull = null;
    function mapas() { return [mapa, mapaFull].filter(Boolean); }

    function pintarParadas() {
      var lista = root.querySelector('#stops');
      lista.innerHTML = paradas.map(function (p, i) {
        var hecha = i < st.hechas, actual = i === st.hechas && !st.enBase;
        var meta = hecha ? p.hora + ' · ' + p.tipo + (p.camion ? '' : ' · a pie') : p.tipo + ' · a ' + p.distancia + ' m';
        return S.h('div', { class: S.cls('nws-stop', hecha && 'nws-stop--hecha', actual && 'nws-stop--actual', !hecha && !actual && 'nws-stop--pendiente') },
          S.h('div', { class: 'nws-stop__n nwt-smalltext-font-semibold' }, p.n),
          S.h('div', { class: 'nws-grow nws-col' },
            S.h('span', { class: 'nws-stop__dir nwt-smalltext-font-medium' }, S.esc(p.direccion)),
            S.h('span', { class: 'nws-stop__meta nwt-smalltext-font-regular' }, S.esc(meta))),
          S.h('span', { class: 'nws-stop__cam nwt-smalltext-font-regular' }, hecha ? S.icon('camera') + p.fotos : ''));
      }).join('');
      var actual = lista.querySelector('.nws-stop--actual');
      if (actual && st.seguir) {
        st.scrollPropio = Date.now();
        lista.scrollTo({ top: Math.max(0, actual.offsetTop - (lista.clientHeight - actual.offsetHeight) / 2), behavior: st.primer ? 'auto' : 'smooth' });
        st.primer = false;
      }
    }

    function pintarIndicadores() {
      var faltan = total - st.hechas, pct = Math.round(st.hechas / total * 100);
      bind('hechas', st.hechas); bind('faltan', faltan); bind('total', total); bind('hace', st.hace);
      bind('avanceHint', 'de ' + total + ' unidades · ' + pct + '%');
      var bar = root.querySelector('[data-bind-progress="pct"]');
      if (bar) { bar.setAttribute('aria-valuenow', pct); bar.querySelector('.nwt-progress-bar__fill').style.width = pct + '%'; }
      bind('ritmo', String(Math.round(st.hechas / (0.4 + st.hechas * 0.1) * 6)));
      var prox = paradas[st.hechas];
      bind('proxMin', st.enBase ? '—' : prox ? Math.max(1, Math.round(prox.distancia / 40)) + ' min' : 'base');
      bind('proxHint', st.enBase ? 'camión en la base' : prox ? prox.distancia + ' m · ' + prox.direccion : 'última marcada · volviendo a la base');
      var ult = paradas[st.hechas - 1];
      bind('ultima', ult ? ult.hora : '—'); bind('ultimaHint', 'hace ' + st.hace + ' segundos');
      bind('finHint', st.enBase ? 'ruta terminada' : 'faltan ' + faltan + ' unidades');
    }

    /* ---- el ritmo de la ruta ----
       Viajar hasta la siguiente unidad dura lo que mide el tramo (mapa.js);
       marcarla, entre 1,2 y 2,6 s. Es un encadenado de timeouts y no un
       intervalo fijo para que el tiempo de espera sea el de la animación
       real, no uno inventado que se le adelante o se le atrase. */
    var timer = null;
    function programar(ms) { clearTimeout(timer); timer = setTimeout(avanzar, ms); }
    function llegada() {
      if (!st.vivo) { return; }
      st.hace = 0;
      flashPosicion(); pintarIndicadores(); pintarParadas();
    }
    function avanzar() {
      if (!st.vivo) { return; }
      if (st.hechas < total) {
        st.hechas++;
        Promise.all(mapas().map(function (m) { return m.animarA(st.hechas); })).then(function () {
          llegada();
          if (st.vivo) { programar(1200 + Math.random() * 1400); }
        });
      } else if (!st.enBase) {
        Promise.all(mapas().map(function (m) { return m.animarA(total + 1); })).then(function () { st.enBase = true; llegada(); });
      }
    }
    var reloj = setInterval(function () { st.hace++; bind('hace', st.hace); bind('ultimaHint', 'hace ' + st.hace + ' segundos'); }, 1000);

    pintarIndicadores(); pintarParadas();
    programar(1600);

    function reiniciar() {
      st.hechas = 0; st.enBase = false; st.hace = 0; st.seguir = true; st.primer = true;
      mapas().forEach(function (m) { m.set({ hechas: 0, enBase: false }); });
      pintarIndicadores(); pintarParadas();
      programar(900);
    }
    function abrirModal() {
      root.querySelector('#modal-mapa').classList.add('nwt-modal--visible');
      if (mapaFull) { mapaFull.destruir(); }
      mapaFull = M.crear(root.querySelector('#mapa-full'), { ruta: ruta, hechas: st.hechas, enBase: st.enBase, leyenda: LEYENDA, pad: 72, aria: 'Mapa del recorrido de la ruta, pantalla completa' });
    }
    function cerrarModal() {
      root.querySelector('#modal-mapa').classList.remove('nwt-modal--visible');
      if (mapaFull) { mapaFull.destruir(); mapaFull = null; }
    }
    function onClick(ev) {
      if (ev.target.closest('[data-reset="avance"]')) { reiniciar(); return; }
      if (ev.target.closest('[data-abrir-mapa]')) { abrirModal(); return; }
      if (ev.target.closest('#modal-mapa [data-close-modal]')) { cerrarModal(); }
    }
    function onKey(ev) { if (ev.key === 'Escape' && mapaFull) { cerrarModal(); } }
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);

    var lista = root.querySelector('#stops');
    function onScroll() { if (Date.now() - st.scrollPropio > 900) { st.seguir = false; } }
    lista.addEventListener('scroll', onScroll, { passive: true });

    return function () {
      st.vivo = false; clearTimeout(timer); clearInterval(reloj);
      mapas().forEach(function (m) { m.destruir(); });
      lista.removeEventListener('scroll', onScroll); root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey);
    };
  }
};
