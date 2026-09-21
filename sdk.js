/**
 * Anatomía del SDK de Naowee, en funciones que devuelven HTML.
 *
 * Cada función emite EXACTAMENTE lo que emite su componente Nwt* en
 * sdk-react-components@4.1.0: mismas clases, mismos atributos, mismo
 * anidamiento. Leído del compilado (dist/esm), no de memoria. La convención
 * del SDK, confirmada en `helpers/css.js`:
 *
 *   identifier            → id del DOM
 *   nwtTheme/Variant/Size → ATRIBUTOS nwt-theme / nwt-variant / nwt-size
 *   booleanos             → clases modificadoras  nwt-x--clave
 *
 * Si acá hay algo que el componente no emite, es un error de este archivo,
 * no una decisión.
 */
window.SDK = (function () {
  'use strict';

  /* ---------- base ---------- */

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function attrs(o) {
    if (!o) { return ''; }
    var out = '';
    Object.keys(o).forEach(function (k) {
      var v = o[k];
      if (v === null || v === undefined || v === false) { return; }
      if (v === true) { out += ' ' + k; return; }
      out += ' ' + k + '="' + esc(v) + '"';
    });
    return out;
  }

  function h(tag, a) {
    var kids = Array.prototype.slice.call(arguments, 2);
    var inner = kids.reduce(function (acc, k) {
      if (Array.isArray(k)) { return acc + k.filter(Boolean).join(''); }
      return acc + (k == null || k === false ? '' : k);
    }, '');
    return '<' + tag + attrs(a) + '>' + inner + '</' + tag + '>';
  }

  function cls() {
    return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
  }

  /* ---------- átomos ---------- */

  /* NwtIcon: <div class="nwt-icon"><i class="naotech-icon-X"></i></div> */
  function icon(name, extra) {
    return h('div', { class: cls('nwt-icon', extra) }, h('i', { class: 'naotech-icon-' + name }));
  }

  /* Repinta un contenedor y vuelve a disparar la entrada del sistema.
     Poner el atributo nwt-motion una sola vez no alcanza: el navegador solo
     corre la animación cuando el valor CAMBIA, así que en el segundo repintado
     el contenido nuevo aparecía de golpe. Se apaga, se fuerza un reflow y se
     vuelve a encender — es el equivalente a que React remonte el nodo.
     Cubre a los contenedores cuyo alto depende de lo que se les mete
     (#mob, #as-cuerpo, #ev-cuerpo, #tl-cuerpo…): sin esto el cambio de tamaño
     es un salto seco. */
  function token(nombre, porDefecto) {
    try {
      var v = getComputedStyle(document.body).getPropertyValue(nombre).trim();
      return v || porDefecto;
    } catch (e) { return porDefecto; }
  }

  function repintar(el, html) {
    if (!el) { return; }
    /* El alto se mide ANTES y DESPUÉS y se anima entre los dos. No alcanza con
       `transition: height`: los dos extremos son `height:auto` —solo cambia el
       contenido— y una transición entre dos `auto` no dispara ni con
       `interpolate-size`. Medir es la única forma de saber de dónde a dónde.
       El fade del contenido va aparte: el alto explica que la caja cambió de
       tamaño, la opacidad que lo de adentro es otra cosa. */
    var antes = el.getBoundingClientRect().height;
    el.innerHTML = html;

    el.removeAttribute('nwt-motion');
    void el.offsetWidth;
    el.setAttribute('nwt-motion', 'fade');
    el.setAttribute('nwt-motion-intent', 'enter');

    var quieto = false;
    try { quieto = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* */ }
    if (quieto || !el.animate) { return; }

    var despues = el.getBoundingClientRect().height;
    if (!antes || !despues || Math.abs(antes - despues) < 2) { return; }

    /* overflow:hidden mientras dura: el contenido ya mide su alto final y sin
       recortarlo se derrama sobre lo que sigue durante la animación. */
    var overflow = el.style.overflow;
    el.style.overflow = 'hidden';
    var ms = parseFloat(token('--naotech-duration-slow', '320ms')) || 320;
    var anim = el.animate(
      [{ height: antes + 'px' }, { height: despues + 'px' }],
      { duration: ms, easing: token('--naotech-animation-standard', 'cubic-bezier(0.4, 0, 0.2, 1)') }
    );
    /* El overflow se restaura por evento Y por reloj. Si quedara puesto, el
       contenedor recorta su contenido para siempre —un bug mucho peor que no
       animar—, y el evento puede no llegar si la animación se cancela porque
       llega otro repintado encima. */
    var soltar = function () { el.style.overflow = overflow; };
    anim.onfinish = anim.oncancel = soltar;
    setTimeout(soltar, ms + 60);
  }

  /* NwtSpinner — no tiene props: todo se regula por las perillas públicas
     --naotech-spinner-{dimesion,background,border-width,border-color}
     (`dimesion` va sin la "n": es el nombre real del token, no un typo acá). */
  function spinner(o) {
    o = o || {};
    return h('div', { class: cls('nwt-spinner', o.cls), 'nwt-theme': o.theme, style: o.style });
  }

  /* NwtButton — nwtSize default 'large', nwtVariant default 'loud'.
     Dos estados de carga distintos, con la misma precedencia que Button.tsx:
     `skeleton` (todavía no existe) gana sobre `disabled`, y `loading` solo
     corre si no hay ninguno de los dos. El contenido no se deja de emitir en
     skeleton — foundations lo esconde con visibility para que el botón
     conserve su ancho y no haya salto de layout al terminar. */
  function button(o) {
    var busy = !o.skeleton && !o.disabled && !!o.loading;
    var a = {
      class: cls('nwt-button', o.reverse && 'nwt-button--reverse', o.skeleton && 'nwt-button--skeleton', busy && 'nwt-button--loading', o.cls),
      type: o.type || 'button',
      'nwt-theme': o.theme, 'nwt-variant': o.variant || 'loud', 'nwt-size': o.size || 'large',
      disabled: !!o.disabled || !!o.skeleton,
      'aria-busy': (busy || o.skeleton) ? 'true' : undefined
    };
    Object.assign(a, o.attrs || {});
    return h('button', a,
      h('span', { class: 'nwt-button__content' },
        o.icon && icon(o.icon, 'nwt-button__icon'),
        esc(o.label),
        /* el extremo final es del spinner cuando carga: se disputan el mismo
           lugar y sin esto se apilan */
        !busy && o.iconEnd && icon(o.iconEnd, 'nwt-button__icon')),
      busy && spinner());
  }

  /* NwtIconButton: raíz <span>, control <button class="__content"> */
  function iconButton(o) {
    var a = {
      class: cls('nwt-icon-button', o.disabled && 'nwt-icon-button--disabled', o.cls),
      'nwt-theme': o.theme, 'nwt-variant': o.variant || 'loud', 'nwt-size': o.size || 'large'
    };
    Object.assign(a, o.attrs || {});
    return h('span', a,
      h('button', { class: 'nwt-icon-button__content', type: 'button', 'aria-label': o.label, disabled: !!o.disabled },
        icon(o.icon)));
  }

  /* NwtBadge — default nwtVariant 'loud' NO cumple AA (medido 2.9–3.2:1).
     Acá el default es 'quiet' a propósito; ver INVENTARIO. */
  function badge(o) {
    return h('span', {
        class: cls('nwt-badge', o.bordered && 'nwt-badge--bordered', o.off && 'nwt-badge--off', o.cls),
        role: 'status',
        'nwt-theme': o.theme, 'nwt-size': o.size || 'medium', 'nwt-variant': o.variant || 'quiet'
      },
      h('div', { class: 'nwt-badge__content' },
        o.icon && h('div', { class: 'nwt-badge__icon' }, icon(o.icon)),
        h('div', { class: 'nwt-badge__label' }, esc(o.label))));
  }

  /* NwtTag */
  function tag(o) {
    var a = {
      class: cls('nwt-tag', o.active && 'nwt-tag--active', o.disabled && 'nwt-tag--disabled', o.cls),
      'nwt-theme': o.theme, 'nwt-size': o.size || 'medium'
    };
    Object.assign(a, o.attrs || {});
    return h('span', a, esc(o.label));
  }

  /* NwtAvatar — default nwtSize 'large', nwtVariant 'loud'. */
  function avatar(o) {
    return h('div', {
        class: cls('nwt-avatar', o.cls),
        'nwt-color': o.color, 'nwt-theme': o.theme,
        'nwt-size': o.size || 'large', 'nwt-variant': o.variant || 'loud'
      },
      h('div', { class: 'nwt-avatar__content' },
        o.img ? h('img', { src: o.img, class: 'nwt-avatar__image nwt-avatar__image--loaded' })
              : h('span', null, o.bold === false ? esc(o.text) : h('b', null, esc(o.text)))));
  }

  /* NwtAvatarIcon */
  function avatarIcon(o) {
    return h('div', { class: cls('nwt-avatar-icon', o.cls), 'nwt-theme': o.theme }, icon(o.icon));
  }

  /* NwtProgressBar — default nwtSize 'small'. */
  function progress(o) {
    var v = Math.max(0, Math.min(100, Math.round(o.value || 0)));
    return h('div', {
        class: cls('nwt-progress-bar', o.cls), role: 'progressbar',
        'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 100,
        'nwt-theme': o.theme, 'nwt-size': o.size || 'small'
      },
      h('div', { class: 'nwt-progress-bar__track' },
        h('div', { class: 'nwt-progress-bar__fill', style: 'width:' + v + '%' })));
  }

  /* NwtDivider */
  function divider(o) {
    o = o || {};
    return h('div', { class: cls('nwt-divider', o.vertical && 'nwt-divider--vertical', o.cls), 'nwt-direction': o.vertical ? 'vertical' : undefined });
  }

  /* NwtCard — default nwtVariant 'quiet', nwtSize 'medium'.
     Header, content y footer SIEMPRE se emiten (vacíos si no hay). */
  function card(o) {
    /* E7 (decidido el 15-09-2026): la card trae su propio esqueleto y en ese
       estado no pinta nada de su contenido — ni el click ni el foco quedan
       vivos, porque una silueta que responde promete algo que todavía no está.
       Lo único que sí sabe es qué ranuras le pasaron: la silueta lleva barra de
       encabezado solo si hay header y de acción solo si hay footer. */
    var a = {
      class: cls('nwt-card', o.onClick && !o.skeleton && 'nwt-card--clickable', o.disabled && 'nwt-card--disabled', o.skeleton && 'nwt-card--skeleton', o.cls),
      'nwt-theme': o.theme, 'nwt-variant': o.variant || 'quiet', 'nwt-size': o.size || 'medium',
      tabindex: (o.onClick && !o.skeleton) ? 0 : undefined, style: o.style,
      'aria-busy': o.skeleton ? 'true' : undefined
    };
    Object.assign(a, o.attrs || {});
    if (o.skeleton) {
      return h('div', a,
        h('div', { class: 'nwt-card__body', style: o.bodyStyle },
          o.header && h('div', { class: 'nwt-card__header' }, h('span', { class: 'nwt-card__skeleton-title' })),
          h('div', { class: 'nwt-card__content', style: o.contentStyle },
            h('span', { class: 'nwt-card__skeleton-line' }),
            h('span', { class: 'nwt-card__skeleton-line' })),
          o.footer && h('div', { class: 'nwt-card__footer' }, h('span', { class: 'nwt-card__skeleton-action' }))));
    }
    return h('div', a,
      h('div', { class: 'nwt-card__body', style: o.bodyStyle },
        h('div', { class: 'nwt-card__header' }, o.header || ''),
        h('div', { class: 'nwt-card__content', style: o.contentStyle }, o.content || ''),
        h('div', { class: 'nwt-card__footer' }, o.footer || '')));
  }

  /* NwtEmptyState — NO acepta children; la acción va por props. */
  function emptyState(o) {
    return h('div', { class: cls('nwt-empty-state', o.cls), 'nwt-theme': o.theme },
      h('div', { class: 'nwt-empty-state__container' },
        h('div', { class: 'nwt-empty-state__illustration' }, o.illustration || ''),
        h('div', { class: 'nwt-empty-state__content' },
          o.title && h('h3', { class: 'nwt-empty-state__title' }, esc(o.title)),
          o.description && h('p', { class: 'nwt-empty-state__description' }, esc(o.description)),
          o.actionLabel && h('button', { type: 'button', class: 'nwt-empty-state__action' }, esc(o.actionLabel)))));
  }

  /* ---------- moléculas ---------- */

  /* NwtStatCard */
  function statCard(o) {
    if (o.skeleton) {
      return h('div', { class: cls('nwt-stat-card', 'nwt-stat-card--skeleton', o.cls), 'nwt-theme': o.theme, style: o.style, 'aria-busy': 'true' },
        h('div', { class: 'nwt-stat-card__content' },
          h('span', { class: 'nwt-stat-card__skeleton-label' }),
          h('span', { class: 'nwt-stat-card__skeleton-value' })));
    }
    return h('div', { class: cls('nwt-stat-card', o.cls), 'nwt-theme': o.theme, style: o.style },
      h('div', { class: 'nwt-stat-card__content' },
        h('span', { class: 'nwt-stat-card__label' }, esc(o.label)),
        /* nws-stat-mid: valor (+ barra/sparkline si trae) se centran juntos
           en el espacio libre de la card; el hint queda siempre anclado
           abajo. Un solo layout para las 3 filas de stat cards del
           prototipo — antes cada pantalla anclaba distinto (DC-002/DC-015). */
        h('div', { class: 'nws-stat-mid' },
          h('span', { class: 'nwt-stat-card__value', 'data-bind': o.bindValue, style: o.small ? 'font-size:var(--naotech-sizing-20);line-height:var(--naotech-sizing-28)' : undefined }, o.valueHtml || esc(o.value)),
          o.extra || ''),
        (o.hint || o.bindHint) && h('span', { class: 'nwt-stat-card__hint', 'data-bind': o.bindHint }, esc(o.hint))),
      o.icon && h('div', { class: 'nwt-stat-card__icon' }, icon(o.icon)));
  }

  /* NwtTitle */
  function title(o) {
    return h('div', { class: 'nwt-title', 'nwt-theme': o.theme },
      o.avatar && avatar({ text: o.avatar, size: 'tiny', variant: 'quiet', cls: 'nwt-title__avatar' }),
      h('div', { class: 'nwt-title__content' },
        h('div', { class: 'nwt-title__description', 'data-bind': o.bind }, esc(o.text)),
        o.subtitle && h('div', { class: 'nwt-title__subtitle' }, esc(o.subtitle))));
  }

  /* NwtToolbar — emite <header> propio; nunca se envuelve en .nwt-app__toolbar */
  function toolbar(o) {
    return h('header', { class: cls('nwt-toolbar', o.cls), 'nwt-theme': o.theme },
      h('div', { class: 'nwt-toolbar__content' },
        h('div', { class: 'nwt-toolbar__body' }, o.body || ''),
        h('div', { class: 'nwt-toolbar__actions' }, o.actions || '')));
  }

  /* NwtSubheader */
  function subheader(o) {
    return h('div', { class: cls('nwt-subheader', o.cls), 'nwt-theme': o.theme },
      h('div', { class: 'nwt-subheader__content' },
        h('div', { class: 'nwt-subheader__body' }, o.body || ''),
        h('div', { class: 'nwt-subheader__actions' }, o.actions || '')));
  }

  /* NwtTabs — items [{id,label,count,value,dot}] */
  function tabs(o) {
    return h('div', { class: cls('nwt-tabs', o.cls), 'nwt-theme': o.theme, id: o.id },
      h('div', { class: cls('nwt-tabs__list', o.fullWidth && 'nwt-tabs__list--full-width'), role: 'tablist' },
        h('div', { class: 'nwt-tabs__divider' }),
        (o.items || []).map(function (t) {
          var active = t.value === o.value;
          return h('button', {
              class: cls('nwt-tabs__tab', o.autoWidth && 'nwt-tabs__tab--auto', o.fullWidth && 'nwt-tabs__tab--full-width', active && 'nwt-tabs__tab--active'),
              role: 'tab', type: 'button', 'aria-selected': active ? 'true' : 'false', 'data-tab': t.value
            },
            h('span', { class: 'nwt-tabs__label' },
              t.icon && icon(t.icon),
              h('span', { class: 'nwt-tabs__label-text' }, esc(t.label)),
              t.count !== undefined && h('span', null, ' (' + t.count + ')'),
              t.dot && h('span', { class: 'nwt-tabs__dot nwt-tabs__dot--' + t.dot })));
        }),
        h('div', { class: 'nwt-tabs__indicator', 'data-tabs-indicator': true })));
  }

  /* NwtTagGroup — segmentado. items [{id,label,value}] */
  function tagGroup(o) {
    return h('div', { class: cls('nwt-tag-group', o.cls), 'nwt-size': o.size || 'medium', 'nwt-theme': o.theme, id: o.id },
      h('div', { class: 'nwt-tag-group__track', role: 'tablist' },
        h('span', { 'aria-hidden': 'true', class: 'nwt-tag-group__pill', 'data-pill': true }),
        (o.items || []).map(function (t) {
          var active = t.value === o.value;
          return h('button', {
              type: 'button', role: 'tab',
              class: cls('nwt-tag-group__tag', active && 'nwt-tag-group__tag--active', t.disabled && 'nwt-tag-group__tag--disabled'),
              'aria-selected': active ? 'true' : 'false', disabled: !!t.disabled, 'data-seg': t.value
            }, esc(t.label));
        })));
  }

  /* NwtInputBox — el chasis de todo campo con caja. */
  function inputBox(o, control) {
    return h('div', { class: cls('nwt-input-box', o.focused && 'nwt-input-box--focused', o.disabled && 'nwt-input-box--disabled', o.error && 'nwt-input-box--error') },
      h('div', { class: 'nwt-input-box__content' },
        o.label && h('label', { class: 'nwt-input-box__label', for: o.id }, esc(o.label), o.required && h('span', { class: 'nwt-input-box__required' }, '*')),
        h('div', { class: 'nwt-input-box__control' }, control),
        o.message && h('div', { class: 'nwt-input-box__message' }, h('span', null, esc(o.message)))));
  }

  /* NwtSearchbox — default nwtSize 'large'. */
  function searchbox(o) {
    var id = o.id || ('sb-' + Math.random().toString(36).slice(2, 8));
    return h('div', { class: cls('nwt-searchbox', o.cls), 'nwt-theme': o.theme, 'nwt-size': o.size || 'large', style: o.style },
      inputBox({ id: id, label: o.label },
        h('div', { class: 'nwt-searchbox__container' },
          icon('search'),
          h('input', { id: id, type: 'text', class: 'nwt-searchbox__input', placeholder: o.placeholder || '', value: o.value || '', 'data-search': o.name || true }))));
  }

  /* NwtTextField / NwtTextArea — default nwtSize 'large'. */
  function textField(o) {
    var id = o.id || ('tf-' + Math.random().toString(36).slice(2, 8));
    return h('div', { class: cls('nwt-text-field', o.cls), 'nwt-theme': o.theme, 'nwt-size': o.size || 'large' },
      inputBox({ id: id, label: o.label, required: o.required, message: o.message },
        h('input', { id: id, type: o.type || 'text', class: 'nwt-text-field__input', placeholder: o.placeholder || '', value: o.value || '' })));
  }
  function textArea(o) {
    var id = o.id || ('ta-' + Math.random().toString(36).slice(2, 8));
    return h('div', { class: cls('nwt-text-area', o.cls), 'nwt-theme': o.theme, 'nwt-size': o.size || 'large' },
      inputBox({ id: id, label: o.label, required: o.required, message: o.message },
        h('textarea', { id: id, class: 'nwt-text-area__input', rows: o.rows || 4, placeholder: o.placeholder || '', 'data-field': o.name }, esc(o.value || ''))));
  }

  /* NwtStepper — el SDK emite el glifo `done` para el paso hecho y ese glifo
     NO existe en el set (queda vacío). Acá va `positive`, que es un check.
     Divergencia documentada: INVENTARIO H-6. */
  function stepper(o) {
    var pos = o.position || 1;
    return h('div', { class: cls('nwt-stepper', o.cls), 'nwt-theme': o.theme },
      (o.steps || []).map(function (label, i) {
        var id = i + 1, active = pos === id, done = pos > id;
        return h('div', { class: cls('nwt-stepper__item', active && 'nwt-stepper__item--active', done && 'nwt-stepper__item--done'), 'data-step': id },
          h('div', { class: 'nwt-stepper__item__content' },
            h('div', { class: 'nwt-stepper__item__badge' }, done ? icon('positive') : String(id)),
            h('span', { class: 'nwt-stepper__item__label' }, esc(label))));
      }));
  }

  /* NwtTimeline — items [{title, subtitle, theme}]. Con skeleton son 3 ítems
     fijos (SKELETON_ITEMS del SDK): el marcador y la línea sí se pintan porque
     la forma de la línea de tiempo se conoce antes que su contenido. */
  function timeline(o) {
    if (o.skeleton) {
      return h('ol', { class: cls('nwt-timeline', o.cls), 'aria-busy': 'true' },
        [0, 1, 2].map(function () {
          return h('li', { class: 'nwt-timeline__item' },
            h('div', { class: 'nwt-timeline__marker' }, h('span', { class: 'nwt-timeline__dot' }), h('span', { class: 'nwt-timeline__line' })),
            h('div', { class: 'nwt-timeline__content' },
              h('span', { class: 'nwt-timeline__skeleton-title' }),
              h('span', { class: 'nwt-timeline__skeleton-subtitle' })));
        }));
    }
    return h('ol', { class: cls('nwt-timeline', o.cls) },
      (o.items || []).map(function (it) {
        return h('li', { class: 'nwt-timeline__item', 'nwt-theme': it.theme },
          h('div', { class: 'nwt-timeline__marker' }, h('span', { class: 'nwt-timeline__dot' }), h('span', { class: 'nwt-timeline__line' })),
          h('div', { class: 'nwt-timeline__content' },
            h('p', { class: 'nwt-timeline__title' }, esc(it.title)),
            it.subtitle && h('p', { class: 'nwt-timeline__subtitle' }, esc(it.subtitle))));
      }));
  }

  /* NwtDetailGroup / NwtDetailItem */
  function detailGroup(o) {
    var items = o.items || [];
    return h('div', { class: cls('nwt-detail-group', o.cls), 'nwt-theme': o.theme },
      items.map(function (it, i) {
        return h('div', { class: cls('nwt-detail-item', it.onClick && 'nwt-detail-item--actionable') },
            it.icon && h('div', { class: 'nwt-detail-item__icon' }, icon(it.icon)),
            h('span', { class: 'nwt-detail-item__label' }, it.html || esc(it.content)),
            it.badge !== undefined && h('span', { class: 'nwt-detail-item__badge' }, esc(it.badge))) +
          (i < items.length - 1 ? divider({ vertical: true, cls: 'nwt-detail-group__divider' }) : '');
      }));
  }

  /* NwtAlert — default nwtVariant 'quiet'. */
  function alert(o) {
    return h('div', { class: cls('nwt-alert', o.visible !== false && 'nwt-alert--visible', o.cls), 'nwt-theme': o.theme, 'nwt-variant': o.variant || 'quiet' },
      h('div', { class: 'nwt-alert__content' },
        o.icon && h('div', { class: 'nwt-alert__icon' }, icon(o.icon)),
        h('span', { class: 'nwt-alert__label' }, o.html || esc(o.text)),
        o.closable && h('div', { class: 'nwt-alert__close', role: 'button', 'aria-label': 'Cerrar', tabindex: 0, 'data-close-alert': true }, icon('close'))));
  }

  /* NwtModal — se porta a <body>; visible → nwt-modal--visible. */
  function modal(o) {
    return h('div', { id: o.id, class: cls('nwt-modal', o.visible && 'nwt-modal--visible', o.cls), 'nwt-theme': o.theme },
      h('div', { class: 'nwt-modal__content', style: o.style },
        h('div', { class: 'nwt-modal__header' },
          h('div', { class: 'nwt-modal__header__description' },
            h('span', { class: 'nwt-subtitle-font-bold', 'data-bind': o.bindTitle }, esc(o.title)),
            (o.subtitle || o.bindSubtitle) && h('span', { class: 'nwt-smalltext-font-medium', 'data-bind': o.bindSubtitle }, esc(o.subtitle))),
          h('span', { class: 'nwt-modal__close', 'data-close-modal': true, role: 'button', 'aria-label': 'Cerrar', tabindex: 0 }, icon('close'))),
        h('div', { class: 'nwt-modal__component' }, o.body || '')),
      h('div', { class: 'nwt-modal__backdrop', 'data-close-modal': o.autoclose !== false ? true : undefined }));
  }

  /* NwtConfirmation — el icono por defecto del SDK es `alert-triangle`, que
     tampoco existe en el set. Se pasa siempre explícito. */
  function confirmation(o) {
    return h('div', { id: o.id, class: cls('nwt-modal nwt-confirmation-modal', o.visible && 'nwt-modal--visible'), 'nwt-theme': o.theme },
      h('div', { class: 'nwt-modal__content' },
        h('div', { class: 'nwt-modal__component' },
          h('div', { class: 'nwt-confirmation-modal__content' },
            h('div', { class: 'nwt-confirmation-modal__icon' }, icon(o.icon || 'attention')),
            h('div', { class: 'nwt-confirmation-modal__text' },
              o.title && h('h2', { class: 'nwt-confirmation-modal__title', 'data-bind': o.bindTitle }, esc(o.title)),
              h('p', { class: 'nwt-confirmation-modal__message', 'data-bind': o.bindMessage }, o.html || esc(o.message)))),
          h('div', { class: 'nwt-confirmation-modal__footer' },
            divider({ cls: 'nwt-confirmation-modal__divider' }),
            h('div', { class: 'nwt-confirmation-modal__buttons' },
              button({ label: o.rejectLabel || 'Cancelar', variant: 'mute', size: 'large', theme: o.theme, attrs: { 'data-reject': true } }),
              button({ label: o.approvedLabel || 'Confirmar', variant: 'loud', size: 'large', theme: o.theme, attrs: { 'data-approve': true } }))))),
      h('div', { class: 'nwt-modal__backdrop' }));
  }

  /* NwtToast */
  function toast(o) {
    return h('div', { class: cls('nwt-toast', o.visible && 'nwt-toast--visible', o.cls), id: o.id },
      h('div', { class: 'nwt-toast__content', 'nwt-theme': o.theme },
        h('div', { class: 'nwt-toast__component' },
          o.icon && avatarIcon({ icon: o.icon }),
          h('div', { class: 'nwt-toast__body' },
            h('div', { class: 'nwt-toast__title nwt-body-font-bold', 'data-bind': 'toastTitulo' }, esc(o.title)),
            /* sin mensaje no se emite el bloque: un <p> vacío igual cobra el
               row-gap del cuerpo y el toast de una línea quedaba descentrado */
            o.message && h('div', { class: 'nwt-toast__message nwt-smalltext-font-regular' },
              h('p', { class: 'nwt-toast__message__value', 'data-bind': 'toastMensaje' }, esc(o.message)),
              o.observations && h('p', { class: 'nwt-toast__message__observations' }, esc(o.observations))),
            h('div', { class: 'nwt-toast__close', 'data-close-toast': true, role: 'button', tabindex: 0, 'aria-label': 'Cerrar' }, icon('close'))))));
  }

  /* NwtBreadcrumb */
  function breadcrumb(o) {
    return h('nav', { class: cls('nwt-breadcrumb', o.cls), 'aria-label': 'breadcrumb', 'nwt-theme': o.theme },
      h('ol', { class: 'nwt-breadcrumb__list' },
        (o.items || []).map(function (it) {
          return h('li', { class: 'nwt-breadcrumb__item' },
            it.route ? h('a', { class: 'nwt-breadcrumb__link', href: it.route }, esc(it.label))
                     : h('span', { class: cls('nwt-breadcrumb__text', it.active && 'nwt-breadcrumb__text--active') }, esc(it.label)));
        })));
  }

  /* ---------- organismos ---------- */

  /* NwtDatatable. columns [{label, cls, actions}], rows: [[cellHtml…]] o
     [{cells:[…], cls, attrs}]. Las celdas van envueltas en <span> o el
     truncado del SDK (`& > span`) no aplica. */
  function datatable(o) {
    var cols = o.columns || [];
    /* El encabezado sobrevive al skeleton y el resumen/paginador no: las
       columnas son del contrato y ya se saben; cuántos registros hay, no. Las
       4 barras y sus anchos son SKELETON_ROWS del SDK. */
    return h('div', { class: cls('nwt-datatable', o.cls), 'nwt-theme': o.theme, style: o.style, 'aria-busy': o.skeleton ? 'true' : undefined },
      o.toolbar && h('div', { class: 'nwt-datatable__toolbar' }, o.toolbar),
      h('div', { class: 'nwt-datatable__table' },
        h('table', { id: o.id },
          h('thead', { class: 'nwt-datatable__head' },
            h('tr', { class: 'nwt-datatable__header' },
              cols.map(function (c) {
                return h('th', { class: cls('nwt-datatable__title', c.actions && 'nwt-datatable__title--actions', c.control && 'nwt-datatable__title--control', c.cls), style: c.style }, esc(c.label));
              }))),
          h('tbody', { class: 'nwt-datatable__body' },
            o.skeleton
              ? ['70%', '85%', '55%', '65%'].map(function (w) {
                  return h('tr', { class: 'nwt-datatable__record' },
                    h('td', { class: 'nwt-datatable__skeleton-cell', colspan: 100 },
                      h('span', { class: 'nwt-datatable__skeleton-bar', style: 'width:' + w })));
                })
              : (o.rows || []).map(function (r) {
                  var row = Array.isArray(r) ? { cells: r } : r;
                  var a = { class: cls('nwt-datatable__record', row.cls) };
                  Object.assign(a, row.attrs || {});
                  return h('tr', a, row.cells.map(function (cell, i) {
                    var c = cols[i] || {};
                    /* El style de la columna va a th Y td: si la celda de acciones
                       no lo lleva, el th queda en los 10rem de fábrica y la td en
                       su contenido, y las columnas flexibles absorben la diferencia
                       — los encabezados dejan de caer sobre sus celdas (DC-357). */
                    if (c.actions) { return h('td', { class: cls('nwt-datatable__actions', 'nwt-datatable__actions--actions', c.cls), style: c.style }, cell); }
                    return h('td', { class: cls('nwt-datatable__cell', c.cls), style: c.style }, cell);
                  }));
                })))),
      !o.skeleton && o.summary && h('div', { class: 'nwt-datatable__summary' }, o.summary),
      !o.skeleton && o.footer && h('div', { class: 'nwt-datatable__footer' }, o.footer));
  }

  /* NwtPagination — default nwtSize 'large'. */
  function pagination(o) {
    var page = o.page || 1, total = o.total || 1, off = total <= 1;
    return h('div', { class: cls('nwt-pagination', o.cls), 'nwt-theme': o.theme, 'nwt-size': o.size || 'large' },
      h('div', { class: 'nwt-pagination__container' },
        h('div', { class: 'nwt-pagination__pages' },
          h('span', { class: 'nwt-pagination__label' }, 'Página'),
          h('div', { class: cls('nwt-pagination__input', off && 'nwt-pagination__input--disabled') },
            h('input', { type: 'text', class: 'nwt-pagination__control', 'aria-label': 'Página', value: page, disabled: off })),
          h('div', { class: 'nwt-pagination__total' },
            h('span', { class: 'nwt-pagination__of' }, 'de'),
            h('span', { class: 'nwt-pagination__total-value' }, total))),
        h('div', { class: 'nwt-pagination__controls' },
          iconButton({ icon: 'chevron-left', variant: 'mute', cls: 'nwt-pagination__button', label: 'Página anterior', disabled: page <= 1 }),
          iconButton({ icon: 'chevron-right', variant: 'mute', cls: 'nwt-pagination__button', label: 'Página siguiente', disabled: page >= total }))));
  }

  /* NwtSidebar (modo fixed). menus [{section?, id, label, icon, route, active, count?}]
     — `count` no existe en NwtSidebarMenu (hueco del SDK): se emite como
     NwtBadge dentro del label y se documenta.
     — `section` se pinta ANTES del item, como <li> hermano, y NO deduplica:
     acá sí se emite una sola vez por grupo, igual que hace producción a mano. */
  function sidebar(o) {
    var menus = o.menus || [];
    var seccionPintada = null;
    return h('aside', { class: cls('nwt-sidebar', 'nwt-sidebar--mode-fixed', 'nwt-sidebar--open', o.collapsed && 'nwt-sidebar--collapsed', o.cls), id: o.id || 'nav' },
      h('div', { class: 'nwt-sidebar__toolbar' },
        h('button', { class: 'nwt-sidebar__toolbar__button', type: 'button', 'aria-label': o.collapsed ? 'Expandir menú' : 'Colapsar menú', 'aria-pressed': o.collapsed ? 'true' : 'false', 'data-toggle-nav': true },
          icon(o.collapsed ? 'drawer' : 'chevron-right', cls('nwt-sidebar__toolbar__toggle', !o.collapsed && 'nwt-sidebar__toolbar__toggle--back'))),
        h('div', { class: 'nwt-sidebar__toolbar__logo' }, o.logo || '')),
      h('div', { class: 'nwt-sidebar__content' },
        h('nav', { class: 'nwt-sidebar__menu', 'aria-label': 'Menú principal' },
          h('ul', { class: 'nwt-sidebar__menu__list' },
            menus.map(function (m) {
              var sec = '';
              if (m.section && m.section !== seccionPintada) {
                seccionPintada = m.section;
                sec = h('li', { class: 'nwt-sidebar__menu__section' }, h('span', null, esc(m.section)));
              }
              var item = h('li', { class: cls('nwt-sidebar__menu__item', m.active && 'nwt-sidebar__menu__item--active') },
                m.active && h('span', { 'aria-hidden': 'true', class: 'nwt-sidebar__menu__indicator' }),
                h(m.route ? 'a' : 'button', { class: 'nwt-sidebar__menu__link', href: m.route, type: m.route ? undefined : 'button', 'aria-current': m.active ? 'page' : undefined },
                  h('div', { class: 'nwt-sidebar__menu__content' },
                    m.icon && icon(m.icon, 'nwt-sidebar__menu__icon'),
                    h('span', { class: 'nwt-sidebar__menu__label' }, esc(m.label)),
                    m.count !== undefined && badge({ label: m.count, size: 'small', variant: 'quiet', theme: 'neutral', cls: 'nws-nav-count' }))),
                o.collapsed && h('span', { 'aria-hidden': 'true', class: 'nwt-sidebar__tooltip' }, esc(m.label)));
              return sec + item;
            }))),
        /* DC-350: el pie institucional (o.footer) va DENTRO del footer del
           sidebar y antes del logout, así "Cambiar de perfil" es el último
           item y los dos quedan juntos, no en dos bloques separados. */
        /* DC-117: entre el pie institucional y el logout va un divider real
           (NwtDivider), no un border-top sobre el botón — así el botón
           conserva su caja normal y la separación es simétrica. */
        h('div', { class: 'nwt-sidebar__footer' },
          o.footer || '',
          o.footer ? divider({ cls: 'nws-owner__divider' }) : '',
          h('button', { class: 'nwt-sidebar__footer__logout', type: 'button', 'data-logout': true },
            icon('logout', 'nwt-sidebar__menu__icon'),
            h('span', { class: 'nwt-sidebar__footer__logout__label' }, esc(o.logoutLabel || 'Cerrar sesión'))))));
  }

  /* NwtProfileCard = CardInformation + BannerInformation */
  function profileCard(o) {
    var items = o.items || [];
    return h('div', { class: cls('nwt-profile-card', o.cls), 'nwt-theme': o.theme },
      h('div', { class: 'nwt-profile-card__content' },
        h('div', { class: 'nwt-card-information' },
          h('div', { class: 'nwt-card-information__profile' },
            avatar({ text: o.initials, size: 'large', bold: false }),
            h('div', { class: 'nwt-card-information__title-group' },
              h('h2', { class: 'nwt-card-information__title' }, esc(o.title)),
              h('p', { class: 'nwt-card-information__subtitle' }, esc(o.subtitle))),
            o.children || '')),
        items.length && h('div', { class: 'nwt-banner-information' },
          h('div', { class: 'nwt-banner-information__grid' },
            items.map(function (it, i) {
              return h('div', { class: 'nwt-banner-information__item' },
                  h('span', { class: 'nwt-banner-information__label' }, esc(it.label)),
                  h('span', { class: 'nwt-banner-information__value' }, esc(it.value))) +
                (i < items.length - 1 ? divider({ vertical: true, cls: 'nwt-banner-information__divider' }) : '');
            })))));
  }

  return {
    esc: esc, h: h, cls: cls, repintar: repintar,
    icon: icon, spinner: spinner, button: button, iconButton: iconButton, badge: badge, tag: tag, avatar: avatar,
    avatarIcon: avatarIcon, progress: progress, divider: divider, card: card, emptyState: emptyState,
    statCard: statCard, title: title, toolbar: toolbar, subheader: subheader, tabs: tabs, tagGroup: tagGroup,
    inputBox: inputBox, searchbox: searchbox, textField: textField, textArea: textArea, stepper: stepper,
    timeline: timeline, detailGroup: detailGroup, alert: alert, modal: modal, confirmation: confirmation,
    toast: toast, breadcrumb: breadcrumb, datatable: datatable, pagination: pagination, sidebar: sidebar,
    profileCard: profileCard
  };
})();
