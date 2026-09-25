/**
 * Guion del Operador: asignar una ruta recibida, seguir una en calle, revisarla y cerrarla.
 * Cada paso: `sub` (subtítulo) + una acción (clic, mover, escribir, esperar); `pausa` nunca baja de 3 s.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

window.GUION.guiones.operador = { preludio: { esperar: '[data-asignar]' }, misiones: [
  {
    titulo: 'Asignar una ruta recibida',
    historia: 'Como operador, quiero darle a cada ruta que llega de la UAESP su cuadrilla y su camión.',
    pasos: [
      { sub: 'Aquí llegan las rutas que entrega la UAESP: cinco nuevas', mover: '#card-recibidas .nws-tabla__head > span' },
      { sub: 'Toma R-2401: automática, 38 puntos en el Sector A', clic: '[data-asignar="1"]' },
      { sub: 'Primero el conductor: solo se eligen los disponibles', mover: '#as-cuerpo .nws-pick--off' },
      { sub: 'Elige a C. Mendoza como conductor', clic: '[data-as-op="o1"]' },
      { sub: 'Suma dos recolectores a la cuadrilla', clic: '[data-as-op="o3"]' },
      { clic: '[data-as-op="o6"]', pausa: 500 },
      { sub: 'Con la cuadrilla lista, pasa a elegir el camión', clic: '[data-as="ok"]' },
      { sub: 'Elige un camión libre: el Camión 19, de 8 toneladas', clic: '[data-as-eq="e3"]' },
      { sub: 'Revisa la orden de ruta antes de asignar', clic: '[data-as="ok"]' },
      { sub: 'Una orden: 38 puntos, cuadrilla de 3 y el Camión 19', mover: '.nws-ticket' },
      { sub: 'Asigna la ruta: ya aparece en el teléfono del conductor', clic: '[data-as="ok"]' },
      { sub: 'Quedan cuatro rutas por asignar', mover: '#card-recibidas .nws-tabla__head > span' }
    ]
  },
  {
    titulo: 'Seguir una ruta en calle',
    historia: 'Como operador, quiero seguir en vivo cada ruta que ya salió a la calle con su cuadrilla.',
    pasos: [
      { sub: 'Abre Rutas: todas las del operador en una sola tabla', clic: '.nwt-sidebar__menu__link[href="#/operador/ruta"]' },
      { sub: 'Filtra las que están en curso: tres en calle ahora', clic: '#seg-rt [data-seg="curso"]' },
      { sub: 'Sigue R-2402, del Sector A, con C. Mendoza al volante', clic: '[data-fila="v0"] [data-ir]' },
      { esperar: '#mapa-vivo svg' },
      { sub: 'El camión recorre el trazo y marca cada parada en vivo', mover: '#mapa-vivo' },
      { sub: 'Avance, ritmo y próxima parada se actualizan solos', mover: '.nws-stats--5' },
      { sub: 'La actividad marca en qué parada va la cuadrilla', mover: '#stops .nws-stop--actual' },
      { sub: 'Abre el recorrido a pantalla completa', clic: '[data-abrir-mapa]' },
      { sub: 'Lo recorrido, lo pendiente y dónde está el camión', mover: '#mapa-full' },
      { clic: '#modal-mapa [data-close-modal]', pausa: 500 }
    ]
  },
  {
    titulo: 'Revisar y cerrar una ruta',
    historia: 'Como operador, soy el único que cierra una ruta: la reviso parada por parada, con sus fotos.',
    pasos: [
      { sub: 'Vuelve a Rutas para ver las que terminaron', clic: '[data-ir="#/operador/ruta"]' },
      { sub: 'Filtra las finalizadas: dos esperan cierre', clic: '#seg-rt [data-seg="finalizada"]' },
      { sub: 'Abre una ruta lista para cierre', clic: '[data-fila="f1"] [data-ir]' },
      { esperar: '#ev-cuerpo .nws-ev' },
      { sub: 'Evidencia punto a punto: cada parada trae tres fotos', mover: '#ev-cuerpo .nws-ev__main' },
      { sub: 'La del operario y las dos cámaras del camión', mover: '#ev-cuerpo .nws-ev__side' },
      { sub: 'En la parada 5 el camión no tuvo señal: queda una foto', clic: '[data-ev="4"]' },
      { sub: 'El camión lo confirma: capturó 46 de 47 paradas', mover: '#lado-cuerpo .nws-kv__k', n: 2 },
      { sub: 'Abre la verificación del supervisor: cuatro hallazgos', clic: '#lado-cuerpo button[data-panel="verif"]' },
      { sub: 'Con todo revisado, cierra la ruta: solo el operador puede', clic: '[data-cerrar]' },
      { sub: 'Confirma: pasa al histórico y ya no admite cambios', clic: '#confirm-cerrar [data-approve]' },
      { sub: 'Cerrada por el operador, con su evidencia y sus hallazgos', mover: '#badge-estado' }
    ]
  }
] };
