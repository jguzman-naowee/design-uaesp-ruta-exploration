/**
 * Guion del Conductor: arrancar la ruta, reportar una parada atribuyéndola a un recolector y ver la jornada.
 * Todo vive en el teléfono (#mob); `V` apunta a la vista que entra, no a la que sale en la transición.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

(function () {
  var V = '#mob .nws-mob__body:not(.nws-mob__body--saliente) ';

  window.GUION.guiones.conductor = { preludio: { esperar: V + '[data-m="ruta"]' }, misiones: [
    {
      titulo: 'Arrancar la ruta del día',
      historia: 'Como conductor, quiero saber qué me toca hoy y arrancar mi ruta sin perder tiempo.',
      pasos: [
        { sub: 'Hoy le tocan ocho puntos por recolectar', mover: V + '.nws-stat-hero .nws-mob__stat' },
        { sub: 'Con su camión, su zona y el recorrido total', mover: V + '.nws-stat-hero .nws-row--md' },
        { sub: 'La primera parada ya está a la vista, con su distancia', mover: V + '.nws-nxt' },
        { sub: 'Inicia la ruta: se activa el mapa', clic: V + '[data-m="ruta"]' },
        { sub: 'El mapa sigue al camión parada por parada', mover: V + '#mmap' },
        { sub: 'Abajo, el próximo giro: siga derecho por la Cra 45', mover: V + '.nws-turn' },
        { sub: 'Las paradas se habilitan una por una, en orden', mover: V + '.nws-stops' },
        { sub: 'La primera ya está lista para marcar', mover: V + '[data-parada]' }
      ]
    },
    {
      titulo: 'Reportar una novedad',
      historia: 'Como conductor, quiero reportar lo que pasó en la parada y decir qué recolector estuvo ahí.',
      pasos: [
        { sub: 'Abre la parada 1 para marcarla', clic: V + '[data-parada]' },
        { sub: '"Recolectado" ya viene marcado por defecto', mover: V + '[data-causal="ok"]' },
        { sub: 'Suma una novedad: residuos mal dispuestos', clic: V + '[data-causal="mald"]' },
        { sub: 'La observación se llena sola según la novedad', mover: V + '[data-field="nota"]' },
        { sub: 'Atribuye el reporte a un recolector de su cuadrilla', clic: V + '[data-involucrado="r1"]' },
        { sub: 'La nota queda dirigida a J. Ariza', mover: V + '.nwt-text-area' },
        { sub: 'Envía: la evidencia la captura el camión, no el conductor', clic: '#mob-cta [data-m="marcar"]' },
        { mover: V + '.nws-stops' },
        { sub: 'La parada 1 queda marcada y se habilita la 2', mover: V + '.nws-stop--hecha' }
      ]
    },
    {
      titulo: 'Reconocer a la cuadrilla',
      historia: 'Como conductor, quiero reconocer también lo que sale bien y ver cómo va mi jornada.',
      pasos: [
        { sub: 'Abre la parada 2, ya habilitada', clic: V + '[data-parada]' },
        { sub: 'Esta vez todo salió bien: queda como recolectado', mover: V + '[data-causal="ok"]' },
        { sub: 'Atribuye el buen trabajo a D. Pérez', clic: V + '[data-involucrado="r2"]' },
        { sub: 'Le deja una nota de reconocimiento', escribir: [V + '[data-field="nota"]', 'Dejó el punto limpio y el contenedor en su sitio.'] },
        { sub: 'Envía el reporte positivo', clic: '#mob-cta [data-m="marcar"]' },
        { sub: 'En Hoy, el avance de la jornada: dos de ocho', clic: '#mob-tabs [data-tab="hub"]' },
        { sub: 'Con el tiempo en ruta, el ritmo y lo que falta', mover: V + '.nws-mob__stats' },
        { sub: 'En Historial, las rutas de la semana', clic: '#mob-tabs [data-tab="hist"]' },
        { sub: 'Cada ruta muestra las novedades que se reportaron', mover: V + '.nwt-badge', n: 1 }
      ]
    }
  ] };
})();
