# Revisión teórica de los tres insumos

Fecha: 22 de octubre de 2026. Lectura y redacción preparadas con Codex para revisión de Fernando Tonini.

Se analizaron los tres archivos completos: **68 páginas** (11 + 14 + 43). Esta revisión completa la incorporación de insumos que estaba pendiente en las especificaciones 0.9. No acredita revisión del responsable docente, acuerdo entre revisores ni pilotaje. Todo el banco conserva `reviewStatus: draft`, `contentVersion: 0.1.0-demo` y canal `demo`.

Este documento vive en `docs-source/`, porque `docs/` es salida generada. Los PDF, sus extracciones y las imágenes de sus páginas no forman parte de los recursos de la herramienta.

## Inventario y localización

| ID | Archivo original | Referencia comprobable | Páginas y versión |
|---|---|---|---|
| `pdf_01` | `0512_APU_EstudioDeLaEmociónDesdePerspectivaCognitiva_222Q_v1-0.pdf` | *El estudio de la emoción desde una perspectiva cognitiva*. Universidad de Palermo, institución identificada en el pie; autoría personal y fecha bibliográfica no indicadas. | 11 páginas, impresas 1–11. `222Q_v1-0` según nombre del archivo. Los metadatos de creación señalan 2022; no se transforma ese dato en año de publicación. |
| `pdf_02` | `0512_APU_ProcesoEmocionalEnEmocionesPrimarias_222Q_v1-0_removed.pdf` | *Proceso emocional en las emociones primarias*. Universidad de Palermo, identificación institucional visible. Sin portada, autoría personal ni año bibliográfico. | 14 páginas, impresas 3–16. `222Q_v1-0_removed` según nombre del archivo. |
| `pdf_03` | `cap9_laemocion.pdf` | *La emoción*, fragmento de *Procesos psicológicos*. La referencia de `pdf_01`, p. 11, lo atribuye a Fernández-Abascal, Martín Díaz y Domínguez Sánchez (2001), pp. 295–337, Pirámide. El fragmento no incluye portada editorial: se conserva explícito el origen de esta atribución. | 43 páginas escaneadas. Numeración impresa 295–337; la primera p. 295 se identifica por continuidad con la p. 296 y con la referencia del apunte. |

En `pdf_01`, página PDF = página impresa. En `pdf_02`, página impresa = página PDF + 2. En `pdf_03`, página impresa = página PDF + 294. Los localizadores de los JSON incluyen ambos números, sección e interpretación; los datos desconocidos se conservan como `null`.

## Método y alcance de la lectura

Se extrajo el texto de las 25 páginas de los dos apuntes con PyMuPDF. El capítulo carecía de una capa de texto utilizable: se renderizaron sus 43 páginas y se aplicó OCR en español con Tesseract.js, localmente. La descarga necesaria fue el modelo lingüístico; los PDF no se enviaron a un servicio de OCR.

Se leyeron todas las páginas, incluida la sección de emociones secundarias y las conclusiones del capítulo. Se contrastaron visualmente el esquema del proceso, las tablas de evaluación y afrontamiento, los patrones faciales y las páginas con inconsistencias. En particular, las páginas PDF 5 y 39 del capítulo produjeron OCR desordenado; se leyeron directamente en las imágenes. Las tablas que el OCR perdía o mezclaba se cotejaron con sus páginas renderizadas. Las extracciones no se consideran transcripciones corregidas ni documentos para distribuir.

## Síntesis de `pdf_01`: perspectiva cognitiva

Las páginas 1–2 sitúan el enfoque cognitivo frente a perspectivas biológicas y culturalistas. Reconocen influencias biológicas, sociales y de aprendizaje, pero asignan a la evaluación individual el papel central en el desencadenamiento de la emoción. La definición del apunte relaciona valoración de una situación y activación del organismo. Las funciones se organizan en adaptativa, social y motivacional.

La página 3 presenta el modelo secuencial utilizado en este curso: evento significativo interno o externo, evaluación valorativa, activación, filtro de aprendizaje y cultura, efectos observables. Este es el modelo del material, no una síntesis de todas las teorías de la emoción.

Las páginas 4–5 distinguen evaluación afectiva (novedad y agrado intrínseco) de valoración del significado de la situación (significación, afrontamiento y normas). La evaluación no debe reducirse a un pensamiento verbal consciente. El apunte resume el afrontamiento evaluativo en agente y motivo; el capítulo desarrolla además control, poder/capacidad y ajuste. La aplicación conserva esta ampliación con localizador del capítulo, en lugar de atribuirle al apunte una lista que omite.

Las páginas 5–7 desarrollan los cuatro componentes de activación: experiencia subjetiva, expresión corporal, afrontamiento y soporte fisiológico. El texto distingue activación emocional de activación inducida por ejercicio o sustancias. Para la herramienta, esto se traduce en que un signo corporal aislado no autoriza una clave emocional; no se pide al participante determinar por sí solo el origen de un pulso acelerado.

Las páginas 7–9 explican el filtro de aprendizaje y cultura. Las manifestaciones pueden inhibirse, exagerarse o distorsionarse. Distinguen afrontamientos cognitivos y conductuales, activos, pasivos o evitativos, y focalizados en evaluación, problema o emoción. Estas taxonomías se documentan sin convertirlas en una única escalera de acción ni en opciones de respuesta emocional.

Las páginas 9–10 clasifican primarias y secundarias y presentan las seis primarias que toma esta herramienta: sorpresa, alegría, miedo, ira, asco y tristeza. También distinguen valencia positiva, negativa y neutra. La página 11 contiene las referencias y permite relacionar los apuntes con el capítulo escaneado. La clasificación se presenta como el recorte del curso; no se enseña como clasificación exhaustiva e indiscutida.

## Síntesis de `pdf_02`: procesos en las primarias

La página PDF 1 (impresa 3) enumera las seis categorías. Las páginas PDF 2–7 (impresas 4–9) describen sucesivamente miedo, tristeza, ira, asco, sorpresa y alegría, integrando desencadenantes, evaluaciones, efectos y afrontamiento. La página 8 introduce la comparación; las páginas 9–14 desarrollan las tablas de desencadenantes, evaluación, experiencia subjetiva, expresión facial, soporte fisiológico y afrontamiento.

- **Miedo** (PDF 2): peligro percibido, baja capacidad de control, incertidumbre y protección mediante escape o evitación. La atención al daño y los recursos percibidos discriminan mejor que la activación compartida con otras emociones.
- **Tristeza** (PDF 3): pérdida o resultado desfavorable ya ocurrido, baja urgencia, desánimo, reducción de actividad, autoexamen y búsqueda de apoyo. La herramienta evita convertir la ausencia de culpable en requisito universal.
- **Ira** (PDF 4): agravio, injusticia o vulneración, obstáculo para metas y percepción de poder para intervenir. La movilización para autodefensa o ataque se distingue de la conducta efectivamente realizada.
- **Asco** (PDF 5): repulsión, rechazo al contacto e ingestión, sensaciones gastrointestinales y función protectora. Los casos originales usan alimentos y materiales deteriorados; no presentan colectivos humanos como estímulos de repulsión.
- **Sorpresa** (PDF 6): novedad y ruptura de expectativas, orientación, exploración y posible transición a otra emoción. No se fuerza una valencia agradable ni se convierte intensidad baja en condición necesaria.
- **Alegría** (PDF 7): logro, congruencia entre deseos y resultados, bienestar, disfrute y acercamiento. Se mantiene esta denominación en la aplicación y se diferencia de felicidad global.

La tabla facial de PDF 12 (impresa 14) sustenta la elección inicial de zonas para orientar la observación. Sus fotografías se inspeccionaron como ejemplos del material, pero no se incorporan al banco: no aportan permisos concretos de redistribución. Las ilustraciones son geometría vectorial original, sin trazado de esas fotografías ni de las figuras del capítulo.

Las tablas de PDF 10 y 13 simplifican diferencias entre emociones y contienen valores que discrepan con el texto o con el capítulo. No se adoptan como reglas deterministas de corrección.

## Síntesis de `pdf_03`: capítulo completo

| Páginas PDF / impresas | Contenido leído y decisión de implementación |
|---|---|
| 1–2 / 295–296 | Introducción, objetivos, coordinación de recursos psicológicos y funciones adaptativa, social y motivacional. La introducción de la aplicación propone comprender un proceso, además de nombrar expresiones. |
| 3–4 / 297–298 | Definición, dos componentes centrales y figura 9.1. Se distinguen experiencia, comunicación, conducta y respuestas fisiológicas, mediadas por aprendizaje y cultura. Es el fundamento de los cuatro bloques de lectura y de las cautelas sobre una cara neutral. |
| 5–7 / 299–301 | Evaluación afectiva, valoración del significado, vías ilustrativas y cuadro 9.1. Se utilizan novedad, agrado, metas, atribución, control/capacidad, ajuste y normas. No se implementan mapas neuroanatómicos ni se presenta el esquema histórico de vías como una explicación exhaustiva del cerebro. |
| 8–9 / 302–303 | Comparación de primarias/secundarias, sesgos y comienzo de activación. Sirve para delimitar el banco; no se incorporan ansiedad, hostilidad o celos como nuevas claves faciales. |
| 10–11 / 304–305 | Cuadro 9.3 y desarrollo de experiencia subjetiva, expresión, afrontamiento y fisiología. La tendencia y la conducta se presentan por separado; el dato corporal requiere contexto. |
| 11–14 / 305–308 | Filtro cultural, manifestaciones instrumentales, estilos de afrontamiento y cuadro 9.4. Una sonrisa puede cumplir una función social. Los recursos aprendidos no se identifican automáticamente con el patrón típico de una emoción. |
| 14–15 / 308–309 | Clasificación por primarias/secundarias y tono hedónico. Neutralidad expresiva y valencia neutra de sorpresa se mantienen como conceptos diferentes. |
| 15–18 / 309–312 | Miedo; cuadros 9.5 y 9.6. Amenaza, escasos recursos percibidos y protección; se contemplan evitación, inmovilidad y otras respuestas protectoras sin un vínculo necesario entre gesto y experiencia. |
| 18–21 / 312–315 | Ira; cuadros 9.7 y 9.8. Agravio, obstrucción, atribución y capacidad de intervenir. El propio texto distingue ira y agresión, y admite afrontamientos alternativos. Por eso un caso puede incluir reclamo deliberado y cuidadoso. |
| 22–24 / 316–318 | Tristeza; cuadros 9.9 y 9.10. Pérdida, reducción de actividad, autoexamen y cohesión. Se toma el contraste pérdida/amenaza y se evita un criterio rígido de culpabilidad o una equivalencia con depresión. |
| 24–26 / 318–320 | Asco; cuadros 9.11 y 9.12. Repulsión, rechazo y protección. La descripción de nariz arrugada y labio superior elevado sustenta el dibujo original; se documenta su diferencia con el resumen del segundo PDF. |
| 26–28 / 320–322 | Felicidad; cuadros 9.13 y 9.14. El texto distingue la evaluación global de la vida de episodios de alegría. Se conserva esa diferencia en la ficha y no se importa una definición global a un ejercicio breve. |
| 28–30 / 322–324 | Sorpresa; cuadros 9.15 y 9.16. Ruptura de expectativa, orientación y transición. Se verificó la contradicción entre desaceleración cardíaca del texto y aumento en el cuadro de la misma página. El pulso no determina la clave. |
| 31–34 / 325–328 | Ansiedad; cuadros 9.17 y 9.18. Expectativas, aprendizaje, atención y activación sostenida. Se leyó íntegramente, pero queda fuera de las seis claves del banco y de cualquier interpretación clínica del resultado. |
| 33–36 / 327–330 | Hostilidad; cuadros 9.19 y 9.20. Actitudes y atribuciones mantenidas, diferenciadas de episodios puntuales de ira. No se trata desprecio como sinónimo de asco ni se agregan perfiles de personalidad. |
| 36–38 / 330–332 | Amor/cariño; cuadros 9.21 y 9.22. Distinciones de vínculos, valoraciones subjetivas y acercamiento. Leído para delimitar el alcance, sin convertir una de estas formas en etiqueta del entrenamiento facial. |
| 39–41 / 333–335 | Humor e hilaridad; cuadros 9.23 y 9.24. Estímulos, contexto social, risa y efectos. Refuerza que una conducta observable puede requerir más información; no se fusiona humor con alegría. La p. 39 se leyó visualmente por OCR defectuoso. |
| 41–43 / 335–337 | Conclusiones y resumen del capítulo. Se retiene la importancia del proceso para la adaptación y las decisiones. No se reproducen porcentajes clínicos, afirmaciones médicas ni generalizaciones sin revisión actual independiente. |

## Matriz transversal de trazabilidad

Cada par numérico indica página PDF (página impresa). Los JSON conservan localizadores por registro; esta matriz explica cómo se trasladan los conceptos a decisiones docentes.

| Concepto | `pdf_01` | `pdf_02` | `pdf_03` | Uso en la herramienta |
|---|---|---|---|---|
| Definición: evaluación y activación | 2–3 (2–3), 5 (5) | 2–7 (4–9), aplicaciones | 3–4 (297–298), 9–10 (303–304) | Guía de proceso y casos de información insuficiente. |
| Funciones adaptativa, social y motivacional | 2 (2) | 3–7 (5–9), 14 (16) | 2 (296) | Función posible en cada ficha; evitar moralizar emociones agradables/desagradables. |
| Novedad y agrado | 4 (4) | 10 (12) | 5–7 (299–301) | Contrastes sorpresa/miedo y disfrute/repulsión. |
| Significado, metas y urgencia | 5 (5) | 10 (12) | 6–7 (300–301) | Tarjeta «Significado para la persona» y claves de casos. |
| Agente, motivo, control, capacidad y ajuste | 5 (5), resumen parcial | 2–7 (4–9) | 6–7 (300–301), cuadros de cada emoción | Los casos incorporan recursos percibidos; fuente del detalle es el capítulo. |
| Experiencia subjetiva | 6–7 (6–7) | 11 (13) | 10 (304) y cuadros por emoción | Descripciones originales sin incluir la palabra que responde el ejercicio. |
| Expresión facial | 6–7 (6–7) | 12 (14) | 17 (311), 19 (313), 23 (317), 25 (319), 28–29 (322–323) | 14 ilustraciones y pistas sobre rasgos observables. No se etiqueta el estado interno de personas. |
| Soporte fisiológico | 6–7 (6–7) | 13 (15) | 11 (305) y cuadros por emoción | Fichas con posibilidades; activación aislada no identifica una categoría. |
| Afrontamiento y función | 6–9 (6–9) | 14 (16) | 11–14 (305–308), 18–30 (312–324) | Tarjeta de tendencia a actuar; se distingue impulso de acción realizada. |
| Aprendizaje y cultura | 7–9 (7–9) | Apunte de procesos por categoría | 11–14 (305–308) | Cara neutral y sonrisa social como casos sin información suficiente. |
| Clasificación y nombres | 9–10 (9–10) | 1 (3) | 14–15 (308–309), 26–28 (320–322) | Seis categorías; `ira` interno y «Enojo» en opciones; neutral sólo como estímulo. |

## Diferencias y criterios editoriales

1. **Alegría y felicidad.** `pdf_02`, PDF 7/impresa 9, describe alegría vinculada al logro; el capítulo, PDF 26–28/impresas 320–322, desarrolla felicidad y explicita que no equivale a cada episodio de alegría. Se usa «Alegría» para la categoría del curso; la ficha conserva la diferencia. No se altera silenciosamente el título del capítulo.
2. **Urgencia.** En miedo e ira, el segundo apunte describe urgencia alta (PDF 2 y 4) y su tabla marca media (PDF 10). El capítulo repite la divergencia entre prosa y cuadros 9.5 y 9.7. En asco, el cuadro del apunte marca alta y el capítulo describe media (PDF 25/impresa 319). No se usan esos niveles como preguntas con una respuesta única.
3. **Pulso en sorpresa.** `pdf_02`, PDF 13/impresa 15, señala incremento. En `pdf_03`, PDF 30/impresa 324, la prosa señala desaceleración, mientras que el cuadro 9.16 indica incremento. La ficha informa la discrepancia; ningún caso se resuelve por la dirección del pulso.
4. **Expresión de asco.** El resumen de `pdf_02`, PDF 12/impresa 14, menciona labio inferior descendente; el capítulo PDF 25/impresa 319 explicita labio superior elevado. Se dibuja y describe la segunda configuración, sin presentarla como reproducción de la fotografía del apunte ni como condición necesaria de toda experiencia de asco.
5. **Culpa en tristeza.** Los textos proponen una oposición prototípica entre ira con agente culpable y tristeza sin culpable. No se transforma ese contraste en prohibición de sentir tristeza cuando otra persona causa una pérdida. Las claves construidas se centran en pérdida, reversibilidad y evaluación, y admiten revisión.
6. **Sorpresa, agrado y cambio.** Se adopta el quiebre de expectativa como foco. El capítulo combina formulaciones de neutralidad y de experiencia algo agradable; el apunte simplifica la intensidad. La actividad no exige alegría ni amenaza en la primera reacción de sorpresa.
7. **Afrontamiento.** Se conserva la diferencia entre valoración de recursos, tendencia típica y estrategia o conducta efectivamente desplegada. No se confunde la lista del apunte con evaluación primaria/secundaria de Lazarus ni con una escala automática/deliberada.
8. **Universales, fisiología y clínica.** Las afirmaciones del material se identifican como parte de su marco. La interfaz utiliza patrones ilustrativos y asociaciones posibles. No infiere emociones de personas reales, estados clínicos ni generalizaciones a partir del desempeño.

## Traducción al banco y estado de aprobación

- **Biblioteca:** seis fichas con definición, nombres, desencadenantes, evaluación, cuerpo, experiencia, patrón ilustrativo, tendencia, función, confusión, ejemplo, contraejemplo y fuentes. Guía transversal y glosario.
- **Presencia:** 12 ítems y 12 archivos únicos: un positivo y un negativo por objetivo; seis positivos, dos negativos neutrales y cuatro de otras expresiones. Reducción explícita frente a los 24 del objetivo de práctica de las especificaciones; no se rellenan cuotas repitiendo archivos.
- **Pistas:** 12 ítems, dos por emoción. Pistas visuales y ayudas de lectura diferenciadas; contexto sólo como cuarto nivel opcional de práctica integrada. La ilustración permanece igual. La ayuda no elimina opciones.
- **Procesos:** 24 casos claros (cuatro por emoción) y seis con información insuficiente. Cada bloque selecciona dos claros por emoción y dos de insuficiencia. Dos casos claros por emoción y tres de insuficiencia pertenecen a práctica; los restantes a comprobación de demostración. No hay solapamiento de casos entre esas modalidades, ni equivalencia psicométrica demostrada.
- **Derechos:** dibujos vectoriales originales y créditos explícitos. Ninguna fotografía, figura del libro, consentimiento o PDF se copia al recurso estático. No hay banco fotográfico autorizado, dos revisores ni pilotaje de reconocimiento.
- **Resultado:** versión local funcional para la revisión solicitada. No hay contenido `reviewed` o `published` inventado. La comprobación facial permanece deshabilitada por falta de un banco revisado con identidades independientes.

La aprobación docente deberá examinar las fichas, las claves, las explicaciones, el ajuste entre cada dibujo y sus pistas, y los casos con otra interpretación defendible. La posterior ampliación fotográfica y las formas A/B son etapas de autoría y pilotaje pendientes; no bloquean el recorrido local de demostración entregado para revisar.
