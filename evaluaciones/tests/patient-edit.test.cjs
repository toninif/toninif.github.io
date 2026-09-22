const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const saveSource = app.slice(app.indexOf('async function savePatient('),app.indexOf('async function initializeWorkspace('));

function harness(error = null) {
  const fields = {
    '#patient-name':{value:'Nombre corregido'}, '#patient-email':{value:'nuevo@example.com'},
    '#patient-notes':{value:'Nota privada'}, '#patient-message':{}
  };
  const calls = [], button = {}, notices = [];
  const request = {
    update:values => { calls.push(['update', values]); return request; },
    insert:values => { calls.push(['insert', values]); return request; },
    eq:(field,value) => { calls.push(['eq',field,value]); return request; },
    select:() => request, single:async () => ({data: error ? null : {id:'patient-1'},error})
  };
  const context = vm.createContext({
    patientSaving:false, editingPatientId:'patient-1',
    document:{querySelector:s => fields[s]},
    supabaseClient:{auth:{getSession:async () => ({data:{session:{user:{id:'professional-1'}}}})},from:() => request},
    notifyAction:(message,isError) => notices.push({message,isError}),
    closePatientModal:() => calls.push(['close']),
    loadPatients:async () => calls.push(['refresh-patients']),
    loadEvaluations:async () => calls.push(['refresh-evaluations']),
    showView:() => {}, openPatientHistory:async id => calls.push(['history',id])
  });
  vm.runInContext(saveSource,context);
  const event = {preventDefault(){},currentTarget:{querySelector:() => button,querySelectorAll:() => Object.values(fields).slice(0,3)}};
  return {context,event,calls,fields,button,notices};
}
test('editar mantiene identidad e historial, restringe al profesional y confirma el guardado', async () => {
  const h = harness();
  await h.context.savePatient(h.event);
  assert.equal(h.calls.some(c => c[0] === 'insert'),false);
  assert.ok(h.calls.some(c => c[0] === 'eq' && c[1] === 'id' && c[2] === 'patient-1'));
  assert.ok(h.calls.some(c => c[0] === 'eq' && c[1] === 'professional_id' && c[2] === 'professional-1'));
  assert.ok(h.calls.some(c => c[0] === 'history' && c[1] === 'patient-1'));
  assert.match(h.notices[0].message,/actualizados/);
  assert.equal(h.button.disabled,false);
});
test('si falla la edición conserva el formulario y muestra el error sin éxito falso', async () => {
  const h = harness({message:'Sin conexión'});
  await h.context.savePatient(h.event);
  assert.equal(h.calls.some(c => c[0] === 'close'),false);
  assert.equal(h.fields['#patient-name'].value,'Nombre corregido');
  assert.match(h.fields['#patient-message'].textContent,/Sin conexión/);
  assert.equal(h.context.patientSaving,false);
  assert.equal(h.button.disabled,false);
  assert.equal(h.notices[0].isError,true);
});
