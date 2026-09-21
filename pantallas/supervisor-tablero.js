/**
 * Supervisor · tablero (kanban) y tabla de rutas ejecutadas.
 * Solo lectura: el estado de cada tarjeta lo mueven el conductor, el camión
 * y Operador — acá no hay Tomar/Revisar/Cerrar. Tocar una tarjeta/fila abre
 * su evidencia en supervisor-revision.js, para consultar, no para actuar.
 * El cierre real vive en operador/control.js.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['supervisor-tablero'] = {
  menu: 'supervision',
  titulo: 'Dashboard Supervisor',

  /* DC-080: la vista por defecto pasó a ser la tabla, no el tablero — la
     silueta de carga (render, con this.columnas) tiene que ser la de una
     tabla, no la del kanban que antes era el default. Columnas compartidas
     con la tabla real de mount() (pintarVista), mismo patrón que
     admin-hub.js/operador-hub.js. */
  columnas: [
    { label: 'Ruta', style: 'flex:1.2 1 0;min-width:150px' },
    { label: 'Operario', style: 'flex:1 1 0;min-width:160px' },
    { label: 'Ejecutada', style: 'flex:0 0 88px', cls: 'nws-col-center' },
    { label: 'Marcadas', style: 'flex:0 0 120px' },
    { label: 'Evidencias', style: 'flex:0 0 96px', cls: 'nws-col-center' },
    { label: 'Estado', style: 'flex:0 0 150px' },
    { label: 'Plazo', style: 'flex:0 0 112px' }],

  toolbar: function (ctx) {
    var S = ctx.S;
    return {
      body: S.title({ text: 'Dashboard Supervisor', subtitle: 'Historial de rutas — el cierre lo hace Operador' }),
      /* DC-116 (mismo criterio que DC-009/DC-070/DC-114): avatar redundante,
         ya se ve en el pie del sidebar. */
      actions: S.searchbox({ placeholder: 'Buscar por operario', size: 'medium', style: 'width:220px', name: 'sup-q' })
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, V = D.supervision, T = ctx.rol.theme;
    var k = ctx.cargando;
    var stats = S.h('div', { class: 'nws-stats nws-stats--hero' },
      S.statCard({ skeleton: k, label: 'Fuera de plazo', valueHtml: S.h('span', { class: 'nws-delta' }, V.metricas.fueraDePlazo, S.badge({ label: '+48 h', size: 'small', theme: 'negative' })), hint: 'ejecutadas hace más de dos días', cls: 'nws-stat-hero', theme: T }),
      S.statCard({ skeleton: k, label: 'Pendientes de verificación', bindValue: 'nPor', value: '—', hint: 'la más antigua lleva 3 días sin verificar', icon: 'attention', theme: T }),
      S.statCard({ skeleton: k, label: 'Verificadas esta semana', bindValue: 'nObs', value: '—', hint: '3 conformes · 2 con hallazgos', icon: 'visibility-on', theme: T }),
      S.statCard({ skeleton: k, label: 'Conformidad · septiembre', valueHtml: S.h('span', { class: 'nws-delta' }, V.metricas.conformidadMes, S.badge({ label: V.metricas.variacion, size: 'small', theme: 'positive' })), theme: T,
        extra: S.h('div', { class: 'nws-spark' }, V.metricas.sparkline.map(function (v) { return '<i style="height:' + v + '%"></i>'; })) }));

    /* DC-080: silueta de carga de la TABLA (default nuevo), no del tablero. */
    var tablero = k ? S.card({ cls: 'nws-card--fill nws-card--flush', style: 'flex:1;min-width:0', content: S.datatable({ skeleton: true, columns: this.columnas }) }) : '';

    return stats +
      S.h('div', { class: 'nws-tabla__head', style: 'margin-top:var(--naotech-sizing-8)' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Todas las rutas ejecutadas'),
        S.badge({ label: '—', size: 'small', theme: 'neutral', cls: 'bind-nTotalVis' }),
        S.h('div', { class: 'nws-grow' }),
        S.button({ label: 'Exportar informe', icon: 'download', size: 'small', variant: 'mute', theme: T, attrs: { 'data-toast': 'informe' } }),
        /* DC-080: carga primero Tabla, no Tablero. */
        S.tagGroup({ id: 'seg-vista', size: 'large', theme: T, value: 'tb', items: [{ id: 'k', label: 'Tablero', value: 'kb' }, { id: 't', label: 'Tabla', value: 'tb' }] })) +
      S.h('div', { id: 'sup-vista', class: 'nws-page' }, tablero);
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, V = D.supervision, T = ctx.rol.theme, e = S.esc, COLS = this.columnas;
    /* DC-081: "solo dejar Pendiente" — antes "Pendiente de verificación". */
    var ESTLABEL = ['Pendiente', 'En verificación', 'Verificada', 'Cerrada por Operador'];
    var ESTTHEME = ['neutral', 'informative', 'primary', 'positive'];
    /* DC-080: la tabla es la vista por defecto, no el tablero. */
    var st = { vista: 'tb', q: '', cards: V.cards.map(function (c) { return Object.assign({}, c); }) };
    function bind(k, v) { document.querySelectorAll('[data-bind="' + k + '"]').forEach(function (n) { n.textContent = v; }); }
    function visibles() { var q = st.q.toLowerCase(); return st.cards.filter(function (c) { return !q || c.operario.toLowerCase().indexOf(q) >= 0; }); }

    function deco(c) {
      var p = Math.round(c.m / c.t * 100), completa = c.m === c.t, atraso = c.dias >= 3 && c.col < 2;
      return {
        sla: atraso ? 'hace ' + c.dias + ' d' : c.dias <= 1 ? 'reciente' : 'hace ' + c.dias + ' d', slaTheme: atraso ? 'negative' : 'neutral',
        pct: p, barTheme: completa ? 'positive' : 'caution', estado: ESTLABEL[c.col], estadoTheme: ESTTHEME[c.col]
      };
    }

    function pintarVista() {
      var vis = visibles();
      bind('nPor', st.cards.filter(function (c) { return c.col === 0; }).length);
      bind('nObs', st.cards.filter(function (c) { return c.col === 2; }).length);
      var bTot = document.querySelector('.bind-nTotalVis .nwt-badge__label'); if (bTot) { bTot.textContent = vis.length; }
      var html;
      if (st.vista === 'kb') {
        html = S.h('div', { class: 'nws-kanban' }, V.columnas.map(function (col) {
          var cs = vis.filter(function (c) { return c.col === col.id; });
          return S.h('div', { class: 'nws-kanban__col', 'nwt-theme': col.theme },
            S.h('div', { class: 'nws-kanban__head' }, S.h('span', { class: 'nws-kanban__dot' }), S.h('span', { class: 'nwt-caption-font-semibold nws-grow' }, e(col.titulo)), S.badge({ label: cs.length, size: 'small', theme: 'neutral' })),
            S.h('div', { class: 'nws-kanban__body' }, cs.length ? cs.map(function (c) {
              var d = deco(c);
              return S.card({ size: 'small', onClick: true, attrs: { 'data-card': c.id, 'nwt-theme': T }, content:
                S.h('div', { class: 'nws-row', style: 'align-items:flex-start;margin-bottom:var(--naotech-sizing-24)' }, S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nwt-body-font-bold' }, e(c.codigo)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(c.zona + ' · ' + c.fecha))), S.badge({ label: d.sla, size: 'small', theme: d.slaTheme })) +
                S.progress({ value: d.pct, size: 'small' }) +
                S.h('div', { class: 'nws-row nwt-smalltext-font-regular nws-muted', style: 'justify-content:space-between' }, S.h('span', null, c.m + ' / ' + c.t + ' marcadas'), S.h('span', null, c.fotos + ' evidencias')) +
                S.h('div', { class: 'nws-kanban__foot' }, S.avatar({ text: c.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-grow nws-clip' }, e(c.operario)),
                  S.badge({ label: d.estado, size: 'medium', theme: d.estadoTheme })) });
            }) : S.h('div', { class: 'nws-kanban__empty nwt-smalltext-font-regular' }, S.icon('positive'), 'sin rutas acá')));
        }));
      } else {
        html = S.h('div', { class: 'nws-col', style: 'flex:1;min-width:0;gap:var(--naotech-sizing-8)' },
          S.card({ cls: 'nws-card--fill nws-card--flush', style: 'flex:1;min-width:0', attrs: { 'nwt-theme': T },
            content: S.datatable({
              columns: COLS,
              rows: vis.map(function (c) {
                var d = deco(c);
                return { cls: 'nws-list__row--click', attrs: { 'data-card': c.id }, cells: [
                  S.h('span', null, S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-body-font-semibold' }, e(c.codigo)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(c.zona)))),
                  S.h('span', null, S.h('div', { class: 'nws-row' }, S.avatar({ text: c.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }), S.h('span', { class: 'nwt-caption-font-regular' }, e(c.operario)))),
                  S.h('span', { class: 'nwt-caption-font-regular' }, e(c.fecha)),
                  S.h('span', { style: 'width:100%' }, S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-4)' }, S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, c.m + ' / ' + c.t), S.progress({ value: d.pct, size: 'small' }))),
                  S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, c.fotos),
                  S.badge({ label: d.estado, size: 'medium', theme: d.estadoTheme }),
                  S.badge({ label: d.sla, size: 'medium', theme: d.slaTheme })
                ] };
              })
            }) }));
      }
      S.repintar(root.querySelector('#sup-vista'), html);
    }

    function verDetalle(origen) { ctx.ir('#/supervisor/revision'); }

    function onClick(ev) {
      var t = ev.target;
      var cd = t.closest('[data-card]'); if (cd) { verDetalle(cd); return; }
    }
    function onDoc(ev) {
      var seg = ev.target.closest('#seg-vista [data-seg]');
      if (seg) { st.vista = seg.getAttribute('data-seg'); document.querySelectorAll('#seg-vista [data-seg]').forEach(function (b) { var on = b === seg; b.classList.toggle('nwt-tag-group__tag--active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); }); ctx.posicionarIndicadores(document); pintarVista(); }
    }
    function onInput(ev) { if (ev.target.matches('[data-search="sup-q"]')) { st.q = ev.target.value; pintarVista(); } }
    root.addEventListener('click', onClick); document.addEventListener('click', onDoc); document.addEventListener('input', onInput);
    pintarVista();
    return function () { root.removeEventListener('click', onClick); document.removeEventListener('click', onDoc); document.removeEventListener('input', onInput); };
  }
};
