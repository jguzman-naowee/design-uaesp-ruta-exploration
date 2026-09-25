/**
 * Guion de Flota: ver el estado de los vehículos, seguir uno en vivo y repasar su actividad reciente.
 * Cada paso: `sub` (subtítulo) + una acción (clic, mover, escribir, esperar); `pausa` nunca baja de 3 s.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

window.GUION.guiones.flota = { preludio: { esperar: '.nws-pick--flota' }, misiones: [
  {
    titulo: 'Ver la flota de un vistazo',
    historia: 'Como coordinador de flota, quiero saber qué vehículos están en ruta, disponibles o en taller.',
    pasos: [
      { sub: 'La flota completa: cuatro vehículos registrados', mover: '.nws-stat-hero' },
      { sub: 'Dos van en ruta ahora mismo, con avance en vivo', mover: '.nws-stats > :nth-child(3)' },
      { sub: 'El Camión 12 va en la R-2402, con 41 % de avance', mover: '.nws-pick--flota', n: 0 },
      { sub: 'El Camión 19 está disponible y sale a las 13:30', mover: '.nws-pick--flota', n: 2 },
      { sub: 'La Volqueta 21 está en mantenimiento, fuera de operación', mover: '.nws-pick--flota .nwt-badge', n: 3 },
      { sub: 'Arriba, el mismo resumen en tres chips de color', mover: '.nws-flota-salud' }
    ]
  },
  {
    titulo: 'Seguir un camión en vivo',
    historia: 'Como coordinador de flota, quiero seguir en vivo el recorrido del camión que está en la calle.',
    pasos: [
      { sub: 'Abre Rutas para ver qué camión lleva cada ruta', clic: 'a[href="#/operador/ruta"]' },
      { esperar: '#tabla-rutas [data-fila]' },
      { sub: 'El Camión 12 lleva la R-2402: 17 de 41 puntos', mover: '#tabla-rutas [data-fila="v0"]' },
      { sub: 'Sigue la ruta del Camión 12 en vivo', clic: '#tabla-rutas [data-fila="v0"] [data-ir]' },
      { esperar: '#mapa-vivo .nws-map__camion' },
      { sub: 'Es el Camión 12, con su conductor y su cuadrilla', mover: '.nws-pick__foto--xwide' },
      { sub: 'El avance sube a medida que marca cada punto', mover: '.nws-stats--5 > :first-child' },
      { sub: 'El fin estimado de la ruta: 11:20', mover: '.nws-stats--5 > :nth-child(5)' },
      { sub: 'Y en el mapa, el camión recorre el trazo en tiempo real', mover: '#mapa-vivo .nws-map__camion' }
    ]
  },
  {
    titulo: 'Repasar la actividad',
    historia: 'Como coordinador de flota, quiero repasar lo que hicieron los vehículos hoy y los días anteriores.',
    pasos: [
      { sub: 'Vuelve a Flota desde el menú', clic: 'a[href="#/operador/recursos"]' },
      { esperar: '.nws-list--zebra .nws-list__row' },
      { sub: 'Actividades recientes: cada ruta del día con su estado', mover: '.nws-list--zebra .nws-list__row', n: 0 },
      { sub: 'La R-2433 sigue en ejecución desde las 06:05', mover: '.nws-list--zebra .nws-list__row', n: 2 },
      { sub: 'Y la Volqueta 21 entró al taller a las 09:15', mover: '.nws-list--zebra .nws-list__row', n: 4 },
      { sub: 'Más abajo, lo de ayer y los días anteriores', mover: '.nws-list--zebra .nws-list__row', n: 7 }
    ]
  }
] };
