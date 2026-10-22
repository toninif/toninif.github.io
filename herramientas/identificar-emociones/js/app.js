import {loadContent} from './content-loader.js';
import {sample, EMOTIONS} from './sampler.js';
import {createSession, transition, currentTrial, currentItem, maxHint} from './state.js';
import {score, percent} from './scoring.js';
import {saveProgress, readProgress, clearProgress, restoreProgress} from './storage.js';
import {exportJSON, exportCSV, download} from './export.js';

const main = document.querySelector('#main');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles = {presence:'¿Está presente?', hints:'Una pista más', process:'Del proceso a la emoción'};
const modeNames = {practice:'Práctica', check:'Comprobación de demostración', demonstration:'Demostración docente'};
const componentNames = {trigger:'Situación',appraisal:'Significado para la persona',body:'Cuerpo y atención',actionTendency:'Tendencia a actuar'};
let bank, session = null, saved = null, saveEnabled = false, view = 'home', selectedModule = null, activeSince = null, busy = false;
const label = id => bank.emotions.items.find(e => e.id === id)?.shortLabel || ({yes:'Sí',no:'No',uncertain:'No estoy seguro/a',insufficient_information:'La información no alcanza',omitted:'Omitido'}[id] || id || 'Sin respuesta');
const outcomeName = outcome => ({correct:'Respuesta esperada',incorrect:'Para revisar',uncertain:'Incertidumbre',omitted:'Omitido',revealed:'Explicación revelada'}[outcome] || 'Interrumpido');
const announce = message => { document.querySelector('#announcer').textContent = message; };
const notice = message => { document.querySelector('#notice').textContent = message; };
const focus = id => { const node = document.getElementById(id); if (node) node.focus(); };
const button = (text, action, cls = '', extra = '') => `<button type="button" data-action="${action}" class="${cls}" ${extra}>${text}</button>`;

function sourceRefs(refs) {
  return `<ul class="source-list">${refs.map(ref => {
    const source = bank.references.items.find(x => x.id === ref.sourceId);
    return `<li>${esc(source.title)}, PDF p. ${ref.pdfPage}${ref.printedPage === null ? '' : `, impresa p. ${ref.printedPage}`}. ${esc(ref.section)}. ${esc(ref.interpretation)}</li>`;
  }).join('')}</ul>`;
}
function persist() {
  if (saveEnabled && session && !saveProgress(session)) { saveEnabled = false; notice('El navegador no pudo guardar el progreso. La actividad sigue en memoria; podés exportar tus resultados.'); }
}
function takeTime() { const elapsed = activeSince === null ? 0 : performance.now() - activeSince; activeSince = null; return elapsed; }
function checkpoint() {
  if (session?.status === 'active') session = transition(session, {type:'TICK',activeMs:takeTime()}, currentItem(session, bank));
  if (session?.status === 'active' && !document.hidden && view === 'activity') activeSince = performance.now();
  persist();
}
function dispatch(event, focusId = null) {
  if (!session) return;
  const before = session;
  const previousSince = activeSince;
  const next = transition(session, {...event,activeMs:takeTime(),now:Date.now()}, currentItem(session, bank));
  if (next === before) { activeSince = previousSince; return; }
  session = next; persist(); render(focusId);
  if (session.status === 'active' && !document.hidden && view === 'activity') activeSince = performance.now();
}
function pause() {
  if (session && ['active','feedback'].includes(session.status)) dispatch({type:'PAUSE'});
}
function navigate(nextView) {
  pause(); view = nextView; render('view-title');
}
function saveControl() {
  return `<label class="checkline"><input id="save-progress" type="checkbox" ${saveEnabled ? 'checked' : ''}> Guardar mi progreso en este dispositivo</label><p class="small muted">Opcional. Queda en este navegador, sin nombre ni correo. Podés borrarlo en cualquier momento.</p>${button('Borrar progreso guardado','clear-storage')}`;
}
function home() {
  return `<h2 id="view-title" tabindex="-1">Tres formas de mirar una emoción</h2>
    <p class="home-lead">Practicá con expresiones ilustradas y situaciones cotidianas. Aprendé qué información ayuda a distinguirlas y cuándo conviene responder que todavía no alcanza.</p>
    <div class="activities">${[
      ['presence','Distinguir el patrón','Decidí si una expresión objetivo está representada. Los negativos incluyen rostros neutrales y otras expresiones.','12 ejercicios'],
      ['hints','Observar con ayuda','Identificá un patrón y pedí pistas cuando las necesites. Mirá qué aporta cada ayuda.','12 ejercicios'],
      ['process','Comprender el significado','Relacioná situación, evaluación, cambios y tendencias. También hay casos con información insuficiente.','14 casos']
    ].map(([id,sub,text,count],i) => `<article class="activity-entry"><span class="entry-number" aria-hidden="true">${i+1}</span><h3>${titles[id]}</h3><strong>${sub}</strong><p>${text}</p><span class="small muted">${count} · sin límite de tiempo</span>${button('Preparar actividad','prepare','','data-module="'+id+'"')}</article>`).join('')}</div>
    <p>Podés entrar en cualquier actividad. El orden propuesto va de observar un patrón a comprender un proceso.</p>
    ${session ? `<div class="session-note"><h3>${session.status === 'completed' ? 'Última actividad' : 'Tenés una actividad en curso'}</h3><p>${titles[session.module]} · ${modeNames[session.config.mode]} · ${session.trials.filter(t => t.outcome).length} de ${session.trials.length} ejercicios resueltos.</p><div class="actions">${button(session.status === 'completed' ? 'Ver resultados' : 'Retomar actividad','resume-session','primary')}${button('Exportar JSON','json')}${button('Exportar CSV','csv')}</div></div>` : ''}
    ${saved && !session ? `<div class="session-note"><h3>Hay progreso guardado en este navegador</h3><p>Podés retomarlo si la versión del banco es compatible.</p><div class="actions">${button('Retomar progreso guardado','restore','primary')}${button('Exportar archivo guardado','export-saved')}${button('Borrar progreso guardado','clear-storage')}</div></div>` : ''}
    <details><summary>Privacidad y guardado</summary><div>${saveControl()}<p class="small">La herramienta no envía tus respuestas a un servidor. El alojamiento puede registrar visitas. Los bancos y sus claves son consultables en esta aplicación estática.</p></div></details>`;
}
function setup() {
  const id = selectedModule;
  return `<h2 id="view-title" tabindex="-1">${titles[id]}</h2>
    <p>${id === 'presence' ? 'Respondé si el dibujo representa la expresión objetivo. «No» se refiere al patrón observable; no significa que la persona no sienta esa emoción.' : id === 'hints' ? 'Observá la cara completa, elegí una expresión o pedí una pista. Hay un intento por nivel de ayuda; después de un error, una pista nueva permite volver a responder.' : 'Leé un mismo episodio desde sus componentes y elegí la interpretación mejor sustentada. Si falta información relevante, podés indicarlo.'}</p>
    <p class="muted">${id === 'presence' ? 'Bloque reducido: 6 positivos, 2 negativos neutrales y 4 de otra expresión. No hay imágenes repetidas dentro del bloque.' : id === 'hints' ? 'Dos ilustraciones por emoción. La cara no se transforma al pedir ayuda. Usar pistas es parte del aprendizaje.' : 'Dos casos claros por emoción y dos de información insuficiente. Los relatos son originales, basados en los tres materiales de lectura.'} Duración orientativa: 5–10 minutos, a tu ritmo.</p>
    <form id="setup-form">
      <div class="settings">
        <div><label for="mode">Modalidad</label><select id="mode" name="mode"><option value="practice">Práctica: explicación inmediata</option><option value="check" ${id !== 'process' ? 'disabled' : ''}>Comprobación de demostración: explicación al final</option><option value="demonstration">Demostración docente: discusión grupal</option></select>
        <p class="small muted">${id === 'process' ? 'La comprobación usa otros casos. No son formas equivalentes validadas. Todo el contenido está pendiente de revisión docente.' : 'La comprobación facial requiere un banco revisado con identidades separadas; todavía no está disponible.'}</p></div>
        ${id !== 'process' ? `<div><label for="stimulus-mode">Presentación</label><select id="stimulus-mode" name="stimulusMode"><option value="visual">Visual: observar la ilustración</option><option value="descriptive">Descriptiva: leer los movimientos</option></select><p class="small muted">Leer movimientos cambia la tarea: sus resultados se identifican por separado. El modo visual tiene identificación alternativa neutral para no anticipar la clave.</p></div>` : '<input type="hidden" name="stimulusMode" value="text">'}
      </div>
      ${id === 'hints' ? '<label class="checkline"><input type="checkbox" name="integrated" id="integrated"> Práctica integrada: agregar una cuarta pista de contexto</label><p class="small muted">La ayuda contextual se informa por separado de las pistas sobre el rostro.</p>' : ''}
      <details open><summary>Dos ejemplos guiados, fuera del resultado</summary><div>${guidedExamples(id)}</div></details>
      ${session && session.status !== 'completed' ? '<p class="notice">Empezar otra actividad reemplaza la sesión en memoria. Podés volver a Actividades para retomarla o exportarla.</p>' : ''}
      <div class="actions">${button('Volver','home')}<button type="submit" class="primary">Empezar actividad</button></div>
    </form>`;
}
function guidedExamples(module) {
  if (module === 'process') return `<div class="example-grid"><article><h3>Un caso con significado</h3><p>Terminás una tarea que deseabas completar, valorás el resultado y querés compartirlo. La alegría es una interpretación apoyada por el logro y el disfrute; el pulso por sí solo no daría esa información.</p></article><article><h3>Un dato que no alcanza</h3><p>Una persona tiene el pulso acelerado. Podría estar haciendo ejercicio, esperando algo deseado o percibiendo una amenaza. Sin significado ni otros componentes, la información no alcanza.</p></article></div>`;
  return `<div class="example-grid"><article class="example"><img src="assets/faces/f_0001.svg" alt="Ejemplo guiado: comisuras y mejillas elevadas"><div><h3>Un patrón representado</h3><p>En este esquema de alegría, las comisuras y las mejillas suben. ${module === 'presence' ? 'Si preguntamos por alegría, la respuesta esperada es Sí.' : 'Una pista puede orientar la atención a esas zonas sin cambiar la ilustración.'}</p></div></article><article class="example"><img src="assets/faces/f_0007.svg" alt="Ejemplo guiado de configuración neutral"><div><h3>Una cara neutral</h3><p>Las cejas y la boca no muestran el patrón anterior. Si preguntamos por alegría, la respuesta es No. Esto no permite saber qué siente una persona.</p></div></article></div>`;
}
function controls(disabled, trial) {
  const allowed = !disabled;
  const options = session.module === 'presence' ? ['yes','no','uncertain'] : [...EMOTIONS,...(session.module === 'process' ? ['insufficient_information'] : [])];
  const current = trial.attempts.find(a => a.level === trial.hintLevel)?.answer;
  return `<form id="answer-form" data-trial="${esc(trial.trialInstanceId)}">
    <fieldset ${allowed ? '' : 'disabled'}><legend>Elegí una opción</legend><div class="answer-options">${options.map(id => `<label><input type="radio" name="answer" value="${id}" ${current === id ? 'checked' : ''} required> ${label(id)}</label>`).join('')}</div></fieldset>
    ${session.module === 'process' && allowed ? `<fieldset class="evidence"><legend>¿Qué dato te orientó? <span class="small muted">(opcional)</span></legend>${Object.entries(componentNames).map(([id,name]) => `<label><input type="radio" name="evidence" value="${id}"> ${name}</label>`).join('')}</fieldset>` : ''}
    <button id="answer-btn" type="submit" class="primary" ${allowed ? '' : 'disabled'}>Confirmar respuesta</button></form>`;
}
function activity() {
  const t = currentTrial(session), item = currentItem(session,bank), id = esc(t.trialInstanceId);
  if (session.status === 'paused') return `<section class="paused"><h2 id="view-title" tabindex="-1">Actividad en pausa</h2><p>La pausa y el tiempo con la pestaña oculta se excluyen del tiempo activo. Conservamos el orden, las respuestas y las ayudas que ya viste.</p><div class="actions">${button('Continuar actividad','unpause','primary')}${button('Terminar y ver resumen parcial','end')}${button('Volver a actividades','home')}</div></section>`;
  if (session.status === 'load_error') return `<h2 id="view-title" tabindex="-1">No se pudo cargar la ilustración</h2><p>Este problema no cuenta como un error tuyo. Podés reintentar la carga o terminar la actividad.</p><div class="actions">${button('Reintentar carga','retry','primary')}${button('Ver resumen parcial','end')}</div>`;
  const face = bank.faces.items.find(f => f.id === item.faceId);
  const blocked = session.status !== 'active' || (session.module === 'hints' && t.attempts.some(a => a.level === t.hintLevel));
  const question = session.module === 'presence' ? `¿Esta expresión representa ${label(item.targetEmotion).toLowerCase()}?` : session.module === 'hints' ? '¿Qué patrón representa esta expresión?' : '¿Qué interpretación está mejor sustentada?';
  return `<div class="session-head"><p><strong>${titles[session.module]}</strong> · ${modeNames[session.config.mode]}</p><div class="actions">${button('Pausar','pause','','id="pause-btn"')}${button('Terminar actividad','end')}</div></div>
    <p class="small muted">Ejercicio ${session.index+1} de ${session.trials.length} · ${session.module === 'process' ? 'Casos de demostración' : session.config.stimulusMode === 'visual' ? 'Ilustraciones de demostración' : 'Comprensión de descripciones'}${session.config.mode === 'demonstration' ? ' · Respuestas grupales, sin resultado individual' : ''}</p>
    <progress value="${session.index}" max="${session.trials.length}" aria-label="Ejercicios completados"></progress>
    <h2 id="question" tabindex="-1">${question}</h2>
    <div class="workspace ${session.module === 'process' ? 'process-workspace' : ''}">
      <div>${session.module === 'process' ? `<div class="components">${Object.entries(item.components).map(([key,text]) => `<article class="component"><h3>${componentNames[key]}</h3><p>${esc(text || 'No se proporciona esta información.')}</p></article>`).join('')}</div>` : session.config.stimulusMode === 'visual' ? `<figure class="stimulus"><div class="face-frame"><img id="stimulus-image" src="${esc(face.path)}" width="640" height="640" alt="Rostro ilustrado del ejercicio ${session.index+1}"></div><figcaption>Ilustración original de un patrón. No informa una experiencia interna.</figcaption></figure>` : `<div class="description"><p>${esc(face.movementDescription)}</p></div><p class="small muted">Modalidad descriptiva: comprender este texto es una tarea diferente de observar un rostro.</p>`}</div>
      <div id="interaction">${session.status === 'loading' ? '<p role="status">Preparando el estímulo…</p>' : ''}
        ${controls(blocked,t)}
        ${session.module === 'hints' ? `<div class="hint-panel"><h3>Ayudas vistas: ${t.hintLevel}</h3>${t.hintsSeen.length ? `<ol class="hint-list">${t.hintsSeen.map(h => `<li><strong>${h.kind === 'contextual' ? 'Contexto' : h.kind === 'descriptive' ? 'Ayuda de lectura' : 'Pista facial'}:</strong> ${esc((session.config.stimulusMode === 'descriptive' ? item.descriptiveHints : item.hints)[h.level-1].text)}</li>`).join('')}</ol>` : '<p class="small">Podés responder o pedir una pista desde el inicio.</p>'}
          ${session.status === 'active' ? `<div class="actions">${button('Pedir una pista','hint','','id="hint-btn" data-trial="'+id+'" '+(t.hintLevel >= maxHint(session) ? 'disabled' : ''))}${button('Ver explicación','reveal','','data-trial="'+id+'"')}</div>` : ''}
          ${t.attempts.length && !t.outcome ? '<p id="attempt-note">Esa opción no coincide con el patrón del dibujo. El intento quedó registrado. Pedí una pista nueva para volver a responder o mirá la explicación.</p>' : ''}</div>` : ''}
        ${session.status === 'active' ? button('Omitir ejercicio','omit','','data-trial="'+id+'"') : ''}
        ${session.status === 'feedback' ? feedback(item,t) : ''}
      </div>
    </div>`;
}
function feedback(item, trial) {
  if (session.config.mode === 'check') return `<div class="feedback"><h3 id="feedback-title" tabindex="-1">Respuesta registrada</h3><p>Podés revisar la explicación al terminar el bloque.</p>${button(session.index+1 === session.trials.length ? 'Ver resultados' : 'Continuar','next','primary','id="continue-btn" data-trial="'+esc(trial.trialInstanceId)+'"')}</div>`;
  const expected = item.expectedResponse || item.expectedEmotion || item.expectedAnswer;
  return `<div class="feedback"><h3 id="feedback-title" tabindex="-1">${outcomeName(trial.outcome)}</h3><p><strong>Respuesta esperada: ${label(expected)}.</strong></p><p>${esc(item.explanation)}</p>${item.contrast ? `<p>${esc(item.contrast)}</p><p>${esc(item.missingInformation)}</p>` : ''}
    ${trial.evidence ? `<p class="small">Elegiste como dato: ${componentNames[trial.evidence]}. El foco de esta explicación es ${componentNames[item.discriminatingComponent].toLowerCase()}. Tu elección no se califica automáticamente.</p>` : ''}
    ${session.module === 'process' ? `<details><summary>Este caso admite otra respuesta</summary><div><label for="report">¿Qué interpretación propondrías y con qué fundamento?</label><textarea id="report" maxlength="600">${esc(trial.report)}</textarea>${button('Guardar comentario local','report')}<p class="small">Se incluye en la exportación. No se envía ni se califica automáticamente.</p></div></details>` : ''}
    <details><summary>Fundamento del ejercicio</summary>${sourceRefs(item.sourceRefs)}</details>
    ${button(session.index+1 === session.trials.length ? 'Ver resultados' : 'Continuar','next','primary','id="continue-btn" data-trial="'+esc(trial.trialInstanceId)+'"')}</div>`;
}
function results() {
  const s = score(session,bank), demo = session.config.mode === 'demonstration';
  const metric = (term,value) => `<div class="metric"><dt>${term}</dt><dd>${value}</dd></div>`;
  return `<h2 id="view-title" tabindex="-1">${session.partial ? 'Resumen parcial' : 'Actividad completada'}</h2>
    <p>${titles[session.module]} · ${modeNames[session.config.mode]} · ${session.config.stimulusMode === 'visual' ? 'Visual' : session.config.stimulusMode === 'descriptive' ? 'Descriptiva' : 'Textual'}. Banco ${esc(session.contentVersion)}.</p>
    <p>${s.completed} de ${s.planned} ejercicios resueltos (${Math.round(s.completed/s.planned*100)} %). ${s.presented} presentados, ${s.interrupted} interrumpidos, ${s.omitted} omitidos${session.module === 'presence' ? ` y ${s.uncertain} con incertidumbre` : ''}.</p>
    ${demo ? '<p class="session-note">Registro de discusión grupal. No se calcula un resultado individual en demostración docente.</p>' : `<dl class="metrics">${session.module === 'presence' ? metric('Sensibilidad',percent(s.sensitivity))+metric('Especificidad',percent(s.specificity))+metric('Exactitud balanceada',percent(s.balanced)) : session.module === 'hints' ? metric('Sin ayuda, primer intento',s.initial)+metric(session.config.stimulusMode === 'visual' ? 'Tras pistas faciales' : 'Tras ayudas descriptivas',session.config.stimulusMode === 'visual' ? s.facial : s.descriptive)+metric('Tras contexto',s.contextual) : metric('Casos claros',`${s.clear.correct} / ${s.clear.presented}`)+metric('Exactitud en casos claros',percent(s.clear.accuracy))+metric('Información insuficiente',`${s.insufficient.correct} / ${s.insufficient.presented}`)}</dl>
    ${session.module === 'presence' ? `<p>${s.hits} detecciones correctas, ${s.falseAlarms} falsas alarmas, ${s.misses} omisiones de detección (respuesta No ante un positivo), ${s.rejects} rechazos correctos.</p><p class="small muted">La sensibilidad usa todos los positivos presentados; la especificidad, todos los negativos. Incertidumbre, omisión e interrupción no suman aciertos. Un denominador vacío se informa como «Sin datos».</p>` : session.module === 'hints' ? `<p>${s.previousErrors} intentos previos incorrectos; ${s.revealed} explicaciones reveladas; ${s.unresolved} ejercicios sin resolver correctamente.</p><p>Primer acierto por nivel: ${s.levels.map((n,i) => `${i}: ${n}`).join(' · ')}.</p><p class="small muted">Los aciertos tras contexto se cuentan aparte; no se suman a los aciertos con ayuda facial o descriptiva.</p>` : `<p>Exactitud en información insuficiente: ${percent(s.insufficient.accuracy)}. Las omisiones e interrupciones presentadas quedan en el denominador correspondiente.</p>`}
    <div class="table-wrap"><table><caption>Por emoción ${session.module === 'presence' ? 'objetivo' : ''}</caption><thead><tr><th scope="col">Emoción</th><th scope="col">${session.module === 'presence' ? 'Sensibilidad' : 'Resueltos / presentados'}</th><th scope="col">${session.module === 'presence' ? 'Especificidad' : 'Porcentaje'}</th></tr></thead><tbody>${bank.emotions.items.map(e => {const row=s.byEmotion[e.id];return `<tr><th scope="row">${esc(e.shortLabel)}</th><td>${session.module === 'presence' ? percent(row.sensitivity) : `${row.correct} / ${row.presented}`}</td><td>${session.module === 'presence' ? percent(row.specificity) : percent(row.presented ? row.correct/row.presented : null)}</td></tr>`;}).join('')}</tbody></table></div>
    ${session.module === 'presence' ? `<p class="small">Negativos neutrales: ${s.byNegativeType.neutral.rejects} / ${s.byNegativeType.neutral.negative} rechazos correctos. Otras expresiones: ${s.byNegativeType.other.rejects} / ${s.byNegativeType.other.negative}.</p>` : ''}`}
    <p>Estos resultados describen esta actividad de demostración. Podés revisar las diferencias que te costaron y volver a los conceptos; no hay diagnóstico, percentil ni puntaje global.</p>
    <details><summary>Revisar respuestas y explicaciones</summary><ol class="review-list">${session.trials.filter(t => t.presented).map(t => {const item=bank[session.module].items.find(x=>x.id===t.itemId); return `<li><h3>${outcomeName(t.outcome)}</h3>${item.components ? `<p>${esc(item.components.trigger)}</p>` : `<p>${session.module === 'presence' ? 'Objetivo: '+label(item.targetEmotion) : 'Ilustración'} · ${esc(item.faceId)}</p>`}<p>Respuesta: ${t.attempts.map(a => `${label(a.answer)} (nivel ${a.level})`).join('; ') || 'Sin respuesta'}. Esperada: ${label(item.expectedResponse || item.expectedEmotion || item.expectedAnswer)}.</p><p>${esc(item.explanation)}</p>${item.contrast ? `<p>${esc(item.contrast)}</p><p>${esc(item.missingInformation)}</p>` : ''}${t.report ? `<p>Comentario: ${esc(t.report)}</p>` : ''}${sourceRefs(item.sourceRefs)}</li>`;}).join('')}</ol></details>
    <div class="actions">${button('Exportar JSON','json')}${button('Exportar CSV','csv')}${button('Practicar otra vez','repeat','primary')}${button('Volver a actividades','home')}${button('Explorar conceptos','library')}</div>
    <p class="small muted">La repetición facial reutiliza las dos identidades de demostración. Los casos claros se mantienen dentro de cada modalidad. La exposición previa queda en el JSON; no se presenta como una nueva medición equivalente.</p>`;
}
function library() {
  const guide = bank.emotions.guide;
  return `<div class="library"><h2 id="view-title" tabindex="-1">Observar, interpretar y comprender</h2><p>${esc(guide.intro)}</p><div class="guide-flow">${guide.steps.map(step=>`<article><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></article>`).join('')}</div><p>${esc(guide.limits)}</p><details><summary>Fundamento del recorrido</summary>${sourceRefs(guide.sourceRefs)}</details>
    <h2>Seis categorías para explorar</h2><p class="muted">Fichas redactadas a partir de los tres PDF, pendientes de revisión docente. Son asociaciones posibles, no listas para diagnosticar emociones.</p>${bank.emotions.items.map(e=>`<details><summary>${esc(e.label)}</summary><div><p>${esc(e.definition)}</p><dl>${[['synonyms','Denominaciones'],['triggers','Desencadenantes posibles'],['appraisal','Evaluación'],['body','Cuerpo'],['subjective','Experiencia subjetiva'],['expression','Patrón expresivo ilustrativo'],['actionTendency','Tendencia a actuar'],['function','Función posible'],['confusions','Qué conviene distinguir'],['example','Un ejemplo'],['counterexample','Un contraejemplo']].map(([field,name])=>`<dt>${name}</dt><dd>${esc(e[field])}</dd>`).join('')}</dl>${sourceRefs(e.sourceRefs)}</div></details>`).join('')}
    <h2>Glosario</h2><dl>${bank.emotions.glossary.map(x=>`<dt>${esc(x.term)}</dt><dd>${esc(x.text)}</dd>`).join('')}</dl></div>`;
}
function sources() {
  return `<div class="library"><h2 id="view-title" tabindex="-1">Fuentes y alcance</h2><p>Los tres materiales se leyeron completos. Las fichas y los casos son paráfrasis y ejemplos originales. La revisión del responsable docente está pendiente; no hay un banco marcado como definitivo.</p>
    ${bank.references.items.map(s=>`<article><h3>${esc(s.title)}</h3><p>${esc(s.author)}${s.year ? ` (${s.year})` : ' (sin fecha bibliográfica confirmada)'}. ${s.pageCount} páginas.</p><p>${esc(s.version)}. ${esc(s.note)}</p></article>`).join('')}
    <h3>Diferencias que conservamos</h3><p>El apunte usa alegría; el capítulo desarrolla felicidad con un alcance más amplio que un episodio de alegría. No se tratan como equivalentes exactos. Las tablas y el texto discrepan sobre urgencia y sobre el pulso en sorpresa: esos datos no se usan como claves rígidas.</p>
    <p>El modelo de los insumos es una organización cognitiva del proceso emocional. No se mezcla con la evaluación primaria/secundaria de otros modelos ni se presenta como una secuencia universal demostrada.</p>
    <h3>Procedencia de las ilustraciones</h3><p>14 ilustraciones vectoriales originales de dos identidades ficticias, seis patrones y neutral. No se incorporan fotografías ni figuras de los PDF. No tienen pilotaje de reconocimiento. Se mantienen iguales al pedir pistas y al cambiar de tema.</p>
    <h3>Límites de esta versión</h3><ul>${bank.manifest.limitations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <h3>Acceso y privacidad</h3><p>Hay navegación por teclado, texto grande, modo proyector y modalidad descriptiva. Leer una descripción cambia la tarea y no equivale a reconocimiento visual. El módulo de procesos se presenta íntegramente en texto.</p><p>El diseño toma como referencia <a href="https://www.w3.org/WAI/WCAG22/quickref/">WCAG 2.2</a>; esto no constituye una certificación de conformidad. El guardado es opcional y local. Las exportaciones se descargan en tu dispositivo.</p></div>`;
}
function render(focusId) {
  if (!bank) return;
  document.querySelectorAll('[data-nav]').forEach(node => {
    const active = node.dataset.nav === view || (node.dataset.nav === 'home' && ['setup','activity'].includes(view));
    if (active) node.setAttribute('aria-current','page'); else node.removeAttribute('aria-current');
  });
  if (session?.status === 'completed' && view === 'activity') main.innerHTML = results();
  else main.innerHTML = ({home,setup,activity,library,sources}[view] || home)();
  if (focusId) focus(focusId);
  if (view === 'activity' && session?.status === 'loading') readyStimulus();
}
async function readyStimulus() {
  const token = currentTrial(session).trialInstanceId;
  try {
    const img = document.querySelector('#stimulus-image');
    if (img) await img.decode();
    if (session?.status !== 'loading' || currentTrial(session).trialInstanceId !== token || view !== 'activity') return;
    dispatch({type:'READY',trialInstanceId:token},'question');
    session.trials.slice(session.index+1,session.index+3).forEach(t => {
      const item = bank[session.module].items.find(i=>i.id===t.itemId), face = bank.faces.items.find(f=>f.id===item.faceId);
      if (face && session.config.stimulusMode === 'visual') { const preload = new Image(); preload.src = face.path; preload.decode().catch(()=>{}); }
    });
  } catch { if (session?.status === 'loading' && currentTrial(session).trialInstanceId === token) dispatch({type:'LOAD_ERROR',trialInstanceId:token},'view-title'); }
}
document.addEventListener('submit', event => {
  if (event.target.id === 'setup-form') {
    event.preventDefault();
    const data = new FormData(event.target), previous = session;
    const config = {mode:data.get('mode'),stimulusMode:data.get('stimulusMode'),integrated:data.get('integrated') === 'on' && data.get('mode') === 'practice',seed:crypto.randomUUID()};
    try {
      const ids = sample(bank,selectedModule,config);
      session = createSession(selectedModule,config,ids,bank.manifest.contentVersion);
      session.priorExposures = previous ? [...previous.priorExposures,{module:previous.module,formId:previous.formId,contentVersion:previous.contentVersion,itemIds:previous.trials.filter(t=>t.presented).map(t=>t.itemId)}] : [];
      view = 'activity'; notice(''); persist(); render();
    } catch (error) { notice(error.message); }
  }
  if (event.target.id === 'answer-form') {
    event.preventDefault(); const data = new FormData(event.target);
    dispatch({type:'ANSWER',answer:data.get('answer'),evidence:data.get('evidence'),trialInstanceId:event.target.dataset.trial},'feedback-title');
    if (session.status === 'active') { focus('hint-btn'); announce('Intento registrado. Pedí una nueva pista para volver a responder.'); }
    else announce(session.config.mode === 'check' ? 'Respuesta registrada. La explicación se muestra al terminar.' : `${outcomeName(currentTrial(session).outcome)}. Respuesta esperada: ${label(currentItem(session,bank).expectedResponse || currentItem(session,bank).expectedEmotion || currentItem(session,bank).expectedAnswer)}.`);
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'save-progress') {
    saveEnabled = event.target.checked;
    if (saveEnabled) { checkpoint(); if (!session) notice('El guardado se activará al comenzar una actividad.'); }
    else { if (!clearProgress()) notice('No se pudo borrar el progreso guardado en este navegador.'); saved = null; }
  }
  if (event.target.id === 'mode') {
    const integrated = document.querySelector('#integrated');
    if (integrated) { integrated.disabled = event.target.value !== 'practice'; if (integrated.disabled) integrated.checked = false; }
  }
});
document.addEventListener('click', async event => {
  const nav = event.target.closest('[data-nav]'); if (nav && bank) { navigate(nav.dataset.nav); return; }
  const tool = event.target.closest('.display-tools button');
  if (tool) {
    const enabled = tool.getAttribute('aria-pressed') !== 'true'; tool.setAttribute('aria-pressed',String(enabled));
    if (tool.id === 'theme') {document.documentElement.dataset.theme = enabled ? 'dark' : 'light';tool.textContent = enabled ? 'Tema claro' : 'Tema oscuro';}
    else document.documentElement.classList.toggle(tool.id === 'large-text' ? 'large' : 'projector',enabled);
    return;
  }
  const node = event.target.closest('[data-action]'); if (!node || node.disabled || busy) return;
  const action = node.dataset.action, token = node.dataset.trial;
  if (action === 'reload') { init(); return; }
  if (!bank) return;
  if (['home','library'].includes(action)) { navigate(action); return; }
  if (action === 'prepare') { pause(); selectedModule = node.dataset.module; view = 'setup'; render('view-title'); }
  if (action === 'repeat') {selectedModule = session.module; view = 'setup'; render('view-title');}
  if (action === 'pause') dispatch({type:'PAUSE'},'view-title');
  if (action === 'unpause') dispatch({type:'RESUME'},'question');
  if (action === 'resume-session') { view = 'activity'; render('view-title'); }
  if (action === 'hint') {
    dispatch({type:'HINT',trialInstanceId:token},'hint-btn');
    if (document.querySelector('#hint-btn')?.disabled) focus('answer-btn');
    const t = currentTrial(session), item = currentItem(session,bank);
    announce(`${t.hintLevel === 4 ? 'Ayuda contextual' : 'Pista '+t.hintLevel}: ${(session.config.stimulusMode === 'descriptive' ? item.descriptiveHints : item.hints)[t.hintLevel-1].text}`);
  }
  if (action === 'reveal') { dispatch({type:'REVEAL',trialInstanceId:token},'feedback-title'); announce('Explicación revelada. No se registra como acierto.'); }
  if (action === 'omit') { dispatch({type:'OMIT',trialInstanceId:token},'feedback-title'); announce('Ejercicio omitido.'); }
  if (action === 'next') dispatch({type:'NEXT',trialInstanceId:token},session.index+1 === session.trials.length ? 'view-title' : null);
  if (action === 'end') dispatch({type:'END'},'view-title');
  if (action === 'retry') dispatch({type:'RETRY'});
  if (action === 'report') {
    const text = document.querySelector('#report').value;
    session = transition(session,{type:'REPORT',text},currentItem(session,bank)); persist(); announce('Comentario guardado en esta sesión. Se incluirá en la exportación.');
  }
  if (action === 'clear-storage') {
    const cleared = clearProgress(); if (cleared) {saved = null; saveEnabled = false;}
    notice(cleared ? 'Se borró el progreso guardado. La sesión actual puede seguir en memoria.' : 'El navegador no permitió borrar el progreso.'); render();
  }
  if (action === 'restore') {
    try {session = restoreProgress(saved,bank); saveEnabled = true; view = 'activity'; render('view-title');}
    catch(error) {notice(error.message);}
  }
  if (action === 'export-saved' && saved) download(JSON.stringify(saved,null,2),'emociones-progreso-guardado.json','application/json');
  if (['json','csv'].includes(action) && session) { checkpoint(); download(action === 'json' ? exportJSON(session,bank) : exportCSV(session),`emociones-${session.module}.${action}`,action === 'json' ? 'application/json' : 'text/csv;charset=utf-8'); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('pagehide', checkpoint);
async function init() {
  busy = true; notice('');
  try {
    bank = await loadContent(); const stored = readProgress(); saved = stored.session || null;
    if (stored.error) notice(stored.error);
    render();
  } catch(error) {
    main.innerHTML = `<h2 id="view-title" tabindex="-1">No se pudo preparar la actividad</h2><p>${esc(error.message)} Serví esta carpeta por HTTP para cargar los módulos y el banco.</p>${button('Reintentar','reload','primary')}`;
  } finally { busy = false; }
}
init();
