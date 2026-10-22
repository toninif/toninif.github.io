# Identificar y comprender emociones

Aplicación estática en `herramientas/identificar-emociones/`. Implementación local para revisión; sin publicación ni push.

- [Revisión teórica integral](revision-teorica.md): los tres PDF, localizadores, acuerdos, diferencias y decisiones.
- [Especificaciones de origen](especificaciones.md): versión 0.9, conservada sin reescribir su historia de insumos pendientes. Esa incorporación se resuelve en la revisión teórica.
- [Verificación](verificacion.md): comandos, resultados y límites de las pruebas.
- `build-bank.py`: fuente de autoría reproducible de JSON e ilustraciones. No requiere paquetes Python externos.

## Ejecutar localmente

Desde la raíz del repositorio:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8765/herramientas/identificar-emociones/`. Se necesita HTTP: los módulos y `fetch` no prometen funcionar abriendo `index.html` con doble clic.

La aplicación usa HTML, CSS, JavaScript modular y recursos locales; no necesita compilación, cuentas ni backend. `js/app.js` presenta las vistas; `state.js` controla transiciones; `sampler.js` construye cuotas antes de barajar; `scoring.js` calcula resultados puros; `storage.js` aísla el guardado opcional; `export.js` genera archivos; `content-loader.js` valida bancos y fuentes.

## Diseño

Se conserva la familia visual de las herramientas existentes: crema `#f6f5f0`, superficie `#fffefa`, texto `#252e2b`, texto secundario `#535e57`, verde `#426142` y verde suave `#e7eddf`. Títulos Georgia y cuerpo Segoe UI/sistema, sin fuentes remotas. El tema oscuro modifica sólo la interfaz: la imagen y su fondo mantienen sus valores.

La estructura dispone tres entradas de actividad, una preparación breve, estímulo y respuestas en columnas de escritorio, devolución voluntaria y resumen. En móvil se apila en orden de lectura. La cara es el elemento principal de la actividad visual; las categorías no tienen colores que anticipen la clave. Los diagramas del modelo son texto estructurado, no capturas del material.

## Contenidos y revisión

El manifiesto y los bancos comparten `schemaVersion`, `contentVersion`, fecha y autoría. Toda esta entrega permanece `draft`; el canal `demo` habilita su inspección local sin afirmar una aprobación docente. El validador rechaza borradores si se cambia a canal `production`. Cambiar una etiqueta de estado no reemplaza revisión ni pilotaje.

Para editar una ficha o un caso:

1. Cambiar su texto en `build-bank.py`, conservando IDs si el significado de la tarea se mantiene.
2. Agregar o ajustar `sourceRefs` con `sourceId`, página PDF, página impresa, sección e interpretación. Nunca inventar una fecha o página desconocida.
3. Aumentar `VERSION` al modificar contenido que afecte una respuesta, pista o interpretación. Actualizar la fecha y la nota editorial.
4. Ejecutar `python docs-source/identificar-emociones/build-bank.py` y las pruebas de lógica. Revisar visualmente cualquier ilustración cambiada.
5. Revisar la clave, los distractores y la explicación docente antes de aprobar el nuevo registro.

Para agregar un rostro, registrar identidad, condición, recurso con nombre opaco, dimensiones, descripción de movimientos, clase de estímulo, conjunto, licencia concreta y estado. El MVP actual admite deliberadamente sólo ilustraciones SVG originales: incorporar fotografías exige ampliar y probar el contrato de rutas/tipo de `content-loader.js`, documentar permisos, revisar pistas y separar identidades por conjunto. Los consentimientos con datos personales se mantienen fuera del repositorio público.

Una imagen por emoción no justifica un banco de comprobación. La configuración actual deshabilita comprobación en ambos módulos faciales. Para habilitarla, se requieren nuevos conjuntos, cuotas revisadas, separación de identidades, revisión de dos personas y pruebas; no basta con habilitar un botón.

## Guardado y exportación

La sesión vive en memoria por defecto. Si se elige guardar, usa solamente `ft-emociones:v1` en este navegador. Borrar progreso no borra las claves de otras herramientas. Un fallo de cuota o acceso al almacenamiento mantiene la actividad en memoria. La versión incompatible se ofrece para exportar o borrar; no se recalifica silenciosamente.

El JSON conserva configuración, semilla, forma, exposición previa, orden, intentos, ayudas realmente vistas, comentarios y tiempos activos. La exportación JSON incluye el mismo resumen calculado para la interfaz. El CSV usa una fila por intento; los ítems sin intento conservan una fila de estado. Incluye versión y modalidad, escapa comillas y neutraliza prefijos interpretables como fórmulas. No contiene nombres ni identificadores personales.

El tiempo se cuenta desde la disponibilidad del estímulo. Pausa y pestaña oculta lo detienen; recargar no suma el tiempo fuera de la actividad. Es descriptivo, sin precisión experimental prometida. Las respuestas confirmadas no se modifican; los errores previos del módulo de pistas se conservan.

## Integración y render

Enlaces fuente en `docencia/index.qmd` y `presentaciones/emocion/index.qmd`. El recurso ya está cubierto por `project.resources: herramientas/**` en `_quarto.yml`, por lo que no requiere una segunda regla.

```powershell
quarto render docencia/index.qmd
quarto render presentaciones/emocion/index.qmd
```

Estos comandos regeneran `docs/`; no se edita manualmente. Antes de una futura publicación se deberá revisar la aprobación del contenido y verificar que la salida no contenga insumos, documentación de autoría ni pruebas. El workflow publica al hacer push a `main`: esta entrega no ejecuta ese paso.
