/**
 * Supervisor · revisión de ruta ejecutada.
 * Evidencia parada por parada (3 cámaras) y línea de tiempo — solo lectura.
 * El juicio por punto (conforme/hallazgo/no verificable) se registra desde
 * el móvil en ruta (supervisor-ruta-app.js); acá ya no se "toma" ni se
 * registra observación — el cierre lo hace Operador desde operador/control.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['supervisor-revision'] = {
  menu: 'supervision',
  titulo: 'Revisión de ruta ejecutada',

  toolbar: function (ctx) {
    var S = ctx.S;
    return {
      body: S.iconButton({ icon: 'chevron-left', size: 'medium', variant: 'mute', theme: 'neutral', label: 'Volver a supervisión', attrs: { 'data-ir': '#/supervisor-dashboard' } }) +
            S.title({ text: 'Revisión de ruta ejecutada', subtitle: 'Supervisión / Historial / R-2409' }),
      actions: S.button({ label: 'Anterior', icon: 'chevron-left', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'anterior' } }) +
               S.button({ label: 'Siguiente', iconEnd: 'chevron-right', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'siguiente' } })
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, R = D.revision, T = ctx.rol.theme, e = S.esc, M = R.metricas;
    var k = ctx.cargando;
    var franjaAmPm = M.franja.split(' — ').map(function (t) {
      var p = t.split(':'), hh = +p[0], h12 = hh % 12 || 12;
      return h12 + ':' + p[1] + ' ' + (hh >= 12 ? 'PM' : 'AM');
    });
    var vehiculo = R.operario.detalle.split(' · ')[1];
    var eqOp = D.equipos.filter(function (q) { return q.nombre === vehiculo; })[0];
    var hero = S.card({
      cls: 'nws-card--none', style: 'flex:none',
      header: S.h('div', { class: 'nws-card-head' },
        S.h('div', { class: 'nws-grow nws-col', style: 'gap:var(--naotech-sizing-4)' },
          S.h('span', { class: 'nwt-overline-font-semibold nws-muted' }, 'Ruta ejecutada'),
          S.h('span', { class: 'nwt-subtitle-font-bold', style: 'font-size:var(--naotech-sizing-24);line-height:var(--naotech-sizing-28)' }, e(R.ruta.codigo)),
          S.h('div', { class: 'nws-row', style: 'margin-top:var(--naotech-sizing-2);flex-wrap:wrap' },
            S.badge({ label: 'En verificación', size: 'medium', theme: 'informative' }),
            S.badge({ label: 'Dentro del plazo', size: 'medium', theme: 'positive' }),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(R.ruta.zona + ' · ejecutada el ' + R.ruta.fecha + ' · trazada por la ' + R.ruta.trazadaPor)))),
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
              S.h('div', { class: 'nws-pick__foto nws-pick__foto--tall nws-pick__foto--xwide', style: eqOp && eqOp.foto ? 'background-image:url(' + eqOp.foto + ');background-size:cover;background-position:center' : '' },
                eqOp && eqOp.foto ? S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: vehiculo, size: 'medium', theme: 'neutral' })) : S.icon('vehicles')),
              S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-12);justify-content:center;margin-right:var(--naotech-sizing-16)' },
                R.cuadrilla.map(function (c, i) {
                  return S.h('div', { class: 'nws-row nws-row--sm' },
                    S.avatar({ text: c.nombre.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').slice(0, 2), size: 'tiny', variant: 'quiet', theme: 'neutral' }),
                    S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(c.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, c.rol)));
                })))),
      content: S.h('div', { class: 'nws-stats nws-stats--5' },
        S.statCard({ skeleton: k, label: 'Unidades marcadas', value: M.marcadas, hint: 'de ' + M.total + ' · recolección completa', theme: T, extra: S.progress({ value: 100, size: 'medium', cls: 'nws-stat-progress' }) }),
        S.statCard({ skeleton: k, label: 'Evidencias', value: M.evidencias, hint: M.sinCamion + ' sin cámaras del camión', icon: 'camera', theme: T }),
        S.statCard({ skeleton: k, label: 'Franja', valueHtml: S.h('div', { class: 'nws-col', style: 'gap:1px' }, S.h('span', null, franjaAmPm[0]), S.h('span', null, franjaAmPm[1])), small: true, hint: M.enCalle + ' en calle', icon: 'dispatch-time', theme: T }),
        S.statCard({ skeleton: k, label: 'Ritmo', value: M.ritmo, hint: 'unidades por hora', theme: T, extra: S.h('div', { class: 'nws-spark' }, M.ritmoSerie.map(function (v) { return '<i style="height:' + v + '%"></i>'; })) }),
        S.statCard({ skeleton: k, label: 'Plazo', value: R.ruta.plazo, hint: 'desde la ejecución', icon: 'calendar', theme: T }))
    });

    var evidencia = S.card({
      cls: 'nws-card--fill', style: 'flex:1.7;min-width:0', attrs: { 'nwt-theme': T },
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Evidencia'),
        S.h('div', { class: 'nws-grow' }),
        S.h('div', { class: 'nws-row nws-row--sm' },
          S.iconButton({ icon: 'chevron-left', size: 'medium', variant: 'quiet', theme: T, label: 'Evidencia anterior', attrs: { 'data-ev-step': '-1' } }),
          S.h('span', { id: 'ev-n', class: 'nwt-smalltext-font-semibold nws-muted', style: 'padding:0 var(--naotech-sizing-16)' }),
          S.iconButton({ icon: 'chevron-right', size: 'medium', variant: 'quiet', theme: T, label: 'Siguiente evidencia', attrs: { 'data-ev-step': '1' } }))),
      /* La foto de la parada y su tira de miniaturas las arma pintarEvidencia
         desde mount. Una sola silueta grande y no una por cámara: cuántas
         cámaras respondieron es parte de lo que se está esperando. */
      content: S.h('div', { id: 'ev-cuerpo', class: 'nws-col nws-grow', style: 'min-height:0;overflow-y:auto' },
        k ? S.card({ skeleton: true, footer: 1 }) : '')
    });

    var C = D.camionReporte;
    var lado = S.h('div', { class: 'nws-col', style: 'flex:0 0 400px;gap:var(--naotech-sizing-16);min-height:0' },
      camionCard(S, C, T, e),
      S.card({
        cls: 'nws-card--fill', style: 'min-height:0', attrs: { 'nwt-theme': T },
        header: S.h('div', { class: 'nws-card-head' }, S.h('span', { class: 'nwt-body-font-semibold' }, 'Línea de tiempo de la ruta')),
        content: S.h('div', { id: 'tl-cuerpo', style: 'overflow-y:auto' },
          k ? S.timeline({ skeleton: true }) : '')
      }));

    return hero + S.h('div', { class: 'nws-split', style: 'min-height:80vh;max-height:80vh' }, evidencia, lado);
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, R = D.revision, T = ctx.rol.theme, e = S.esc;
    var st = { ev: 2 };

    /* R.evidencias solo trae 7 de muestra; el resto (hasta metricas.total)
       se completa acá cicleando calles/tipos, para que la tira de miniaturas
       muestre las 47 reales en vez de un botón "+N más" (pedido en DC-057). */
    var CALLES = ['Cra 45', 'Cra 46', 'Cra 47', 'Cll 72', 'Cll 73', 'Cll 74', 'Cra 48'];
    var TIPOS = ['Residencial', 'Comercial', 'Industrial'];
    var evidencias = R.evidencias.slice();
    for (var i = evidencias.length; i < R.metricas.total; i++) {
      var mm = 44 + i * 13, hh = 6 + Math.floor(mm / 60);
      evidencias.push({
        dir: CALLES[i % CALLES.length] + ' #' + (72 + (i % 9)) + '-' + (10 + (i * 7) % 80),
        tipo: TIPOS[i % TIPOS.length], uid: 'U-' + (4818 + i * 3),
        hora: ('0' + hh).slice(-2) + ':' + ('0' + (mm % 60)).slice(-2) + ':' + ('0' + (i * 17) % 60).slice(-2),
        coord: (10.987 + i * 0.0004).toFixed(4) + ', −74.786' + (i % 10),
        camion: true
      });
    }
    R = Object.assign({}, R, { evidencias: evidencias });

    var FOTOS = R.evidenciaFotos || [];
    function foto(n) { return FOTOS.length ? 'background-image:url(' + FOTOS[n % FOTOS.length] + ');background-size:cover;background-position:center' : ''; }
    function pintarEvidencia() {
      var x = R.evidencias[st.ev];
      root.querySelector('#ev-n').textContent = 'parada ' + (st.ev + 1) + ' de ' + R.metricas.total;
      S.repintar(root.querySelector('#ev-cuerpo'),
        S.h('div', { class: 'nws-thumbs-slider' },
          S.h('div', { class: 'nws-thumbs', id: 'nws-thumbs' }, R.evidencias.map(function (y, i) {
            return S.h('button', { type: 'button', class: S.cls('nws-thumb', i === st.ev && 'nws-thumb--on'), 'data-ev': i, 'aria-label': 'Parada ' + (i + 1), style: foto(i * 3) },
              S.h('span', { class: 'nws-thumb__n nwt-smalltext-font-semibold' }, i + 1),
              S.h('span', { class: 'nws-thumb__b' }, S.badge({ icon: 'camera', label: y.camion ? 3 : 1, size: 'small', theme: y.camion ? 'positive' : 'caution' })));
          }))) +
        S.h('div', { class: 'nwt-divider nwt-divider--horizontal', style: 'margin:var(--naotech-sizing-16) 0' }) +
        S.h('div', { class: 'nws-ev' },
          S.h('div', { class: 'nws-ev__main nws-ev__photo', style: foto(st.ev * 3) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'operator-cam', size: 'small', theme: 'neutral' }))),
          S.h('div', { class: 'nws-ev__side' }, x.camion
            ? S.h('div', { class: 'nws-ev__cam nws-ev__photo', style: foto(st.ev * 3 + 1) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'truck-cam-left', size: 'small', theme: 'neutral' }))) +
              S.h('div', { class: 'nws-ev__cam nws-ev__photo', style: foto(st.ev * 3 + 2) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'truck-cam-right', size: 'small', theme: 'neutral' })))
            : S.h('div', { class: 'nws-ev__na nwt-smalltext-font-regular' }, S.icon('vehicles'), S.badge({ label: 'truck-cam-not-available', size: 'small', theme: 'negative' }), 'el camión no reportó en esta parada · queda solo la evidencia del operario'))) +
        S.h('div', { class: 'nws-ev__meta' },
          [['Hora', x.hora], ['Coordenada', x.coord], ['Unidad', x.uid + ' · ' + x.tipo], ['Dirección', x.dir], ['Cámaras', x.camion ? '3 de 3' : '1 de 3 · camión sin señal']].map(function (kv) {
            return S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-stat-card__label' }, kv[0]), S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, e(kv[1])));
          })));
      var activo = root.querySelector('.nws-thumb--on');
      if (activo) { activo.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    }

    function pintarLinea() {
      var items = R.hitos.map(function (hh) { return { title: hh.titulo, subtitle: hh.detalle }; });
      S.repintar(root.querySelector('#tl-cuerpo'), S.timeline({ items: items }));
    }

    function onClick(ev) {
      var t = ev.target;
      var evb = t.closest('[data-ev]'); if (evb) { st.ev = +evb.getAttribute('data-ev'); pintarEvidencia(); return; }
      var step = t.closest('[data-ev-step]'); if (step) { st.ev = Math.max(0, Math.min(R.evidencias.length - 1, st.ev + (+step.getAttribute('data-ev-step')))); pintarEvidencia(); return; }
    }
    root.addEventListener('click', onClick);
    pintarEvidencia(); pintarLinea();
    return function () { root.removeEventListener('click', onClick); };
  }
};
