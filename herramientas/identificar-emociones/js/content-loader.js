import {EMOTIONS} from './sampler.js';
const files = {manifest:'bank-manifest.json', emotions:'emotions.json', faces:'faces.json', presence:'presence-items.json', hints:'hint-items.json', process:'process-items.json', references:'references.json', credits:'../licenses/image-credits.json'};
export async function loadContent() {
  const entries = await Promise.all(Object.entries(files).map(async ([key, path]) => {
    const response = await fetch(new URL(`../data/${path}`, import.meta.url));
    if (!response.ok) throw Error(`No se pudo cargar el contenido (${response.status}).`);
    return [key, await response.json()];
  }));
  const bank = Object.fromEntries(entries); validateContent(bank); return bank;
}
export function validateContent(bank) {
  const check = (condition, text) => { if (!condition) throw Error(`Banco inválido: ${text}`); };
  const version = bank.manifest.contentVersion;
  for (const [name, data] of Object.entries(bank)) {
    check(data.schemaVersion === '1.0' && data.contentVersion === version, `versión de ${name}`);
    check(Boolean(data.authorship && data.reviewDate), `autoría y revisión de ${name}`);
    if (!data.items) continue;
    const ids = data.items.map(x => x.id); check(ids.length === new Set(ids).size, `IDs duplicados en ${name}`);
  }
  check(EMOTIONS.every(id => bank.emotions.items.some(x => x.id === id)) && bank.emotions.items.length === 6, 'seis categorías');
  const refs = new Map(bank.references.items.map(x => [x.id, x]));
  for (const key of ['emotions', 'faces', 'presence', 'hints', 'process']) for (const item of bank[key].items) {
    check(['draft','reviewed','published'].includes(item.reviewStatus), `estado de ${item.id}`);
    check(item.sourceRefs?.length, `fuentes de ${item.id}`);
    for (const ref of item.sourceRefs) {
      const source = refs.get(ref.sourceId);
      check(source && Number.isInteger(ref.pdfPage) && ref.pdfPage > 0 && ref.pdfPage <= source.pageCount && typeof ref.section === 'string' && typeof ref.interpretation === 'string', `localizador de ${item.id}`);
    }
  }
  for (const face of bank.faces.items) {
    check([...EMOTIONS,'neutral'].includes(face.depictedExpression), `expresión de ${face.id}`);
    check(/^assets\/faces\/f_\d{4}\.svg$/.test(face.path), `ruta facial de ${face.id}`);
    check(bank.credits.items.some(x => x.id === face.licenseId && x.publicWebUseVerified), `derechos de ${face.id}`);
    check(face.publicWebUseVerified && face.stimulusType === 'original_illustration' && face.movementDescription, `procedencia de ${face.id}`);
  }
  for (const item of [...bank.presence.items, ...bank.hints.items]) {
    const face = bank.faces.items.find(x => x.id === item.faceId); check(face, `rostro de ${item.id}`);
    if ('targetEmotion' in item) {
      check(EMOTIONS.includes(item.targetEmotion), `objetivo de ${item.id}`);
      check(item.expectedResponse === (face.depictedExpression === item.targetEmotion ? 'yes' : 'no'), `clave de ${item.id}`);
      check(item.negativeType === (item.expectedResponse === 'yes' ? null : face.depictedExpression === 'neutral' ? 'neutral' : 'other'), `distractor de ${item.id}`);
    } else {
      check(item.expectedEmotion === face.depictedExpression, `clave de ${item.id}`);
      for (const field of ['hints','descriptiveHints']) check(item[field].length === 4 && item[field].every((h, i) => h.level === i+1 && h.kind === (i === 3 ? 'contextual' : field === 'hints' ? 'facial' : 'descriptive')), `pistas de ${item.id}`);
    }
  }
  for (const item of bank.process.items) {
    check([...EMOTIONS,'insufficient_information'].includes(item.expectedAnswer), `clave de ${item.id}`);
    check(item.theoreticalModelId === 'fernandez_abascal_2001' && item.answerType === 'single', `modelo de ${item.id}`);
    check(item.discriminatingComponent in item.components && item.explanation && item.contrast && item.missingInformation, `componentes de ${item.id}`);
  }
  // Un banco definitivo no puede contener borradores; esta entrega utiliza sólo el canal demo.
  if (bank.manifest.channel === 'production') check(['emotions','faces','presence','hints','process'].every(key => bank[key].items.every(x => x.reviewStatus !== 'draft')), 'borradores en producción');
  return true;
}
