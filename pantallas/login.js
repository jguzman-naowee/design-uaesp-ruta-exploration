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
        onClick: true, size: 'large', variant: 'quiet', theme: r.theme,
        cls: 'nws-reveal', style: '--nws-reveal-delay:' + (160 + i * 70) + 'ms',
        attrs: { 'data-rol': r.id, role: 'button', 'aria-label': 'Entrar como ' + r.rol },
        /* DC-338/339: flotante sobre la card (nws-login__last, ya existía en
           app.css sin usar) en vez de una fila propia en el header — así no
           reserva alto cuando hay badge y no deja un div vacío cuando no. */
        header: ultimo === r.id
          ? S.h('div', { class: 'nws-login__last' }, S.badge({ label: 'Última visitada', size: 'medium', theme: r.theme }))
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

    var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var enZoom = false;

    /* Transición "zoom a la Netflix": la card elegida crece hasta cubrir la
       pantalla (acelerando, no lineal — arranca lenta y se dispara) y recién
       ahí se dispara la navegación real; cuando ya está montada la pantalla
       de destino detrás, el clon se desvanece encima y la revela. Es un
       clon con la MISMA anatomía nwt-card (mismo radio, mismo color de
       tema) puesto fixed sobre la card real — la real nunca se mueve. */
    var CRECE = 380;   /* crecimiento hasta cubrir pantalla, acelerando */
    var LEE = 650;     /* pausa quieta con el nombre del rol, para que dé tiempo a leerlo */
    var SALE = 260;    /* fundido final que revela la pantalla ya montada detrás */

    function zoom(card, rolId, rol) {
      if (reducido) { ctx.entrar(rolId); return; }
      enZoom = true;
      var r = card.getBoundingClientRect();
      var tema = card.getAttribute('nwt-theme') || 'neutral';
      var clon = document.createElement('div');
      clon.className = 'nws-zoom';
      clon.setAttribute('nwt-theme', tema);
      clon.style.left = r.left + 'px'; clon.style.top = r.top + 'px';
      clon.style.width = r.width + 'px'; clon.style.height = r.height + 'px';
      clon.style.borderRadius = getComputedStyle(card).borderRadius;
      var contenido = document.createElement('div');
      contenido.className = 'nws-zoom__content';
      var nombre = document.createElement('span');
      nombre.className = 'nws-zoom__label nwt-title-font-bold';
      nombre.textContent = rol;
      contenido.appendChild(nombre);
      clon.appendChild(contenido);
      document.body.appendChild(clon);
      requestAnimationFrame(function () {
        clon.style.left = '0px'; clon.style.top = '0px';
        clon.style.width = window.innerWidth + 'px'; clon.style.height = window.innerHeight + 'px';
        clon.style.borderRadius = '0px';
        nombre.style.opacity = '1'; /* el nombre entra con su propio delay, mientras la caja todavía crece */
      });
      setTimeout(function () {
        clon.classList.add('nws-zoom--tapa');   /* oculta avatar + nombre justo antes del corte */
        ctx.entrar(rolId);                      /* swap real de pantalla, ya detrás del clon */
        requestAnimationFrame(function () { clon.classList.add('nws-zoom--fuera'); });
        setTimeout(function () { clon.remove(); }, SALE);
      }, CRECE + LEE);
    }

    function nombreDe(id) { var r = ctx.D.roles.filter(function (x) { return x.id === id; })[0]; return r ? r.rol : ''; }
    function onClick(ev) {
      var el = ev.target.closest('[data-rol]');
      if (!el || enZoom) { return; }
      ev.preventDefault();
      var rolId = el.getAttribute('data-rol');
      zoom(el.closest('.nwt-card') || el, rolId, nombreDe(rolId));
    }
    function onKey(ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') { return; }
      var el = ev.target.closest('.nwt-card[data-rol]');
      if (!el || enZoom) { return; }
      ev.preventDefault();
      var rolId = el.getAttribute('data-rol');
      zoom(el, rolId, nombreDe(rolId));
    }
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    return function () {
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKey);
    };
  }
};
