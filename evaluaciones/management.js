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

function buildInvitationGmail(email, link) {
  const mailto = buildInvitationMailto(email, link);
  const fields = new URLSearchParams(mailto.slice(mailto.indexOf('?') + 1));
  const query = new URLSearchParams({view: 'cm', fs: '1', to: email.trim(), su: fields.get('subject'), body: fields.get('body')});
  return `https://mail.google.com/mail/?${query}`;
}

function notifyAction(message, isError = false) {
  let notice = document.querySelector('#action-feedback');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'action-feedback';
    notice.innerHTML = '<p role="status" aria-live="polite" aria-atomic="true"></p><button type="button" aria-label="Cerrar aviso">×</button>';
    notice.querySelector('button').onclick = () => { notice.hidden = true; };
    document.body.append(notice);
  }
  notice.hidden = false;
  notice.dataset.error = String(isError);
  notice.querySelector('p').textContent = message;
}

function renderLinkSharing(container, link, email = '') {
  container.querySelector('.access-link-result')?.remove();
  const section = document.createElement('section');
  section.className = 'access-link-result';
  section.innerHTML = '<h3>Enlace privado listo</h3><label>Enlace para compartir<input class="share-link" readonly></label><button type="button" class="copy-access-link">Copiar enlace</button><form class="share-email-form"><label>Email del destinatario<input type="email" class="share-email" required autocomplete="off"></label><button type="submit" class="copy-access-link">Abrir borrador de correo</button></form><p>Se abrirá tu aplicación de correo. Revisá el borrador y presioná Enviar allí. Esta página no envía emails automáticamente.</p><p>Si no tenés una aplicación de correo configurada, copiá el enlace y pegalo en tu webmail. Al cerrar esta pantalla podés generar otro enlace desde el detalle.</p><p class="share-message" role="status"></p>';
  section.querySelector('.share-link').value = link;
  section.querySelector('.share-email').value = email || '';
  const emailForm = section.querySelector('form');
  emailForm.insertAdjacentHTML('beforeend', '<button type="submit" class="copy-access-link" data-provider="gmail">Abrir en Gmail</button>');
  section.querySelector('.share-email-form + p').textContent = 'Elegí Gmail o tu aplicación de correo. Se prepara un borrador; revisá la cuenta remitente y presioná Enviar allí.';
  section.querySelector('.copy-access-link').onclick = async () => {
    const message = section.querySelector('.share-message');
    const button = section.querySelector('.copy-access-link');
    button.disabled = true;
    button.textContent = 'Copiando…';
    try {
      await navigator.clipboard.writeText(link);
      message.textContent = 'Enlace copiado.';
      button.textContent = 'Enlace copiado ✓';
      notifyAction('Enlace copiado. Ya podés pegarlo donde quieras.');
    } catch {
      const input = section.querySelector('.share-link');
      input.focus(); input.select();
      message.textContent = 'Copiá el enlace seleccionado con Ctrl+C o el menú de tu dispositivo.';
      button.textContent = 'Copiar enlace';
      notifyAction('No se pudo copiar automáticamente. Seleccioné el enlace para que lo copies.', true);
    } finally { button.disabled = false; }
  };
  section.querySelector('form').onsubmit = event => {
    event.preventDefault();
    try {
      if (event.submitter?.dataset.provider === 'gmail') {
        const href = buildInvitationGmail(section.querySelector('.share-email').value, link);
        // Se abre durante el clic para evitar bloqueos por apertura asincrónica.
        const tab = window.open('about:blank', '_blank');
        if (!tab) throw new Error('El navegador bloqueó la pestaña. Permití ventanas emergentes para abrir Gmail.');
        tab.opener = null;
        tab.location.href = href;
        section.querySelector('.share-message').textContent = 'Gmail abierto con el mensaje preparado. Revisá y enviá desde allí.';
        notifyAction('Se abrió Gmail. El correo todavía no fue enviado.');
        return;
      }
      const href = buildInvitationMailto(section.querySelector('.share-email').value, link);
      window.location.href = href;
      section.querySelector('.share-message').textContent = 'Borrador solicitado. El correo aún no fue enviado desde esta página.';
      notifyAction('Borrador solicitado en tu aplicación de correo.');
    } catch (error) { section.querySelector('.share-message').textContent = error.message; notifyAction(error.message, true); }
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
      .select('id, full_name, email, notes').eq('id', patientId).single();
    if (patientError) throw patientError;
    const { data: evaluations, error } = await supabaseClient.from('evaluations')
      .select('id, status, created_at, completed_at, batteries(name)').eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    drawerContent.innerHTML = `<h2>${escapeHtml(patient.full_name)}</h2><p>${escapeHtml(patient.email || 'Sin email registrado')}</p><h3>Historial de evaluaciones</h3>`;
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'primary-action'; edit.textContent = 'Editar paciente';
    edit.onclick = () => { closeDrawer(); openPatientModal(patient); };
    drawerContent.prepend(edit);
    if (!evaluations.length) drawerContent.insertAdjacentHTML('beforeend', '<p>Todavía no hay evaluaciones para esta persona.</p>');
    for (const evaluation of evaluations) {
      const row = document.createElement('button');
      row.type = 'button'; row.className = 'history-row';
      const [label] = statusLabel(evaluation.status);
      row.innerHTML = `<strong>${escapeHtml(displayInstrumentName(evaluation.batteries?.name))}</strong><span>${escapeHtml(label)}</span><small>Creada: ${escapeHtml(formatEvaluationDate(evaluation.created_at))}</small><small>Enviada: ${escapeHtml(formatEvaluationDate(evaluation.completed_at))}</small>`;
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
  if (!input) return true;
  if (input.disabled) return false;
  if (input.value === input.dataset.saved) {
    document.querySelector('#review-note-message').textContent = 'No hay cambios pendientes.';
    return true;
  }
  const value = input.value;
  const status = document.querySelector('#review-note-message');
  const button = document.querySelector('#save-review-notes');
  button.disabled = true;
  button.textContent = 'Guardando…';
  input.disabled = true;
  try {
    const { data, error } = await supabaseClient.rpc('save_review_notes', {
      target_evaluation_id: input.dataset.evaluationId, notes: value
    });
    if (error || !data) throw error || new Error('No se guardó la observación.');
    input.dataset.saved = value;
    status.textContent = 'Observaciones guardadas.';
    notifyAction('Observaciones guardadas.');
    return true;
  } catch (error) {
    status.textContent = `No se pudo guardar: ${error.message}`;
    notifyAction(status.textContent, true);
    return false;
  } finally { button.disabled = false; button.textContent = 'Guardar observaciones'; input.disabled = false; }
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
      button.textContent = 'Generando enlace…';
      try {
        const token = generateAccessToken();
        const { data, error } = await supabaseClient.rpc('rotate_evaluation_link', {
          target_evaluation_id: evaluation.id, new_token_hash: await hashAccessToken(token)
        });
        if (error || !data) throw error || new Error('No se pudo actualizar el enlace.');
        renderLinkSharing(links, `${window.location.origin}${window.location.pathname}?access=${encodeURIComponent(token)}`, evaluation.patients?.email);
        links.querySelector('.link-message').textContent = 'Enlace regenerado. El anterior ya no funciona.';
        notifyAction('Nuevo enlace generado. El anterior quedó invalidado.');
        const { data: session } = await supabaseClient.auth.getSession();
        if (session.session?.user) await loadEvaluations(session.session.user.id);
      } catch (error) { links.querySelector('.link-message').textContent = `No se pudo completar la operación: ${error.message}`; notifyAction(error.message, true); }
      finally { button.disabled = false; button.textContent = 'Generar nuevo enlace'; }
    };
    drawerContent.append(links);
  }
  const deletion = document.createElement('section');
  deletion.className = 'drawer-section evaluation-deletion';
  deletion.innerHTML = '<h3>Borrar evaluación</h3><p>Elimina esta evaluación, sus respuestas y observaciones. Su enlace deja de funcionar. La ficha del paciente y sus otras evaluaciones se conservan. No se puede deshacer desde la aplicación.</p><button type="button" class="delete-evaluation">Borrar evaluación</button><p role="status" aria-live="polite"></p>';
  deletion.querySelector('button').onclick = event => deleteEvaluation(evaluation, event.currentTarget, deletion.querySelector('[role="status"]'));
  drawerContent.append(deletion);
}

async function deleteEvaluation(evaluation, button, message) {
  if (button.disabled) return;
  const patient = evaluation.patients?.full_name || 'este paciente';
  const instrument = displayInstrumentName(evaluation.batteries?.name);
  if (!window.confirm(`¿Borrar la evaluación «${instrument}» de ${patient}?\n\nSe eliminarán sus respuestas y observaciones, incluidos los cambios sin guardar. El enlace dejará de funcionar.\n\nLa ficha del paciente y sus otras evaluaciones se conservan. Esta acción no se puede deshacer desde la aplicación.`)) return;
  button.disabled = true;
  button.textContent = 'Borrando…';
  message.textContent = '';
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (sessionError || !userId) throw new Error('Tu sesión venció. Volvé a ingresar antes de borrar.');
    const { data, error } = await supabaseClient.from('evaluations').delete()
      .eq('id', evaluation.id).eq('professional_id', userId).select('id');
    if (error) throw error;
    if (data?.length !== 1 || data[0].id !== evaluation.id) throw new Error('La evaluación ya no está disponible o no tenés permiso para borrarla. Recargá el listado.');
    // Cerrar solo el detalle eliminado, sin descartar otra ficha abierta durante la petición.
    if (document.querySelector('#review-notes')?.dataset.evaluationId === evaluation.id) {
      drawerContent.replaceChildren();
      closeDrawer();
    }
    workspaceEvaluations = workspaceEvaluations.filter(item => item.id !== evaluation.id);
    document.querySelectorAll('[data-real-evaluation]').forEach(row => {
      if (row.dataset.realEvaluation === evaluation.id) row.remove();
    });
    updateDashboardStats(workspaceEvaluations);
    renderAttentionQueue(workspaceEvaluations);
    notifyAction('Evaluación borrada. Su enlace ya no funciona.');
    try { await loadEvaluations(userId); }
    catch { notifyAction('La evaluación se borró, pero no se pudo actualizar el listado. Recargá la página.', true); }
  } catch (error) {
    message.textContent = `No se pudo borrar: ${error.message}`;
    notifyAction(message.textContent, true);
  } finally {
    button.disabled = false;
    button.textContent = 'Borrar evaluación';
  }
}
