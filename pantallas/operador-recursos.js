/**
 * Operador · Flota (antes rol propio 'refuse-collection-vehicle', 21-sep:
 * el camión dejó de tener portal — lo que reporta se ve dentro del detalle
 * de cada ruta, y su estado de flota vive acá, dentro de Operador).
 * Parqueo, mantenimiento y actividad en vivo — superficial a propósito
 * (Capa 4 del rediseño 21-sep): reusa el dataset de D.equipos que ya usaba
 * el asistente de asignación de Operador, no inventa uno nuevo. Todavía sin
 * GPS ni cámaras en vivo: eso es un paso posterior, no esta capa.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS['operador-recursos'] = {
  titulo: 'Flota',

  toolbar: function (ctx) {
    var S = ctx.S, D = ctx.D;
    var EQ = D.equipos;
    var enRuta = {}; D.operador.enCalle.forEach(function (o) { enRuta[o.camion] = o; });
    var nParqueados = EQ.filter(function (q) { return !q.mantenimiento && !enRuta[q.nombre]; }).length;
    var nEnRuta = EQ.filter(function (q) { return !q.mantenimiento && enRuta[q.nombre]; }).length;
    var nMantenimiento = EQ.filter(function (q) { return q.mantenimiento; }).length;
    /* DC-009/DC-070: reemplaza el avatar del usuario (ya redundante — el rol
       se ve en el pie del sidebar) por un vistazo de salud de flota. Era una
       barra fina + un número — "más gráfico" (comparado con los chips de
       notificación de operador-hub.js, DC-011): un badge de color por
       estado, mismo peso visual que esos chips. */
    function chip(n, theme, label) {
      return n ? S.h('div', { class: 'nws-flota-salud__chip' }, S.badge({ label: n, size: 'small', theme: theme }), S.h('span', null, label)) : '';
    }
    var salud = S.h('div', { class: 'nws-flota-salud' },
      /* DC-103/DC-104: mismo cambio que la card (Disponible, naranja). */
      chip(nParqueados, 'caution', 'disponibles'),
      chip(nEnRuta, 'informative', 'en ruta'),
      chip(nMantenimiento, 'negative', 'mantenimiento'));
    return {
      /* DC-109: la entrada del login ahora dice "Gestión de Flota"; el título
         de la pantalla se alinea y el subtítulo deja explícito que es la
         vista de Flota desde el rol Operador (no un rol propio). */
      body: S.title({ text: 'Gestión de Flota', subtitle: 'Vista de Operario · Parqueo, mantenimiento y actividad en vivo' }),
      actions: salud
    };
  },

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, T = ctx.rol.theme, e = S.esc;
    var EQ = D.equipos;
    var enRuta = {}; D.operador.enCalle.forEach(function (o) { enRuta[o.camion] = o; });
    var porSalir = {}; D.operador.proximos.forEach(function (p) { porSalir[p.camion] = p; });

    function estadoDe(q) {
      if (q.mantenimiento) { return { label: 'En mantenimiento', theme: 'negative' }; }
      /* DC-032: verde + ícono que gire. No hay un ícono de "rueda" en la
         fuente de iconos (grep sobre vendor/icons.css, 145 nombres, ninguno
         wheel/gear/spin) — se reusa 'refresh' con una rotación continua
         (.nws-badge-spin), que es justo "algo que va dando vueltas". */
      if (enRuta[q.nombre]) { return { label: 'En ruta', theme: 'positive', icon: 'refresh', iconCls: 'nws-badge-spin' }; }
      /* DC-103/DC-104: "Parqueado" → "Disponible", verde → naranja
         (theme:'caution', el tono naranja del set del SDK). */
      return { label: 'Disponible', theme: 'caution' };
    }

    var nParqueados = EQ.filter(function (q) { return !q.mantenimiento && !enRuta[q.nombre]; }).length;
    var nEnRuta = EQ.filter(function (q) { return !q.mantenimiento && enRuta[q.nombre]; }).length;
    var nMantenimiento = EQ.filter(function (q) { return q.mantenimiento; }).length;

    var stats = S.h('div', { class: 'nws-stats nws-stats--hero' },
      S.statCard({ label: 'Flota total', value: EQ.length, hint: 'vehículos registrados', cls: 'nws-stat-hero', theme: T, icon: 'vehicles' }),
      S.statCard({ label: 'Parqueados', value: nParqueados, hint: 'libres, sin ruta activa', icon: 'gps-pin', theme: T }),
      S.statCard({ label: 'En ruta ahora', value: nEnRuta, hint: 'con avance en vivo', icon: 'shipping', theme: T }),
      S.statCard({ label: 'En mantenimiento', value: nMantenimiento, hint: 'fuera de operación', icon: 'attention', theme: T }));

    var grid = S.h('div', { class: 'nws-tabla', style: 'flex:1' },
      S.h('div', { class: 'nws-tabla__head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Vehículos'),
        S.badge({ label: EQ.length, size: 'small', theme: 'neutral' })),
      /* DC-006: en 3 columnas la card no tenía ancho para foto + nombre/tipo +
         2 stats + actividad + badge — el texto se cortaba y el badge
         terminaba envolviendo mal (.nws-pick .nws-row trae flex-wrap). Baja
         a 2 columnas (modificador ya existente) y el nombre/tipo se recortan
         con elipsis en vez de romperse; el badge queda con flex:none para
         no competir por espacio. */
      S.h('div', { class: 'nws-pick-grid nws-pick-grid--2' }, EQ.map(function (q) {
        var est = estadoDe(q);
        var actividad = enRuta[q.nombre]
          ? 'en ' + enRuta[q.nombre].ruta + ' · ' + Math.round(enRuta[q.nombre].hechas / enRuta[q.nombre].total * 100) + '% avance'
          : porSalir[q.nombre]
          ? 'próxima salida ' + porSalir[q.nombre].salida + ' · ' + porSalir[q.nombre].ruta
          : q.mantenimiento
          ? 'sin fecha de vuelta a servicio'
          : 'sin actividad programada';
        return S.card({ size: 'small', cls: 'nws-pick nws-pick--flota', attrs: { 'nwt-theme': T },
          /* DC-056: 16px de gap (el default de .nws-row es 8px). */
          content: S.h('div', { class: 'nws-row', style: 'align-items:flex-start;gap:var(--naotech-sizing-16)' },
            S.h('div', { class: 'nws-pick__foto nws-pick__foto--tall', style: q.foto ? 'background-image:url(' + q.foto + ');background-size:cover;background-position:center' : '' }, q.foto ? '' : S.icon('vehicles')),
            S.h('div', { class: 'nws-grow nws-col' },
              S.h('span', { class: 'nwt-body-font-semibold nws-clip' }, e(q.nombre)),
              /* DC-043: nws-dark (800), no nws-muted (600) — para no
                 confundirse con la actividad de abajo, que sí sigue muted. */
              S.h('span', { class: 'nwt-smalltext-font-regular nws-dark nws-clip' }, e(q.tipo + ' · ' + q.placa)),
              /* DC-030: la actividad sube a 3er lugar, debajo de la
                 descripción (tipo · placa) y antes de las stats. */
              S.h('span', { class: 'nwt-smalltext-font-regular nws-muted nws-clip' }, e(actividad)),
              S.h('div', { class: 'nws-pick__stats' },
                S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, e(q.capacidad)), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Capacidad')),
                S.h('div', { class: 'nws-pick__stat' }, S.h('span', { class: 'nwt-body-font-bold nws-tnum' }, q.cuadrilla + ' personas'), S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, 'Cuadrilla')))),
            S.h('div', { style: 'flex:none' }, S.badge({ label: est.label, size: 'medium', theme: est.theme, icon: est.icon, cls: est.iconCls }))) });
      })));

    /* DC-031: no solo hoy — varios días, partidos por día adentro de la
       misma lista (mismo patrón que el historial del conductor: encabezado
       de sección cuando cambia "dia", sin repetir card por día). */
    var ACT = D.operador.actividadFlota || D.operador.completadasHoy.map(function (c) { return { dia: 'hoy', codigo: c.codigo, operario: c.operario, horario: c.horario.replace(/^hoy\s*/, '') }; });
    var diaPintado = null;
    /* DC-101 (revierte DC-058): el botón de "ingreso a mantenimiento" salía
       por un toast sin flujo real detrás — se saca; DC-102 pide algo más
       concreto (filas reales de camiones en mantenimiento en esta misma
       lista) en vez de un botón que solo avisa "disponible próximamente". */
    var historial = S.h('div', { class: 'nws-tabla', style: 'flex:0 0 320px' },
      S.h('div', { class: 'nws-tabla__head' },
        S.h('span', { class: 'nwt-body-font-semibold' }, 'Actividades recientes')),
      S.card({ cls: 'nws-card--fill nws-card--flush', style: 'flex:1', attrs: { 'nwt-theme': T },
        content: S.h('div', { class: 'nws-list nws-list--zebra' }, ACT.map(function (c) {
          var sec = '';
          if (c.dia !== diaPintado) {
            diaPintado = c.dia;
            sec = S.h('div', { class: 'nwt-overline-font-semibold nws-muted', style: 'padding:var(--naotech-sizing-8) var(--naotech-sizing-12) 0' }, e(c.dia));
          }
          return sec + S.h('div', { class: 'nws-list__row', style: 'flex-direction:column;align-items:stretch;gap:var(--naotech-sizing-6)' },
            /* DC-042: cada fila trae su propio estado (asignada/curso/
               cerrada/ejecutada…), no siempre "Ejecutada". */
            S.h('div', { class: 'nws-row' }, S.h('span', { class: 'nwt-smalltext-font-bold nws-grow' }, e(c.codigo)), S.badge({ label: (D.estados[c.estado] || D.estados.ejecutada).label, size: 'small', theme: (D.estados[c.estado] || D.estados.ejecutada).theme })),
            S.h('div', { class: 'nws-row nws-row--sm nwt-smalltext-font-regular nws-muted' }, S.icon('user'), e(c.operario + ' · ' + c.horario)));
        })) }));

    return stats + S.h('div', { class: 'nws-split', style: 'min-height:60vh' }, grid, historial);
  },

  mount: function () { return function () {}; }
};
