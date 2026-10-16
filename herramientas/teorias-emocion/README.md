# Teorías de la emoción · Explorador interactivo

Recurso de estudio de Fernando Tonini, Universidad de Palermo. Compara las explicaciones de James-Lange, Cannon-Bard, Arnold, Schachter-Singer, Zajonc y Lazarus usando una misma situación: escuchar un ruido fuerte detrás de uno.

## Uso

Abrir `index.html` directamente en un navegador. No requiere servidor, instalación ni compilación. También puede publicarse como una carpeta estática o incluirse en una presentación mediante un iframe.

- Elegir una teoría y recorrer la secuencia con los botones, las tarjetas o las flechas del teclado.
- Reproducir los pasos, pausar, reiniciar o mostrar la secuencia completa.
- Explorar las vistas medial y lateral del cerebro. Las estructuras se pueden consultar con mouse, teclado o pantalla táctil; elegir una ficha cambia a su vista cuando hace falta.
- Activar las conexiones para mostrar relaciones simplificadas dentro de la vista actual.
- Comparar dos teorías, sus secuencias y el papel del cuerpo y la evaluación.
- Buscar estructuras y funciones en el glosario. La búsqueda admite palabras sin tildes.
- Alternar entre tema claro y oscuro. La preferencia se guarda localmente cuando el navegador lo permite; inicialmente se utiliza la del sistema.

La reproducción usa un intervalo de lectura de 4,2 segundos, no tiempos fisiológicos. Las animaciones de las conexiones respetan la preferencia de movimiento reducido.

## Alcance didáctico

La secuencia psicológica y el mapa neuroanatómico son niveles distintos. Los mapas son esquemas con asociaciones ilustrativas posteriores: no circuitos exclusivos y demostrados de cada teoría ni reconstrucciones de lo que cada autor conocía. Los núcleos profundos se proyectan sobre la vista medial y la ínsula sobre la lateral. Las líneas no implican conexiones directas en todos los casos.

Las ramas de Cannon-Bard representan respuestas paralelas. Las de Schachter-Singer representan dos factores que contribuyen a la emoción. En Lazarus, las evaluaciones primaria y secundaria se distinguen por su función, no por un orden temporal obligatorio. Las referencias originales y las fuentes de cada estructura están disponibles en la página.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `index.html` | Interfaz, notas de lectura y referencias |
| `css/style.css` | Diseño adaptable, temas y estados visuales |
| `js/lessons.js` | Secuencias psicológicas, ejemplos, comparación y posiciones por vista |
| `js/data.js` | Nombres y fechas, recorridos neuroanatómicos ilustrativos y glosario |
| `js/app.js` | Interacciones y dibujo SVG del mapa |
| `tests/browser-smoke.mjs` | Comprobación de los recorridos en un navegador real, sin dependencias |

Los atributos `regions`, `view` y `neuro` de cada paso en `lessons.js` relacionan ese paso con las fichas, la vista inicial y el índice del recorrido ilustrativo de `data.js`. La anatomía se dibuja con SVG; los estilos esenciales de sus trazos están definidos en el propio SVG.

## Verificación

Con Node.js 22 o posterior, iniciar un navegador Chromium con un perfil de prueba y `--remote-debugging-port=9223`, y luego ejecutar desde esta carpeta:

```sh
node --check js/app.js
node --check js/lessons.js
node tests/browser-smoke.mjs
```

El script crea y cierra una pestaña de prueba. Verifica todas las teorías y combinaciones de comparación, navegación, fichas, búsqueda, reproducción y pausa, anchos entre 320 y 1440 píxeles y movimiento reducido. Guarda capturas en el directorio temporal del sistema. Se puede cambiar el endpoint con `BROWSER_CDP_URL`.

## Publicación

Publicar la carpeta completa, incluyendo `js/lessons.js`. Los recursos locales usan rutas relativas y un identificador de versión en sus URLs para renovar la caché al desplegar. Al modificar estos recursos, actualizar ese identificador en `index.html`.

Ejemplo de integración, ajustando la ruta al sitio:

```html
<iframe src="../herramientas/teorias-emocion/"
        title="Explorador de teorías de la emoción"
        width="100%" height="900" style="border:0"></iframe>
```

Material elaborado para uso académico.
