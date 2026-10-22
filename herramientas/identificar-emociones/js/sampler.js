export const EMOTIONS = ['alegria', 'tristeza', 'miedo', 'ira', 'asco', 'sorpresa'];

export function random(seed) {
  let value = [...String(seed)].reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

export function sample(bank, module, config) {
  const rng = random(config.seed);
  if (module !== 'process' && config.mode === 'check') throw Error('El banco facial de demostración no admite comprobación.');
  const split = module === 'process' && config.mode === 'check' ? 'check' : 'practice';
  const pool = bank[module].items.filter(x => x.split === split &&
    (!config.excludedIdentityIds?.includes(bank.faces.items.find(f => f.id === x.faceId)?.identityId)));
  let chosen;
  if (module === 'process') {
    chosen = EMOTIONS.flatMap(key => shuffle(pool.filter(x => x.expectedAnswer === key), rng).slice(0, 2));
    chosen.push(...shuffle(pool.filter(x => x.expectedAnswer === 'insufficient_information'), rng).slice(0, 2));
    if (chosen.length !== 14) throw Error('Faltan casos para construir un bloque equilibrado.');
  } else if (module === 'hints') {
    chosen = EMOTIONS.flatMap(key => shuffle(pool.filter(x => x.expectedEmotion === key), rng).slice(0, 2));
    if (chosen.length !== 12) throw Error('Faltan identidades para el bloque de pistas.');
  } else {
    chosen = EMOTIONS.flatMap(key => ['yes', 'no'].flatMap(answer => shuffle(pool.filter(x => x.targetEmotion === key && x.expectedResponse === answer), rng).slice(0, 1)));
    if (chosen.length !== 12) throw Error('Faltan estímulos para el bloque de presencia.');
  }
  // Las cuotas se resuelven antes del orden; nunca se repiten ítems para llenar un bloque.
  let ordered = shuffle(chosen, rng);
  if (module === 'presence') {
    const yes = shuffle(chosen.filter(x => x.expectedResponse === 'yes'), rng);
    const no = shuffle(chosen.filter(x => x.expectedResponse === 'no'), rng);
    ordered = [];
    while (yes.length || no.length) {
      const last = ordered.slice(-3);
      const forced = last.length === 3 && last.every(x => x.expectedResponse === last[0].expectedResponse);
      let source = forced ? (last[0].expectedResponse === 'yes' ? no : yes) : (rng() < .5 ? yes : no);
      if (!source.length) source = yes.length ? yes : no;
      ordered.push(source.pop());
    }
    if (ordered.some((x, i) => i > 2 && ordered.slice(i - 3, i + 1).every(y => y.expectedResponse === x.expectedResponse))) return sample(bank, module, {...config, seed: `${config.seed}a`});
  }
  return ordered.map(x => x.id);
}
