# Identificar y comprender emociones

Especificaciones funcionales, pedagógicas y técnicas para Codex  
Autor del proyecto: Fernando Tonini  
Versión: 0.9 · 22 de octubre de 2026  
Destino propuesto: `https://fernandotonini.com.ar/herramientas/identificar-emociones/`

## 1. Estado del documento y alcance de la entrega

Este archivo se puede entregar directamente a Codex como especificación de implementación. Contiene decisiones de arquitectura, interacciones, datos, evaluación, accesibilidad, producción de estímulos y criterios de aceptación.

**Pendiente indispensable: incorporar los tres PDF de la conversación original.** La referencia disponible contiene el pedido, pero no los archivos ni sus títulos. No fue posible recuperar la conversación completa: la función `read_thread` no estaba disponible en esta sesión. Tampoco se encontraron PDF en la carpeta del trabajo. Por lo tanto, este documento **no presenta como realizado el análisis de esos PDF**. Las fichas y los casos de ejemplo son propuestas originales de diseño, provisionales, para contrastar con esos insumos.

Sí se revisaron directamente archivos de los repositorios de las herramientas existentes. El dominio no pudo abrirse desde el entorno de consulta; la revisión del estilo se apoya en HTML y CSS, sin atribuirle una inspección visual de la web publicada. Las fuentes y rutas verificadas figuran al final.

Se distinguen tres estados de contenido:

- `draft`: propuesta, aún sin revisión teórica o de imagen.
- `reviewed`: revisado por el responsable docente y con fuentes identificadas.
- `published`: habilitado en el banco de producción, con derechos de uso verificados cuando corresponde.

La ausencia de los PDF permite construir y verificar la estructura y un prototipo identificado como tal. La versión docente definitiva requiere completar la revisión teórica. No inventar citas, títulos, páginas, resultados de validación ni permisos de imágenes.

## 2. Encargo para Codex

Implementar una herramienta web didáctica, en español rioplatense, para practicar la identificación de expresiones faciales y la comprensión de procesos emocionales mediante tres módulos:

1. **¿Está presente?** Distinguir presencia y ausencia de una expresión objetivo.
2. **Una pista más.** Identificar una expresión con ayudas progresivas solicitadas por el participante.
3. **Del proceso a la emoción.** Inferir una emoción a partir de una situación, sus evaluaciones y otros componentes del proceso emocional.

Trabajar con seis categorías: **alegría, tristeza, miedo, ira, asco y sorpresa**. Usar “Ira / enojo” en la primera presentación y “Enojo” en las opciones de uso cotidiano; conservar `ira` como identificador. Confirmar las denominaciones con los PDF. “Neutral” es una condición de estímulo, no una séptima emoción primaria. No fusionar asco y desprecio ni sustituir ira por odio sin fundamento explícito.

Público inicial supuesto: estudiantes universitarios de psicología y participantes adultos en actividades de enseñanza. No diseñar inicialmente para evaluación infantil, selección laboral ni diagnóstico clínico.

El resultado debe permitir aprender de los errores, reconocer información insuficiente y comparar qué aporta mirar una cara y qué aporta conocer su contexto. Las seis categorías son un recorte docente; no una clasificación exhaustiva o indiscutida de la vida emocional.

### Fuera del alcance inicial

- Cámara, reconocimiento de identidad, lectura automática de emociones o análisis biométrico.
- Cuentas, historial clínico, rankings, perfiles de personalidad y comparación con poblaciones clínicas.
- APIs de IA durante los ejercicios, generación de respuestas en tiempo real o claves privadas en el navegador.
- Plataforma de investigación con consentimiento, reclutamiento y registro remoto de datos.

Estas funciones no son necesarias para cumplir el encargo. La actividad consiste en que el participante interprete estímulos previamente preparados.

## 3. Integración con el ecosistema existente

### Hallazgos verificados

| Recurso revisado | Evidencia | Consecuencia para el proyecto |
|---|---|---|
| `toninif/toninif.github.io/_quarto.yml` | Sitio Quarto, idioma español, salida en `docs`, recursos `herramientas/**` | Agregar una herramienta estática dentro de esa carpeta; verificar su copia al renderizar |
| `docencia/index.qmd` | Enlaces a Teorías de la emoción, Iowa Gambling Task y Contingencia operante | Incorporar una entrada en Herramientas interactivas |
| `custom.scss` | Fondo `#faf9f7`, texto `#2d2d2d`, acento `#5a6e4a`; títulos Source Serif 4, cuerpo DM Sans | Mantener una estética académica sobria y legible |
| Teorías de la emoción | HTML, CSS y JavaScript separados; contenido en `data.js`; navegación por teorías, ayudas y referencias | Separar contenidos, lógica y presentación; ofrecer exploración y ayuda contextual |
| CSS de Teorías de la emoción | Crema `#f6f5f0`, verde `#526c52`, Georgia y Segoe UI; tema claro/oscuro | Puede servir como referencia cercana sin introducir dependencias de fuentes |
| Contingencia operante | Tres secciones, casos, controles nativos, texto grande, Source Sans 3 y Playfair Display | Reutilizar el patrón de tres actividades y consignas directas |
| Iowa Gambling Task | Inicio, actividad, devolución y reinicio; JavaScript independiente | Mantener un recorrido simple con resultados comprensibles |
| `toninif/emociones-basicas-lector` | Demostración de cámara con face-api.js y seguimiento facial; guía de movimientos y modo proyector | Referencia conceptual complementaria; no incorporar sus modelos ni su cámara |

La demostración facial documenta su publicación con GitHub Pages. La configuración inspeccionada del sitio principal confirma Quarto y `docs`, pero el mecanismo concreto de despliegue debe comprobarse en el repositorio al implementar.

### Decisión recomendada

Crear `herramientas/identificar-emociones/index.html` dentro del repositorio principal, con CSS y JavaScript propios. Usar HTML semántico y módulos JavaScript nativos. No se necesita React, Next.js, servidor de aplicación ni base de datos para el MVP.

Quarto publicará la carpeta como recurso estático. No editar solamente el resultado generado en `docs`: modificar la fuente y regenerar con el flujo que ya use el repositorio. No sobrescribir herramientas existentes.

Si se decide trabajar en un repositorio independiente, conservar la misma estructura estática y documentar su ruta de publicación. Es una alternativa de mantenimiento, no una necesidad técnica.

## 4. Incorporación de los tres PDF

### Procedimiento obligatorio cuando estén disponibles

1. Registrar título, autoría, año, nombre original, cantidad de páginas y versión de cada PDF.
2. Leer los tres documentos; extraer texto y revisar visualmente cuadros, figuras y páginas con terminología relevante. Aplicar OCR si corresponde, comprobando errores.
3. Crear una matriz de conceptos con localización precisa: página del PDF y numeración impresa si difieren.
4. Identificar definición de emoción, categorías incluidas, desencadenantes, evaluación, fisiología, expresión, experiencia subjetiva, tendencia de acción y función adaptativa.
5. Distinguir las propuestas de cada autor. No fusionar modelos distintos en una secuencia que ninguno sostiene.
6. Comparar los documentos entre sí y con las propuestas de este archivo. Registrar acuerdos, diferencias y decisiones docentes.
7. Reescribir fichas, pistas y casos con paráfrasis originales; conservar la trazabilidad de cada afirmación.
8. Someter las claves y explicaciones a revisión docente antes de habilitar el banco definitivo.

### Matriz de trazabilidad a completar

| ID | Insumo | Estado actual | Información requerida |
|---|---|---|---|
| `pdf_01` | Primer PDF adjunto | No disponible | Referencia completa, páginas, conceptos y aplicaciones |
| `pdf_02` | Segundo PDF adjunto | No disponible | Referencia completa, páginas, conceptos y aplicaciones |
| `pdf_03` | Tercer PDF adjunto | No disponible | Referencia completa, páginas, conceptos y aplicaciones |

Cada afirmación deberá enlazar una ficha de fuente con `sourceId`, `pdfPage`, `printedPage`, `section` y `interpretation`. Una página pendiente se guarda como `null`; nunca como una numeración ficticia. Las fuentes web complementarias no sustituyen este análisis.

**Entregable de esta etapa:** `docs/revision-teorica.md`, con una síntesis por PDF, comparación transversal y relación entre conceptos y decisiones de la herramienta. Los PDF no se copian a la web pública por defecto.

## 5. Criterios pedagógicos y conceptuales

### Distinciones que debe enseñar

- Expresión observable, emoción atribuida y experiencia subjetiva no son equivalentes.
- “No aparece la expresión objetivo” no significa “la persona no siente esa emoción”.
- Una expresión neutral no demuestra ausencia de experiencia emocional.
- Un mismo evento puede generar emociones distintas según su significado para la persona.
- Activación corporal, sonrisa, llanto o una tendencia de acción aislada no determinan por sí solos una emoción.
- La tendencia a actuar y la conducta efectivamente realizada pueden diferir.
- Sorpresa puede preceder a otra emoción; no se debe definir siempre como agradable o desagradable.
- Las expresiones posadas y prototípicas facilitan ciertos ejercicios, pero no representan toda la variabilidad cotidiana.

La revisión de Barrett y colaboradores (2019) fundamenta la cautela frente a inferencias directas del rostro a la experiencia emocional. En esta herramienta se traduce en consignas sobre **patrones representados**, explicaciones contextuales y casos de información insuficiente [F8].

### Principios de enseñanza

- Introducción breve, dos ejemplos guiados y práctica activa.
- Progresión de ejemplos claros a discriminaciones cercanas y luego contextos complejos.
- Feedback específico: señalar qué información apoya la respuesta y qué diferencia a la alternativa elegida.
- Pedir ayuda debe ser una estrategia legítima de aprendizaje; no mostrar mensajes de fracaso por usar pistas.
- No usar cronómetros regresivos, penalizaciones por lentitud ni rachas que dificulten explorar.
- Permitir omitir, pausar y abandonar sin perder la comprensión del recorrido.
- Ofrecer repetición con ejemplos nuevos, no solo con los que se acaban de memorizar.
- Separar práctica, comprobación y demostración docente en los resultados.

## 6. Estructura de contenidos

### Biblioteca introductoria

Ofrecer seis fichas y una guía transversal. Cada ficha incluye: nombre y sinónimos, definición breve, desencadenantes posibles, evaluaciones características, componentes corporales, expresión, tendencias de acción, funciones, confusiones frecuentes, ejemplo y contraejemplo, fuentes y estado de revisión.

La guía transversal explica situación → significado para la persona → cambios y tendencias → experiencia y conducta. Presentar este recorrido como **organización didáctica**, no como una cronología universal: varios componentes pueden influirse y modificarse recíprocamente.

### Borrador de mapa conceptual, pendiente de los PDF

Las siguientes asociaciones sirven para redactar casos originales, no como condiciones necesarias o suficientes ni como síntesis de los archivos ausentes.

| Emoción | Situación y significado posibles | Tendencia posible | Contraste que conviene trabajar |
|---|---|---|---|
| Alegría | Logro o encuentro valorado favorablemente | Acercarse, compartir, sostener la actividad | Sonrisa social sin información sobre experiencia |
| Tristeza | Pérdida de algo importante, percibida como difícil de revertir | Reducir actividad, buscar apoyo | Amenaza de pérdida futura frente a pérdida ya ocurrida |
| Miedo | Amenaza relevante y recursos percibidos como insuficientes | Protegerse, escapar, inmovilizarse | Novedad sin amenaza explícita |
| Ira / enojo | Obstáculo o agravio atribuido a una causa, con impulso a cambiarlo | Confrontar, reclamar, remover el obstáculo | Daño vivido como pérdida irreversible |
| Asco | Contacto percibido como contaminante o repulsivo | Rechazar, apartar, evitar ingerir | Desagrado general, que no siempre equivale a asco |
| Sorpresa | Acontecimiento inesperado que interrumpe una expectativa | Orientarse y actualizar lo que se esperaba | Miedo, cuando además existe amenaza |

### Evaluaciones: cómo representarlas

Modelar dimensiones configurables: novedad, agrado/desagrado, relevancia para metas, congruencia con metas, atribución causal, control o capacidad de afrontamiento y compatibilidad con normas. Son un vocabulario inicial de autoría, a ajustar según los PDF. Scherer ofrece una referencia complementaria para distinguir relevancia, implicaciones, afrontamiento y significado normativo [F9].

Si los insumos utilizan “evaluación primaria/secundaria”, explicar esos términos dentro de su marco y mantenerlos separados de “automática/deliberada” o de una secuencia de chequeos de otro modelo. Guardar `theoreticalModelId` en cada caso; no adjudicar a un autor un esquema híbrido.

## 7. Experiencia de uso

### Pantallas

1. **Inicio:** título “Identificar y comprender emociones”, descripción breve y tres entradas a los módulos.
2. **Preparación:** objetivo, ejemplo, duración orientativa y elección de práctica o comprobación.
3. **Actividad:** un estímulo por vez, consigna, opciones, ayuda cuando corresponda y avance “3 de 12”.
4. **Devolución:** explicación y acción “Continuar”; evitar avance automático.
5. **Resultados:** resumen por tarea y emoción, revisión de errores y propuesta de práctica.
6. **Explorar conceptos:** biblioteca, glosario, referencias y límites de interpretación.

Los módulos serán accesibles de manera independiente. Sugerir el orden 1 → 2 → 3 sin bloquear los siguientes por desempeño.

### Estética

- Tomar como base la paleta crema, verde y gris del sitio, con títulos serif y texto sans serif.
- Usar Georgia y una tipografía de sistema para el MVP, o fuentes locales ya autorizadas si se busca coincidencia exacta con el sitio.
- Ancho de lectura de aproximadamente 70 caracteres; espacio amplio para la cara y respuestas.
- Fondo y marco de las imágenes constantes en ambos temas; cambiar el tema de la interfaz no debe alterar el estímulo.
- En móvil: cara, consigna, opciones y acciones en una columna, sin desplazamiento horizontal.
- Botón de texto grande y modo proyector. Los detalles bibliográficos pueden ir en desplegables.
- Evitar asignar a cada emoción un color que permita responder sin observar el estímulo.

Textos sugeridos: “Observá la expresión”, “Elegí una opción”, “Pedir una pista”, “Todavía no lo sé”, “Ver explicación” y “Continuar”.

## 8. Banco de estímulos faciales

### Decisión de producción

Preferir un banco propio de fotografías posadas de personas adultas con autorización adecuada para exposición en una web pública, o un banco cuya licencia permita expresamente esa publicación. Fotografías, ilustraciones y caras sintéticas deben identificarse como clases diferentes de estímulos.

| Alternativa | Utilidad | Condición |
|---|---|---|
| Fotografías propias autorizadas | Control de identidad, iluminación y repertorio | Documentar derechos y revisión de las expresiones |
| RaFD | Banco académico con expresiones, neutral y varias perspectivas | Su sitio limita el acceso gratuito a investigación científica no comercial de investigadores universitarios; no asumir permiso de redistribución pública [F6] |
| KDEF | Material académico con expresiones posadas | Su sitio restringe el uso a investigadores y prohíbe redistribuir sin consentimiento escrito [F7] |
| Ilustraciones originales | Explicación de regiones y demostración inicial | No presentarlas como equivalente validado de reconocimiento de fotografías |
| Imágenes sintéticas | Posible banco didáctico futuro | Revisar coherencia anatómica, identidad, estereotipos y reconocibilidad; no presumir validez psicológica |

No descargar rostros de buscadores ni publicar los archivos completos de una base académica solo porque puedan obtenerse gratuitamente. Registrar el permiso concreto de publicación y transformación; no copiar documentos de consentimiento con datos personales a la carpeta pública.

### Tamaño y organización propuestos

- **Prototipo técnico:** 2 identidades × 7 condiciones = 14 imágenes, solo para comprobar funcionamiento. No permite evaluar aprendizaje.
- **MVP de práctica:** objetivo de 12 identidades × 7 condiciones = 84 imágenes revisadas.
- **Versión con formas paralelas:** objetivo de 36 identidades × 7 condiciones = 252 imágenes; 12 identidades para práctica, 12 para forma A y 12 para forma B.

Cada identidad debe aparecer en las seis expresiones y en neutral. Variar de manera equilibrada edad adulta y apariencia; evitar que una categoría emocional quede asociada sistemáticamente con un tipo de rostro. Registrar únicamente atributos disponibles y pertinentes; no inferir pertenencia étnica, identidad de género u otros atributos sensibles a partir de la foto.

Separar conjuntos por **identidad**, no solo por archivo. Las imágenes de una misma persona no se distribuyen entre práctica y comprobación. Las formas A/B no son psicométricamente equivalentes hasta comprobarlo.

### Estándares de imagen

- Vista frontal, iluminación y fondo constantes, resolución suficiente y proporción uniforme.
- Conservar cejas, frente, mejillas, nariz, boca y mentón; no recortar pistas inadvertidamente.
- Misma identidad y toma durante todas las pistas de un ensayo.
- No intensificar, animar, deformar o reemplazar la expresión al pedir ayuda.
- Nombres públicos opacos, por ejemplo `f_0042.webp`; ni nombre, texto alternativo ni miniatura deben revelar la clave.
- Versionar recortes y cualquier modificación. Cada variante derivada requiere revisión.
- Definir puntos o regiones en coordenadas normalizadas si se usarán superposiciones.
- Predecodificar la imagen antes de habilitar respuestas. Una imagen rota nunca cuenta como error del participante.

### Revisión y pilotaje

Dos revisores deben examinar claridad, etiqueta, calidad, posibles confusiones y pistas. Registrar acuerdos y desacuerdos; resolverlos antes de usar un estímulo en comprobación. Después realizar un piloto con participantes del público previsto, registrando frecuencias por respuesta, confianza y comentarios.

Como regla editorial inicial, se puede proponer un acuerdo de reconocimiento de al menos 80% para ejemplos básicos, siempre reportando tamaño y composición de la muestra. Es un criterio de selección revisable, no una norma clínica ni evidencia suficiente de validez. Los estímulos ambiguos pueden pasar a discusión, sin una clave única obligatoria.

## 9. Módulo 1: presencia o ausencia

**Objetivo:** discriminar si el estímulo representa el patrón objetivo del ejercicio.

Consigna: “¿Esta expresión representa miedo?”. Respuestas: **Sí**, **No** y **No estoy seguro/a**. Explicar previamente que se trabaja con la expresión representada, no con acceso al estado interno de la persona.

Los negativos deben incluir tanto rostros neutrales como otras expresiones. Mostrar una cara diferente de miedo no implica que carezca de expresión emocional.

### Composición y recorrido

- Práctica breve: 24 ensayos, 4 por emoción objetivo; 2 positivos, 1 neutral y 1 de otra emoción.
- Comprobación ampliada: 72 ensayos, 12 por objetivo; 6 positivos, 2 neutrales y 4 de otras emociones.
- Dos ejemplos iniciales quedan fuera del puntaje.
- Balancear el orden y evitar más de tres ensayos seguidos con la misma respuesta correcta.
- Mantener estables las posiciones de Sí/No/No estoy seguro/a para reducir errores motores.
- Una respuesta confirmada cierra el ensayo. En práctica se muestra feedback inmediato; en comprobación, al finalizar el bloque.
- “No estoy seguro/a” registra incertidumbre. “Omitir” registra omisión: son eventos diferentes.

Ejemplo de devolución negativa: “La respuesta esperada era No. En este estímulo se representa sorpresa. Compará la apertura de los ojos con la tensión que aparece en los ejemplos de miedo”. Las descripciones concretas deben corresponder a la imagen real.

### Métricas

Registrar aciertos, falsas alarmas, omisiones de detección y rechazos correctos, por objetivo y tipo de negativo. Mostrar incertidumbre y ensayos omitidos por separado; no convertir automáticamente “No estoy seguro/a” en No.

Para un bloque completo:

- `sensibilidad = aciertos_positivos / positivos_presentados`.
- `especificidad = rechazos_correctos / negativos_presentados`.
- `exactitud_balanceada = (sensibilidad + especificidad) / 2`.

En estas métricas de cobertura completa, incertidumbre y omisiones presentadas no suman aciertos; por eso informar sus cantidades al lado. Puede añadirse una matriz solo de respuestas Sí/No, identificada como análisis condicional. Un denominador cero produce “Sin datos”, nunca 0%. Un bloque abandonado se identifica como parcial.

## 10. Módulo 2: pistas progresivas

**Interpretación de “cara sin nada”:** mostrar desde el inicio la fotografía completa, sin etiqueta, resaltados, descripción o explicación. No empezar con una cara neutral para transformarla en otra expresión.

### Flujo definido

1. Mostrar cara y las seis opciones emocionales, sin selección predefinida.
2. Permitir arriesgar una respuesta o solicitar una pista inmediatamente.
3. Después de cada pista, permitir nuevamente responder o pedir la siguiente.
4. Si acierta, cerrar y explicar. Si falla, registrar el intento y conservarlo en el historial; mostrar “Podés revisar otra pista”.
5. Permitir un intento por nivel de ayuda. Después de fallar, exigir una nueva pista para volver a responder, evitando probar las seis opciones sin observar información nueva.
6. Permitir terminar con “Ver explicación”. Registrar `revealed`, no acierto.
7. Tras la última pista, un error termina el ensayo con explicación. No repetir indefinidamente el mismo nivel.

### Escalera de ayudas

| Nivel | Información | Restricción |
|---|---|---|
| 0 | Fotografía sin anotaciones | Sin texto que nombre la emoción |
| 1 | Orientación hacia una región: “Prestá atención a la zona de los ojos” | No anticipar la clave |
| 2 | Descripción de un movimiento observable o ampliación de una región | Mantener disponible la cara completa; descripción ajustada a esa imagen |
| 3 | Contraste con una confusión frecuente mediante rasgos observables | No eliminar opciones automáticamente |
| 4 | Contexto breve o tendencia de acción congruente | Opcional; clasificar como ayuda contextual, no facial |

En el modo facial estándar el máximo es 3. Activar el nivel 4 solo en práctica integrada y mostrar que la nueva información es contextual. Nunca mezclar sus resultados con “aciertos con pistas faciales”. El orden es fijo para cada ítem y se versiona.

Ejemplo provisional para una imagen de sorpresa: orientar a cejas; describir apertura y elevación observadas; contrastar la tensión con una imagen de miedo ya explicada; finalmente, en práctica integrada, mencionar un evento inesperado. La revisión de la imagen debe determinar si esas pistas son verdaderas.

### Datos y devolución

Por cada intento guardar respuesta, nivel, ayudas efectivamente vistas, tipo de ayuda, corrección y tiempo activo. Mostrar:

- Aciertos sin ayuda en el primer intento.
- Aciertos tras pistas exclusivamente faciales.
- Aciertos tras contexto.
- Errores previos, explicaciones reveladas y omisiones.
- Distribución de nivel del primer acierto entre los ensayos resueltos, acompañada de cantidad de no resueltos.

No reducir todo a “acierto final”: ocultaría el uso de ayudas y permitiría confundir ensayo y error con identificación inicial. No descontar puntos públicamente por pedir pistas. Practicar con 12 ensayos, dos por emoción.

## 11. Módulo 3: inferencia por proceso emocional

**Objetivo:** integrar componentes y explicar qué información permite diferenciar emociones.

Mostrar tarjetas de una misma situación con: desencadenante, evaluación del significado, experiencia corporal o atencional y tendencia de acción. La experiencia subjetiva puede describirse sin incluir la palabra que responde el ejercicio. Nunca mostrar el título de la ficha emocional antes de responder.

Las seis emociones permanecen como opciones; añadir **“La información no alcanza”** en los bloques que incluyan ambigüedad. Esta es una respuesta epistemológica, no una emoción adicional.

### Dificultad

- **Inicial:** todas las tarjetas disponibles, clave clara y ejemplo cotidiano.
- **Intermedia:** menos componentes o dos emociones plausibles; la evaluación discrimina.
- **Avanzada:** mismo evento con evaluaciones diferentes, emociones sucesivas, datos insuficientes o más de una interpretación defendible.

Para el MVP, usar selección simple en casos claros y en los de información insuficiente. Reservar selección múltiple y respuestas mixtas para una extensión con instrucciones y corrección propias.

### Casos originales de ejemplo, no extraídos de los PDF

| ID / clave provisional | Situación, evaluación y tendencia | Devolución esperada |
|---|---|---|
| `proc_alegria_01` / alegría | Después de semanas de preparación, Alex recibe una confirmación que esperaba. Considera que alcanzó una meta importante y quiere compartir la noticia. | El logro valorado favorablemente y el impulso de compartir orientan la interpretación |
| `proc_tristeza_01` / tristeza | Una actividad grupal muy valorada termina de forma definitiva. Dani piensa en lo que pierde, baja su ritmo y busca compañía. | El caso enfatiza una pérdida consumada y difícil de revertir |
| `proc_miedo_01` / miedo | Un objeto pesado comienza a caer cerca de Jo. Percibe riesgo de daño y poco tiempo para reaccionar; intenta ponerse a resguardo. | La amenaza y la necesidad de protección aportan más que la sola activación |
| `proc_ira_01` / ira | Alguien se atribuye deliberadamente el trabajo de Sam. Sam lo considera injusto y cree que puede exigir una rectificación. | La atribución del agravio y el impulso de corregirlo diferencian este caso de una pérdida irreversible |
| `proc_asco_01` / asco | Al acercar comida, Cris detecta un olor de descomposición, interpreta que puede estar contaminada y la aparta sin probarla. | La repulsión y el rechazo al contacto o ingestión sustentan la respuesta |
| `proc_sorpresa_01` / sorpresa | Al entrar a un aula, Luz encuentra una disposición completamente inesperada. Se detiene para entender qué pasó, antes de decidir si le agrada. | La ruptura de expectativa es central; todavía no se describe amenaza ni valoración agradable |
| `proc_insuficiente_01` / información insuficiente | Una persona nota que su corazón late rápido antes de entrar a una sala. No se conoce qué espera ni qué significa la situación. | La activación aislada permite varias interpretaciones y no justifica una clave emocional única |

### Banco inicial y feedback

Objetivo del MVP: 24 casos claros, cuatro por emoción, y 6 casos de contraste o información insuficiente. Una práctica breve usa 12 casos claros y 2 de insuficiencia. Balancear longitud, complejidad y posiciones; evitar que la respuesta correcta se reconozca por una palabra exclusiva o por ser la opción más larga.

Después de elegir, pedir de forma opcional “¿Qué dato te orientó?” con selección de una tarjeta o texto breve. En comprobación puede ser obligatorio seleccionar una tarjeta, pero el texto libre no se califica automáticamente.

Feedback: respuesta esperada; dato discriminante; por qué el distractor cercano es menos adecuado; qué información faltaría para sostener otra interpretación. Permitir reportar “Este caso admite otra respuesta” para revisión editorial local/exportable.

## 12. Evaluación del aprendizaje

### Tres modalidades

| Modalidad | Ayudas y feedback | Uso de resultados |
|---|---|---|
| Práctica | Feedback inmediato, pistas y repetición | Orientar el estudio |
| Comprobación | Módulos 1 y 3 sin ayuda, feedback diferido; módulo 2 conserva su escalera estandarizada | Describir desempeño en esa actividad |
| Demostración docente | Modo proyector, respuesta grupal y discusión | No mezclar con resultados individuales |

### Indicadores

- Módulo 1: sensibilidad, especificidad, exactitud balanceada, incertidumbre y tipo de distractor.
- Módulo 2: identificación inicial, uso de ayudas, nivel del primer acierto y errores anteriores.
- Módulo 3: exactitud en casos claros, confusiones entre categorías, identificación de información insuficiente y selección del componente relevante.
- En todos: número de ensayos y porcentaje completado. Tiempos solo como información descriptiva opcional.

Para módulo 3, calcular `correctos / casos_presentados` y mostrar omisiones aparte; reportar los casos de insuficiencia separados de los seis emocionales. Una justificación puede utilizar una rúbrica docente: 0 sin fundamento pertinente, 1 identifica un componente relevante, 2 relaciona evaluación y otros componentes y distingue una alternativa. La rúbrica no debe fingir una calificación automática del texto libre.

No producir un índice global de “inteligencia emocional”. No dar percentiles, diagnóstico, niveles clínicos ni puntos de corte de aprobación sin validación específica. En el modo de estudio se puede sugerir qué practicar según los errores sin etiquetar a la persona.

### Antes y después

Usar formas A/B con identidades y casos distintos, distribuciones equivalentes y orden contrabalanceado cuando se aplique en grupos. Registrar `formId`, exposición previa y versión del banco. No interpretar una diferencia observada como efecto causal ni equivalencia de formas demostrada. El banco de práctica no debe aparecer en la medición posterior.

### Construcción reproducible de bloques

Para cada forma completa de 12 identidades hay 72 imágenes emocionales y 12 neutrales. Una distribución viable es reservar, por emoción, 6 imágenes como positivos del módulo 1, 4 como distractores de otros objetivos y 2 para módulo 2. Distribuir las 12 neutrales a razón de 2 por objetivo. Resultan 72 ensayos del módulo 1 y 12 del módulo 2, sin repetir archivos entre ambos.

Construir por cuotas antes de barajar; un barajado aleatorio de todo el banco no garantiza balance. Distribuir distractores mediante una asignación sin coincidencia entre expresión y objetivo. Verificar cuotas e identidades con un validador; si falta material, reducir el bloque y comunicar su composición real en vez de repetir silenciosamente estímulos.

## 13. Accesibilidad

Objetivo de interfaz: WCAG 2.2 AA, con evaluación manual además de herramientas automáticas [F10].

- Navegación completa por teclado, orden lógico y foco visible; sin controles que dependan de hover o arrastre.
- Controles táctiles propuestos de al menos 44 × 44 CSS px; separación suficiente.
- Texto normal con contraste mínimo 4.5:1; texto grande y componentes gráficos pertinentes, al menos 3:1.
- Reflujo a 320 CSS px y zoom de 200%; verificar 400% en escritorio, sin ocultar contenido o acciones.
- `lang="es-AR"`, encabezados jerárquicos, botones reales, `fieldset`/`legend` para respuestas y etiquetas explícitas.
- Mensajes de respuesta y pista anunciados con `aria-live="polite"`; no leer toda la pantalla en cada cambio.
- Al pasar de ensayo, llevar el foco a la consigna; no robar el foco después de una selección.
- No depender solo del color, sonidos, animaciones o plazos. Respetar `prefers-reduced-motion`.
- No activar cronometraje como requisito de desempeño ni presentar la velocidad como capacidad emocional.

### Accesibilidad de las caras sin revelar respuestas

El reconocimiento visual no puede convertirse en la misma tarea simplemente agregando el nombre de la emoción al `alt`. Usar en esa modalidad una identificación neutral, por ejemplo “Rostro del ejercicio 4”, y explicar el propósito visual. No declarar equivalencia para usuarios ciegos.

Ofrecer una **modalidad descriptiva** con movimientos faciales en texto, sin nombrar la emoción, y acceso íntegro al módulo de procesos emocionales. Registrar `stimulusMode: visual | descriptive`; sus resultados se presentan por separado. Describir el rostro cambia la tarea a comprensión de descripciones, algo que debe quedar claro.

En modo descriptivo, rediseñar los niveles de ayuda para que las pistas no repitan información ya expuesta. Probar con lector de pantalla y usuarios cuando sea posible. La presencia de esta adaptación no prueba por sí sola conformidad de toda la herramienta.

## 14. Arquitectura técnica

### Organización de archivos propuesta

```text
herramientas/identificar-emociones/
  index.html
  css/
    style.css
  js/
    app.js
    state.js
    sampler.js
    scoring.js
    storage.js
    export.js
    content-loader.js
    modules/
      presence.js
      hints.js
      process.js
  data/
    emotions.json
    faces.json
    presence-items.json
    hint-items.json
    process-items.json
    references.json
    bank-manifest.json
  assets/faces/
  licenses/
    image-credits.json
```

Guardar documentación de autoría, pruebas, originales, consentimientos y scripts de mantenimiento **fuera** de `herramientas/**`, porque la configuración actual copia ese árbol a la salida pública. Ubicaciones propuestas en la raíz del repositorio: `docs-source/identificar-emociones/` y `tests/identificar-emociones/`; los documentos privados permanecen fuera del repositorio público.

### Responsabilidades

- `state.js`: sesión, módulo, ensayo, ayudas, intentos, finalización y restauración.
- `sampler.js`: cuotas, semilla, exclusiones de identidades y orden del bloque.
- `scoring.js`: funciones puras de puntuación; no leer elementos del DOM.
- `content-loader.js`: cargar y validar JSON, resolver rutas y comprobar versión.
- `storage.js`: memoria y guardado local opcional, con manejo de errores de cuota o restricciones del navegador.
- `export.js`: generar JSON y CSV con metadatos; no transmitirlos.
- Vistas: renderizar el estado y emitir acciones; no duplicar la clave o la lógica de corrección en cada botón.

### Estados y eventos

Estados generales: `intro → loading → active → feedback → completed`. Añadir `paused` y `load_error`.

En módulo 2, `active` contiene `hintLevel`, `attemptedLevels` y `attempts`. `REQUEST_HINT` avanza una sola vez y acumula el historial. `SUBMIT_ANSWER` solo se admite en un nivel sin intento previo y con estímulo listo. Un acierto, revelación o último error produce un estado terminal del ensayo. `NEXT_ITEM` guarda una sola vez antes de avanzar.

Proteger contra dobles clics, respuestas durante carga y eventos de un ensayo anterior. Usar un identificador único de instancia de ensayo. El reducer debe ignorar transiciones inválidas; los resultados se derivan del historial confirmado, no de contadores incrementados desde botones.

### Persistencia y privacidad

Sesión en memoria por defecto. Ofrecer “Guardar mi progreso en este dispositivo” como opción, con explicación breve y botón para borrarlo. Utilizar una clave aislada, por ejemplo `ft-emociones:v1`, sin tocar datos de las otras herramientas.

Guardar solo versión, configuración, semilla, IDs de estímulos, respuestas y eventos necesarios. No solicitar nombre, documento, correo o fotos del participante. Advertir en el control de guardado que el progreso permanece en ese navegador. Si falla el almacenamiento, continuar en memoria y permitir exportar.

La app no enviará respuestas, confianza, textos o tiempos a un servidor. Esto no equivale a afirmar que el proveedor de hosting no genera registros de acceso. Evitar recursos remotos innecesarios para que el ejercicio no dependa de terceros.

Los bancos y claves de una aplicación estática son inspeccionables. Es adecuada para aprendizaje y comprobación formativa; no ofrece secreto de examen ni protección contra consulta de las respuestas.

### Rendimiento y despliegue

- Cargar la interfaz y metadatos primero; precargar el estímulo actual y los dos siguientes.
- Proponer imágenes de 640–960 px de lado largo, ajustando compresión tras inspección de rasgos; no fijar un peso que degrade las pistas.
- Servir por HTTP(S). El uso de módulos y `fetch` no debe prometer funcionamiento con doble clic sobre un archivo local.
- Probar rutas relativas tanto en la carpeta fuente servida como en `docs/herramientas/identificar-emociones/`.
- Versionar manifiesto y contenido juntos. Si una sesión guardada usa otra versión, ofrecer reinicio o exportación, sin recalificarla silenciosamente.
- No añadir service worker al MVP. Una versión sin conexión requiere un paquete y prueba específicos, con recursos locales y condiciones de licencia compatibles.

## 15. Contratos de datos

### Convenciones generales

IDs estables, sin tildes: `alegria`, `tristeza`, `miedo`, `ira`, `asco`, `sorpresa`. Separar texto mostrado de identificador. Usar `neutral` solo para estímulos. `uncertain`, `insufficient_information` y `omitted` tienen significados diferentes.

Todos los bancos deben tener `schemaVersion`, `contentVersion`, fecha de revisión y autoría. Validar IDs únicos, referencias existentes, respuestas admitidas, cuotas, claves, rutas y pistas. Los siguientes objetos son ejemplos de contrato, no contenido aprobado.

### Estímulo facial

```json
{
  "id": "f_0042",
  "identityId": "persona_006",
  "path": "assets/faces/f_0042.webp",
  "depictedExpression": "sorpresa",
  "stimulusType": "posed_photo",
  "split": "practice",
  "width": 768,
  "height": 960,
  "altNeutral": "Rostro del ejercicio",
  "movementDescription": "Descripción pendiente de revisar con la imagen.",
  "licenseId": null,
  "publicWebUseVerified": false,
  "reviewStatus": "draft",
  "recognitionPilot": null,
  "sourceRefs": []
}
```

### Ítem de pistas

```json
{
  "id": "hint_001",
  "faceId": "f_0042",
  "expectedEmotion": "sorpresa",
  "hints": [
    {"level": 1, "kind": "facial", "text": "Observá las cejas."},
    {"level": 2, "kind": "facial", "text": "Descripción de movimiento a validar."},
    {"level": 3, "kind": "facial", "text": "Contraste facial a validar."}
  ],
  "explanation": "Explicación pendiente de revisión.",
  "reviewStatus": "draft",
  "sourceRefs": []
}
```

Un ítem del módulo 1 enlaza `faceId`, `targetEmotion` y `expectedResponse`. El validador comprueba que `expectedResponse` coincida con la expresión representada para los estímulos de clave única. Los ambiguos no entran a ese conjunto por defecto.

### Caso de proceso emocional

```json
{
  "id": "proc_insuficiente_01",
  "difficulty": "advanced",
  "theoreticalModelId": "pending_pdf_review",
  "components": {
    "trigger": "Va a entrar a una sala.",
    "appraisal": null,
    "body": "Nota que el corazón late rápido.",
    "actionTendency": null
  },
  "answerType": "single",
  "expectedAnswer": "insufficient_information",
  "discriminatingComponent": "appraisal",
  "explanation": "Falta información sobre el significado de la situación.",
  "split": "practice",
  "reviewStatus": "draft",
  "sourceRefs": []
}
```

`null` representa información no suministrada, no ausencia psicológica de ese componente.

### Resultado por ensayo

```json
{
  "schemaVersion": "1.0",
  "contentVersion": "0.9-draft",
  "sessionId": "local-generated-id",
  "trialInstanceId": "local-trial-id",
  "mode": "practice",
  "stimulusMode": "visual",
  "module": "hints",
  "itemId": "hint_001",
  "formId": "practice",
  "seed": "local-seed",
  "attempts": [
    {"level": 0, "answer": "miedo", "correct": false, "activeMs": 5200},
    {"level": 1, "answer": "sorpresa", "correct": true, "activeMs": 4300}
  ],
  "hintLevelsSeen": [1],
  "outcome": "correct",
  "firstCorrectLevel": 1,
  "usedContextHint": false,
  "activeTotalMs": 9500
}
```

Registrar tiempos desde que imagen y opciones están disponibles; descontar pausa explícita y pestaña oculta. No interpretar milisegundos del navegador como una medida experimental de alta precisión. Exportar `null` cuando no haya dato.

JSON conserva el historial completo. CSV puede contener una fila por intento y otra exportación por ensayo, con encabezados inequívocos y versión. Escapar campos y neutralizar texto que una planilla podría interpretar como fórmula; no incluir identificadores personales.

## 16. Plan por etapas

### Etapa 0. Insumos y encaje con el sitio

Revisar instrucciones del repositorio, estado de trabajo, configuración Quarto y herramientas vecinas. Incorporar los PDF y completar la matriz teórica. Decidir procedencia y derechos del banco facial.

**Salida:** revisión teórica, inventario de estímulos y decisiones confirmadas. Si faltan archivos o permisos, documentar qué contenido continúa como borrador; avanzar en la estructura sin fingir que están resueltos.

### Etapa 1. Prototipo navegable

Implementar inicio, tres módulos, navegación, estado, resultados y estilos. Utilizar estímulos de demostración claramente identificados y seis casos de proceso revisables.

**Aceptación:** se puede recorrer cada módulo de principio a fin con mouse y teclado; las pistas y errores se registran correctamente; no hay imágenes rotas ni preguntas de relleno presentadas como banco final.

### Etapa 2. MVP docente

Integrar las fichas revisadas, banco de práctica, 24 casos claros y 6 de contraste, feedback, modalidad descriptiva, exportación y guardado opcional. Vincular la herramienta desde Docencia y el curso correspondiente si existe una sección apropiada.

**Aceptación:** derechos y fuentes trazables; ninguna ficha `draft` entra al modo definitivo; módulos y métricas coherentes; pruebas móviles y de accesibilidad realizadas.

### Etapa 3. Pilotaje y revisión

Pilotear consignas, claridad de caras, progresión de pistas, duración y casos ambiguos. Revisar confusiones frecuentes sin asumir que todo desacuerdo es error del participante. Registrar modificaciones y publicar una nueva versión del banco.

**Aceptación:** informe con muestra, procedimiento, distribuciones de respuesta, incidencias y cambios. Describirlo como pilotaje, no como validación clínica.

### Etapa 4. Formas de comprobación

Ampliar el banco por identidad, producir formas A/B y casos nuevos, comprobar cuotas y separación de exposiciones. Añadir comparaciones antes/después y descarga para análisis docente.

**Aceptación:** ausencia de contaminación entre conjuntos, reporte de exposición y diferencias de dificultad, sin atribuir equivalencia no demostrada.

### Etapa 5. Extensiones opcionales

Más variabilidad expresiva, casos mixtos, secuencias dinámicas autorizadas, práctica personalizada y paquete sin conexión. Una eventual recolección remota de datos será un proyecto separado con finalidad y requisitos definidos.

## 17. Verificación y criterios de aceptación finales

### Pruebas de lógica prioritarias

1. El muestreador respeta cuotas, conjunto e identidad y reproduce el bloque con la misma semilla.
2. No admite una respuesta antes de cargar la imagen ni registra dos veces un doble clic.
3. En módulo 2 solo permite un intento por nivel; conserva errores y distingue ayuda facial, contexto y revelación.
4. En módulo 1 incertidumbre y omisión no se convierten en rechazo correcto.
5. En módulo 3 la información insuficiente tiene su propia clave; texto libre no genera corrección inventada.
6. Denominadores vacíos muestran “Sin datos”; una sesión parcial nunca se presenta como completa.
7. Restaurar una sesión no cambia orden, ayudas ni puntajes; una versión incompatible no se recalifica en silencio.
8. Las exportaciones reproducen los datos visibles y no contienen campos personales ni fórmulas ejecutables provenientes de texto.

### Revisión de interfaz y contenido

- Completar una sesión con teclado y otra con pantalla táctil.
- Revisar lector de pantalla, contraste, texto grande, reducción de movimiento y foco tras cada acción.
- Probar al menos 360, 768 y 1280 px, además de reflujo/zoom.
- Probar carga fallida, almacenamiento bloqueado, recarga, pausa y salida a mitad de actividad.
- Confirmar que `alt`, nombres visibles, colores, selección inicial y feedback anticipado no revelen la clave.
- Verificar que cada pista describa la imagen correcta y que esta no se modifique al avanzar.
- Validar rutas y recursos en la salida de Quarto y ausencia de errores de consola.
- Comprobar en la salida pública que no se copiaron consentimientos, originales privados o PDF restringidos.
- Revisar que el texto hable de tareas y aprendizajes, sin diagnósticos ni inferencias sobre la capacidad emocional general.

### Entregables de implementación

Aplicación funcional; bancos versionados; registro de fuentes y derechos; documentación para agregar una cara, pista o caso; instrucciones de ejecución y publicación; pruebas de lógica y recorrido; informe breve de verificaciones y pendientes reales. No dejar imágenes inexistentes, permisos supuestos ni contenido teórico sin revisar dentro del banco marcado como definitivo.

## 18. Fuentes revisadas

Consulta realizada el 22 de octubre de 2026. Los enlaces a repositorios corresponden a archivos leídos; los contenidos pueden cambiar después de esta fecha.

### Sitio y herramientas

- **F1.** [Configuración Quarto del sitio](https://github.com/toninif/toninif.github.io/blob/main/_quarto.yml). Confirma sitio, salida `docs` y recursos `herramientas/**`.
- **F2.** [Estilo general](https://github.com/toninif/toninif.github.io/blob/main/custom.scss) y [portal Docencia](https://github.com/toninif/toninif.github.io/blob/main/docencia/index.qmd). Confirman paleta, tipografía y puntos de integración.
- **F3.** [Teorías de la emoción: HTML](https://github.com/toninif/toninif.github.io/blob/main/herramientas/teorias-emocion/index.html) y [CSS](https://github.com/toninif/toninif.github.io/blob/main/herramientas/teorias-emocion/css/style.css). Referencia de organización, navegación y estilo.
- **F4.** [Contingencia operante: HTML](https://github.com/toninif/toninif.github.io/blob/main/herramientas/contingencia-operante/index.html), [CSS](https://github.com/toninif/toninif.github.io/blob/main/herramientas/contingencia-operante/css/style.css) e [Iowa Gambling Task](https://github.com/toninif/toninif.github.io/blob/main/herramientas/iowa-gambling-task/index.html). Referencias de actividades, devoluciones y estructura estática.
- **F5.** [Detección facial emocional: documentación](https://github.com/toninif/emociones-basicas-lector/blob/main/README.md) e [interfaz](https://github.com/toninif/emociones-basicas-lector/blob/main/index.html). Referencia complementaria sobre expresiones, docencia y distinción entre puntos, movimientos y experiencia.

### Estímulos y fundamento complementario

- **F6.** [Radboud Faces Database](https://rafd.nl/) y [descripción del banco](https://rafd.nl/Overview.html). Condiciones y composición consultadas. No constituyen autorización para incorporarlo a este proyecto.
- **F7.** [KDEF](https://kdef.se/) y [condiciones de uso y publicación](https://kdef.se/faq/using-and-publishing-kdef-and-akdef). No constituyen autorización para redistribuirlo.
- **F8.** Barrett, L. F., Adolphs, R., Marsella, S., Martinez, A. M. y Pollak, S. D. (2019). [Emotional Expressions Reconsidered: Challenges to Inferring Emotion From Human Facial Movements](https://doi.org/10.1177/1529100619832930). Psychological Science in the Public Interest, 20(1), 1–68. Fuente complementaria; no es uno de los tres PDF identificados por el usuario.
- **F9.** Scherer, K. R. (2001). [Appraisal Considered as a Process of Multilevel Sequential Checking](https://doi.org/10.1093/oso/9780195130072.003.0005). Referencia complementaria para organizar evaluaciones; la nomenclatura definitiva depende de los PDF.
- **F10.** W3C, [How to Meet WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/). Requisitos de accesibilidad a verificar durante la implementación.
- **F11.** Quarto, [Website Options](https://quarto.org/docs/reference/projects/websites.html). Documentación de `output-dir`, `render` y `resources`.

### Fuentes aún pendientes

Los tres PDF adjuntos a la conversación “Diseñar herramienta emocional”. Sus datos bibliográficos y páginas se completarán únicamente después de recibir y leer los archivos.

## 19. Instrucción de arranque reutilizable

> Implementá la herramienta descrita en este archivo en el repositorio del sitio de Fernando Tonini. Inspeccioná primero sus instrucciones y estructura actual. Conservá la integración Quarto y desarrollá los tres módulos con HTML, CSS y JavaScript separados de los contenidos. Revisá los insumos disponibles y mantené explícito el estado de los PDF, fuentes y permisos de imágenes. Avanzá en las partes independientes de cualquier insumo faltante y usá datos de demostración identificados para probar el recorrido. Priorizá la corrección pedagógica, el registro de intentos y pistas, la accesibilidad y el funcionamiento móvil. Entregá una versión local verificable, bancos versionados, documentación y evidencia de las pruebas pertinentes. No presentes como definitivos contenidos sin revisión ni como validada una medición que solo fue pilotada. Prepará la integración al sitio sin publicar cambios remotos como parte de este encargo de implementación local.
