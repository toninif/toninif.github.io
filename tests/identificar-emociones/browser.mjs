// QA externa al recurso público. Requiere playwright-core y axe-core en rutas de entorno.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.EMOTIONS_PLAYWRIGHT || 'playwright-core');
const base=process.env.EMOTIONS_BASE_URL || 'http://127.0.0.1:8765/herramientas/identificar-emociones/';
const out=resolve('tmp/identificar-emociones/qa');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.EMOTIONS_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true,reducedMotion:'reduce'});
const page=await context.newPage(),errors=[],checks=[],audits=[];
page.on('pageerror',error=>errors.push(error.message));
const check=(condition,name)=>{assert.ok(condition,name);checks.push(name);};
const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ft-emociones:v1')));
async function audit(name,target=page) {
  await target.addScriptTag({path:process.env.EMOTIONS_AXE || resolve('tmp/identificar-emociones/axe.min.js')});
  const result=await target.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
  audits.push({name,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))});
  assert.deepEqual(audits.at(-1).violations,[],name+' accesibilidad');
}
async function shot(name) {await page.screenshot({path:join(out,name+'.png'),fullPage:true});}
async function fresh() {
  await page.goto(base);await page.waitForSelector('[data-action="prepare"]');
  await page.evaluate(()=>localStorage.removeItem('ft-emociones:v1'));
  await page.reload();await page.waitForSelector('[data-action="prepare"]');
}
async function start(module,{mode='practice',stimulusMode='visual',integrated=false}={}) {
  await fresh();
  await page.getByText('Privacidad y guardado',{exact:true}).click();await page.locator('#save-progress').check();
  await page.locator(`[data-module="${module}"]`).click();
  await page.locator('#mode').selectOption(mode);
  if(module!=='process')await page.locator('#stimulus-mode').selectOption(stimulusMode);
  if(integrated)await page.locator('#integrated').check();
  await page.getByRole('button',{name:'Empezar actividad',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#answer-btn')&&!document.querySelector('#answer-btn').disabled);
}
async function select(answer) {await page.locator(`input[name="answer"][value="${answer}"]`).check();}
async function submit(answer) {await select(answer);await page.locator('#answer-btn').click();}
async function answerForState(state) {
  const bank=JSON.parse(await readFile(resolve(`herramientas/identificar-emociones/data/${{presence:'presence-items',hints:'hint-items',process:'process-items'}[state.module]}.json`),'utf8'));
  const item=bank.items.find(x=>x.id===state.trials[state.index].itemId);return item.expectedResponse || item.expectedEmotion || item.expectedAnswer;
}
async function finish() {
  while(!await page.getByRole('heading',{name:'Actividad completada',exact:true}).count()) {
    if(await page.locator('#answer-btn:enabled').count())await submit(await answerForState(await stored()));
    if(await page.locator('#continue-btn').count())await page.locator('#continue-btn').click();
    await page.waitForTimeout(30);
  }
}
try {
  await fresh();await audit('Inicio');await shot('inicio-escritorio');
  check(await page.locator('html').getAttribute('lang')==='es-AR','Idioma y carga inicial');
  await page.keyboard.press('Tab');check(await page.locator('.skip-link').evaluate(n=>n===document.activeElement),'Enlace para saltar por teclado');
  await page.keyboard.press('Enter');check(await page.locator('#main').evaluate(n=>n===document.activeElement),'Destino del salto de contenido');
  await start('presence');await audit('Presencia activa');await shot('presencia-escritorio');
  check(await page.locator('#question').evaluate(n=>n===document.activeElement),'Foco en consigna tras cargar');
  check(await page.locator('input[name="answer"]:checked').count()===0,'Sin opción preseleccionada');
  const visual=await page.locator('#stimulus-image').getAttribute('src'),alt=await page.locator('#stimulus-image').getAttribute('alt');
  check(!/alegr|triste|miedo|ira|asco|sorpresa|neutral/i.test(alt),'Texto alternativo sin clave');
  await select('uncertain');check(await page.locator('input[value="uncertain"]').evaluate(n=>n===document.activeElement),'La selección mantiene el foco');
  await page.locator('#answer-btn').click();check((await stored()).trials[0].outcome==='uncertain','Incertidumbre diferenciada');await audit('Devolución presencia');
  await page.locator('#continue-btn').dblclick();await page.waitForSelector('#answer-btn:enabled');
  check((await stored()).index===1,'Doble clic no salta un ensayo');await page.locator('[data-action="omit"]').click();
  await page.locator('#continue-btn').click();await page.waitForSelector('#answer-btn:enabled');
  await page.locator('[data-action="pause"]').click();await page.waitForSelector('[data-action="unpause"]');await audit('Pausa');
  await page.locator('[data-action="unpause"]').click();await page.waitForSelector('#answer-btn:enabled');await finish();await audit('Resultados presencia');await shot('resultados-presencia');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="json"]').click()]);
  const downloaded=JSON.parse(await readFile(await download.path(),'utf8'));check(downloaded.summary.uncertain===1&&downloaded.summary.omitted===1,'Exportación reproduce incertidumbre y omisión');
  const [csvDownload]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="csv"]').click()]);check((await readFile(await csvDownload.path(),'utf8')).includes('"trialInstanceId"'),'CSV descargable');
  await start('hints',{integrated:true});const initialSrc=await page.locator('#stimulus-image').getAttribute('src');
  const expected=await answerForState(await stored()),wrong=['alegria','miedo','ira'].find(x=>x!==expected);
  await submit(wrong);check(await page.locator('#answer-btn').isDisabled(),'Un intento por nivel');check((await stored()).trials[0].attempts.length===1,'Error conservado');await audit('Pistas tras error');
  await page.locator('#hint-btn').click();check(await page.locator('#stimulus-image').getAttribute('src')===initialSrc,'La cara no cambia con pistas');
  for(let i=0;i<3;i++)await page.locator('#hint-btn').click();await submit(expected);
  check((await stored()).trials[0].usedContextHint,'Contexto identificado');await shot('pistas-contexto');await page.locator('#continue-btn').click();await page.waitForSelector('#answer-btn:enabled');
  await page.locator('[data-action="reveal"]').click();check((await stored()).trials[1].outcome==='revealed','Revelación sin acierto');
  await page.locator('#continue-btn').click();await page.waitForSelector('#answer-btn:enabled');await page.locator('#hint-btn').click();
  await page.reload();await page.waitForSelector('[data-action="restore"]');await page.locator('[data-action="restore"]').click();await page.locator('[data-action="unpause"]').click();await page.waitForSelector('#answer-btn:enabled');
  check((await stored()).trials[2].hintLevel===1,'Recarga conserva orden y pistas');
  const cdp=await context.newCDPSession(page);await cdp.send('Page.setWebLifecycleState',{state:'frozen'});await cdp.send('Page.setWebLifecycleState',{state:'active'});
  // Pausa explícita y cambio de visibilidad real mediante otra pestaña.
  const tab=await context.newPage();await tab.goto('about:blank');await page.waitForTimeout(80);await page.bringToFront();await tab.close();
  if(await page.locator('[data-action="unpause"]').count())await page.locator('[data-action="unpause"]').click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});
  check((await stored()).status==='paused','Ocultar pestaña pausa la sesión y su reloj');
  await page.locator('[data-action="unpause"]').click();
  await page.locator('[data-action="end"]').click();check(await page.getByRole('heading',{name:'Resumen parcial',exact:true}).count()===1,'Abandono identifica resumen parcial');await audit('Resumen parcial pistas');
  await start('hints',{stimulusMode:'descriptive'});check(await page.locator('#stimulus-image').count()===0,'Modalidad descriptiva sin tarea visual');await page.locator('#hint-btn').click();await audit('Modo descriptivo');await shot('modo-descriptivo');
  await page.locator('[data-action="end"]').click();
  await start('process',{mode:'check'});await submit(await answerForState(await stored()));check(await page.getByRole('heading',{name:'Respuesta registrada',exact:true}).count()===1,'Comprobación difiere explicación');check(await page.locator('#interaction').innerText().then(t=>!t.includes('Respuesta esperada:')),'Sin clave anticipada en comprobación');
  await page.locator('#continue-btn').click();await page.waitForSelector('#answer-btn:enabled');await finish();await audit('Comprobación final');
  await start('process');await page.locator('input[name="evidence"][value="body"]').check();await submit(await answerForState(await stored()));
  await page.getByText('Este caso admite otra respuesta',{exact:true}).click();await page.locator('#report').fill('=1+1\nSugiero otro significado.');await page.locator('[data-action="report"]').click();
  check((await stored()).trials[0].report.startsWith('=1+1'),'Comentario guardado localmente');await page.locator('#continue-btn').click();await page.waitForSelector('#answer-btn:enabled');
  await audit('Procesos');await shot('proceso-escritorio');
  for(const width of [320,360,390,768,1280]) {
    await page.setViewportSize({width,height:900});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Reflujo proceso ${width}`);
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#question').scrollIntoViewIfNeeded();await shot('proceso-movil');await audit('Procesos móvil');
  await page.locator('[data-action="end"]').click();await start('presence');await page.setViewportSize({width:360,height:800});await page.locator('#question').scrollIntoViewIfNeeded();await shot('presencia-movil');
  check(await page.locator('input[name="answer"]').evaluateAll(nodes=>nodes.every(n=>n.closest('label').getBoundingClientRect().height>=44)),'Objetivos táctiles de respuesta de 44 px');
  for(const theme of ['light','dark']) {
    await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await audit('Cara móvil '+theme);
    check(await page.locator('#stimulus-image').getAttribute('src')!==null,'Imagen disponible en ambos temas');
    await shot('presencia-movil-'+theme);
  }
  await page.locator('#large-text').click();await page.setViewportSize({width:320,height:900});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Texto grande a 320');
  await page.locator('#projector').click();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Proyector a 320');await page.locator('#large-text').click();await page.locator('#projector').click();
  // Reflujo equivalente a 400 %: 1280/4 = 320 CSS px; texto a 200 % adicional.
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Texto a 200 % y reflujo de 320 CSS px');await shot('texto-200-reflujo');await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.locator('[data-nav="library"]').click();await page.locator('summary').filter({hasText:'Ira / enojo'}).click();await audit('Biblioteca');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Biblioteca abierta a 320');
  await page.locator('[data-nav="sources"]').click();await audit('Fuentes');
  await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>document.documentElement.dataset.theme='light');await shot('fuentes');
  await start('presence');
  for(let i=0;i<12;i++) {
    await page.keyboard.press('Tab');await page.keyboard.press('Space');await page.keyboard.press('Tab');
    check(await page.locator('#answer-btn').evaluate(n=>n===document.activeElement),'Confirmar accesible por teclado '+i);
    await page.keyboard.press('Enter');
    for(let j=0;j<15;j++) {await page.keyboard.press('Tab');if(await page.locator('#continue-btn').evaluate(n=>n===document.activeElement))break;}
    check(await page.locator('#continue-btn').evaluate(n=>n===document.activeElement),'Continuar accesible por teclado '+i);
    await page.keyboard.press('Enter');
    if(i<11)await page.waitForSelector('#answer-btn:enabled');
  }
  check(await page.getByRole('heading',{name:'Actividad completada',exact:true}).count()===1,'Sesión completa con teclado');
  const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const touch=await touchContext.newPage();await touch.goto(base);await touch.waitForSelector('[data-action="prepare"]');
  await touch.locator('[data-module="presence"]').tap();await touch.getByRole('button',{name:'Empezar actividad',exact:true}).tap();await touch.waitForSelector('#answer-btn:enabled');
  const touchCdp=await touchContext.newCDPSession(touch);const tree=await touchCdp.send('Accessibility.getFullAXTree');
  check(tree.nodes.some(n=>n.role?.value==='radio'&&n.name?.value==='Sí'),'Árbol de accesibilidad: radios con nombre');
  check(tree.nodes.some(n=>n.role?.value==='status'),'Árbol de accesibilidad: regiones de estado');
  await writeFile(join(out,'accessibility-tree.json'),JSON.stringify(tree,null,2));
  await audit('Sesión táctil',touch);await touch.screenshot({path:join(out,'tactil-390.png'),fullPage:true});
  for(let i=0;i<12;i++) {await touch.locator('input[value="yes"]').tap();await touch.locator('#answer-btn').tap();await touch.locator('#continue-btn').tap();if(i<11)await touch.waitForSelector('#answer-btn:enabled');}
  check(await touch.getByRole('heading',{name:'Actividad completada',exact:true}).count()===1,'Sesión completa con interacción táctil emulada');await touchContext.close();await page.bringToFront();
  // Carga de imagen fallida: permanece sin presentar y permite reintento.
  await fresh();await page.route('**/assets/faces/*.svg',route=>route.abort());
  await page.locator('[data-module="presence"]').click();await page.getByRole('button',{name:'Empezar actividad',exact:true}).click();
  await page.getByRole('heading',{name:'No se pudo cargar la ilustración',exact:true}).waitFor();await audit('Error de imagen');await page.unroute('**/assets/faces/*.svg');
  await page.locator('[data-action="retry"]').click();await page.waitForSelector('#answer-btn:enabled');check(true,'Imagen fallida y reintento recuperables');
  // Fallo de banco recuperable.
  await page.route('**/data/emotions.json',route=>route.fulfill({status:503,body:'offline'}));await page.reload();await page.getByRole('heading',{name:'No se pudo preparar la actividad',exact:true}).waitFor();await page.unroute('**/data/emotions.json');await page.locator('[data-action="reload"]').click();await page.waitForSelector('[data-action="prepare"]');check(true,'Fallo de banco y reintento');
  // Almacenamiento denegado: continúa en memoria.
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}});});
  await page.reload();await page.waitForSelector('[data-action="prepare"]');await page.getByText('Privacidad y guardado',{exact:true}).click();await page.locator('#save-progress').check();await page.locator('[data-module="process"]').click();await page.getByRole('button',{name:'Empezar actividad',exact:true}).click();await page.waitForSelector('#answer-btn:enabled');check(await page.locator('#notice').innerText().then(x=>x.includes('memoria')),'Almacenamiento bloqueado permite seguir');
  check(errors.length===0,'Sin excepciones JavaScript');
  await writeFile(join(out,'report.json'),JSON.stringify({base,checks,audits,errors},null,2));
  console.log(`PASS: ${checks.length} comprobaciones de recorrido; ${audits.length} auditorías axe sin infracciones; capturas en ${out}.`);
} catch(error) {await shot('fallo');await writeFile(join(out,'report-failure.json'),JSON.stringify({checks,audits,errors,error:error.stack},null,2));throw error;}
finally {await browser.close();}
