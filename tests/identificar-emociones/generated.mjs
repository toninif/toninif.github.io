// Verifica copia real de Quarto, enlaces y recursos sin editar docs/.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.EMOTIONS_PLAYWRIGHT || 'playwright-core');
const source=resolve('herramientas/identificar-emociones'),generated=resolve('docs/herramientas/identificar-emociones');
async function files(root) {return (await Promise.all((await readdir(root,{withFileTypes:true})).map(async entry=>entry.isDirectory()?files(join(root,entry.name)):join(root,entry.name)))).flat();}
const sourceFiles=await files(source),outputFiles=await files(generated);
assert.equal(sourceFiles.length,outputFiles.length);
for(const file of sourceFiles) {
  const a=createHash('sha256').update(await readFile(file)).digest('hex');
  const b=createHash('sha256').update(await readFile(join(generated,relative(source,file)))).digest('hex');assert.equal(a,b,relative(source,file));
}
const allOutput=await files(resolve('docs'));
assert.ok(!allOutput.some(path=>/[/\\](docs-source|tests)[/\\]identificar-emociones[/\\]/.test(path)));
assert.ok(!allOutput.some(path=>/0512_APU_|cap9_laemocion|spa\.traineddata|axe\.min\.js/.test(path)));
const browser=await chromium.launch({executablePath:process.env.EMOTIONS_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],failures=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)failures.push(response.url());});
  await page.goto('http://127.0.0.1:8765/docs/docencia/');
  await page.locator('.resource-item').filter({has:page.getByRole('heading',{name:'Identificar y comprender emociones',exact:true})}).getByRole('link',{name:'Abrir la herramienta',exact:true}).click();
  await page.waitForSelector('[data-action="prepare"]');assert.equal(page.url(),'http://127.0.0.1:8765/docs/herramientas/identificar-emociones/index.html');
  await page.locator('[data-module="hints"]').click();await page.getByRole('button',{name:'Empezar actividad',exact:true}).click();await page.waitForSelector('#answer-btn:enabled');
  await page.locator('#hint-btn').click();assert.equal(await page.locator('.hint-list li').count(),1);
  assert.ok(await page.locator('#stimulus-image').evaluate(n=>n.complete&&n.naturalWidth>0));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'tmp/identificar-emociones/qa/quarto-movil.png',fullPage:true});
  await page.goto('http://127.0.0.1:8765/docs/presentaciones/emocion/');await page.getByRole('link',{name:'Identificar y comprender emociones',exact:true}).click();await page.waitForSelector('[data-action="prepare"]');
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  await writeFile('tmp/identificar-emociones/qa/generated-report.json',JSON.stringify({identicalFiles:sourceFiles.length,noRestrictedInputs:true,docenciaLink:true,courseLink:true,mobile:true,errors,failures},null,2));
  console.log(`PASS: ${sourceFiles.length} archivos idénticos en la salida Quarto, ambos enlaces, carga facial y pistas en móvil; sin insumos ni pruebas en la salida.`);
}finally {await browser.close();}
