const views = [...document.querySelectorAll('.view')];
const supabaseConfig = window.EVALUACIONES_SUPABASE;
const supabaseClient = supabaseConfig && window.supabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.publishableKey)
  : null;

if (supabaseClient) {
  window.evaluacionesSupabase = supabaseClient;
  console.info('Supabase conectado. Falta ejecutar el esquema y agregar autenticación.');
} else {
  console.info('Modo demo: no hay configuración de Supabase disponible.');
}

const authScreen = document.querySelector('#auth-screen');
const authForm = document.querySelector('#auth-form');
const authMessage = document.querySelector('#auth-message');
let workspaceInitialized = false;

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
  if (existing) return existing.id;
  const { data: battery, error: batteryError } = await supabaseClient
    .from('batteries').insert({ professional_id: userId, name: 'Batería inicial', description: 'Batería inicial de evaluación', estimated_minutes: 35 }).select('id').single();
  if (batteryError) throw batteryError;
  const modules = [
    ['Entrevista inicial', 'Antecedentes y motivo de consulta', 1],
    ['Datos sociodemográficos', 'Contexto personal y cotidiano', 2],
    ['Cuestionario de ansiedad', 'Escala breve de auto-reporte', 3]
  ].map(([name, description, position]) => ({ battery_id: battery.id, name, description, position }));
  const { error: modulesError } = await supabaseClient.from('modules').insert(modules);
  if (modulesError) throw modulesError;
  return battery.id;
}

async function loadPatients(userId) {
  const { data, error } = await supabaseClient.from('patients').select('id, full_name, email, created_at').eq('professional_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  const directory = document.querySelector('.patient-directory');
  if (!directory) return;
  const rows = (data || []).map((patient) => {
    const initials = patient.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    return `<div class="directory-row"><div class="patient-cell"><div class="patient-avatar blue">${initials}</div><strong>${patient.full_name}</strong></div><span>0 evaluaciones</span><span>${patient.email || 'Sin email'}</span></div>`;
  }).join('');
  directory.innerHTML = `<div class="directory-head">Paciente <span>Evaluaciones</span><span>Contacto</span></div>${rows || '<div class="empty-directory">Todavía no hay pacientes. Creá el primero para iniciar una evaluación.</div>'}`;
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
  const patientHeader = document.querySelector('#view-pacientes .page-heading');
  if (patientHeader && !document.querySelector('[data-action="new-patient"]')) {
    const actions = document.createElement('div');
    actions.className = 'heading-actions';
    actions.innerHTML = '<button class="outline-action" data-action="new-patient">＋ Nuevo paciente</button><button class="primary-action" data-view="nueva"><span>＋</span> Nueva evaluación</button>';
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
} else {
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

async function createEvaluation() {
  const button = document.querySelector('.finish-step');
  const patientName = document.querySelectorAll('.form-step')[0].querySelector('input').value.trim();
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || !patientName) return;
  button.disabled = true;
  button.textContent = 'Guardando…';
  const { data: patient, error: patientError } = await supabaseClient.from('patients').select('id').eq('professional_id', user.id).eq('full_name', patientName).maybeSingle();
  if (patientError || !patient) {
    button.disabled = false;
    button.innerHTML = 'Guardar y generar acceso <span>→</span>';
    window.alert(patientError ? `No se pudo buscar el paciente: ${patientError.message}` : 'No encontramos ese paciente. Primero guardalo desde Pacientes.');
    return;
  }
  const batteryId = await ensureDefaultBattery(user.id);
  const { error } = await supabaseClient.from('evaluations').insert({ professional_id: user.id, patient_id: patient.id, battery_id: batteryId, status: 'draft' });
  button.disabled = false;
  if (error) {
    button.innerHTML = 'Guardar y generar acceso <span>→</span>';
    window.alert(`No se pudo crear la evaluación: ${error.message}`);
    return;
  }
  button.innerHTML = 'Evaluación guardada <span>✓</span>';
  button.style.background = '#688f5b';
  showView('evaluaciones');
}

const hash = window.location.hash.slice(1);
if (names[hash]) showView(hash);
