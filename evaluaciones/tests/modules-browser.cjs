// Navegador real con conexión simulada; nunca envía respuestas a Supabase.
// Ejecutar después de modules-db.test.cjs para verificar también el servidor real.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require(path.join(process.env.EVALUATIONS_QA_ROOT,'node_modules/playwright'));
const { instruments } = require('../instruments');
const root = path.resolve(__dirname,'..');
const modules = Object.values(instruments).map((config,i)=>({id:`m${i}`,name:config.name,config:{...config,workflow_version:2},saved_answers:null}));
const evaluation = {evaluation_id:'e1',patient_name:'Paciente de prueba',battery_name:'Evaluación inicial',evaluation_status:'invited',modules};
const server = http.createServer((req,res)=>{
  const file = path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace('/evaluaciones',''));
  if (!file.startsWith(root+path.sep) && file !== root) {res.writeHead(403).end();return;}
  const target = file===root ? path.join(root,'index.html') : file;
  try {res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(target));}
  catch {res.writeHead(404).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/evaluaciones/`;
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    // Bloquea TODA conexión fuera del servidor de prueba (incluido el CDN de Supabase).
    await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    await context.addInitScript(({evaluation,instruments})=>{
      window.__qa={evaluation,calls:[],failSave:false,failComplete:false,capabilities:2};
      const patient={id:'p1',full_name:'Paciente de prueba',email:'prueba@example.test'};
      const professional={id:'u1',email:'profesional@example.test'};
      const dbEvaluation={id:'e1',patient_id:'p1',status:'to_review',created_at:new Date().toISOString(),patients:patient,batteries:{name:'Evaluación inicial'},attention_required:true,attention_reviewed_at:null,review_notes:'',workflow_version:2};
      const mock={
        auth:{getSession:async()=>({data:{session:location.search?null:{user:professional}}}),onAuthStateChange:()=>{}},
        from(table){
          let single=false,deleting=false;
          const query={delete(){deleting=true;return query;},select(){return query;},eq(){return query;},in(){return query;},order(){return query;},upsert(){return query;},insert(){return query;},update(){return query;},single(){single=true;return query;},maybeSingle(){single=true;return query;},
            then(resolve){
              if(deleting){window.__qa.deleted=true;return Promise.resolve({data:[{id:'e1'}],error:null}).then(resolve);}
              const data=table==='patients'?[patient]:table==='batteries'?[{id:'b1',name:'Batería inicial'}]:table==='modules'?evaluation.modules:table==='evaluations'?(window.__qa.deleted?[]:[dbEvaluation]):table==='responses'?[
                {module_id:'m0',answers:{reason:'<img src=x onerror=alert(1)>Texto ficticio'},score:null},
                {module_id:'m1',answers:Object.fromEntries(Array.from({length:9},(_,i)=>[`item_${i+1}`,i===8?1:0])),score:{total:1,instrument:'PHQ9'}}
              ]:[];
              return Promise.resolve({data:single?data[0]:data,error:null}).then(resolve);
            }};
          return query;
        },
        async rpc(name,args){
          window.__qa.calls.push({name,args});
          if(name==='get_patient_evaluation')return {data:[evaluation],error:null};
          if(name==='evaluation_capabilities')return {data:window.__qa.capabilities,error:null};
          if(name==='save_patient_module'){
            if(window.__qa.failSave){window.__qa.failSave=false;return {error:{message:'Error de red simulado'}};}
            evaluation.modules.find(m=>m.id===args.target_module_id).saved_answers=args.response_answers;
          }
          if(name==='complete_modular_evaluation' && window.__qa.failComplete){window.__qa.failComplete=false;return {error:{message:'Error de red simulado'}};}
          return {data:true,error:null};
        }
      };
      window.supabase={createClient:()=>mock};
    },{evaluation,instruments});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url+'?access=prueba-local');
    await page.getByRole('heading',{name:'Formulario inicial',exact:true}).waitFor();
    await page.locator('[name=reason]').fill('Motivo ficticio para probar el recorrido');
    await page.evaluate(()=>{window.__qa.failSave=true;});
    await page.getByRole('button',{name:'Guardar y continuar'}).click();
    await page.getByText('No se pudo guardar: Error de red simulado').waitFor();
    assert.equal(await page.locator('[name=reason]').inputValue(),'Motivo ficticio para probar el recorrido');
    await page.getByRole('button',{name:'Guardar y continuar'}).click();
    await page.getByRole('heading',{name:'Síntomas depresivos (PHQ-9)',exact:true}).waitFor();
    for(let i=1;i<=9;i++)await page.locator(`[name=item_${i}][value="${i===9?1:0}"]`).check();
    await page.locator('#patient-support').waitFor({state:'visible'});
    await page.locator('[name=difficulty][value="1"]').check();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:path.join(process.env.EVALUATIONS_QA_ROOT,'phq-mobile.png'),fullPage:true});
    await page.getByRole('button',{name:'Guardar y continuar'}).click();
    await page.getByRole('heading',{name:'Satisfacción con la vida (SWLS)',exact:true}).waitFor();
    for(let i=1;i<=5;i++)await page.locator(`[name=item_${i}][value="4"]`).check();
    await page.getByRole('button',{name:'Guardar y continuar'}).click();
    await page.getByRole('heading',{name:'Revisar y enviar',exact:true}).waitFor();
    await page.getByRole('button',{name:'Revisar Formulario inicial',exact:true}).click();
    assert.equal(await page.locator('[name=reason]').inputValue(),'Motivo ficticio para probar el recorrido');
    await page.getByRole('button',{name:'Guardar y continuar'}).click();
    assert.equal(await page.locator('[name=item_9][value="1"]').isChecked(),true);
    await page.getByRole('button',{name:'Guardar y continuar'}).click();
    await page.getByRole('button',{name:'Guardar y continuar'}).click();
    await page.evaluate(()=>{window.__qa.failComplete=true;});
    await page.getByRole('button',{name:'Enviar evaluación',exact:true}).click();
    await page.getByRole('button',{name:'Reintentar envío',exact:true}).click();
    await page.getByRole('heading',{name:'Evaluación enviada',exact:true}).waitFor();
    const calls=await page.evaluate(()=>window.__qa.calls);
    assert.equal(calls.filter(c=>c.name==='complete_modular_evaluation').length,2);
    assert.ok(!calls.some(c=>c.name==='save_patient_response'));
    // Vista profesional: catálogo, selección, resumen, señal y respuestas por módulo.
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(url);
    await page.locator('.app-shell').waitFor({state:'visible'});
    await page.evaluate(()=>showView('nueva'));
    await page.locator('#evaluation-patient').selectOption('p1');
    await page.getByRole('button',{name:'Continuar con el instrumento'}).click();
    await page.locator('[name=instrument][value=INTAKE]').check();
    await page.locator('[name=instrument][value=PHQ9]').check();
    await page.screenshot({path:path.join(process.env.EVALUATIONS_QA_ROOT,'modules-desktop.png'),fullPage:true});
    await page.getByRole('button',{name:'Continuar con el acceso'}).click();
    await page.getByRole('button',{name:'Guardar y generar enlace'}).click();
    await page.getByRole('heading',{name:'Enlace privado listo'}).waitFor();
    const created=await page.evaluate(()=>window.__qa.calls.find(c=>c.name==='create_modular_evaluation'));
    assert.equal(created.args.selected_modules.length,3);
    await page.evaluate(()=>openRealEvaluation('e1'));
    await page.getByRole('heading',{name:'PHQ-9: revisar respuesta al ítem 9'}).waitFor();
    assert.equal(await page.locator('#drawer-content img').count(),0);
    await page.locator('#drawer-content').getByText('Dificultad cotidiana:',{exact:false}).waitFor();
    assert.equal(await page.locator('.drawer').evaluate(node=>node.getBoundingClientRect().right<=innerWidth),true);
    await page.screenshot({path:path.join(process.env.EVALUATIONS_QA_ROOT,'review-desktop.png'),fullPage:true});
    const deleteButton=page.getByRole('button',{name:'Borrar evaluación',exact:true});
    await deleteButton.scrollIntoViewIfNeeded();
    page.once('dialog',dialog=>dialog.dismiss());
    await deleteButton.click();
    assert.equal(await page.evaluate(()=>Boolean(window.__qa.deleted)),false);
    page.once('dialog',dialog=>dialog.accept());
    await deleteButton.click();
    await page.getByText('Evaluación borrada. Su enlace ya no funciona.',{exact:true}).waitFor();
    await page.locator('#detail-drawer').waitFor({state:'hidden'});
    assert.equal(await page.locator('.nav-item[data-view="evaluaciones"] b').textContent(),'0');
    assert.equal(await page.locator('.patient-count').textContent(),'0 evaluaciones');
    assert.equal(await page.locator('.attention-queue').count(),0);
    // Backend todavía sin migrar: conserva SWLS y bloquea nuevos módulos.
    await page.evaluate(async()=>{window.__qa.capabilities=1;await configureModularWorkflow();showView('nueva');});
    assert.equal(await page.locator('[name=instrument][value=PHQ9]').isDisabled(),true);
    assert.equal(await page.locator('[name=instrument][value=SWLS]').isDisabled(),false);
    assert.deepEqual(errors,[]);
    console.log('Navegador: recorrido de 3 módulos, errores/reintentos, revisión, móvil y compatibilidad sin migración OK.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
