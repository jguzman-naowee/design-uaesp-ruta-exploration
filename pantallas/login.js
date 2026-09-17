/**
 * Selector de rol · "¿Quién está operando?"
 *
 * Login ficticio tipo Netflix: los cuatro perfiles uno al lado del otro.
 * Elegir uno abre la sesión con ese rol; "Cerrar sesión" vuelve acá.
 * NO EXISTE EN EL SDK: cada perfil es un NwtCard clickable con un NwtAvatar
 * en el color del rol. Ver INVENTARIO.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS.login = {
  fullscreen: true,
  titulo: 'Elegir perfil',

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, e = S.esc;
    var ultimo = ctx.sesion.ultimoRol;

    /* El selector elige un ROL, no una persona: quien lo ocupe puede cambiar
       (hoy C. Mendoza, mañana otro operario) así que acá el avatar va con las
       iniciales del rol, no de la persona, y el nombre propio no se muestra
       (DC-085/DC-086). El nombre de la persona sigue apareciendo una vez
       adentro del portal, donde sí representa a alguien puntual en sesión. */
    var INICIALES_ROL = { admin: 'AD', operador: 'OD', operario: 'OP', supervisor: 'SU' };
    var perfiles = D.roles.map(function (r, i) {
      return S.card({
        onClick: true, size: 'large', variant: 'quiet',
        cls: 'nws-reveal', style: '--nws-reveal-delay:' + (160 + i * 70) + 'ms',
        attrs: { 'data-rol': r.id, role: 'button', 'aria-label': 'Entrar como ' + r.rol },
        header: ultimo === r.id
          ? S.h('div', { class: 'nws-row', style: 'justify-content:center;width:100%' },
              S.badge({ label: 'Última visitada', size: 'medium', theme: r.theme }))
          : '',
        content:
          S.avatar({ text: INICIALES_ROL[r.id] || r.iniciales, size: 'large', variant: 'loud', color: r.color }) +
          S.h('div', { class: 'nws-col', style: 'align-items:center;gap:var(--naotech-sizing-2)' },
            S.h('span', { class: 'nwt-subtitle-font-bold' }, e(r.rol)),
            S.h('span', { class: 'nwt-smalltext-font-regular nws-muted' }, e(r.organizacion))) +
          S.h('p', { class: 'nwt-smalltext-font-regular nws-muted', style: 'margin:0' }, e(r.descripcion)),
        footer: S.h('div', { style: 'width:100%' },
          S.button({ label: 'Entrar', size: 'medium', variant: 'quiet', theme: r.theme, cls: 'nws-mob__cta', attrs: { 'data-rol': r.id, style: 'width:100%' } }))
      });
    });

    return S.h('div', { class: 'nws-login' },
      S.h('a', { class: 'nws-sticker nws-sticker--salmon nws-login__showroom nws-reveal', style: '--nws-reveal-delay:520ms', href: '#/showroom', 'data-ir': '#/showroom', 'aria-label': 'Ver el showroom del demo' },
        S.icon('thunder'), S.h('span', null, 'Showroom')),
      S.h('div', { class: 'nws-login__head nws-reveal' },
        S.avatar({ img: D.entidad.logo, text: D.entidad.monograma, size: 'medium', variant: 'quiet', theme: 'neutral' }),
        S.h('h1', { class: 'nwt-subtitle-font-bold nws-login__title', style: 'margin:var(--naotech-sizing-8) 0 0;max-width:11ch;text-align:center;font-size:var(--naotech-sizing-56);line-height:1.05;font-weight:var(--naotech-font-weight-black)' }, '¿Quién está operando hoy?'),
        S.h('p', { class: 'nwt-body-font-regular nws-muted', style: 'margin:0' },
          'Exploración demo integral Módulo SAAS sobre Rutas Aseo y Recolección')),
      S.h('div', { class: 'nws-login__grid' }, perfiles),
      S.h('div', { class: 'nws-login__foot nws-reveal', style: '--nws-reveal-delay:460ms' },
        S.h('span', { class: 'nwt-smalltext-font-semibold' }, e(D.entidad.nombre)),
        S.h('span', { class: 'nwt-smalltext-font-regular' }, e(D.entidad.gobierno) + ' · ' + e(D.entidad.plataforma)),
        S.h('span', { class: 'nwt-smalltext-font-regular nws-soft', style: 'margin-top:var(--naotech-sizing-8)' },
          'Prototipo de demostración · sin datos reales · sesión ficticia')));
  },

  mount: function (root, ctx) {
    /* Doble rAF: el primer frame pinta con opacity:0 (nws-reveal), el
       segundo agrega --in y ahí sí arranca la animación — sin esto el
       navegador a veces funde ambos frames y no se ve la entrada. */
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      root.querySelectorAll('.nws-reveal').forEach(function (el) { el.classList.add('nws-reveal--in'); });
    }); });

    function onClick(ev) {
      var el = ev.target.closest('[data-rol]');
      if (!el) { return; }
      ev.preventDefault();
      ctx.entrar(el.getAttribute('data-rol'));
    }
    function onKey(ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') { return; }
      var el = ev.target.closest('.nwt-card[data-rol]');
      if (!el) { return; }
      ev.preventDefault();
      ctx.entrar(el.getAttribute('data-rol'));
    }
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    return function () {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKey);
    };
  }
};
