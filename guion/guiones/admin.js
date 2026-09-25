/**
 * Guion del Administrador: ver el día, crear y asignar una ruta, revisarla y entregarla.
 * Cada paso: `sub` (subtítulo) + una acción (clic, mover, escribir, esperar); `pausa` nunca baja de 3 s.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

window.GUION.guiones.admin = { preludio: { esperar: '.nws-stat-hero' }, misiones: [
  {
    titulo: 'Ver cómo van las rutas hoy',
    historia: 'Como administrador, quiero ver de un vistazo cómo van las rutas del día.',
    pasos: [
      { sub: 'Arriba, las rutas activas en todas las zonas', mover: '.nws-stat-hero' },
      { sub: 'Las que esperan operador y las que ya están en calle', mover: '.nws-stats > :nth-child(3)' },
      { sub: 'La tabla se filtra por estado: las que están sin asignar', clic: '#tabs-rutas [data-seg="sin"]' },
      { sub: '…y las que están en ejecución, con su avance', clic: '#tabs-rutas [data-seg="curso"]' },
      { clic: '#tabs-rutas [data-seg="todas"]', pausa: 500 }
    ]
  },
  {
    titulo: 'Crear una ruta y asignarla',
    historia: 'Como administrador, quiero trazar una ruta completa y dársela a un operador que cubra la zona.',
    pasos: [
      { sub: 'Abre el asistente de Nueva ruta', clic: '[data-abrir-modal="nueva"]' },
      { sub: 'Elige creación automática: el algoritmo traza el recorrido', clic: '[data-nr-modo="auto"]' },
      { sub: 'Una sola ruta que recorre la zona de punta a punta', mover: '#nr-mapa' },
      { sub: 'No se corta en el límite: entra al sector B y vuelve al A', mover: '#nr-mapa .nws-map__parada', n: 3 },
      { sub: 'Con el trazo listo, pasa a asignar el operador', clic: '[data-nr="ok"]' },
      { sub: 'Solo se pueden elegir los operadores que cubren la zona', mover: '.nws-pick--off' },
      { sub: 'Elige un operador disponible', clic: '[data-nr-op]' },
      { sub: 'Revisa el resumen antes de crear', clic: '[data-nr="ok"]' },
      { sub: 'Una ruta, once paradas, repartidas en dos sectores', mover: '#nr-cuerpo .nws-split > :last-child' },
      { sub: 'Crea la ruta y la envía a la bandeja del operador', clic: '[data-nr="ok"]' },
      { sub: 'Ahí está, con su código, lista para revisar', mover: '#tabla-rutas [data-ir="#/admin/entrega"]' }
    ]
  },
  {
    titulo: 'Revisar antes de entregar',
    historia: 'Como administrador, quiero revisar el recorrido y sus paradas antes de entregarlo al operador.',
    pasos: [
      { sub: 'Abre la ruta recién trazada para revisarla', clic: '#tabla-rutas [data-ir="#/admin/entrega"]' },
      { esperar: '#mapa-entrega' },
      { sub: 'Cobertura completa: once unidades en un solo recorrido', mover: '.nws-stats--5' },
      { sub: 'En el mapa, la ruta cruza del sector A al B y regresa', mover: '#mapa-entrega .nws-map__parada', n: 3 },
      { sub: 'Cada parada dice a qué sector pertenece', mover: '#paradas-entrega [data-sector]' },
      { sub: 'Y la lista marca dónde la ruta cambia de sector', mover: '#paradas-entrega [data-cruce]' },
      { sub: 'Todo en orden: entrega la ruta al operador', clic: '[data-entregar]' },
      { sub: 'Confirma la entrega', clic: '#confirm-entrega [data-approve]' }
    ]
  }
] };
