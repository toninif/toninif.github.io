# Teorías de la emoción · Visualizador interactivo

Herramienta web para visualizar las vías neuroanatómicas que sustentan las seis teorías clásicas de la emoción: James-Lange, Cannon-Bard, Arnold, Schachter-Singer, Zajonc y Lazarus.

## Estructura

```
teorias-emocion/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── data.js
│   └── app.js
└── README.md
```

Sin frameworks, sin build step. Solo HTML, CSS y JavaScript vanilla.

## Despliegue como subcarpeta del sitio

Copiar la carpeta `teorias-emocion/` a la raíz del sitio. Queda accesible en:

```
toninif.github.io/teorias-emocion/
```

Si el sitio principal está en Quarto, la carpeta se puede ubicar dentro del directorio publicado y agregarla al `.gitignore` de Quarto si se quiere mantener separada del flujo de build.

## Integración en presentaciones de Quarto

Para embeber el visualizador en una slide:

```html
<iframe src="https://toninif.github.io/teorias-emocion/"
        width="100%" height="800"
        style="border: none; border-radius: 8px;">
</iframe>
```

O usando el shortcode iframe de Reveal.js:

```markdown
## Teorías de la emoción

<iframe src="../teorias-emocion/" width="100%" height="700" frameborder="0"></iframe>
```

## Funcionalidades

- Selección de teoría con paso a paso navegable
- Animación de flujo de información a velocidad diferenciada por teoría (Zajonc más rápido para reflejar la vía baja)
- Hover sobre estructuras anatómicas con descripción de su función
- Modo comparativo lado a lado entre dos teorías
- Glosario expandido con referencias bibliográficas
- Navegación con flechas del teclado
- Dark mode automático según preferencia del sistema
- Responsive mobile-first

## Modificar contenido

Toda la información de las teorías, las posiciones de las estructuras y el glosario está centralizada en `js/data.js`. Para ajustar:

- **Pasos de una teoría**: editar el array `steps` dentro de `theories[clave]`
- **Posición de estructuras**: editar `positions` y `labelPositions`
- **Glosario**: editar el array `glossary`

Los estilos están en `css/style.css`. La paleta principal se define como variables CSS al inicio del archivo, por lo que es fácil ajustar colores globalmente.

## Licencia

Material elaborado para uso académico. Fernando Tonini, Universidad de Palermo.
