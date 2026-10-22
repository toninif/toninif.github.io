# Verificación local

Fecha: 22 de octubre de 2026. Versión de contenido: `0.1.0-demo`. Rama local: `herramienta/identificar-emociones`.

## Resultado

Se completaron las tres actividades en Edge sin excepciones JavaScript. Pasaron **12 pruebas de lógica**, **67 comprobaciones de recorrido** y **17 auditorías axe-core** sin infracciones ni resultados pendientes de revisión automática. La copia de Quarto contiene **31 archivos idénticos** a las fuentes de la herramienta; ambos enlaces de integración funcionan. No se publicaron cambios, no se hizo push y no se editó `docs/` manualmente.

Las auditorías automáticas no certifican conformidad WCAG. La interacción táctil se emuló en Chromium/Edge: no se ensayó en un teléfono físico, Safari/iOS ni Firefox. Se inspeccionaron roles y nombres en el árbol de accesibilidad; no se hizo una prueba con una persona que use lector de pantalla ni una sesión de NVDA/VoiceOver. Esas verificaciones permanecen como revisión adicional, sin atribuirles un resultado que no se obtuvo.

## Lógica y contratos

```powershell
node --test tests/identificar-emociones/logic.test.mjs
node --check herramientas/identificar-emociones/js/app.js
```

Se verificaron fuentes, claves, rutas, derechos de ilustraciones, estados y versiones; rechazo de borradores en canal de producción; muestreo reproducible con 150 semillas en cada módulo; cuotas por emoción, ausencia de duplicados y límite de rachas. También se probaron:

- Respuestas durante carga ignoradas, carga fallida no presentada y recuperación por reintento.
- Doble respuesta y eventos con identificador de un ensayo anterior ignorados.
- Incertidumbre, omisión e interrupción diferenciadas; denominadores sobre todos los estímulos presentados y «Sin datos» cuando corresponde.
- Un intento por nivel de pista, conservación del error, primer acierto por nivel, ayuda contextual separada y revelación sin acierto.
- Casos de información insuficiente con resultado propio; selección de evidencia sin calificación inventada.
- Tiempo activo detenido durante pausa; restauración sin cambiar orden, pistas o intentos.
- Almacenamiento bloqueado, cuota insuficiente, versión incompatible y progreso corrupto sin impedir práctica en memoria.
- JSON con el mismo resumen que la interfaz, CSV con comillas escapadas y protección frente a fórmulas en comentarios.
- Contrastes de texto y de bordes de controles sobre fondos claros y oscuros, calculados a partir de los tokens reales del CSS.

## Navegador, móvil y accesibilidad

Dependencias de QA fuera del recurso público: `playwright-core`, Edge instalado y `axe-core` 4.10.3. La herramienta no depende de estos paquetes en ejecución.

```powershell
# Servidor en otra terminal, desde la raíz:
python -m http.server 8765 --bind 127.0.0.1

# Indicar la instalación local disponible de Playwright y axe-core:
$env:EMOTIONS_PLAYWRIGHT = '<ruta a playwright-core>'
$env:EMOTIONS_AXE = '<ruta a axe.min.js>'
node tests/identificar-emociones/browser.mjs
```

Se probaron presencia, pistas e inferencia por procesos; práctica y comprobación de procesos con devolución diferida; errores previos, contexto, revelación, comentarios, omisión, pausa, salida parcial y descarga real de JSON y CSV. Se recargó una sesión con pistas y se verificó su restauración. El evento de visibilidad pausa la actividad y su reloj. La imagen conserva su recurso al pedir una pista y al cambiar de tema.

Se completó un bloque de 12 ejercicios usando sólo teclado para seleccionar, confirmar y continuar. Se verificaron el salto al contenido, foco en la consigna después de carga, foco conservado al seleccionar, orden de controles y ausencia de opciones preseleccionadas. Otro bloque completo se realizó con `hasTouch` y eventos táctiles emulados, en un contexto móvil de 390 × 844 px.

Las auditorías axe-core se aplicaron a inicio, actividad facial, devolución, pausa, resultados, error previo en pistas, resumen parcial, modo descriptivo, comprobación terminada, procesos, móvil, temas claro/oscuro, biblioteca abierta, fuentes, error de imagen y sesión táctil. Se usaron las etiquetas WCAG 2 A/AA, 2.1 AA y 2.2 AA disponibles en la herramienta. Además, se revisó el árbol de accesibilidad de Chromium: opciones nativas con nombres, regiones de estado y estructura de lectura.

Se verificó reflujo sin desbordes horizontales a **320, 360, 390, 768 y 1280 CSS px**, texto grande, proyector y texto al 200 %. El ancho de 320 CSS px corresponde al reflujo de una ventana de 1280 px a 400 %; no se presenta esa equivalencia como una prueba de todos los comportamientos del zoom de cada navegador. Los controles de respuesta alcanzan 44 px de altura. Las capturas se revisaron visualmente, incluida la salida de Quarto en móvil.

Se simularon una imagen inaccesible, banco con respuesta HTTP 503 y almacenamiento denegado. Los reintentos recuperan la carga; los fallos de recurso no cuentan como errores del participante. La modalidad descriptiva permite realizar la actividad sin presentar un rostro; sus ayudas y resultados se identifican como una tarea diferente.

Evidencia local en `tmp/identificar-emociones/qa/` (ignorada por Git): `report.json`, `accessibility-tree.json` y capturas `inicio-escritorio.png`, `presencia-escritorio.png`, `presencia-movil-light.png`, `presencia-movil-dark.png`, `proceso-movil.png`, `modo-descriptivo.png`, `tactil-390.png`, `texto-200-reflujo.png` y `quarto-movil.png`, entre otras. El OCR y sus páginas también están en el directorio temporal ignorado.

## Integración Quarto

```powershell
quarto render docencia/index.qmd
quarto render presentaciones/emocion/index.qmd
node tests/identificar-emociones/generated.mjs
```

Los renders se ejecutan por separado y producen `docs/` mediante Quarto. La comprobación compara SHA-256 de los 31 recursos fuente y generados, abre el enlace de Docencia, carga una cara y una pista desde la salida local y abre el enlace del curso. Se verifican las respuestas HTTP y las excepciones del navegador. Se inspecciona el árbol generado para descartar los PDF de insumo, las extracciones, el modelo de OCR, axe-core y las carpetas de pruebas o autoría de esta herramienta.

No fue necesario modificar `_quarto.yml`: `herramientas/**` ya incorpora los recursos. Las instrucciones, las pruebas, la documentación y el generador de contenidos se mantienen fuera de ese árbol. El cierre de la sección de presentaciones del curso se explicitó al agregar su sección de herramientas, y ambos renders finales terminan sin avisos de divisiones sin cerrar.

## Pendientes editoriales reales

- Revisión de Fernando Tonini de fichas, claves, casos, dibujos y pistas. Ningún contenido fue marcado como `reviewed` o `published` por anticipado.
- Dos revisores y pilotaje de reconocimiento antes de usar estímulos como banco docente aprobado.
- Fotografías con permiso de publicación y conjuntos de identidades independientes si se quiere habilitar comprobación facial. Esta entrega utiliza exclusivamente las 14 ilustraciones originales de demostración.
- Validación y ampliación de casos/formas si se pretenden comparaciones antes/después. Los casos de práctica y comprobación están separados; no hay equivalencia ni efecto de aprendizaje demostrado.

Estos pendientes se muestran como alcance del banco de demostración, sin bloquear la revisión local de la herramienta funcional.
