/**
 * Operador · Rutas — el hub de rutas.
 * Una sola tabla con TODAS las rutas del operador y su estado; desde acá se
 * entra a cada detalle: en curso y programada van al detalle de ruta
 * (operador-ruta.js, que cambia de estado), finalizada va al control de
 * cierre (operador-control.js).
 *
 * Regla de columnas (pedido 21-sep): la columna de acción existe SIEMPRE y
 * con ancho fijo. Lo que cambia entre filas es el contenido —botón cuando
 * hay acción, badge cuando no— nunca la existencia de la celda, para que
 * ninguna columna se corra según la fila.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['operador-rutas'] = {
  menu: 'rutas',
  titulo: 'Rutas',

  columnas: [
    { label: 'Ruta', style: 'flex:1.3 1 0;min-width:170px' },
    { label: 'Estado', style: 'flex:0 0 140px' },
    { label: 'Conductor', style: 'flex:1 1 0;min-width:150px' },
    { label: 'Camión', style: 'flex:0 0 120px' },
    { label: 'Avance', style: 'flex:0 0 140px' },
    { label: 'Horario', style: 'flex:0 0 132px' },
    { label: 'Acción', actions: true, style: 'flex:0 0 156px;justify-content:flex-end' }
  ],

  toolbar: function (ctx) {
    var S = ctx.S, rol = ctx.rol, D = ctx.D;
    return {
      body: S.h('div', { class: 'nws-title-strong' }, S.title({ text: 'Rutas', subtitle: 'Todas las rutas del operador · ' + D.entidad.fecha })),
      actions: S.searchbox({ placeholder: 'Buscar ruta o conductor', size: 'medium', style: 'width:240px', name: 'rt-q' }) +
               S.button({ label: 'Exportar', icon: 'download', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'exportar' } })
    };
  },

  /* Las tres fuentes ya existen —no hay dataset nuevo—: la tabla las une y
     normaliza en filas con la misma forma. */
  filas: function (D) {
    var out = [];
    D.operador.enCalle.forEach(function (o, i) {
      out.push({ id: 'v' + i, grupo: 'curso', codigo: o.ruta, conductor: o.nombre, ini: o.ini, camion: o.camion,
        hechas: o.hechas, total: o.total, horario: o.inicio + ' → ' + o.eta,
        estado: 'En curso', estadoTheme: 'informative', accion: 'Seguir', destino: '#/operador/ruta/vivo' });
    });
    D.operador.proximos.forEach(function (p, i) {
      out.push({ id: 'p' + i, grupo: 'programada', codigo: p.ruta, conductor: p.nombre, ini: p.ini, camion: p.camion,
        hechas: null, total: p.unidades, horario: 'sale ' + p.salida,
        estado: 'Programada', estadoTheme: 'neutral', accion: 'Ver ruta', destino: '#/operador/ruta/programada' });
    });
    D.operador.finalizadas.forEach(function (r) {
      var cerrada = r.estado === 'cerrada';
      out.push({ id: 'f' + r.id, grupo: 'finalizada', codigo: r.codigo, conductor: r.operario, ini: r.operario.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').slice(0, 2), camion: r.camion,
        hechas: r.m, total: r.t, horario: r.franja,
        estado: cerrada ? 'Cerrada' : 'Lista para cierre', estadoTheme: cerrada ? 'positive' : 'primary',
        accion: cerrada ? null : 'Revisar y cerrar', destino: '#/operador/control',
        juicio: r.juicio });
    });
    return out;
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, T = ctx.rol.theme;
    var k = ctx.cargando;
    var todas = this.filas(D);
    var n = function (g) { return todas.filter(function (f) { return f.grupo === g; }).length; };

    return S.h('div', { class: 'nws-tabla', style: 'flex:1;min-height:78vh' },
      S.h('div', { class: 'nws-tabla__head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Todas las rutas'),
        S.badge({ label: '—', size: 'small', theme: 'neutral', cls: 'bind-nRutas' }),
        S.h('div', { class: 'nws-grow' }),
        S.tagGroup({ id: 'seg-rt', size: 'large', theme: T, value: 'todas', items: [
          { id: 'a', label: 'Todas (' + todas.length + ')', value: 'todas' },
          { id: 'c', label: 'En curso (' + n('curso') + ')', value: 'curso' },
          { id: 'p', label: 'Programadas (' + n('programada') + ')', value: 'programada' },
          { id: 'f', label: 'Finalizadas (' + n('finalizada') + ')', value: 'finalizada' }] })),
      S.card({
        cls: 'nws-card--fill nws-card--flush', style: 'flex:1;min-width:0', attrs: { 'nwt-theme': T },
        content: S.h('div', { id: 'tabla-rutas', class: 'nws-grow', style: 'display:flex;flex-direction:column;min-height:0' },
          k ? S.datatable({ skeleton: true, columns: this.columnas }) : '')
      }));
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, T = ctx.rol.theme, e = S.esc;
    var COLS = this.columnas;
    var TODAS = this.filas(D);
    var st = { filtro: 'todas', q: '' };

    function visibles() {
      var q = st.q.toLowerCase();
      return TODAS.filter(function (f) {
        if (st.filtro !== 'todas' && f.grupo !== st.filtro) { return false; }
        return !q || f.codigo.toLowerCase().indexOf(q) >= 0 || f.conductor.toLowerCase().indexOf(q) >= 0;
      });
    }

    function pintar() {
      var vis = visibles();
      var b = root.querySelector('.bind-nRutas .nwt-badge__label'); if (b) { b.textContent = vis.length; }
      root.querySelector('#tabla-rutas').innerHTML = vis.length ? S.datatable({
        columns: COLS,
        rows: vis.map(function (f) {
          var pct = f.hechas === null ? 0 : Math.round(f.hechas / f.total * 100);
          return { cls: 'nws-list__row--click', attrs: { 'data-fila': f.id }, cells: [
            S.h('span', null, S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-body-font-semibold' }, e(f.codigo)),
              f.juicio ? S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, f.juicio === 'hallazgos' ? 'con hallazgos' : 'conforme') : '')),
            S.badge({ label: f.estado, size: 'medium', theme: f.estadoTheme }),
            S.h('span', null, S.h('div', { class: 'nws-row' }, S.avatar({ text: f.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }), S.h('span', { class: 'nwt-caption-font-regular' }, e(f.conductor)))),
            S.h('span', { class: 'nwt-caption-font-regular nws-muted' }, e(f.camion)),
            f.hechas === null
              /* DC-092: "unidades" → "puntos" (mismo concepto de DC-003). */
              ? S.h('span', { class: 'nwt-caption-font-regular nws-muted nws-tnum' }, f.total + ' puntos')
              : S.h('span', { style: 'width:100%' }, S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-4)' },
                  S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, f.hechas + ' / ' + f.total), S.progress({ value: pct, size: 'small' }))),
            S.h('span', { class: 'nwt-caption-font-regular nws-tnum' }, e(f.horario)),
            /* Celda de acción SIEMPRE presente: botón o badge, mismo ancho. */
            f.accion
              ? S.button({ label: f.accion, size: 'small', variant: 'quiet', theme: T, attrs: { 'data-ir': f.destino } })
              : S.badge({ label: 'Sin acción', size: 'medium', theme: 'neutral' })
          ] };
        })
      }) : S.emptyState({ title: 'Sin rutas en este filtro', description: 'Cambiá de pestaña para ver las demás rutas del operador.' });
    }

    function onClick(ev) {
      var seg = ev.target.closest('#seg-rt [data-seg]');
      if (seg) {
        st.filtro = seg.getAttribute('data-seg');
        root.querySelectorAll('#seg-rt [data-seg]').forEach(function (x) { var on = x === seg; x.classList.toggle('nwt-tag-group__tag--active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
        ctx.posicionarIndicadores(root); pintar(); return;
      }
      /* La fila entera navega al mismo destino que su acción. */
      var fila = ev.target.closest('[data-fila]');
      if (fila && !ev.target.closest('[data-ir]')) {
        var f = TODAS.filter(function (x) { return x.id === fila.getAttribute('data-fila'); })[0];
        if (f && f.accion) { ctx.ir(f.destino); }
        else if (f) { ctx.proximamente('Detalle de ruta cerrada', fila); }
      }
    }
    function onInput(ev) { if (ev.target.matches('[data-search="rt-q"]')) { st.q = ev.target.value; var pos = ev.target.selectionStart; pintar(); var i = document.querySelector('[data-search="rt-q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } }
    root.addEventListener('click', onClick); document.addEventListener('input', onInput);
    pintar();
    return function () { root.removeEventListener('click', onClick); document.removeEventListener('input', onInput); };
  }
};
