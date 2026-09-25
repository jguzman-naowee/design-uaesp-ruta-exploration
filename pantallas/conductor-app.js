/**
 * Operario · app móvil (390×800) dentro de un marco de teléfono.
 * Vistas: hoy → mi ruta (mapa cuadrado + giro) → marcar parada (foto +
 * causal + observación) → ruta cerrada. Y historial.
 * Sin sidebar: la sesión se cierra desde la barra superior del escenario.
 *
 * Cómo se siente app y no página: el cromo del teléfono (barra de estado,
 * barra de título, tabbar) es un solo DOM que nunca se vuelve a pintar; lo
 * único que cambia es la vista, y cambia como en el sistema operativo —se
 * empuja al avanzar, retrocede al volver, se funde al cambiar de tab. Cada
 * vista carga la primera vez con su propia silueta, las acciones que "van
 * al servidor" (foto, enviar, cerrar) muestran su progreso en el mismo botón,
 * y los avisos salen dentro de la pantalla, no en la página que la aloja.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['conductor-app'] = (function () {

  /* Latencia simulada de la app: misma perilla que el router (`?lento` la
     sube a 4s para mirar las siluetas con calma). Se lee al momento porque
     la query puede cambiar entre una carga y otra del prototipo. */
  function latencia() { return /[?&]lento\b/.test(location.search) ? 4000 : 520; }

  /* Qué vistas cargan y cuántas veces. `una`: la primera vez que se entra
     (después quedan en caché, como una app que ya trajo su ruta). `siempre`:
     cada entrada trae algo distinto (el detalle de la unidad que se va a
     marcar). Las que no figuran son resultado de una acción, no una carga. */
  var CARGA = { hub: 'una', ruta: 'una', hist: 'una', marcar: 'siempre' };
  var TAB_DE = { hub: 'hub', ruta: 'ruta', marcar: 'ruta', fin: 'ruta', hist: 'hist' };
  var ORDEN = { hub: 0, ruta: 1, hist: 2 };

  /* ---------- piezas de cromo y siluetas, compartidas por render y mount ---------- */
  function sk(S, w, h, extra) {
    return S.h('span', { class: S.cls('nws-skel', extra), style: 'width:' + w + ';height:' + h });
  }

  function barraEstado(S, hora) {
    return S.h('div', { class: 'nws-mob__status nwt-smalltext-font-semibold', 'aria-hidden': 'true' },
      S.h('span', null, hora),
      S.h('div', { class: 'nws-mob__status__r' },
        S.h('span', { class: 'nws-mob__status__sig' }, '<i></i><i></i><i></i><i></i>'),
        S.h('span', { class: 'nws-mob__status__bat' })));
  }

  /* DC-107: fila de marca fija arriba de #mob-bar — Naowee horizontal a la
     izquierda, UAESP a la derecha. Estática (no la toca barra() en mount,
     que solo repinta #mob-bar). */
  function barraMarca(S, D) {
    return S.h('div', { class: 'nws-mob__marca' },
      S.h('div', { class: 'nws-mob__marca__naowee' }, window.NAOWEE.logo),
      S.avatar({ img: D.entidad.logo, text: D.entidad.monograma, size: 'small', variant: 'quiet', theme: 'neutral' }));
  }

  function tabbar(S, T, valor) {
    return S.h('div', { class: 'nws-mob__nav', id: 'mob-nav' }, S.tabs({ id: 'mob-tabs', fullWidth: true, theme: T, value: valor, items: [
      { id: 'h', label: 'Hoy', value: 'hub', icon: 'home' },
      { id: 'r', label: 'Mi ruta', value: 'ruta', icon: 'shipping' },
      { id: 'x', label: 'Historial', value: 'hist', icon: 'history' }] }));
  }

  function barraCarga(S) {
    return S.h('div', { class: 'nws-grow nws-col', style: 'gap:var(--naotech-sizing-6)' },
      sk(S, '38%', 'var(--naotech-sizing-20)'), sk(S, '62%', 'var(--naotech-sizing-12)')) +
      sk(S, 'var(--naotech-sizing-32)', 'var(--naotech-sizing-32)', 'nws-skel--circle');
  }

  /* Siluetas por vista. Cada una copia el ritmo vertical de la vista real
     (mismos bloques, alturas parecidas) para que al llegar los datos nada
     salte de lugar: la carga se lee como "esto mismo, todavía sin tinta". */
  function esqueleto(S, v, T) {
    var sec = sk(S, '42%', 'var(--naotech-sizing-14)');
    var fila = function () {
      return S.h('div', { class: 'nws-mob__skel-row' },
        sk(S, '26px', '26px', 'nws-skel--circle'),
        S.h('div', { class: 'nws-grow nws-col', style: 'gap:var(--naotech-sizing-6)' }, sk(S, '62%', 'var(--naotech-sizing-14)'), sk(S, '40%', 'var(--naotech-sizing-12)')),
        sk(S, '36px', 'var(--naotech-sizing-12)'));
    };
    if (v === 'ruta') {
      return S.h('div', { class: 'nws-row', style: 'gap:var(--naotech-sizing-8);align-items:stretch' },
          sk(S, '100%', 'var(--naotech-sizing-56)'), sk(S, '96px', 'var(--naotech-sizing-56)')) +
        S.h('div', { class: 'nws-skel nws-mob__skel-map' }, S.icon('gps-pin')) +
        S.h('div', { class: 'nws-col', style: 'gap:0' }, fila(), fila(), fila(), fila(), fila()) +
        sk(S, '100%', 'var(--naotech-sizing-56)');
    }
    if (v === 'marcar') {
      return S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-8)' },
          sk(S, '70%', 'var(--naotech-sizing-20)'),
          S.h('div', { class: 'nws-row nws-row--sm' }, sk(S, '76px', 'var(--naotech-sizing-20)'), sk(S, '90px', 'var(--naotech-sizing-14)'))) +
        sk(S, '100%', '120px') +
        sk(S, '100%', 'var(--naotech-sizing-48)') +
        S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-8)' }, sk(S, '34%', 'var(--naotech-sizing-14)'), sk(S, '100%', 'var(--naotech-sizing-64)')) +
        S.h('div', { style: 'height:64px' });
      /* El botón "Enviar" ya no va acá — es fijo (#mob-cta, DC-027) y su
         propia silueta la pinta pintarCta() cuando st.cargando. */
    }
    if (v === 'hist') {
      return S.card({ skeleton: true, size: 'small' }) +
        sec + S.h('div', { class: 'nws-col', style: 'gap:0' }, fila()) +
        sec + S.h('div', { class: 'nws-col', style: 'gap:0' }, fila(), fila(), fila(), fila());
    }
    /* hub */
    return S.h('div', { class: 'nwt-stat-card nwt-stat-card--skeleton nws-stat-hero', 'nwt-theme': T, 'aria-busy': 'true', style: 'flex-direction:column;align-items:stretch;gap:var(--naotech-sizing-10)' },
        S.h('div', { class: 'nws-row' }, sk(S, '34%', 'var(--naotech-sizing-14)'), S.h('div', { class: 'nws-grow' }), sk(S, '26%', 'var(--naotech-sizing-14)')),
        S.h('div', { class: 'nws-row', style: 'justify-content:space-between;align-items:center' }, sk(S, '44%', 'var(--naotech-sizing-28)'), sk(S, '56px', 'var(--naotech-sizing-40)')),
        S.h('div', { class: 'nws-row nws-row--md', style: 'justify-content:space-between;padding-top:var(--naotech-sizing-8)' }, sk(S, '22%', 'var(--naotech-sizing-12)'), sk(S, '22%', 'var(--naotech-sizing-12)'), sk(S, '30%', 'var(--naotech-sizing-12)'))) +
      S.h('div', { class: 'nws-row', style: 'justify-content:space-between;align-items:center' }, sec, sk(S, '92px', 'var(--naotech-sizing-24)')) +
      S.card({ skeleton: true, header: true, footer: true, size: 'small' }) +
      sec + S.card({ skeleton: true, header: true, size: 'small' }) +
      sec + S.card({ skeleton: true, size: 'small' });
  }

  return {
    fullscreen: true,
    /* El render es puro cromo + silueta, igual en las dos pasadas del router:
       la carga se resuelve adentro del teléfono (mount), no repintando el
       marco. Ver `estable` en app.js. */
    estable: true,
    titulo: 'App del conductor',

    render: function (ctx) {
      var S = ctx.S, rol = ctx.rol, D = ctx.D, A = D.operarioApp;
      return S.h('div', { class: 'nws-col', style: 'height:100%;background:var(--naotech-app-color-100)' },
        S.toolbar({
          body: S.h('div', { class: 'nws-row nws-title-light' }, S.h('div', { class: 'nws-title__naowee' }, window.NAOWEE.icono), S.avatar({ img: D.entidad.logo, text: D.entidad.monograma, size: 'small', variant: 'quiet', theme: 'neutral' }), S.title({ text: 'App del conductor', subtitle: rol.nombre + ' · ' + rol.organizacion })),
          actions: S.button({ label: 'Cambiar de perfil', icon: 'logout', size: 'medium', variant: 'quiet', theme: 'neutral', attrs: { 'data-logout': true } })
        }),
        S.h('div', { class: 'nws-phone-stage', id: 'stage' },
          S.h('div', { class: 'nws-phone-zoom' },
            S.iconButton({ icon: 'zoom-out', size: 'small', variant: 'mute', theme: 'neutral', label: 'Alejar', attrs: { 'data-zoom': 'out' } }),
            S.iconButton({ icon: 'refresh', size: 'small', variant: 'mute', theme: 'neutral', label: 'Ajustar al espacio disponible', attrs: { 'data-zoom': 'fit' } }),
            S.iconButton({ icon: 'zoom-in', size: 'small', variant: 'mute', theme: 'neutral', label: 'Acercar', attrs: { 'data-zoom': 'in' } })),
          /* El marco, el zoom y la barra del escenario no dependen de ningún
             dato: se pintan siempre. Adentro, el cromo de la app (estado,
             título, tabbar) tampoco: lo que espera es la vista, y por eso la
             silueta va ahí — la carga se lee dentro del teléfono y no como un
             teléfono que todavía no llegó. */
          S.h('div', { class: 'nws-phone', id: 'phone', 'nwt-theme': rol.theme },
            S.h('div', { class: 'nws-phone__screen nws-mob', id: 'mob' },
              barraEstado(S, A.evidencia.hora.slice(0, 5)),
              barraMarca(S, D),
              S.h('div', { class: 'nws-mob__bar', id: 'mob-bar' }, barraCarga(S)),
              S.h('div', { class: 'nws-mob__view', id: 'mob-view' },
                S.h('div', { class: 'nws-mob__body', 'aria-busy': 'true' }, esqueleto(S, 'hub', rol.theme))),
              /* DC-027: "Enviar" pegado al fondo de verdad, no sticky dentro
                 del scroll (eso solo lo ata mientras se scrollea, y con
                 contenido corto el botón se queda a mitad de pantalla). Slot
                 fijo, fuera de nws-mob__body — mismo nivel que el tabbar,
                 se llena solo en la vista 'marcar' (ver pintarCta en mount). */
              S.h('div', { class: 'nws-mob__foot', id: 'mob-cta' }),
              tabbar(S, rol.theme, 'hub'),
              S.h('div', { class: 'nws-mob__toast', id: 'mob-toast' })))));
    },

    /* Geometría del escenario, no dato: el marco mide 390×824 fijos y hay que
       encogerlo para que quepa. El router la corre en las dos pasadas, así que
       el teléfono ya está a su tamaño mientras carga en vez de desbordar y
       saltar al llegar los datos. */
    ajustar: function (root, ctx, mult) {
      var stage = root.querySelector('#stage'), phone = root.querySelector('#phone');
      if (!stage || !phone) { return; }
      var r = stage.getBoundingClientRect();
      var fit = Math.min((r.width - 48) / 390, (r.height - 48) / 824, 1);
      phone.style.transform = 'scale(' + (fit * (mult || 1)).toFixed(3) + ')';
    },

    mount: function (root, ctx) {
      var S = ctx.S, D = ctx.D, M = window.MAPA, A = D.operarioApp, T = ctx.rol.theme, e = S.esc;
      var barEl = root.querySelector('#mob-bar'), viewEl = root.querySelector('#mob-view'), navEl = root.querySelector('#mob-nav'), toastEl = root.querySelector('#mob-toast'), ctaEl = root.querySelector('#mob-cta');
      var CUADRILLA = A.cuadrilla || [];
      var total = A.paradas.length;
      var HIST = A.historial || [];
      var RUTA = M.rutas.operario(total);

      function estadoInicial() {
        /* DC-013: la causal "Recolectado" ya viene preseleccionada (causales:
           ['ok']); lo que faltaba era que el acordeón arrancara abierto para
           que se vea sin necesidad de tocarlo. */
        return { v: 'hub', marcadas: [], idx: 0, involucrado: null, nota: '', opt: true, causales: ['ok'], turnMore: false,
          pos: 0, enBase: false, cargando: false, vistas: {}, enviando: false, cerrando: false, recien: null };
      }
      var st = estadoInicial();

      /* Temporizadores: todos pasan por acá para poder cancelarlos al
         desmontar, y `seq` invalida los que quedaron viejos porque el
         usuario ya se fue a otra vista antes de que "llegara" la respuesta. */
      var timers = [], seq = 0, ultimaBarra = null;
      function timer(fn, ms) { var id = setTimeout(function () { timers.splice(timers.indexOf(id), 1); fn(); }, ms); timers.push(id); return id; }

      function km(m) { return m >= 1000 ? (Math.round(m / 100) / 10).toFixed(1).replace('.', ',') + ' km' : m + ' m'; }
      /* DC-012: CUADRILLA no trae foto (solo nombre) — se identifica con
         iniciales, mismo patrón que el resto del demo (op.ini en Admin). */
      function inicialesDe(nombre) {
        return (nombre.match(/[A-ZÁÉÍÓÚÑ]/g) || []).slice(0, 2).join('') || nombre.slice(0, 1).toUpperCase();
      }
      function sumDesde(desde, campo) { var t = 0; for (var i = desde; i < total; i++) { t += A.paradas[i][campo]; } return t; }
      var GIRO_ICON = { u: 'arrow-up', r: 'arrow-right', l: 'arrow-left', f: 'positive' };

      /* ---------- toast dentro del teléfono ----------
         Es el toast de la app (app.js) apuntado al host de la pantalla del
         teléfono: mismo componente, mismos tiempos, un solo lugar donde
         se decide cómo se ve un aviso. */
      function toastMob(cfg) { ctx.toast(Object.assign({ host: toastEl, ms: 3800 }, cfg)); }
      function cerrarToastMob() { ctx.cerrarToast(toastEl); }

      /* ---------- barra de título ---------- */
      function barra() {
        var hechas = st.marcadas.length, completa = hechas === total;
        var sigIdx = Math.min(hechas, total - 1), GS = A.paradas[sigIdx];
        var titulo = 'Hoy', sub = D.entidad.fecha.replace('martes 17 de septiembre', 'martes 17') + ' · ' + D.roles[2].nombre;
        if (st.v === 'ruta')   { titulo = A.ruta.codigo; sub = completa ? 'todas las paradas marcadas' : 'siguiente · ' + GS.dir; }
        if (st.v === 'marcar') { titulo = 'Parada ' + (st.idx + 1) + ' de ' + total; sub = A.ruta.codigo; }
        if (st.v === 'fin')    { titulo = 'Ruta cerrada'; sub = A.ruta.codigo; }
        if (st.v === 'hist')   { titulo = 'Historial'; sub = HIST.length + ' rutas en los últimos 7 días'; }
        var conBack = st.v === 'ruta' || st.v === 'marcar';
        return (conBack ? S.iconButton({ icon: 'chevron-left', size: 'small', variant: 'mute', theme: 'neutral', label: 'Volver', attrs: { 'data-m': 'back' } }) : '') +
          S.h('div', { class: 'nws-grow nws-col', style: 'min-width:0' },
            S.h('span', { class: 'nwt-body-font-bold nws-clip', style: 'font-size:var(--naotech-sizing-18);line-height:var(--naotech-sizing-24)' }, e(titulo)),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-clip' }, e(sub))) +
          (st.v === 'hub' ? S.iconButton({ icon: 'refresh', size: 'small', variant: 'mute', theme: 'neutral', label: 'Actualizar jornada', attrs: { 'data-m': 'refrescar' } }) : '') +
          (st.v === 'hub' || st.v === 'hist' ? S.avatar({ text: D.roles[2].iniciales, size: 'small', variant: 'loud', theme: T }) : '');
      }

      /* ---------- cuerpo de cada vista ---------- */
      function cuerpo() {
        var hechas = st.marcadas.length, pct = Math.round(hechas / total * 100), completa = hechas === total;
        var minutos = hechas * 19, tiempo = Math.floor(minutos / 60) + 'h' + ('0' + minutos % 60).slice(-2);
        var ritmo = hechas ? Math.max(3, Math.round(hechas * 60 / minutos)) : 0;
        var sigIdx = Math.min(hechas, total - 1), GS = A.paradas[sigIdx];
        var body = '';

        if (st.v === 'hub') {
          var hero = hechas === 0
            ? S.h('div', { class: 'nwt-stat-card nws-stat-hero', 'nwt-theme': T, style: 'flex-direction:column;align-items:stretch;gap:var(--naotech-sizing-8)' },
                S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-stat-card__label' }, 'Tu jornada'), S.h('div', { class: 'nws-grow' }),
                  S.h('span', { class: 'nwt-smalltext-font-regular', style: 'color:inherit;opacity:.85' }, A.jornada.desde + ' — ' + A.jornada.hasta)),
                /* DC-079: los dividers (líneas) se cambian por el mismo
                   fondito claro que ya usan En ruta/Ritmo/Faltan (DC-060) —
                   pedido explícito, para que todos los bloques del hero se
                   vean consistentes. */
                S.h('div', { class: 'nws-mob__stat', style: 'flex-direction:row;justify-content:space-between;align-items:center;width:100%' },
                  S.h('span', { class: 'nwt-smalltext-font-bold', style: 'max-width:14ch;text-align:left' }, 'Puntos por recolectar'),
                  S.h('span', { class: 'nwt-stat-card__value', style: 'font-size:var(--naotech-sizing-40);line-height:var(--naotech-sizing-40)' }, total)),
                S.h('div', { class: 'nws-row nws-row--md' },
                  S.h('div', { class: 'nws-mob__stat' }, S.h('span', { class: 'nwt-smalltext-font-bold nws-clip', style: 'color:inherit;display:block;width:100%;text-align:center' }, A.ruta.camion)),
                  S.h('div', { class: 'nws-mob__stat' }, S.h('span', { class: 'nwt-smalltext-font-bold nws-clip', style: 'color:inherit;display:block;width:100%;text-align:center' }, A.ruta.zona)),
                  S.h('div', { class: 'nws-mob__stat' }, S.h('span', { class: 'nwt-smalltext-font-bold nws-clip', style: 'color:inherit;display:block;width:100%;text-align:center' }, km(sumDesde(0, 'm')) + ' de recorrido'))))
            : S.h('div', { class: 'nwt-stat-card nws-stat-hero', 'nwt-theme': T, style: 'flex-direction:column;align-items:stretch;gap:var(--naotech-sizing-8)' },
                S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-stat-card__label' }, 'Recolectadas hoy'), S.h('div', { class: 'nws-grow' }), S.h('span', { class: 'nws-live nws-live--chip nwt-smalltext-font-semibold' }, S.h('span', { class: 'nws-live__dot' }), 'en vivo')),
                S.h('div', { class: 'nws-delta' }, S.h('span', { class: 'nwt-stat-card__value', style: 'font-size:var(--naotech-sizing-40);line-height:var(--naotech-sizing-40)' }, hechas), S.h('span', { class: 'nwt-stat-card__hint' }, 'de ' + total + ' de tu ruta')),
                S.progress({ value: pct, size: 'medium', theme: T }),
                S.h('div', { class: 'nws-mob__stats' },
                  S.h('div', { class: 'nws-mob__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, tiempo), S.h('span', { class: 'nwt-stat-card__label' }, 'En ruta')),
                  S.h('div', { class: 'nws-mob__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, ritmo + '/h'), S.h('span', { class: 'nwt-stat-card__label' }, 'Ritmo')),
                  S.h('div', { class: 'nws-mob__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, total - hechas), S.h('span', { class: 'nwt-stat-card__label' }, 'Faltan'))));

          /* DC-018: antes de iniciar, GS ya es A.paradas[0] (sigIdx clamp);
             solo hacía falta no esconder el bloque cuando hechas === 0 — el
             camión (el mapa) todavía no arranca, pero la distancia y el
             tiempo a la primera parada ya se conocen de antemano. */
          var nxt = !completa
            ? S.h('div', { class: 'nws-nxt' },
                S.h('div', { class: 'nws-nxt__i' }, S.icon('gps-pin')),
                S.h('div', { class: 'nws-grow', style: 'min-width:0' }, S.h('div', { class: 'nwt-smalltext-font-semibold nws-nxt__l' }, hechas === 0 ? 'Primera parada' : 'Siguiente parada'), S.h('div', { class: 'nwt-caption-font-medium nws-clip' }, e(GS.dir))),
                S.h('div', { class: 'nws-stop__et' }, S.h('span', { class: 'nwt-caption-font-bold' }, km(GS.m)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, GS.min + ' min')))
            : '';
          var hint = hechas === 0
            ? S.h('div', { class: 'nws-mob__lock nwt-smalltext-font-regular' }, S.icon('shipping'), 'Al iniciar se activa el mapa y las paradas se habilitan una por una, en orden.')
            : '';

          body =
            hero +
            S.h('span', { class: 'nws-mob__sec nwt-overline-font-semibold' }, hechas === 0 ? 'Tu ruta de hoy' : 'Ruta en curso') +
            S.card({ size: 'small', cls: 'nws-card--none', attrs: { 'nwt-theme': T }, content:
              S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-12)' },
                S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-body-font-bold nws-grow' }, e(A.ruta.codigo)), S.badge({ label: hechas ? 'En curso' : 'Por iniciar', size: 'small', theme: hechas ? 'informative' : 'neutral' })),
                S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, total + ' puntos · ' + A.ruta.zona + ' · ' + A.ruta.camion),
                S.progress({ value: pct, size: 'small', theme: T }),
                nxt, hint,
                S.button({ label: hechas === 0 ? 'Iniciar ruta' : completa ? 'Cerrar ruta' : 'Continuar ruta', size: 'large', variant: 'loud', theme: T, loading: completa && st.cerrando, attrs: { 'data-m': completa ? 'cerrar' : 'ruta' } })) }) +
            S.h('span', { class: 'nws-mob__sec nwt-overline-font-semibold' }, 'Después, hoy') +
            S.card({ size: 'small', cls: 'nws-card--none', content:
              S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-body-font-bold nws-grow' }, e(A.programada.codigo)), S.badge({ label: A.programada.cuando, size: 'medium', theme: 'neutral' })) +
              S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, A.programada.unidades + ' puntos · ' + A.programada.zona) +
              S.h('div', { class: 'nws-mob__lock nwt-smalltext-font-regular', style: 'margin-top:var(--naotech-sizing-6)' }, S.icon('padlock-close'), 'Se habilita cuando cierres la ' + A.ruta.codigo.split(' ')[0]) }) +
            S.h('span', { class: 'nws-mob__sec nwt-overline-font-semibold' }, 'Completadas hoy') +
            S.card({ size: 'small', cls: 'nws-card--none', content:
              S.h('div', { class: 'nws-row' }, S.h('div', { class: 'nws-mob__avatar-icon' }, S.avatarIcon({ icon: 'positive', theme: 'positive' })),
                S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nwt-body-font-bold' }, e(A.completada.codigo)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, A.completada.horario + ' · ' + A.completada.unidades + ' puntos · ' + A.completada.fotos + ' fotos'))) });
        }

        if (st.v === 'ruta') {
          var mmapHd = S.h('div', { class: 'nws-mmap__hd nws-mmap__hd--inline' },
            S.h('div', { class: 'nws-mmap__pg' },
              S.h('div', { class: 'nws-row nws-row--sm', style: 'font-size:11px;font-weight:600;color:var(--naotech-app-color-700)' }, S.h('span', { style: 'font-size:16px;font-weight:800;color:var(--naotech-app-color-900)' }, hechas), 'de ' + total + ' paradas'),
              S.progress({ value: pct, size: 'small', theme: T })),
            S.h('div', { class: 'nws-mmap__eta' },
              S.h('div', { class: 'nwt-caption-font-bold nws-tnum', style: 'color:inherit' }, completa ? km(0) : km(sumDesde(hechas, 'm'))),
              S.h('div', { class: 'nwt-smalltext-font-semibold', style: 'color:inherit;opacity:.7' }, completa ? '0 restantes' : sumDesde(hechas, 'min') + ' min restantes')));

          /* El mapa (mapa.js) se crea sobre este marco después de pintar: el
             camión sale de la base, va a la siguiente unidad al marcarla y, con
             la ruta completa, vuelve al patio. */
          var mapa = S.h('div', { class: 'nws-mmap', id: 'mmap' });

          var siguientes = A.paradas.slice(sigIdx + 1, sigIdx + 5);
          var turn = S.h('div', { class: 'nws-turn nws-turn--sticky' },
            !completa && siguientes.length ? S.h('div', { class: S.cls('nws-turn__more', st.turnMore && 'nws-turn__more--open') },
              siguientes.map(function (p, k) {
                return S.h('div', { class: 'nws-row nws-row--sm' },
                  S.icon(GIRO_ICON[p.g]),
                  S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(p.gt)), S.h('span', { class: 'nwt-caption-font-regular nws-muted' }, 'parada ' + (sigIdx + k + 2))),
                  S.h('span', { class: 'nwt-caption-font-bold nws-tnum' }, km(p.m)));
              })) : '',
            S.h('div', { class: 'nws-turn__a' }, S.icon(completa ? 'positive' : GIRO_ICON[GS.g])),
            S.h('div', { class: 'nws-grow', style: 'min-width:0' },
              S.h('div', { class: 'nwt-subtitle-font-semibold nws-turn__t', style: 'opacity:.7' }, completa ? 'ruta completa' : 'en ' + km(GS.m)),
              S.h('div', { class: 'nwt-body-font-semibold nws-turn__t' }, completa ? 'Volvé al patio' : e(GS.gt)),
              S.h('div', { class: 'nwt-smalltext-font-regular nws-turn__m' }, completa ? 'la ruta quedó lista para cerrar' : 'parada ' + (sigIdx + 1) + ' · ' + e(GS.gm))),
            !completa && siguientes.length ? S.iconButton({ icon: st.turnMore ? 'chevron-down' : 'chevron-up', size: 'small', variant: 'mute', theme: 'neutral', label: st.turnMore ? 'Ocultar próximas indicaciones' : 'Ver próximas indicaciones', attrs: { 'data-m': 'turnmore' } }) : '');

          /* la parada recién marcada y la que se habilita entran con un fade:
             son las dos filas que cambiaron; el resto ya estaba */
          var recien = st.recien; st.recien = null;
          var lista = S.h('div', { class: 'nws-stops nws-stops--flow' }, A.paradas.map(function (p, k) {
            var done = k < hechas, next = k === sigIdx && !completa;
            var meta = done ? p.tipo.toLowerCase() + ' · marcada ' + p.hora : next ? p.tipo.toLowerCase() + ' · tocá para recolectar' : p.tipo.toLowerCase() + ' · se habilita en turno';
            return S.h('div', { class: S.cls('nws-stop', done && 'nws-stop--hecha', next && 'nws-stop--actual', !done && !next && 'nws-stop--lk', next && 'nws-stop--click', recien !== null && (k === recien || next) && 'nws-stop--recien'), 'data-parada': next ? k : undefined },
              S.h('div', { class: 'nws-stop__n nwt-smalltext-font-semibold' }, done ? S.icon('positive') : k + 1),
              S.h('div', { class: 'nws-grow nws-col' }, S.h('span', { class: 'nws-stop__dir nwt-body-font-medium' }, e(p.dir)), S.h('span', { class: 'nws-stop__meta nwt-smalltext-font-regular' }, e(meta))),
              !done && S.h('div', { class: 'nws-stop__et' }, S.h('span', { class: 'nwt-caption-font-bold nws-tnum' }, km(p.m)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, p.min + ' min')),
              !done && !next && S.icon('padlock-close', 'nws-soft'),
              next && S.icon('chevron-right', 'nws-soft'));
          }));

          body = mmapHd + mapa + lista + (completa ? S.button({ label: 'Cerrar ruta', size: 'large', variant: 'loud', theme: 'positive', loading: st.cerrando, attrs: { 'data-m': 'cerrar' } }) : '') + turn;
        }

        if (st.v === 'marcar') {
          var p = A.paradas[st.idx];
          var TODAS = [{ id: 'ok', txt: 'Recolectado', rec: true }].concat(A.causales);
          var elegidas = TODAS.filter(function (c) { return st.causales.indexOf(c.id) >= 0; });
          var requiereObs = elegidas.some(function (c) { return !c.rec; });
          var resumen = elegidas.length ? elegidas.map(function (c) { return c.txt; }).join(', ') : 'Elegí qué pasó';
          var opts = S.h('div', { class: 'nws-opt' },
            S.h('div', { class: 'nws-opt__h nwt-caption-font-semibold', 'data-m': 'toggleopt' },
              S.icon('filter', 'nws-soft'),
              S.h('span', { class: 'nws-grow nwt-body-font-semibold' }, resumen),
              S.icon(st.opt ? 'chevron-up' : 'chevron-down', 'nws-soft')) +
            /* El cuerpo se emite SIEMPRE, abierto o cerrado, y lo que cambia es
               la clase del panel: sin un nodo estable en el DOM no hay dos
               estados entre los que transicionar, y el acordeón aparecía de
               golpe empujando todo lo de abajo. Es la misma técnica de
               NwtAccordion (grid-template-rows 0fr↔1fr), ver .nws-opt__p. */
            S.h('div', { class: S.cls('nws-opt__p', st.opt && 'nws-opt__p--open') },
              S.h('div', { class: 'nws-opt__b' }, TODAS.map(function (c) {
                var on = st.causales.indexOf(c.id) >= 0;
                /* La × se emite siempre y la esconde el CSS: si se agregara al
                   elegir, el chip se ensancharía de golpe y recorrería la fila. */
                return S.h('div', { class: S.cls('nws-opt__c nwt-smalltext-font-semibold', on && 'nws-opt__c--on'), 'data-causal': c.id }, e(c.txt), S.h('span', { class: 'nws-opt__c__x' }, '×'));
              }))));
          var involucradoNombre = st.involucrado ? (CUADRILLA.filter(function (c) { return c.id === st.involucrado; })[0] || {}).nombre : null;
          var involucrado = CUADRILLA.length ? S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-6)' },
            S.h('span', { class: 'nwt-smalltext-font-semibold nws-dark' }, 'Involucrado (opcional)'),
            S.h('div', { class: 'nws-row', style: 'flex-wrap:wrap;gap:var(--naotech-sizing-6)' }, CUADRILLA.map(function (c) {
              var on = st.involucrado === c.id;
              /* DC-025: el avatar 'tiny' mide 32px de alto y el chip venía
                 fijo en 30px — apretado por diseño, no percepción. El
                 modificador le da su propio piso de alto y más padding. */
              return S.h('div', { class: S.cls('nws-opt__c nws-opt__c--avatar nwt-smalltext-font-semibold', on && 'nws-opt__c--on'), 'data-involucrado': c.id },
                S.avatar({ text: inicialesDe(c.nombre), size: 'tiny', variant: 'quiet', theme: 'neutral' }), e(c.nombre), on ? S.h('span', null, '×') : '');
            }))) : '';
          body =
            S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-4)' },
              S.h('span', { class: 'nwt-subtitle-font-bold' }, e(p.dir)),
              /* DC-026/DC-059: "más alto el texto" / mínimo 14px en esta
                 vista — 'medium' se quedaba en 12px, 'large' da 14px. */
              S.h('div', { class: 'nws-row' }, S.badge({ label: p.tipo, size: 'large', theme: 'neutral' }), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Punto ' + p.uid))) +
            opts +
            involucrado +
            /* DC-027: "Enviar" ya no vive acá — pintarCta() lo pone en el
               slot fijo #mob-cta, fuera del scroll. Se deja espacio abajo
               para que el texto no quede tapado por ese pie fijo. */
            S.textArea({ label: requiereObs ? 'Observación (requerida por la novedad)' : (involucradoNombre ? 'Nota para ' + involucradoNombre : 'Observación (opcional)'), placeholder: 'Solo si hace falta…', rows: 2, size: 'small', value: st.nota, name: 'nota' }) +
            S.h('div', { style: 'height:64px' });
        }

        if (st.v === 'fin') {
          /* DC-017: era solo el check + un dato — "no usa el mapa ni da buen
             feedback". Sigue siendo un estado final (nada que revisar, nada
             que corregir), pero ahora se ve la ruta recién hecha (mapa
             estático, ver pintarMapaFin) y deja al conductor con el próximo
             paso del día a la vista en vez de un punto muerto. Coreografía de
             cierre: check (scale, frenando) → texto → mapa → resumen →
             próxima ruta → botón; los retardos van inline porque el sistema
             fija duración y curva pero no escalona. */
          body =
            S.h('div', { class: 'nws-mob__fin', style: 'padding-bottom:0' },
              S.h('div', { class: 'nws-mob__fin-ic', 'nwt-motion': 'scale', 'nwt-motion-intent': 'enter', 'nwt-motion-duration': 'slow', 'nwt-motion-easing': 'deceleration' }, S.icon('positive')),
              S.h('div', { class: 'nws-col', 'nwt-motion': 'fade', 'nwt-motion-intent': 'enter', style: 'align-items:center;gap:var(--naotech-sizing-4);animation-delay:var(--naotech-duration-fast)' },
                S.h('span', { class: 'nwt-subtitle-font-bold' }, 'Ruta ejecutada'),
                S.h('span', { class: 'nwt-smalltext-font-regular nws-muted', style: 'padding:0 var(--naotech-sizing-24)' }, e(A.ruta.codigo) + ' · las ' + total + ' puntos de recolección quedaron marcados con evidencia y ya viajan al supervisor.'))) +
            S.h('div', { class: 'nws-map nws-map--mini', id: 'mmap-fin', 'nwt-motion': 'fade', 'nwt-motion-intent': 'enter', style: 'width:100%;animation-delay:var(--naotech-duration-base)' }) +
            S.card({ size: 'small', cls: 'nws-card--none nws-card--flush', attrs: { 'nwt-motion': 'slide', 'nwt-motion-direction': 'up', 'nwt-motion-intent': 'enter', style: 'animation-delay:var(--naotech-duration-base)' }, content: S.h('div', { class: 'nws-row', style: 'gap:0' },
              [['Puntos', total], ['Evidencias', total], ['Duración', '2h34']].map(function (kv, i) {
                return S.h('div', { class: 'nws-col nws-grow', style: 'padding:var(--naotech-sizing-12) var(--naotech-sizing-14);' + (i < 2 ? 'border-right:1px solid var(--naotech-app-color-200)' : '') },
                  S.h('span', { class: 'nwt-stat-card__label' }, kv[0]), S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, kv[1]));
              })) }) +
            S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-6);width:100%;animation-delay:var(--naotech-duration-slow)', 'nwt-motion': 'fade', 'nwt-motion-intent': 'enter' },
              S.h('span', { class: 'nws-mob__sec nwt-overline-font-semibold', style: 'margin:0' }, 'Después, hoy'),
              S.card({ size: 'small', cls: 'nws-card--none', content:
                S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-body-font-bold nws-grow' }, e(A.programada.codigo)), S.badge({ label: A.programada.cuando, size: 'medium', theme: 'neutral' })) +
                S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, A.programada.unidades + ' puntos · ' + A.programada.zona) })) +
            S.button({ label: 'Volver a hoy', size: 'large', variant: 'loud', theme: T, attrs: { 'data-m': 'reiniciar', 'nwt-motion': 'fade', 'nwt-motion-intent': 'enter', style: 'animation-delay:var(--naotech-duration-slow)' } });
        }

        if (st.v === 'hist') {
          var hoy = HIST.filter(function (r) { return r.dia === 'hoy'; }), antes = HIST.filter(function (r) { return r.dia !== 'hoy'; });
          var unidades = HIST.reduce(function (t, r) { return t + r.unidades; }, 0), novedades = HIST.reduce(function (t, r) { return t + r.novedades; }, 0);
          /* DC-343: cada ruta del historial con la misma anatomía que las cards
             de "Completadas hoy": card small, avatar-icon de estado, código en
             bold y horario · unidades debajo, badge de novedades a la derecha. */
          var fila = function (r) {
            return S.card({ size: 'small', cls: 'nws-card--none', content:
              S.h('div', { class: 'nws-row' },
                S.h('div', { class: 'nws-mob__avatar-icon' }, S.avatarIcon({ icon: r.novedades ? 'attention' : 'positive', theme: r.novedades ? 'warning' : 'positive' })),
                S.h('div', { class: 'nws-grow nws-col', style: 'min-width:0' },
                  S.h('span', { class: 'nwt-body-font-bold nws-clip' }, e(r.codigo)),
                  S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-clip' }, e(r.dia + ' · ' + r.horario + ' · ' + r.unidades + ' unidades'))),
                r.novedades ? S.badge({ label: r.novedades + (r.novedades === 1 ? ' novedad' : ' novedades'), size: 'small', theme: 'warning' }) : S.badge({ label: 'Sin novedades', size: 'small', theme: 'positive' })) });
          };
          body =
            S.card({ size: 'small', cls: 'nws-card--none nws-card--flush', content: S.h('div', { class: 'nws-row', style: 'gap:0' },
              [['Rutas', HIST.length], ['Puntos', unidades], ['Novedades', novedades]].map(function (kv, i) {
                return S.h('div', { class: 'nws-col nws-grow', style: 'padding:var(--naotech-sizing-12) var(--naotech-sizing-14);' + (i < 2 ? 'border-right:1px solid var(--naotech-app-color-200)' : '') },
                  S.h('span', { class: 'nwt-stat-card__label' }, kv[0]), S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, kv[1]));
              })) }) +
            (hoy.length ? S.h('span', { class: 'nws-mob__sec nwt-overline-font-semibold' }, 'Hoy') + S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-8)' }, hoy.map(fila)) : '') +
            S.h('span', { class: 'nws-mob__sec nwt-overline-font-semibold' }, 'Esta semana') +
            S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-8)' }, antes.map(fila)) +
            S.h('div', { class: 'nws-mob__lock nwt-smalltext-font-regular' }, S.icon('history'), 'El detalle de cada ruta cerrada lo revisa el supervisor; acá queda el resumen.');
        }
        return body;
      }

      /* ---------- mapa de "mi ruta" ----------
         El cuerpo de la vista se vuelve a crear en cada pintura, así que el
         mapa también; lo que persiste es dónde estaba el camión (st.pos) para
         que, si acaba de marcar una unidad, se lo vea viajar hasta ella en vez
         de aparecer ya ahí. El controlador viejo no borra su dibujo al
         destruirse: la vista saliente conserva su mapa mientras se va. */
      var mapaMob = null;
      function pintarMapa() {
        if (mapaMob) { mapaMob.destruir(); mapaMob = null; }
        var el = viewEl.querySelector('.nws-mob__body:not(.nws-mob__body--saliente) #mmap'); if (!el) { return; }
        var hechas = st.marcadas.length, completa = hechas === total;
        var desde = Math.min(st.pos, hechas);
        mapaMob = M.crear(el, { ruta: RUTA, hechas: desde, enBase: st.enBase, pad: 34, uMin: 0.7, aria: 'Mapa de la ruta' });
        if (desde < hechas) { mapaMob.animarA(hechas).then(function () { st.pos = hechas; }); }
        else if (completa && !st.enBase) { mapaMob.animarA(total + 1, 2600).then(function () { st.enBase = true; }); }
        st.pos = hechas;
      }

      /* DC-017: recapitulación estática en la pantalla de cierre — la ruta
         completa, quieta, camión ya en el patio. Sin animación: acá no hay
         nada "en curso" que mostrar, es la foto de lo que ya pasó. */
      var mapaFin = null;
      function pintarMapaFin() {
        if (mapaFin) { mapaFin.destruir(); mapaFin = null; }
        var el = viewEl.querySelector('.nws-mob__body:not(.nws-mob__body--saliente) #mmap-fin'); if (!el) { return; }
        mapaFin = M.crear(el, { ruta: RUTA, hechas: total, enBase: true, pad: 24, uMin: 0.7, aria: 'Recorrido de la ruta ejecutada' });
      }

      /* ---------- transición de vista ----------
         La vista vieja se queda en el DOM, en absoluto, saliendo, mientras la
         nueva entra. `push` empuja hacia la izquierda (se avanza), `pop`
         hacia la derecha (se vuelve), `fade` funde (cambio de tab, silueta →
         datos), `none` reemplaza en el lugar (cambios dentro de la misma
         vista: chips, acordeón — nada debe moverse ni parpadear). */
      function transicionar(html, trans) {
        var viejo = viewEl.querySelector('.nws-mob__body:not(.nws-mob__body--saliente)');
        if (trans === 'none' && viejo) {
          viejo.innerHTML = html;
          if (st.cargando) { viejo.setAttribute('aria-busy', 'true'); } else { viejo.removeAttribute('aria-busy'); }
          return;
        }
        viewEl.querySelectorAll('.nws-mob__body--saliente').forEach(function (n) { n.remove(); });
        var nuevo = document.createElement('div');
        nuevo.className = 'nws-mob__body';
        if (st.cargando) { nuevo.setAttribute('aria-busy', 'true'); }
        nuevo.innerHTML = html;
        if (viejo) {
          var scroll = viejo.scrollTop;
          viejo.classList.add('nws-mob__body--saliente');
          viejo.setAttribute('nwt-motion', trans === 'fade' ? 'fade' : 'slide');
          viejo.setAttribute('nwt-motion-intent', 'exit');
          if (trans !== 'fade') { viejo.setAttribute('nwt-motion-direction', trans === 'push' ? 'right' : 'left'); }
          viejo.scrollTop = scroll;
          var fuera = false;
          var sacar = function () { if (fuera) { return; } fuera = true; viejo.remove(); };
          viejo.addEventListener('animationend', sacar);
          timer(sacar, 400);
        }
        nuevo.setAttribute('nwt-motion', trans === 'fade' || !viejo ? 'fade' : 'slide');
        nuevo.setAttribute('nwt-motion-intent', 'enter');
        if (trans !== 'fade' && viejo) { nuevo.setAttribute('nwt-motion-direction', trans === 'push' ? 'left' : 'right'); }
        viewEl.appendChild(nuevo);
      }

      function tabsActivas() {
        var valor = TAB_DE[st.v];
        navEl.querySelectorAll('[data-tab]').forEach(function (t) {
          var on = t.getAttribute('data-tab') === valor;
          t.classList.toggle('nwt-tabs__tab--active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }

      /* DC-027: "Enviar" fijo al fondo del teléfono, fuera de nws-mob__body
         — así no depende del scroll para estar visible. Solo existe en la
         vista 'marcar'; en cualquier otra, el slot queda vacío. */
      function pintarCta() {
        if (st.v !== 'marcar') { ctaEl.innerHTML = ''; return; }
        ctaEl.innerHTML = S.button({
          label: st.cargando ? 'Enviar' : st.enviando ? 'Enviando…' : 'Enviar',
          size: 'large', variant: 'loud', theme: T, skeleton: st.cargando, loading: !st.cargando && st.enviando,
          attrs: { 'data-m': 'marcar', style: 'height:52px;--pvt-button-font-size:var(--naotech-sizing-16)' }
        });
      }

      function pintar(trans) {
        var b = barra();
        if (b !== ultimaBarra) {
          /* la barra se funde solo si cambió de verdad (otra vista); en los
             repintados internos ni se toca */
          if (ultimaBarra === null || trans === 'none') { barEl.innerHTML = b; } else { S.repintar(barEl, b); }
          ultimaBarra = b;
        }
        transicionar(st.cargando ? esqueleto(S, st.v, T) : cuerpo(), trans || 'none');
        if (st.v === 'ruta' && !st.cargando) { pintarMapa(); }
        if (st.v === 'fin' && !st.cargando) { pintarMapaFin(); }
        pintarCta();
        tabsActivas();
        /* DC-342: la barra de tabs solo en las vistas de primer nivel (Hoy,
           Mi ruta, Historial); marcar parada y ruta cerrada son internas y
           tienen su propio "atrás" en la barra. */
        root.querySelector('#mob-nav').classList.toggle('nws-hidden', st.v === 'marcar' || st.v === 'fin');
        ctx.posicionarIndicadores(root);
        requestAnimationFrame(function () { ctx.posicionarIndicadores(root); });
      }

      /* Ir a una vista, cargándola si corresponde: entra la silueta con la
         transición pedida y los datos la reemplazan con un fade. */
      function irA(v, trans) {
        st.v = v;
        var modo = CARGA[v];
        var carga = modo === 'siempre' || (modo === 'una' && !st.vistas[v]);
        if (!carga) { st.cargando = false; pintar(trans); return; }
        st.cargando = true; pintar(trans);
        var tok = ++seq;
        timer(function () {
          if (tok !== seq || st.v !== v) { return; }
          st.cargando = false; st.vistas[v] = true; pintar('fade');
        }, modo === 'siempre' ? Math.round(latencia() * 0.7) : latencia());
      }
      function irATab(v) {
        var desde = ORDEN[TAB_DE[st.v]], hasta = ORDEN[v];
        irA(v, hasta > desde ? 'push' : hasta < desde ? 'pop' : 'fade');
      }

      /* ---------- eventos ---------- */
      function onClick(ev) {
        var t = ev.target;
        if (t.closest('#mob-toast [data-close-toast]')) { cerrarToastMob(); return; }
        /* mientras una acción está en curso no se toca nada más: el botón
           ya está diciendo que trabaja */
        if (st.enviando || st.cerrando) { return; }
        var tab = t.closest('#mob-tabs [data-tab]'); if (tab) { var v = tab.getAttribute('data-tab'); if (st.v !== v) { irATab(v); } return; }
        var par = t.closest('[data-parada]'); if (par) { st.idx = +par.getAttribute('data-parada'); st.involucrado = null; st.nota = ''; st.opt = true; st.causales = ['ok']; irA('marcar', 'push'); return; }
        var ca = t.closest('[data-causal]');
        if (ca) {
          var id = ca.getAttribute('data-causal');
          var pos = st.causales.indexOf(id);
          if (pos >= 0) { st.causales.splice(pos, 1); } else { st.causales.push(id); }
          var elegida = null; A.causales.forEach(function (c) { if (c.id === id) { elegida = c; } });
          if (elegida && pos < 0 && !st.nota) { st.nota = elegida.obs; }
          pintar('none'); return;
        }
        var inv = t.closest('[data-involucrado]');
        if (inv) { var iid = inv.getAttribute('data-involucrado'); st.involucrado = st.involucrado === iid ? null : iid; pintar('none'); return; }
        var m = t.closest('[data-m]'); if (!m) { return; }
        var a = m.getAttribute('data-m');
        if (a === 'back') { irA(st.v === 'marcar' ? 'ruta' : 'hub', 'pop'); return; }
        if (a === 'ruta') { irA('ruta', 'push'); return; }
        if (a === 'refrescar') {
          st.vistas.hub = false; ++seq;
          irA('hub', 'fade');
          var tokR = seq;
          timer(function () { if (tokR === seq && st.v === 'hub' && !st.cargando) { toastMob({ title: 'Jornada actualizada', message: 'Datos al día con la central · ' + A.evidencia.hora.slice(0, 5), theme: 'positive', icon: 'refresh' }); } }, latencia() + 80);
          return;
        }
        if (a === 'turnmore') { st.turnMore = !st.turnMore; pintar('none'); return; }
        if (a === 'toggleopt') { st.opt = !st.opt; pintar('none'); return; }
        if (a === 'marcar') {
          st.enviando = true; pintar('none');
          var tokE = ++seq, idx = st.idx;
          timer(function () {
            if (tokE !== seq || st.v !== 'marcar') { return; }
            st.enviando = false;
            if (st.marcadas.indexOf(idx) < 0) { st.marcadas.push(idx); }
            st.recien = idx; st.involucrado = null; st.nota = ''; st.opt = true; st.causales = ['ok'];
            irA('ruta', 'pop');
            var quedan = total - st.marcadas.length;
            toastMob({ title: 'Parada ' + (idx + 1) + ' marcada', message: quedan ? 'El camión ya está capturando evidencia · faltan ' + quedan + ' de ' + total : 'El camión ya está capturando evidencia · ruta completa, ya podés cerrarla', theme: 'positive', icon: 'positive' });
          }, Math.round(latencia() * 1.6));
          return;
        }
        if (a === 'cerrar') {
          /* el aviso de la última parada ya cumplió: no tiene que tapar el cierre */
          cerrarToastMob();
          st.cerrando = true; pintar('none');
          var tokC = ++seq;
          timer(function () { if (tokC !== seq) { return; } st.cerrando = false; irA('fin', 'push'); }, Math.round(latencia() * 2));
          return;
        }
        if (a === 'reiniciar') {
          /* vuelta al principio del demo: la jornada se vuelve a cargar, la
             ruta también la próxima vez que se abra */
          cerrarToastMob();
          st = estadoInicial(); ++seq;
          irA('hub', 'pop');
          return;
        }
      }
      function onInput(ev) { if (ev.target.matches('[data-field="nota"]')) { st.nota = ev.target.value; } }

      /* Zoom del teléfono: "fit" recalcula la escala contra el espacio
         disponible del escenario; +/- ajustan un múltiplo sobre esa base.
         Sin esto el marco (390×824 con el borde) desborda el escenario en
         pantallas chicas o se ve diminuto en una grande.
         El múltiplo vive acá porque es interacción; la escala base es geometría
         y vive en `ajustar`, que el router corre también en la fase de carga. */
      var zoom = { mult: 1 };
      var self = this;
      function aplicarZoom() { self.ajustar(root, ctx, zoom.mult); }
      function onZoomClick(ev) {
        var z = ev.target.closest('[data-zoom]'); if (!z) { return; }
        var a = z.getAttribute('data-zoom');
        if (a === 'in') { zoom.mult = Math.min(2, zoom.mult + 0.15); }
        if (a === 'out') { zoom.mult = Math.max(0.5, zoom.mult - 0.15); }
        if (a === 'fit') { zoom.mult = 1; }
        aplicarZoom();
      }
      function onResize() { aplicarZoom(); }
      root.addEventListener('click', onClick); root.addEventListener('click', onZoomClick); root.addEventListener('input', onInput);
      window.addEventListener('resize', onResize);

      /* Primera pintura: la silueta del hub que dejó el render se funde con
         los datos. El hub queda cargado; las demás vistas cargan al entrar. */
      st.vistas.hub = true;
      pintar('fade'); aplicarZoom();

      return function () {
        timers.forEach(clearTimeout); cerrarToastMob();
        if (mapaMob) { mapaMob.destruir(); }
        if (mapaFin) { mapaFin.destruir(); }
        root.removeEventListener('click', onClick); root.removeEventListener('click', onZoomClick); root.removeEventListener('input', onInput); window.removeEventListener('resize', onResize);
      };
    }
  };
})();
