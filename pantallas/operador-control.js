/**
 * Operador · control de cierre.
 * Absorbe la revisión punto a punto (evidencia, 3 cámaras) que antes era
 * exclusiva de Supervisor — acá es donde vive el único botón de cierre del
 * sistema (Regla 5 del rediseño: Supervisor verifica, Operador cierra).
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['operador-control'] = {
  menu: 'hoy',
  titulo: 'Control de cierre',

  toolbar: function (ctx) {
    var S = ctx.S, D = ctx.D;
    return {
      body: S.iconButton({ icon: 'chevron-left', size: 'medium', variant: 'mute', theme: 'neutral', label: 'Volver a rutas', attrs: { 'data-ir': '#/operador' } }) +
            S.title({ text: 'Control de cierre', subtitle: D.revision.ruta.codigo + ' · lista para cierre' }),
      actions: ''
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, R = D.revision, T = ctx.rol.theme, e = S.esc, M = R.metricas;
    var k = ctx.cargando;

    var hero = S.card({
      cls: 'nws-card--none', style: 'flex:none',
      header: S.h('div', { class: 'nws-card-head' },
        S.h('div', { class: 'nws-grow nws-col', style: 'gap:var(--naotech-sizing-4)' },
          S.h('span', { class: 'nwt-overline-font-semibold nws-muted' }, 'Ruta finalizada'),
          S.h('span', { class: 'nwt-subtitle-font-bold', style: 'font-size:var(--naotech-sizing-24);line-height:var(--naotech-sizing-28)' }, e(R.ruta.codigo)),
          S.h('div', { class: 'nws-row', style: 'margin-top:var(--naotech-sizing-2);flex-wrap:wrap' },
            S.h('span', { id: 'badge-estado' }, S.badge({ label: 'Verificada · lista para cierre', size: 'medium', theme: 'primary' })),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(R.ruta.zona + ' · ejecutada el ' + R.ruta.fecha)))))
    });

    var evidencia = S.card({
      cls: 'nws-card--fill', style: 'flex:1.7;min-width:0', attrs: { 'nwt-theme': T },
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Evidencia punto a punto'),
        S.h('div', { class: 'nws-grow' }),
        S.h('div', { class: 'nws-row nws-row--sm' },
          S.iconButton({ icon: 'chevron-left', size: 'medium', variant: 'quiet', theme: T, label: 'Evidencia anterior', attrs: { 'data-ev-step': '-1' } }),
          S.h('span', { id: 'ev-n', class: 'nwt-smalltext-font-semibold nws-muted', style: 'padding:0 var(--naotech-sizing-16)' }),
          S.iconButton({ icon: 'chevron-right', size: 'medium', variant: 'quiet', theme: T, label: 'Siguiente evidencia', attrs: { 'data-ev-step': '1' } }))),
      content: S.h('div', { id: 'ev-cuerpo', class: 'nws-col nws-grow', style: 'min-height:0;overflow-y:auto' },
        k ? S.card({ skeleton: true, footer: 1 }) : '')
    });

    /* DC-033: "Camión recolector" y "Verificación de Supervisor" pasan a
       comportarse como acordeón (pintarLado, en mount) — antes competían
       siempre expandidos por el mismo espacio de 380px. Acá solo va el
       contenedor; el primer pintado lo hace mount(), igual que ev-cuerpo. */
    var lado = S.h('div', { class: 'nws-col', style: 'flex:0 0 380px;gap:var(--naotech-sizing-16);min-height:0', id: 'lado-cuerpo' });

    return hero + S.h('div', { class: 'nws-split', style: 'min-height:74vh;max-height:74vh' }, evidencia, lado) +
      S.confirmation({ id: 'confirm-cerrar', theme: T, icon: 'positive', title: '¿Cerrás ' + e(R.ruta.codigo) + '?', message: 'Queda al histórico de Operador con la evidencia y los hallazgos de Supervisor. Desde acá ya no admite cambios.', approvedLabel: 'Cerrar la ruta', rejectLabel: 'Cancelar' });
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, R = D.revision, e = S.esc, T = ctx.rol.theme;
    /* DC-034/038: "Camión recolector" arranca abierto (es el que se revisa
       primero); "Verificación de Supervisor" arranca compacto, pegado abajo,
       con la MISMA forma de barra que el compacto de arriba — no un botón
       CTA aparte (eso fue mi primera lectura de DC-033, corregida acá). */
    var st = { ev: 2, cerrada: false, panel: 'camion' };

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
    /* DC-039: "operator-cam" no decía quién la tomó — la evidencia no
       guarda el dato por parada, así que se atribuye al conductor de la
       cuadrilla (quien reporta la ruta), con foto (iniciales, no hay
       fotos reales de personas) y nombre en vez de solo texto. */
    var conductorEv = R.cuadrilla.filter(function (c) { return c.rol === 'Conductor'; })[0] || R.cuadrilla[0];
    function foto(n) { return FOTOS.length ? 'background-image:url(' + FOTOS[n % FOTOS.length] + ');background-size:cover;background-position:center' : ''; }

    /* DC-033: acordeón de "Camión recolector" / "Verificación de Supervisor"
       — compactos por defecto (st.panel null), uno de los dos ocupa el
       lugar de los dos al abrirse (pintarLado reconstruye ambos). La
       verificación compacta se ve entera como un botón (nws-panel-toggle
       --cta), a propósito, para que sea lo más notorio de esta columna. */
    function contrasteHtml() {
      return S.card({
        cls: 'nws-card--fill', style: 'min-height:0', attrs: { 'nwt-theme': T },
        header: S.h('div', { class: 'nws-card-head' },
          S.h('span', { class: 'nwt-body-font-semibold nws-grow' }, 'Verificación de Supervisor'),
          S.iconButton({ icon: 'chevron-up', size: 'small', variant: 'mute', theme: 'neutral', label: 'Compactar', attrs: { 'data-panel': 'verif' } })),
        /* DC-035: menos padding (16→12). */
        content: S.h('div', { class: 'nws-col', style: 'padding:var(--naotech-sizing-12);gap:var(--naotech-sizing-12)' },
          R.hallazgos.length
            ? S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-8)' },
                S.h('span', { class: 'nwt-smalltext-font-semibold nws-dark' }, 'Hallazgos reportados en ruta'),
                /* DC-036: filtros con la misma pinta que los chips móviles
                   (.nws-opt__c) en vez de nwt-tag — son de solo lectura acá,
                   por eso sin data-causal ni cursor de click. */
                S.h('div', { class: 'nws-row', style: 'flex-wrap:wrap;gap:var(--naotech-sizing-6)' }, R.hallazgos.map(function (hz) {
                  return S.h('div', { class: 'nws-opt__c nwt-smalltext-font-semibold', style: 'cursor:default' }, e(hz));
                })))
            : S.h('div', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Sin hallazgos reportados.'),
          S.h('div', { class: 'nwt-divider nwt-divider--horizontal' }),
          /* DC-037: más espaciado entre filas de la cuadrilla (6→12). */
          S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-12)' },
            R.cuadrilla.map(function (c) {
              return S.h('div', { class: 'nws-row nws-row--sm' },
                S.avatar({ text: c.nombre.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').slice(0, 2), size: 'tiny', variant: 'quiet', theme: 'neutral' }),
                S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(c.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, c.rol)));
            })),
          S.h('div', { class: 'nws-grow' }),
          S.h('div', { id: 'cierre-cuerpo' },
            st.cerrada
              ? S.h('div', { class: 'nws-row nws-row--sm', style: 'justify-content:center' }, S.icon('positive'), S.h('span', { class: 'nwt-smalltext-font-semibold' }, 'Ruta cerrada'))
              : S.button({ label: 'Cerrar ruta', size: 'large', variant: 'loud', theme: T, attrs: { style: 'width:100%', 'data-cerrar': true } })))
      });
    }
    function pintarLado() {
      var C = D.camionReporte, completo = C.capturas >= C.esperadas;
      var camionHtml = st.panel === 'camion'
        ? S.h('div', { 'data-panel': 'camion', style: 'cursor:pointer' }, camionCard(S, C, T, e))
        : S.h('button', { type: 'button', class: 'nws-panel-toggle', 'nwt-theme': T, 'data-panel': 'camion' },
            S.icon('vehicles'), S.h('span', { class: 'nws-grow nwt-body-font-semibold', style: 'text-align:left' }, 'Camión recolector'),
            S.badge({ label: completo ? 'Reporte completo' : 'Reporte parcial', size: 'small', theme: completo ? 'positive' : 'caution' }),
            S.icon('chevron-down'));
      var n = R.hallazgos.length;
      /* DC-038: misma forma que el compacto de Camión — nada de CTA aparte. */
      var verifHtml = st.panel === 'verif'
        ? contrasteHtml()
        : S.h('button', { type: 'button', class: 'nws-panel-toggle', 'nwt-theme': T, 'data-panel': 'verif' },
            S.icon(st.cerrada ? 'positive' : 'shipping'),
            S.h('span', { class: 'nws-grow nwt-body-font-semibold', style: 'text-align:left' }, 'Verificación de Supervisor'),
            S.badge({ label: st.cerrada ? 'Cerrada' : (n ? n + (n === 1 ? ' hallazgo' : ' hallazgos') : 'Sin hallazgos'), size: 'small', theme: st.cerrada ? 'positive' : (n ? 'caution' : 'positive') }),
            S.icon('chevron-down'));
      S.repintar(root.querySelector('#lado-cuerpo'), camionHtml + verifHtml);
    }
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
          S.h('div', { class: 'nws-ev__main nws-ev__photo', style: foto(st.ev * 3) },
            S.h('div', { class: 'nws-ev__tag nws-ev__tag--persona' },
              S.avatar({ text: conductorEv.nombre.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').slice(0, 2), size: 'tiny', variant: 'quiet', theme: 'neutral' }),
              S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(conductorEv.nombre)))),
          S.h('div', { class: 'nws-ev__side' }, x.camion
            ? S.h('div', { class: 'nws-ev__cam nws-ev__photo', style: foto(st.ev * 3 + 1) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'truck-cam-left', size: 'small', theme: 'neutral' }))) +
              S.h('div', { class: 'nws-ev__cam nws-ev__photo', style: foto(st.ev * 3 + 2) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'truck-cam-right', size: 'small', theme: 'neutral' })))
            : S.h('div', { class: 'nws-ev__na nwt-smalltext-font-regular' }, S.icon('vehicles'), S.badge({ label: 'truck-cam-not-available', size: 'small', theme: 'negative' }), 'el camión no reportó en esta parada · queda solo la evidencia del operario'))) +
        S.h('div', { class: 'nws-ev__meta' },
          [['Hora', x.hora], ['Coordenada', x.coord], ['Punto', x.uid + ' · ' + x.tipo], ['Dirección', x.dir], ['Cámaras', x.camion ? '3 de 3' : '1 de 3 · camión sin señal']].map(function (kv) {
            return S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-stat-card__label' }, kv[0]), S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, e(kv[1])));
          })));
      var activo = root.querySelector('.nws-thumb--on');
      if (activo) { activo.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    }

    function onClick(ev) {
      var t = ev.target;
      var pnl = t.closest('[data-panel]');
      if (pnl) { var id = pnl.getAttribute('data-panel'); st.panel = st.panel === id ? null : id; pintarLado(); return; }
      var evb = t.closest('[data-ev]'); if (evb) { st.ev = +evb.getAttribute('data-ev'); pintarEvidencia(); return; }
      var step = t.closest('[data-ev-step]'); if (step) { st.ev = Math.max(0, Math.min(R.evidencias.length - 1, st.ev + (+step.getAttribute('data-ev-step')))); pintarEvidencia(); return; }
      if (t.closest('[data-cerrar]') && !st.cerrada) { root.querySelector('#confirm-cerrar').classList.add('nwt-modal--visible'); return; }
      if (t.closest('#confirm-cerrar [data-reject]')) { root.querySelector('#confirm-cerrar').classList.remove('nwt-modal--visible'); return; }
      if (t.closest('#confirm-cerrar [data-approve]') && !st.cerrada) {
        st.cerrada = true;
        root.querySelector('#confirm-cerrar').classList.remove('nwt-modal--visible');
        root.querySelector('#badge-estado').innerHTML = S.badge({ label: 'Cerrada por Operador', size: 'medium', theme: 'positive' });
        root.querySelector('#cierre-cuerpo').innerHTML = S.h('div', { class: 'nws-row nws-row--sm', style: 'justify-content:center' }, S.icon('positive'), S.h('span', { class: 'nwt-smalltext-font-semibold' }, 'Ruta cerrada'));
        ctx.toast({ title: R.ruta.codigo + ' quedó cerrada', message: 'Pasa al histórico de Operador con su evidencia y los hallazgos de Supervisor.', theme: 'positive', icon: 'positive' });
      }
    }
    function onKey(ev) { if (ev.key === 'Escape') { root.querySelector('#confirm-cerrar').classList.remove('nwt-modal--visible'); } }
    root.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
    pintarEvidencia(); pintarLado();
    return function () { root.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }
};
