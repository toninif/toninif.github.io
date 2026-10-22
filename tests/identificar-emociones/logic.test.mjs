import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {sample, EMOTIONS} from '../../herramientas/identificar-emociones/js/sampler.js';
import {createSession, transition, currentItem, currentTrial} from '../../herramientas/identificar-emociones/js/state.js';
import {score, percent} from '../../herramientas/identificar-emociones/js/scoring.js';
import {validateContent} from '../../herramientas/identificar-emociones/js/content-loader.js';
import {saveProgress, readProgress, clearProgress, restoreProgress, STORAGE_KEY} from '../../herramientas/identificar-emociones/js/storage.js';
import {exportJSON, exportCSV, csvCell} from '../../herramientas/identificar-emociones/js/export.js';

const app = new URL('../../herramientas/identificar-emociones/',import.meta.url);
const names={manifest:'bank-manifest',emotions:'emotions',faces:'faces',presence:'presence-items',hints:'hint-items',process:'process-items',references:'references'};
const bank=Object.fromEntries(await Promise.all(Object.entries(names).map(async([key,name])=>[key,JSON.parse(await readFile(new URL(`data/${name}.json`,app),'utf8'))])));
bank.credits=JSON.parse(await readFile(new URL('licenses/image-credits.json',app),'utf8'));
const config=(overrides={})=>({seed:'reproducible',mode:'practice',stimulusMode:'visual',integrated:false,...overrides});
function sessionFor(module, overrides={}) { const c=config(overrides);return createSession(module,c,sample(bank,module,c),bank.manifest.contentVersion,1000); }
const act=(s,event)=>transition(s,event,currentItem(s,bank));
const ready=s=>act(s,{type:'READY'});
function expected(s) { const item=currentItem(s,bank);return item.expectedResponse || item.expectedEmotion || item.expectedAnswer; }
function finish(s) {
  while(s.status !== 'completed') {
    if(s.status==='loading')s=ready(s);
    else if(s.status==='active')s=act(s,{type:'ANSWER',answer:expected(s),activeMs:100});
    else s=act(s,{type:'NEXT',trialInstanceId:currentTrial(s).trialInstanceId,now:2000});
  }
  return s;
}

test('Bancos y rutas: 14 recursos originales, 30 casos, claves y fuentes válidas', async()=>{
  assert.equal(validateContent(bank),true);
  assert.equal(bank.faces.items.length,14);assert.equal(bank.process.items.length,30);
  assert.equal(bank.process.items.filter(i=>i.expectedAnswer==='insufficient_information').length,6);
  for(const face of bank.faces.items) {
    await access(fileURLToPath(new URL(face.path,app)));
    const svg=await readFile(new URL(face.path,app),'utf8');
    assert.ok(!svg.includes(face.depictedExpression));assert.ok(!svg.includes('<image'));
    assert.ok(!face.altNeutral.includes(face.depictedExpression));
  }
  const draft=structuredClone(bank);draft.manifest.channel='production';assert.throws(()=>validateContent(draft),/borradores/);
  const invalid=structuredClone(bank);invalid.presence.items[0].expectedResponse='invalid';assert.throws(()=>validateContent(invalid),/clave/);
  invalid.presence.items[0]=bank.presence.items[0];invalid.hints.items[0].hints[0].level=2;assert.throws(()=>validateContent(invalid),/pistas/);
});
test('Muestreo reproducible, cuotas, límite de rachas y ausencia de repetición',()=>{
  for(let i=0;i<150;i++)for(const module of ['presence','hints','process']) {
    const c=config({seed:String(i)}),ids=sample(bank,module,c);
    assert.deepEqual(ids,sample(bank,module,c));assert.equal(ids.length,new Set(ids).size);
    const items=ids.map(id=>bank[module].items.find(x=>x.id===id));
    for(const key of EMOTIONS) assert.equal(items.filter(x=>(x.targetEmotion||x.expectedEmotion||x.expectedAnswer)===key).length,2);
    if(module==='presence') {
      assert.equal(items.filter(x=>x.expectedResponse==='yes').length,6);
      assert.equal(items.filter(x=>x.negativeType==='neutral').length,2);
      assert.equal(new Set(items.map(i=>i.faceId)).size,12);
      for(let j=3;j<items.length;j++)assert.ok(!items.slice(j-3,j+1).every(x=>x.expectedResponse===items[j].expectedResponse));
    }
  }
  assert.throws(()=>sample(bank,'hints',config({mode:'check'})),/no admite/);
  assert.throws(()=>sample(bank,'hints',config({excludedIdentityIds:['esquema_01']})),/Faltan identidades/);
  const a=sample(bank,'process',config()),b=sample(bank,'process',config({mode:'check'}));assert.ok(!a.some(id=>b.includes(id)));
});
test('Carga, respuesta doble y eventos de una instancia anterior',()=>{
  let s=sessionFor('presence');assert.equal(act(s,{type:'ANSWER',answer:expected(s)}),s);
  s=ready(s);const token=currentTrial(s).trialInstanceId;
  s=act(s,{type:'ANSWER',answer:expected(s),trialInstanceId:token});
  assert.equal(s.status,'feedback');assert.equal(currentTrial(s).attempts.length,1);
  assert.equal(act(s,{type:'ANSWER',answer:expected(s),trialInstanceId:token}),s);
  s=act(s,{type:'NEXT',trialInstanceId:token});assert.equal(s.index,1);
  assert.equal(act(s,{type:'NEXT',trialInstanceId:token}),s);
  s=ready(s);assert.equal(act(s,{type:'ANSWER',answer:expected(s),trialInstanceId:token}),s);
});
test('Carga fallida no se puntúa; reintento conserva el ítem',()=>{
  let s=sessionFor('presence'),id=currentTrial(s).itemId;
  s=act(s,{type:'LOAD_ERROR'});assert.equal(s.status,'load_error');assert.equal(score(s,bank).presented,0);
  assert.equal(act(s,{type:'ANSWER',answer:'yes'}),s);
  s=act(s,{type:'RETRY'});assert.equal(currentTrial(s).itemId,id);assert.equal(ready(s).status,'active');
});
test('Incertidumbre, omisión e interrupción conservan los denominadores',()=>{
  let s=sessionFor('presence');
  const positive=bank.presence.items.find(x=>x.expectedResponse==='yes'),negative=bank.presence.items.find(x=>x.expectedResponse==='no');
  s=createSession('presence',config(),[positive.id,negative.id],bank.manifest.contentVersion);
  s=ready(s);s=act(s,{type:'ANSWER',answer:'uncertain'});s=act(s,{type:'NEXT'});s=ready(s);s=act(s,{type:'OMIT'});s=act(s,{type:'NEXT'});
  const result=score(s,bank);assert.equal(result.sensitivity,0);assert.equal(result.specificity,0);assert.equal(result.rejects,0);assert.equal(result.misses,0);assert.equal(result.uncertain,1);assert.equal(result.omitted,1);
  s=ready(sessionFor('presence'));s=act(s,{type:'END'});assert.equal(s.partial,true);assert.equal(score(s,bank).interrupted,1);
  assert.equal(percent(score(sessionFor('presence'),bank).balanced),'Sin datos');
});
test('Pistas: intento por nivel, errores conservados, contexto separado y revelación',()=>{
  let s=ready(sessionFor('hints',{integrated:true}));
  const answer=expected(s),wrong=EMOTIONS.find(e=>e!==answer);
  s=act(s,{type:'ANSWER',answer:wrong,activeMs:100});assert.equal(s.status,'active');assert.equal(act(s,{type:'ANSWER',answer}),s);
  for(let i=1;i<=4;i++)s=act(s,{type:'HINT',activeMs:20});
  s=act(s,{type:'ANSWER',answer,activeMs:100});assert.equal(currentTrial(s).attempts.length,2);assert.equal(currentTrial(s).firstCorrectLevel,4);
  const result=score(s,bank);assert.equal(result.contextual,1);assert.equal(result.facial,0);assert.equal(result.previousErrors,1);
  assert.equal(currentTrial(s).attempts[1].hintsSeen.length,4);
  let reveal=ready(sessionFor('hints'));reveal=act(reveal,{type:'REVEAL'});assert.equal(score(reveal,bank).revealed,1);assert.equal(score(reveal,bank).initial,0);
  let last=ready(sessionFor('hints'));for(let i=0;i<3;i++)last=act(last,{type:'HINT'});last=act(last,{type:'ANSWER',answer:EMOTIONS.find(e=>e!==expected(last))});assert.equal(last.status,'feedback');assert.equal(currentTrial(last).outcome,'incorrect');
  const desc=finish(sessionFor('hints',{stimulusMode:'descriptive'}));assert.equal(score(desc,bank).initial,12);assert.equal(score(desc,bank).facial,0);
});
test('Información insuficiente separada y evidencia sin calificación inventada',()=>{
  let s=sessionFor('process');s=finish(s);const result=score(s,bank);
  assert.equal(result.clear.correct,12);assert.equal(result.insufficient.correct,2);
  const id=bank.process.items.find(x=>x.expectedAnswer==='insufficient_information').id;
  s=ready(createSession('process',config(),[id],bank.manifest.contentVersion));s=act(s,{type:'ANSWER',answer:'insufficient_information',evidence:'body'});
  assert.equal(currentTrial(s).evidence,'body');assert.equal(currentTrial(s).outcome,'correct');assert.equal('evidenceScore' in currentTrial(s),false);
});
test('Pausa y pestaña oculta: no se acumula tiempo pausado',()=>{
  let s=ready(sessionFor('hints'));s=act(s,{type:'PAUSE',activeMs:400});
  assert.equal(act(s,{type:'ANSWER',answer:expected(s),activeMs:5000}),s);
  s=act(s,{type:'RESUME'});s=act(s,{type:'ANSWER',answer:expected(s),activeMs:100});assert.equal(currentTrial(s).activeTotalMs,500);
});
test('Guardado opcional aislado, corrupción, cuota y restauración de pistas',()=>{
  const values=new Map([['otra-herramienta','intacto']]);const storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k),removeItem:k=>values.delete(k)};
  let s=ready(sessionFor('hints'));s=act(s,{type:'HINT'});assert.equal(saveProgress(s,storage),true);
  const loaded=restoreProgress(readProgress(storage).session,bank);assert.equal(loaded.status,'paused');assert.equal(currentTrial(loaded).hintLevel,1);assert.deepEqual(loaded.trials,s.trials);
  const incompatible={...s,contentVersion:'old'};assert.throws(()=>restoreProgress(incompatible,bank),/compatibles/);
  clearProgress(storage);assert.equal(values.get('otra-herramienta'),'intacto');assert.equal(values.has(STORAGE_KEY),false);
  const blocked={setItem:()=>{throw Error('quota');},getItem:()=>{throw Error('blocked');},removeItem:()=>{throw Error('blocked');}};
  assert.equal(saveProgress(s,blocked),false);assert.ok(readProgress(blocked).error);assert.equal(clearProgress(blocked),false);
});
test('Exportación: historial completo, mismo resumen y CSV seguro para planillas',()=>{
  const s=finish(sessionFor('hints'));s.trials[0].report='=HYPERLINK("https://example.org","x")\nOtra línea';
  assert.deepEqual(JSON.parse(exportJSON(s,bank)).summary,score(s,bank));
  assert.deepEqual(JSON.parse(exportJSON(s,bank)).session,s);
  const csv=exportCSV(s);assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('"contentVersion"'));
  for(const value of ['=1+1',' +1','@SUM(A1)','-1','\t=1'])assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('a,"b"'),'"a,""b"""');
});
test('Progreso corrupto: no restaura una pausa, configuración o intentos inválidos',()=>{
  const original=ready(sessionFor('hints'));
  for(const mutate of [s=>{s.status='paused';s.resumeStatus='bad';},s=>{s.config.mode='bad';},s=>{s.trials[0]=null;},s=>{s.trials[0].attempts=[{}];},s=>{s.trials[0].hintsSeen=[null];},s=>{s.trials[1].trialInstanceId=s.trials[0].trialInstanceId;}]) {
    const copy=structuredClone(original);mutate(copy);assert.throws(()=>restoreProgress(copy,bank),/compatibles/);
  }
});
test('Contraste de tokens: texto AA y bordes de controles sobre fondo claro y oscuro',async()=>{
  const css=await readFile(new URL('css/style.css',app),'utf8');
  const luminance=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).reduce((sum,c,i)=>sum+[.2126,.7152,.0722][i]*(c<=.04045?c/12.92:((c+.055)/1.055)**2.4),0);
  const contrast=(a,b)=>{const [lo,hi]=[luminance(a),luminance(b)].sort((x,y)=>x-y);return(hi+.05)/(lo+.05);};
  for(const rule of css.matchAll(/:root[^{}]*\{([^}]+)\}/g)) {
    const tokens=Object.fromEntries([...rule[1].matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map(m=>[m[1],m[2]]));
    if(!tokens.bg)continue;
    for(const foreground of ['ink','muted','accent'])for(const background of ['bg','surface'])assert.ok(contrast(tokens[foreground],tokens[background])>=4.5,foreground+' / '+background);
    for(const background of ['bg','surface'])assert.ok(contrast(tokens.border,tokens[background])>=3,'control / '+background);
  }
});
