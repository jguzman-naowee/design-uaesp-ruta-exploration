/**
 * Spot de venta (130 s): la ruta se traza en la oficina (Administrador) y se verifica en la calle (Supervisor en ruta).
 * Escenas con `dur` en ms: telón, marca, rol (entrada o cambio visible), titular + pasos (con cámara), cierre.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

window.GUION.guiones.spot = { tipo: 'spot', escenas: [
  { telon: ['Cada día, la ciudad espera al camión.', '¿Quién decide por dónde pasa?'], dur: 5000 },
  { marca: true, dur: 6200 },
  { rol: 'admin', presenta: 'El portal del Administrador', dur: 10000 },

  { titular: 'Elige la zona y el recorrido se traza solo.', dur: 8000, pasos: [
    { clic: '[data-abrir-modal="nueva"]' },
    { clic: '[data-nr-modo="auto"]' },
    { camara: { foco: '#nr-mapa', zoom: 1.5 }, pausa: 2200 }
  ] },
  { titular: 'Mira: una sola ruta cruza dos sectores.', dur: 5000, pasos: [
    { camara: { foco: '#nr-mapa .nws-map__parada', n: 3, zoom: 2.1 } },
    { mover: '#nr-mapa .nws-map__parada', n: 3, pausa: 1800 }
  ] },
  { titular: 'Ahora, el operador que cubre la zona.', dur: 10700, pasos: [
    { camara: 'reset' },
    { clic: '[data-nr="ok"]' },
    { clic: '[data-nr-op]' },
    { clic: '[data-nr="ok"]' },
    { camara: { foco: '#nr-cuerpo .nws-split > :last-child', zoom: 1.5 }, pausa: 1500 }
  ] },
  { titular: 'Se crea y queda lista para revisar.', dur: 6000, pasos: [
    { camara: 'reset' },
    { clic: '[data-nr="ok"]' },
    { camara: { foco: '#tabla-rutas [data-ir="#/admin/entrega"]', zoom: 1.6 }, pausa: 900 }
  ] },
  { titular: 'Se revisa el recorrido y se entrega.', dur: 13000, pasos: [
    { camara: 'reset' },
    { clic: '#tabla-rutas [data-ir="#/admin/entrega"]' },
    { esperar: '#paradas-entrega [data-cruce]', pausa: 300 },
    { camara: { foco: '#paradas-entrega [data-cruce]', zoom: 1.6 }, pausa: 900 },
    { camara: 'reset' },
    { clic: '[data-entregar]' },
    { clic: '#confirm-entrega [data-approve]', pausa: 900 }
  ] },

  { titular: 'Verificación en campo, sobre la misma ruta.', dur: 2500, pasos: [{ camara: 'reset', pausa: 300 }] },
  { rol: 'supervisor-ruta', presenta: 'La app del Supervisor en ruta', dur: 12500 },

  { titular: 'El supervisor sigue al camión, parada por parada.', lado: 'izq', dur: 7000, pasos: [
    { camara: { foco: '#mob', zoom: 1.15, en: true } },
    { mover: '#mob .nwt-card .nws-mob__lock', pausa: 1200 },
    { clic: '#mob [data-m="ruta"]' },
    { esperar: '#mob #mmap', pausa: 1200 }
  ] },
  { destacado: {
      sobre: 'Camión 12 · conectado',
      titulo: 'La plataforma se comunica con el camión recolector',
      filas: [['camera', 'Recibe sus cámaras en cada parada'], ['gps-pin', 'Sabe dónde y a qué hora pasó'], ['dispatch-time', 'Sigue su recorrido y su tiempo en ruta']],
      aro: '#mob .nws-ev__cam'
    }, dur: 8500, pasos: [
    { mover: '#mob .nws-stops', pausa: 300 },
    { clic: '#mob [data-parada]' },
    { esperar: '#mob [data-juicio]' },
    { camara: { foco: '#mob .nws-ev__cam', zoom: 1.7, en: true }, pausa: 300 }
  ] },
  { titular: 'El supervisor suma la suya, tomada en el punto.', lado: 'izq', dur: 5000, pasos: [
    { camara: { foco: '#mob', zoom: 1.15, en: true } },
    { clic: '#mob [data-m="foto"]' },
    { esperar: '#mob .nws-box--on', pausa: 1000 }
  ] },
  { titular: 'Cada hallazgo queda registrado, con foto y nota.', lado: 'izq', dur: 14500, pasos: [
    { clic: '#mob [data-juicio="hallazgo"]' },
    { clic: '#mob [data-hallazgo="3"]' },
    { escribir: ['#mob [data-field="nota"]', 'Recolección completa, unos minutos tarde.'] },
    { clic: '#mob [data-m="marcar"]' },
    { esperar: '#mob .nws-stop__n--hallazgo', pausa: 300 },
    { desplazar: '#mob .nws-stops', px: 280, pausa: 1500 }
  ] },

  { titular: 'Trazada, entregada y verificada en una sola plataforma.', lado: 'izq', dur: 4200, pasos: [{ camara: { foco: '#mob', zoom: 1.15, en: true } }] },
  { cierre: true, dur: 4600 }
] };
