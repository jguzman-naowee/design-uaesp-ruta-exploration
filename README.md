# UAESP · Módulo de Rutas — alta fidelidad sobre el SDK de Naowee

Paquete de front plano (HTML/CSS/JS, sin npm ni build) que reconstruye las
ocho pantallas del módulo con el SDK real. Cinco roles, login ficticio.

## Abrirlo

Doble clic en `index.html`. Es **el mismo archivo que está publicado**: una sola
página con todo embebido. Funciona sin servidor.

Entrada: selector de perfil. `#/salir` o "Cerrar sesión" vuelven ahí.
Para compartir un link a una pantalla concreta: `index.html?rol=supervisor#/supervisor-dashboard`.

| Rol | Pantallas |
|---|---|
| Administrador | `#/admin` hub · `#/admin/entrega` revisar antes de entregar |
| Operador | `#/operador` hub en vivo · `#/operador/ruta` detalle de ruta en vivo |
| Conductor | `#/conductor` app móvil (hoy → mi ruta → marcar → cerrada · historial). Cromo fijo, vistas con push/pop, silueta por vista, toast interno; `?lento` alarga las cargas |
| Supervisor en ruta | `#/supervisor-ruta` misma app móvil que Conductor (idéntica por ahora — se creó por duplicación y aún no diverge) |
| Supervisor | `#/supervisor-dashboard` tablero/tabla · `#/supervisor/revision` revisión de ruta |

## Qué es y qué no es

**Regla de alcance:** nada queda mudo. Todo lo que está fuera de la exploración
(buscador del toolbar, paginador, secciones del menú sin pantalla, exportar,
histórico, reasignar, etc.) responde con un toast de una sola línea, **"‹función› · Disponible
próximamente"**. Sale de `proximamente()` en `app.js`: los botones
marcados con `data-toast`, los enlaces del menú a rutas que no están en `RUTAS`,
y una red de seguridad para cualquier control clickeable sin `data-*` que lo
escuche. Dentro del teléfono de la app móvil (Conductor, Supervisor en ruta) el
aviso sale en el propio teléfono.

**Es** una maqueta de alta fidelidad: carga el CSS real de
`sdk-frontend-foundations` y emite la misma anatomía que los componentes
`Nwt*` de `sdk-react-components` — mismas clases, mismos atributos `nwt-*`.

**No es** código migrable. No hay React. Sobrevive la decisión de diseño,
no los archivos.

## Estructura

```
index.html      LA página: todo embebido, la que se abre y la que se publica (generada)
dev.html        mesa de trabajo con archivos separados — de acá sale index.html
publicar.py     genera index.html desde dev.html (no es build: concatena y embebe)
app.css         lo que el SDK no tiene (prefijo nws-), todo en tokens
sdk.js          anatomía de los Nwt*, leída del compilado
mapa.js         el mapa entero (no hay mapa en el SDK): retícula de calles, rutas
                base → primera → … → última → retorno, encuadre y camión animado.
                Las pantallas solo ponen un <div class="nws-map"> y llaman MAPA.crear
datos.js        los datos, en JSON
app.js          sesión por rol, router por hash, shell (sidebar + toolbar)
pantallas/      una por pantalla: render(ctx) + mount(root, ctx) → cleanup
vendor/         copia literal del dist de foundations. NO SE EDITA
```

## El mapa

`mapa.js` es un motor chico, no un dibujo por pantalla. Una retícula de
manzanas (86×60, calle de 12) rotada -5°; las paradas caen siempre sobre una
calle (`Xc(k)`, `Ys(j)`). Cada ruta es un ciclo completo: **base → salida →
primera unidad → … → última unidad → retorno → base** (`MAPA.rutas.*`).

`MAPA.crear(el, { ruta, hechas, camion, leyenda, … })` mide el contenedor,
encuadra la ruta entera y centrada (viewBox a la medida de la caja, dejando el
espacio de leyenda/escala) y devuelve un controlador: `animarA(n)` lleva el
camión hasta la parada `n` doblando en las esquinas (Web Animations API con el
easing del sistema; `n = paradas + 1` es volver a la base), `set({...})`
repinta sin animar, `destruir()` limpia. Con `prefers-reduced-motion` todo se
pone en su lugar de una.

## Actualizar el SDK

```bash
S=~/Naowee/sdk-frontend-foundations
cp $S/dist/styles.css vendor/foundations.css
cp $S/dist/components.css $S/dist/icons.css vendor/
```
Volver a aplicar la ruta del `@font-face` en `vendor/icons.css` (→ `./icons.woff`)
y regenerar `vendor/fonts.css` desde `$S/fonts/inter.scss`. Correr el validador.

## Flujo de trabajo

Lo que se logra en local se comparte por el artifact. El link es uno solo y
cada republicación lo actualiza para todos los que lo tengan.

1. **Editar las fuentes**: `dev.html`, `app.css`, `datos.js`, `pantallas/*.js`.
   Nunca `index.html` a mano — se regenera y se pierde. Para ver mientras se
   edita: `python3 -m http.server` y abrir `dev.html` (no con doble clic).
2. **Regenerar**: `python3 publicar.py` → `index.html`. Es el archivo que se
   abre con doble clic **y** el que se publica: una sola versión.
3. **Publicar**: republicar `index.html` sobre el mismo link, cuando Jorge lo
   pida. Antes, verificar bajo el reset del visor (ver "Publicar").

Qué garantiza el link: el demo completo y funcional, con los datos incluidos,
sin servidor. Qué no: los datos van horneados al publicar (cambiarlos =
editar `datos.js` → regenerar → republicar), nada persiste entre recargas, y
no hay backend. El artifact es privado hasta que se comparte desde su menú.

## Publicar

```bash
python3 publicar.py     # dev.html + css + js + fuentes → index.html
```
El visor de artifacts bloquea, sin error, cualquier `<link rel="stylesheet">`
que no venga de Google Fonts (los `<script src>` sí pasan). Por eso lo que se
publica es **una sola página** con las hojas del SDK, `app.css`, las fuentes
(data URI) y los scripts adentro. `publicar.py` no transforma nada: concatena
en el orden de `index.html` y quita el BOM con el que vienen las hojas del SDK
(enlazado se ignora; embebido en `<style>` invalida la primera regla).

El link es siempre el mismo; se republica `index.html` sobre él pasando la URL.

Hallazgos del SDK y lo que se compuso: `INVENTARIO-COMPONENTES.md`.
