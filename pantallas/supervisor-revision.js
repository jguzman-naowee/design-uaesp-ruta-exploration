/**
 * Supervisor · revisión de ruta ejecutada.
 * Evidencia parada por parada (3 cámaras), observación obligatoria
 * (conforme / con hallazgos) y línea de tiempo de la ruta.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['supervisor-revision'] = {
  menu: 'supervision',
  titulo: 'Revisión de ruta ejecutada',

  toolbar: function (ctx) {
    var S = ctx.S, rol = ctx.rol;
    return {
      body: S.iconButton({ icon: 'chevron-left', size: 'medium', variant: 'mute', theme: 'neutral', label: 'Volver a supervisión', attrs: { 'data-ir': '#/supervisor' } }) +
            S.title({ text: 'Revisión de ruta ejecutada', subtitle: 'Supervisión / En revisión / R-2409' }),
      actions: S.button({ label: 'Anterior', icon: 'chevron-left', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'anterior' } }) +
               S.button({ label: 'Siguiente', iconEnd: 'chevron-right', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'siguiente' } }) +
               S.avatar({ text: rol.iniciales, size: 'small', variant: 'loud', theme: rol.theme })
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
            S.h('span', { id: 'badge-estado' }, S.badge({ label: 'En revisión', size: 'medium', theme: 'informative' })),
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

    var observacion = S.card({
      /* El reparto de espacio (flex) vive en .nws-card--pair, no acá: inline
         le gana a cualquier clase y el colapso tendría que pelearlo con
         !important, que es justo lo que deja la transición a medio camino. */
      cls: 'nws-card--fill nws-card--pair', style: 'min-height:0', attrs: { 'nwt-theme': T, id: 'card-observacion' },
      header: S.h('div', { class: 'nws-card-head', style: 'cursor:pointer', 'data-toggle-card2': 'observacion' }, S.h('span', { class: 'nwt-body-font-semibold' }, 'Tu observación'), S.badge({ label: 'obligatoria', size: 'medium', theme: 'negative' }),
        S.h('div', { class: 'nws-grow' }),
        S.iconButton({ icon: 'chevron-up', size: 'small', variant: 'mute', theme: 'neutral', label: 'Colapsar', attrs: { 'data-toggle-card2': 'observacion' } })),
      /* DC-329: 'Registrar observación' vivía en el footer del card, siempre
         montado y colapsado a alto 0 hasta elegir tipo. Ahora es parte del
         contenido que aparece recién junto con el detalle/hallazgos, una
         vez elegido el tipo — no hay nada por fuera que mostrar antes. */
      content: S.h('div', { id: 'obs-cuerpo', class: 'nws-col', style: 'flex:1;gap:var(--naotech-sizing-16);overflow-y:auto' },
        k ? S.card({ skeleton: true }) : '')
    });

    var linea = S.card({
      cls: 'nws-card--pair nws-card--collapsed', style: 'min-height:0', attrs: { 'nwt-theme': T, id: 'card-linea' },
      header: S.h('div', { class: 'nws-card-head', style: 'cursor:pointer', 'data-toggle-card2': 'linea' }, S.h('span', { class: 'nwt-body-font-semibold' }, 'Línea de tiempo de la ruta'),
        S.h('div', { class: 'nws-grow' }),
        S.iconButton({ icon: 'chevron-down', size: 'small', variant: 'mute', theme: 'neutral', label: 'Expandir', attrs: { 'data-toggle-card2': 'linea' } })),
      content: S.h('div', { id: 'tl-cuerpo', style: 'overflow-y:auto' },
        k ? S.timeline({ skeleton: true }) : '')
    });

    /* DC-337: debajo de evidencia + observación va la bitácora de la ruta —
       las observaciones ya registradas, una por fila con fecha/hora, quién,
       juicio y hallazgos. Arranca vacía y se llena al "Registrar observación"
       (pintarObservaciones en mount). */
    var observaciones = S.card({
      cls: 'nws-card--none', style: 'flex:none', attrs: { 'nwt-theme': T, id: 'card-observaciones' },
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Observaciones registradas'),
        S.h('span', { id: 'obs-n' }, S.badge({ label: 0, size: 'small', theme: 'neutral' }))),
      content: S.h('div', { id: 'obs-lista', class: 'nws-list' })
    });

    return hero + S.h('div', { class: 'nws-split', style: 'min-height:80vh;max-height:80vh' }, evidencia, S.h('div', { class: 'nws-col', style: 'flex:0 0 400px;gap:var(--naotech-sizing-16);min-height:80vh;max-height:80vh' }, observacion, linea)) + observaciones;
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, R = D.revision, T = ctx.rol.theme, e = S.esc;
    var st = { ev: 2, juicio: null, obs: '', hall: [], registrado: false, registradas: [] };
    function bind(k, v) { root.querySelectorAll('[data-bind="' + k + '"]').forEach(function (n) { n.textContent = v; }); }

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

    function pintarObs() {
      var listo = !!st.juicio && st.obs.length > 0 && !st.registrado;
      if (!st.juicio && !st.registrado) {
        /* DC-247: estado inicial — las dos opciones grandes, llenando el
           espacio disponible; al elegir una se acomodan como fila compacta
           (ver rama de abajo) y aparece el resto (detalle, hallazgos). */
        S.repintar(root.querySelector('#obs-cuerpo'),
        S.h('div', { class: 'nws-col nws-grow', style: 'gap:var(--naotech-sizing-12)' },
            S.h('button', { type: 'button', class: 'nws-option nws-option--xl nws-option--tint-positive', 'data-obs': 'ok', 'nwt-theme': T, style: 'flex:1' },
              S.icon('positive'), S.h('span', { class: 'nwt-body-font-bold' }, 'Conforme'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Se ejecutó como corresponde')),
            S.h('button', { type: 'button', class: 'nws-option nws-option--xl nws-option--tint-warning', 'data-obs': 'no', 'nwt-theme': T, style: 'flex:1' },
              S.icon('attention'), S.h('span', { class: 'nwt-body-font-bold' }, 'Con hallazgos'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Hay algo que registrar'))));
        return;
      }
      S.repintar(root.querySelector('#obs-cuerpo'),
        S.h('div', { class: 'nws-row', style: 'align-items:stretch' },
          S.h('button', { type: 'button', class: S.cls('nws-option', st.juicio === 'ok' && 'nws-option--on'), 'data-obs': 'ok', 'nwt-theme': T, disabled: st.registrado },
            S.h('span', { class: 'nwt-smalltext-font-semibold' }, 'Conforme'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Se ejecutó como corresponde')),
          S.h('button', { type: 'button', class: S.cls('nws-option', st.juicio === 'no' && 'nws-option--on'), 'data-obs': 'no', 'nwt-theme': T, disabled: st.registrado },
            S.h('span', { class: 'nwt-smalltext-font-semibold' }, 'Con hallazgos'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Hay algo que registrar'))) +
        (st.juicio === 'no' ? S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-6)' },
          S.h('span', { class: 'nwt-smalltext-font-semibold nws-dark', style: 'margin-bottom:var(--naotech-sizing-8)' }, 'Qué encontraste'),
          S.h('div', { class: 'nws-opt__b', style: 'padding:0' }, R.hallazgos.map(function (hl, i) {
            var on = st.hall.indexOf(i) >= 0;
            return S.h('div', { class: S.cls('nws-opt__c nwt-smalltext-font-semibold', on && 'nws-opt__c--on'), 'data-hall': i, 'nwt-theme': T, 'aria-pressed': on ? 'true' : 'false' },
              e(hl), on ? S.h('span', null, '×') : '');
          }))) : '') +
        S.textArea({ label: 'Detalle', placeholder: 'Qué encontraste al revisar esta ruta…', rows: 4, size: 'small', value: st.obs, name: 'obs' }) +
        S.h('div', { class: 'nws-row', style: 'justify-content:flex-end' },
          S.button({ label: st.registrado ? 'Registrada' : 'Registrar observación', size: 'medium', variant: 'loud', theme: T, disabled: !listo, attrs: { 'data-obs': 'registrar' } })));
      root.querySelector('#badge-estado').innerHTML = S.badge({ label: st.registrado ? 'Observada' : 'En revisión', size: 'medium', theme: st.registrado ? 'primary' : 'informative' });
    }

    function pintarLinea() {
      var items = R.hitos.map(function (hh) { return { title: hh.titulo, subtitle: hh.detalle }; });
      items.push(st.registrado ? { title: 'Observada', subtitle: 'observada hoy 14:35 · L. Sarmiento', theme: T } : { title: 'En revisión', subtitle: 'tomada hoy 14:20 · L. Sarmiento · sos vos', theme: T });
      S.repintar(root.querySelector('#tl-cuerpo'), S.timeline({ items: items }));
    }

    function pintarObservaciones() {
      root.querySelector('#obs-n').innerHTML = S.badge({ label: st.registradas.length, size: 'small', theme: 'neutral' });
      root.querySelector('#obs-lista').innerHTML = st.registradas.length
        ? st.registradas.map(function (o) {
            return S.h('div', { class: 'nws-list__row', style: 'flex-direction:column;align-items:stretch;gap:var(--naotech-sizing-6)' },
              S.h('div', { class: 'nws-row' },
                S.h('span', { class: 'nwt-smalltext-font-semibold nws-tnum' }, e(o.fecha)),
                S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-grow' }, e(o.quien)),
                S.badge({ label: D.estados[o.juicio].label, size: 'medium', theme: D.estados[o.juicio].theme })),
              o.hallazgos.length ? S.h('div', { class: 'nws-row', style: 'flex-wrap:wrap' }, o.hallazgos.map(function (hz) { return S.tag({ label: hz, size: 'small' }); })) : '',
              S.h('div', { class: 'nws-note nwt-smalltext-font-regular' }, e(o.texto)));
          }).join('')
        : S.h('div', { class: 'nwt-smalltext-font-regular nws-muted', style: 'padding:var(--naotech-sizing-12) var(--naotech-sizing-16)' }, 'Todavía no hay observaciones registradas para esta ruta.');
    }
    pintarObservaciones();

    function botonDe(nombre) { return root.querySelector('[data-toggle-card2="' + nombre + '"]'); }
    function expandirCard(nombre, card) {
      card.classList.remove('nws-card--collapsed');
      var b = botonDe(nombre); b.querySelector('.nwt-icon i').className = 'naotech-icon-chevron-up'; b.querySelector('button').setAttribute('aria-label', 'Colapsar');
    }
    function colapsarCard(nombre, card) {
      card.classList.add('nws-card--collapsed');
      var b = botonDe(nombre); b.querySelector('.nwt-icon i').className = 'naotech-icon-chevron-down'; b.querySelector('button').setAttribute('aria-label', 'Expandir');
    }
    function onClick(ev) {
      var t = ev.target;
      var tg2 = t.closest('[data-toggle-card2]');
      if (tg2) {
        var nombre = tg2.getAttribute('data-toggle-card2');
        var otro = nombre === 'observacion' ? 'linea' : 'observacion';
        var card = root.querySelector('#card-' + nombre), cardOtro = root.querySelector('#card-' + otro);
        var colapsando = !card.classList.contains('nws-card--collapsed');
        /* DC-173: con las dos cards en 70vh fijo, no pueden estar abiertas
           las dos a la vez — o una o la otra. Al abrir una se colapsa la
           otra; al colapsar la que está abierta, se abre la otra (nunca
           quedan las dos colapsadas). */
        if (colapsando) {
          if (cardOtro.classList.contains('nws-card--collapsed')) { expandirCard(otro, cardOtro); }
        } else {
          colapsarCard(otro, cardOtro);
        }
        var colapsada = card.classList.toggle('nws-card--collapsed');
        tg2.querySelector('.nwt-icon i').className = colapsada ? 'naotech-icon-chevron-down' : 'naotech-icon-chevron-up';
        tg2.querySelector('button').setAttribute('aria-label', colapsada ? 'Expandir' : 'Colapsar');
        return;
      }
      var evb = t.closest('[data-ev]'); if (evb) { st.ev = +evb.getAttribute('data-ev'); pintarEvidencia(); return; }
      var step = t.closest('[data-ev-step]'); if (step) { st.ev = Math.max(0, Math.min(R.evidencias.length - 1, st.ev + (+step.getAttribute('data-ev-step')))); pintarEvidencia(); return; }
      var hl = t.closest('[data-hall]'); if (hl) { if (st.registrado) { return; } var i = +hl.getAttribute('data-hall'), p = st.hall.indexOf(i); p >= 0 ? st.hall.splice(p, 1) : st.hall.push(i); pintarObs(); return; }
      var ob = t.closest('[data-obs]'); if (!ob) { return; }
      var a = ob.getAttribute('data-obs');
      if (a === 'ok') { st.juicio = 'ok'; st.hall = []; pintarObs(); }
      if (a === 'no') { st.juicio = 'no'; pintarObs(); }
      if (a === 'registrar' && st.juicio && st.obs) { st.registrado = true; var ahora = new Date(); st.registradas.unshift({ fecha: D.entidad.fecha.replace('martes ', '') + ' · ' + ('0' + ahora.getHours()).slice(-2) + ':' + ('0' + ahora.getMinutes()).slice(-2), quien: ctx.rol.nombre + ' · ' + ctx.rol.rol, juicio: st.juicio === 'ok' ? 'conforme' : 'hallazgos', hallazgos: st.hall.map(function (i) { return R.hallazgos[i]; }), texto: st.obs }); pintarObservaciones(); pintarObs(); pintarLinea(); ctx.toast({ title: 'Observación registrada', message: R.ruta.codigo + ' pasa a Observada. El cierre se hace desde el tablero.', theme: 'positive', icon: 'positive' }); }
    }
    function onInput(ev) { if (ev.target.matches('[data-field="obs"]')) { st.obs = ev.target.value; var listo = !!st.juicio && st.obs.length > 0 && !st.registrado; root.querySelector('[data-obs="registrar"]').disabled = !listo; } }
    root.addEventListener('click', onClick); root.addEventListener('input', onInput);
    pintarEvidencia(); pintarObs(); pintarLinea();
    return function () { root.removeEventListener('click', onClick); root.removeEventListener('input', onInput); };
  }
};
