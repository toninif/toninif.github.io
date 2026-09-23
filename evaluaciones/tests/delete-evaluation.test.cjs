const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../management.js'),'utf8');

function setup({confirm=true,result={data:[{id:'e1'}]},refreshFails=false,openId='e1'}={}) {
  const calls=[], notices=[], message={}, button={disabled:false};
  let cleared=false;
  const query={delete(){calls.push(['delete']);return query;},eq(...args){calls.push(args);return query;},select:async()=>result};
  const context=vm.createContext({
    window:{confirm:()=>confirm},
    displayInstrumentName:name=>name,
    supabaseClient:{auth:{getSession:async()=>({data:{session:{user:{id:'u1'}}}})},from:table=>{calls.push(['table',table]);return query;}},
    document:{querySelector:()=>({dataset:{evaluationId:openId}}),querySelectorAll:()=>[]},
    drawerContent:{replaceChildren(){cleared=true;}},closeDrawer(){},
    workspaceEvaluations:[{id:'e1'},{id:'e2'}],updateDashboardStats(){},renderAttentionQueue(){},
    loadEvaluations:async()=>{if(refreshFails)throw Error('Red');}
  });
  vm.runInContext(source,context);
  context.recordNotice=(...args)=>notices.push(args);
  vm.runInContext('notifyAction=recordNotice',context);
  return {context,calls,notices,message,button,get cleared(){return cleared;},run:()=>context.deleteEvaluation({id:'e1',patients:{full_name:'Prueba'},batteries:{name:'PHQ-9'}},button,message)};
}

test('cancelar el borrado no envía ninguna petición',async()=>{
  const state=setup({confirm:false});await state.run();assert.equal(state.calls.length,0);
});
test('borra solo el id y propietario confirmados; conserva las otras evaluaciones',async()=>{
  const state=setup();await state.run();
  assert.deepEqual(state.calls,[['table','evaluations'],['delete'],['id','e1'],['professional_id','u1']]);
  assert.equal(state.context.workspaceEvaluations.length,1);
  assert.equal(state.context.workspaceEvaluations[0].id,'e2');
  assert.equal(state.cleared,true);assert.match(state.notices[0][0],/borrada/);
});
test('un error o cero filas no anuncia éxito ni cierra el detalle',async()=>{
  for(const result of [{error:{message:'Error de red'}},{data:[]}]){
    const state=setup({result});await state.run();
    assert.equal(state.context.workspaceEvaluations.length,2);assert.equal(state.cleared,false);
    assert.match(state.message.textContent,/No se pudo borrar/);assert.equal(state.button.disabled,false);
  }
});
test('si falla la recarga aclara que el borrado ocurrió; no cierra otra ficha abierta',async()=>{
  const state=setup({refreshFails:true,openId:'e2'});await state.run();
  assert.equal(state.cleared,false);assert.equal(state.context.workspaceEvaluations.length,1);
  assert.match(state.notices.at(-1)[0],/se borró, pero/);
});
