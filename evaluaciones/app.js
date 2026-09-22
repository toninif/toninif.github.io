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
  if (!session) {
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
    return `<div class="directory-row"><div class="patient-cell"><div class="patient-avatar blue">${initials}</div><strong>${patient.full_name}</strong></div><span>0 evaluaciones</span><span>${patient.email || 'Sin email'}</span></div>`;
  }).join('');
  directory.innerHTML = `<div class="directory-head">Paciente <span>Evaluaciones</span><span>Contacto</span></div>${rows || '<div class="empty-directory">Todavía no hay pacientes. Creá el primero para iniciar una evaluación.</div>'}`;
  const patientInput = document.querySelectorAll('.form-step')[0]?.querySelector('input');
  if (patientInput) {
    patientInput.setAttribute('list', 'patient-options');
    let datalist = document.querySelector('#patient-options');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'patient-options';
      patientInput.after(datalist);
    }
    datalist.innerHTML = workspacePatients.map((patient) => `<option value="${escapeHtml(patient.full_name)}"></option>`).join('');
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
  const { data, error } = await supabaseClient.from('evaluations').select('id, status, created_at, patients(full_name), batteries(name)').eq('professional_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  const evaluations = data || [];
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
    return { id: evaluation.id, name, battery, initials, label, tone, date };
  });
  if (table) table.innerHTML = rows.map((row) => `<button class="table-row" data-real-evaluation="${row.id}"><div class="patient-cell"><div class="patient-avatar blue">${escapeHtml(row.initials)}</div><strong>${escapeHtml(row.name)}</strong></div><span>${escapeHtml(row.battery)}</span><span class="row-status ${row.tone}">${row.label}</span><span>${row.date}</span><b>›</b></button>`).join('');
  if (recent) recent.innerHTML = rows.slice(0, 5).map((row) => `<button class="evaluation-row" data-real-evaluation="${row.id}"><div class="patient-avatar blue">${escapeHtml(row.initials)}</div><div class="evaluation-info"><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.battery)}</span></div><div class="row-status ${row.tone}">${row.label}</div><div class="row-date">${row.date} <b>›</b></div></button>`).join('');
  document.querySelectorAll('[data-real-evaluation]').forEach((row) => row.addEventListener('click', () => openRealEvaluation(row.dataset.realEvaluation)));
}

function updateDashboardStats(evaluations) {
  const active = evaluations.filter((evaluation) => evaluation.status !== 'archived').length;
  const toReview = evaluations.filter((evaluation) => evaluation.status === 'to_review').length;
  const now = new Date();
  const completedThisMonth = evaluations.filter((evaluation) => {
    const date = new Date(evaluation.created_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && ['completed', 'to_review'].includes(evaluation.status);
  }).length;
  const stats = document.querySelectorAll('#view-inicio .signal-card strong');
  if (stats[0]) stats[0].textContent = active;
  if (stats[1]) stats[1].textContent = toReview;
  if (stats[2]) stats[2].textContent = completedThisMonth;
  const filters = document.querySelectorAll('#view-evaluaciones .filter b');
  if (filters[0]) filters[0].textContent = evaluations.length;
  if (filters[1]) filters[1].textContent = evaluations.filter((evaluation) => ['invited', 'in_progress'].includes(evaluation.status)).length;
  if (filters[2]) filters[2].textContent = toReview;
  if (filters[3]) filters[3].textContent = evaluations.filter((evaluation) => evaluation.status === 'completed').length;
}

async function openRealEvaluation(evaluationId) {
  const { data: evaluation, error: evaluationError } = await supabaseClient.from('evaluations').select('id, status, created_at, patients(full_name), batteries(name)').eq('id', evaluationId).single();
  if (evaluationError) {
    window.alert(`No se pudo abrir la evaluación: ${evaluationError.message}`);
    return;
  }
  const { data: responses, error: responsesError } = await supabaseClient.from('responses').select('id, score, completed_at, module_id').eq('evaluation_id', evaluationId).order('completed_at');
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
  workspaceInitialized = true;
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
}

if (supabaseClient) {
  supabaseClient.auth.getSession().then(({ data }) => showAuthenticatedApp(data.session));
  supabaseClient.auth.onAuthStateChange((_event, session) => showAuthenticatedApp(session));
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
  authScreen?.classList.remove('visible');
}

const navItems = [...document.querySelectorAll('[data-view]')];
const breadcrumb = document.querySelector('#breadcrumb-current');
const names = { inicio: 'Inicio', evaluaciones: 'Evaluaciones', baterias: 'Baterías', pacientes: 'Pacientes', nueva: 'Nueva evaluación' };

function showView(name) {
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

function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
document.querySelector('.close-drawer').addEventListener('click', closeDrawer);
document.querySelector('.drawer-scrim').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

let currentStep = 0;
const formSteps = [...document.querySelectorAll('.form-step')];
const steps = [...document.querySelectorAll('.step')];
document.querySelectorAll('.next-step').forEach((button) => button.addEventListener('click', () => {
  currentStep = Math.min(currentStep + 1, formSteps.length - 1);
  formSteps.forEach((step, index) => step.classList.toggle('active', index === currentStep));
  steps.forEach((step, index) => step.classList.toggle('active', index <= currentStep));
}));
document.querySelector('.finish-step').addEventListener('click', () => {
  createEvaluation();
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
  const patientName = document.querySelectorAll('.form-step')[0].querySelector('input').value.trim();
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || !patientName) return;
  button.disabled = true;
  button.textContent = 'Guardando…';
  const normalizedName = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
  const patient = workspacePatients.find((candidate) => normalizedName(candidate.full_name) === normalizedName(patientName));
  if (!patient) {
    button.disabled = false;
    button.innerHTML = 'Guardar y generar acceso <span>→</span>';
    window.alert('No encontramos ese paciente. Elegilo de la lista o guardalo primero desde Pacientes.');
    return;
  }
  const batteryId = await ensureDefaultBattery(user.id);
  const accessToken = generateAccessToken();
  const accessTokenHash = await hashAccessToken(accessToken);
  const { error } = await supabaseClient.from('evaluations').insert({ professional_id: user.id, patient_id: patient.id, battery_id: batteryId, access_token_hash: accessTokenHash, status: 'invited' });
  button.disabled = false;
  if (error) {
    button.innerHTML = 'Guardar y generar acceso <span>→</span>';
    window.alert(`No se pudo crear la evaluación: ${error.message}`);
    return;
  }
  button.innerHTML = 'Evaluación guardada <span>✓</span>';
  button.style.background = '#688f5b';
  const accessLink = `${window.location.origin}${window.location.pathname}?access=${encodeURIComponent(accessToken)}`;
  button.insertAdjacentHTML('afterend', `<div class="access-link-result"><strong>Enlace privado listo</strong><code>${accessLink}</code><button type="button" class="copy-access-link" data-link="${accessLink}">Copiar enlace</button></div>`);
  document.querySelector('.copy-access-link').addEventListener('click', async (event) => {
    await navigator.clipboard.writeText(event.currentTarget.dataset.link);
    event.currentTarget.textContent = 'Enlace copiado';
  });
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
    await supabaseClient.rpc('complete_patient_evaluation', { access_token: token });
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
