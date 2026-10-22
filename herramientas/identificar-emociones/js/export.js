import {score} from './scoring.js';
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportJSON(session, bank) {
  return JSON.stringify({exportVersion:'1.0', session, summary:score(session, bank)}, null, 2);
}
export function exportCSV(session) {
  const headers = ['schemaVersion','contentVersion','sessionId','module','mode','stimulusMode','formId','seed','partial','trialInstanceId','itemId','presented','outcome','attempt','answer','correct','hintLevel','hintsSeen','firstCorrectLevel','usedContextHint','activeMs','activeTotalMs','evidence','report'];
  const rows = session.trials.flatMap(t => (t.attempts.length ? t.attempts : [null]).map((a, i) => [session.schemaVersion,session.contentVersion,session.sessionId,session.module,session.config.mode,session.config.stimulusMode,session.formId,session.config.seed,session.partial || session.status !== 'completed',t.trialInstanceId,t.itemId,t.presented,t.outcome,a ? i+1 : null,a?.answer,a?.correct,a?.level,JSON.stringify(a?.hintsSeen ?? t.hintsSeen),t.firstCorrectLevel,t.usedContextHint,a?.activeMs,t.activeTotalMs,t.evidence,t.report]));
  return '\uFEFF' + [headers,...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function download(text, filename, type) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
