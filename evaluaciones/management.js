// Gestión profesional. Los enlaces en claro solo permanecen en la pantalla actual.
function formatEvaluationDate(value) {
  return value ? new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin registro';
}

function buildInvitationMailto(email, link) {
  const recipient = String(email || '').trim();
  if (!/^[^\s@,;?&#]+@[^\s@,;?&#]+\.[^\s@,;?&#]+$/.test(recipient)) {
    throw new Error('Ingresá un email válido para preparar el borrador.');
  }
  const body = `Hola,\n\nTe comparto el enlace para completar tu evaluación:\n${link}\n\nEl enlace es personal. Si ya enviaste tus respuestas, no necesitás completarla nuevamente.\n\nSaludos.`;
  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent('Acceso a tu evaluación')}&body=${encodeURIComponent(body)}`;
}

function renderLinkSharing(container, link, email = '') {
  container.querySelector('.access-link-result')?.remove();
  const section = document.createElement('section');
  section.className = 'access-link-result';
  section.innerHTML = '<h3>Enlace privado listo</h3><label>Enlace para compartir<input class="share-link" readonly></label><button type="button" class="copy-access-link">Copiar enlace</button><form class="share-email-form"><label>Email del destinatario<input type="email" class="share-email" required autocomplete="off"></label><button type="submit" class="copy-access-link">Abrir borrador de correo</button></form><p>Se abrirá tu aplicación de correo. Revisá el borrador y presioná Enviar allí. Esta página no envía emails automáticamente.</p><p>Si no tenés una aplicación de correo configurada, copiá el enlace y pegalo en tu webmail. Al cerrar esta pantalla podés generar otro enlace desde el detalle.</p><p class="share-message" role="status"></p>';
  section.querySelector('.share-link').value = link;
  section.querySelector('.share-email').value = email || '';
  section.querySelector('.copy-access-link').onclick = async () => {
    const message = section.querySelector('.share-message');
    try {
      await navigator.clipboard.writeText(link);
      message.textContent = 'Enlace copiado.';
    } catch {
      const input = section.querySelector('.share-link');
      input.focus(); input.select();
      message.textContent = 'Copiá el enlace seleccionado con Ctrl+C o el menú de tu dispositivo.';
    }
  };
  section.querySelector('form').onsubmit = event => {
    event.preventDefault();
    try {
      const href = buildInvitationMailto(section.querySelector('.share-email').value, link);
      window.location.href = href;
      section.querySelector('.share-message').textContent = 'Borrador solicitado. El correo aún no fue enviado desde esta página.';
    } catch (error) { section.querySelector('.share-message').textContent = error.message; }
  };
  container.append(section);
}

async function openPatientHistory(patientId) {
  if (!confirmDiscardReviewNotes()) return;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  drawerContent.textContent = 'Cargando historial…';
  try {
    const { data: patient, error: patientError } = await supabaseClient.from('patients')
      .select('id, full_name, email').eq('id', patientId).single();
    if (patientError) throw patientError;
    const { data: evaluations, error } = await supabaseClient.from('evaluations')
      .select('id, status, created_at, completed_at, batteries(name)').eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    drawerContent.innerHTML = `<h2>${escapeHtml(patient.full_name)}</h2><p>${escapeHtml(patient.email || 'Sin email registrado')}</p><h3>Historial de evaluaciones</h3>`;
    if (!evaluations.length) drawerContent.insertAdjacentHTML('beforeend', '<p>Todavía no hay evaluaciones para esta persona.</p>');
    for (const evaluation of evaluations) {
      const row = document.createElement('button');
      row.type = 'button'; row.className = 'history-row';
      const [label] = statusLabel(evaluation.status);
      row.innerHTML = `<strong>${escapeHtml(evaluation.batteries?.name || 'Evaluación')}</strong><span>${escapeHtml(label)}</span><small>Creada: ${escapeHtml(formatEvaluationDate(evaluation.created_at))}</small><small>Enviada: ${escapeHtml(formatEvaluationDate(evaluation.completed_at))}</small>`;
      row.onclick = () => openRealEvaluation(evaluation.id);
      drawerContent.append(row);
    }
    const create = document.createElement('button');
    create.type = 'button'; create.className = 'primary-action'; create.textContent = 'Nueva evaluación para este paciente';
    create.onclick = () => {
      closeDrawer(); showView('nueva');
      document.querySelector('#evaluation-patient').value = patientId;
    };
    drawerContent.append(create);
  } catch (error) { drawerContent.textContent = `No se pudo cargar el historial: ${error.message}`; }
}

function confirmDiscardReviewNotes() {
  const input = document.querySelector('#review-notes');
  return !input || input.value === input.dataset.saved || window.confirm('Hay observaciones sin guardar. ¿Querés descartarlas?');
}

async function savePendingReviewNotes() {
  const input = document.querySelector('#review-notes');
  if (!input || input.value === input.dataset.saved) return true;
  const value = input.value;
  const status = document.querySelector('#review-note-message');
  const button = document.querySelector('#save-review-notes');
  button.disabled = true;
  input.disabled = true;
  try {
    const { data, error } = await supabaseClient.rpc('save_review_notes', {
      target_evaluation_id: input.dataset.evaluationId, notes: value
    });
    if (error || !data) throw error || new Error('No se guardó la observación.');
    input.dataset.saved = value;
    status.textContent = 'Observaciones guardadas.';
    return true;
  } catch (error) {
    status.textContent = `No se pudo guardar: ${error.message}`;
    return false;
  } finally { button.disabled = false; input.disabled = false; }
}

function appendEvaluationManagement(evaluation) {
  const section = document.createElement('section');
  section.className = 'drawer-section review-management';
  const migrated = Object.prototype.hasOwnProperty.call(evaluation, 'review_notes');
  section.innerHTML = '<h3>Observaciones de revisión</h3><p>Privadas: no se muestran en el enlace del paciente.</p><label for="review-notes">Observaciones profesionales</label><textarea id="review-notes" maxlength="20000" rows="6"></textarea><button type="button" id="save-review-notes" class="primary-action">Guardar observaciones</button><p id="review-note-message" role="status"></p>';
  const input = section.querySelector('textarea');
  input.value = evaluation.review_notes || '';
  input.dataset.saved = input.value;
  input.dataset.evaluationId = evaluation.id;
  section.querySelector('button').onclick = () => savePendingReviewNotes();
  if (!migrated) {
    input.disabled = true; section.querySelector('button').disabled = true;
    section.querySelector('[role="status"]').textContent = 'Esta función requiere la actualización de la base de datos.';
  }
  if (evaluation.reviewed_at) {
    const date = document.createElement('p');
    date.textContent = `Revisada: ${formatEvaluationDate(evaluation.reviewed_at)}`;
    section.prepend(date);
  }
  drawerContent.append(section);
  if (['draft', 'invited', 'in_progress'].includes(evaluation.status)) {
    const links = document.createElement('section'); links.className = 'drawer-section';
    links.innerHTML = '<h3>Acceso del paciente</h3><p>Generar un nuevo enlace invalida el anterior. No cambia las respuestas guardadas.</p><button type="button" class="primary-action">Generar nuevo enlace</button><p class="link-message" role="status"></p>';
    const button = links.querySelector('button');
    button.onclick = async () => {
      if (!window.confirm('El enlace anterior dejará de funcionar. ¿Generar uno nuevo?')) return;
      button.disabled = true;
      try {
        const token = generateAccessToken();
        const { data, error } = await supabaseClient.rpc('rotate_evaluation_link', {
          target_evaluation_id: evaluation.id, new_token_hash: await hashAccessToken(token)
        });
        if (error || !data) throw error || new Error('No se pudo actualizar el enlace.');
        renderLinkSharing(links, `${window.location.origin}${window.location.pathname}?access=${encodeURIComponent(token)}`, evaluation.patients?.email);
        links.querySelector('.link-message').textContent = 'Enlace regenerado. El anterior ya no funciona.';
        const { data: session } = await supabaseClient.auth.getSession();
        if (session.session?.user) await loadEvaluations(session.session.user.id);
      } catch (error) { links.querySelector('.link-message').textContent = `No se pudo completar la operación: ${error.message}`; }
      finally { button.disabled = false; }
    };
    drawerContent.append(links);
  }
}
