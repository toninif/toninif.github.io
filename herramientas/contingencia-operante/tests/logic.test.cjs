const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/logic.js');
const CASOS = require('../js/cases.js');

test('calcula la contingencia del cinturón de Pedro', () => {
  const r = L.calcular({ a: 0, b: 10, c: 10, d: 0 });
  assert.equal(r.ok, true);
  assert.equal(r.pR, 0);
  assert.equal(r.pNoR, 1);
  assert.equal(r.diff, -1);
  assert.equal(r.signo, 'negativa');
});

test('compara probabilidades y no frecuencias absolutas', () => {
  // 3/6 y 4/8: mismas probabilidades con totales distintos
  const r = L.calcular({ a: 3, b: 3, c: 4, d: 4 });
  assert.equal(r.signo, 'nula');
  assert.equal(r.diff, 0);
});

test('la contingencia nula no depende del redondeo de punto flotante', () => {
  // 1/3 contra 2/6 y 7/10 contra 21/30
  assert.equal(L.calcular({ a: 1, b: 2, c: 2, d: 4 }).signo, 'nula');
  assert.equal(L.calcular({ a: 7, b: 3, c: 21, d: 9 }).signo, 'nula');
});

test('una diferencia mínima conserva el signo', () => {
  assert.equal(L.calcular({ a: 5001, b: 4999, c: 5000, d: 5000 }).signo, 'positiva');
  assert.equal(L.calcular({ a: 4999, b: 5001, c: 5000, d: 5000 }).signo, 'negativa');
});

test('pide datos cuando falta una fila', () => {
  const r = L.calcular({ a: 0, b: 0, c: 3, d: 2 });
  assert.equal(r.ok, false);
  assert.equal(r.motivo, 'faltan-datos');
});

test('rechaza valores inválidos', () => {
  const invalidos = [
    { a: -1, b: 2, c: 3, d: 4 },
    { a: 1.5, b: 2, c: 3, d: 4 },
    { a: NaN, b: 2, c: 3, d: 4 },
    { a: 1, b: 2, c: 3, d: undefined }
  ];
  for (const tabla of invalidos) {
    const r = L.calcular(tabla);
    assert.equal(r.ok, false);
    assert.equal(r.motivo, 'valores');
  }
});

test('clasifica los cuatro procedimientos por el signo y el efecto', () => {
  assert.equal(L.clasificar('positiva', 'aumenta'), 'reforzamiento-positivo');
  assert.equal(L.clasificar('negativa', 'aumenta'), 'reforzamiento-negativo');
  assert.equal(L.clasificar('positiva', 'disminuye'), 'castigo-positivo');
  assert.equal(L.clasificar('negativa', 'disminuye'), 'castigo-negativo');
});

test('sin contingencia o sin efecto no hay reforzamiento ni castigo', () => {
  assert.equal(L.clasificar('nula', 'aumenta'), 'sin-contingencia');
  assert.equal(L.clasificar('nula', 'igual'), 'sin-contingencia');
  assert.equal(L.clasificar('positiva', 'igual'), 'sin-efecto');
  assert.equal(L.clasificar('negativa', 'igual'), 'sin-efecto');
  assert.equal(L.clasificar('positiva', undefined), null);
});

// Generador reproducible (LCG) para que las pruebas del simulador sean deterministas.
function generador(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

test('el simulador respeta los extremos 0 % y 100 %', () => {
  assert.deepEqual(L.simular(100, 0, 30), { a: 30, b: 0, c: 0, d: 30 });
  assert.deepEqual(L.simular(0, 100, 30), { a: 0, b: 30, c: 30, d: 0 });
});

test('el simulador devuelve n observaciones por fila', () => {
  const m = L.simular(50, 50, 40, generador(1));
  assert.equal(m.a + m.b, 40);
  assert.equal(m.c + m.d, 40);
});

test('con muchas observaciones la muestra se acerca a la probabilidad real', () => {
  const m = L.simular(70, 20, 5000, generador(7));
  assert.ok(Math.abs(m.a / 5000 - 0.7) < 0.03);
  assert.ok(Math.abs(m.c / 5000 - 0.2) < 0.03);
});

test('con pocas observaciones y contingencia real nula el signo observado varía', () => {
  const azar = generador(42);
  const signos = [];
  for (let i = 0; i < 200; i++) {
    signos.push(L.calcular(L.simular(50, 50, 10, azar)).signo);
  }
  const cuenta = L.contarSignos(signos);
  assert.equal(cuenta.positiva + cuenta.negativa + cuenta.nula, 200);
  assert.ok(cuenta.positiva > 0 && cuenta.negativa > 0);
});

test('el simulador rechaza parámetros inválidos', () => {
  assert.throws(() => L.simular(101, 0, 10), RangeError);
  assert.throws(() => L.simular(50, -1, 10), RangeError);
  assert.throws(() => L.simular(50.5, 10, 10), RangeError);
  assert.throws(() => L.simular(50, 50, 0), RangeError);
});

test('el signo real sale de comparar los porcentajes', () => {
  assert.equal(L.signoReal(70, 20), 'positiva');
  assert.equal(L.signoReal(20, 70), 'negativa');
  assert.equal(L.signoReal(40, 40), 'nula');
});

test('formatea con coma decimal y no muestra ceros falsos', () => {
  assert.equal(L.formatear(0), '0');
  assert.equal(L.formatear(0.75), '0,75');
  assert.equal(L.formatear(1 / 3), '0,33');
  assert.equal(L.formatear(0.001), '0,001');
});

test('el banco de casos tiene la clasificación esperada', () => {
  const esperado = {
    cinturon: 'reforzamiento-negativo',
    ruleta: 'reforzamiento-positivo',
    estufa: 'castigo-positivo',
    celular: 'castigo-negativo',
    remera: 'sin-contingencia',
    mano: 'reforzamiento-positivo',
    pastilla: 'reforzamiento-negativo',
    tarde: 'castigo-positivo',
    musica: 'castigo-negativo',
    berrinche: 'reforzamiento-positivo'
  };
  assert.deepEqual(CASOS.map((c) => c.id).sort(), Object.keys(esperado).sort());
  for (const caso of CASOS) {
    const res = L.calcular(caso);
    assert.equal(res.ok, true, caso.id);
    assert.equal(L.clasificar(res.signo, caso.efecto), esperado[caso.id], caso.id);
  }
});

test('el banco de casos cubre todas las categorías y tiene campos completos', () => {
  const tipos = new Set(CASOS.map((c) => {
    const res = L.calcular(c);
    return L.clasificar(res.signo, c.efecto);
  }));
  for (const tipo of ['reforzamiento-positivo', 'reforzamiento-negativo', 'castigo-positivo', 'castigo-negativo', 'sin-contingencia']) {
    assert.ok(tipos.has(tipo), tipo);
  }
  assert.equal(new Set(CASOS.map((c) => c.id)).size, CASOS.length);
  for (const caso of CASOS) {
    for (const campo of ['titulo', 'texto', 'R', 'C', 'unidad', 'nota']) {
      assert.equal(typeof caso[campo], 'string', caso.id + '.' + campo);
      assert.ok(caso[campo].trim().length > 0, caso.id + '.' + campo);
    }
    assert.ok(['aumenta', 'disminuye', 'igual'].includes(caso.efecto), caso.id);
  }
});
