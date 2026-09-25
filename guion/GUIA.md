# Guía de guiones animados

Lo que se definió con el guion de Administrador (`guiones/admin.js`) y aplica a todos los roles.
Revisar en vivo: `guion.html?comp=<rol>` · verificar: `node guion/verificar.mjs <rol>` · exportar:
`node guion/grabar.mjs <rol>`.

## Estructura del video (la pone el director; el guion no la repite)

1. **Portada** del módulo con logos Naowee + UAESP (≥ 3,6 s).
2. **"Viendo como <Rol>"** a pantalla completa (≥ 3 s).
3. **Entrada real**: el selector de perfil se ve ≥ 3 s, aparece el puntero, hace clic en el perfil,
   espera a que se vaya la silueta de carga y 3 s más. Sin barra todavía.
4. **Por misión**: tarjeta a pantalla completa (número, título, historia, "Viendo como"). Con la
   tarjeta opaca cambia la misión en la barra; al irse, en la primera misión, la barra sube desde abajo.
5. **Por paso**: el subtítulo entra, el puntero se para a la derecha del texto apuntándolo, karaoke
   de izquierda a derecha, pasa a blanco, el puntero va rápido al objetivo, clic (bajón de escala),
   y **≥ 3 s** de quietud.
6. **Cierre**: fundido al azul Naowee `#002B5B`, sostenido 3 s.

Si el bloque del objetivo (card, mapa, lista) está cortado, la página se desplaza sola para
mostrarlo entero: no se escribe en el guion.

## El archivo de guion

```js
window.GUION.guiones.<id> = {
  preludio: { esperar: '<selector que existe cuando el portal ya cargó>' },  // opcional
  misiones: [{ titulo, historia, pasos: [{ sub, clic | mover | escribir | esperar, n?, pausa? }] }]
};
```

- `clic` / `mover`: selector; `n`: índice entre los visibles. `escribir: [selector, texto]`.
  `esperar`: selector (hasta que aparezca) o ms. `pausa` nunca baja de 3 s (lo impone el director).
- Un paso sin `sub` es un movimiento de apoyo (p. ej. volver una pestaña a su lugar).

## Texto

- **Título de misión**: verbo + objeto, ≤ 28 caracteres (cabe en 2 líneas de la caja de 336 px).
- **Historia**: una frase, `Como <rol>, quiero …`, ≤ 110 caracteres.
- **Subtítulo de paso**: ≤ 62 caracteres, una línea. Presente, tercera persona o imperativo
  suave ("Abre…", "Elige…", "Revisa…"), sin voseo (la UI usa voseo; el narrador no).
- 2 a 3 misiones por rol, 5 a 11 pasos por misión. Las misiones se encadenan: la 2 usa lo que
  dejó la 1.

## Qué se vende y qué no

- **Solo lo que la pantalla muestra.** Si el subtítulo dice "dos", en pantalla tiene que haber
  dos. Antes de escribir una cifra, sacarla de `datos.js` o de lo que se ve. Si la pantalla
  contradice la historia, **no se ajusta el texto para taparlo: se avisa**.
- Ejemplo de lo que salió mal y se corrigió: "dos rutas en dos sectores". Tocar dos sectores no
  implica dos rutas: una ruta automática es **una sola**, cruza sectores (A → B → A), tiene
  código técnico (R-2446) y los sectores se mencionan apenas (por parada y donde cruza).
- Remarcar el caso potente de cada rol en 2–3 momentos (al elegirlo, en el resumen, en la revisión).
- Nunca hacer clic en algo que responde "Disponible próximamente".

## Selectores

- Preferir ganchos `data-*` (`data-rol`, `data-ir`, `data-seg`, `data-nr-*`, `data-entregar`…)
  y ids. Clases de estilo solo si no hay otra cosa (`.nws-stat-hero`, `.nws-ticket`).
- En las apps móviles (Conductor, Supervisor en ruta) todo vive dentro del teléfono (`#mob`).

## Verificación antes de dar un guion por bueno

`node guion/verificar.mjs <rol>`: termina sin error, 0 clics fuera del objetivo, ningún momento
< 3 s, y se miran las capturas en `videos/.revision/<rol>/` — cada una debe mostrar lo que su
subtítulo dice.
