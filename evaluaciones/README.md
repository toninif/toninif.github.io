# Evaluaciones

Aplicación en `fernandotonini.com.ar/evaluaciones/`.

## Estado actual

- Interfaz navegable para profesional y paciente.
- Pacientes y evaluaciones guardados en Supabase.
- Esquema inicial de base de datos en `supabase-schema.sql`.
- Funciones de acceso privado para pacientes en `supabase-patient-access.sql`.
- Login, respuestas por ítem, puntaje y revisión profesional. Sin envío de correos.

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

Solo SWLS está habilitada. El enlace se muestra una vez al crearlo; después
puede regenerarse desde el detalle. Sin baremos o interpretación automática.
La versión lingüística requiere revisión profesional.

## Historial, observaciones y enlaces

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
