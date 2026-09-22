let modularAvailable = false;
const instrumentCatalog = window.EvaluationInstruments.instruments;

async function configureModularWorkflow() {
  const { data, error } = await supabaseClient.rpc('evaluation_capabilities');
  modularAvailable = !error && data === 2;
  const box = document.querySelector('#module-picker');
  box.innerHTML = Object.values(instrumentCatalog).map(config => `<label class="module-choice"><input type="checkbox" name="instrument" value="${config.instrument}" ${config.instrument === 'SWLS' ? 'checked' : ''} ${!modularAvailable && config.instrument !== 'SWLS' ? 'disabled' : ''}><span><strong>${escapeHtml(config.name)}</strong><small>${escapeHtml(config.description)}</small></span></label>`).join('');
  document.querySelector('#module-availability').textContent = modularAvailable
    ? 'Elegí uno o varios módulos. Se completan desde un único enlace y se guardan por sección.'
    : 'Los nuevos módulos requieren la quinta actualización de Supabase (supabase-modules.sql). SWLS sigue disponible.';
  box.addEventListener('change', updateModuleSummary);
  updateModuleSummary();
  document.querySelector('#view-baterias .intro').textContent = 'Consultá el contenido y las fuentes antes de elegir qué administrar.';
  document.querySelector('#view-baterias .battery-grid').innerHTML = Object.values(instrumentCatalog).map(config => `<article class="battery-card"><h2>${escapeHtml(config.name)}</h2><p>${escapeHtml(config.description)}</p><p>${escapeHtml(config.citation)}</p>${config.source ? `<a href="${config.source}" target="_blank" rel="noopener noreferrer">Consultar fuente</a>` : ''}<p>${escapeHtml(config.evidence_note || '')}</p><button type="button" data-create-module="${config.instrument}" ${!modularAvailable && config.instrument !== 'SWLS' ? 'disabled' : ''}>Preparar evaluación</button></article>`).join('');
  document.querySelectorAll('[data-create-module]').forEach(button => {
    button.onclick = () => {
      showView('nueva');
      box.querySelectorAll('input').forEach(input => { input.checked = input.value === button.dataset.createModule; });
      updateModuleSummary();
    };
  });
}

function selectedInstrumentConfigs() {
  return [...document.querySelectorAll('#module-picker input:checked')].map(input => instrumentCatalog[input.value]);
}

function updateModuleSummary() {
  const selected = selectedInstrumentConfigs();
  const text = selected.length ? selected.map(config => config.name).join(' + ') : 'Elegí al menos un módulo.';
  document.querySelectorAll('[data-module-summary]').forEach(node => { node.textContent = text; });
  document.querySelector('#phq-guidance').hidden = !selected.some(config => config.instrument === 'PHQ9');
  const preview = document.querySelector('.preview-sheet');
  preview.innerHTML = selected.map(config => `<h3>${escapeHtml(config.name)}</h3><p>${escapeHtml(config.instructions)}</p>`).join('') || '<p>Seleccioná los módulos para ver el recorrido.</p>';
}

function renderResponseDetails(response, module) {
  const code = module?.config?.instrument || response.score?.instrument || 'SWLS';
  const config = { ...instrumentCatalog[code], ...module?.config };
  const heading = `<h3>${escapeHtml(module?.name || config.name || 'Respuestas')}</h3>`;
  const answers = response.answers || {};
  const items = code === 'INTAKE'
    ? (config.fields || []).map(field => `<p>${escapeHtml(field.label)}<br><strong>${escapeHtml(answers[field.key] || 'Sin respuesta')}</strong></p>`).join('')
    : (config.questions || []).map((question, i) => {
      const value = answers[`item_${i + 1}`];
      const label = config.options?.[value - config.response_min];
      return `<p>${i + 1}. ${escapeHtml(question)}<br><strong>${escapeHtml(value === undefined ? 'Sin respuesta' : `${value} — ${label || ''}`)}</strong></p>`;
    }).join('') + (code === 'PHQ9' ? `<p>Dificultad cotidiana: <strong>${escapeHtml(config.difficulty_options?.[answers.difficulty] || 'No corresponde / sin respuesta')}</strong></p>` : '');
  return heading + items + `<p class="instrument-source">${escapeHtml(config.citation || '')}</p>`;
}

function renderAttentionQueue(evaluations) {
  document.querySelectorAll('.attention-queue').forEach(node => node.remove());
  const pending = evaluations.filter(e => e.attention_required && !e.attention_reviewed_at);
  if (!pending.length) return;
  for (const id of ['view-inicio', 'view-evaluaciones']) {
    const section = document.createElement('section');
    section.className = 'attention-queue clinical-attention';
    section.innerHTML = `<h2>Respuestas que requieren atención (${pending.length})</h2><p>Se registró una respuesta positiva al ítem 9 del PHQ-9. Revisá el contexto y el seguimiento, incluso si la evaluación sigue en curso. Este aviso no determina por sí solo el nivel de riesgo.</p>`;
    for (const evaluation of pending) {
      const button = document.createElement('button');
      button.className = 'previous-step';
      button.textContent = `Revisar: ${evaluation.patients?.full_name || 'Paciente'}`;
      button.onclick = () => openRealEvaluation(evaluation.id);
      section.append(button);
    }
    document.querySelector(`#${id} .page-heading`).after(section);
  }
}

function appendAttentionReview(evaluation) {
  if (!evaluation.attention_required) return;
  const section = document.createElement('section');
  section.className = 'clinical-attention';
  section.innerHTML = `<h3>PHQ-9: revisar respuesta al ítem 9</h3><p>Se registró una respuesta positiva en al menos un guardado. Valorá su significado mediante contacto clínico y registrá las acciones de seguimiento en observaciones. No es una clasificación automática de riesgo.</p>${evaluation.attention_reviewed_at ? `<p>Revisión registrada: ${escapeHtml(formatEvaluationDate(evaluation.attention_reviewed_at))}</p>` : '<button type="button" class="previous-step">Registrar revisión de esta señal</button><p role="status"></p>'}`;
  const button = section.querySelector('button');
  if (button) button.onclick = async () => {
    button.disabled = true;
    try {
      if (!await savePendingReviewNotes()) return;
      const { data, error } = await supabaseClient.rpc('acknowledge_evaluation_attention', { target_evaluation_id: evaluation.id });
      if (error || !data) throw error || new Error('No se pudo registrar la revisión.');
      notifyAction('Revisión de la señal registrada.');
      await openRealEvaluation(evaluation.id);
      const { data: session } = await supabaseClient.auth.getSession();
      if (session.session?.user) await loadEvaluations(session.session.user.id);
    } catch (error) { section.querySelector('[role="status"]').textContent = error.message; }
    finally { button.disabled = false; }
  };
  drawerContent.prepend(section);
}

function patientSupportHtml() {
  return '<div class="clinical-attention" role="note"><strong>No esperes una respuesta por esta página si necesitás ayuda urgente.</strong><p>Este espacio no se monitorea en tiempo real. Si estás en peligro inmediato o pensás que podrías hacerte daño, buscá atención en una guardia o contactá a los servicios de emergencia de tu zona. Si podés, pedí a alguien de confianza que te acompañe. Contactá también a tu profesional por el medio habitual.</p></div>';
}

function renderModularPatient(evaluation, token) {
  const modules = evaluation.modules;
  if (modules.some(module => !instrumentCatalog[module.config?.instrument])) {
    renderPatientError('Hay un módulo que esta versión no puede abrir. Contactá a tu profesional.'); return;
  }
  let current = modules.findIndex(module => !module.saved_answers);
  if (current < 0) current = modules.length;
  const cache = new Map(modules.map(module => [module.id, module.saved_answers || {}]));
  let dirty = false;
  let busy = false;
  const beforeUnload = event => { if (dirty || busy) { event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);
  const render = () => {
    document.querySelector('.patient-shell')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<main class="patient-shell"><div class="patient-wrap"><div class="patient-brand"><span class="brand-mark">ft</span><span><strong>Evaluaciones</strong><small>espacio privado</small></span></div><section class="patient-hero"><h1>Hola, ${escapeHtml(evaluation.patient_name)}.</h1><p>Tus respuestas se guardan al continuar cada sección. Podés volver a este mismo enlace para retomar. Tu profesional puede leer las secciones guardadas antes del envío final.</p><p>Este espacio no se monitorea en tiempo real. Para urgencias, buscá atención por fuera de este formulario.</p></section><section class="patient-card"></section></div></main>`);
    const card = document.querySelector('.patient-card');
    if (current === modules.length) {
      card.innerHTML = `<h2>Revisar y enviar</h2><p>Las secciones están guardadas. Podés revisarlas antes de enviar la evaluación completa.</p><div class="saved-modules"></div><button type="button" class="primary-action patient-submit">Enviar evaluación</button><p class="form-message" role="status"></p>`;
      modules.forEach((module, index) => {
        const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'history-row';
        edit.textContent = `Revisar ${module.name}`;
        edit.onclick = () => { if (!busy) { current = index; render(); } };
        card.querySelector('.saved-modules').append(edit);
      });
      if (modules.some(module => module.config.instrument === 'PHQ9' && cache.get(module.id).item_9 > 0)) card.insertAdjacentHTML('afterbegin', patientSupportHtml());
      card.querySelector('.patient-submit').onclick = async event => {
        if (busy) return;
        busy = true;
        const button = event.currentTarget; button.disabled = true; button.textContent = 'Enviando…';
        try {
          const { data, error } = await supabaseClient.rpc('complete_modular_evaluation', { access_token: token });
          if (error || !data) throw error || new Error('No se confirmó el envío.');
          dirty = false;
          window.removeEventListener('beforeunload', beforeUnload);
          card.innerHTML = '<div class="patient-success"><div class="success-mark">✓</div><h2>Evaluación enviada</h2><p>Tu profesional ya puede revisar la evaluación completa. Podés cerrar esta ventana.</p></div>';
          if (modules.some(module => module.config.instrument === 'PHQ9' && cache.get(module.id).item_9 > 0)) card.insertAdjacentHTML('beforeend', patientSupportHtml());
        } catch (error) {
          card.querySelector('[role="status"]').textContent = `No se pudo confirmar el envío: ${error.message}. Tus secciones siguen guardadas; podés reintentar.`;
          button.disabled = false; button.textContent = 'Reintentar envío';
        } finally { busy = false; }
      };
      return;
    }
    const module = modules[current];
    const config = module.config;
    const answers = cache.get(module.id);
    const progress = Math.round(100 * modules.filter(m => m.saved_answers).length / modules.length);
    card.innerHTML = `<p>Sección ${current + 1} de ${modules.length}</p><h2 tabindex="-1">${escapeHtml(module.name)}</h2><p>${escapeHtml(config.instructions)}</p><progress max="100" value="${progress}" aria-label="Secciones guardadas">${progress}%</progress><form id="modular-patient-form"><div class="module-fields"></div><div id="patient-support" hidden>${patientSupportHtml()}</div><p class="instrument-source">${escapeHtml(config.citation)}</p><div class="module-actions"><button type="button" class="previous-step" ${current === 0 ? 'disabled' : ''}>Volver</button><button type="submit" class="primary-action">Guardar y continuar</button></div><p class="form-message" role="status" aria-live="polite"></p></form>`;
    const form = card.querySelector('form');
    const fields = form.querySelector('.module-fields');
    if (config.instrument === 'INTAKE') {
      fields.innerHTML = config.fields.map(field => `<label class="intake-field">${escapeHtml(field.label)}${field.required ? ' (obligatorio)' : ' (opcional)'}<textarea name="${field.key}" rows="3" maxlength="3000" ${field.required ? 'required' : ''}></textarea></label>`).join('');
      config.fields.forEach(field => { form.elements[field.key].value = answers[field.key] || ''; });
    } else {
      fields.innerHTML = config.questions.map((question, i) => radioQuestion(`item_${i + 1}`, `${i + 1}. ${question}`, config.options, config.response_min, answers[`item_${i + 1}`], true)).join('');
      if (config.instrument === 'PHQ9') fields.insertAdjacentHTML('beforeend', `<div id="phq-difficulty">${radioQuestion('difficulty', config.difficulty_question, config.difficulty_options, 0, answers.difficulty, false)}</div>`);
    }
    const readAnswers = () => {
      const result = {};
      for (const [key, value] of new FormData(form)) result[key] = config.instrument === 'INTAKE' ? String(value).trim() : Number(value);
      return result;
    };
    const updatePhq = () => {
      if (config.instrument !== 'PHQ9') return;
      const values = readAnswers();
      const needsDifficulty = Object.entries(values).some(([key,value]) => key.startsWith('item_') && value > 0);
      form.querySelector('#phq-difficulty').hidden = !needsDifficulty;
      form.querySelectorAll('[name="difficulty"]').forEach(input => { input.required = needsDifficulty; input.disabled = !needsDifficulty; });
      form.querySelector('#patient-support').hidden = !(values.item_9 > 0);
    };
    updatePhq();
    form.addEventListener('input', () => { dirty = true; updatePhq(); });
    form.querySelector('.previous-step').onclick = () => {
      if (busy) return;
      if (dirty && !window.confirm('Los cambios de esta sección todavía no se guardaron. ¿Volver sin guardarlos?')) return;
      dirty = false; current--; render();
    };
    form.onsubmit = async event => {
      event.preventDefault();
      if (busy) return;
      const message = form.querySelector('[role="status"]');
      try {
        const result = readAnswers();
        window.EvaluationInstruments.validateAnswers(config, result);
        busy = true;
        form.querySelectorAll('button,input,textarea').forEach(input => { input.disabled = true; });
        message.textContent = 'Guardando sección…';
        const { data, error } = await supabaseClient.rpc('save_patient_module', { access_token: token, target_module_id: module.id, response_answers: result });
        if (error || !data) throw error || new Error('No se confirmó el guardado.');
        cache.set(module.id, result); module.saved_answers = result;
        dirty = false; current++; render();
        document.querySelector('.patient-card').insertAdjacentHTML('afterbegin', '<p class="save-confirmation" role="status">Sección guardada.</p>');
        document.querySelector('.patient-card h2')?.focus();
        window.scrollTo({top: 0, behavior: 'instant'});
      } catch (error) {
        message.textContent = `No se pudo guardar: ${error.message}`;
        form.querySelectorAll('button,input,textarea').forEach(input => { input.disabled = false; });
        form.querySelector('.previous-step').disabled = current === 0;
        updatePhq();
      } finally { busy = false; }
    };
  };
  render();
}

function radioQuestion(name, question, options, min, saved, required) {
  return `<fieldset class="module-question"><legend>${escapeHtml(question)}</legend><div class="module-options">${options.map((label, i) => `<label><input type="radio" name="${name}" value="${min + i}" ${saved === min + i ? 'checked' : ''} ${required ? 'required' : ''}><span>${min + i} · ${escapeHtml(label)}</span></label>`).join('')}</div></fieldset>`;
}
