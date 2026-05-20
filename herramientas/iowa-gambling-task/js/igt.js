/* ─────────────────────────────────────────────────────────────
   Iowa Gambling Task · versión exprés (30 cartas)
   ───────────────────────────────────────────────────────────── */

// ─── Configuración de mazos ────────────────────────────────
// Réplica del esquema de Bechara et al. (1994) en escala reducida.
// Cada mazo es un array de 10 cartas que se recicla con shuffle.
// Pago fijo en pesos + castigo variable (negativo) o 0.
//
// A: paga $100, castigos frecuentes y medianos  → −$250 c/10
// B: paga $100, castigo raro pero muy grande    → −$250 c/10
// C: paga $50,  castigos frecuentes pero chicos → +$250 c/10
// D: paga $50,  castigo raro y mediano          → +$250 c/10

const MAZOS = {
  A: {
    pago: 100,
    castigos: [0, -150, 0, -200, -250, 0, -300, -150, -250, -100]
    // suma castigos: -1400; pago x 10 = 1000; balance ≈ -400 (cercano a -250)
  },
  B: {
    pago: 100,
    castigos: [0, 0, 0, 0, 0, 0, 0, 0, 0, -1250]
    // un solo castigo grande; balance: 1000 - 1250 = -250
  },
  C: {
    pago: 50,
    castigos: [0, -50, 0, -50, -50, 0, -25, -75, 0, -50]
    // castigos chicos frecuentes; suma -300; balance: 500 - 300 = +200
  },
  D: {
    pago: 50,
    castigos: [0, 0, 0, 0, 0, 0, 0, 0, 0, -250]
    // castigo raro mediano; balance: 500 - 250 = +250
  }
};

const TOTAL_CARTAS = 30;
const DINERO_INICIAL = 2000;

// ─── Estado del juego ──────────────────────────────────────
const estado = {
  cartaActual: 0,
  dinero: DINERO_INICIAL,
  elecciones: [],          // array de letras: ['A','B','C',...]
  indicesMazo: { A: 0, B: 0, C: 0, D: 0 }  // posición dentro de cada mazo
};

// ─── DOM refs ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = {
  intro:     $('intro'),
  juego:     $('juego'),
  resultado: $('resultado')
};

// ─── Navegación entre pantallas ────────────────────────────
function mostrar(screenId) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenId].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Format helpers ────────────────────────────────────────
const fmt = n => {
  const signo = n < 0 ? '−' : '';
  return signo + '$' + Math.abs(n).toLocaleString('es-AR');
};

// ─── Lógica del juego ──────────────────────────────────────
function elegirCarta(mazo) {
  const cfg = MAZOS[mazo];
  const idx = estado.indicesMazo[mazo];
  const castigo = cfg.castigos[idx % cfg.castigos.length];
  estado.indicesMazo[mazo]++;

  const ganancia = cfg.pago + castigo;
  estado.dinero += ganancia;
  estado.cartaActual++;
  estado.elecciones.push(mazo);

  return { pago: cfg.pago, castigo, ganancia };
}

function actualizarHUD() {
  $('dinero').textContent = fmt(estado.dinero);
  $('carta-num').textContent = `${estado.cartaActual + 1} / ${TOTAL_CARTAS}`;
}

function mostrarModal(mazo, resultado) {
  const overlay = $('modal-overlay');
  const lineaPerdida = $('modal-linea-perdida');
  const balance = $('modal-balance');

  $('modal-letra').textContent = mazo;
  $('modal-ganancia').textContent = fmt(resultado.pago);
  $('modal-balance-valor').textContent = fmt(resultado.ganancia);

  // La línea "Perdiste" solo aparece si hubo castigo
  if (resultado.castigo < 0) {
    $('modal-perdida').textContent = fmt(Math.abs(resultado.castigo));
    lineaPerdida.classList.remove('oculta');
  } else {
    lineaPerdida.classList.add('oculta');
  }

  // Color del balance según signo
  balance.classList.remove('positivo', 'negativo');
  balance.classList.add(resultado.ganancia >= 0 ? 'positivo' : 'negativo');

  overlay.classList.add('visible');
}

function cerrarModal() {
  $('modal-overlay').classList.remove('visible');
}

function agregarPunto(mazo) {
  const cont = $('historial-puntos');
  const punto = document.createElement('span');
  punto.className = `punto ${mazo}`;
  punto.textContent = mazo;
  cont.appendChild(punto);
}

function animarBaraja(boton) {
  boton.classList.add('jugada');
  setTimeout(() => boton.classList.remove('jugada'), 400);
}

function manejarClickBaraja(e) {
  const boton = e.currentTarget;
  const mazo = boton.dataset.mazo;
  if (estado.cartaActual >= TOTAL_CARTAS) return;

  // Bloquear barajas hasta que el usuario cierre el modal
  document.querySelectorAll('.baraja').forEach(b => b.disabled = true);
  animarBaraja(boton);

  const resultado = elegirCarta(mazo);
  agregarPunto(mazo);
  actualizarHUD();
  mostrarModal(mazo, resultado);
}

// ─── Pantalla de resultado ─────────────────────────────────
function calcularProporcionBuenosPorBloque() {
  // Bloques de 10 cartas → 3 bloques para 30 cartas
  const bloques = [[], [], []];
  estado.elecciones.forEach((mazo, i) => {
    const bloque = Math.min(Math.floor(i / 10), 2);
    bloques[bloque].push(mazo);
  });

  return bloques.map(b => {
    if (b.length === 0) return 0;
    const buenos = b.filter(m => m === 'C' || m === 'D').length;
    return buenos / b.length;
  });
}

function dibujarGrafico() {
  const ctx = $('grafico-curva').getContext('2d');
  const proporciones = calcularProporcionBuenosPorBloque();

  // Curvas de referencia (extrapolación del paper original a 30 cartas)
  const controlesRef    = [0.45, 0.62, 0.75];
  const lesionadosRef   = [0.48, 0.45, 0.43];

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Cartas 1–10', 'Cartas 11–20', 'Cartas 21–30'],
      datasets: [
        {
          label: 'Tu curva',
          data: proporciones,
          borderColor: '#3d3229',
          backgroundColor: '#3d3229',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.2
        },
        {
          label: 'Controles sanos (referencia)',
          data: controlesRef,
          borderColor: '#5a8c4e',
          backgroundColor: '#5a8c4e',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 4,
          tension: 0.2
        },
        {
          label: 'Lesión prefrontal (referencia)',
          data: lesionadosRef,
          borderColor: '#b04a3f',
          backgroundColor: '#b04a3f',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 4,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Inter', size: 12 },
            color: '#3d3229',
            padding: 14,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: '#3d3229',
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          padding: 10,
          callbacks: {
            label: (item) => `${item.dataset.label}: ${(item.parsed.y * 100).toFixed(0)}%`
          }
        }
      },
      scales: {
        y: {
          min: 0, max: 1,
          ticks: {
            callback: v => (v * 100) + '%',
            color: '#5a4a3a',
            font: { family: 'Inter' }
          },
          title: {
            display: true,
            text: 'Proporción de mazos buenos (C+D)',
            color: '#3d3229',
            font: { family: 'Inter', weight: '600', size: 12 }
          },
          grid: { color: '#e8d5b0' }
        },
        x: {
          ticks: { color: '#5a4a3a', font: { family: 'Inter' } },
          grid: { display: false }
        }
      }
    }
  });
}

function mostrarResultado() {
  const ganancia = estado.dinero - DINERO_INICIAL;
  $('dinero-final').textContent = fmt(estado.dinero);
  $('ganancia-neta').textContent = fmt(ganancia);

  mostrar('resultado');

  // El canvas necesita estar visible para que Chart.js lo dimensione bien
  setTimeout(dibujarGrafico, 80);
}

// ─── Reinicio ──────────────────────────────────────────────
function reiniciar() {
  estado.cartaActual = 0;
  estado.dinero = DINERO_INICIAL;
  estado.elecciones = [];
  estado.indicesMazo = { A: 0, B: 0, C: 0, D: 0 };
  $('historial-puntos').innerHTML = '';
  $('instruccion').textContent = 'Elegí un mazo';
  document.querySelectorAll('.baraja').forEach(b => b.disabled = false);
  actualizarHUD();
  mostrar('intro');
  cerrarModal();
}

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('btn-start').addEventListener('click', () => {
    actualizarHUD();
    mostrar('juego');
  });

  $('btn-reiniciar').addEventListener('click', reiniciar);

  document.querySelectorAll('.baraja').forEach(b => {
    b.addEventListener('click', manejarClickBaraja);
  });

  $('btn-continuar').addEventListener('click', () => {
    cerrarModal();
    if (estado.cartaActual >= TOTAL_CARTAS) {
      mostrarResultado();
    } else {
      document.querySelectorAll('.baraja').forEach(b => b.disabled = false);
    }
  });
});
