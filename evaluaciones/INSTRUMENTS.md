# Catálogo y revisión de instrumentos

Revisión: 22 de septiembre de 2026. La plataforma permanece en versión de prueba.
Las versiones y sus preguntas se guardan en los módulos de cada evaluación nueva;
no se reemplazan los textos ni las respuestas de evaluaciones previas.

## Formulario inicial — `intake-1`

Formulario clínico propio: motivo, inicio/evolución, impacto, expectativas,
tratamientos, medicación, salud, apoyos y otros comentarios. Solo el motivo es
obligatorio. Hasta 3000 caracteres por campo. No calcula puntajes ni se presenta
como test validado. Los datos identificatorios ya están en la ficha del paciente.

## PHQ-9 — `phq9-msal-2025`

Texto, consigna, respuestas y pregunta complementaria reproducidos del
[Manual para el cuidado de personas con enfermedades no transmisibles,
Ministerio de Salud de la Nación (2025), página impresa 152](https://www.argentina.gob.ar/sites/default/files/manualcuidadoent4_-1-.pdf).
Se conserva la redacción publicada, sin adaptar el tuteo/voseo.

[Urtasun et al. (2019)](https://doi.org/10.1186/s12888-019-2262-9) estudiaron
169 adultos de 21 años o más, hispanohablantes, en atención ambulatoria, mediante
muestreo intencional. Utilizaron la versión previamente adaptada para Argentina.
La fuente del texto de esta implementación es el manual ministerial, no un
protocolo original aportado por los autores del estudio. La evidencia local no
equivale a una validación de esta administración web, ni a baremos universales.

Autores del instrumento: Spitzer, Williams y Kroenke.
[Pfizer anunció el acceso gratuito y sin restricciones de copyright a PHQ/GAD-7](https://www.pfizer.com/print/pdf/node/3064).

Corrección: suma de los nueve enteros 0–3, total 0–27, calculada en PostgreSQL.
La pregunta complementaria de dificultad es obligatoria cuando alguna respuesta
es positiva, se almacena aparte y no suma. No se generan diagnósticos, categorías
de severidad ni recomendaciones terapéuticas automáticas. El servidor rechaza
respuestas faltantes, valores fuera de escala, claves inesperadas y módulos ajenos.

### Ítem 9 y revisión

Una respuesta mayor que cero en un guardado genera una señal persistente en la
evaluación y un evento de auditoría, aunque luego se cambie la respuesta. Se ve
en Inicio, Evaluaciones y detalle incluso durante el progreso. No se clasifica
automáticamente el nivel de riesgo. No es un sistema de alertas por email, ni de
monitoreo continuo: el profesional debe acordar un canal de urgencias con el
paciente y revisar el tablero. La señal aparece al guardar la sección; una
respuesta que no se guardó todavía no fue recibida por el profesional.

El profesional registra valoración/seguimiento en observaciones y confirma
«Registrar revisión de esta señal». Puede hacerlo antes del envío final. Una
nueva respuesta positiva guardada vuelve a requerir revisión. No se puede marcar
la evaluación como revisada mientras la señal no esté atendida. El registro de
esa acción no equivale por sí mismo a una evaluación clínica completa de riesgo.

Al paciente se le explica que la página no se monitorea en tiempo real y, ante
una respuesta positiva, se le indica buscar ayuda urgente si está en peligro,
acudir a una guardia/emergencias y contactar a su profesional por el canal habitual.

## SWLS — `swls-legacy-1`

La suma actual de cinco enteros 1–7 es correcta: 5–35, sin ítems invertidos.
Se conserva la versión lingüística previa para mantener los enlaces y protocolos
existentes. No se la etiqueta como adaptación argentina validada.

La [adaptación de Mikulic, Crespi y Caballero (2019), Tabla 1](https://www.psi.uba.ar/publicaciones/anuario/trabajos_completos/26/mikulic.pdf)
presenta diferencias en los ítems 1, 2 y 5 frente al texto actual. El estudio
incluyó dos muestras no probabilísticas de adultos de Buenos Aires (218 y 273
participantes). No corresponde trasladar automáticamente sus propiedades al texto
actual ni alterar retroactivamente los protocolos. El mínimo de 7 indicado en un
párrafo del artículo es inconsistente con cinco respuestas de 1–7; se mantiene 5.

La [página actual de los autores](https://eddiener.com/satisfaction-with-life-scale-swls/)
limita el permiso general a fines no comerciales; existen documentos históricos
con formulaciones más amplias. Antes de ampliar su uso clínico comercial debe
aclararse el permiso aplicable y seleccionar la adaptación exacta. Esta revisión
no otorga ni supone una licencia adicional. No se incorporaron nuevas versiones
de SWLS ni interpretaciones automáticas.

## Pendientes clínicos

- Confirmar población destinataria y procedimiento de seguimiento con el profesional.
- Resolver versión/permisos de SWLS antes de presentar el catálogo como plenamente
  validado para uso clínico argentino.
- Seleccionar ansiedad, afectividad y personalidad en una siguiente etapa.
