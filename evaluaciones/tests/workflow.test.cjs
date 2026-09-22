const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');
function fn(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf('\n}', start) + 2;
  return source.slice(start, end);
}
test('contadores: cuatro evaluaciones, una pendiente, conteo por paciente', () => {
  const stats = [{}, {}, {}], filters = [{}, {}, {}, {}], nav = {}, count = {};
  const document = {
    querySelector: () => nav,
    querySelectorAll: selector => selector.includes('signal-card') ? stats : selector.includes('directory-row') ? [{dataset: {patientId: 'p1'}, querySelector: () => count}] : filters
  };
  const context = vm.createContext({document, Date});
  vm.runInContext(fn('updateDashboardStats'), context);
  context.updateDashboardStats([
    {status:'draft', patient_id:'p1'}, {status:'invited', patient_id:'p1'},
    {status:'to_review', patient_id:'p1', completed_at:new Date().toISOString()},
    {status:'completed', patient_id:'p2', completed_at:new Date().toISOString()}
  ]);
  assert.equal(nav.textContent, 4);
  assert.equal(stats[0].textContent, 3);
  assert.equal(stats[1].textContent, 1);
  assert.equal(filters[3].textContent, 1);
  assert.equal(count.textContent, '3 evaluaciones');
  context.updateDashboardStats([]);
  assert.equal(nav.textContent, 0);
});
test('filtro y búsqueda se conservan después del cambio de estado', () => {
  const rows = [{dataset:{status:'to_review'}, textContent:'Paciente Uno'}, {dataset:{status:'invited'}, textContent:'Paciente Dos'}];
  const filters = [0,1,2,3].map(i => ({classList:{contains:() => i === 2}}));
  const document = {
    querySelectorAll: s => s.includes('.filter') ? filters : rows,
    querySelector: s => s === '.search input' ? {value:'uno'} : s === '#filter-empty' ? null : {insertAdjacentHTML() {}}
  };
  const context = vm.createContext({document, workspaceEvaluations:rows});
  vm.runInContext(fn('applyEvaluationFilters'), context);
  context.applyEvaluationFilters();
  assert.equal(rows[0].hidden, false);
  assert.equal(rows[1].hidden, true);
  rows[0].dataset.status = 'completed';
  context.applyEvaluationFilters();
  assert.equal(rows[0].hidden, true);
});
test('nombres con HTML se muestran como texto', () => {
  const context = vm.createContext({});
  vm.runInContext(fn('escapeHtml'), context);
  assert.equal(context.escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
});
