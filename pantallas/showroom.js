/**
 * /showroom — vitrina de venta del módulo, no una pantalla del producto.
 * Sin sesión: entra directo desde el link y desemboca en el mismo selector
 * de rol que #/ (ctx.entrar). Fuera del alcance de las siete pantallas.
 *
 * Estructura (acordada antes de construir): solución → lo central (evidencia
 * por unidad) → dos features fuertes (cámara del camión, auditoría) → las
 * intermedias → los diez estados → tabla completa → roles. Regla: mostrar
 * producto real antes que foto — el mapa animado, la card de evidencia, el
 * kanban y el teléfono son los mismos del módulo, con los datos de datos.js.
 * Los .nws-show__ph son los únicos huecos de imagen: fotos físicas que el
 * prototipo no tiene (la cámara montada en el compactador).
 *
 * Copy en español neutro: sin vos/tú, sin género marcado ("quien supervisa",
 * "el personal en campo"). Los nombres de rol se mantienen: son del sistema.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS.showroom = {
  fullscreen: true,
  titulo: 'Showroom',

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, e = S.esc;
    var AM = D.admin.metricas, SUP = D.supervision, R = D.revision, RM = R.metricas;
    var vivo = D.operador.enCalle[0];
    var camion = D.equipos[0];

    function ph(label, icon, cls, style) {
      return S.h('div', { class: S.cls('nws-show__ph', cls), style: style },
        S.h('div', { class: 'nws-show__ph-ic' }, S.icon(icon)),
        S.h('span', { class: 'nws-show__ph-label nwt-smalltext-font-semibold' }, label));
    }
    function lead(eyebrow, h2, p) {
      return S.h('div', { class: 'nws-show__lead' },
        eyebrow && S.h('span', { class: 'nws-show__eyebrow nwt-overline-font-semibold' }, eyebrow),
        S.h('h2', { class: 'nws-show__h2' }, h2),
        p && S.h('p', { class: 'nws-show__p nwt-body-font-regular' }, p));
    }

    /* ---------- 0 · nav ---------- */
    var nav = S.h('div', { class: 'nws-show__nav nws-reveal' },
      S.h('div', { class: 'nws-row' },
        S.avatar({ img: D.entidad.logo, text: D.entidad.monograma, size: 'small', variant: 'quiet', theme: 'neutral' }),
        S.h('span', { class: 'nwt-body-font-semibold' }, e(D.entidad.sigla) + ' · Rutas')),
      S.h('div', { class: 'nws-show__nav-links nwt-smalltext-font-semibold' },
        S.h('a', { href: '#evidencia', 'data-ir-ancla': 'evidencia' }, 'Evidencia'),
        S.h('a', { href: '#auditoria', 'data-ir-ancla': 'auditoria' }, 'Auditoría'),
        S.h('a', { href: '#funcionalidades', 'data-ir-ancla': 'funcionalidades' }, 'Funcionalidades'),
        S.h('a', { href: '#roles', 'data-ir-ancla': 'roles' }, 'Roles')),
      S.button({ label: 'Entrar al demo', size: 'medium', variant: 'loud', theme: 'primary', attrs: { 'data-ir': '#/' } }));

    /* ---------- 1 · solución + mapa real ---------- */
    var mapa = S.h('div', { class: 'nws-show__map-card', 'nwt-theme': 'primary' },
      S.h('div', { class: 'nws-row', style: 'justify-content:space-between' },
        S.h('span', { class: 'nws-live nwt-smalltext-font-semibold nws-ink' }, S.h('span', { class: 'nws-live__dot' }), e(vivo.ruta) + ' · en ejecución'),
        S.badge({ label: 'En vivo', size: 'small', theme: 'positive' })),
      /* El mismo mapa del detalle de ruta (mapa.js), pintado desde mount. */
      S.h('div', { class: 'nws-map nws-show__map', id: 'sr-mapa' }),
      S.h('div', { class: 'nws-show__map-kpis nwt-smalltext-font-regular nws-muted' },
        S.h('div', null, S.h('b', { class: 'nws-ink nws-tnum', 'data-bind': 'sr-avance' }, vivo.hechas + ' / ' + vivo.total), 'unidades marcadas'),
        S.h('div', null, S.h('b', { class: 'nws-ink nws-tnum' }, e(vivo.ultima)), 'última marca'),
        S.h('div', null, S.h('b', { class: 'nws-ink nws-tnum' }, e(vivo.eta)), 'llegada estimada')));

    var hero = S.h('div', { class: 'nws-show__hero nws-reveal', style: '--nws-reveal-delay:80ms' },
      S.h('div', { class: 'nws-show__hero-copy' },
        S.h('span', { class: 'nws-live nws-live--chip nwt-smalltext-font-semibold' }, S.h('span', { class: 'nws-live__dot' }), 'Demo interactivo · datos de muestra'),
        S.h('h1', { class: 'nws-show__title' }, 'Planear, ejecutar y verificar cada ruta de recolección. En un solo módulo.'),
        S.h('p', { class: 'nws-show__p nwt-body-font-regular', style: 'max-width:48ch' },
          'Desde que se traza la ruta hasta que se cierra con evidencia revisada, todo queda registrado en el mismo sistema — visible para la entidad y para cada operador contratado.'),
        S.h('div', { class: 'nws-row nws-row--md' },
          S.button({ label: 'Ver demos', size: 'large', variant: 'loud', theme: 'primary', attrs: { 'data-ir-ancla': 'roles' } }),
          S.button({ label: 'Ver una evidencia real', iconEnd: 'arrow-right', size: 'large', variant: 'mute', theme: 'neutral', attrs: { 'data-ir-ancla': 'evidencia' } }))),
      mapa);

    var stats = S.h('div', { class: 'nws-stats nws-show__stats nws-show__stats--hype nws-reveal', style: '--nws-reveal-delay:200ms' },
      S.statCard({ label: 'Rutas activas hoy', value: AM.activas, hint: AM.zonas + ' zonas en simultáneo', icon: 'shipping', theme: 'primary' }),
      S.statCard({ label: 'Unidades marcadas hoy', value: AM.marcadasHoy.toLocaleString('es-CO'), hint: 'de ' + AM.metaHoy.toLocaleString('es-CO') + ' proyectadas', theme: 'primary',
        extra: S.progress({ value: AM.marcadasHoy / AM.metaHoy * 100, size: 'medium', cls: 'nws-stat-progress', theme: 'primary' }) }),
      S.statCard({ label: 'Evidencias validadas', value: RM.evidencias, hint: 'ruta ' + R.ruta.codigo.split(' ·')[0] + ' · ' + RM.sinCamion + ' sin cámara del camión', icon: 'camera', theme: 'primary' }),
      S.statCard({ label: 'Conformidad del mes', valueHtml: S.h('span', { class: 'nws-delta' }, e(SUP.metricas.conformidadMes), S.badge({ label: SUP.metricas.variacion, size: 'small', theme: 'positive' })),
        hint: AM.completadasMes + ' rutas cerradas · ' + AM.variacionMes, theme: 'primary',
        extra: S.h('div', { class: 'nws-spark' }, SUP.metricas.sparkline.map(function (v) { return '<i style="height:' + v + '%"></i>'; })) }),
      S.statCard({ label: 'Operadores con contrato vigente', value: AM.operadoresVigentes, hint: AM.sinAsignar + ' rutas sin asignar todavía', icon: 'user', theme: 'primary' }),
      S.statCard({ label: 'Rutas fuera de plazo', value: SUP.metricas.fueraDePlazo, hint: 'ejecutadas hace más de dos días', icon: 'attention', theme: 'primary' }));

    /* ---------- 2 · lo central: evidencia por unidad (card real de revisión) ---------- */
    var FOTOS = R.evidenciaFotos || [];
    function foto(n) { return FOTOS.length ? 'background-image:url(' + FOTOS[n % FOTOS.length] + ');background-size:cover;background-position:center' : ''; }
    var x = R.evidencias[0];
    var thumbs = [];
    for (var i = 0; i < 14; i++) {
      var y = R.evidencias[i % R.evidencias.length];
      thumbs.push(S.h('span', { class: S.cls('nws-thumb', i === 0 && 'nws-thumb--on'), style: foto(i * 3), 'aria-hidden': 'true' },
        S.h('span', { class: 'nws-thumb__n nwt-smalltext-font-semibold' }, i + 1),
        S.h('span', { class: 'nws-thumb__b' }, S.badge({ icon: 'camera', label: y.camion ? 3 : 1, size: 'small', theme: y.camion ? 'positive' : 'caution' }))));
    }
    var evidencia = S.card({
      cls: 'nws-show__ev', attrs: { 'nwt-theme': 'primary' },
      header: S.h('div', { class: 'nws-card-head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Evidencia'),
        S.h('div', { class: 'nws-grow' }),
        S.h('span', { class: 'nwt-smalltext-font-semibold nws-muted' }, 'parada 1 de ' + RM.total + ' · ' + e(x.uid))),
      content:
        S.h('div', { class: 'nws-thumbs-slider' },
          S.h('div', { class: 'nws-thumbs' }, thumbs,
            S.h('span', { class: 'nws-thumb nws-show__thumb-more nwt-smalltext-font-semibold' }, '…' + RM.total))) +
        S.h('div', { class: 'nwt-divider nwt-divider--horizontal', style: 'margin:var(--naotech-sizing-16) 0' }) +
        S.h('div', { class: 'nws-ev' },
          S.h('div', { class: 'nws-ev__main nws-ev__photo', style: foto(0) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'operator-cam', size: 'small', theme: 'neutral' }))),
          S.h('div', { class: 'nws-ev__side' },
            S.h('div', { class: 'nws-ev__cam nws-ev__photo', style: foto(1) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'truck-cam-left', size: 'small', theme: 'positive' }))),
            S.h('div', { class: 'nws-ev__cam nws-ev__photo', style: foto(2) }, S.h('span', { class: 'nws-ev__tag' }, S.badge({ label: 'truck-cam-right', size: 'small', theme: 'positive' }))))) +
        S.h('div', { class: 'nws-ev__meta' },
          [['Hora', x.hora], ['Coordenada', x.coord], ['Unidad', x.uid + ' · ' + x.tipo], ['Dirección', x.dir], ['Cámaras', x.camion ? '3 de 3' : '1 de 3']].map(function (kv) {
            return S.h('div', { class: 'nws-col' }, S.h('span', { class: 'nwt-stat-card__label' }, kv[0]), S.h('span', { class: 'nwt-caption-font-semibold nws-tnum' }, e(kv[1])));
          }))
    });

    var secEvidencia = S.h('div', { class: 'nws-show__sec nws-reveal', id: 'evidencia' },
      lead('Lo central', 'Cada punto de recolección queda con hora, coordenada y fotografía.',
        'No es un reporte de confianza: quien supervisa puede verificar, unidad por unidad, que la ruta se cumplió — con la evidencia que el sistema capturó, no la que alguien contó.'),
      evidencia);

    /* ---------- 3a · cámara del camión ---------- */
    var secCamara = S.h('div', { class: 'nws-show__sec nws-show__sec--tight nws-reveal' },
      S.h('div', { class: 'nws-show__split' },
        S.h('div', { class: 'nws-show__split-media nws-show__split-media--l' },
          ph('Foto: cámara instalada en el compactador', 'camera', S.cls('nws-show__ph--fill', camion && camion.foto && 'nws-show__ph--foto'), camion && camion.foto ? 'background-image:url(' + camion.foto + ')' : ''),
          camion && S.h('span', { class: 'nws-show__ph-tag' }, S.badge({ label: camion.nombre + ' · ' + camion.placa, size: 'small', theme: 'neutral' }))),
        S.h('div', { class: 'nws-show__split-body' },
          S.h('div', null, S.badge({ label: 'Proceso asistido con hardware asociado', size: 'medium', theme: 'primary', icon: 'thunder' })),
          S.h('h2', { class: 'nws-show__h2' }, 'La fotografía no depende de quien opera la ruta.'),
          S.h('p', { class: 'nws-show__p nwt-body-font-regular' },
            'Cada unidad queda registrada dos veces: la que reporta el personal en campo y la que captura la cámara instalada en el compactador. Cuando la pregunta es "¿y si la foto se inventó?", la respuesta ya está en el sistema — y queda marcado de qué fuente viene cada evidencia.'),
          S.h('div', { class: 'nws-show__pasos' },
            [['camera', 'Cámara del camión', 'Dispara sola al pasar por la unidad — no depende de que alguien la accione.'],
             ['user', 'Personal en campo', 'Toma la foto de evidencia con el teléfono, desde el punto de recolección.'],
             ['positive', 'Dos fuentes, un registro', 'Ambas quedan marcadas por unidad y listas para comparar en la revisión.']]
              .map(function (p, i) {
                return S.h('div', { class: 'nws-show__paso' },
                  S.h('div', { class: 'nws-show__paso-ic' }, S.icon(p[0])),
                  S.h('span', { class: 'nwt-overline-font-semibold nws-muted' }, (i + 1) + '. ' + p[1]),
                  S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, p[2]));
              })),
          S.h('span', { class: 'nwt-smalltext-font-regular nws-soft' }, RM.sinCamion + ' de ' + RM.evidencias + ' evidencias de hoy quedó sin cámara del camión; se marca aparte, para revisión.'))));

    /* ---------- 3b · auditoría (kanban real, compacto) ---------- */
    var porCol = {};
    SUP.cards.forEach(function (c) { (porCol[c.col] = porCol[c.col] || []).push(c); });
    var kanban = S.h('div', { class: 'nws-kanban' }, SUP.columnas.map(function (col) {
      var cs = porCol[col.id] || [];
      return S.h('div', { class: 'nws-kanban__col', 'nwt-theme': col.theme },
        S.h('div', { class: 'nws-kanban__head' }, S.h('span', { class: 'nws-kanban__dot' }), S.h('span', { class: 'nwt-caption-font-semibold nws-grow' }, e(col.titulo)),
          S.badge({ label: col.id === 3 ? AM.completadasMes : cs.length, size: 'small', theme: 'neutral' })),
        S.h('div', { class: 'nws-kanban__body' }, cs.slice(0, 2).map(function (c) {
          var atraso = c.dias >= 3 && c.col < 2;
          return S.card({ size: 'small', variant: 'quiet', cls: 'nws-card--none',
            content: S.h('div', { class: 'nws-row nws-row--sm', style: 'flex-wrap:wrap' },
              S.h('span', { class: 'nwt-smalltext-font-semibold nws-clip' }, e(c.codigo)),
              atraso ? S.badge({ label: '+' + c.dias + ' días', size: 'small', theme: 'negative' }) : S.h('span', { class: 'nwt-caption-font-regular nws-muted' }, e(c.zona)),
              S.h('span', { class: 'nwt-caption-font-regular nws-muted nws-right nws-tnum' }, c.fotos + ' ev.')) });
        })));
    }));
    var secAuditoria = S.h('div', { class: 'nws-show__sec nws-show__sec--tight nws-reveal', id: 'auditoria' },
      S.h('div', { class: 'nws-show__split' },
        S.h('div', { class: 'nws-show__split-body' },
          S.h('div', null, S.badge({ label: 'Auditoría de la auditoría', size: 'medium', theme: 'informative' })),
          S.h('h2', { class: 'nws-show__h2' }, 'Quien supervisa también queda registrado.'),
          S.h('p', { class: 'nws-show__p nwt-body-font-regular' },
            'Toda ruta ejecutada pasa por revisión antes de cerrarse: conforme, o con hallazgos tipificados y observación obligatoria. El tablero muestra qué está por revisar, qué lleva más de 48 horas esperando y qué ya se cerró.'),
          S.h('div', { class: 'nws-row', style: 'flex-wrap:wrap' }, (R.hallazgos || []).map(function (hz) { return S.tag({ label: hz, size: 'medium' }); }))),
        S.h('div', { class: 'nws-show__split-media nws-show__split-media--r nws-show__kanban' }, kanban)));

    /* ---------- 4 · intermedias ---------- */
    var enVivo = S.h('div', { class: 'nws-show__card' },
      S.h('h3', { class: 'nws-show__h3' }, 'Dónde va cada camión, ahora'),
      S.h('p', { class: 'nws-show__p nwt-smalltext-font-regular' }, 'Hora de inicio, última unidad marcada y hora estimada de llegada, por camión — la pregunta que hoy se resuelve con una llamada, aquí se responde sola.'),
      S.h('div', { class: 'nws-show__card-foot' }, D.operador.enCalle.map(function (r) {
        return S.h('div', { class: 'nws-show__row' },
          S.avatar({ text: r.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }),
          S.h('div', { class: 'nws-col nws-grow' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(r.camion)), S.h('span', { class: 'nwt-caption-font-regular nws-muted nws-clip' }, e(r.ruta))),
          S.h('div', { class: 'nws-col nws-tnum', style: 'align-items:flex-end' }, S.h('span', { class: 'nwt-smalltext-font-semibold' }, r.hechas + ' / ' + r.total), S.h('span', { class: 'nwt-caption-font-regular nws-muted' }, 'ETA ' + e(r.eta))));
      })));
    var multiOp = S.h('div', { class: 'nws-show__card' },
      S.h('h3', { class: 'nws-show__h3' }, 'Varios operadores, un solo tablero'),
      S.h('p', { class: 'nws-show__p nwt-smalltext-font-regular' }, 'Los operadores contratados reportan bajo las mismas reglas y en el mismo sistema — sin un archivo distinto por cada uno.'),
      S.h('div', { class: 'nws-show__card-foot' }, D.operadores.map(function (o) {
        return S.h('div', { class: 'nws-show__row' },
          S.avatar({ text: o.ini, size: 'tiny', variant: 'quiet', theme: 'neutral' }),
          S.h('span', { class: 'nwt-smalltext-font-semibold nws-grow nws-clip' }, e(o.nombre)),
          S.h('span', { class: 'nwt-caption-font-regular nws-muted nws-tnum nws-nowrap' }, o.unidades + ' unidades · ' + o.operarios + ' personas'));
      })));
    var causales = (D.operarioApp && D.operarioApp.causales) || [];
    var telefono = S.h('div', { class: 'nws-show__card' },
      S.h('h3', { class: 'nws-show__h3' }, 'Reporte desde el punto de recolección'),
      S.h('p', { class: 'nws-show__p nwt-smalltext-font-regular' }, 'Cuando algo no se puede recoger, se registra con causal tipificado — no con texto libre que cada persona llena distinto.'),
      S.h('div', { class: 'nws-show__phone' },
        S.h('div', { class: 'nws-phone', 'nwt-theme': 'primary' },
          S.h('div', { class: 'nws-phone__screen' },
            S.h('div', { class: 'nws-mob__bar' }, S.icon('chevron-left'), S.h('span', { class: 'nwt-body-font-semibold' }, 'Marcar parada'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-right' }, e(R.evidencias[1].uid))),
            S.h('div', { class: 'nws-mob__body' },
              ph('Tomar foto de evidencia', 'camera', 'nws-show__ph--sm'),
              S.h('span', { class: 'nws-mob__sec nwt-caption-font-semibold' }, 'Causal'),
              S.h('div', { class: 'nws-row', style: 'flex-wrap:wrap' }, causales.map(function (c, i) { return S.tag({ label: c.txt, size: 'medium', active: i === 4, theme: 'primary' }); })),
              S.button({ label: 'Marcar como recolectada', size: 'large', variant: 'loud', theme: 'primary', disabled: true, cls: 'nws-mob__cta' }))))));
    var secIntermedias = S.h('div', { class: 'nws-show__sec nws-reveal' },
      lead(null, 'Lo que sostiene la operación diaria'),
      S.h('div', { class: 'nws-show__grid3' }, enVivo, multiOp, telefono));

    /* ---------- 5 · los diez estados ---------- */
    var ORDEN = ['trazada', 'asignada', 'programada', 'curso', 'ejecutada', 'revision', 'observada', 'cerrada'];
    var estados = S.h('div', { class: 'nws-show__estados' },
      ORDEN.map(function (k, i) {
        var st = D.estados[k];
        return (i ? S.h('span', { class: 'nws-show__estado-line' }) : '') + S.badge({ label: st.label, size: 'medium', theme: st.theme });
      }),
      S.h('div', { class: 'nws-show__estados-res' },
        S.h('span', { class: 'nwt-caption-font-regular nws-muted' }, 'resultado'),
        S.badge({ label: D.estados.conforme.label, size: 'small', theme: D.estados.conforme.theme }),
        S.badge({ label: D.estados.hallazgos.label, size: 'small', theme: D.estados.hallazgos.theme })));
    var secEstados = S.h('div', { class: 'nws-show__sec nws-reveal' },
      S.h('div', { class: 'nws-show__lead', style: 'text-align:center;margin:0 auto var(--naotech-sizing-32)' },
        S.h('h2', { class: 'nws-show__h2' }, 'Cada ruta pasa por diez estados. Todos visibles, ninguno se salta.'),
        S.h('p', { class: 'nws-show__p nwt-body-font-regular' }, 'El mismo estado que ve la entidad es el que ve el operador contratado y el que ve el personal en campo.')),
      estados);

    /* ---------- 6 · tabla completa ---------- */
    var AMB = {
      plan: ['Planeación', 'informative'], oper: ['Operación', 'primary'], campo: ['Campo', 'positive'], sup: ['Supervisión', 'caution'], trans: ['Transversal', 'neutral']
    };
    /* DC-300: la celda "Dónde verla" mostraba el href crudo (?rol=...#/...)
       como texto del link — un alias legible en vez de la query string. */
    var ALIAS_LINK = {
      '?rol=admin#/admin': 'Admin · Rutas', '?rol=admin#/admin/entrega': 'Admin · Entrega de ruta',
      '?rol=operador#/operador': 'Operador · Hub', '?rol=operador#/operador/ruta': 'Operador · Ruta en vivo',
      '?rol=operario#/operario': 'Operario · App móvil',
      '?rol=supervisor#/supervisor': 'Supervisor · Tablero', '?rol=supervisor#/supervisor/revision': 'Supervisor · Revisión',
      '#/': 'Selector de perfil'
    };
    var FILAS = [
      ['plan', 'Tablero de rutas', 'Indicadores de rutas activas, sin asignar, en ejecución (con avance) y completadas del mes con variación.', '?rol=admin#/admin'],
      ['plan', 'Asistente de nueva ruta en 3 pasos', 'Trazado manual o automático sobre el mapa, elección del operador por cobertura de zona y resumen tipo ticket antes de confirmar.', '?rol=admin#/admin'],
      ['plan', 'Trazado automático', 'Propone el recorrido y las unidades a partir de la zona; el trazado manual permite ajustarlo tramo a tramo.', '?rol=admin#/admin'],
      ['plan', 'Entrega de ruta al operador', 'Cobertura, recorrido, duración y modo visibles antes de entregar; confirmación explícita y cambio de estado a Trazada.', '?rol=admin#/admin/entrega'],
      ['plan', 'Lista de paradas numeradas', 'Cada ruta muestra sus unidades en orden de recorrido, con el tramo correspondiente resaltado en el mapa.', '?rol=admin#/admin/entrega'],
      ['oper', 'Operación en vivo', 'Camiones en calle con hora de inicio, última unidad marcada y llegada estimada; se actualiza sin recargar.', '?rol=operador#/operador'],
      ['oper', 'Próximos a salir', 'Rutas programadas con su cuadrilla y vehículo, listas para arrancar.', '?rol=operador#/operador'],
      ['oper', 'Asignación en 3 pasos', 'Conductor y hasta cinco recolectores, vehículo con fotografía, y resumen con la línea de tiempo de lo que sigue.', '?rol=operador#/operador'],
      ['oper', 'Detalle de ruta en vivo', 'Mapa con recorrido hecho y pendiente, camión en movimiento y cuadrilla; lista de paradas con conteo de fotos por unidad.', '?rol=operador#/operador/ruta'],
      ['oper', 'Mapa a pantalla completa', 'El recorrido en vivo se amplía en un modal para seguimiento en sala.', '?rol=operador#/operador/ruta'],
      ['campo', 'Aplicación móvil del personal en campo', 'Flujo Hoy → Mi ruta → Marcar → Cerrada, pensado para uso con guantes y a plena luz.', '?rol=operario#/operario'],
      ['campo', 'Indicaciones de giro', 'Mapa recortado con el siguiente giro y la lista de los próximos, al estilo de un navegador.', '?rol=operario#/operario'],
      ['campo', 'Fotografía obligatoria por unidad', 'No se puede marcar una unidad sin evidencia; hora y coordenada se capturan solas.', '?rol=operario#/operario'],
      ['campo', 'Causales tipificados', causales.map(function (c) { return c.txt; }).join(', ') + ' — con observación obligatoria según el caso.', '?rol=operario#/operario'],
      ['campo', 'Ruta siguiente bloqueada', 'La ruta programada no se abre hasta cerrar la actual; evita marcar fuera de orden.', '?rol=operario#/operario'],
      ['sup', 'Tablero de revisión Kanban / Tabla', 'Por revisar, En revisión, Observadas y Cerradas sobre el mismo conjunto de datos; vista intercambiable.', '?rol=supervisor#/supervisor'],
      ['sup', 'Alerta de plazo', 'Rutas con más de 48 horas sin revisar o tres días de atraso quedan marcadas; los mensajes cambian según los días.', '?rol=supervisor#/supervisor'],
      ['sup', 'Conformidad mensual', 'Porcentaje de rutas conformes con variación frente al mes anterior y tendencia.', '?rol=supervisor#/supervisor'],
      ['sup', 'Evidencia dual por unidad', 'Fotografía de quien opera y dos vistas de la cámara del camión; se indica cuando el camión no reportó.', '?rol=supervisor#/supervisor/revision'],
      ['sup', 'Tira de evidencias completa', 'Las ' + RM.total + ' unidades de la ruta como miniaturas navegables, sin resúmenes del tipo "+N más".', '?rol=supervisor#/supervisor/revision'],
      ['sup', 'Juicio con hallazgos tipificados', 'Conforme o Con hallazgos; los hallazgos son fijos y la observación es obligatoria.', '?rol=supervisor#/supervisor/revision'],
      ['sup', 'Línea de tiempo de la ruta', 'Hitos desde el trazado hasta el cierre, en la misma pantalla de revisión.', '?rol=supervisor#/supervisor/revision'],
      ['trans', 'Cuatro perfiles, una sesión', 'Administrador, Operador, Operario y Supervisor; se recuerda el último perfil usado.', '#/'],
      ['trans', 'Enlaces directos por pantalla', 'Cualquier pantalla se puede compartir con su perfil ya activo mediante ?rol=.', '#/'],
      ['trans', 'Diez estados de ruta', ORDEN.map(function (k) { return D.estados[k].label; }).concat([D.estados.conforme.label, D.estados.hallazgos.label]).join(', ') + '.', '#/'],
      ['trans', 'Contraste AA en indicadores', 'Los indicadores de estado usan la variante que cumple accesibilidad; se midió antes de decidirlo.', '#/'],
      ['trans', 'Mensajes contextuales', 'Confirmaciones y avisos narran la situación (días de atraso, plazo) en lugar de un texto genérico.', '#/'],
      ['trans', 'Ninguna acción muda', 'Lo que queda fuera de alcance del prototipo lo dice explícitamente en lugar de no responder.', '#/']
    ];
    var tabla = S.datatable({
      cls: 'nws-show__table', theme: 'primary',
      columns: [{ label: 'Ámbito', style: 'flex:0 0 140px' }, { label: 'Funcionalidad', style: 'flex:0 0 250px' }, { label: 'Qué hace', style: 'flex:1 1 auto' }, { label: 'Dónde verla', style: 'flex:0 0 270px' }],
      rows: FILAS.map(function (f, i) {
        var a = AMB[f[0]];
        var mismoEnlace = i > 0 && FILAS[i - 1][3] === f[3];
        return [
          S.badge({ label: a[0], size: 'small', theme: a[1] }),
          S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(f[1])),
          S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(f[2])),
          mismoEnlace ? '' : S.h('a', { class: 'nws-show__link', href: f[3], title: f[3] }, e(ALIAS_LINK[f[3]] || f[3]))
        ];
      })
    });
    var secTabla = S.h('div', { class: 'nws-show__sec nws-reveal', id: 'funcionalidades' },
      S.h('div', { class: 'nws-show__sec-head' },
        lead(null, 'Todo lo que incluye el módulo', 'Para quien evalúa técnicamente: cada fila abre la pantalla del demo donde se ve.'),
        S.badge({ label: FILAS.length + ' funcionalidades', size: 'medium', theme: 'neutral' })),
      tabla);

    /* ---------- 7 · roles ---------- */
    var INICIALES_ROL = { admin: 'AD', operador: 'OD', operario: 'OP', supervisor: 'SU' };
    var roles = S.h('div', { class: 'nws-show__roles' }, D.roles.map(function (r) {
      return S.card({
        onClick: true, size: 'large', variant: 'quiet',
        attrs: { 'data-rol': r.id, role: 'button', 'aria-label': 'Entrar como ' + r.rol },
        content: S.h('div', { class: 'nws-col', style: 'gap:var(--naotech-sizing-10)' },
          S.avatar({ text: INICIALES_ROL[r.id] || r.iniciales, size: 'medium', variant: 'loud', color: r.color }),
          S.h('div', { class: 'nws-col', style: 'align-items:center;gap:var(--naotech-sizing-2)' },
            S.h('span', { class: 'nwt-subtitle-font-bold' }, e(r.rol)),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(r.organizacion))),
          S.h('p', { class: 'nwt-smalltext-font-regular nws-muted', style: 'margin:0' }, e(r.descripcion))),
        footer: S.h('div', { style: 'width:100%' }, S.button({ label: 'Entrar', size: 'medium', variant: 'quiet', theme: r.theme, cls: 'nws-mob__cta', attrs: { 'data-rol': r.id, style: 'width:100%' } }))
      });
    }));
    var secRoles = S.h('div', { class: 'nws-show__sec nws-reveal', id: 'roles' },
      lead(null, 'Elija un perfil para recorrer el flujo completo.', 'Es el mismo demo del módulo; cada perfil entra directo a su pantalla de inicio.'),
      roles);

    var foot = S.h('div', { class: 'nws-show__foot nwt-smalltext-font-regular' },
      S.h('span', null, e(D.entidad.nombre) + ' · ' + e(D.entidad.gobierno) + ' · ' + e(D.entidad.plataforma)),
      S.h('span', null, 'Prototipo de demostración · datos de muestra · sesión ficticia'));

    return S.h('div', { class: 'nws-show' },
      S.h('div', { class: 'nws-show__wrap' }, nav, hero, stats, secEvidencia, secAuditoria, secCamara, secIntermedias, secEstados, secTabla, secRoles, foot));
  },

  mount: function (root, ctx) {
    var M = window.MAPA, D = ctx.D;
    var vivo = D.operador.enCalle[0];
    var st = { hechas: vivo.hechas, vivo: true };
    var mapa = M.crear(root.querySelector('#sr-mapa'), {
      ruta: M.rutas.enVivo(vivo.total), hechas: st.hechas, pad: 40,
      leyenda: ['recorrido', 'pendiente', 'traslado'], aria: 'Mapa del recorrido de la ruta en ejecución'
    });
    function avance() { root.querySelectorAll('[data-bind="sr-avance"]').forEach(function (n) { n.textContent = st.hechas + ' / ' + vivo.total; }); }

    /* Mismo ritmo que el detalle de ruta del operador: viaja, marca, sigue.
       Al terminar vuelve a la base y arranca otra vez, para que el mapa de la
       vitrina nunca quede quieto. */
    var timer = null;
    function programar(ms) { clearTimeout(timer); timer = setTimeout(paso, ms); }
    function paso() {
      if (!st.vivo) { return; }
      if (st.hechas < vivo.total) {
        st.hechas++;
        mapa.animarA(st.hechas).then(function () { avance(); programar(900 + Math.random() * 900); });
      } else {
        mapa.animarA(vivo.total + 1).then(function () {
          if (!st.vivo) { return; }
          timer = setTimeout(function () { st.hechas = 0; mapa.set({ hechas: 0, enBase: false }); avance(); programar(900); }, 1800);
        });
      }
    }
    avance();
    programar(1400);

    /* Entrada: lo de arriba (nav/hero/stats) al montar, con doble rAF para
       que el navegador no funda el frame en opacity:0 con el de --in; las
       secciones de abajo, la primera vez que entran en pantalla al hacer
       scroll — es una página larga, no todo debería animar de una. */
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      root.querySelectorAll('.nws-show__nav.nws-reveal, .nws-show__hero.nws-reveal, .nws-show__stats.nws-reveal')
        .forEach(function (el) { el.classList.add('nws-reveal--in'); });
    }); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) { return; }
        en.target.classList.add('nws-reveal--in');
        observer.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    root.querySelectorAll('.nws-show__sec.nws-reveal').forEach(function (el) { observer.observe(el); });

    function onClick(ev) {
      var a = ev.target.closest('[data-ir-ancla]');
      if (a) { ev.preventDefault(); var t = root.querySelector('#' + a.getAttribute('data-ir-ancla')); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
      var rol = ev.target.closest('[data-rol]');
      if (rol) { ev.preventDefault(); ctx.entrar(rol.getAttribute('data-rol')); return; }
    }
    root.addEventListener('click', onClick);
    return function () { st.vivo = false; clearTimeout(timer); mapa.destruir(); observer.disconnect(); root.removeEventListener('click', onClick); };
  }
};
