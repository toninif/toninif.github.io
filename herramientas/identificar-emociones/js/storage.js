export const STORAGE_KEY = 'ft-emociones:v1';
export function saveProgress(session, storage) {
  try { (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, JSON.stringify(session)); return true; } catch { return false; }
}
export function readProgress(storage) {
  try { const value = (storage ?? globalThis.localStorage).getItem(STORAGE_KEY); return value ? {session:JSON.parse(value)} : {}; }
  catch { return {error:'No se pudo leer el progreso guardado. Podés seguir en memoria.'}; }
}
export function clearProgress(storage) {
  try { (storage ?? globalThis.localStorage).removeItem(STORAGE_KEY); return true; } catch { return false; }
}
export function validateSaved(session, bank) {
  if (!session || session.schemaVersion !== '1.0' || session.contentVersion !== bank.manifest.contentVersion) return false;
  if (!['presence', 'hints', 'process'].includes(session.module) || !session.config || !Array.isArray(session.trials) || !session.trials.length) return false;
  if (!['loading', 'active', 'feedback', 'paused', 'load_error', 'completed'].includes(session.status)) return false;
  if (!Number.isInteger(session.index) || session.index < 0 || session.index >= session.trials.length) return false;
  if (!['practice','check','demonstration'].includes(session.config.mode) || typeof session.config.seed !== 'string' || !Array.isArray(session.priorExposures)) return false;
  if (session.status === 'paused' && !['active','feedback','loading'].includes(session.resumeStatus)) return false;
  if (!['visual','descriptive','text'].includes(session.config.stimulusMode)) return false;
  if (session.module !== 'process' && session.config.mode === 'check') return false;
  if (new Set(session.trials.map(t => t?.trialInstanceId)).size !== session.trials.length || new Set(session.trials.map(t => t?.itemId)).size !== session.trials.length) return false;
  const allowed = session.module === 'presence' ? ['yes','no','uncertain'] : ['alegria','tristeza','miedo','ira','asco','sorpresa',...(session.module === 'process' ? ['insufficient_information'] : [])];
  const valid = session.trials.every(t => t && bank[session.module].items.some(i => i.id === t.itemId) &&
    typeof t.trialInstanceId === 'string' && typeof t.presented === 'boolean' && typeof t.report === 'string' &&
    Array.isArray(t.attempts) && t.attempts.every(a => a && allowed.includes(a.answer) && typeof a.correct === 'boolean' && Number.isInteger(a.level) && a.level >= 0 && a.level <= 4 && Array.isArray(a.hintsSeen) && Number.isFinite(a.activeMs) && a.activeMs >= 0) &&
    Array.isArray(t.hintsSeen) && t.hintsSeen.every(h => h && Number.isInteger(h.level) && h.level > 0 && h.level <= 4 && ['facial','descriptive','contextual'].includes(h.kind)) &&
    Array.isArray(t.hintLevelsSeen) && Number.isInteger(t.hintLevel) && t.hintLevel >= 0 && t.hintLevel <= 4 &&
    Number.isFinite(t.activeTotalMs) && t.activeTotalMs >= 0 && [null,'correct','incorrect','uncertain','omitted','revealed'].includes(t.outcome));
  if (!valid) return false;
  if (session.status === 'feedback' && !session.trials[session.index].outcome) return false;
  return true;
}
export function restoreProgress(saved, bank) {
  if (!validateSaved(saved, bank)) throw Error('La versión o los datos guardados no son compatibles. Exportalos o borrá ese progreso para empezar.');
  const session = structuredClone(saved);
  if (!['completed', 'paused'].includes(session.status)) {
    session.resumeStatus = session.status === 'feedback' ? 'feedback' : 'loading'; session.status = 'paused';
  }
  if (session.status === 'paused' && session.resumeStatus === 'active') session.resumeStatus = 'loading';
  return session;
}
