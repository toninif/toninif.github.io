(function() {
  'use strict';

  let currentTheory = 'james';
  let currentStep = 0;
  let currentView = 'single';

  const pathsLayer = document.getElementById('paths-layer');
  const leaderLabelsLayer = document.getElementById('leader-labels');
  const allStructs = document.querySelectorAll('#brain-structures .struct');
  const hoverInfo = document.getElementById('hover-info');

  function curvedPath(from, to) {
    const [x1, y1] = positions[from];
    const [x2, y2] = positions[to];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = Math.min(40, dist * 0.2);
    const cx = mx - (dy / dist) * offset;
    const cy = my + (dx / dist) * offset;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  function renderLeaderLabels(activeStructs) {
    leaderLabelsLayer.innerHTML = '';
    activeStructs.forEach(structId => {
      const label = labelPositions[structId];
      if (!label) return;
      const [sx, sy] = positions[structId];

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', label.lx);
      text.setAttribute('y', label.ly);
      text.setAttribute('text-anchor', label.anchor);
      text.setAttribute('class', 'leader-label');
      text.textContent = label.title;
      leaderLabelsLayer.appendChild(text);
    });
  }

  function render() {
    const theory = theories[currentTheory];
    const step = theory.steps[currentStep];

    allStructs.forEach(s => {
      if (step.structs.includes(s.id)) {
        s.classList.remove('dim');
        s.classList.add('active');
      } else {
        s.classList.add('dim');
        s.classList.remove('active');
      }
    });

    pathsLayer.innerHTML = '';
    step.paths.forEach((p, i) => {
      const d = curvedPath(p[0], p[1]);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('marker-end', 'url(#arrow-active)');
      path.classList.add('path-arrow', 'show');
      pathsLayer.appendChild(path);

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '5');
      dot.setAttribute('style', `offset-path: path('${d}'); animation-delay: ${i * 0.35}s; --flow-dur: ${theory.flowDuration}s;`);
      dot.classList.add('flow-dot', 'show');
      pathsLayer.appendChild(dot);
    });

    renderLeaderLabels(step.structs);

    document.getElementById('theory-name').textContent = theory.name;
    document.getElementById('theory-year').textContent = theory.year;
    document.getElementById('theory-claim').textContent = theory.claim;
    document.getElementById('step-counter').textContent = `Paso ${currentStep + 1} de ${theory.steps.length}`;

    const trail = document.getElementById('step-trail');
    trail.innerHTML = '';
    theory.steps.forEach((s, i) => {
      const pill = document.createElement('span');
      pill.className = 'step-pill' + (i === currentStep ? ' current' : '');
      pill.textContent = `${i + 1}. ${s.label}`;
      pill.addEventListener('click', () => {
        currentStep = i;
        render();
      });
      trail.appendChild(pill);
    });

    document.getElementById('prev-btn').disabled = currentStep === 0;
    document.getElementById('next-btn').disabled = currentStep === theory.steps.length - 1;
  }

  function setupTheoryButtons() {
    document.querySelectorAll('.theory-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theory = btn.dataset.theory;

        if (theory === 'compare') {
          document.querySelectorAll('.theory-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          showView('compare');
        } else {
          document.querySelectorAll('.theory-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentTheory = theory;
          currentStep = 0;
          showView('single');
          render();
        }
      });
    });
  }

  function showView(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    if (view === 'compare') renderCompare();
  }

  function setupControls() {
    document.getElementById('prev-btn').addEventListener('click', () => {
      if (currentStep > 0) { currentStep--; render(); }
    });
    document.getElementById('next-btn').addEventListener('click', () => {
      if (currentStep < theories[currentTheory].steps.length - 1) {
        currentStep++;
        render();
      }
    });
    document.getElementById('all-btn').addEventListener('click', () => {
      currentStep = theories[currentTheory].steps.length - 1;
      render();
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      currentStep = 0;
      render();
    });

    document.addEventListener('keydown', (e) => {
      if (currentView !== 'single') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowRight') {
        if (currentStep < theories[currentTheory].steps.length - 1) {
          currentStep++;
          render();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          currentStep--;
          render();
        }
      }
    });
  }

  function setupHover() {
    allStructs.forEach(s => {
      const handler = () => {
        const name = s.dataset.name;
        const info = s.dataset.info;
        hoverInfo.innerHTML = `<strong>${name}</strong> · ${info}`;
      };
      s.addEventListener('mouseenter', handler);
      s.addEventListener('focus', handler);
      s.addEventListener('mouseleave', () => {
        hoverInfo.innerHTML = '<span class="hover-hint">Pasá el cursor sobre las estructuras para ver su nombre y función</span>';
      });
      s.setAttribute('tabindex', '0');
    });
  }

  function renderGlossary() {
    const container = document.getElementById('glossary-content');
    container.innerHTML = '';
    glossary.forEach(item => {
      const div = document.createElement('div');
      div.className = 'glossary-item';
      div.innerHTML = `
        <h4><span class="glossary-color-dot" style="background:${item.color}"></span>${item.name}</h4>
        <p class="role">${item.role}</p>
        <p class="ref">${item.ref}</p>
      `;
      container.appendChild(div);
    });
  }

  function buildCompareSvg(theoryKey, panelId) {
    const theory = theories[theoryKey];
    const lastStep = theory.steps[theory.steps.length - 1];
    const activeStructs = lastStep.structs;
    const paths = lastStep.paths;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 800 500');
    svg.setAttribute('xmlns', svgNS);

    // Reuse the main illustration so both views share anatomy and structures.
    // Namespace every SVG reference, including when both panels show one theory.
    const prefix = `${panelId}-`;
    const source = document.getElementById('brain-svg');
    const defs = source.querySelector('defs').cloneNode(true);
    const anatomy = document.getElementById('brain-anatomy').cloneNode(true);
    const structures = document.getElementById('brain-structures').cloneNode(true);
    structures.querySelectorAll('.struct').forEach(structure => {
      const isActive = activeStructs.includes(structure.id);
      structure.classList.toggle('active', isActive);
      structure.classList.toggle('dim', !isActive);
      structure.removeAttribute('tabindex');
    });
    [defs, anatomy, structures].forEach(layer => {
      [layer, ...layer.querySelectorAll('*')].forEach(element => {
        if (element.id) element.id = prefix + element.id;
        [...element.attributes].forEach(attribute => {
          if (attribute.value.includes('url(#')) {
            element.setAttribute(attribute.name, attribute.value.replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`));
          }
        });
      });
      svg.appendChild(layer);
    });
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${theory.name}: vía completa, vista esquemática con áreas proyectadas`);

    paths.forEach(p => {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', curvedPath(p[0], p[1]));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'var(--color-active)');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('marker-end', `url(#${prefix}arrow-active)`);
      path.setAttribute('opacity', '0.85');
      svg.appendChild(path);
    });

    activeStructs.forEach(structId => {
      const label = labelPositions[structId];
      if (!label) return;
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', label.lx);
      text.setAttribute('y', label.ly);
      text.setAttribute('text-anchor', label.anchor);
      text.setAttribute('class', 'leader-label');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.setAttribute('font-weight', '500');
      text.setAttribute('fill', 'currentColor');
      text.textContent = label.title;
      svg.appendChild(text);
    });

    return svg;
  }

  function renderCompare() {
    const a = document.getElementById('compare-a').value;
    const b = document.getElementById('compare-b').value;

    [['compare-panel-a', a], ['compare-panel-b', b]].forEach(([panelId, theoryKey]) => {
      const theory = theories[theoryKey];
      const panel = document.getElementById(panelId);
      panel.innerHTML = `
        <h3>${theory.name}</h3>
        <p class="year">${theory.year}</p>
        <p class="compare-claim">${theory.claim}</p>
      `;
      panel.appendChild(buildCompareSvg(theoryKey, panelId));
    });
  }

  function setupCompareSelectors() {
    document.getElementById('compare-a').addEventListener('change', renderCompare);
    document.getElementById('compare-b').addEventListener('change', renderCompare);
  }

  function init() {
    setupTheoryButtons();
    setupControls();
    setupHover();
    setupCompareSelectors();
    renderGlossary();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
