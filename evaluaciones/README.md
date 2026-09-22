# Evaluaciones

Aplicación en `fernandotonini.com.ar/evaluaciones/`.

## Estado actual

- Interfaz navegable para profesional y paciente.
- Pacientes y evaluaciones guardados en Supabase.
- Esquema inicial de base de datos en `supabase-schema.sql`.
- Funciones de acceso privado para pacientes en `supabase-patient-access.sql`.
- Login, respuestas por ítem, puntaje y revisión profesional. Sin envío de correos.

## Formulario inicial y PHQ-9 (quinta actualización)

Ejecutar **`supabase-modules.sql` completo** en Supabase → SQL Editor → New query
→ Run, después de las cuatro migraciones anteriores. No elimina datos. Puede
guardarse como «05 - Evaluaciones modulares». No volver a ejecutar las migraciones
antiguas por encima de esta. Después, recargar la aplicación.

Permite seleccionar Formulario inicial, PHQ-9 y/o SWLS. Cada evaluación nueva
conserva una copia de sus instrumentos. Se guarda cada sección al continuar;
se puede retomar desde el mismo enlace y el envío final exige todos los módulos.
El formulario inicial no puntúa. La dificultad del PHQ-9 no suma. Los puntajes se
calculan en el servidor. Un ítem 9 positivo queda destacado para revisión privada.

Si la quinta migración todavía no se ejecutó, la aplicación indica qué falta,
deshabilita los nuevos módulos y mantiene operativo el recorrido SWLS anterior.
No se aplicó esta migración automáticamente al proyecto remoto.

Fuentes, versiones, población estudiada, límites y revisión pendiente de SWLS:
[`INSTRUMENTS.md`](INSTRUMENTS.md).

### Verificación local y online

Pruebas sin dependencias: `node --test evaluaciones/tests/*.test.cjs`.
Para incluir PostgreSQL WASM y navegador real (datos ficticios, sin Supabase):

```powershell
npm install --prefix "$env:TEMP/tonini-evaluaciones-qa" --no-audit --no-fund @electric-sql/pglite playwright
$env:EVALUATIONS_QA_ROOT = "$env:TEMP/tonini-evaluaciones-qa"
node --test evaluaciones/tests/*.test.cjs
node evaluaciones/tests/modules-browser.cjs
```

Requiere Edge instalado. Las capturas quedan en esa carpeta temporal.
La prueba PostgreSQL aplica las cinco migraciones, prueba reejecución de la quinta,
respuestas inválidas, módulos cruzados, permisos de funciones, puntajes, progreso,
señal persistente, bloqueo de revisión y compatibilidad SWLS. Solo sustituye la
función digest de pgcrypto por sha256 nativo en la base local de prueba.
El navegador usa el frontend real con una conexión simulada y bloquea red externa.

Luego de ejecutar el SQL remoto, prueba manual con un paciente ficticio:
crear una evaluación con los tres módulos; guardar motivo; cerrar y retomar el
enlace en incógnito; responder PHQ-9 con ítems 1–8 en 0, ítem 9 en 1 y dificultad
en 0; guardar; comprobar señal en el tablero antes del envío; completar SWLS con
1,2,3,4,5; enviar; revisar PHQ-9=1 y SWLS=15; registrar observaciones y revisión de
la señal; marcar revisada. Un nuevo envío debe rechazarse. No enviar emails de prueba.

## Actualización de estabilización

Ejecutar `supabase-stabilize.sql` completo en SQL Editor, después de las otras
migraciones. No elimina datos. Valida cinco enteros entre 1 y 7, calcula el
puntaje en el servidor, envía en una transacción y bloquea reenvíos. Habilita
`review_evaluation` para el propietario. No volver a ejecutar la migración
de acceso antigua después de esta actualización.

Pruebas locales: `node --test evaluaciones/tests/workflow.test.cjs`.

Prueba manual posterior a la migración: crear paciente ficticio, copiar enlace,
responder 1, 2, 3, 4, 5 en incógnito, comprobar total 15 e ítems individuales,
marcar revisada y comprobar filtros y contadores. Reabrir el enlace: debe
rechazar nuevos envíos. Probar también pacientes homónimos.

En el recorrido anterior solo SWLS está habilitada. El enlace se muestra una vez al crearlo; después
puede regenerarse desde el detalle. Sin baremos o interpretación automática.
La versión lingüística requiere revisión profesional.

## Historial, observaciones y enlaces

Edición: Pacientes → abrir ficha → Editar paciente. Conserva el identificador y
las evaluaciones. Nombre, email y nota privada son editables. No requiere una
migración adicional: utiliza los permisos por propietario de la tabla patients.

«Abrir en Gmail» abre Gmail web en otra pestaña con destinatario y mensaje
preparados. El profesional elige su cuenta y presiona Enviar. No es envío
automático mediante API y no solicita acceso a la cuenta de Google.
Los botones de copia, guardado y revisión presentan avisos de éxito o error.

Ejecutar `supabase-management.sql` como cuarta migración, después de
`supabase-stabilize.sql`. Agrega observaciones privadas, fechas de revisión,
guardado de observaciones y rotación de enlaces con permisos por propietario.
No elimina registros. Las funciones del paciente no exponen las observaciones.

Desde Pacientes se abre el historial, y desde cada evaluación se pueden guardar
observaciones. Marcar revisada guarda primero las observaciones pendientes.
Regenerar un enlace invalida el anterior y solo se permite antes del envío.

La aplicación no envía emails automáticamente: «Abrir borrador de correo»
abre un `mailto` en el cliente del profesional, quien revisa y envía el mensaje.
El destinatario se precarga con el email guardado, pero puede corregirse para
ese borrador. Cambiarlo no modifica la ficha del paciente. No se configura SMTP
ni se almacena ninguna clave secreta en el frontend.

Prueba posterior a la cuarta migración: abrir historial de un paciente, guardar
observaciones y reabrir para confirmar persistencia; revisar y comprobar fecha;
en otra evaluación pendiente regenerar enlace y comprobar que el antiguo falla
y el nuevo permite acceder. Abrir el borrador de email y verificar destinatario
y enlace (no se envían correos durante las pruebas automatizadas).

## Instalación inicial

1. Crear un proyecto privado en Supabase.
2. Ejecutar `supabase-schema.sql` en el SQL Editor.
3. Ejecutar `supabase-patient-access.sql` en el SQL Editor.
4. Configurar las variables públicas del proyecto.
5. Conectar la interfaz con autenticación y consultas reales.
6. Publicar esta carpeta en `fernandotonini.com.ar/evaluaciones/`.

No guardar credenciales dentro de este repositorio. La clave pública de Supabase puede exponerse en el frontend; la clave `service_role` nunca debe enviarse al navegador.
