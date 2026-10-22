const clone = x => structuredClone(x);
export const currentTrial = session => session.trials[session.index];
export const currentItem = (session, bank) => bank[session.module].items.find(x => x.id === currentTrial(session).itemId);
export const maxHint = session => session.config.integrated && session.config.mode === 'practice' ? 4 : 3;

export function createSession(module, config, itemIds, version, now = Date.now()) {
  const id = globalThis.crypto?.randomUUID?.() || `s-${now}-${Math.random().toString(36).slice(2)}`;
  return {
    schemaVersion: '1.0', contentVersion: version, sessionId: id, module, config: clone(config),
    formId: config.mode === 'check' ? 'check-demo' : 'practice-demo', startedAt: now,
    status: 'loading', index: 0, partial: false, priorExposures: [],
    trials: itemIds.map((itemId, i) => ({trialInstanceId:`${id}:${i}`, itemId, presented:false,
      attempts:[], hintLevel:0, hintLevelsSeen:[], hintsSeen:[], outcome:null,
      firstCorrectLevel:null, usedContextHint:false, activeTotalMs:0, evidence:null, report:''}))
  };
}

// El reloj se inyecta: la lógica no depende del DOM ni de intervalos.
export function transition(session, event, item) {
  if (!session || session.status === 'completed') return session;
  const trial = currentTrial(session);
  if (event.trialInstanceId && event.trialInstanceId !== trial.trialInstanceId) return session;
  const next = clone(session), t = currentTrial(next);
  const time = () => {
    const ms = Math.max(0, Number(event.activeMs) || 0);
    t.activeTotalMs += ms; return ms;
  };
  if (event.type === 'READY' && session.status === 'loading') { next.status = 'active'; t.presented = true; }
  else if (event.type === 'LOAD_ERROR' && session.status === 'loading') next.status = 'load_error';
  else if (event.type === 'RETRY' && session.status === 'load_error') next.status = 'loading';
  else if (event.type === 'PAUSE' && ['active', 'feedback'].includes(session.status)) { next.resumeStatus = session.status; next.status = 'paused'; time(); }
  else if (event.type === 'RESUME' && session.status === 'paused') { next.status = session.resumeStatus; delete next.resumeStatus; }
  else if (event.type === 'TICK' && session.status === 'active') time();
  else if (event.type === 'HINT' && session.status === 'active' && session.module === 'hints' && t.hintLevel < maxHint(session)) {
    time(); t.hintLevel++; t.hintLevelsSeen.push(t.hintLevel);
    const kind = t.hintLevel === 4 ? 'contextual' : (session.config.stimulusMode === 'descriptive' ? 'descriptive' : 'facial');
    t.hintsSeen.push({level:t.hintLevel, kind}); if (kind === 'contextual') t.usedContextHint = true;
  }
  else if (event.type === 'ANSWER' && session.status === 'active' && !t.outcome) {
    const expected = session.module === 'presence' ? item.expectedResponse : (item.expectedEmotion || item.expectedAnswer);
    const allowed = session.module === 'presence' ? ['yes', 'no', 'uncertain'] : ['alegria', 'tristeza', 'miedo', 'ira', 'asco', 'sorpresa', ...(session.module === 'process' ? ['insufficient_information'] : [])];
    if (!allowed.includes(event.answer) || (session.module === 'hints' && t.attempts.some(x => x.level === t.hintLevel))) return session;
    const correct = event.answer === expected;
    t.attempts.push({answer:event.answer, level:t.hintLevel, correct, activeMs:time(), hintsSeen:clone(t.hintsSeen)});
    t.evidence = event.evidence || null;
    if (session.module !== 'hints' || correct || t.hintLevel === maxHint(session)) {
      t.outcome = event.answer === 'uncertain' ? 'uncertain' : correct ? 'correct' : 'incorrect';
      if (correct) t.firstCorrectLevel = t.hintLevel;
      next.status = 'feedback';
    }
  }
  else if (['OMIT', 'REVEAL'].includes(event.type) && session.status === 'active' && !t.outcome && (event.type !== 'REVEAL' || session.module === 'hints')) {
    time(); t.outcome = event.type === 'OMIT' ? 'omitted' : 'revealed'; next.status = 'feedback';
  }
  else if (event.type === 'REPORT' && t.outcome && typeof event.text === 'string') t.report = event.text.slice(0, 600);
  else if (event.type === 'NEXT' && session.status === 'feedback') {
    if (session.index + 1 === session.trials.length) { next.status = 'completed'; next.completedAt = event.now; }
    else { next.index++; next.status = 'loading'; }
  }
  else if (event.type === 'END') {
    if (session.status === 'active') time();
    next.status = 'completed'; next.partial = next.trials.some(x => !x.outcome); next.completedAt = event.now;
  }
  else return session;
  return next;
}
