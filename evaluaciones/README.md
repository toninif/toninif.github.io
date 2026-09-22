# Evaluaciones

Prototipo y base del MVP para `evaluaciones.fernandotonini.com.ar`.

## Estado actual

- Interfaz navegable para profesional y paciente.
- Datos ficticios para probar el flujo.
- Esquema inicial de base de datos en `supabase-schema.sql`.
- Funciones de acceso privado para pacientes en `supabase-patient-access.sql`.
- Todavía no hay login, persistencia remota ni envío de correos.

## Próximo paso

1. Crear un proyecto privado en Supabase.
2. Ejecutar `supabase-schema.sql` en el SQL Editor.
3. Ejecutar `supabase-patient-access.sql` en el SQL Editor.
4. Configurar las variables públicas del proyecto.
5. Conectar la interfaz con autenticación y consultas reales.
6. Publicar esta carpeta en `fernandotonini.com.ar/evaluaciones/`.

No guardar credenciales dentro de este repositorio. La clave pública de Supabase puede exponerse en el frontend; la clave `service_role` nunca debe enviarse al navegador.
