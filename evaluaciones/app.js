const views = [...document.querySelectorAll('.view')];
const supabaseConfig = window.EVALUACIONES_SUPABASE;
const supabaseClient = supabaseConfig && window.supabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
  : null;
const patientAccessToken = new URLSearchParams(window.location.search).get('access');
const isPatientMode = Boolean(patientAccessToken);
const swlsQuestions = [
  'En la mayoría de los aspectos, mi vida se acerca a mi ideal.',
  'Las condiciones de mi vida son excelentes.',
  'Estoy satisfecho/a con mi vida.',
  'Hasta ahora he conseguido las cosas importantes que quiero en la vida.',
  'Si pudiera vivir mi vida de nuevo, no cambiaría casi nada.'
];

if (supabaseClient && !isPatientMode) {
  window.evaluacionesSupabase = supabaseClient;
  console.info('Supabase conectado. Falta ejecutar el esquema y agregar autenticación.');
} else {
  console.info('Modo demo: no hay configuración de Supabase disponible.');
}

const authScreen = document.querySelector('#auth-screen');
const authForm = document.querySelector('#auth-form');
const authMessage = document.querySelector('#auth-message');
let workspaceInitialized = false;
let workspacePatients = [];
let workspaceEvaluations = [];
let authLoading = false;

function setAuthMessage(message, isSuccess = false) {
  authMessage.textContent = message;
  authMessage.style.color = isSuccess ? '#688f5b' : '#b15f4b';
}

async function prepareProfile(user) {
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Profesional';
  const { error } = await supabaseClient.from('profiles').upsert({ id: user.id, full_name: fullName, role: 'professional' });
  if (error) throw error;
}

async function showAuthenticatedApp(session) {
  if (authLoading) return;
  authLoading = true;
  try {
  if (!session) {
    workspaceInitialized = false;
    authScreen?.classList.add('visible');
    document.querySelector('.app-shell').style.display = 'none';
    return;
  }
  try {
    await prepareProfile(session.user);
    await initializeWorkspace(session.user);
    authScreen?.classList.remove('visible');
    document.querySelector('.app-shell').style.display = 'flex';
  } catch (error) {
    authScreen?.classList.add('visible');
    setAuthMessage(`La sesión inició, pero no se pudo preparar el perfil: ${error.message}`);
  }
  } finally { authLoading = false; }
}

function configureSwlsWorkflow() {
  const moduleStep = document.querySelectorAll('.form-step')[1];
  moduleStep.querySelector('h2').textContent = 'Instrumento incluido';
  moduleStep.querySelector('.muted').textContent = 'Esta versión permite administrar Satisfacción con la vida (SWLS).';
  moduleStep.querySelectorAll('.module-option').forEach(option => option.remove());
  moduleStep.insertAdjacentHTML('afterbegin', '<p class="patient-note">SWLS · 5 ítems · respuestas de 1 a 7</p>');
  const last = document.querySelectorAll('.form-step')[2];
  last.querySelector('h2').textContent = 'Generar enlace privado';
  last.querySelector('.muted').textContent = 'Copiá el enlace y compartilo con la persona evaluada.';
  last.querySelector('label')?.remove();
  last.querySelector('.access-box p').textContent = 'El enlace se muestra una vez al guardar. Copialo antes de salir.';
  document.querySelector('.preview-panel').innerHTML = '<h2>Satisfacción con la vida</h2><p>5 afirmaciones, con respuestas de 1 (muy en desacuerdo) a 7 (muy de acuerdo).</p><p>Solo este instrumento está habilitado en esta versión.</p>';
  document.querySelector('.battery-grid').innerHTML = '<article class="battery-card"><h2>Satisfacción con la vida (SWLS)</h2><p>Instrumento disponible: 5 ítems. Los otros módulos aún no están habilitados.</p><button id="use-swls">Crear evaluación</button></article>';
  document.querySelector('#use-swls').onclick = () => showView('nueva');
  document.querySelector('.sidebar-note strong').textContent = 'Evaluaciones';
  document.querySelector('.sidebar-note p').textContent = 'Datos guardados en tu cuenta.';
}

function resetWizard() {
  currentStep = 0;
  document.querySelectorAll('.form-step').forEach((step, index) => step.classList.toggle('active', index === 0));
  document.querySelectorAll('.step').forEach((step, index) => step.classList.toggle('active', index === 0));
  document.querySelectorAll('.access-link-result').forEach(node => node.remove());
  const button = document.querySelector('.finish-step');
  button.disabled = false;
  button.textContent = 'Guardar y generar enlace';
  button.style.background = '';
  document.querySelector('#evaluation-patient')?.setAttribute('aria-label', 'Paciente');
  document.querySelectorAll('.form-step')[0].querySelector('textarea').value = '';
}

async function ensureDefaultBattery(userId) {
  const { data: existing, error: readError } = await supabaseClient
    .from('batteries').select('id').eq('professional_id', userId).eq('name', 'Batería inicial').maybeSingle();
  if (readError) throw readError;
  let battery = existing;
  if (!battery) {
    const { data: createdBattery, error: batteryError } = await supabaseClient
      .from('batteries').insert({ professional_id: userId, name: 'Batería inicial', description: 'Batería inicial de evaluación', estimated_minutes: 40 }).select('id').single();
    if (batteryError) throw batteryError;
    battery = createdBattery;
  }
  const modules = [
    ['Entrevista inicial', 'Antecedentes y motivo de consulta', 1, {}],
    ['Datos sociodemográficos', 'Contexto personal y cotidiano', 2, {}],
    ['Cuestionario de ansiedad', 'Escala breve de auto-reporte', 3, {}],
    ['Satisfacción con la vida (SWLS)', '5 ítems · escala de acuerdo de 1 a 7', 4, { instrument: 'SWLS', item_count: 5, response_min: 1, response_max: 7, scoring: 'sum', citation: 'Diener, Emmons, Larsen y Griffin (1985)', questions: swlsQuestions }]
  ];
  const { data: currentModules, error: currentError } = await supabaseClient.from('modules').select('id, name, config').eq('battery_id', battery.id);
  if (currentError) throw currentError;
  const currentNames = new Set((currentModules || []).map((module) => module.name));
  const existingSwls = (currentModules || []).find((module) => module.name === 'Satisfacción con la vida (SWLS)');
  if (existingSwls && !existingSwls.config?.questions) {
    const { error: updateError } = await supabaseClient.from('modules').update({ config: modules[3][3] }).eq('id', existingSwls.id);
    if (updateError) throw updateError;
  }
  const missingModules = modules.filter(([name]) => !currentNames.has(name)).map(([name, description, position, config]) => ({ battery_id: battery.id, name, description, position, config }));
  if (missingModules.length) {
    const { error: modulesError } = await supabaseClient.from('modules').insert(missingModules);
    if (modulesError) throw modulesError;
  }
  return battery.id;
}

async function loadPatients(userId) {
  const { data, error } = await supabaseClient.from('patients').select('id, full_name, email, created_at').eq('professional_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  workspacePatients = data || [];
  const directory = document.querySelector('.patient-directory');
  if (!directory) return;
  const rows = (data || []).map((patient) => {
    const initials = patient.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    return `<button type="button" class="directory-row" data-patient-id="${patient.id}" aria-label="Ver historial de ${escapeHtml(patient.full_name)}"><span class="patient-cell"><span class="patient-avatar blue">${escapeHtml(initials)}</span><strong>${escapeHtml(patient.full_name)}</strong></span><span class="patient-count">${workspaceEvaluations.filter(e => e.patient_id === patient.id).length} evaluaciones</span><span>${escapeHtml(patient.email || 'Sin email')}</span></button>`;
  }).join('');
  directory.innerHTML = `<div class="directory-head">Paciente <span>Evaluaciones</span><span>Contacto</span></div>${rows || '<div class="empty-directory">Todavía no hay pacientes. Creá el primero para iniciar una evaluación.</div>'}`;
  const patientInput = document.querySelectorAll('.form-step')[0]?.querySelector('input, select');
  directory.querySelectorAll('[data-patient-id]').forEach(row => {
    row.onclick = () => openPatientHistory(row.dataset.patientId);
  });
  if (patientInput) {
    const selected = patientInput.value;
    const select = document.createElement('select');
    select.id = 'evaluation-patient';
    select.required = true;
    select.innerHTML = '<option value="">Elegí un paciente</option>' + workspacePatients.map(patient => `<option value="${patient.id}">${escapeHtml(patient.full_name)} — ${escapeHtml(patient.email || patient.id.slice(0, 8))}</option>`).join('');
    select.value = workspacePatients.some(p => p.id === selected) ? selected : '';
    patientInput.replaceWith(select);
  }
}

function escapeHtml(value = '') {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function statusLabel(status) {
  const labels = { draft: ['Borrador', 'progress'], invited: ['Invitada', 'progress'], in_progress: ['En progreso', 'progress'], to_review: ['Para revisar', 'review'], completed: ['Completa', 'done'], archived: ['Archivada', 'review'] };
  return labels[status] || ['Borrador', 'progress'];
}

async function loadEvaluations(userId) {
  const table = document.querySelector('#view-evaluaciones .table-body');
  const recent = document.querySelector('#view-inicio .evaluation-list');
  if (table) table.innerHTML = '';
  if (recent) recent.innerHTML = '';
  const { data, error } = await supabaseClient.from('evaluations').select('id, patient_id, status, created_at, completed_at, patients(full_name), batteries(name)').eq('professional_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  const evaluations = data || [];
  workspaceEvaluations = evaluations;
  updateDashboardStats(evaluations);
  const empty = '<div class="empty-directory">Todavía no hay evaluaciones. Creá la primera desde “Nueva evaluación”.</div>';
  if (!evaluations.length) {
    if (table) table.innerHTML = empty;
    if (recent) recent.innerHTML = empty;
    return;
  }
  const rows = evaluations.map((evaluation) => {
    const name = evaluation.patients?.full_name || 'Paciente sin nombre';
    const battery = evaluation.batteries?.name || 'Batería sin nombre';
    const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    const [label, tone] = statusLabel(evaluation.status);
    const date = new Date(evaluation.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    return { id: evaluation.id, name, battery, initials, label, tone, date, status: evaluation.status };
  });
  if (table) table.innerHTML = rows.map((row) => `<button class="table-row" data-real-evaluation="${row.id}"><div class="patient-cell"><div class="patient-avatar blue">${escapeHtml(row.initials)}</div><strong>${escapeHtml(row.name)}</strong></div><span>${escapeHtml(row.battery)}</span><span class="row-status ${row.tone}">${row.label}</span><span>${row.date}</span><b>›</b></button>`).join('');
  if (recent) recent.innerHTML = rows.slice(0, 5).map((row) => `<button class="evaluation-row" data-real-evaluation="${row.id}"><div class="patient-avatar blue">${escapeHtml(row.initials)}</div><div class="evaluation-info"><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.battery)}</span></div><div class="row-status ${row.tone}">${row.label}</div><div class="row-date">${row.date} <b>›</b></div></button>`).join('');
  table?.querySelectorAll('.table-row').forEach((row, index) => { row.dataset.status = rows[index].status; });
  document.querySelectorAll('[data-real-evaluation]').forEach((row) => row.addEventListener('click', () => openRealEvaluation(row.dataset.realEvaluation)));
  bindEvaluationFilters();
}

function updateDashboardStats(evaluations) {
  const active = evaluations.filter((evaluation) => ['draft', 'invited', 'in_progress', 'to_review'].includes(evaluation.status)).length;
  const toReview = evaluations.filter((evaluation) => evaluation.status === 'to_review').length;
  const now = new Date();
  const completedThisMonth = evaluations.filter((evaluation) => {
    const date = new Date(evaluation.completed_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && ['completed', 'to_review'].includes(evaluation.status);
  }).length;
  const stats = document.querySelectorAll('#view-inicio .signal-card strong');
  if (stats[0]) stats[0].textContent = active;
  if (stats[1]) stats[1].textContent = toReview;
  if (stats[2]) stats[2].textContent = completedThisMonth;
  document.querySelector('.nav-item[data-view="evaluaciones"] b').textContent = evaluations.length;
  document.querySelectorAll('.directory-row[data-patient-id]').forEach(row => {
    row.querySelector('.patient-count').textContent = `${evaluations.filter(e => e.patient_id === row.dataset.patientId).length} evaluaciones`;
  });
  const filters = document.querySelectorAll('#view-evaluaciones .filter b');
  if (filters[0]) filters[0].textContent = evaluations.length;
  if (filters[1]) filters[1].textContent = evaluations.filter((evaluation) => ['invited', 'in_progress'].includes(evaluation.status)).length;
  if (filters[2]) filters[2].textContent = toReview;
  if (filters[3]) filters[3].textContent = evaluations.filter((evaluation) => evaluation.status === 'completed').length;
}

function bindEvaluationFilters() {
  document.querySelectorAll('#view-evaluaciones .filter').forEach((filter, index) => {
    if (filter.dataset.bound) return;
    filter.dataset.bound = 'true';
    filter.addEventListener('click', () => {
      document.querySelectorAll('#view-evaluaciones .filter').forEach((item) => item.classList.remove('active'));
      filter.classList.add('active');
      applyEvaluationFilters();
    });
  });
  document.querySelector('.search input').oninput = applyEvaluationFilters;
  applyEvaluationFilters();
}

function applyEvaluationFilters() {
  const filters = [...document.querySelectorAll('#view-evaluaciones .filter')];
  const index = filters.findIndex(f => f.classList.contains('active'));
  const statuses = [null, ['invited', 'in_progress'], ['to_review'], ['completed']][index];
  const search = document.querySelector('.search input').value.trim().toLocaleLowerCase();
  let count = 0;
  document.querySelectorAll('#view-evaluaciones .table-row').forEach(row => {
    const visible = (!statuses || statuses.includes(row.dataset.status)) && row.textContent.toLocaleLowerCase().includes(search);
    row.hidden = !visible;
    if (visible) count++;
  });
  document.querySelector('#filter-empty')?.remove();
  if (!count && workspaceEvaluations.length) document.querySelector('.table-body').insertAdjacentHTML('beforeend', '<p id="filter-empty" class="empty-directory">No hay evaluaciones que coincidan.</p>');
}

async function openRealEvaluation(evaluationId) {
  if (!confirmDiscardReviewNotes()) return;
  drawerContent.textContent = 'Cargando respuestas…';
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  const { data: evaluation, error: evaluationError } = await supabaseClient.from('evaluations').select('*, patients(full_name, email), batteries(name)').eq('id', evaluationId).single();
  if (evaluationError) {
    window.alert(`No se pudo abrir la evaluación: ${evaluationError.message}`);
    return;
  }
  const { data: responses, error: responsesError } = await supabaseClient.from('responses').select('id, answers, score, completed_at, module_id').eq('evaluation_id', evaluationId).order('completed_at');
  if (responsesError) {
    window.alert(`No se pudieron cargar las respuestas: ${responsesError.message}`);
    return;
  }
  const moduleIds = (responses || []).map((response) => response.module_id);
  const { data: modules } = moduleIds.length ? await supabaseClient.from('modules').select('id, name').in('id', moduleIds) : { data: [] };
  const moduleNames = new Map((modules || []).map((module) => [module.id, module.name]));
  const [label, tone] = statusLabel(evaluation.status);
  const patientName = evaluation.patients?.full_name || 'Paciente sin nombre';
  const batteryName = evaluation.batteries?.name || 'Batería sin nombre';
  const modulesHtml = (responses || []).map((response) => `<div class="drawer-module"><div><strong>${escapeHtml(moduleNames.get(response.module_id) || 'Módulo')}</strong><small>Puntaje: ${escapeHtml(String(response.score?.total ?? 'Sin puntaje'))}</small></div><span class="check">✓</span></div>`).join('');
  drawerContent.innerHTML = `<p class="eyebrow">Detalle de evaluación</p><h2>${escapeHtml(patientName)}</h2><p class="drawer-meta">${escapeHtml(batteryName)} · <span class="row-status ${tone}">${label}</span></p><div class="drawer-section"><h3>Respuestas recibidas</h3>${modulesHtml || '<p class="muted">Todavía no hay respuestas guardadas.</p>'}</div><div class="drawer-note">La interpretación clínica y las conclusiones quedan bajo tu revisión profesional.</div>`;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  if (evaluation.private_note) {
    const note = document.createElement('p');
    note.textContent = `Nota privada: ${evaluation.private_note}`;
    drawerContent.append(note);
  }
  const actionLabel = evaluation.status === 'to_review' ? 'Marcar como revisada' : evaluation.status === 'completed' ? 'Evaluación revisada' : 'Marcar como completada';
  for (const response of responses || []) {
    const section = document.createElement('section');
    section.className = 'drawer-section';
    section.innerHTML = '<h3>Respuestas por ítem</h3>' + Object.entries(response.answers || {}).map(([key, value]) => `<p>${escapeHtml(swlsQuestions[Number(key.replace('item_', '')) - 1] || key)}<br><strong>${escapeHtml(String(value))} / 7</strong></p>`).join('');
    drawerContent.append(section);
  }
  const actionDisabled = evaluation.status !== 'to_review' || !responses?.length ? ' disabled' : '';
  drawerContent.insertAdjacentHTML('beforeend', `<button class="primary-action drawer-status-action"${actionDisabled}>${actionLabel} <span>✓</span></button>`);
  drawerContent.querySelector('.drawer-status-action')?.addEventListener('click', () => updateEvaluationStatus(evaluationId));
  appendEvaluationManagement(evaluation);
}

async function updateEvaluationStatus(evaluationId) {
  const button = drawerContent.querySelector('.drawer-status-action');
  button.disabled = true;
  if (!await savePendingReviewNotes()) { button.disabled = false; return; }
  const { data, error } = await supabaseClient.rpc('review_evaluation', { target_evaluation_id: evaluationId });
  if (error || !data) {
    button.disabled = false;
    window.alert(`No se pudo actualizar el estado: ${error?.message || 'La evaluación cambió de estado.'}`);
    return;
  }
  closeDrawer();
  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (sessionData.session?.user) await loadEvaluations(sessionData.session.user.id);
  showView('evaluaciones');
}

function openPatientModal() {
  const modal = document.querySelector('#patient-modal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.querySelector('#patient-name')?.focus();
}

function closePatientModal() {
  const modal = document.querySelector('#patient-modal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.querySelector('#patient-form')?.reset();
  document.querySelector('#patient-message').textContent = '';
}

async function savePatient(event) {
  event.preventDefault();
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const message = document.querySelector('#patient-message');
  button.disabled = true;
  button.textContent = 'Guardando…';
  const { error } = await supabaseClient.from('patients').insert({
    professional_id: user.id,
    full_name: document.querySelector('#patient-name').value.trim(),
    email: document.querySelector('#patient-email').value.trim() || null,
    notes: document.querySelector('#patient-notes').value.trim() || null
  });
  button.disabled = false;
  button.innerHTML = 'Guardar paciente <span>→</span>';
  if (error) {
    message.textContent = `No se pudo guardar: ${error.message}`;
    return;
  }
  closePatientModal();
  await loadPatients(user.id);
  showView('pacientes');
}

async function initializeWorkspace(user) {
  if (workspaceInitialized) return;
  await ensureDefaultBattery(user.id);
  await loadPatients(user.id);
  await loadEvaluations(user.id);
  const modulesStep = document.querySelectorAll('.form-step')[1];
  if (modulesStep && !modulesStep.querySelector('[data-module="swls"]')) {
    const continueButton = modulesStep.querySelector('.next-step');
    const option = document.createElement('label');
    option.className = 'module-option';
    option.dataset.module = 'swls';
    option.innerHTML = '<input type="checkbox" checked /><span><strong>Satisfacción con la vida (SWLS)</strong><small>5 ítems · escala de acuerdo de 1 a 7</small></span>';
    modulesStep.insertBefore(option, continueButton);
  }
  const patientHeader = document.querySelector('#view-pacientes .page-heading');
  if (patientHeader && !document.querySelector('[data-action="new-patient"]')) {
    const actions = document.createElement('div');
    actions.className = 'heading-actions';
    actions.style.cssText = 'display:flex;gap:9px;align-items:center;flex-wrap:wrap';
    actions.innerHTML = '<button class="outline-action" style="border:1px solid #b6c9bf;color:#164b52;background:#fffefa" data-action="new-patient">＋ Nuevo paciente</button><button class="primary-action" data-view="nueva"><span>＋</span> Nueva evaluación</button>';
    patientHeader.querySelector('.primary-action')?.remove();
    patientHeader.appendChild(actions);
    actions.querySelector('[data-action="new-patient"]').addEventListener('click', openPatientModal);
    actions.querySelector('[data-view="nueva"]').addEventListener('click', () => showView('nueva'));
  }
  document.querySelector('#patient-form')?.addEventListener('submit', savePatient);
  document.querySelector('.modal-close')?.addEventListener('click', closePatientModal);
  document.querySelector('.modal-scrim')?.addEventListener('click', closePatientModal);
  configureSwlsWorkflow();
  workspaceInitialized = true;
}

if (supabaseClient && !isPatientMode) {
  supabaseClient.auth.getSession().then(({ data }) => showAuthenticatedApp(data.session));
  supabaseClient.auth.onAuthStateChange((_event, session) => { setTimeout(() => showAuthenticatedApp(session), 0); });
  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.querySelector('#auth-email').value.trim();
    const password = document.querySelector('#auth-password').value;
    const button = authForm.querySelector('button');
    button.disabled = true;
    button.textContent = 'Entrando…';
    setAuthMessage('');
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    button.disabled = false;
    button.innerHTML = 'Entrar <span>→</span>';
    if (error) setAuthMessage('No pudimos iniciar sesión. Revisá el email y la contraseña.');
  });
} else if (!isPatientMode) {
  authScreen?.classList.add('visible');
  setAuthMessage('No se pudo cargar la conexión. Recargá la página para volver a intentar.');
}

const navItems = [...document.querySelectorAll('[data-view]')];
const breadcrumb = document.querySelector('#breadcrumb-current');
const names = { inicio: 'Inicio', evaluaciones: 'Evaluaciones', baterias: 'Baterías', pacientes: 'Pacientes', nueva: 'Nueva evaluación' };

function showView(name) {
  if (name === 'nueva') resetWizard();
  views.forEach((view) => view.classList.toggle('active-view', view.id === `view-${name}`));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === name));
  breadcrumb.textContent = names[name] || 'Inicio';
  window.location.hash = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((item) => item.addEventListener('click', () => showView(item.dataset.view)));

const drawer = document.querySelector('#detail-drawer');
const drawerContent = document.querySelector('#drawer-content');
const people = {
  maria: { initials: 'MG', tone: 'peach', name: 'María González', battery: 'Batería inicial', status: 'Para revisar', note: 'Hay respuestas nuevas para revisar. La técnica proyectiva todavía no fue interpretada.', modules: [['Entrevista inicial', 'Completada'], ['Datos sociodemográficos', 'Completada'], ['Cuestionario de ansiedad', 'Completado'], ['Técnica proyectiva', 'Pendiente']] },
  juan: { initials: 'JP', tone: 'blue', name: 'Juan Pérez', battery: 'Ansiedad y funcionamiento', status: 'En progreso', note: 'La persona completó 2 de 3 módulos.', modules: [['Datos sociodemográficos', 'Completado'], ['Cuestionario de ansiedad', 'Completado'], ['Funcionamiento cotidiano', 'Pendiente']] },
  sofia: { initials: 'SL', tone: 'green', name: 'Sofía López', battery: 'Entrevista inicial', status: 'Completa', note: 'Evaluación lista para incorporar a la historia clínica.', modules: [['Entrevista inicial', 'Completada']] }
};

document.querySelectorAll('[data-detail]').forEach((row) => row.addEventListener('click', () => {
  const person = people[row.dataset.detail];
  drawerContent.innerHTML = `<p class="eyebrow">Detalle de evaluación</p><h2>${person.name}</h2><p class="drawer-meta">${person.battery} · <span class="row-status ${person.status === 'Completa' ? 'done' : person.status === 'En progreso' ? 'progress' : 'review'}">${person.status}</span></p><div class="drawer-section"><h3>Módulos</h3>${person.modules.map(([title, status]) => `<div class="drawer-module"><div><strong>${title}</strong><small>${status}</small></div><span class="check">${status === 'Pendiente' ? '○' : '✓'}</span></div>`).join('')}</div><div class="drawer-note">${person.note}</div><button class="primary-action" style="margin-top:24px">Abrir evaluación <span>→</span></button>`;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}));

function closeDrawer() {
  if (!confirmDiscardReviewNotes()) return;
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
  drawerContent.replaceChildren();
}
document.querySelector('.close-drawer').addEventListener('click', closeDrawer);
document.querySelector('.drawer-scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

let currentStep = 0;
const formSteps = [...document.querySelectorAll('.form-step')];
const steps = [...document.querySelectorAll('.step')];
document.querySelectorAll('.next-step').forEach((button) => button.addEventListener('click', () => {
  if (!document.querySelector('#evaluation-patient')?.value) { window.alert('Primero elegí un paciente guardado.'); return; }
  currentStep = Math.min(currentStep + 1, formSteps.length - 1);
  formSteps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
  steps.forEach((step, index) => step.classList.toggle('active', index <= currentStep));
}));
document.querySelector('.finish-step').addEventListener('click', () => {
  createEvaluation().catch(error => {
    const button = document.querySelector('.finish-step');
    button.disabled = false;
    button.textContent = 'Reintentar';
    window.alert(`No se pudo terminar la operación: ${error.message}`);
  });
});

function generateAccessToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashAccessToken(token) {
  const encoded = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createEvaluation() {
  const button = document.querySelector('.finish-step');
  const patientId = document.querySelector('#evaluation-patient').value;
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || !patientId || button.disabled) return;
  button.disabled = true;
  button.textContent = 'Guardando…';
  const patient = workspacePatients.find((candidate) => candidate.id === patientId);
  if (!patient) {
    button.disabled = false;
    button.innerHTML = 'Guardar y generar acceso <span>→</span>';
    window.alert('No encontramos ese paciente. Elegilo de la lista o guardalo primero desde Pacientes.');
    return;
  }
  const batteryId = await ensureDefaultBattery(user.id);
  const accessToken = generateAccessToken();
  const accessTokenHash = await hashAccessToken(accessToken);
  const { error } = await supabaseClient.from('evaluations').insert({ professional_id: user.id, patient_id: patient.id, battery_id: batteryId, private_note: formSteps[0].querySelector('textarea').value.trim() || null, access_token_hash: accessTokenHash, status: 'invited' });
  button.disabled = false;
  if (error) {
    button.innerHTML = 'Guardar y generar acceso <span>→</span>';
    window.alert(`No se pudo crear la evaluación: ${error.message}`);
    return;
  }
  button.innerHTML = 'Evaluación guardada <span>✓</span>';
  button.disabled = true;
  button.style.background = '#688f5b';
  const accessLink = `${window.location.origin}${window.location.pathname}?access=${encodeURIComponent(accessToken)}`;
  renderLinkSharing(button.parentElement, accessLink, patient.email);
  await loadEvaluations(user.id);
}

function renderPatientLoading() {
  document.body.insertAdjacentHTML('beforeend', '<main class="patient-shell"><div class="patient-wrap"><div class="patient-brand"><span class="brand-mark">ft</span><span><strong>Evaluaciones</strong><small>espacio privado</small></span></div><p class="muted">Cargando tu evaluación…</p></div></main>');
}

function renderPatientError(message) {
  document.querySelector('.patient-shell')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<main class="patient-shell"><div class="patient-wrap"><div class="patient-brand"><span class="brand-mark">ft</span><span><strong>Evaluaciones</strong><small>espacio privado</small></span></div><section class="patient-card"><div class="patient-error">${escapeHtml(message)}</div></section><p class="patient-footer">Si creés que esto es un error, contactá a tu profesional.</p></div></main>`);
}

function renderPatientEvaluation(evaluation, token) {
  if (!['invited', 'in_progress'].includes(evaluation.evaluation_status)) {
    renderPatientError('Esta evaluación ya fue enviada o está cerrada. No se admiten nuevas respuestas.');
    return;
  }
  const modules = Array.isArray(evaluation.modules) ? evaluation.modules : [];
  const swls = modules.find((module) => module.config?.instrument === 'SWLS' || module.name.includes('Satisfacción'));
  if (!swls) {
    renderPatientError('Esta evaluación todavía no tiene un cuestionario disponible.');
    return;
  }
  const questions = swls.config?.questions?.length ? swls.config.questions : swlsQuestions;
  const questionsHtml = questions.map((question, index) => `<div class="patient-question"><p>${index + 1}. ${escapeHtml(question)}</p><div class="patient-scale">${[1, 2, 3, 4, 5, 6, 7].map((value) => `<label><input type="radio" name="swls-${index}" value="${value}" required /><span>${value}</span></label>`).join('')}</div><div class="patient-scale-legend"><span>Muy en desacuerdo</span><span>Muy de acuerdo</span></div></div>`).join('');
  document.querySelector('.patient-shell')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<main class="patient-shell"><div class="patient-wrap"><div class="patient-brand"><span class="brand-mark">ft</span><span><strong>Evaluaciones</strong><small>espacio privado</small></span></div><section class="patient-hero"><p class="eyebrow">Evaluación psicológica</p><h1>Hola, ${escapeHtml(evaluation.patient_name)}.</h1><p>Vamos a recorrer algunos aspectos de tu experiencia actual. No hay respuestas correctas o incorrectas: respondé según cómo te sentís.</p></section><section class="patient-card"><h2>Satisfacción con la vida</h2><p class="muted">Indicá cuánto estás de acuerdo con cada afirmación.</p><div class="patient-progress"><i></i></div><form id="patient-test-form">${questionsHtml}<div class="patient-note">Tus respuestas serán recibidas por tu profesional para revisarlas dentro de tu proceso de evaluación.</div><button class="primary-action patient-submit" type="submit">Enviar respuestas <span>→</span></button><p class="form-message" id="patient-form-message"></p></form></section><p class="patient-footer">${escapeHtml(evaluation.battery_name)} · Espacio privado</p></div></main>`);
  document.querySelector('#patient-test-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    const message = document.querySelector('#patient-form-message');
    const answers = {};
    questions.forEach((_question, index) => {
      answers[`item_${index + 1}`] = Number(event.currentTarget.querySelector(`input[name="swls-${index}"]:checked`).value);
    });
    const total = Object.values(answers).reduce((sum, value) => sum + value, 0);
    button.disabled = true;
    button.textContent = 'Enviando…';
    const { error: saveError } = await supabaseClient.rpc('save_patient_response', { access_token: token, target_module_id: swls.id, response_answers: answers, response_score: { total, min: 5, max: 35, instrument: 'SWLS' } });
    if (saveError) {
      button.disabled = false;
      button.innerHTML = 'Enviar respuestas <span>→</span>';
      message.textContent = `No se pudieron guardar las respuestas: ${saveError.message}`;
      return;
    }
    const { data: completed, error: completeError } = await supabaseClient.rpc('complete_patient_evaluation', { access_token: token });
    if (completeError || !completed) {
      button.disabled = false;
      button.textContent = 'Reintentar envío';
      message.textContent = 'Las respuestas se guardaron, pero falta confirmar el envío. Intentá nuevamente.';
      return;
    }
    document.querySelector('.patient-card').innerHTML = '<div class="patient-success"><div class="success-mark">✓</div><h2>Respuestas enviadas</h2><p class="muted">Tu profesional ya puede revisarlas. Podés cerrar esta ventana.</p></div>';
  });
}

async function initializePatientApp() {
  document.querySelector('.app-shell')?.remove();
  document.querySelector('#auth-screen')?.remove();
  renderPatientLoading();
  const { data, error } = await supabaseClient.rpc('get_patient_evaluation', { access_token: patientAccessToken });
  if (error) {
    renderPatientError('No se pudo cargar la evaluación. Es posible que todavía no se haya activado el acceso para pacientes.');
    return;
  }
  const evaluation = Array.isArray(data) ? data[0] : data;
  if (!evaluation) {
    renderPatientError('El enlace no es válido o la evaluación ya no está disponible.');
    return;
  }
  renderPatientEvaluation(evaluation, patientAccessToken);
}

const hash = window.location.hash.slice(1);
if (names[hash]) showView(hash);
if (isPatientMode && supabaseClient) initializePatientApp();
