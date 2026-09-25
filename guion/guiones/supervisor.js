/**
 * Guion del Supervisor: ver las rutas por verificar, revisar la evidencia parada por parada y cruzarla con el camión.
 * Cada paso: `sub` (subtítulo) + una acción (clic, mover, escribir, esperar); `pausa` nunca baja de 3 s.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

window.GUION.guiones.supervisor = { preludio: { esperar: '#sup-vista [data-card]' }, misiones: [
  {
    titulo: 'Ver las rutas por verificar',
    historia: 'Como supervisor, quiero ver qué rutas ejecutadas esperan verificación y cuáles se atrasan.',
    pasos: [
      { sub: 'Dos rutas ejecutadas hace más de dos días, fuera de plazo', mover: '.nws-stat-hero' },
      { sub: 'Cuatro esperan verificación; la más antigua, tres días', mover: '.nws-stats--hero > :nth-child(2)' },
      { sub: 'Conformidad de septiembre: 92 %, cuatro puntos arriba', mover: '.nws-stats--hero > :nth-child(4)' },
      { sub: 'Cada ruta, con sus puntos marcados y sus evidencias', mover: '#sup-vista [data-card="1"]' },
      { sub: 'Busca por operario: las rutas de J. Barrios', escribir: ['[data-search="sup-q"]', 'Barrios'] },
      { sub: 'Dos rutas del 16 de septiembre; R-2407 quedó en 31 de 33', mover: '#sup-vista [data-card="2"]' },
      { sub: 'En vista tablero, las dos esperan verificación', clic: '#seg-vista [data-seg="kb"]' }
    ]
  },
  {
    titulo: 'Revisar la evidencia',
    historia: 'Como supervisor, quiero revisar la evidencia de una ruta ejecutada, parada por parada.',
    pasos: [
      { sub: 'Abre R-2409, la ruta completa de J. Barrios', clic: '#sup-vista [data-card="1"]' },
      { esperar: '#ev-cuerpo .nws-ev' },
      { sub: '47 de 47 puntos marcados, cada uno con su evidencia', mover: '.nws-stats--5 > :nth-child(1)' },
      { sub: 'Pero en una parada no reportaron las cámaras del camión', mover: '.nws-stats--5 > :nth-child(2)' },
      { sub: 'Cada parada trae tres fotos: la del operario y dos del camión', mover: '#ev-cuerpo .nws-ev' },
      { sub: 'La tira marca en ámbar la parada con una sola foto', mover: '#nws-thumbs [data-ev="4"]' },
      { sub: 'Abre la parada 5, en la Cll 72 #45-03', clic: '#nws-thumbs [data-ev="4"]' },
      { sub: 'Solo queda la foto del operario: el camión no tuvo señal', mover: '#ev-cuerpo .nws-ev__na' },
      { sub: 'Hora, coordenada y dirección ubican el punto', mover: '#ev-cuerpo .nws-ev__meta' },
      { sub: 'La parada siguiente ya trae las tres cámaras', clic: '[data-ev-step="1"]' }
    ]
  },
  {
    titulo: 'Cruzar con el camión',
    historia: 'Como supervisor, quiero cruzar la evidencia con lo que reportó el camión y saber quién cierra.',
    pasos: [
      { sub: 'El Camión 07 capturó 46 de 47 paradas: reporte parcial', mover: '.nws-split > :last-child > :first-child' },
      { sub: 'La carga fallida es la misma parada: Cll 72 #45-03', mover: '.nws-split .nws-kv:last-child' },
      { sub: 'La línea de tiempo: trazada, asignada, programada, ejecutada', mover: '#tl-cuerpo' },
      { sub: 'Vuelve a supervisión', clic: '[data-ir="#/supervisor-dashboard"]' },
      { esperar: '#sup-vista [data-card="9"]' },
      { sub: 'R-2388 ya figura como cerrada por el Operador', mover: '#sup-vista [data-card="9"] .nwt-badge' },
      { sub: 'El supervisor consulta y revisa; el cierre es del Operador', mover: '.nwt-title__subtitle' }
    ]
  }
] };
