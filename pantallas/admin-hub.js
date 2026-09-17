/**
 * Administrador · hub de rutas.
 * Métricas, tabla por pestañas, cerradas de la semana y el asistente
 * "Nueva ruta" en tres pasos (Trazado → Operador → Resumen).
 */
/* Logo ficticio por operador contratado (DC-232): sin fotos ni hotlink a
   internet (ver nota de DC-054 en app.css) — un SVG generado localmente a
   partir de las iniciales, para que la card de elegir operador tenga una
   imagen real y no solo texto. */
function logoOperador(o) {
  var PALETAS = ['#0B5FFF,#00C2A8', '#B83100,#FF7A45', '#7C3AED,#22D3EE', '#0F766E,#A3E635', '#DB2777,#F59E0B', '#1D4ED8,#38BDF8'];
  var c = PALETAS[o.id.charCodeAt(0) % PALETAS.length].split(',');
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>' +
    '<rect width="64" height="64" rx="14" fill="url(#g)"/>' +
    '<text x="32" y="41" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#fff" text-anchor="middle">' + o.ini + '</text></svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['admin-hub'] = {
  menu: 'rutas',
  titulo: 'Rutas',

  /* Las columnas viven acá y no dentro de pintarTabla porque las necesitan los
     dos lados: el esqueleto (render, antes de que haya datos) y la tabla real
     (mount). Se llegan por `this` — render y mount se invocan como métodos de
     esta pantalla. */
  /* DC-357: la tabla vive en ~815px (comparte fila con el panel de cerradas),
     y los nwt-width-xs-* del SDK son porcentajes ciegos al contenido: a ese
     ancho Progreso quedaba en 61px para "17 de 41 - 41%" y Estado se llevaba
     204px para un badge de 105. Cada <tr> es su propio flex, así que las
     columnas NO pueden medirse solas por contenido (no alinearían entre
     filas): se fijan en px a partir del contenido más ancho que llevan
     (header en caption 12px uppercase vs. celda) y solo Ruta y Operador
     absorben lo que sobra. */
  columnas: [
    { label: 'Ruta',     style: 'flex:1 1 0;min-width:128px' },
    { label: 'Operador', style: 'flex:1.6 1 0;min-width:168px' },
    { label: 'Zona',     style: 'flex:0 0 88px' },
    { label: 'Unidades', style: 'flex:0 0 72px', cls: 'nws-col-center' },
    { label: 'Estado',   style: 'flex:0 0 116px', cls: 'nws-col-center' },
    /* DC-271 sube los captions de celda a 14px: "17 de 41 - 41%" mide ~104px ahí. */
    { label: 'Progreso', style: 'flex:0 0 120px' },
    { label: '', actions: true, style: 'flex:0 0 32px' }
  ],

  toolbar: function (ctx) {
    var S = ctx.S, rol = ctx.rol;
    return {
      body: S.title({ text: 'Rutas', subtitle: 'Todas las zonas · 6 operadores' }),
      actions: S.searchbox({ placeholder: 'Buscar ruta u operador', size: 'medium', style: 'width:260px' }) +
               S.button({ label: 'Nueva ruta', icon: 'add', size: 'medium', variant: 'loud', theme: rol.theme, attrs: { 'data-abrir-modal': 'nueva' } }) +
               S.avatar({ text: rol.iniciales, size: 'small', variant: 'loud', theme: rol.theme })
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, A = D.admin, M = A.metricas, T = ctx.rol.theme, e = S.esc;
    var k = ctx.cargando;

    /* Las 4 métricas son lo primero que llega de la API y lo primero que se ve:
       en carga van con el esqueleto propio de NwtStatCard (label + valor), no
       con un contenedor gris inventado. La cuarta mantiene el hueco del
       sparkline para que la fila no cambie de alto al llegar los datos. */
    var stats = S.h('div', { class: 'nws-stats nws-stats--hero' },
      S.statCard({ skeleton: k, label: 'Rutas activas', value: M.activas, hint: 'en ' + M.zonas + ' zonas · ' + M.operadoresVigentes + ' operadores con contrato vigente', cls: 'nws-stat-hero', theme: T }),
      S.statCard({ skeleton: k, label: 'Sin asignar', value: M.sinAsignar, hint: 'esperando que el operador reparta', icon: 'shipping', theme: T }),
      S.statCard({ skeleton: k, label: 'En ejecución', value: M.enEjecucion, hint: M.marcadasHoy.toLocaleString('es-CO') + ' de ' + M.metaHoy.toLocaleString('es-CO') + ' unidades marcadas hoy', theme: T,
        extra: S.progress({ value: M.marcadasHoy / M.metaHoy * 100, size: 'medium', cls: 'nws-stat-progress' }) }),
      S.statCard({ skeleton: k, label: 'Completadas · septiembre', valueHtml: S.h('span', { class: 'nws-delta' }, e(M.completadasMes), S.badge({ label: M.variacionMes, size: 'small', theme: 'positive' })), theme: T,
        extra: S.h('div', { class: 'nws-spark' }, M.sparkline.map(function (v) { return '<i style="height:' + v + '%"></i>'; })) }));

    /* Tabs sueltos arriba de la tabla, sin header ni borde de tarjeta:
       pedido en DC-030, "en el aire", separados del contenedor. */
    var tabla = S.h('div', { class: 'nws-tabla', style: 'flex:1' },
      S.h('div', { class: 'nws-tabla__head' },
        S.tagGroup({ id: 'tabs-rutas', size: 'large', theme: T, value: 'todas', items: A.tabs.map(function (t) { return { id: t.id, label: t.label + ' (' + t.count + ')', value: t.id }; }) })),
      S.card({
        cls: 'nws-card--fill nws-card--flush', style: 'min-width:0', attrs: { 'nwt-theme': T },
        /* La tabla la llena mount() (pintarTabla), que en carga no corre. El
           encabezado sí se conoce de entrada —las columnas son del contrato, no
           de los datos— así que el esqueleto de NwtDatatable las conserva y
           solo esqueletea las filas. */
        content: S.h('div', { id: 'tabla-rutas', class: 'nws-grow', style: 'display:flex;flex-direction:column;min-height:0' },
          k ? S.datatable({ skeleton: true, style: 'min-height:0', columns: this.columnas }) : '')
      }));

    var cerradas = S.card({
      /* DC-357: 32px menos al panel para que la tabla no recorte Operador. */
      cls: 'nws-card--fill nws-card--flush', style: 'flex:0 0 300px', attrs: { 'nwt-theme': T },
      header: S.h('div', { class: 'nws-card-head' },
        S.icon('positive', 'nws-soft'),
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Cerradas esta semana'),
        S.badge({ label: 11, size: 'small', theme: 'neutral' })),
      content: k ? S.h('div', { class: 'nws-stack', style: 'padding:var(--naotech-sizing-16)' },
          [0, 1, 2, 3].map(function () { return S.card({ skeleton: true, header: 1, size: 'small' }); }))
        : S.h('div', { class: 'nws-list nws-list--zebra' }, A.cerradasSemana.map(function (c) {
        var j = D.estados[c.juicio];
        return S.h('div', { class: 'nws-list__row', style: 'flex-direction:column;align-items:stretch;gap:var(--naotech-sizing-6)' },
          S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-smalltext-font-bold nws-grow' }, e(c.codigo)), S.badge({ label: j.label, size: 'medium', theme: j.theme })),
          S.h('div', { class: 'nws-row nws-row--sm nwt-smalltext-font-regular nws-muted' }, S.icon('user'), e(c.operario + ' · ' + c.fecha)),
          S.h('div', { class: 'nws-note nwt-smalltext-font-regular' }, e(c.obs)));
      })),
      footer: S.button({ label: 'Ver todas las cerradas', size: 'small', variant: 'quiet', theme: T, attrs: { style: 'width:100%', 'data-toast': 'cerradas' } })
    });

    var modal = S.modal({
      id: 'modal-nueva', cls: 'nws-modal-wide', theme: T,
      title: 'Nueva ruta', bindSubtitle: 'nrSub', subtitle: 'Paso 1 de 3 · Trazado',
      body: S.h('div', { class: 'nws-modal__body' },
        S.stepper({ steps: A.nuevaRuta.pasos, position: 1, theme: T, cls: 'nr-stepper' }),
        S.h('div', { id: 'nr-cuerpo', class: 'nws-modal__body nws-modal__cuerpo' })) +
        S.h('div', { class: 'nws-modal__foot' },
          S.button({ label: 'Atrás', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-nr': 'atras' } }),
          S.h('div', { class: 'nws-grow nwt-body-font-medium nws-ink', style: 'text-align:center', 'data-bind': 'nrPista' }),
          S.button({ label: 'Elegir operador', size: 'medium', variant: 'loud', theme: T, attrs: { 'data-nr': 'ok' } }))
    });

    return stats + S.h('div', { class: 'nws-split', style: 'min-height:80vh;max-height:80vh' }, tabla, cerradas) + modal;
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, A = D.admin, T = ctx.rol.theme, e = S.esc, M = window.MAPA;
    var COLS = this.columnas;
    var st = { tab: 'todas', modal: false, paso: 1, modo: null, opId: null, q: '', creada: false, destacada: null };
    var opPorId = {}; D.operadores.forEach(function (o) { opPorId[o.id] = o; });

    /* ---- tabla ---- */
    function pintarTabla() {
      var tab = A.tabs.filter(function (t) { return t.id === st.tab; })[0];
      var filas = A.rutas.filter(function (r) { return !tab.filtro || tab.filtro.indexOf(r.estado) >= 0; }).slice(0, 6);
      var rows = filas.map(function (r) {
        var op = opPorId[r.operador], est = D.estados[r.estado];
        var estadoCell = S.badge({ label: est.label, size: 'medium', theme: est.theme });
        /* DC-332: el contador (marcadas de unidades) vivía en Estado; ahora
           Progreso trae el porcentaje y el contador juntos, y Estado queda
           solo con el badge. */
        /* DC-352: "17 de 41 - 41%" en una sola línea, no apiladas en dos. */
        var progresoCell = r.estado === 'curso'
          ? S.h('span', { class: 'nwt-caption-font-regular nws-tnum' },
              r.marcadas + ' de ' + r.unidades + ' - ' + Math.round(r.marcadas / r.unidades * 100) + '%')
          : S.h('span', { class: 'nwt-caption-font-regular nws-soft' }, '—');
        return { cls: S.cls('nws-list__row--click', r.codigo === st.destacada && 'nws-list__row--nueva'), attrs: { 'data-ir': r.estado === 'curso' ? '#/operador/ruta' : '#/admin/entrega' }, cells: [
          S.h('span', null, S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-caption-font-semibold' }, e(r.codigo)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(r.modo)))),
          S.h('span', null, S.h('div', { class: 'nws-row' }, S.avatar({ text: op.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }), S.h('span', { class: 'nwt-caption-font-regular nws-clip' }, e(op.nombre)))),
          S.h('span', { class: 'nwt-caption-font-regular' }, e(r.zona)),
          S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, r.unidades),
          estadoCell,
          progresoCell,
          S.iconButton({ icon: 'chevron-right', size: 'small', variant: 'mute', theme: 'neutral', label: 'Abrir ' + r.codigo })
        ] };
      });
      root.querySelector('#tabla-rutas').innerHTML = S.datatable({
        style: 'min-height:0',
        columns: COLS,
        rows: rows,
        /* DC-355: nwt-datatable__footer (SDK) ya trae padding:16px propio;
           este margin negativo lo cancela abajo/izquierda para que quede
           pegado al borde real de la card, no al padding del padre. */
        footer: S.h('div', { class: 'nws-row nws-row--md', style: 'margin:0 0 calc(var(--naotech-sizing-16) * -1) calc(var(--naotech-sizing-16) * -1);padding:var(--naotech-sizing-8) var(--naotech-sizing-16) var(--naotech-sizing-16);width:calc(100% + var(--naotech-sizing-16))' },
          S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-grow' }, 'Mostrando ' + filas.length + ' de ' + tab.count),
          S.pagination({ page: 1, total: Math.max(1, Math.ceil(tab.count / 6)), size: 'small' }))
      });
    }

    /* ---- asistente nueva ruta ---- */
    var PASOS = A.nuevaRuta.pasos, mapaNr = null;
    function trazo() { return st.modo === 'auto' ? A.nuevaRuta.automatica : st.modo === 'manual' ? A.nuevaRuta.manual : null; }
    function cubre(o) { var req = trazo() ? trazo().requiere : []; return req.every(function (z) { return o.zonas.indexOf(z) >= 0; }); }

    function pintarModal() {
      var m = root.querySelector('#modal-nueva');
      m.classList.toggle('nwt-modal--visible', st.modal);
      if (!st.modal) { return; }
      var tr = trazo(), cuerpo = root.querySelector('#nr-cuerpo');
      root.querySelector('[data-bind="nrSub"]').textContent = 'Paso ' + st.paso + ' de 3 · ' + PASOS[st.paso - 1];
      root.querySelector('.nr-stepper').outerHTML = S.stepper({ steps: PASOS, position: st.paso, theme: T, cls: 'nr-stepper' });

      var okLabel = 'Continuar', okOk = false, pista = 'Elegí cómo se traza la ruta', html = '';
      if (st.paso === 1) {
        okOk = !!st.modo; okLabel = 'Elegir operador';
        pista = tr ? 'El trazo cae en la zona ' + tr.zona + ' · ' + tr.unidades + ' unidades · ' + tr.km + ' km' : pista;
        html = S.h('div', { class: 'nws-row nws-row--md', style: 'align-items:stretch' },
            S.h('button', { type: 'button', class: S.cls('nws-option', st.modo === 'manual' && 'nws-option--on'), 'data-nr-modo': 'manual', 'nwt-theme': T },
              S.h('span', { class: 'nwt-body-font-semibold' }, 'Creación manual'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Señalás las unidades en el orden en que se recorren. Control total, no escala.')),
            S.h('button', { type: 'button', class: S.cls('nws-option', st.modo === 'auto' && 'nws-option--on'), 'data-nr-modo': 'auto', 'nwt-theme': T },
              S.h('span', { class: 'nwt-body-font-semibold' }, 'Creación automática'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'El algoritmo resuelve el mejor recorrido y lo parte si no alcanza en una jornada.'))) +
          /* El trazo lo pinta MAPA.crear después de montar el HTML (ver abajo):
             sectores, base, primera y última unidad y el retorno al patio. */
          S.h('div', { class: 'nws-map nws-map--modal', id: 'nr-mapa', 'nwt-theme': T });
      }
      if (st.paso === 2) {
        okOk = !!st.opId; okLabel = 'Revisar';
        var q = st.q.toLowerCase();
        var visibles = D.operadores.filter(function (o) { return !q || o.nombre.toLowerCase().indexOf(q) >= 0; });
        var nDisp = D.operadores.filter(cubre).length;
        pista = st.opId ? opPorId[st.opId].nombre + ' cubre la zona del trazo' : nDisp + ' de 6 operadores pueden tomar esta zona';
        html = S.h('div', { class: 'nws-row nws-row--md' },
            S.searchbox({ placeholder: 'Buscar operador por nombre…', size: 'small', value: st.q, name: 'nr-q', style: 'width:300px' }),
            S.badge({ label: 'Zona ' + tr.zona, size: 'small', theme: 'neutral' }),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, nDisp + ' de 6 operadores cubren esta zona')) +
          (visibles.length ? S.h('div', { class: 'nws-pick-grid' }, visibles.map(function (o) {
            var ok = cubre(o), on = o.id === st.opId;
            var carga = { Baja: 'positive', Media: 'neutral', Alta: 'caution' }[o.carga];
            return S.card({ size: 'small', onClick: ok, cls: S.cls('nws-pick', on && 'nws-pick--on', !ok && 'nws-pick--off'), attrs: ok ? { 'data-nr-op': o.id, 'nwt-theme': T } : { 'aria-disabled': 'true' },
              content: S.h('div', { class: 'nws-row' }, S.avatar({ img: logoOperador(o), text: o.ini, size: 'small', variant: 'quiet', theme: 'neutral' }),
                  S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nwt-smalltext-font-semibold nws-clip' }, e(o.nombre)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, ok ? 'cubre la zona del trazo' : 'opera en otra zona')),
                  S.badge({ label: ok ? 'Disponible' : 'Fuera de zona', size: 'small', theme: ok ? 'positive' : 'neutral' })) +
                S.h('div', { class: 'nws-pick__stats' },
                  S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, o.unidades), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Unidades')),
                  S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, o.operarios), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Operarios')),
                  S.h('div', { class: 'nws-pick__stat' }, S.badge({ label: o.carga, size: 'small', theme: carga }), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Carga'))) });
          })) : S.emptyState({ title: 'Ningún operador coincide', description: '«' + st.q + '» en la zona ' + tr.zona, actionLabel: '' }));
      }
      if (st.paso === 3) {
        okLabel = st.creada ? 'Creadas' : 'Crear y enviar'; okOk = !st.creada;
        pista = st.creada ? 'Entregadas al operador' : 'Revisá antes de crear';
        var op = opPorId[st.opId];
        html = S.h('div', { class: 'nws-split' },
          S.h('div', { class: 'nws-col nws-grow', style: 'gap:var(--naotech-sizing-8)' },
            S.h('span', { class: 'nwt-overline-font-semibold nws-muted' }, 'Trazado'),
            S.h('div', { class: 'nws-map nws-map--modal', id: 'nr-mapa', 'nwt-theme': T })),
          S.h('div', { class: 'nws-col', style: 'flex:0 0 372px;gap:var(--naotech-sizing-10)' },
            S.h('div', { class: 'nws-ticket' },
              S.h('div', { class: 'nws-ticket__head' }, S.icon('shipping'), S.h('span', { class: 'nwt-caption-font-semibold' }, 'Resumen')),
              S.h('div', { class: 'nws-ticket__body' },
                [['Modo', st.modo === 'auto' ? 'Automática' : 'Manual'], ['Zona', tr.zona], ['Operador', op.nombre], ['Rutas a crear', '1'],
                 ['Unidades', st.modo === 'auto' ? tr.unidades + ' · atraviesa Sectores A y B' : tr.unidades + ' · Sector A'], ['Recorrido', tr.km + ' km estimados'], ['Estado inicial', 'Trazada — editable hasta que la asignen']]
                  .map(function (kv) { return S.h('div', { class: 'nws-kv nwt-caption-font-regular' }, S.h('span', { class: 'nws-kv__k' }, kv[0]), S.h('span', { class: 'nws-kv__v nwt-caption-font-medium' }, e(kv[1]))); }))),
            st.creada ? S.alert({ theme: 'positive', icon: 'positive', html: S.h('b', null, 'Rutas creadas. ') + 'Ya están en la bandeja de ' + e(op.nombre) + '.' }) : ''));
      }
      cuerpo.innerHTML = html;
      /* El mapa del asistente se crea sobre el DOM ya montado (necesita medir
         su caja para encuadrar). Sin modo: base vacía con velo. Con modo: el
         trazo propuesto entra parada por parada (entrada: true). */
      if (mapaNr) { mapaNr.destruir(); mapaNr = null; }
      var elMapa = root.querySelector('#nr-mapa');
      if (elMapa) {
        mapaNr = M.crear(elMapa, {
          ruta: tr ? M.rutas.trazo(st.modo, tr.unidades) : null, camion: false, entrada: st.paso === 1, pad: 44,
          veil: st.modo ? null : 'Elegí un modo para trazar sobre el mapa',
          leyenda: tr ? ['propuesto', 'traslado'] : null,
          aria: tr ? 'Trazado propuesto · ' + tr.zona : 'Mapa del sector'
        });
      }
      root.querySelector('[data-bind="nrPista"]').textContent = pista;
      var ok = root.querySelector('[data-nr="ok"]'); ok.querySelector('.nwt-button__content').textContent = okLabel; ok.disabled = !okOk;
      root.querySelector('[data-nr="atras"]').disabled = st.paso === 1;
      ctx.posicionarIndicadores(root);
    }

    /* ---- eventos ---- */
    function onClick(ev) {
      var t = ev.target;
      var tab = t.closest('#tabs-rutas [data-seg]'); if (tab) { st.tab = tab.getAttribute('data-seg'); root.querySelectorAll('#tabs-rutas [data-seg]').forEach(function (b) { var on = b === tab; b.classList.toggle('nwt-tag-group__tag--active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); }); ctx.posicionarIndicadores(root); pintarTabla(); return; }
      if (t.closest('[data-abrir-modal="nueva"]')) { st = Object.assign(st, { modal: true, paso: 1, modo: null, opId: null, q: '', creada: false }); pintarModal(); return; }
      if (t.closest('[data-close-modal]')) { st.modal = false; if (mapaNr) { mapaNr.destruir(); mapaNr = null; } pintarModal(); return; }
      var modo = t.closest('[data-nr-modo]'); if (modo) { st.modo = modo.getAttribute('data-nr-modo'); st.opId = null; pintarModal(); return; }
      var op = t.closest('[data-nr-op]'); if (op) { st.opId = op.getAttribute('data-nr-op'); pintarModal(); return; }
      var nr = t.closest('[data-nr]');
      if (nr) {
        var a = nr.getAttribute('data-nr');
        if (a === 'atras' && st.paso > 1) { st.paso--; pintarModal(); }
        if (a === 'ok') {
          if (st.paso < 3) { st.paso++; pintarModal(); }
          else if (!st.creada) {
            /* DC-306: en vez de dejar el modal abierto en su estado "Creadas",
               se cierra de una y la fila nueva queda resaltada en la tabla
               unos segundos — el feedback pasa a la lista, que es donde
               termina la ruta. */
            st.creada = true;
            var trz = trazo();
            var nueva = {
              codigo: 'R-' + (2440 + Math.floor(Math.random() * 60)) + ' · ' + trz.zona.split(' · ')[0],
              modo: st.modo === 'auto' ? 'automática' : 'manual',
              operador: st.opId, zona: trz.zona.split(' · ')[0], unidades: trz.unidades, estado: 'trazada'
            };
            A.rutas.unshift(nueva);
            st.destacada = nueva.codigo;
            /* La nueva ruta queda "trazada"; si la pestaña activa no la
               muestra (p.ej. "En ejecución"), no habría nada que resaltar. */
            st.tab = 'todas';
            root.querySelectorAll('#tabs-rutas [data-seg]').forEach(function (b) { var on = b.getAttribute('data-seg') === 'todas'; b.classList.toggle('nwt-tag-group__tag--active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
            ctx.posicionarIndicadores(root);
            st.modal = false; if (mapaNr) { mapaNr.destruir(); mapaNr = null; }
            pintarModal(); pintarTabla();
            ctx.toast({ title: 'Rutas creadas', message: nueva.codigo + ' ya está en la bandeja de ' + opPorId[st.opId].nombre + '.', theme: 'positive', icon: 'positive' });
            setTimeout(function () { st.destacada = null; pintarTabla(); }, 3000);
          }
        }
      }
    }
    function onInput(ev) { if (ev.target.matches('[data-search="nr-q"]')) { st.q = ev.target.value; var pos = ev.target.selectionStart; pintarModal(); var i = root.querySelector('[data-search="nr-q"]'); i.focus(); i.setSelectionRange(pos, pos); } }
    function onKey(ev) { if (ev.key === 'Escape' && st.modal) { st.modal = false; pintarModal(); } }

    root.addEventListener('click', onClick); root.addEventListener('input', onInput); document.addEventListener('keydown', onKey);
    pintarTabla();
    /* El toolbar vive fuera de root: el botón "Nueva ruta" se escucha en el documento. */
    var tb = document.querySelector('[data-abrir-modal="nueva"]');
    var onTb = function () { st = Object.assign(st, { modal: true, paso: 1, modo: null, opId: null, q: '', creada: false }); pintarModal(); };
    if (tb) { tb.addEventListener('click', onTb); }
    /* pedido desde otra pantalla ("Volver a trazar" en Entrega): se abre el asistente al llegar */
    if (window.UAESP_ABRIR === 'nueva') { window.UAESP_ABRIR = null; onTb(); }
    return function () { if (mapaNr) { mapaNr.destruir(); } root.removeEventListener('click', onClick); root.removeEventListener('input', onInput); document.removeEventListener('keydown', onKey); if (tb) { tb.removeEventListener('click', onTb); } };
  }
};
