/**
 * Administrador · revisar antes de entregar.
 * Dos rutas listas para un operador: trazado, resumen y paradas.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['admin-entrega'] = {
  menu: 'rutas',
  titulo: 'Revisión antes de entregar',

  toolbar: function (ctx) {
    var S = ctx.S;
    return {
      body: S.iconButton({ icon: 'chevron-left', size: 'medium', variant: 'mute', theme: 'neutral', label: 'Volver a rutas', attrs: { 'data-ir': '#/admin' } }) +
            S.title({ text: 'Revisión antes de entregar', subtitle: 'Rutas / Nueva ruta / Revisión' }),
      actions: S.button({ label: 'Guardar borrador', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-toast': 'borrador' } }) +
               S.button({ label: 'Volver a trazar', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-abrir-modal': 'nueva', 'data-ir': '#/admin' } })
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, E = D.entrega, T = ctx.rol.theme, e = S.esc;
    var k = ctx.cargando;
    var op = D.operadores.filter(function (o) { return o.id === E.operador; })[0];

    var hero = S.card({
      cls: 'nws-card--none', style: 'flex:none',
      header: S.h('div', { class: 'nws-card-head' },
        S.h('div', { class: 'nws-grow nws-col', style: 'gap:var(--naotech-sizing-4)' },
          S.h('span', { class: 'nwt-smalltext-font-semibold nws-muted' }, 'Se va a entregar a'),
          S.h('span', { class: 'nwt-subtitle-font-bold', style: 'font-size:var(--naotech-sizing-24);line-height:var(--naotech-sizing-28)' }, e(op.nombre)),
          S.h('div', { class: 'nws-row', style: 'margin-top:var(--naotech-sizing-2);flex-wrap:wrap' },
            S.badge({ label: 'Zona Norte', size: 'medium', theme: 'neutral' }),
            S.badge({ label: D.estados.trazada.label, size: 'medium', theme: D.estados.trazada.theme }),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(E.contrato)))),
        S.h('div', { class: 'nws-divider-v' }),
        S.h('div', { class: 'nws-row nws-row--md', style: 'flex:none' },
          S.h('div', { class: 'nwt-smalltext-font-regular nws-muted', style: 'text-align:right' }, 'pasa a estado ', S.h('b', { class: 'nws-ink' }, 'Trazada'), '<br>en la bandeja del operador'),
          /* El botón va en skeleton mientras carga y no solo deshabilitado:
             entregar antes de ver qué se entrega es justo lo que no puede
             pasar, y el esqueleto ya apaga el click y el foco. */
          S.button({ skeleton: k, label: 'Entregar al operador', size: 'large', variant: 'loud', theme: T, attrs: { 'data-entregar': true } }))),
      content: S.h('div', { class: 'nws-stats nws-stats--5' },
        S.statCard({ skeleton: k, label: 'Cobertura de la zona', value: E.cobertura.unidades, hint: 'de ' + E.cobertura.total + ' puntos · 100%', theme: T,
          extra: S.progress({ value: 100, size: 'medium', theme: T, cls: 'nws-stat-progress' }) }),
        S.statCard({ skeleton: k, label: 'Rutas', value: E.rutas.length, hint: 'un solo recorrido', icon: 'shipping', theme: T }),
        S.statCard({ skeleton: k, label: 'Recorrido', value: E.recorrido, hint: 'km estimados', icon: 'gps-pin', theme: T }),
        S.statCard({ skeleton: k, label: 'Duración', value: E.duracion, hint: 'una jornada', icon: 'dispatch-time', theme: T }),
        S.statCard({ skeleton: k, label: 'Modo', value: E.modo, small: true, hint: 'trazada por el algoritmo', icon: 'settings', theme: T }))
    });

    var trazado = S.card({
      cls: 'nws-card--fill', style: 'flex:1.7;min-width:0', attrs: { 'nwt-theme': T },
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Trazado'),
        S.h('div', { class: 'nws-grow' }),
        /* DC-354: todos los segmentores del demo en 'large' (deshace el medium de DC-312). */
        /* Una sola ruta: el código técnico y, apenas, los sectores que toca. */
        E.rutas.length > 1
          ? S.tagGroup({ id: 'seg-rutas', size: 'large', theme: T, value: 0, items: E.rutas.map(function (r, i) { return { id: 'r' + i, label: r.codigo, value: i }; }) })
          : S.h('div', { class: 'nws-row nws-row--sm', id: 'ruta-entrega' },
              S.badge({ label: E.rutas[0].codigo, size: 'medium', theme: 'neutral' }),
              S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Sectores ' + (E.rutas[0].sectores || []).join(' · ')))),
      content: S.h('div', { class: 'nws-map', id: 'mapa-entrega' }) +
               S.h('div', { id: 'resumen-ruta', class: 'nws-row', style: 'gap:0;justify-content:center;margin-top:var(--naotech-sizing-12);border-top:1px solid var(--naotech-app-color-200);padding-top:var(--naotech-sizing-12)' })
    });

    var paradas = S.card({
      cls: 'nws-card--fill nws-card--flush', style: 'flex:0 0 384px', attrs: { 'nwt-theme': T },
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold', 'data-bind': 'tituloParadas' }, 'Paradas'),
        S.badge({ label: '—', size: 'small', theme: 'neutral', cls: 'bind-n' })),
      content: S.h('div', { class: k ? 'nws-stack--sm' : 'nws-stops', id: 'paradas-entrega', style: k ? 'padding:var(--naotech-sizing-16)' : undefined },
        k ? [0, 1, 2, 3].map(function () { return S.card({ skeleton: true, size: 'small' }); }) : ''),
      footer: S.h('span', { class: 'nwt-smalltext-font-regular nws-muted', 'data-bind': 'pieParadas' })
    });

    var confirm = S.confirmation({
      id: 'confirm-entrega', theme: T, icon: 'shipping',
      title: '¿Entregás la ruta a ' + op.nombre + '?',
      message: 'Pasa a estado Trazada en la bandeja del operador. Él la asigna a sus operarios; desde ese momento ya no podés volver a trazarla.',
      approvedLabel: 'Entregar al operador', rejectLabel: 'Todavía no'
    });

    return hero + S.h('div', { class: 'nws-split', style: 'min-height:80vh;max-height:80vh' }, trazado, paradas) + confirm;
  },

  mount: function (root, ctx) {
    var S = ctx.S, D = ctx.D, E = D.entrega, T = ctx.rol.theme, e = S.esc, M = window.MAPA;
    var st = { r: 0 };

    /* Trazado propuesto: sin camión. Base, primera y última unidad y el
       retorno al patio son parte de lo que se entrega, así que se ven acá. */
    var mapa = null;
    function pintar() {
      var sel = E.rutas[st.r];
      /* Sin título sobre el mapa: el segmentado de la cabecera ya dice qué
         ruta es y el resumen de abajo cuánto mide. Base, primera y última
         van rotuladas en el propio mapa. */
      var ruta = sel.sectores ? M.rutas.trazo('auto', sel.paradas) : M.rutas.entrega(st.r, sel.paradas);
      if (!mapa) {
        mapa = M.crear(root.querySelector('#mapa-entrega'), { ruta: ruta, camion: false, leyenda: ['propuesto', 'traslado'], aria: 'Trazado de ' + sel.codigo });
      } else {
        mapa.set({ ruta: ruta });   /* re-encuadra animado */
      }

      S.repintar(root.querySelector('#resumen-ruta'), S.detailGroup({ items: [
        { icon: 'gps-pin', html: S.h('b', { class: 'nws-tnum' }, sel.paradas) + ' paradas' },
        { icon: 'shipping', html: S.h('b', { class: 'nws-tnum' }, sel.km + ' km') + ' de recorrido' },
        { icon: 'dispatch-time', html: S.h('b', { class: 'nws-tnum' }, sel.duracion) + ' estimadas' },
        { icon: 'official-stores', html: S.h('b', { class: 'nws-tnum' }, sel.comerciales) + ' comerciales' }
      ] }));

      root.querySelector('[data-bind="tituloParadas"]').textContent = 'Paradas de ' + sel.codigo;
      root.querySelector('.bind-n .nwt-badge__label').textContent = sel.paradas;
      root.querySelector('[data-bind="pieParadas"]').textContent = 'Mostrando ' + E.paradas.length + ' de ' + sel.paradas + ' paradas · orden de recorrido';
      S.repintar(root.querySelector('#paradas-entrega'), E.paradas.map(function (p, i) {
        /* Donde la ruta cambia de sector, una marca fina en la lista; cada parada dice el suyo, apenas. */
        var cruza = p.sector && i > 0 && E.paradas[i - 1].sector !== p.sector;
        return (cruza ? S.h('div', { class: 'nws-stop-cruce nwt-overline-font-semibold', 'data-cruce': p.sector }, (p.sector === E.paradas[0].sector ? 'Vuelve al sector ' : 'Entra al sector ') + p.sector) : '') +
          S.h('div', { class: 'nws-stop', 'data-sector': p.sector || null },
          S.h('div', { class: 'nws-stop__n nwt-smalltext-font-semibold' }, i + 1),
          S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nws-stop__dir nwt-smalltext-font-medium' }, e(p.dir)), S.h('span', { class: 'nws-stop__meta nwt-smalltext-font-regular' }, e(p.tipo + ' · ' + p.uid + (p.sector ? ' · Sector ' + p.sector : '')))),
          S.h('span', { class: 'nwt-smalltext-font-regular nws-soft nws-tnum' }, e(p.dist)));
      }).join(''));
      root.querySelectorAll('#seg-rutas [data-seg]').forEach(function (b) { var on = +b.getAttribute('data-seg') === st.r; b.classList.toggle('nwt-tag-group__tag--active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      ctx.posicionarIndicadores(root);
    }

    function onClick(ev) {
      var t = ev.target;
      var seg = t.closest('[data-seg]'); if (seg) { st.r = +seg.getAttribute('data-seg'); pintar(); return; }
      if (t.closest('[data-entregar]')) { root.querySelector('#confirm-entrega').classList.add('nwt-modal--visible'); return; }
      if (t.closest('#confirm-entrega [data-reject]')) { root.querySelector('#confirm-entrega').classList.remove('nwt-modal--visible'); return; }
      if (t.closest('#confirm-entrega [data-approve]')) {
        root.querySelector('#confirm-entrega').classList.remove('nwt-modal--visible');
        /* La entrega tarda: el botón queda en loading (spinner del SDK +
           aria-busy) hasta que se confirma, en vez de quedarse muerto y
           clickable durante esos 900ms. Es el único estado de carga del
           prototipo que responde a una espera de verdad. */
        var btn = root.querySelector('[data-entregar]');
        if (btn) { btn.classList.add('nwt-button--loading'); btn.setAttribute('aria-busy', 'true'); btn.disabled = true; btn.insertAdjacentHTML('beforeend', S.spinner()); }
        ctx.toast({ title: E.rutas.length > 1 ? 'Rutas entregadas' : 'Ruta entregada', message: E.rutas.map(function (r) { return r.codigo.split(' · ')[0]; }).join(' y ') + (E.rutas.length > 1 ? ' están' : ' está') + ' en la bandeja de ' + D.operadores.filter(function (o) { return o.id === E.operador; })[0].nombre + ' como Trazadas.', theme: 'positive', icon: 'positive' });
        setTimeout(function () { ctx.ir('#/admin'); }, 900);
      }
    }
    root.addEventListener('click', onClick);
    pintar();
    return function () { root.removeEventListener('click', onClick); if (mapa) { mapa.destruir(); } };
  }
};
