export const ratio = (a, b) => b ? a / b : null;
export const percent = value => value === null ? 'Sin datos' : `${Math.round(value * 100)} %`;

export function score(session, bank) {
  const trials = session.trials.filter(t => t.presented);
  const base = {planned:session.trials.length, presented:trials.length, completed:trials.filter(t => t.outcome).length,
    omitted:trials.filter(t => t.outcome === 'omitted').length, uncertain:trials.filter(t => t.outcome === 'uncertain').length,
    interrupted:trials.filter(t => !t.outcome).length};
  const itemFor = t => bank[session.module].items.find(x => x.id === t.itemId);
  if (session.module === 'presence') {
    const summarize = list => {
      const positive = list.filter(t => itemFor(t).expectedResponse === 'yes');
      const negative = list.filter(t => itemFor(t).expectedResponse === 'no');
      const hits = positive.filter(t => t.attempts[0]?.answer === 'yes').length;
      const rejects = negative.filter(t => t.attempts[0]?.answer === 'no').length;
      const sensitivity = ratio(hits, positive.length), specificity = ratio(rejects, negative.length);
      return {positive:positive.length, negative:negative.length, hits, rejects,
        falseAlarms:negative.filter(t => t.attempts[0]?.answer === 'yes').length,
        misses:positive.filter(t => t.attempts[0]?.answer === 'no').length, sensitivity, specificity,
        balanced:sensitivity === null || specificity === null ? null : (sensitivity + specificity) / 2};
    };
    return {...base, ...summarize(trials), byEmotion:Object.fromEntries(bank.emotions.items.map(e => [e.id, summarize(trials.filter(t => itemFor(t).targetEmotion === e.id))])),
      byNegativeType:Object.fromEntries(['neutral', 'other'].map(type => [type, summarize(trials.filter(t => itemFor(t).negativeType === type))]))};
  }
  if (session.module === 'hints') {
    const solved = trials.filter(t => t.outcome === 'correct');
    return {...base, initial:solved.filter(t => t.firstCorrectLevel === 0).length,
      facial:solved.filter(t => t.firstCorrectLevel > 0 && !t.usedContextHint && session.config.stimulusMode === 'visual').length,
      descriptive:solved.filter(t => t.firstCorrectLevel > 0 && !t.usedContextHint && session.config.stimulusMode === 'descriptive').length,
      contextual:solved.filter(t => t.usedContextHint).length,
      previousErrors:trials.flatMap(t => t.attempts).filter(a => !a.correct).length,
      revealed:trials.filter(t => t.outcome === 'revealed').length, unresolved:trials.length - solved.length,
      levels:[0, 1, 2, 3, 4].map(level => solved.filter(t => t.firstCorrectLevel === level).length),
      byEmotion:Object.fromEntries(bank.emotions.items.map(e => [e.id, {presented:trials.filter(t => itemFor(t).expectedEmotion === e.id).length, correct:solved.filter(t => itemFor(t).expectedEmotion === e.id).length}]))};
  }
  const summarize = list => ({presented:list.length, correct:list.filter(t => t.outcome === 'correct').length, accuracy:ratio(list.filter(t => t.outcome === 'correct').length, list.length)});
  return {...base, clear:summarize(trials.filter(t => itemFor(t).expectedAnswer !== 'insufficient_information')),
    insufficient:summarize(trials.filter(t => itemFor(t).expectedAnswer === 'insufficient_information')),
    byEmotion:Object.fromEntries(bank.emotions.items.map(e => [e.id, summarize(trials.filter(t => itemFor(t).expectedAnswer === e.id))])),
    confusions:trials.filter(t => t.outcome === 'incorrect').map(t => ({expected:itemFor(t).expectedAnswer, chosen:t.attempts.at(-1)?.answer, itemId:t.itemId}))};
}
