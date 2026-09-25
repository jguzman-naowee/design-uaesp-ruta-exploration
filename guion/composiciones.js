/**
 * Composiciones: un video por rol, todas 1920×1080 a 30 fps.
 * Cada rol busca su guion en guion/guiones/<id>.js; si todavía no existe, corre la plantilla.
 */
window.GUION = window.GUION || {};
window.GUION.guiones = window.GUION.guiones || {};

window.GUION.composiciones = [
  { id: 'admin',           rol: 'admin',           titulo: 'Administrador',      quien: 'administrador' },
  { id: 'operador',        rol: 'operador',        titulo: 'Operador',           quien: 'operador' },
  { id: 'conductor',       rol: 'conductor',       titulo: 'Conductor',          quien: 'conductor' },
  { id: 'supervisor-ruta', rol: 'supervisor-ruta', titulo: 'Supervisor en ruta', quien: 'supervisor en ruta' },
  { id: 'supervisor',      rol: 'supervisor',      titulo: 'Supervisor',         quien: 'supervisor' },
  { id: 'flota',           rol: 'flota',           titulo: 'Flota',              quien: 'coordinador de flota' },
  /* audio.desfase (ms): positivo = la música entra más tarde; negativo = entra adelantada, desde ese punto del tema. */
  { id: 'spot',            rol: 'admin',           titulo: 'Spot · Admin → Supervisor en ruta', quien: 'administrador',
    audio: { src: 'guion/audio/aylex-born-to-win.mp3', desfase: 0, volumen: 0.35, salida: 2500, credito: 'Aylex - Born to Win (freetouse.com)' } }
].map(function (c) { c.ancho = 1920; c.alto = 1080; c.fps = 30; c.guion = 'guion/guiones/' + c.id + '.js'; return c; });

window.GUION.composicion = function (id) {
  return window.GUION.composiciones.filter(function (c) { return c.id === id; })[0] || window.GUION.composiciones[0];
};

/* Plantilla: la entrada al portal la hace el preludio del director; esto es lo que viene después. */
window.GUION.plantilla = function (c) {
  return { misiones: [{
    titulo: 'Conocer el portal',
    historia: 'Como ' + c.quien + ', quiero ver qué tengo en mi portal.',
    pasos: [
      { sub: 'Este es el portal de ' + c.titulo, pausa: 2200 },
      { sub: 'Guion pendiente · esta composición todavía es la plantilla', pausa: 2400 }
    ]
  }] };
};

window.GUION.guionDe = function (c) { return window.GUION.guiones[c.id] || window.GUION.plantilla(c); };
