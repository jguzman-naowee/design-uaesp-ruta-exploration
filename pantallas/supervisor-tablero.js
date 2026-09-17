/**
 * Supervisor · tablero (kanban) y tabla de rutas ejecutadas.
 * Tomar → Revisar → Cerrar, con confirmación al tomar y aviso de qué pasó.
 * El detalle de una ruta en revisión vive en supervisor-revision.js: acá no
 * hay panel propio, tocar la tarjeta/fila dispara la misma acción que su
 * botón.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['supervisor-tablero'] = {
  menu: 'supervision',
  titulo: 'Supervisión',

  toolbar: function (ctx) {
    var S = ctx.S, rol = ctx.rol;
    return {
      body: S.title({ text: 'Supervisión', subtitle: 'Rutas ejecutadas pendientes de observación' }),
      actions: S.searchbox({ placeholder: 'Buscar por operario', size: 'medium', style: 'width:220px', name: 'sup-q' }) +
               S.avatar({ text: rol.iniciales, size: 'small', variant: 'loud', theme: rol.theme })
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, V = D.supervision, T = ctx.rol.theme;
    var k = ctx.cargando;
    var stats = S.h('div', { class: 'nws-stats nws-stats--hero' },
      S.statCard({ skeleton: k, label: 'Fuera de plazo', valueHtml: S.h('span', { class: 'nws-delta' }, V.metricas.fueraDePlazo, S.badge({ label: '+48 h', size: 'small', theme: 'negative' })), hint: 'ejecutadas hace más de dos días', cls: 'nws-stat-hero', theme: T }),
      S.statCard({ skeleton: k, label: 'Pendientes de revisión', bindValue: 'nPor', value: '—', hint: 'la más antigua lleva 3 días sin observar', icon: 'attention', theme: T }),
      S.statCard({ skeleton: k, label: 'Observadas esta semana', bindValue: 'nObs', value: '—', hint: '3 conformes · 2 con hallazgos', icon: 'visibility-on', theme: T }),
      S.statCard({ skeleton: k, label: 'Conformidad · septiembre', valueHtml: S.h('span', { class: 'nws-delta' }, V.metricas.conformidadMes, S.badge({ label: V.metricas.variacion, size: 'small', theme: 'positive' })), theme: T,
        extra: S.h('div', { class: 'nws-spark' }, V.metricas.sparkline.map(function (v) { return '<i style="height:' + v + '%"></i>'; })) }));

    /* El tablero lo arma pintarVista desde mount. En carga se dibujan las 4
       columnas —son las fases del flujo, no un dato que pueda llegar distinto—
       con tarjetas en silueta adentro. Los contadores de cada columna sí se
       omiten: cuántas rutas hay en cada fase es exactamente lo que falta. */
    var tablero = k ? S.h('div', { class: 'nws-kanban' }, V.columnas.map(function (col) {
      return S.h('div', { class: 'nws-kanban__col', 'nwt-theme': col.theme },
        S.h('div', { class: 'nws-kanban__head' }, S.h('span', { class: 'nws-kanban__dot' }), S.h('span', { class: 'nwt-caption-font-semibold nws-grow' }, S.esc(col.titulo))),
        S.h('div', { class: 'nws-kanban__body' }, [0, 1].map(function () { return S.card({ skeleton: true, size: 'small' }); })));
    })) : '';

    return stats +
      S.h('div', { class: 'nws-tabla__head', style: 'margin-top:var(--naotech-sizing-8)' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Todas las rutas ejecutadas'),
        S.badge({ label: '—', size: 'small', theme: 'neutral', cls: 'bind-nTotalVis' }),
        S.h('div', { class: 'nws-grow' }),
        S.button({ label: 'Exportar informe', icon: 'download', size: 'small', variant: 'mute', theme: T, attrs: { 'data-toast': 'informe' } }),
        S.tagGroup({ id: 'seg-vista', size: 'large', theme: T, value: 'kb', items: [{ id: 'k', label: 'Tablero', value: 'kb' }, { id: 't', label: 'Tabla', value: 'tb' }] })) +
      S.h('div', { id: 'sup-vista', class: 'nws-page' }, tablero) +
      S.confirmation({ id: 'confirm-tomar', theme: T, icon: 'file', title: '—', bindTitle: 'cfTitulo', bindMessage: 'cfMensaje', message: '', approvedLabel: 'Tomar la ruta', rejectLabel: 'Cancelar' }) +
      S.confirmation({ id: 'confirm-cerrar', theme: T, icon: 'positive', title: '—', bindTitle: 'ccTitulo', bindMessage: 'ccMensaje', message: '', approvedLabel: 'Cerrar la ruta', rejectLabel: 'Cancelar' });
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, V = D.supervision, T = ctx.rol.theme, e = S.esc;
    var EST = ['revision', 'revision', 'observada', 'cerrada'];
    var ESTLABEL = ['Por revisar', 'En revisión', 'Observada', 'Cerrada'];
    var ESTTHEME = ['neutral', 'informative', 'primary', 'positive'];
    var st = { vista: 'kb', confirm: null, q: '', cards: V.cards.map(function (c) { return Object.assign({}, c); }) };
    function bind(k, v) { document.querySelectorAll('[data-bind="' + k + '"]').forEach(function (n) { n.textContent = v; }); }
    function card(id) { return st.cards.filter(function (c) { return c.id === id; })[0]; }
    function visibles() { var q = st.q.toLowerCase(); return st.cards.filter(function (c) { return !q || c.operario.toLowerCase().indexOf(q) >= 0; }); }

    function deco(c) {
      var p = Math.round(c.m / c.t * 100), completa = c.m === c.t, atraso = c.dias >= 3 && c.col < 2, col = V.columnas[c.col];
      return {
        sla: atraso ? 'hace ' + c.dias + ' d' : c.dias <= 1 ? 'reciente' : 'hace ' + c.dias + ' d', slaTheme: atraso ? 'negative' : 'neutral',
        pct: p, barTheme: completa ? 'positive' : 'caution', estado: ESTLABEL[c.col], estadoTheme: ESTTHEME[c.col],
        tomada: c.tomada ? 'tomada por L. Sarmiento · ' + c.tomada : 'sin tomar · en la cola compartida',
        acc: col.accion, sig: c.col < 3
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
                  d.sig ? S.button({ label: d.acc, size: 'small', variant: 'quiet', theme: T, attrs: { 'data-acc': c.id } }) : S.badge({ label: 'Cerrada', size: 'medium', theme: 'positive' })) });
            }) : S.h('div', { class: 'nws-kanban__empty nwt-smalltext-font-regular' }, S.icon('positive'), 'sin rutas acá')));
        }));
      } else {
        html = S.h('div', { class: 'nws-col', style: 'flex:1;min-width:0;gap:var(--naotech-sizing-8)' },
          S.card({ cls: 'nws-card--fill nws-card--flush', style: 'flex:1;min-width:0', attrs: { 'nwt-theme': T },
            content: S.datatable({
              /* DC-357: anchos por contenido (px) para las cortas, flex para las
                 dos de texto largo — mismo criterio que la tabla del admin. */
              columns: [
                { label: 'Ruta', style: 'flex:1.2 1 0;min-width:150px' },
                { label: 'Operario', style: 'flex:1 1 0;min-width:160px' },
                { label: 'Ejecutada', style: 'flex:0 0 88px', cls: 'nws-col-center' },
                { label: 'Marcadas', style: 'flex:0 0 120px' },
                { label: 'Evidencias', style: 'flex:0 0 96px', cls: 'nws-col-center' },
                { label: 'Estado', style: 'flex:0 0 120px' },
                { label: 'Plazo', style: 'flex:0 0 112px' },
                { label: 'Acción', actions: true, style: 'flex:0 0 104px;justify-content:flex-end' }],
              rows: vis.map(function (c) {
                var d = deco(c);
                return { cls: 'nws-list__row--click', attrs: { 'data-card': c.id }, cells: [
                  S.h('span', null, S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-body-font-semibold' }, e(c.codigo)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(c.zona)))),
                  S.h('span', null, S.h('div', { class: 'nws-row' }, S.avatar({ text: c.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }), S.h('span', { class: 'nwt-caption-font-regular' }, e(c.operario)))),
                  S.h('span', { class: 'nwt-caption-font-regular' }, e(c.fecha)),
                  S.h('span', { style: 'width:100%' }, S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-4)' }, S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, c.m + ' / ' + c.t), S.progress({ value: d.pct, size: 'small' }))),
                  S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, c.fotos),
                  S.badge({ label: d.estado, size: 'medium', theme: d.estadoTheme }),
                  S.badge({ label: d.sla, size: 'medium', theme: d.slaTheme }),
                  d.sig ? S.button({ label: d.acc, size: 'small', variant: 'quiet', theme: T, attrs: { 'data-acc': c.id } }) : S.button({ label: 'Cerrada', size: 'small', variant: 'mute', theme: 'neutral', disabled: true })
                ] };
              })
            }) }));
      }
      S.repintar(root.querySelector('#sup-vista'), html);
    }

    function accion(id, origen) {
      var c = card(id);
      /* cerrada: ya no admite cambios y su detalle no está en la exploración */
      if (c.col === 3) { ctx.proximamente('Detalle de ruta cerrada', origen); return; }
      if (c.col === 0) {
        st.confirm = id;
        bind('cfTitulo', '¿Tomás la revisión de ' + c.codigo + '?');
        bind('cfMensaje', c.zona + ' · ejecutada ' + c.fecha + ' por ' + c.operario + '. Queda a tu nombre y sale de la cola compartida; pasa a En revisión. ' +
          (c.dias >= 3 ? 'Ejecutada hace ' + c.dias + ' días: ya está fuera de plazo y el atraso queda registrado.' : c.dias === 2 ? 'Te queda 1 día para registrar la observación.' : 'Estás dentro del plazo para observarla.'));
        root.querySelector('#confirm-tomar').classList.add('nwt-modal--visible'); return;
      }
      if (c.col === 1) { ctx.ir('#/supervisor/revision'); return; }
      if (c.col === 2) {
        st.confirmCerrar = id;
        bind('ccTitulo', '¿Cerrás ' + c.codigo + '?');
        bind('ccMensaje', c.zona + ' · observada por ' + (c.tomada ? 'L. Sarmiento' : 'vos') + '. Pasa al histórico con su observación y desde acá ya no admite cambios.');
        root.querySelector('#confirm-cerrar').classList.add('nwt-modal--visible');
      }
    }

    function onClick(ev) {
      var t = ev.target;
      var acc = t.closest('[data-acc]'); if (acc) { ev.stopPropagation(); accion(+acc.getAttribute('data-acc'), acc); return; }
      var cd = t.closest('[data-card]'); if (cd) { accion(+cd.getAttribute('data-card'), cd); return; }
      if (t.closest('#confirm-tomar [data-reject]')) { st.confirm = null; root.querySelector('#confirm-tomar').classList.remove('nwt-modal--visible'); return; }
      if (t.closest('#confirm-tomar [data-approve]') && st.confirm != null) {
        var c = card(st.confirm); c.col = 1; c.tomada = 'hoy 14:20'; st.confirm = null;
        root.querySelector('#confirm-tomar').classList.remove('nwt-modal--visible'); pintarVista();
        ctx.toast({ title: c.codigo + ' quedó a tu nombre', message: 'Está En revisión y salió de la cola compartida. El paso siguiente es revisarla.', theme: 'informative', icon: 'file' });
      }
      if (t.closest('#confirm-cerrar [data-reject]')) { st.confirmCerrar = null; root.querySelector('#confirm-cerrar').classList.remove('nwt-modal--visible'); return; }
      if (t.closest('#confirm-cerrar [data-approve]') && st.confirmCerrar != null) {
        var cc = card(st.confirmCerrar); cc.col = 3; st.confirmCerrar = null;
        root.querySelector('#confirm-cerrar').classList.remove('nwt-modal--visible'); pintarVista();
        ctx.toast({ title: cc.codigo + ' quedó cerrada', message: 'Pasa al histórico con su observación. Desde acá ya no admite cambios.', theme: 'positive', icon: 'positive' });
      }
    }
    function onDoc(ev) {
      var seg = ev.target.closest('#seg-vista [data-seg]');
      if (seg) { st.vista = seg.getAttribute('data-seg'); document.querySelectorAll('#seg-vista [data-seg]').forEach(function (b) { var on = b === seg; b.classList.toggle('nwt-tag-group__tag--active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); }); ctx.posicionarIndicadores(document); pintarVista(); }
    }
    function onInput(ev) { if (ev.target.matches('[data-search="sup-q"]')) { st.q = ev.target.value; pintarVista(); } }
    function onKey(ev) {
      if (ev.key !== 'Escape') { return; }
      if (st.confirm) { st.confirm = null; root.querySelector('#confirm-tomar').classList.remove('nwt-modal--visible'); }
      if (st.confirmCerrar) { st.confirmCerrar = null; root.querySelector('#confirm-cerrar').classList.remove('nwt-modal--visible'); }
    }
    root.addEventListener('click', onClick); document.addEventListener('click', onDoc); document.addEventListener('input', onInput); document.addEventListener('keydown', onKey);
    pintarVista();
    return function () { root.removeEventListener('click', onClick); document.removeEventListener('click', onDoc); document.removeEventListener('input', onInput); document.removeEventListener('keydown', onKey); };
  }
};
