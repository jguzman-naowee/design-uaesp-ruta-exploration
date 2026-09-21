/**
 * Selector de rol · "¿Quién está operando?"
 *
 * Login ficticio tipo Netflix: los perfiles uno al lado del otro.
 * Elegir uno abre la sesión con ese rol; "Cerrar sesión" vuelve acá.
 * NO EXISTE EN EL SDK: cada perfil es un NwtCard clickable con un NwtAvatar
 * en el color del rol. Ver INVENTARIO.
 */
window.PANTALLAS = window.PANTALLAS || {};
window.PANTALLAS.login = {
  fullscreen: true,
  titulo: 'Elegir perfil',

  render: function (ctx) {
    var S = ctx.S, D = ctx.D, N = window.NAOWEE, e = S.esc;
    var ultimo = ctx.sesion.ultimoRol;

    /* El selector elige un ROL, no una persona: quien lo ocupe puede cambiar
       (hoy C. Mendoza, mañana otro operario) así que acá el avatar va con las
       iniciales del rol, no de la persona, y el nombre propio no se muestra
       (DC-085/DC-086). El nombre de la persona sigue apareciendo una vez
       adentro del portal, donde sí representa a alguien puntual en sesión. */
    var INICIALES_ROL = { admin: 'AD', operador: 'OD', supervisor: 'SU', flota: 'FL' };
    /* DC-023: "Flota" no es un rol propio (sesion:'operador', solo entra
       directo a #/operador/recursos) — como card en la grilla competía
       visualmente con los roles reales y rompía el ritmo de 5. Sale de la
       grilla. DC-050: pero el atajo flotante quedaba suelto, sin relación
       visual con nada — va debajo de la card de Operador (mismo slot del
       carrusel, scrollea con ella) en vez de fijo al fondo de la pantalla. */
    var rolesGrilla = D.roles.filter(function (r) { return r.id !== 'flota'; });
    var flota = D.roles.filter(function (r) { return r.id === 'flota'; })[0];
    var perfiles = rolesGrilla.map(function (r, i) {
      var card = S.card({
        onClick: true, size: 'medium', variant: 'quiet', theme: r.theme,
        cls: 'nws-reveal', style: '--nws-reveal-delay:' + (160 + i * 70) + 'ms',
        attrs: { 'data-rol': r.id, role: 'button', 'aria-label': 'Entrar como ' + r.rol },
        /* Card aligerada (21-sep): avatar, rol y una sola línea de
           descripción. Se fueron la organización y el botón "Entrar" — la
           card entera ya es el botón, y con seis perfiles en una fila el
           peso visual de cada una tenía que bajar.
           El badge de "última visitada" va DENTRO del content, absoluto
           (.nws-login__last): en el header obligaba a pintar la franja de
           cabecera con su divider, y esa card quedaba con el contenido más
           abajo que las demás. Absoluto no toca el layout de nadie. */
        content:
          (ultimo === r.id ? S.h('div', { class: 'nws-login__last' }, S.badge({ label: 'Última visitada', size: 'medium', theme: r.theme })) : '') +
          S.avatar({ text: INICIALES_ROL[r.id] || r.iniciales, size: 'large', variant: 'loud', color: r.color }) +
          S.h('span', { class: 'nwt-body-font-bold' }, e(r.rol)) +
          S.h('p', { class: 'nwt-smalltext-font-regular nws-muted nws-login__desc' }, e(r.descripcion))
      });
      /* DC-082 (corrige DC-064/078): "Flota" no debe leerse suelta — una
         cinta del ancho completo de la card, pegada a su borde inferior
         (mismo radio), a caballo hacia afuera. Absoluta igual (no le suma
         alto a la card), pero ahora se SIENTE parte de ella. La clase en
         el wrapper deja encontrar la card real desde el click de la cinta,
         para el mismo zoom-transition que las cards de rol (ver onClick). */
      if (r.id !== 'operador' || !flota) { return card; }
      return S.h('div', { class: 'nws-login__opcard', style: 'position:relative' }, card,
        S.h('button', { type: 'button', class: 'nws-login__flota', 'data-rol': flota.id, 'aria-label': 'Entrar a Flota' },
          /* DC-087: "Flota" a secas leía más a etiqueta que a acción — se
             deja el verbo. */
          S.icon('vehicles'), S.h('span', null, 'Gestión de Flota')));
    });

    return S.h('div', { class: 'nws-login' },
      /* DC-065: franja superior en grid de 3 — vacío / logo Naowee centrado
         / Showroom a la derecha. Reemplaza el logo y el Showroom sueltos,
         cada uno posicionado a su manera (DC-045). */
      S.h('div', { class: 'nws-login__topbar nws-reveal' },
        S.h('div', null),
        S.h('div', { class: 'nws-login__naowee' }, N.logo),
        S.h('a', { class: 'nws-login__showroom', href: '#/showroom', 'data-ir': '#/showroom', 'aria-label': 'Ver el showroom del demo' },
          S.icon('thunder'), S.h('span', null, 'Showroom'))),
      S.h('div', { class: 'nws-login__head nws-reveal' },
        S.h('div', { class: 'nws-row nws-row--sm nws-login__tenant' },
          S.avatar({ img: D.entidad.logo, text: D.entidad.monograma, size: 'small', variant: 'quiet', theme: 'neutral' }),
          S.h('span', { class: 'nwt-smalltext-font-semibold nws-muted' }, e(D.entidad.sigla))),
        /* DC-075: una sola línea — el max-width:11ch forzaba el corte a
           propósito antes; ahora se saca y se agrega nowrap para que ni en
           pantallas angostas parta en dos. */
        S.h('h1', { class: 'nwt-subtitle-font-bold nws-login__title', style: 'margin:var(--naotech-sizing-8) 0 0;text-align:center;font-size:var(--naotech-sizing-56);line-height:1.05;font-weight:var(--naotech-font-weight-black);white-space:nowrap' }, '¿Quién está operando hoy?'),
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
      /* DC-082: la cinta de Flota no es ella misma la card — pero el zoom
         debe verse "como viene" (el mismo crecer-hasta-cubrir-pantalla de
         cualquier card), así que crece desde la card de Operador de al
         lado (.nws-login__opcard contiene a las dos), no desde la cinta. */
      var envoltorio = el.closest('.nws-login__opcard');
      var origen = el.closest('.nwt-card') || (envoltorio && envoltorio.querySelector('.nwt-card'));
      if (!origen) { ctx.entrar(rolId); return; }
      zoom(origen, rolId, nombreDe(rolId));
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
