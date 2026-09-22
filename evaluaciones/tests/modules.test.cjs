const { test } = require('node:test');
const assert = require('node:assert/strict');
const { instruments, validateAnswers } = require('../instruments.js');
const answers = (n, value) => Object.fromEntries(Array.from({length:n}, (_,i) => [`item_${i+1}`,value]));

test('PHQ-9: límites, dificultad excluida del total y señal independiente del total', () => {
  assert.equal(validateAnswers(instruments.PHQ9, answers(9,0)).total, 0);
  assert.equal(validateAnswers(instruments.PHQ9, {...answers(9,3),difficulty:3}).total, 27);
  assert.equal(validateAnswers(instruments.PHQ9, {...answers(9,0),item_9:1,difficulty:0}).attention_required, true);
  assert.equal(validateAnswers(instruments.PHQ9, {...answers(9,3),item_9:0,difficulty:0}).attention_required, false);
  for (const value of [null, '1', 1.5, -1, 4]) assert.throws(() => validateAnswers(instruments.PHQ9,{...answers(9,0),item_1:value}));
  assert.throws(() => validateAnswers(instruments.PHQ9,{...answers(9,1)}), /dificultaron/);
  assert.throws(() => validateAnswers(instruments.PHQ9,{...answers(9,0),extra:0}));
});

test('formulario inicial sin puntaje, opcionales y límites', () => {
  assert.equal(validateAnswers(instruments.INTAKE,{reason:'Motivo de prueba'}),null);
  assert.throws(() => validateAnswers(instruments.INTAKE,{reason:'   '}));
  assert.throws(() => validateAnswers(instruments.INTAKE,{reason:'a'.repeat(3001)}));
  assert.throws(() => validateAnswers(instruments.INTAKE,{reason:'Prueba',other:42}));
});

test('SWLS conserva suma 5–35 y versión lingüística explícita', () => {
  assert.equal(validateAnswers(instruments.SWLS,answers(5,1)).total,5);
  assert.equal(validateAnswers(instruments.SWLS,answers(5,7)).total,35);
  assert.match(instruments.SWLS.citation,/no identificado/);
});
