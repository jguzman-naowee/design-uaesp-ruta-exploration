# Inventario · UAESP Módulo de Rutas · alta fidelidad sobre el SDK

Verificado contra `origin/main` de los dos repos el **16 de septiembre de 2026**:

| Paquete | Versión | Commit |
|---|---|---|
| `sdk-frontend-foundations` | 3.1.0 | `9bff4de` |
| `sdk-react-components` | 4.1.0 | `b5c105a` |

Las hojas de `vendor/` son copia literal de `dist/` de foundations. Lo único
que se les tocó es la ruta del `@font-face` (`icons.css`, `fonts.css`), que en
el paquete apunta a un especificador de npm que el navegador no resuelve.

Pantallas: **8 de 8** + selector de rol. Entrada: login ficticio tipo Netflix
con los perfiles; "Cerrar sesión" vuelve ahí.

---

## 1 · Cómo se garantiza el 1:1

`sdk.js` emite, por cada componente, **exactamente** lo que emite su `Nwt*`
en el compilado (`dist/esm/components/…/*.js`): mismas clases, mismos
atributos, mismo anidamiento. Convención confirmada en `helpers/css.js`:

- `identifier` → `id` del DOM
- `nwtTheme` / `nwtVariant` / `nwtSize` → **atributos** `nwt-theme`, `nwt-variant`, `nwt-size`
- booleanos → clases modificadoras `nwt-x--clave` vía `renderClassStatus`

Componentes replicados (26): Icon, Button, IconButton, Badge, Tag, Avatar,
AvatarIcon, ProgressBar, Divider, Card, EmptyState, StatCard, Title, Toolbar,
Subheader, Tabs, TagGroup, InputBox, Searchbox, TextField, TextArea, Stepper,
Timeline, DetailGroup/DetailItem, Alert, Modal, Confirmation, Toast,
Breadcrumb, Datatable (familia completa), Pagination, Sidebar, ProfileCard.

Lo que en React posiciona `useTrackedIndicator` (indicador de tabs, píldora
del segmentado) acá lo posiciona `posicionarIndicadores()` en `app.js`,
midiendo el elemento activo igual que el hook.

### Validador automático (`INVENTARIO` §6)
- tokens `--naotech-*` usados sin fallback: **51, todos definidos**
- iconos `naotech-icon-*`: **27 usados, 0 inexistentes**
- hex crudos en código propio: **0**
- clases `nwt-*` en `class=`: **248 usadas**; las que no tienen CSS son todas
  clases que **emite el SDK** — ver H-2 y H-7

---

## 2 · Lo que hubo que componer — no existe en el SDK (prefijo `nws-`)

| Pieza | Por qué | Cómo |
|---|---|---|
| `nws-login` | No hay selector de perfil | NwtCard clickable + NwtAvatar por rol |
| `nws-map` | **No hay componente de mapa** ni glifo de mapa | `<svg>` propio dentro de NwtCard, tokens `--naotech-*` |
| `nws-stops` | NwtDatatable reparte con flex por fila; NwtTimeline no acepta contador ni estado | átomos |
| `nws-kanban` | **No hay kanban** | columnas propias, tarjetas = NwtCard small clickable |
| `nws-drawer` | El modo drawer de NwtSidebar es de navegación, no de detalle | panel + backdrop |
| `nws-phone` | Marco de teléfono para la app móvil (Conductor, Supervisor en ruta) | — |
| `nws-stat-hero` | No hay variante de StatCard en color del rol | override documentado |
| `nws-spark` | No hay gráfica | barras `<i>` |
| `nws-option`, `nws-check`, `nws-pick` | No hay opción grande seleccionable ni chip-checkbox | compuestos |
| contador en el sidebar | `NwtSidebarMenu` no tiene `count` | NwtBadge dentro del label |

**Candidatos a promover** (aparecen en más de una pantalla o más de un
rol): `nws-map`, `nws-stops`, `nws-kanban`, `nws-drawer`, `nws-stat-hero`.

---

## 3 · Hallazgos del SDK

### H-1 · `NwtStatCard` centra vertical y no tiene forma para un progreso
`.nwt-stat-card { align-items:center }`. Con barra de avance la etiqueta
queda 11px arriba de sus vecinas (medido y=277 vs 288). Override nuestro
documentado en `app.css`. → pedido: slot o eje de alineación.

### H-2 · `nwt-button__icon`: clase emitida sin CSS
`Button.js` la emite; `components.css` tiene 0 reglas. El icono hereda
tamaño y color del contexto. → `/check-halves`.

### H-3 · `nwt-sidebar--mode-fixed`: clase emitida sin CSS
Foundations solo estila `--mode-drawer`.

### H-4 · Perillas públicas sin valor por defecto
`--naotech-button-radius`, `--naotech-input-box-radius` **nunca se definen**;
solo se consumen con fallback. Usarlas peladas descarta la declaración en
silencio. Se usan con la misma expresión del SDK:
`var(--naotech-button-radius, var(--naotech-radius-xl))`.
`--naotech-modal-max-width` sí se consume con fallback (30rem) y es la vía
canónica para el modal ancho.

### H-5 · Faltan glifos para el dominio
145 glifos derivados de MercadoLibre. Sirven: `vehicles`, `shipping`,
`fast-shipping`, `gps-pin`, `pin-pick-up`, `dispatch-time`, `camera`,
`view-list`, `official-stores`, `attention`, `visibility-on`.

| Se necesitaba | Se usó | Estado |
|---|---|---|
| check / completado | `positive` | aceptable |
| gráfica / indicadores | `price-highest` | **mal — lee como dinero** |
| camión de aseo | `vehicles` | es un auto |
| mapa | *ninguno* | no existe |

### H-6 · Dos componentes emiten glifos que no existen
- `NwtStepper` pinta `done` en el paso completado — **no hay `done`** en el set.
  En React el badge del paso hecho sale **vacío**.
- `NwtConfirmation` usa `alert-triangle` por defecto — **tampoco existe**.

Acá: el stepper emite `positive` (divergencia documentada) y la confirmación
recibe siempre el icono explícito. → pedido: `done` y `alert-triangle` al set,
o cambiar los defaults.

### H-7 · Más clases emitidas sin CSS (mitad sin escribir)
Todas salen del compilado y ninguna tiene regla en `components.css`:
`nwt-avatar__image`, `nwt-badge__icon`, `nwt-icon-button--disabled`,
`nwt-pagination__button`, `nwt-pagination__of`, `nwt-tabs__list--full-width`,
`nwt-title__avatar`. Inofensivas hoy; son nombres que prometen y no cumplen.

### H-8 · `NwtBadge` deja que la etiqueta parta en dos líneas
En una celda angosta "En ejecución" se partió. Override nuestro:
`.nwt-badge__label { white-space: nowrap }`. Un badge que envuelve nunca es
intencional → candidato a default del SDK.

### H-10 · Las hojas del `dist` de foundations traen BOM
`components.css`, `styles.css` e `icons.css` empiezan con U+FEFF. Enlazadas
como archivo no pasa nada; **embebidas en un `<style>`** el BOM invalida la
primera regla — en `components.css` es `.nwt-app { … }` (se pierde el padding
del contenido) y en `icons.css` es el `@font-face` (desaparecen TODOS los
iconos). Cualquier consumidor que inyecte el CSS inline lo sufre. → pedido:
que el build de foundations escriba sin BOM.

### H-9 · `NwtSidebarMenu` sin `count`
8 campos y ninguno es un contador. Se compone con NwtBadge.

### H-11 · `NwtToast` solo sabe vivir al pie del documento
`.nwt-toast__content` es `position: fixed; bottom: 0` sin perilla para el
contenedor. Dentro de un marco (la app del operario, cualquier vista embebida)
el aviso sale de la pantalla que lo disparó y cae al pie de la página. Override
en `.nws-mob__toast` (absoluto al pie de la vista + fade, porque el
`translate(-50%, 100%)` de entrada asoma sobre el tabbar). → pedido: una
variante `nwt-toast--inline` o perillas `--naotech-toast-{position,bottom}`.

### H-12 · Motion sin coreografía ni salida coordinada
`nwt-motion` fija duración y curva, pero no acepta retardo (`animation-delay`
va inline) y la distancia de `slide` es una sola (16px, pensada para un panel
que aparece). Para empujar una pantalla completa hay que subirla a 32px
(`--naotech-motion-distance` en `.nws-mob__view`) y montar la salida a mano
(la vista vieja en absoluto con `intent="exit"` mientras la nueva entra).
→ pedido: `nwt-motion-delay` y una distancia `screen`.

### H-13 · Botón sin `skeleton` público
`nwt-button--skeleton` existe en foundations (H-4 ya lo anota) y se usó en la
silueta de "marcar parada": conserva el ancho y el alto del botón real, así el
formulario no salta al llegar. Vale la pena exponerlo en `NwtButton`.

---

## 4 · Correcciones a lo que teníamos anotado

Dos cosas que el skill `naowee-sdk-react` daba por ciertas y **ya no lo son
en la 4.1.0**:

- **Sí hay `skeleton`**: `NwtCard`, `NwtStatCard`, `NwtButton`, `NwtTimeline`,
  `NwtDatatable`, `NwtProfileCard`, `NwtCardInformation` traen la prop con
  sus clases `__skeleton-*` y animación en foundations.
- **Sí hay drawer** para navegación: `NwtSidebar mode="drawer" | "responsive"`,
  con backdrop portalizado, cierre por `Escape` y bloqueo de scroll.
  (Sigue sin haber panel lateral de *detalle*.)

---

## 5 · Divergencias deliberadas respecto del canvas

- **Sin color por actor.** El canvas de diagramación pintaba cada rol de un
  color (Administrador indigo, Operador azul, Operario naranja, Supervisor
  verde) — es una leyenda de diagrama, no el producto. La primera versión
  publicada lo arrastró a botones, barras y fondos, y Jorge lo frenó
  (16-sep). Regla desde entonces: **`primary` para acciones, progreso y
  énfasis; los temas semánticos (`positive`, `caution`, `negative`,
  `informative`) solo para ESTADOS.** El rol se distingue únicamente en el
  avatar del selector, con `nwt-color` (eje propio de NwtAvatar).

- **Paginación al pie del datatable** (slot `footer`) y no arriba — sigue el
  pedido de Doug en Resultados. Diverge de Acreditaciones.
- **Badges en `quiet`** por defecto: `loud` no cumple AA (medido 2.9–3.2:1).
- **`Indicadores` usa `price-highest`** por falta de glifo. Marcado.

---

## 6 · Verificación

Render en Chromium headless a 1600×1000, las 9 rutas (7 pantallas + login +
fuera de alcance): **0 errores de consola**. Defectos encontrados mirando la
captura y corregidos midiendo: alineación de la fila de indicadores (11px),
monograma de 5 letras que no cabía en el avatar, badges partidos, valores de
stat card tipo palabra desbordando, celdas de cámara colapsadas por un grid
centrado.

Validador: `python3` sobre `vendor/*.css` vs todo el código propio (tokens,
iconos, clases, hex). Está inline en el historial de la sesión; conviene
moverlo a `verificar.py` cuando se vuelva a tocar.
