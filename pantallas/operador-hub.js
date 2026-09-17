/**
 * Operador · hub con métricas en vivo.
 * En calle ahora / próximos a salir, rutas recibidas por asignar (con el
 * asistente Operario → Equipo → Confirmar) y completadas de hoy.
 */
/* Fila de "Completadas hoy": la usa render y también mount cuando una ruta
   en calle termina y baja a esta lista (DC-348). */
function filaCompletada(S, D, c) {
        return S.h('div', { class: 'nws-list__row', style: 'flex-direction:column;align-items:stretch;gap:var(--naotech-sizing-6)' },
          S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-smalltext-font-bold nws-grow' }, S.esc(c.codigo)), S.badge({ label: D.estados.ejecutada.label, size: 'medium', theme: D.estados.ejecutada.theme })),
          S.h('div', { class: 'nws-row nws-row--sm nwt-smalltext-font-regular nws-muted' }, S.icon('user'), S.esc(c.operario + ' · ' + c.horario)),
          S.h('div', { class: 'nws-note nwt-smalltext-font-regular' }, S.esc(c.resumen)));
}

window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['operador-hub'] = {
  menu: 'hoy',
  titulo: 'Operación del día',

  /* Las columnas las necesitan los dos lados —el esqueleto en render, antes de
     que haya datos, y la tabla real en pintarRecibidas— así que viven acá y se
     llegan por `this`: render y mount se invocan como métodos de la pantalla. */
  /* DC-357: anchos por contenido para las cortas, flex para las de texto. */
  columnas: [
    { label: 'Ruta', style: 'flex:1 1 0;min-width:160px' },
    { label: 'Unidades', style: 'flex:0 0 80px', cls: 'nws-col-center' },
    { label: 'Operario sugerido', style: 'flex:1 1 0;min-width:180px' },
    { label: 'Recibida', style: 'flex:0 0 104px' },
    { label: 'Acción', actions: true, style: 'flex:0 0 96px' }
  ],

  toolbar: function (ctx) {
    var S = ctx.S, rol = ctx.rol, D = ctx.D;
    return {
      body: S.h('div', { class: 'nws-title-strong' }, S.title({ text: 'Operación del día', subtitle: 'Zona Norte · ' + D.entidad.fecha })),
      actions: S.h('span', { class: 'nws-live nwt-smalltext-font-regular' }, S.h('span', { class: 'nws-live__dot' }), 'actualizado hace ', S.h('span', { 'data-bind': 'hace' }, '3'), ' s') +
               S.button({ label: 'Exportar', icon: 'download', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'exportar' } })
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, O = D.operador, T = ctx.rol.theme;
    var k = ctx.cargando;

    /* La primera tarjeta arranca en '—' incluso ya cargada: su valor lo llena
       pintarStats sumando el avance en vivo. En la fase de carga igual va con
       esqueleto — un guión y un esqueleto no dicen lo mismo, el guión es un
       dato vacío y esto todavía no llegó. */
    var stats = S.h('div', { class: 'nws-stats nws-stats--hero' },
      S.statCard({ skeleton: k, label: 'Unidades recolectadas hoy', bindValue: 'totalHechas', value: '—', bindHint: 'heroHint', cls: 'nws-stat-hero', theme: T,
        extra: S.progress({ value: 0, size: 'medium', theme: T, cls: 'nws-stat-progress' }).replace('class="nwt-progress-bar', 'data-bind-progress="hero" class="nwt-progress-bar') }),
      S.statCard({ skeleton: k, label: 'Rutas en curso', value: O.enCalle.length, hint: 'de 5 programadas para hoy', icon: 'shipping', theme: T }),
      S.statCard({ skeleton: k, label: 'Operarios en calle', valueHtml: S.h('span', { class: 'nws-delta' }, '3', S.h('span', { class: 'nwt-caption-font-regular nws-muted' }, 'de 8')), hint: '2 en turno de tarde · 3 libres', theme: T,
        extra: S.progress({ value: 3 / 8 * 100, size: 'medium', cls: 'nws-stat-progress' }) }),
      S.statCard({ skeleton: k, label: 'Completadas hoy', valueHtml: S.h('span', { class: 'nws-delta' }, O.completadasHoy.length, S.badge({ label: O.metricas.variacionHoy, size: 'small', theme: 'positive' })), hint: '67 unidades · 0 pendientes de evidencia', theme: T,
        extra: S.h('div', { class: 'nws-spark' }, O.metricas.sparkline.map(function (v) { return '<i style="height:' + v + '%"></i>'; })) }));

    /* DC-347: el segmentor flota arriba, desacoplado de la card (patrón
       nws-tabla, el mismo de la tabla del admin); la card queda solo con la
       lista. El chip "en vivo" de la derecha se elimina: el toolbar ya dice
       "actualizado hace N s", era redundante. */
    var calle = S.h('div', { class: 'nws-tabla', style: 'flex:none' },
      S.h('div', { class: 'nws-tabla__head' },
        S.tagGroup({ id: 'seg-calle', size: 'large', theme: T, value: 'calle', items: [
          { id: 'c', label: 'En calle ahora (' + O.enCalle.length + ')', value: 'calle' },
          { id: 'p', label: 'Próximos a salir (' + O.proximos.length + ')', value: 'prox' }] })),
      S.card({
        cls: 'nws-card--flush', attrs: { 'nwt-theme': T },
        /* La lista la llena pintarCalle desde mount, que en carga no corre. Tres
           siluetas y no las 3 filas exactas de O.enCalle: cuántos hay en calle es
           justamente lo que todavía no se sabe. */
        content: S.h('div', { class: k ? 'nws-stack--sm' : 'nws-list', id: 'lista-calle', style: k ? 'padding:var(--naotech-sizing-16)' : undefined },
          k ? [0, 1, 2].map(function () { return S.card({ skeleton: true, size: 'small' }); }) : '')
      }));

    /* Tabla desacoplada (DC-357, regla general): título, contador y acción
       flotan arriba; la card contiene solo el NwtDatatable. */
    var recibidas = S.h('div', { class: 'nws-tabla', style: 'flex:1.45', id: 'card-recibidas' },
      S.h('div', { class: 'nws-tabla__head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Nuevas rutas recibidas'),
        S.badge({ label: O.porAsignar.length, size: 'small', theme: 'neutral', cls: 'bind-nPorAsignar' }),
        S.h('div', { class: 'nws-grow' }),
        S.iconButton({ icon: 'refresh', size: 'small', variant: 'mute', theme: 'neutral', label: 'Actualizar', attrs: { 'data-toast': 'lote' } })),
      S.card({
        cls: 'nws-card--fill nws-card--flush', style: 'min-width:0', attrs: { 'nwt-theme': T },
        content: S.h('div', { id: 'tabla-recibidas', class: 'nws-grow', style: 'display:flex;flex-direction:column;min-height:0' },
          k ? S.datatable({ skeleton: true, columns: this.columnas }) : '')
      }));

    var completadas = S.card({
      cls: 'nws-card--fill nws-card--flush', style: 'flex:0 0 340px', attrs: { 'nwt-theme': T },
      header: S.h('div', { class: 'nws-card-head' },
        S.icon('positive', 'nws-soft'),
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Completadas hoy'),
        S.badge({ label: O.completadasHoy.length, size: 'small', theme: 'neutral', cls: 'bind-nCompletadas' })),
      content: k ? S.h('div', { class: 'nws-stack', style: 'padding:var(--naotech-sizing-16)' },
          [0, 1, 2].map(function () { return S.card({ skeleton: true, header: 1, size: 'small' }); }))
        : S.h('div', { class: 'nws-list nws-list--zebra', id: 'lista-completadas' }, O.completadasHoy.map(function (c) { return filaCompletada(S, D, c); })),
      footer: S.button({ label: 'Ver histórico completo', size: 'small', variant: 'quiet', theme: T, attrs: { style: 'width:100%', 'data-toast': 'historico' } })
    });

    var modal = S.modal({
      id: 'modal-asignar', cls: 'nws-modal-wide', theme: T,
      title: 'Asignar ruta', bindTitle: 'asTitulo', bindSubtitle: 'asSub', subtitle: 'Paso 1 de 3 · Operario',
      body: S.h('div', { class: 'nws-modal__body' },
        S.stepper({ steps: O.asignar.pasos, position: 1, theme: T, cls: 'as-stepper' }),
        S.h('div', { id: 'as-cuerpo', class: 'nws-modal__body nws-modal__cuerpo' })) +
        S.h('div', { class: 'nws-modal__foot' },
          S.button({ label: 'Atrás', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-as': 'atras' } }),
          S.h('div', { class: 'nws-grow nwt-smalltext-font-regular nws-muted', 'data-bind': 'asPista' }),
          S.button({ label: 'Continuar', size: 'medium', variant: 'loud', theme: T, attrs: { 'data-as': 'ok' } }))
    });

    return stats + calle + S.h('div', { class: 'nws-split', style: 'min-height:70vh;max-height:70vh' }, recibidas, completadas) + modal;
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, O = D.operador, T = ctx.rol.theme, e = S.esc;
    var COLS = this.columnas;
    var opPorId = {}; D.operarios.forEach(function (o) { opPorId[o.id] = o; });
    var eqPorId = {}; D.equipos.forEach(function (q) { eqPorId[q.id] = q; });
    var st = {
      hace: 3, vista: 'calle',
      enCalle: O.enCalle.map(function (o) { return Object.assign({}, o); }),
      rutas: O.porAsignar.slice(),
      modal: false, paso: 1, rutaId: null, operarioId: null, recolectorIds: [], rolTab: 'conductor', equipoId: null, q: ''
    };
    function bind(k, v) { document.querySelectorAll('[data-bind="' + k + '"]').forEach(function (n) { n.textContent = v; }); }

    function pintarStats() {
      var h = 0, m = 0; st.enCalle.forEach(function (o) { h += o.hechas; m += o.total; });
      var total = O.base.hechas + h, meta = O.base.hechas + m + O.base.extraMeta, pct = Math.round(total / meta * 100);
      bind('totalHechas', total); bind('heroHint', pct + '% de la meta del día · ' + meta + ' unidades · 3 rutas en calle'); bind('hace', st.hace);
      var bar = root.querySelector('[data-bind-progress="hero"]'); if (bar) { bar.setAttribute('aria-valuenow', pct); bar.querySelector('.nwt-progress-bar__fill').style.width = pct + '%'; }
    }

    function pintarCalle() {
      var html = st.vista === 'calle'
        ? st.enCalle.map(function (o) {
            var p = Math.round(o.hechas / o.total * 100);
            var estado = p >= 100 ? ['Terminó', 'positive'] : p >= 60 ? ['Adelantado', 'positive'] : p <= 20 ? ['Arrancando', 'neutral'] : ['En ruta', 'informative'];
            return S.h('div', { class: 'nws-list__row', 'data-o': o.id },
              S.avatar({ text: o.ini, size: 'small', variant: 'quiet', theme: T }),
              S.h('div', { class: 'nws-col', style: 'flex:0 0 170px;min-width:0' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(o.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-clip' }, e(o.ruta + ' · ' + o.camion))),
              S.h('div', { class: 'nws-grow nws-col', style: 'gap:var(--naotech-sizing-6)' },
                S.h('div', { class: 'nws-row nws-row--md nwt-smalltext-font-regular nws-muted' },
                  S.h('span', null, 'inicio ' + o.inicio), S.h('span', null, 'última marca ' + o.ultima), S.h('span', null, 'ETA ' + o.eta),
                  S.h('div', { class: 'nws-grow' }),
                  S.h('span', { class: 'nwt-smalltext-font-semibold nws-dark nws-tnum', 'data-bind-hechas': o.id }, o.hechas + ' / ' + o.total)),
                S.progress({ value: p, size: 'medium', theme: T }).replace('class="nwt-progress-bar', 'data-bind-progress="' + o.id + '" class="nwt-progress-bar')),
              S.h('div', { class: 'nws-col-badge' }, S.badge({ label: estado[0], size: 'medium', theme: estado[1] }).replace('class="nwt-badge', 'data-bind-estado="' + o.id + '" class="nwt-badge')),
              S.button({ label: 'Seguir', size: 'small', variant: 'quiet', theme: T, attrs: { 'data-ir': '#/operador/ruta' } }));
          }).join('')
        : O.proximos.map(function (p) {
            return S.h('div', { class: 'nws-list__row' },
              S.avatar({ text: p.ini, size: 'small', variant: 'quiet', theme: 'neutral' }),
              S.h('div', { class: 'nws-col', style: 'flex:0 0 170px;min-width:0' }, S.h('span', { class: 'nwt-caption-font-semibold' }, e(p.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-clip' }, e(p.ruta + ' · ' + p.camion))),
              S.h('div', { class: 'nws-grow nws-row', style: 'gap:var(--naotech-sizing-8)' },
                S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-grow nws-clip' }, e(p.nota)),
                S.h('span', { class: 'nwt-caption-font-regular nws-nowrap' }, 'Sale ' + p.salida + ' · ' + p.unidades + ' unidades · ' + p.km)),
              S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, e(p.falta)),
              S.h('div', { class: 'nws-col-badge' }, S.badge({ label: D.estados.programada.label, size: 'medium', theme: D.estados.programada.theme })),
              S.button({ label: 'Ver ruta', size: 'small', variant: 'quiet', theme: T, attrs: { 'data-toast': 'verruta' } }));
          }).join('');
      S.repintar(root.querySelector('#lista-calle'), html);
    }

    /* DC-294: el timer llamaba pintarCalle() en cada tick, que reconstruye el
       innerHTML — cada barra nace ya en su ancho final y la transición de
       `.nwt-progress-bar__fill` nunca tiene un "antes" del que animar. Acá se
       actualiza en el sitio (mismo nodo, sin repintar), igual que pintarStats
       hace con la barra del hero. */
    function actualizarProgresoCalle() {
      st.enCalle.forEach(function (o) {
        var fila = root.querySelector('[data-o="' + o.id + '"]'); if (!fila) { return; }
        var p = Math.round(o.hechas / o.total * 100);
        var estado = p >= 100 ? ['Terminó', 'positive'] : p >= 60 ? ['Adelantado', 'positive'] : p <= 20 ? ['Arrancando', 'neutral'] : ['En ruta', 'informative'];
        var bar = fila.querySelector('[data-bind-progress="' + o.id + '"]');
        if (bar) { bar.setAttribute('aria-valuenow', p); bar.querySelector('.nwt-progress-bar__fill').style.width = p + '%'; }
        var cont = fila.querySelector('[data-bind-hechas="' + o.id + '"]'); if (cont) { cont.textContent = o.hechas + ' / ' + o.total; }
        var badge = fila.querySelector('[data-bind-estado="' + o.id + '"]');
        if (badge) { badge.setAttribute('nwt-theme', estado[1]); badge.querySelector('.nwt-badge__label').textContent = estado[0]; }
      });
    }

    function pintarRecibidas() {
      root.querySelector('.bind-nPorAsignar .nwt-badge__label').textContent = st.rutas.length;
      root.querySelector('#tabla-recibidas').innerHTML = st.rutas.length ? S.datatable({
        columns: COLS,
        rows: st.rutas.map(function (r) {
          var s = opPorId[r.sugerido];
          return { cells: [
            S.h('span', null, S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(r.codigo)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(r.modo + ' · ' + r.sector)))),
            S.h('span', { class: 'nwt-smalltext-font-semibold nws-tnum' }, r.unidades),
            S.h('span', null, S.h('div', { class: 'nws-row' }, S.avatar({ text: s.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }), S.h('span', { class: 'nwt-caption-font-regular' }, e(s.nombre)))),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(r.recibida)),
            S.button({ label: 'Asignar', size: 'small', variant: 'loud', theme: T, attrs: { 'data-asignar': r.id } })
          ] };
        })
      }) : S.emptyState({ title: 'Todo asignado', description: 'No quedan rutas recibidas sin operario. Las nuevas aparecen acá en cuanto la UAESP las entregue.' });
    }

    var PASOS = O.asignar.pasos;
    function pintarModal(quieto) {
      var m = root.querySelector('#modal-asignar'); m.classList.toggle('nwt-modal--visible', st.modal);
      if (!st.modal) { return; }
      var ruta = st.rutas.filter(function (r) { return r.id === st.rutaId; })[0] || { codigo: '—', unidades: 0, sector: '—', modo: '—' };
      var op = opPorId[st.operarioId], eq = eqPorId[st.equipoId];
      var recolectores = st.recolectorIds.map(function (id) { return opPorId[id]; });
      bind('asTitulo', 'Asignar ' + ruta.codigo); bind('asSub', 'Paso ' + st.paso + ' de 3 · ' + PASOS[st.paso - 1]);
      root.querySelector('.as-stepper').outerHTML = S.stepper({ steps: PASOS, position: st.paso, theme: T, cls: 'as-stepper' });
      var okLabel = 'Continuar', okOk = false, pista = 'Elegí quién la hace', html = '';
      if (st.paso === 1) {
        okOk = !!op && recolectores.length > 0;
        pista = op ? op.nombre + ' (conductor)' + (recolectores.length ? ' · ' + recolectores.length + ' recolector' + (recolectores.length > 1 ? 'es' : '') : ' · falta elegir recolectores') : pista;
        var q = st.q.toLowerCase(), vis = D.operarios.filter(function (o) { return o.rol === st.rolTab && (!q || o.nombre.toLowerCase().indexOf(q) >= 0); });
        html = S.h('div', { class: 'nws-row nws-row--md', style: 'padding:var(--naotech-sizing-10) 0;border-top:1px solid var(--naotech-app-color-200);border-bottom:1px solid var(--naotech-app-color-200)' },
            S.searchbox({ placeholder: 'Buscar operario…', size: 'medium', value: st.q, name: 'as-q', style: 'width:300px' }),
            S.h('span', { class: 'nwt-caption-font-regular nws-dark' }, ruta.unidades + ' unidades · ' + ruta.sector),
            S.h('div', { class: 'nws-grow' }),
            S.tagGroup({ id: 'as-rol', size: 'large', theme: T, value: st.rolTab, items: [{ id: 'conductor', label: 'Conductor', value: 'conductor' }, { id: 'recolector', label: 'Recolectores', value: 'recolector' }] })) +
          S.h('div', { class: 'nws-pick-grid' }, vis.map(function (o) {
            var on = st.rolTab === 'conductor' ? o.id === st.operarioId : st.recolectorIds.indexOf(o.id) >= 0;
            return S.card({ size: 'small', onClick: o.libre, cls: S.cls('nws-pick', on && 'nws-pick--on', !o.libre && 'nws-pick--off'), attrs: o.libre ? { 'data-as-op': o.id, 'nwt-theme': T } : { 'aria-disabled': 'true' },
              content: S.h('div', { class: 'nws-row', style: 'align-items:flex-start' }, S.avatar({ text: o.ini, size: 'small', variant: 'quiet', theme: 'neutral' }),
                  S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nwt-body-font-semibold' }, e(o.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-clip' }, e(o.turno))),
                  S.badge({ label: o.libre ? 'Disponible' : 'En ruta', size: 'medium', theme: o.libre ? 'positive' : 'informative' })) +
                S.h('div', { class: 'nws-pick__stats' },
                  S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, o.rutas + ' rutas'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Esta semana')),
                  S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, o.ritmo), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Unidades/h')),
                  S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, o.conformidad), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Conformidad'))) });
          }));
      }
      if (st.paso === 2) {
        okOk = !!eq; okLabel = 'Revisar'; pista = eq ? eq.nombre + ' · cuadrilla de ' + eq.cuadrilla : 'Elegí con qué equipo';
        html = S.h('span', { class: 'nwt-caption-font-regular nws-muted' }, 'Equipo para ' + e(op.nombre) + ' · ' + ruta.unidades + ' unidades') +
          S.h('div', { class: 'nws-pick-grid nws-pick-grid--2' }, D.equipos.map(function (q) {
            return S.card({ size: 'small', onClick: q.libre, cls: S.cls('nws-pick', q.id === st.equipoId && 'nws-pick--on', !q.libre && 'nws-pick--off'), attrs: q.libre ? { 'data-as-eq': q.id, 'nwt-theme': T } : { 'aria-disabled': 'true' },
              content: S.h('div', { class: 'nws-row', style: 'align-items:flex-start' }, S.h('div', { class: 'nws-pick__foto nws-pick__foto--tall', style: q.foto ? 'background-image:url(' + q.foto + ');background-size:cover;background-position:center' : '' }, q.foto ? '' : S.icon('vehicles')),
                  S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nwt-body-font-semibold' }, e(q.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(q.tipo + ' · ' + q.placa)),
                    S.h('div', { class: 'nws-pick__stats' },
                      S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, e(q.capacidad)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Capacidad')),
                      S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, q.cuadrilla + ' personas'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Cuadrilla')))),
                  S.badge({ label: q.mantenimiento ? 'En mantenimiento' : q.libre ? 'Libre' : 'Ocupado', size: 'medium', theme: q.mantenimiento ? 'negative' : q.libre ? 'positive' : 'caution' })) });
          }));
      }
      if (st.paso === 3) {
        okOk = true; okLabel = 'Asignar ruta'; pista = 'La ruta pasa a estado Asignada';
        html = S.h('div', { class: 'nws-split', style: 'min-height:260px' },
          S.h('div', { class: 'nws-pick__foto nws-pick__foto--tall', style: 'flex:0 0 auto;width:160px;height:auto;' + (eq.foto ? 'background-image:url(' + eq.foto + ');background-size:cover;background-position:center' : '') },
            eq.foto ? '' : S.icon('vehicles')),
          S.h('div', { class: 'nws-col', style: 'flex:0 0 360px;gap:var(--naotech-sizing-10)' },
            S.h('span', { class: 'nwt-overline-font-semibold nws-muted' }, 'Qué pasa después'),
            S.timeline({ items: [
              { title: 'Asignada', subtitle: 'ahora · aparece en el teléfono de ' + op.nombre, theme: T },
              { title: 'Programada', subtitle: 'cuando el operario le ponga fecha — ahí ya no podés reasignar' },
              { title: 'En ejecución', subtitle: 'vas a verla en «En calle ahora» con su avance' }] })),
          S.h('div', { class: 'nws-col nws-grow nws-ticket' },
            S.h('div', { class: 'nws-ticket__head' }, S.icon('shipping'), S.h('span', { class: 'nwt-caption-font-semibold' }, 'Qué se va a asignar')),
            S.h('div', { class: 'nws-ticket__body nws-ticket__body--mono' },
              [['Ruta', ruta.codigo], ['Trazada por', 'UAESP · ' + ruta.modo], ['Unidades', ruta.unidades + ' · ' + ruta.sector], ['Conductor', op.nombre], ['Recolectores', recolectores.map(function (r) { return r.nombre; }).join(', ')], ['Equipo', eq.nombre + ' · ' + eq.cuadrilla + ' personas'], ['Carga resultante', (op.rutas + 1) + ' rutas esta semana']]
                .map(function (kv) { return S.h('div', { class: 'nws-kv nwt-body-font-regular' }, S.h('span', { class: 'nws-kv__k' }, kv[0]), S.h('span', { class: 'nws-kv__v nwt-body-font-medium nws-tnum' }, e(kv[1]))); }))));
      }
      /* DC-305: elegir una card (conductor o recolector) no cambia de paso ni
         de lista — es solo un toggle de selección, y no debería disparar el
         fade + animación de alto que sí tiene sentido al cambiar de paso o
         de pestaña. */
      if (quieto) { root.querySelector('#as-cuerpo').innerHTML = html; } else { S.repintar(root.querySelector('#as-cuerpo'), html); }
      /* La primera vez que se abre el modal, el segmentor mide su pastilla
         en el mismo tick en que el modal recién se hace visible — a veces
         antes de que termine el primer layout real, y la pastilla queda
         mal encajada. Mismo parche de un frame extra que ya usa app.js al
         entrar a una pantalla nueva. */
      if (st.paso === 1) { ctx.posicionarIndicadores(root); requestAnimationFrame(function () { ctx.posicionarIndicadores(root); }); }
      bind('asPista', pista);
      var ok = root.querySelector('[data-as="ok"]'); ok.querySelector('.nwt-button__content').textContent = okLabel; ok.disabled = !okOk;
      root.querySelector('[data-as="atras"]').disabled = st.paso === 1;
    }

    function onClick(ev) {
      var t = ev.target;
      var seg = t.closest('#seg-calle [data-seg]'); if (seg) { st.vista = seg.getAttribute('data-seg'); root.querySelectorAll('#seg-calle [data-seg]').forEach(function (b) { var on = b === seg; b.classList.toggle('nwt-tag-group__tag--active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); }); ctx.posicionarIndicadores(root); pintarCalle(); return; }
      var asg = t.closest('[data-asignar]'); if (asg) { st = Object.assign(st, { modal: true, paso: 1, rutaId: +asg.getAttribute('data-asignar'), operarioId: null, recolectorIds: [], rolTab: 'conductor', equipoId: null, q: '' }); pintarModal(); return; }
      if (t.closest('[data-close-modal]')) { st.modal = false; pintarModal(); return; }
      var rolTab = t.closest('#as-rol [data-seg]'); if (rolTab) { st.rolTab = rolTab.getAttribute('data-seg'); pintarModal(); return; }
      var op = t.closest('[data-as-op]');
      if (op) {
        var id = op.getAttribute('data-as-op');
        if (st.rolTab === 'conductor') {
          /* Elegir conductor sí cambia de lista (pasa a recolector) — eso
             sigue siendo un repintado, sin el fade. */
          st.operarioId = id; st.rolTab = 'recolector';
          pintarModal(true); return;
        }
        /* DC-310: marcar/desmarcar un recolector no cambia de lista ni de
           pestaña — no hay nada que repintar. Se toggle la card en el sitio
           y se actualizan pista/botón a mano, sin tocar el resto del DOM. */
        var p = st.recolectorIds.indexOf(id);
        if (p >= 0) { st.recolectorIds.splice(p, 1); op.classList.remove('nws-pick--on'); }
        else if (st.recolectorIds.length < 5) { st.recolectorIds.push(id); op.classList.add('nws-pick--on'); }
        var opSel = opPorId[st.operarioId];
        var recolectores2 = st.recolectorIds.map(function (rid) { return opPorId[rid]; });
        bind('asPista', opSel.nombre + ' (conductor)' + (recolectores2.length ? ' · ' + recolectores2.length + ' recolector' + (recolectores2.length > 1 ? 'es' : '') : ' · falta elegir recolectores'));
        root.querySelector('[data-as="ok"]').disabled = recolectores2.length === 0;
        return;
      }
      var eq = t.closest('[data-as-eq]'); if (eq) { st.equipoId = eq.getAttribute('data-as-eq'); pintarModal(); return; }
      var as = t.closest('[data-as]');
      if (as) {
        var a = as.getAttribute('data-as');
        if (a === 'atras' && st.paso > 1) { st.paso--; pintarModal(); }
        if (a === 'ok') {
          if (st.paso < 3) { st.paso++; pintarModal(); }
          else {
            var ruta = st.rutas.filter(function (r) { return r.id === st.rutaId; })[0];
            st.rutas = st.rutas.filter(function (r) { return r.id !== st.rutaId; }); st.modal = false; pintarModal(); pintarRecibidas();
            ctx.toast({ title: ruta.codigo + ' asignada', message: 'Conductor ' + opPorId[st.operarioId].nombre + ' + ' + st.recolectorIds.length + ' recolector' + (st.recolectorIds.length > 1 ? 'es' : '') + ' con ' + eqPorId[st.equipoId].nombre + '. Ya aparece en su teléfono.', theme: 'positive', icon: 'positive' });
          }
        }
      }
    }
    function onInput(ev) { if (ev.target.matches('[data-search="as-q"]')) { st.q = ev.target.value; var pos = ev.target.selectionStart; pintarModal(); var i = root.querySelector('[data-search="as-q"]'); i.focus(); i.setSelectionRange(pos, pos); } }
    function onKey(ev) { if (ev.key === 'Escape' && st.modal) { st.modal = false; pintarModal(); } }
    root.addEventListener('click', onClick); root.addEventListener('input', onInput); document.addEventListener('keydown', onKey);

    pintarStats(); pintarCalle(); pintarRecibidas();
    var timer = setInterval(function () {
      /* DC-348 / DC-002: "que progresen es que se muevan, no que desaparezcan":
         las rutas avanzan (barra y contador se mueven en su fila) y, cuando una
         pasa a otra en avance, la lista se reordena por % — nadie se va de la
         lista; al llegar al total queda en "Terminó". */
      st.enCalle.forEach(function (o) { if (o.hechas < o.total && Math.random() < 0.7) { o.hechas = Math.min(o.total, o.hechas + 1); } });
      st.hace = (st.hace % 9) + 1;
      var orden = st.enCalle.slice().sort(function (a, b) { return (b.hechas / b.total) - (a.hechas / a.total); });
      var cambio = orden.some(function (o, i) { return o !== st.enCalle[i]; });
      if (cambio) { st.enCalle = orden; if (st.vista === 'calle') { pintarCalle(); } }
      pintarStats(); if (st.vista === 'calle') { actualizarProgresoCalle(); }
    }, 2200);
    return function () { clearInterval(timer); root.removeEventListener('click', onClick); root.removeEventListener('input', onInput); document.removeEventListener('keydown', onKey); };
  }
};
