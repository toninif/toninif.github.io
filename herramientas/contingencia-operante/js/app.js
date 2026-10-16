(function () {
  'use strict';

  const L = window.Contingencia;
  const CASOS = window.CasosContingencia;
  const CLAVES = ['a', 'b', 'c', 'd'];

  const $ = (sel, raiz) => (raiz || document).querySelector(sel);

  function el(tag, props, ...hijos) {
    const nodo = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') nodo.className = v;
      else if (k.startsWith('on')) nodo.addEventListener(k.slice(2), v);
      else nodo.setAttribute(k, v === true ? '' : v);
    }
    for (const h of hijos.flat()) {
      if (h != null && h !== false) nodo.append(h);
    }
    return nodo;
  }

  /* ───────────── Paneles y opciones generales ───────────── */

  const PANELES = ['calc', 'casos', 'sim'];

  function mostrarPanel(nombre) {
    PANELES.forEach((p) => {
      $('#panel-' + p).hidden = p !== nombre;
      if (p === nombre) $('#tab-' + p).setAttribute('aria-current', 'true');
      else $('#tab-' + p).removeAttribute('aria-current');
    });
  }

  PANELES.forEach((p) => $('#tab-' + p).addEventListener('click', () => mostrarPanel(p)));

  $('#btn-grande').addEventListener('click', (e) => {
    const activo = document.documentElement.classList.toggle('grande');
    e.currentTarget.setAttribute('aria-pressed', String(activo));
  });

  /* ───────────── Calculadora ───────────── */

  const campos = {};
  CLAVES.forEach((k) => { campos[k] = $('#in-' + k); });
  const txtR = $('#txt-R');
  const txtC = $('#txt-C');
  const selEjemplo = $('#sel-ejemplo');
  let calculo = null;

  function leerTabla() {
    const tabla = {};
    CLAVES.forEach((k) => {
      const v = campos[k].value.trim();
      tabla[k] = v === '' ? NaN : Number(v);
    });
    return tabla;
  }

  function filaBarra(rotulo, num, den, p, clase) {
    const relleno = el('div', { class: 'relleno ' + clase });
    relleno.style.width = (p * 100).toFixed(1) + '%';
    return el('div', { class: 'fila-barra' },
      el('div', { class: 'rotulo-barra' },
        el('span', {}, rotulo),
        el('span', { class: 'fraccion' }, num + ' / ' + den + ' = ' + L.formatear(p))),
      el('div', { class: 'pista', role: 'img', 'aria-label': rotulo + ': ' + L.formatear(p) }, relleno));
  }

  function insignia(signo) {
    const simbolo = signo === 'positiva' ? '+' : signo === 'negativa' ? '−' : '=';
    const texto = signo === 'nula' ? 'Sin contingencia' : 'Contingencia ' + signo;
    return el('span', { class: 'insignia ' + signo }, simbolo + ' ' + texto);
  }

  function nodoCuenta(res, R, C) {
    const redondeado = !(L.esExacto(res.pR) && L.esExacto(res.pNoR) && L.esExacto(res.diff));
    return el('div', { class: 'cuenta' },
      filaBarra('P(C | hizo R)', res.a, res.nR, res.pR, 'rel-r'),
      filaBarra('P(C | no hizo R)', res.c, res.nNoR, res.pNoR, 'rel-nor'),
      el('p', { class: 'resta' },
        L.formatear(res.pR) + ' − ' + L.formatear(res.pNoR) + ' = ',
        el('strong', {}, L.formatear(res.diff))),
      redondeado ? el('p', { class: 'ayuda' }, 'Los valores se redondean a dos decimales.') : null,
      el('p', { class: 'veredicto' }, insignia(res.signo), ' ', L.fraseSigno(res, R, C)));
  }

  function efectoElegido() {
    const marcado = document.querySelector('input[name="efecto"]:checked');
    return marcado ? marcado.value : null;
  }

  function renderProcedimiento() {
    const destino = $('#calc-proc');
    const celdas = document.querySelectorAll('#tabla-proc [data-celda]');
    celdas.forEach((td) => {
      td.classList.remove('activa');
      td.removeAttribute('aria-current');
    });
    destino.replaceChildren();
    if (!calculo || !calculo.ok) return;

    const efecto = efectoElegido();
    const tipo = efecto ? L.clasificar(calculo.signo, efecto) : null;
    if (!tipo) return;

    const celda = document.querySelector('#tabla-proc [data-celda="' + tipo + '"]');
    if (celda) {
      celda.classList.add('activa');
      celda.setAttribute('aria-current', 'true');
    }
    destino.append(el('div', { class: 'caja-verde' },
      el('p', { class: 'tipo' }, L.NOMBRES[tipo]),
      el('p', {}, L.fraseProcedimiento(tipo, efecto, txtR.value, txtC.value))));
  }

  function renderCalculadora() {
    calculo = L.calcular(leerTabla());
    const aviso = $('#msg-datos');

    $('#tot-R').textContent = calculo.nR != null ? calculo.nR : '–';
    $('#tot-noR').textContent = calculo.nNoR != null ? calculo.nNoR : '–';

    if (!calculo.ok) {
      aviso.textContent = calculo.motivo === 'faltan-datos'
        ? 'Necesitás al menos una observación con R y otra sin R para poder comparar.'
        : 'Completá las cuatro casillas con números enteros de 0 en adelante.';
      $('#bloque-cuenta').hidden = true;
      return;
    }

    aviso.textContent = '';
    $('#bloque-cuenta').hidden = false;
    $('#calc-cuenta').replaceChildren(nodoCuenta(calculo, txtR.value, txtC.value));
    renderProcedimiento();
  }

  function cargarCaso(caso, conEfecto) {
    CLAVES.forEach((k) => { campos[k].value = caso[k]; });
    txtR.value = caso.R;
    txtC.value = caso.C;
    document.querySelectorAll('input[name="efecto"]').forEach((r) => {
      r.checked = conEfecto && r.value === caso.efecto;
    });
    renderCalculadora();
  }

  function vaciar() {
    CLAVES.forEach((k) => { campos[k].value = ''; });
    txtR.value = '';
    txtC.value = '';
    selEjemplo.value = '';
    document.querySelectorAll('input[name="efecto"]').forEach((r) => { r.checked = false; });
    renderCalculadora();
  }

  function armarGrilla() {
    document.querySelectorAll('#tabla-proc [data-celda]').forEach((td) => {
      const tipo = td.getAttribute('data-celda');
      td.append(el('strong', {}, L.NOMBRES[tipo]), el('span', {}, L.DESCRIPCIONES[tipo]));
    });
  }

  function armarSelectorEjemplos() {
    selEjemplo.append(el('option', { value: '' }, '— Elegí un ejemplo —'));
    CASOS.forEach((caso) => selEjemplo.append(el('option', { value: caso.id }, caso.titulo)));
    selEjemplo.addEventListener('change', () => {
      const caso = CASOS.find((c) => c.id === selEjemplo.value);
      if (caso) cargarCaso(caso, true);
    });
  }

  function iniciarCalculadora() {
    armarGrilla();
    armarSelectorEjemplos();
    CLAVES.forEach((k) => campos[k].addEventListener('input', renderCalculadora));
    [txtR, txtC].forEach((t) => t.addEventListener('input', renderCalculadora));
    document.querySelectorAll('input[name="efecto"]').forEach((r) => {
      r.addEventListener('change', renderProcedimiento);
    });
    $('#btn-vaciar').addEventListener('click', vaciar);
    selEjemplo.value = CASOS[0].id;
    cargarCaso(CASOS[0], true);
  }

  /* ───────────── Casos para clasificar ───────────── */

  const OPCIONES_SIGNO = [
    { valor: 'positiva', texto: 'Positiva (R aumenta P(C))' },
    { valor: 'negativa', texto: 'Negativa (R disminuye P(C))' },
    { valor: 'nula', texto: 'Nula (no hay contingencia)' }
  ];
  const OPCIONES_TIPO = [
    { valor: 'reforzamiento-positivo', texto: L.NOMBRES['reforzamiento-positivo'] },
    { valor: 'reforzamiento-negativo', texto: L.NOMBRES['reforzamiento-negativo'] },
    { valor: 'castigo-positivo', texto: L.NOMBRES['castigo-positivo'] },
    { valor: 'castigo-negativo', texto: L.NOMBRES['castigo-negativo'] },
    { valor: 'sin-contingencia', texto: 'Ninguno: no hay contingencia' }
  ];

  const raizCasos = $('#casos-raiz');
  const estado = { orden: [], i: 0, resultados: [], resp: {}, comprobado: false };

  function mezclar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function iniciarCasos(conMezcla) {
    const indices = CASOS.map((_, i) => i);
    estado.orden = conMezcla ? mezclar(indices) : indices;
    estado.i = 0;
    estado.resultados = [];
    estado.resp = {};
    estado.comprobado = false;
    renderCaso();
  }

  function analizar(caso) {
    const res = L.calcular(caso);
    return { res, tipo: L.clasificar(res.signo, caso.efecto) };
  }

  function tablaDelCaso(caso) {
    return el('div', { class: 'tabla-wrap' },
      el('table', { class: 'tabla-frec lectura' },
        el('caption', {}, 'Cantidad de ' + caso.unidad),
        el('thead', {}, el('tr', {},
          el('th', { scope: 'col' }, ''),
          el('th', { scope: 'col' }, 'Hubo C'),
          el('th', { scope: 'col' }, 'No hubo C'),
          el('th', { scope: 'col' }, 'Total'))),
        el('tbody', {},
          el('tr', {}, el('th', { scope: 'row' }, 'Hizo R'),
            el('td', {}, caso.a), el('td', {}, caso.b), el('td', { class: 'total' }, caso.a + caso.b)),
          el('tr', {}, el('th', { scope: 'row' }, 'No hizo R'),
            el('td', {}, caso.c), el('td', {}, caso.d), el('td', { class: 'total' }, caso.c + caso.d)))));
  }

  function grupoRadio(nombre, leyenda, opciones, correcta, alCambiar) {
    const elegida = estado.resp[nombre];
    return el('fieldset', { class: 'opciones' },
      el('legend', {}, leyenda),
      opciones.map((op) => {
        let clase = 'opcion';
        let marca = null;
        if (estado.comprobado) {
          if (op.valor === correcta) { clase += ' correcta'; marca = ' ✓ correcta'; }
          else if (op.valor === elegida) { clase += ' incorrecta'; marca = ' ✗ tu respuesta'; }
        }
        const radio = el('input', {
          type: 'radio', name: nombre, value: op.valor,
          checked: elegida === op.valor, disabled: estado.comprobado
        });
        radio.addEventListener('change', () => alCambiar(nombre, op.valor));
        return el('label', { class: clase }, radio, ' ' + op.texto, marca ? el('strong', {}, marca) : null);
      }));
  }

  function devolucion(caso, analisis) {
    const { res, tipo } = analisis;
    const okSigno = estado.resp.signo === res.signo;
    const okTipo = estado.resp.tipo === tipo;
    const cuenta = 'P(C | R) = ' + res.a + '/' + res.nR + ' = ' + L.formatear(res.pR) +
      ' · P(C | no R) = ' + res.c + '/' + res.nNoR + ' = ' + L.formatear(res.pNoR) +
      ' · resta = ' + L.formatear(res.diff);
    const caja = el('div', { class: 'devolucion', role: 'status', tabindex: '-1' },
      el('h3', {}, okSigno && okTipo ? 'Las dos respuestas son correctas' : 'Hay algo para revisar'),
      el('ul', {},
        el('li', {}, (okSigno ? '✓ ' : '✗ ') + 'Signo: ' + res.signo + '. ' + cuenta + '.'),
        el('li', {}, (okTipo ? '✓ ' : '✗ ') + L.NOMBRES[tipo] + '. ' +
          L.fraseSigno(res, caso.R, caso.C) + ' ' + L.fraseProcedimiento(tipo, caso.efecto, caso.R, caso.C))),
      el('p', { class: 'nota' }, caso.nota));
    return caja;
  }

  function renderCaso() {
    if (estado.i >= estado.orden.length) { renderFinal(); return; }

    const caso = CASOS[estado.orden[estado.i]];
    const analisis = analizar(caso);
    const total = estado.orden.length;
    const aciertos = estado.resultados.filter(Boolean).length;

    const btnComprobar = el('button', { type: 'button', class: 'btn-principal', disabled: true }, 'Comprobar');
    function alCambiar(nombre, valor) {
      estado.resp[nombre] = valor;
      btnComprobar.disabled = !(estado.resp.signo && estado.resp.tipo);
    }
    btnComprobar.addEventListener('click', () => {
      estado.comprobado = true;
      estado.resultados.push(
        estado.resp.signo === analisis.res.signo && estado.resp.tipo === analisis.tipo);
      renderCaso();
    });

    const acciones = estado.comprobado
      ? el('button', { type: 'button', class: 'btn-principal', onclick: () => {
          estado.i += 1; estado.resp = {}; estado.comprobado = false; renderCaso();
        } }, estado.i + 1 < total ? 'Siguiente caso' : 'Ver resultado')
      : btnComprobar;

    raizCasos.replaceChildren(
      el('p', { class: 'progreso' }, 'Caso ' + (estado.i + 1) + ' de ' + total + ' · Casos correctos: ' + aciertos),
      el('article', { class: 'tarjeta-caso' },
        el('h2', {}, caso.titulo),
        el('p', {}, caso.texto),
        el('p', { class: 'rc' }, el('strong', {}, 'R: '), caso.R),
        el('p', { class: 'rc' }, el('strong', {}, 'C: '), caso.C),
        tablaDelCaso(caso),
        el('button', { type: 'button', class: 'btn-sec', onclick: () => {
          cargarCaso(caso, false);
          selEjemplo.value = caso.id;
          mostrarPanel('calc');
          window.scrollTo(0, 0);
        } }, 'Abrir los números en la calculadora'),
        grupoRadio('signo', '1. ¿Cuál es el signo de la contingencia entre R y C?',
          OPCIONES_SIGNO, analisis.res.signo, alCambiar),
        grupoRadio('tipo', '2. ¿Qué procedimiento es?',
          OPCIONES_TIPO, analisis.tipo, alCambiar),
        estado.comprobado ? devolucion(caso, analisis) : null,
        el('div', { class: 'acciones' }, acciones)));

    const dev = $('.devolucion', raizCasos);
    if (dev) dev.focus();
  }

  function renderFinal() {
    const total = estado.orden.length;
    const aciertos = estado.resultados.filter(Boolean).length;
    raizCasos.replaceChildren(
      el('article', { class: 'tarjeta-caso' },
        el('h2', {}, 'Resultado'),
        el('p', { class: 'puntaje' }, aciertos + ' de ' + total + ' casos con las dos respuestas correctas.'),
        el('ul', { class: 'lista-resultados' },
          estado.orden.map((idx, pos) => el('li', {},
            (estado.resultados[pos] ? '✓ ' : '✗ ') + CASOS[idx].titulo))),
        el('div', { class: 'acciones' },
          el('button', { type: 'button', class: 'btn-principal', onclick: () => iniciarCasos(false) }, 'Volver a empezar'),
          el('button', { type: 'button', class: 'btn-sec', onclick: () => iniciarCasos(true) }, 'Mezclar y empezar'))));
  }

  /* ───────────── Simulador ───────────── */

  const MAX_HISTORIAL = 200;
  const slPr = $('#sl-pr');
  const slPnor = $('#sl-pnor');
  const selN = $('#sel-n');
  const sim = { historial: [], ultima: null };

  function parametrosSim() {
    return { pctR: Number(slPr.value), pctNoR: Number(slPnor.value), n: Number(selN.value) };
  }

  function graficoHistorial(diffs, diffReal) {
    const NS = 'http://www.w3.org/2000/svg';
    const X0 = 40, X1 = 560, EJE = 80;
    const x = (v) => X0 + ((v + 1) / 2) * (X1 - X0);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 600 110');
    svg.setAttribute('class', 'grafico-historial');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Contingencias observadas en las simulaciones, de −1 a 1. ' +
      'La contingencia real es ' + L.formatear(diffReal) + '.');
    const nodo = (tag, attrs, texto) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (texto != null) n.textContent = texto;
      return n;
    };

    svg.append(nodo('line', { x1: X0, y1: EJE, x2: X1, y2: EJE, class: 'eje' }));
    [-1, 0, 1].forEach((v) => {
      svg.append(nodo('line', { x1: x(v), y1: EJE - 4, x2: x(v), y2: EJE + 4, class: 'eje' }));
      svg.append(nodo('text', { x: x(v), y: EJE + 20, 'text-anchor': 'middle', class: 'marca' }, v > 0 ? '+1' : v < 0 ? '−1' : '0'));
    });
    svg.append(nodo('line', { x1: x(diffReal), y1: 6, x2: x(diffReal), y2: EJE, class: 'real' }));
    svg.append(nodo('text', { x: x(diffReal), y: 14, 'text-anchor': diffReal > 0.5 ? 'end' : 'start', class: 'marca-real' },
      'real ' + L.formatear(diffReal)));

    const apilados = {};
    diffs.forEach((d) => {
      const clave = Math.round(d * 50); // celdas de 0,02 para apilar puntos parecidos
      const nivel = apilados[clave] || 0;
      apilados[clave] = nivel + 1;
      svg.append(nodo('circle', { cx: x(d), cy: EJE - 8 - Math.min(nivel, 5) * 9, r: 4.5, class: 'punto' }));
    });
    return svg;
  }

  function renderSimReal() {
    const { pctR, pctNoR } = parametrosSim();
    $('#out-pr').textContent = pctR + ' %';
    $('#out-pnor').textContent = pctNoR + ' %';
    const signo = L.signoReal(pctR, pctNoR);
    const diff = (pctR - pctNoR) / 100;
    $('#sim-real').replaceChildren(
      'Contingencia real: ' + L.formatear(pctR / 100) + ' − ' + L.formatear(pctNoR / 100) + ' = ',
      el('strong', {}, L.formatear(diff)), ' ', insignia(signo));
  }

  function renderSimResultados() {
    const ultima = $('#sim-ultima');
    const historial = $('#sim-historial');
    if (!sim.ultima) {
      ultima.replaceChildren();
      historial.replaceChildren();
      return;
    }
    const { pctR, pctNoR } = parametrosSim();
    const signoReal = L.signoReal(pctR, pctNoR);
    const res = sim.ultima;
    const coincide = res.signo === signoReal;

    ultima.replaceChildren(
      el('h3', {}, 'Última muestra'),
      tablaDelCaso({ a: res.a, b: res.b, c: res.c, d: res.d, unidad: 'observaciones' }),
      nodoCuenta(res, '', ''),
      el('p', { class: coincide ? 'coincide' : 'no-coincide' },
        (coincide ? '✓ ' : '✗ ') + 'El signo observado (' + res.signo + ') ' +
        (coincide ? 'coincide' : 'no coincide') + ' con el real (' + signoReal + ').'),
      el('button', { type: 'button', class: 'btn-sec', onclick: llevarMuestraACalculadora },
        'Llevar esta muestra a la calculadora'));

    const cuenta = L.contarSignos(sim.historial.map((r) => r.signo));
    const diffReal = (pctR - pctNoR) / 100;
    historial.replaceChildren(
      el('h3', {}, 'Historial (' + sim.historial.length + ' simulaciones)'),
      graficoHistorial(sim.historial.map((r) => r.diff), diffReal),
      el('p', {},
        'Signo observado: positiva en ' + cuenta.positiva + ', negativa en ' + cuenta.negativa +
        ', nula en ' + cuenta.nula + '. Signo real: ' + signoReal + '.'));
  }

  function simularVeces(veces) {
    const { pctR, pctNoR, n } = parametrosSim();
    for (let i = 0; i < veces; i++) {
      sim.ultima = L.calcular(L.simular(pctR, pctNoR, n));
      sim.historial.push(sim.ultima);
    }
    if (sim.historial.length > MAX_HISTORIAL) {
      sim.historial = sim.historial.slice(-MAX_HISTORIAL);
    }
    renderSimResultados();
  }

  function reiniciarSim() {
    sim.historial = [];
    sim.ultima = null;
    renderSimResultados();
  }

  function llevarMuestraACalculadora() {
    if (!sim.ultima) return;
    CLAVES.forEach((k) => { campos[k].value = sim.ultima[k]; });
    txtR.value = '';
    txtC.value = '';
    selEjemplo.value = '';
    document.querySelectorAll('input[name="efecto"]').forEach((r) => { r.checked = false; });
    renderCalculadora();
    mostrarPanel('calc');
    window.scrollTo(0, 0);
  }

  function iniciarSimulador() {
    // Al cambiar la realidad el historial deja de ser comparable: se borra.
    [slPr, slPnor, selN].forEach((control) => control.addEventListener('input', () => {
      renderSimReal();
      reiniciarSim();
    }));
    $('#btn-sim-1').addEventListener('click', () => simularVeces(1));
    $('#btn-sim-20').addEventListener('click', () => simularVeces(20));
    $('#btn-sim-borrar').addEventListener('click', reiniciarSim);
    renderSimReal();
  }

  /* ───────────── Arranque ───────────── */

  iniciarCalculadora();
  iniciarCasos(false);
  iniciarSimulador();
})();
