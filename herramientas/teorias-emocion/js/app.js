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

  function buildCompareSvg(theoryKey) {
    const theory = theories[theoryKey];
    const lastStep = theory.steps[theory.steps.length - 1];
    const activeStructs = lastStep.structs;
    const paths = lastStep.paths;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 800 500');
    svg.setAttribute('xmlns', svgNS);

    const defs = document.createElementNS(svgNS, 'defs');
    defs.innerHTML = `
      <marker id="arrow-cmp-${theoryKey}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M2 1L9 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </marker>
      <radialGradient id="cortex-grad-${theoryKey}" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#F2E4CC"/>
        <stop offset="100%" stop-color="#C9A878"/>
      </radialGradient>
    `;
    svg.appendChild(defs);

    const cortex = document.createElementNS(svgNS, 'path');
    cortex.setAttribute('d', 'M 95 250 Q 75 130, 200 85 Q 320 50, 460 60 Q 600 70, 670 130 Q 715 175, 705 240 Q 720 285, 685 320 Q 660 345, 615 350 L 580 350 Q 565 365, 540 365 L 230 365 Q 195 365, 170 345 Q 115 320, 100 290 Q 90 270, 95 250 Z');
    cortex.setAttribute('fill', `url(#cortex-grad-${theoryKey})`);
    cortex.setAttribute('stroke', '#7A5C38');
    cortex.setAttribute('stroke-width', '1.2');
    svg.appendChild(cortex);

    const cerebellum = document.createElementNS(svgNS, 'path');
    cerebellum.setAttribute('d', 'M 685 295 Q 730 305, 745 350 Q 752 400, 720 430 Q 685 445, 655 425 Q 638 405, 645 380 L 670 360 Q 678 330, 685 295 Z');
    cerebellum.setAttribute('fill', '#A8855A');
    cerebellum.setAttribute('stroke', '#6B4F2D');
    cerebellum.setAttribute('stroke-width', '1');
    svg.appendChild(cerebellum);

    const brainstem = document.createElementNS(svgNS, 'path');
    brainstem.setAttribute('d', 'M 555 350 Q 562 380, 585 415 Q 590 450, 600 480');
    brainstem.setAttribute('stroke', '#A8855A');
    brainstem.setAttribute('stroke-width', '18');
    brainstem.setAttribute('fill', 'none');
    brainstem.setAttribute('stroke-linecap', 'round');
    svg.appendChild(brainstem);

    const structureData = {
      's-stimulus': { type: 'circle', cx: 55, cy: 245, r: 22, fill: '#7A6B5D' },
      's-thalamus': { type: 'ellipse', cx: 395, cy: 235, rx: 38, ry: 22, fill: '#D85A30' },
      's-hypothalamus': { type: 'ellipse', cx: 378, cy: 278, rx: 22, ry: 13, fill: '#F0997B' },
      's-amygdala': { type: 'ellipse', cx: 320, cy: 285, rx: 20, ry: 15, fill: '#D4537E' },
      's-hippocampus': { type: 'path', d: 'M 270 295 Q 263 320, 290 325 Q 308 322, 305 300 Q 300 288, 280 290 Z', fill: '#ED93B1' },
      's-insula': { type: 'path', d: 'M 215 215 Q 208 240, 220 260 Q 245 268, 258 245 Q 252 215, 230 210 Z', fill: '#1D9E75' },
      's-vmpfc': { type: 'path', d: 'M 155 215 Q 138 240, 150 270 Q 170 285, 195 275 Q 200 250, 188 225 Q 175 215, 155 215 Z', fill: '#7F77DD' },
      's-acc': { type: 'path', d: 'M 265 155 Q 305 138, 350 142 Q 385 148, 405 165 Q 380 178, 345 175 Q 300 175, 265 178 Z', fill: '#AFA9EC' },
      's-dlpfc': { type: 'path', d: 'M 195 120 Q 230 100, 270 108 Q 285 130, 260 145 Q 230 152, 200 145 Q 185 132, 195 120 Z', fill: '#378ADD' },
      's-somato': { type: 'path', d: 'M 425 105 Q 465 92, 505 102 Q 518 125, 500 138 Q 465 145, 430 138 Q 418 122, 425 105 Z', fill: '#5DCAA5' },
      's-cortex-assoc': { type: 'path', d: 'M 540 130 Q 585 118, 625 138 Q 640 160, 625 185 Q 590 195, 555 185 Q 535 160, 540 130 Z', fill: '#CECBF6' },
      's-sna': { type: 'rect', x: 500, y: 445, width: 220, height: 42, rx: 21, fill: '#D85A30' }
    };

    Object.entries(structureData).forEach(([id, data]) => {
      const isActive = activeStructs.includes(id);
      const opacity = isActive ? 1 : 0.18;

      let el;
      if (data.type === 'circle') {
        el = document.createElementNS(svgNS, 'circle');
        el.setAttribute('cx', data.cx);
        el.setAttribute('cy', data.cy);
        el.setAttribute('r', data.r);
      } else if (data.type === 'ellipse') {
        el = document.createElementNS(svgNS, 'ellipse');
        el.setAttribute('cx', data.cx);
        el.setAttribute('cy', data.cy);
        el.setAttribute('rx', data.rx);
        el.setAttribute('ry', data.ry);
      } else if (data.type === 'path') {
        el = document.createElementNS(svgNS, 'path');
        el.setAttribute('d', data.d);
      } else if (data.type === 'rect') {
        el = document.createElementNS(svgNS, 'rect');
        el.setAttribute('x', data.x);
        el.setAttribute('y', data.y);
        el.setAttribute('width', data.width);
        el.setAttribute('height', data.height);
        el.setAttribute('rx', data.rx);
      }
      el.setAttribute('fill', data.fill);
      el.setAttribute('opacity', opacity);
      el.setAttribute('stroke', '#444');
      el.setAttribute('stroke-width', '0.5');
      svg.appendChild(el);
    });

    paths.forEach(p => {
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', curvedPath(p[0], p[1]));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#534AB7');
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('marker-end', `url(#arrow-cmp-${theoryKey})`);
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
      text.setAttribute('font-size', '11');
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
      panel.appendChild(buildCompareSvg(theoryKey));
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
