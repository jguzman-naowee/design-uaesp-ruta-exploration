/**
 * Guion del Supervisor en ruta: ver cuánto le lleva el camión, verificar una parada con su foto y reportar un hallazgo.
 * Cada paso: `sub` (subtítulo) + una acción (clic, mover, escribir, esperar); `pausa` nunca baja de 3 s.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

window.GUION.guiones['supervisor-ruta'] = { preludio: { esperar: '#mob .nws-stat-hero:not(.nwt-stat-card--skeleton)' }, misiones: [
  {
    titulo: 'Salir detrás del camión',
    historia: 'Como supervisor en ruta, quiero saber a quién verifico hoy y cuánto me lleva el camión.',
    pasos: [
      { sub: 'Su jornada: ocho puntos por verificar hoy', mover: '#mob .nws-stat-hero' },
      { sub: 'Verifica al Camión 12 y a su cuadrilla', mover: '#mob .nws-stat-hero .nws-mob__stat', n: 3 },
      { sub: 'El camión va adelante: cuatro paradas, 690 m, 12 min', mover: '#mob .nwt-card .nws-mob__lock' },
      { sub: 'Inicia su propio recorrido, detrás del camión', clic: '#mob [data-m="ruta"]' },
      { esperar: '#mob #mmap' }
    ]
  },
  {
    titulo: 'Verificar una parada',
    historia: 'Como supervisor en ruta, quiero comparar las fotos del camión con la mía y dejar mi juicio del punto.',
    pasos: [
      { sub: 'En el mapa, el camión adelante y el supervisor detrás', mover: '#mob #mmap' },
      { sub: 'Abajo, las ocho paradas en el orden del recorrido', mover: '#mob .nws-stops' },
      { sub: 'Solo se abre la parada que sigue; las demás, en turno', mover: '#mob .nws-stop--lk' },
      { sub: 'Abre la parada 1 para verificarla', clic: '#mob [data-parada]' },
      { esperar: '#mob [data-juicio]' },
      { sub: 'Las dos fotos del camión ya están: izquierda y derecha', mover: '#mob .nws-ev__cam' },
      { sub: 'Toma su propia foto, parado detrás del camión', clic: '#mob [data-m="foto"]' },
      { sub: 'Queda capturada, con hora y coordenada del dispositivo', mover: '#mob .nws-box--on' },
      { sub: 'Todo coincide: marca el punto como conforme', clic: '#mob [data-juicio="conforme"]' },
      { sub: 'Envía la verificación', clic: '#mob [data-m="marcar"]' },
      { sub: 'Parada 1 verificada; el camión ya va en la parada 5', mover: '#mob .nws-mob__lock' }
    ]
  },
  {
    titulo: 'Reportar un hallazgo',
    historia: 'Como supervisor en ruta, quiero dejar evidencia con foto cuando el punto no quedó bien.',
    pasos: [
      { sub: 'Lo que falta sigue en turno, detrás del camión', mover: '#mob .nws-stops' },
      { sub: 'La parada 1 ya figura verificada', mover: '#mob .nws-stop--hecha' },
      { sub: 'Abre la parada 2, que el camión ya dejó atrás', clic: '#mob [data-parada]' },
      { esperar: '#mob [data-juicio]' },
      { sub: 'Toma la foto del punto, detrás del camión', clic: '#mob [data-m="foto"]' },
      { sub: 'Esta vez algo no está bien: marca un hallazgo', clic: '#mob [data-juicio="hallazgo"]' },
      { sub: 'Elige qué encontró: residuos fuera del contenedor', clic: '#mob [data-hallazgo="0"]' },
      { sub: 'Anota la observación que pide el hallazgo', escribir: ['#mob [data-field="nota"]', 'Bolsas en el andén, fuera del contenedor.'] },
      { sub: 'Envía la evidencia: su foto, el hallazgo y la nota', clic: '#mob [data-m="marcar"]' },
      { sub: 'Vuelve a Hoy para ver su avance', clic: '#mob #mob-tabs [data-tab="hub"]' },
      { sub: 'Dos de ocho verificadas, con el camión siempre adelante', mover: '#mob .nws-stat-hero' }
    ]
  }
] };
