"""Autoría reproducible del banco de demostración. Sin dependencias externas.

No cambia el estado editorial ni acredita validación docente o psicológica.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / 'herramientas/identificar-emociones'
VERSION = '0.1.0-demo'
META = dict(schemaVersion='1.0', contentVersion=VERSION, reviewDate='2026-10-22',
            authorship='Redacción e ilustraciones preparadas con Codex para revisión de Fernando Tonini',
            reviewStatus='draft', editorialNote='Lectura de fuentes completada; revisión docente y pilotaje pendientes.')

def write(name, items=None, **kwargs):
    dest = APP / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps({**META, **kwargs, **({'items': items} if items is not None else {})}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def ref(source, page, section, interpretation):
    return dict(sourceId=source, pdfPage=page, printedPage=page if source == 'pdf_01' else page+2 if source == 'pdf_02' else page+294,
                section=section, interpretation=interpretation)

references = [
    dict(id='pdf_01', title='El estudio de la emoción desde una perspectiva cognitiva', author='Universidad de Palermo (institución identificada; autoría personal no indicada)', year=None, pageCount=11,
         version='222Q_v1-0 (nombre de archivo)', originalFilename='0512_APU_EstudioDeLaEmociónDesdePerspectivaCognitiva_222Q_v1-0.pdf',
         note='11 páginas de texto. El archivo se creó en 2022 según metadatos; no se usa ese dato como fecha bibliográfica. Numeración impresa 1–11. PDF conservado fuera de los recursos públicos.'),
    dict(id='pdf_02', title='Proceso emocional en las emociones primarias', author='Universidad de Palermo (identidad institucional visible; autoría personal no indicada)', year=None, pageCount=14,
         version='222Q_v1-0_removed (nombre de archivo)', originalFilename='0512_APU_ProcesoEmocionalEnEmocionesPrimarias_222Q_v1-0_removed.pdf',
         note='Fragmento de 14 páginas; numeración impresa 3–16. Sin portada ni año bibliográfico visible. Se revisaron tablas y ejemplos faciales; las fotografías no se redistribuyen.'),
    dict(id='pdf_03', title='La emoción', author='Fernández-Abascal, Martín Díaz y Domínguez Sánchez (atribución según la bibliografía de pdf_01)', year=2001, pageCount=43,
         version='Fragmento escaneado de Procesos psicológicos, pp. 295–337', originalFilename='cap9_laemocion.pdf',
         note='43 páginas escaneadas leídas mediante OCR en español y comprobación visual de esquemas, cuadros y pasajes relevantes. La primera página corresponde a la p. 295 por continuidad; no incluye portada editorial. Año y atribución proceden de la referencia de pdf_01, p. 11.')
]
write('data/references.json', references)

# Definición, desencadenantes, evaluación, cuerpo, experiencia, expresión, acción, función,
# confusión, ejemplo y contraejemplo: paráfrasis de trabajo, no citas textuales.
rows = [
('alegria','Alegría','Alegría; felicidad no es un sinónimo exacto',7,27,
 'Respuesta agradable ante un resultado valorado favorablemente, como alcanzar una meta.',
 'Logros, reencuentros deseados o la continuidad de algo que se disfruta.',
 'Lo sucedido ayuda a conseguir algo importante y se considera favorable. No exige que el resultado sea inesperado.',
 'Pueden cambiar la respiración, el pulso y la tensión muscular; esos cambios también aparecen en otras emociones.',
 'Bienestar, disfrute o ganas de compartir lo ocurrido.',
 'En el patrón ilustrado se elevan las comisuras y las mejillas y se estrecha la abertura de los ojos.',
 'Acercarse, compartir la experiencia o sostener una actividad satisfactoria.',
 'Puede favorecer el disfrute, la exploración y los vínculos sociales.',
 'Una sonrisa de cortesía no demuestra disfrute. La felicidad global que describe el capítulo no equivale a cada episodio breve de alegría.',
 'Después de preparar un proyecto, recibís la confirmación de que salió como esperabas y querés celebrarlo.',
 'Sonreís para una foto por pedido de otra persona: la forma del gesto no informa por sí sola cómo te sentís.'),
('tristeza','Tristeza','Tristeza',3,22,
 'Respuesta ante una pérdida, separación o resultado desfavorable que ya ocurrió y tiene valor personal.',
 'Finales de etapas significativas, separaciones, pérdidas o proyectos que no podrán continuar.',
 'Se destaca lo perdido y la dificultad para revertirlo. En estos casos la urgencia por actuar suele ser menor que ante una amenaza inmediata.',
 'Puede haber cambios en el pulso y la tensión muscular junto con menor energía percibida. No existe aquí una prueba corporal de tristeza.',
 'Desánimo, pena o pérdida de entusiasmo.',
 'En el esquema, las comisuras descienden y los extremos internos de las cejas se elevan.',
 'Reducir el ritmo, revisar lo ocurrido y buscar compañía o apoyo.',
 'Puede facilitar la reorganización tras una pérdida y comunicar necesidad de ayuda.',
 'La amenaza de una pérdida y la pérdida ya consumada no aportan el mismo significado. Puede haber tristeza aun cuando alguien sea responsable.',
 'Una actividad que valorabas termina definitivamente y necesitás tiempo para procesar su ausencia.',
 'Te preocupa que una actividad pueda suspenderse, pero todavía no pasó: faltan datos para atribuir tristeza.'),
('miedo','Miedo','Miedo',2,16,
 'Respuesta de protección cuando una situación se evalúa como amenazante y difícil de afrontar.',
 'Peligro de daño físico o psicológico y señales que se han asociado con una amenaza.',
 'Importa la amenaza percibida y la sensación de no disponer de recursos suficientes para manejarla.',
 'Pueden aumentar el pulso, la respiración y la tensión muscular. La activación aislada es inespecífica.',
 'Tensión, preocupación por la seguridad o sensación de poco control.',
 'En el dibujo, las cejas se elevan y acercan, los ojos se abren y la boca se estira horizontalmente.',
 'Ponerse a resguardo, alejarse o quedarse inmóvil; también pueden buscarse otras formas de protección.',
 'Movilizar recursos para protegerse del peligro percibido.',
 'La sorpresa aporta novedad; para atribuir miedo hacen falta indicios de amenaza. La inmovilidad no prueba una emoción única.',
 'Un objeto pesado cae cerca y buscás apartarte porque podría lastimarte.',
 'Encontrás un aula reorganizada y mirás para entender qué cambió, sin percibir peligro.'),
('ira','Ira / enojo','Ira; enojo',4,19,
 'Respuesta ante un obstáculo, agravio o vulneración que se considera relevante y frente a la que se quiere intervenir.',
 'Tratos injustos, engaños, invasión de derechos o bloqueo de metas importantes.',
 'La situación se interpreta como un obstáculo o una injusticia; en los casos propuestos se percibe capacidad para reclamar un cambio.',
 'Pueden aumentar la tensión muscular, el pulso y la respiración. Estos cambios no distinguen por sí solos enojo de miedo.',
 'Irritación, sensación de fuerza o impulso a actuar.',
 'En el dibujo las cejas bajan y se acercan; los párpados y la boca muestran tensión.',
 'Reclamar, defenderse o intentar remover el obstáculo. Sentir el impulso no obliga a ejecutarlo.',
 'Puede organizar la defensa de límites y la búsqueda de cambios en una situación.',
 'Enojo no equivale a agresión: puede expresarse con un reclamo cuidadoso. Tampoco toda agresión implica enojo.',
 'Alguien se atribuye tu trabajo; lo considerás injusto y preparás un pedido de rectificación.',
 'Un proyecto se pierde de forma irreversible y te centrás en su ausencia, sin impulso de confrontar.'),
('asco','Asco','Asco; repulsión',5,25,
 'Respuesta de repulsión y rechazo hacia un estímulo considerado desagradable o potencialmente contaminante.',
 'Olores, sabores, texturas o contactos que se interpretan como deteriorados o contaminantes.',
 'El estímulo se evalúa como muy desagradable y se busca evitar el contacto o la ingestión.',
 'Pueden aparecer sensaciones gástricas o náuseas, además de cambios generales de activación. No son una condición obligatoria.',
 'Repulsión y necesidad de apartar el estímulo.',
 'En esta ilustración se marcan arrugas en la nariz y se eleva el labio superior.',
 'Apartarse, retirar el objeto o evitar ingerirlo.',
 'Puede favorecer conductas protectoras frente al contacto con sustancias consideradas dañinas.',
 'No todo desagrado es asco. Un juicio moral negativo no demuestra repulsión ni justifica desvalorizar a una persona.',
 'Notás señales de descomposición en una comida y la apartás antes de probarla.',
 'No te gusta el horario de una clase, pero no hay repulsión ni rechazo al contacto.'),
('sorpresa','Sorpresa','Sorpresa',6,29,
 'Respuesta breve de orientación ante un cambio que rompe una expectativa.',
 'Acontecimientos inesperados, cambios bruscos o interrupciones de una actividad.',
 'Lo central es que lo ocurrido no se esperaba y requiere actualizar la información disponible.',
 'Puede interrumpirse brevemente la respiración y cambiar el tono muscular. Las fuentes discrepan sobre la dirección del pulso; no se usa como clave.',
 'Desconcierto o sensación momentánea de no saber qué pasó.',
 'En el esquema, las cejas se elevan en arco, los ojos se abren y la mandíbula desciende.',
 'Detenerse, mirar, explorar y obtener información.',
 'Reorientar la atención para comprender la novedad y preparar una respuesta.',
 'Puede preceder a una emoción agradable o desagradable. Ojos abiertos y boca abierta también pueden aparecer en otros patrones.',
 'Entrás a un lugar conocido, encontrás una disposición inesperada y te detenés para comprender el cambio.',
 'Ves un peligro que esperabas y te protegés: la amenaza puede ser central aunque no haya novedad.')
]
emotions = []
for r in rows:
    id_, label, synonyms, page, chapter, *values = r
    fields = ['definition','triggers','appraisal','body','subjective','expression','actionTendency','function','confusions','example','counterexample']
    emotions.append(dict(id=id_, label=label, shortLabel='Enojo' if id_ == 'ira' else label, synonyms=synonyms,
                         **dict(zip(fields,values)), reviewStatus='draft',
                         sourceRefs=[ref('pdf_02',page,label,'Síntesis de la ficha y contraste con el capítulo; asociaciones posibles, no criterios necesarios.'),
                                     ref('pdf_03',chapter,'4.1. Emociones primarias','Base conceptual de la ficha. Los ejemplos y contraejemplos son originales.'),
                                     ref('pdf_02',12,'Expresión facial','Patrones ilustrativos, sin inferencia directa sobre experiencia interna.')]))
write('data/emotions.json', emotions, guide={
 'modelId':'fernandez_abascal_2001',
 'intro':'En el modelo cognitivo de estos materiales, una situación significativa se evalúa, se produce activación y el aprendizaje y la cultura modulan sus manifestaciones. No es una cronología universal de todas las teorías.',
 'steps':[
  {'title':'Situación significativa','text':'Puede ser externa, como recibir una noticia, o interna, como recordar una experiencia.'},
  {'title':'Evaluación valorativa','text':'Distingue novedad y agrado, y la valoración del significado: metas, atribución, control, capacidad de afrontar y normas.'},
  {'title':'Activación emocional','text':'Incluye experiencia subjetiva, expresión corporal, soporte fisiológico y afrontamiento. Un cambio corporal aislado no identifica una emoción.'},
  {'title':'Aprendizaje y cultura','text':'Pueden modular qué se expresa, cómo se informa lo vivido y qué conducta se realiza. Una cara neutral no prueba ausencia de emoción.'}],
 'limits':'Situación, experiencia, expresión y conducta aportan datos diferentes. Las seis categorías son un recorte docente. Las claves describen la interpretación mejor sustentada en un caso construido, no lo que necesariamente sentiría una persona real.',
 'sourceRefs':[ref('pdf_01',3,'El proceso emocional','Secuencia del modelo del apunte.'),ref('pdf_03',6,'3.1. Evaluación valorativa','Dimensiones del significado y del afrontamiento.'),ref('pdf_03',12,'3.3. Aprendizaje y cultura','La expresión observable puede diferir de la experiencia.')]
}, glossary=[
 {'term':'Evaluación (appraisal)','text':'Significado afectivo y personal que adquiere una situación. No implica necesariamente reflexión consciente.'},
 {'term':'Agrado intrínseco','text':'Valoración agradable o desagradable del estímulo. No equivale a utilidad moral ni a que una emoción sea buena o mala.'},
 {'term':'Conducente / obstruyente','text':'La situación facilita u obstaculiza metas o necesidades de la persona.'},
 {'term':'Afrontamiento','text':'Esfuerzos y recursos cognitivos o conductuales para manejar demandas. En las fichas también se describen tendencias a la acción, que pueden diferir de la conducta realizada.'},
 {'term':'Soporte fisiológico (arousal)','text':'Cambios en la actividad del organismo que sostienen la respuesta. No constituyen por sí solos una etiqueta emocional.'},
 {'term':'Neutral','text':'Condición de un estímulo sin el patrón expresivo objetivo; no es una séptima emoción primaria.'},
 {'term':'Información insuficiente','text':'Faltan datos discriminantes para sostener una atribución única. Es una respuesta sobre la evidencia disponible.'}])

write('licenses/image-credits.json', [dict(id='original-svg-v1', creator='Ilustraciones originales preparadas con Codex para este proyecto',
    license='Material original del proyecto; no incorpora fotografías, trazados ni figuras de los PDF ni de bancos externos.',
    publicWebUseVerified=True, consentRequired=False, note='Identidades ficticias esquemáticas. Permiso de uso del recurso original no equivale a validación psicológica.')])

# Los rasgos son geometría vectorial original. No se copian figuras de las fuentes.
conditions = ['alegria','tristeza','miedo','ira','asco','sorpresa','neutral']
movements = {
 'alegria':'Las comisuras suben, las mejillas se elevan y la abertura de los ojos se estrecha.',
 'tristeza':'Los extremos internos de las cejas se elevan y las comisuras de la boca bajan.',
 'miedo':'Las cejas están elevadas y próximas entre sí; los ojos están muy abiertos y la boca se estira hacia los lados.',
 'ira':'Las cejas descienden hacia el centro, los ojos se estrechan y los labios se presionan.',
 'asco':'La nariz muestra pliegues, el labio superior sube y la boca queda asimétrica.',
 'sorpresa':'Las cejas forman arcos elevados, los ojos se abren y la boca forma una abertura redondeada.',
 'neutral':'Las cejas quedan a una altura intermedia, los ojos tienen abertura moderada y la boca se mantiene horizontal.'}
regions = {'alegria':'mejillas y boca','tristeza':'cejas y comisuras','miedo':'cejas y boca','ira':'entrecejo y labios','asco':'nariz y labio superior','sorpresa':'cejas y mandíbula'}
contrasts = {
 'alegria':'En este dibujo las comisuras suben; en el patrón de tristeza del ejemplo guiado descienden.',
 'tristeza':'Compará las comisuras descendentes con las elevadas del patrón de alegría.',
 'miedo':'En el ejemplo de sorpresa la boca es redondeada; acá está estirada hacia los lados y las cejas se acercan.',
 'ira':'A diferencia del patrón de miedo, las cejas bajan hacia el centro y la boca permanece cerrada y presionada.',
 'asco':'La tensión de labios también aparece en el enojo; acá se añaden pliegues en la nariz y elevación del labio superior.',
 'sorpresa':'En el ejemplo de miedo la boca se estira hacia los lados; acá la abertura es redondeada y las cejas no se juntan.'}
contexts = {'alegria':'Acaba de alcanzar una meta que deseaba y quiere compartir el resultado.', 'tristeza':'Una actividad que valoraba terminó para siempre y se centra en su pérdida.',
 'miedo':'Algo podría lastimarle de inmediato y busca ponerse a resguardo.', 'ira':'Considera injusto un trato recibido y quiere reclamar que lo cambien.',
 'asco':'Detecta un olor de descomposición y quiere apartar el objeto.', 'sorpresa':'Encontró un cambio inesperado y se detiene para comprenderlo.'}

def face_svg(emotion, identity):
    skin, hair = ('#e8c7a9','#48413a') if identity == 1 else ('#bd9277','#363937')
    eyebrows = {
      'neutral':'M153 203 Q177 196 201 202 M279 202 Q303 196 327 203',
      'alegria':'M153 199 Q177 188 201 198 M279 198 Q303 188 327 199',
      'tristeza':'M153 210 Q177 200 201 182 M279 182 Q303 200 327 210',
      'miedo':'M153 182 Q180 166 210 180 M270 180 Q300 166 327 182',
      'ira':'M151 197 L205 216 M275 216 L329 197',
      'asco':'M153 198 Q180 194 207 209 M273 209 Q300 194 327 198',
      'sorpresa':'M150 182 Q177 155 204 182 M276 182 Q303 155 330 182'}[emotion]
    opening = 20 if emotion in ('miedo','sorpresa') else 6 if emotion in ('alegria','ira','asco') else 12
    eyes = ''.join(f'<path d="M{x-27} 234 Q{x} {234-opening*1.3} {x+27} 234 Q{x} {234+opening} {x-27} 234Z" fill="#fffdf8"/><circle cx="{x}" cy="234" r="7" fill="#363937" stroke="none"/>' for x in [177,303])
    mouths = {
      'neutral':'<path d="M195 330 Q240 333 285 330"/>',
      'alegria':'<path d="M189 319 Q240 346 291 319 Q275 373 240 369 Q205 373 189 319Z" fill="#694e44"/><path d="M197 326 Q240 345 283 326 L278 341 Q240 353 202 341Z" fill="#fffdf8" stroke="none"/><path d="M141 260 Q152 246 164 254 M316 254 Q328 246 339 260"/>',
      'tristeza':'<path d="M191 348 Q240 314 289 348"/><path d="M198 351 Q240 330 282 351" stroke-width="3"/>',
      'miedo':'<path d="M185 326 Q240 312 295 326 L293 349 Q240 357 187 349Z" fill="#694e44"/><path d="M191 328 Q240 320 289 328" stroke="#fffdf8" stroke-width="7"/>',
      'ira':'<path d="M192 334 L288 334 M198 341 L282 341"/><path d="M227 204 L233 215 M247 204 L241 215" stroke-width="3"/>',
      'asco':'<path d="M197 333 Q211 307 232 323 Q253 331 284 339 L283 350 Q240 349 197 343Z" fill="#694e44"/><path d="M211 326 L226 326" stroke="#fffdf8" stroke-width="7"/><path d="M215 286 Q222 278 230 285 M250 285 Q258 278 265 286 M217 298 Q224 290 231 297 M249 297 Q256 290 263 298" stroke-width="3"/>',
      'sorpresa':'<ellipse cx="240" cy="345" rx="25" ry="34" fill="#694e44"/>'}[emotion]
    hairpath = '<path d="M121 195 Q103 108 173 87 Q253 42 324 103 Q363 136 359 195 L341 154 Q291 156 267 115 Q203 166 138 155Z"/>' if identity == 1 else '<path d="M122 190 Q112 95 190 79 Q268 48 329 106 Q370 151 357 195 L341 153 Q311 118 272 123 Q208 125 139 159Z"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 480 480">
<rect width="480" height="480" fill="#eeeae1"/>
<path d="M76 480 Q89 418 186 410 L294 410 Q391 418 404 480" fill="#58695e"/>
<path d="M201 375 L201 421 Q240 447 279 421 L279 375" fill="{skin}"/>
<g fill="{skin}" stroke="#655348" stroke-width="3"><ellipse cx="126" cy="263" rx="19" ry="33"/><ellipse cx="354" cy="263" rx="19" ry="33"/><path d="M126 204 Q126 112 240 112 Q354 112 354 204 L345 309 Q326 394 240 413 Q154 394 135 309Z"/></g>
<g fill="{hair}">{hairpath}</g>
<g stroke="#423b37" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="{eyebrows}" stroke-width="8"/>{eyes}<path d="M237 251 L225 293 Q240 303 255 293" stroke-width="3"/>{mouths}</g></svg>'''

faces=[]
for identity in (1,2):
    for j, emotion in enumerate(conditions):
        id_=f'f_{(identity-1)*7+j+1:04d}'
        path=f'assets/faces/{id_}.svg'
        dest=APP/path; dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(face_svg(emotion,identity),encoding='utf-8')
        faces.append(dict(id=id_,identityId=f'esquema_{identity:02}',path=path,depictedExpression=emotion,stimulusType='original_illustration',split='practice',width=640,height=640,
          altNeutral='Rostro ilustrado del ejercicio',movementDescription=movements[emotion],licenseId='original-svg-v1',publicWebUseVerified=True,reviewStatus='draft',recognitionPilot=None,
          sourceRefs=[ref('pdf_02',12,'Expresión facial','Rasgos utilizados para construir un esquema original; no se copia la fotografía.'),ref('pdf_03',12,'Aprendizaje y cultura','La expresión no determina la experiencia interna.')]))
write('data/faces.json',faces)

presence=[]
negative_conditions=['neutral','alegria','sorpresa','tristeza','neutral','miedo']
for i,e in enumerate(conditions[:6]):
    for positive in (True,False):
        expr=e if positive else negative_conditions[i]
        ident=1 if positive or (i==0) else 2
        face=next(f for f in faces if f['identityId']==f'esquema_{ident:02}' and f['depictedExpression']==expr)
        target=next(x for x in emotions if x['id']==e)
        comparison='' if positive else f' El patrón objetivo era {target["shortLabel"].lower()}: {target["expression"]}'
        presence.append(dict(id=f'pres_{i+1:02}_{1 if positive else 2}',faceId=face['id'],targetEmotion=e,expectedResponse='yes' if positive else 'no',negativeType=None if positive else 'neutral' if expr=='neutral' else 'other',
           explanation=f'En este esquema se representa {"una configuración neutral" if expr=="neutral" else next(x[1] for x in rows if x[0]==expr).lower()}. {movements[expr]}{comparison} La respuesta se refiere al dibujo; no permite saber qué siente una persona.',
           split='practice',reviewStatus='draft',sourceRefs=face['sourceRefs']))
write('data/presence-items.json',presence)

hints=[]
for face in faces:
    e=face['depictedExpression']
    if e=='neutral':continue
    visual=[f'Prestá atención a la zona de {regions[e]}.', movements[e],contrasts[e], contexts[e]]
    reading_focus={
      'alegria':'La combinación descrita corresponde a un patrón de sonrisa. Identificar ese patrón no prueba una experiencia agradable interna.',
      'tristeza':'Los extremos internos de las cejas y las comisuras se desplazan en direcciones opuestas. Compará esta relación con una elevación conjunta de mejillas y comisuras.',
      'miedo':'La abertura de los ojos también aparece en otra categoría. En esta comparación, el estiramiento horizontal de la boca aporta más información que los ojos por sí solos.',
      'ira':'En el contraste no hay abertura redondeada de la mandíbula ni pliegues nasales: la tensión se concentra en el entrecejo y el cierre de la boca.',
      'asco':'Una boca tensa podría encajar en más de una opción. La relación entre el pliegue nasal y el movimiento del labio es el dato discriminante de esta descripción.',
      'sorpresa':'Compará un patrón de tensión y aproximación de cejas con uno de apertura en arco y mandíbula descendida. La descripción del ejercicio corresponde al segundo.'}
    descriptive=[f'Buscá una combinación de movimientos, no una palabra aislada: revisá cómo se relacionan {regions[e]}.',
                 contrasts[e], reading_focus[e], contexts[e]]
    hints.append(dict(id=f'hint_{face["id"][2:]}',faceId=face['id'],expectedEmotion=e,
       hints=[dict(level=i+1,kind='contextual' if i==3 else 'facial',text=text) for i,text in enumerate(visual)],
       descriptiveHints=[dict(level=i+1,kind='contextual' if i==3 else 'descriptive',text=text) for i,text in enumerate(descriptive)],
       explanation=f'La clave del esquema es {next(x[1] for x in rows if x[0]==e).lower()}. {movements[e]} {contrasts[e]}',split='practice',reviewStatus='draft',sourceRefs=face['sourceRefs']))
write('data/hint-items.json',hints)

# Cuatro relatos originales por emoción: dos de práctica y dos de comprobación demo.
scenarios={
 'alegria':[
 ('Después de preparar una exposición, Alex recibe la confirmación de que el trabajo fue aceptado.','Lo interpreta como la realización de una meta importante que venía buscando.','Nota energía y una sensación agradable.','Quiere compartir la noticia y seguir trabajando con su grupo.'),
 ('Tras varios ensayos, un grupo consigue interpretar una pieza completa.','El resultado coincide con lo que se propusieron y valoran haberlo conseguido juntos.','Se sienten con vigor y disfrutan el momento.','Quieren repetir la experiencia y festejar el logro.'),
 ('La planta que Jo cuidó durante meses finalmente florece.','Considera que el esfuerzo dio el resultado que deseaba.','Percibe bienestar y una respiración más animada.','Quiere mostrarla y continuar cuidándola.'),
 ('Un equipo termina de restaurar el espacio comunitario que se había propuesto recuperar.','Dani piensa que alcanzaron algo valioso y que el resultado beneficia al grupo.','Nota una sensación agradable y energía disponible.','Quiere encontrarse con los demás y disfrutar del espacio.')],
 'tristeza':[
 ('Una biblioteca barrial muy importante para Sol cierra definitivamente.','Se centra en la pérdida de un lugar de encuentro que ya no podrá recuperar.','Se siente con poca energía y le cuesta sostener el ritmo habitual.','Quiere bajar el ritmo y conversar con alguien cercano.'),
 ('Después de muchos años, termina de forma definitiva el taller al que asistía Cris.','Valora todo lo que ese espacio significaba y reconoce que esa etapa se terminó.','Siente pesadez y poco entusiasmo.','Quiere revisar recuerdos y buscar compañía.'),
 ('Un archivo de grabaciones familiares se perdió sin posibilidad de recuperación.','Luz piensa en el valor de lo que desapareció y en que no puede reconstruirlo.','Nota decaimiento y menor energía.','Necesita detenerse y compartir la pérdida con su familia.'),
 ('La agrupación con la que Sam compartía cada semana se disuelve definitivamente.','Lo central para Sam es la ausencia de una convivencia que valoraba.','Siente un descenso de energía y dificultad para interesarse en otras actividades.','Quiere tener un tiempo de pausa y hablar con una amistad.')],
 'miedo':[
 ('Un estante empieza a caer muy cerca de Jo.','Percibe que puede lastimarse y que tiene muy poco margen para controlar la caída.','Nota tensión corporal y el pulso acelerado.','Busca ponerse a resguardo de inmediato.'),
 ('En una caminata, un perro se acerca mostrando los dientes y bloquea el paso.','Alex cree que podría recibir una mordida y no sabe cómo manejar la situación.','Nota respiración rápida y tensión en las piernas.','Quiere aumentar la distancia y encontrar protección.'),
 ('Una pieza pesada se desprende del techo mientras Cris está debajo.','Considera que el impacto puede dañarle y que no puede detener el objeto.','Se tensa y focaliza la atención en la caída.','Quiere apartarse y cubrirse.'),
 ('Al cruzar, Dani ve un vehículo que se aproxima sin frenar.','Percibe un riesgo inmediato de atropello y poca capacidad para modificar la trayectoria.','Nota tensión muscular y una fuerte activación.','Busca retroceder hasta un lugar protegido.')],
 'ira':[
 ('Alguien presenta como propio un trabajo realizado por Sam.','Sam considera que se vulneró su autoría y que puede exigir una rectificación.','Siente tensión y un impulso intenso de intervenir.','Quiere reclamar que se reconozca su aporte; decide preparar un mensaje cuidadoso.'),
 ('Una persona se adelanta deliberadamente en una fila y desplaza a Luz.','Luz lo considera un trato injusto y cree que puede hacer respetar el turno.','Siente energía y tensión en el cuerpo.','Quiere pedir que se restablezca el orden de llegada.'),
 ('Un grupo cambia un acuerdo para excluir a Jo después de que realizó su parte del trabajo.','Jo atribuye la decisión a un trato deliberadamente injusto y cree que puede cuestionarlo.','Nota tensión y un impulso de actuar.','Quiere pedir una explicación y que se respete lo acordado.'),
 ('Se publica un reconocimiento colectivo omitiendo intencionalmente el aporte de Alex.','Alex percibe una vulneración de sus derechos y considera posible corregirla.','Siente activación y atención focalizada en el agravio.','Quiere presentar los antecedentes y solicitar la corrección.')],
 'asco':[
 ('Al abrir un recipiente, Cris detecta olor a comida en descomposición.','Interpreta el contenido como repulsivo y no quiere que entre en contacto con su boca.','Nota malestar gástrico.','Quiere apartar el recipiente sin probar su contenido.'),
 ('Al levantar una fruta, Dani encuentra una zona blanda cubierta de moho.','La percibe como deteriorada y rechaza la posibilidad de ingerirla.','Siente una reacción de repulsión en el estómago.','Quiere dejarla a un lado y evitar el contacto.'),
 ('Sol acerca un vaso y percibe un olor rancio que proviene del líquido.','Considera que el contenido está deteriorado y le resulta repulsivo.','Nota una sensación gástrica desagradable.','Quiere retirar el vaso sin beber.'),
 ('Al abrir una bolsa olvidada, Sam ve restos viscosos y percibe olor de descomposición.','Evalúa el material como repulsivo y quiere evitar que toque su cuerpo.','Nota malestar en el estómago y un impulso de apartarse.','Busca cerrar la bolsa y retirar el material.')],
 'sorpresa':[
 ('Al entrar al aula habitual, Luz encuentra las mesas en una disposición completamente distinta.','No lo esperaba y todavía no sabe si el cambio le resulta favorable o desfavorable.','Se detiene y concentra la atención en el cambio.','Quiere mirar y preguntar qué pasó.'),
 ('Al iniciar una presentación conocida, aparece una pantalla que Jo nunca había visto.','El contenido rompe su expectativa; aún no identifica consecuencias agradables ni una amenaza.','Su actividad se interrumpe por un momento.','Quiere explorar la pantalla para entender el cambio.'),
 ('Alex abre una caja rotulada como vacía y encuentra una colección de objetos desconocidos.','No esperaba ningún contenido y necesita entender de dónde salió. Todavía no lo valora como bueno o malo.','Su atención se concentra de golpe en los objetos.','Quiere observarlos y obtener información.'),
 ('En una reunión rutinaria se anuncia un cambio de formato que nadie había anticipado.','Cris registra la ruptura de lo esperado antes de decidir qué consecuencias tendrá.','Se detiene brevemente y orienta toda su atención al anuncio.','Quiere escuchar la explicación y actualizar lo que esperaba.')]
}
process=[]
for e,cases in scenarios.items():
    emotion=next(x for x in emotions if x['id']==e)
    for i,case in enumerate(cases):
        components=dict(zip(['trigger','appraisal','body','actionTendency'],case))
        process.append(dict(id=f'proc_{e}_{i+1:02}',difficulty='initial' if i%2==0 else 'intermediate',theoreticalModelId='fernandez_abascal_2001',components=components,
          answerType='single',expectedAnswer=e,discriminatingComponent='appraisal',explanation=f'La interpretación mejor sustentada es {emotion["shortLabel"].lower()}. El dato central es el significado atribuido: {case[1]} La tendencia a actuar lo complementa; el cuerpo por sí solo no fija la clave.',
          contrast=emotion['confusions'],missingInformation='Para sostener otra interpretación habría que conocer un significado diferente para la persona o cambios en la situación que este relato no describe.',
          split='practice' if i<2 else 'check',reviewStatus='draft',sourceRefs=emotion['sourceRefs'][:2]))

insufficient=[
 ('Antes de entrar a una sala, una persona nota que su corazón late más rápido.',None,'Pulso acelerado.',None,'El pulso acelerado puede acompañar distintas experiencias y actividades. Falta saber qué significa entrar a la sala para esa persona.'),
 ('Una persona sonríe al saludar a un grupo.',None,'Se observa una sonrisa.',None,'Una sonrisa puede acompañar disfrute o cumplir una función social. Falta conocer la experiencia y el significado de la situación.'),
 ('Al recibir una noticia, alguien permanece inmóvil y no cambia su rostro.',None,'Rostro sin un patrón expresivo marcado.',None,'La neutralidad del rostro no demuestra ausencia de experiencia emocional. Faltan el significado de la noticia y el relato de la persona.'),
 ('Una persona sale rápido de un aula al terminar una conversación.',None,None,'Se aleja rápidamente.','Alejarse podría responder a amenaza, repulsión, un compromiso o varias razones. Faltan la evaluación y otros componentes del episodio.'),
 ('Al terminar una actividad, alguien tiene lágrimas en los ojos.',None,'Se observan lágrimas.',None,'Las lágrimas no establecen una clave única. Faltan el valor de la actividad y el significado de su final.'),
 ('Una persona se tensa y mira fijamente un objeto que cayó.',None,'Tensión muscular y atención dirigida al objeto.',None,'La activación y la atención no distinguen entre amenaza, novedad u otras interpretaciones. Falta la valoración del evento.')]
for i,(*case,explanation) in enumerate(insufficient):
    process.append(dict(id=f'proc_insuficiente_{i+1:02}',difficulty='advanced',theoreticalModelId='fernandez_abascal_2001',components=dict(zip(['trigger','appraisal','body','actionTendency'],case)),answerType='single',expectedAnswer='insufficient_information',discriminatingComponent='appraisal',explanation=explanation,
      contrast='Elegir una de las seis emociones agregaría una información sobre la experiencia que el relato no proporciona.',missingInformation='Habría que conocer qué significado tiene el episodio para la persona y cómo se relaciona con su experiencia y sus tendencias a actuar.',split='practice' if i<3 else 'check',reviewStatus='draft',
      sourceRefs=[ref('pdf_01',5,'Activación emocional','Una activación aislada no basta.'),ref('pdf_03',12,'Aprendizaje y cultura','Un gesto observable puede tener función social y no revelar la experiencia.')]))
write('data/process-items.json',process)
write('data/bank-manifest.json',channel='demo',modelId='fernandez_abascal_2001',faceCheckEnabled=False,
      counts=dict(emotions=6,faces=14,identities=2,presence=12,hints=12,process=30),
      limitations=['Revisión docente pendiente: el banco completo permanece en draft.', 'Ilustraciones originales de demostración; sin fotografías ni pilotaje.',
      'Presencia: bloque reducido de 12 ítems únicos, 6 positivos, 2 negativos neutrales y 4 de otra expresión.',
      'Las dos identidades se reutilizan entre actividades de práctica. No hay formas faciales A/B.',
      'Procesos: 24 casos claros y 6 de información insuficiente; práctica y comprobación usan casos distintos, sin equivalencia demostrada.'])
print(f'Banco {VERSION}: {len(faces)} ilustraciones, {len(process)} casos. Estado: draft, canal demo.')
