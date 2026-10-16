/* Lógica pura de la herramienta (sin DOM), para poder probarla con Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Contingencia = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const NOMBRES = {
    'reforzamiento-positivo': 'Reforzamiento positivo',
    'reforzamiento-negativo': 'Reforzamiento negativo',
    'castigo-positivo': 'Castigo positivo',
    'castigo-negativo': 'Castigo negativo',
    'sin-contingencia': 'Sin contingencia',
    'sin-efecto': 'Sin efecto observable'
  };

  // Descripción mecánica de cada procedimiento: habla de probabilidades y de
  // la conducta, nunca de si C es agradable o de si «aparece» o «se quita».
  const DESCRIPCIONES = {
    'reforzamiento-positivo': 'Emitir R hace más probable C, y R se repite más.',
    'castigo-positivo': 'Emitir R hace más probable C, y R se emite menos.',
    'reforzamiento-negativo': 'Emitir R hace menos probable C, y R se repite más.',
    'castigo-negativo': 'Emitir R hace menos probable C, y R se emite menos.'
  };

  const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
  const nfFino = new Intl.NumberFormat('es-AR', { maximumSignificantDigits: 2 });

  function formatear(x) {
    if (x === 0) return '0';
    const r = Math.round(x * 100) / 100;
    return r === 0 ? nfFino.format(x) : nf.format(r);
  }

  function esExacto(x) {
    return Math.abs(x * 100 - Math.round(x * 100)) < 1e-9;
  }

  function esEnteroNoNegativo(n) {
    return Number.isInteger(n) && n >= 0;
  }

  /*
   * Tabla de frecuencias:
   *   a = hizo R y hubo C      b = hizo R y no hubo C
   *   c = no hizo R y hubo C   d = no hizo R y no hubo C
   * El signo se decide con enteros (productos cruzados) para que una
   * contingencia nula nunca dependa del redondeo de punto flotante.
   */
  function calcular(tabla) {
    const { a, b, c, d } = tabla;
    if (![a, b, c, d].every(esEnteroNoNegativo)) {
      return { ok: false, motivo: 'valores' };
    }
    const nR = a + b;
    const nNoR = c + d;
    if (nR === 0 || nNoR === 0) {
      return { ok: false, motivo: 'faltan-datos', nR, nNoR };
    }
    const pR = a / nR;
    const pNoR = c / nNoR;
    const cruzado = a * nNoR - c * nR;
    const signo = cruzado > 0 ? 'positiva' : cruzado < 0 ? 'negativa' : 'nula';
    return { ok: true, a, b, c, d, nR, nNoR, pR, pNoR, diff: pR - pNoR, signo };
  }

  /*
   * Simulador: sortea n observaciones con R y n sin R, con las
   * probabilidades «reales» dadas en porcentaje entero (0 a 100).
   * `azar` se puede inyectar (devuelve un número en [0, 1)) para las pruebas.
   */
  function simular(pctR, pctNoR, n, azar) {
    const porcentajeValido = (p) => Number.isInteger(p) && p >= 0 && p <= 100;
    if (!porcentajeValido(pctR) || !porcentajeValido(pctNoR) || !Number.isInteger(n) || n < 1) {
      throw new RangeError('Parámetros de simulación inválidos');
    }
    const sorteo = azar || Math.random;
    let a = 0;
    let c = 0;
    for (let i = 0; i < n; i++) if (sorteo() < pctR / 100) a++;
    for (let i = 0; i < n; i++) if (sorteo() < pctNoR / 100) c++;
    return { a, b: n - a, c, d: n - c };
  }

  function signoReal(pctR, pctNoR) {
    return pctR > pctNoR ? 'positiva' : pctR < pctNoR ? 'negativa' : 'nula';
  }

  function contarSignos(signos) {
    const cuenta = { positiva: 0, negativa: 0, nula: 0 };
    signos.forEach((s) => { cuenta[s] += 1; });
    return cuenta;
  }

  // efecto: 'aumenta' | 'disminuye' | 'igual' (qué le pasó a la conducta R)
  function clasificar(signo, efecto) {
    if (signo === 'nula') return 'sin-contingencia';
    if (efecto === 'igual') return 'sin-efecto';
    if (efecto !== 'aumenta' && efecto !== 'disminuye') return null;
    const familia = efecto === 'aumenta' ? 'reforzamiento' : 'castigo';
    return familia + '-' + (signo === 'positiva' ? 'positivo' : 'negativo');
  }

  function nombre(texto, porDefecto) {
    const t = (texto || '').trim();
    return t === '' ? porDefecto : t;
  }

  function fraseSigno(res, R, C) {
    const r = nombre(R, 'R');
    const c = nombre(C, 'C');
    if (res.signo === 'positiva') {
      return 'Hacer «' + r + '» aumenta la probabilidad de «' + c + '».';
    }
    if (res.signo === 'negativa') {
      return 'Hacer «' + r + '» disminuye la probabilidad de «' + c + '».';
    }
    return 'Hacer «' + r + '» no cambia la probabilidad de «' + c + '»: no hay contingencia.';
  }

  function fraseProcedimiento(tipo, efecto, R, C) {
    const r = nombre(R, 'R');
    const c = nombre(C, 'C');
    if (tipo === 'sin-contingencia') {
      return 'Sin contingencia no hay reforzamiento ni castigo: «' + c +
        '» es igual de probable haya o no «' + r + '».';
    }
    if (tipo === 'sin-efecto') {
      return 'Todavía no se puede hablar de reforzamiento ni de castigo: esos nombres se definen ' +
        'por el efecto sobre la conducta, y acá no cambió.';
    }
    const verbo = efecto === 'aumenta' ? 'se vuelve más frecuente' : 'se vuelve menos frecuente';
    return 'Además, «' + r + '» ' + verbo + ', así que es un procedimiento de ' +
      NOMBRES[tipo].toLowerCase() + '.';
  }

  return {
    NOMBRES,
    DESCRIPCIONES,
    calcular,
    simular,
    signoReal,
    contarSignos,
    clasificar,
    formatear,
    esExacto,
    nombre,
    fraseSigno,
    fraseProcedimiento
  };
});
