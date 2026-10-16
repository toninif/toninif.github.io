(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const keys = Object.keys(lessons);
  const state = { theory:'james', step:0, overview:false, mapView:'lateral', selected:null, playing:false, mode:'explore' };
  let timer = null;
  const number = n => String(n).padStart(2,'0');
  const lesson = () => lessons[state.theory];
  const stage = () => lesson().stages[state.step];
  const activeRegions = () => state.overview ? [...new Set(lesson().stages.flatMap(s => s.regions))] : stage().regions;
  const regionName = id => mapRegions[id].short;
  const glossaryItem = id => glossary.find(item => item.id === id);
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Essential line styles are SVG attributes so the illustration stands on its own.
  const outline = 'M 87 204 C 73 181 79 155 95 140 C 90 118 109 98 132 93 C 143 69 171 62 192 68 C 215 48 245 54 263 59 C 288 49 315 57 335 67 C 365 64 389 82 400 101 C 425 107 440 126 441 147 C 461 163 468 189 458 209 C 465 235 443 256 418 263 C 390 282 356 269 334 262 C 307 256 291 273 267 284 C 242 297 219 287 200 290 C 178 292 159 280 145 266 C 118 266 103 247 99 227 C 91 222 87 213 87 204 Z';
  const folds = [
    'M 94 162 C 119 165 113 130 133 126 C 148 125 154 108 149 90',
    'M 93 196 C 118 203 122 179 140 175 C 156 171 143 146 159 141',
    'M 111 224 C 133 230 135 206 155 205 M 137 248 Q 164 256 174 235',
    'M 170 119 C 184 112 171 97 189 88 C 205 81 206 70 217 65',
    'M 201 115 C 209 99 229 107 234 88 L 236 67',
    'M 249 113 C 269 97 255 84 273 72',
    'M 286 111 C 300 104 288 87 307 77',
    'M 321 126 C 338 113 325 99 344 86',
    'M 349 150 C 364 141 352 125 370 118 C 385 112 380 103 388 100',
    'M 378 181 C 390 167 379 150 397 144 C 411 140 414 150 432 147',
    'M 406 211 C 397 192 416 188 417 175 C 425 167 440 182 451 177',
    'M 391 242 C 406 222 424 239 439 219',
    'M 340 245 C 353 230 371 244 381 225',
    'M 181 268 C 198 251 213 270 232 255 M 244 276 Q 264 264 273 246'
  ];
  function anatomySvg(view) {
    const lines = folds.map(d => `<path d="${d}"/>`).join('');
    const medial = `<path d="M 155 202 C 150 158 188 123 235 121 C 289 116 341 142 368 176 C 389 201 400 223 388 234 C 369 245 343 219 321 230 C 294 242 278 256 249 263 C 218 269 190 255 179 240 C 167 226 161 219 155 202 Z" fill="#6d8876" fill-opacity=".2" stroke="#a8b798" stroke-opacity=".25"/>
      <path d="M 180 199 C 162 173 187 149 213 143 C 253 131 304 142 327 164 C 341 177 346 196 332 205 C 322 211 311 203 315 193 C 320 177 284 159 251 158 C 219 156 193 164 196 181 L 204 193 Z" fill="#abc49b" fill-opacity=".2" stroke="#c7d2b4" stroke-opacity=".55" stroke-width="1.3"/>
      <path d="M 204 193 Q 256 169 302 191" fill="none" stroke="#d0d5b5" stroke-width="3" opacity=".22"/>
      <path d="M 270 164 C 303 157 320 181 303 200 C 285 216 252 199 258 182 Z" fill="#b7cc9e" fill-opacity=".08" stroke="#acc198" stroke-opacity=".3"/>
      <path d="M 214 242 C 214 262 246 271 273 260 Q 295 251 302 233" fill="none" stroke="#a5bda1" stroke-width="9" opacity=".18" stroke-linecap="round"/>`;
    const lateral = `<g fill="none" stroke="#adc1a7" stroke-opacity=".36" stroke-width="1.6" stroke-linecap="round"><path d="M 274 71 C 263 100 281 120 265 139 C 249 156 259 173 244 188"/><path d="M 296 75 C 282 101 302 125 284 143 Q 271 156 270 175"/><path d="M 135 209 C 177 191 202 207 229 189 C 261 174 293 203 324 189 Q 348 178 370 185"/><path d="M 183 240 C 204 217 223 239 240 223 C 262 205 283 224 304 212 M 259 255 Q 281 238 305 240"/></g>
      <path d="M 216 194 C 236 181 267 184 280 202 C 286 224 259 242 236 236 C 218 230 206 210 216 194 Z" fill="#afc5a4" fill-opacity=".12" stroke="#b9cfae" stroke-opacity=".4" stroke-dasharray="3 4"/>`;
    return `<g aria-hidden="true" pointer-events="none">
      <g fill="none" stroke="#77958d" stroke-width=".5" opacity=".12"><ellipse cx="267" cy="190" rx="214" ry="153"/><path d="M 50 190 H 480 M 267 30 V 350"/></g>
      <path d="${outline}" fill="#789580" fill-opacity=".12" stroke="#bbccb1" stroke-opacity=".6" stroke-width="1.5"/>
      <g fill="none" stroke="#a8bda5" stroke-width="1.15" stroke-opacity=".28" stroke-linecap="round">${lines}</g>
      ${view === 'medial' ? medial : lateral}
      <path d="M 302 245 Q 324 257 327 282 C 341 294 335 310 342 327 L 330 330 C 319 310 310 304 313 290 Q 298 278 295 260 Z" fill="#9cb296" fill-opacity=".15" stroke="#b7c9ab" stroke-opacity=".4"/>
      <path d="M 339 267 C 365 258 407 264 421 287 C 433 307 408 322 383 319 C 354 317 329 299 332 283 Z" fill="#8fa985" fill-opacity=".16" stroke="#b7c9ab" stroke-opacity=".4"/>
      <g fill="none" stroke="#a9bb9e" stroke-opacity=".28" stroke-width="1"><path d="M 340 278 Q 380 269 415 290 M 336 286 Q 382 277 420 298 M 340 295 Q 380 287 414 306 M 352 306 Q 382 299 403 313"/></g>
      <text x="84" y="326" fill="#9bad9f" font-size="8" letter-spacing="2">ANTERIOR</text><text x="458" y="326" text-anchor="end" fill="#9bad9f" font-size="8" letter-spacing="2">POSTERIOR</text>
    </g>`;
  }

  function stageMarkup(item, index, interactive, reached, current) {
    const tag = interactive ? 'button' : 'div';
    const attrs = interactive ? `type="button" data-step="${index}" aria-label="Paso ${index + 1}: ${escape(item.title)}" ${current ? 'aria-current="step"' : ''}` : '';
    const branches = item.branches ? item.branches.map((b,i) => `${i ? '<span class="branch-join">+</span>' : ''}<span class="branch-label" data-kind="${b.kind}">${escape(b.title)}</span>`).join('') : '';
    return `<${tag} class="stage${reached?' is-reached':''}${current?' is-current':''}" data-kind="${item.kind}" ${attrs}><span class="stage-number">${number(index+1)}</span><span class="stage-title">${escape(item.title)}</span>${branches}</${tag}>`;
  }
  function renderNavigation() {
    $('theory-nav').innerHTML = keys.map((key,i) => `<button class="theory-nav-button" data-theory="${key}" aria-pressed="${state.mode==='explore' && key===state.theory}"><span class="nav-number">${number(i+1)}</span><span><strong>${escape(theories[key].name)}</strong><small>${escape(lessons[key].tag)}</small></span></button>`).join('');
    $('compare-open').setAttribute('aria-pressed',state.mode==='compare');
  }
  function renderSequence() {
    const focusedStep = document.activeElement?.dataset.step;
    $('sequence').innerHTML = lesson().stages.map((s,i) => stageMarkup(s,i,true,state.overview || i<=state.step,!state.overview && i===state.step)).join('');
    if (focusedStep !== undefined) $('sequence').querySelector(`[data-step="${focusedStep}"]`)?.focus({preventScroll:true});
    $('overview-btn').setAttribute('aria-pressed',state.overview);
    $('overview-btn').textContent = state.overview ? 'Volver al paso a paso ↙' : 'Ver secuencia completa ↗';
    $('step-counter').textContent = state.overview ? `${lesson().stages.length} pasos · Vista completa` : `Paso ${state.step+1} de ${lesson().stages.length}`;
    $('prev-btn').disabled = !state.overview && state.step===0;
    $('next-btn').disabled = !state.overview && state.step===lesson().stages.length-1;
  }
  function renderDetail() {
    const current = stage();
    $('step-kicker').textContent = state.overview ? 'LA PROPUESTA COMPLETA' : `PASO ${number(state.step+1)} · ${lesson().tag.toUpperCase()}`;
    $('step-title').textContent = state.overview ? 'Una mirada de conjunto' : current.title;
    $('step-description').textContent = state.overview ? lesson().takeaway : current.text;
    $('step-example').textContent = state.overview ? lesson().stages.map(s => s.example).join(' ') : current.example;
    $('region-chips').innerHTML = activeRegions().map(id => `<button class="region-chip" data-region="${id}" aria-pressed="${state.selected===id}">${escape(regionName(id))}</button>`).join('');
    renderRegionInfo();
  }
  function renderRegionInfo() {
    const item = glossaryItem(state.selected);
    $('region-info').innerHTML = item ? `<strong>${escape(item.name)}</strong><p>${escape(item.role)}</p>` : '<p>Tocá una estructura del mapa o elegí su nombre para conocer su función.</p>';
    $('region-chips').querySelectorAll('[data-region]').forEach(b => b.setAttribute('aria-pressed',b.dataset.region===state.selected));
  }
  function renderMap() {
    const visible = Object.keys(mapRegions).filter(id => mapRegions[id].views.includes(state.mapView));
    const active = activeRegions();
    const routes = state.overview ? theories[state.theory].steps.at(-1).paths : theories[state.theory].steps[stage().neuro].paths;
    const routeSvg = $('connections-toggle').checked ? routes.filter(([a,b]) => visible.includes(a) && visible.includes(b)).map(([a,b]) => {
      const [x,y]=mapRegions[a].point, [xx,yy]=mapRegions[b].point;
      return `<path class="map-route" d="M ${x} ${y} Q ${(x+xx)/2+20} ${(y+yy)/2-25} ${xx} ${yy}" marker-end="url(#map-arrow)"/>`;
    }).join('') : '';
    const nodes = visible.map(id => {
      const r=mapRegions[id], [x,y]=r.point, [lx,ly]=r.label;
      const isActive=active.includes(id), name=glossaryItem(id)?.name || r.short;
      return `<g class="map-region${isActive?' is-active':''}${id===state.selected?' is-selected':''}" data-region="${id}" role="button" tabindex="0" aria-label="${escape(name)}${isActive?', en este paso':''}" aria-pressed="${id===state.selected}"><title>${escape(name)}</title><path class="map-leader" d="M ${x} ${y} L ${lx} ${ly-4}"/><circle class="region-hit" cx="${x}" cy="${y}" r="19"/><circle class="region-ring" cx="${x}" cy="${y}" r="${isActive?9:6}"/><circle class="region-core" cx="${x}" cy="${y}" r="2.5"/><text class="map-label" x="${lx}" y="${ly}" text-anchor="middle">${escape(r.short)}</text></g>`;
    }).join('');
    $('brain-map').innerHTML = `<svg viewBox="0 0 520 390" xmlns="http://www.w3.org/2000/svg" role="group" aria-labelledby="map-title map-desc"><title id="map-title">${state.mapView==='medial'?'Corte medial':'Vista lateral'} del cerebro</title><desc id="map-desc">Mapa esquemático interactivo. Elegí una estructura para consultar su función. Las posiciones y conexiones son simplificadas.</desc><defs><marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#badd9b" stroke-width="1.5"/></marker></defs>${anatomySvg(state.mapView)}${routeSvg}${nodes}</svg>`;
    document.querySelectorAll('[data-map-view]').forEach(b => b.setAttribute('aria-pressed',b.dataset.mapView===state.mapView));
    document.querySelector('.atlas-index').textContent = state.mapView==='medial' ? '01 / 02' : '02 / 02';
    const other = active.filter(id => !visible.includes(id)).length;
    $('map-caption').textContent = (state.mapView==='medial' ? 'Corte esquemático con núcleos profundos proyectados.' : 'Superficie lateral; ínsula profunda proyectada.') + (other ? ` ${other} ${other===1?'estructura de este paso está':'estructuras de este paso están'} en la otra vista.` : '');
  }
  function selectRegion(id, changeView=false) {
    if(id==='s-stimulus') {
      state.selected=id;
      $('region-info').innerHTML='<strong>Estímulo</strong><p>Información del entorno que inicia el ejemplo. No es una estructura cerebral.</p>';
      $('region-chips').querySelectorAll('[data-region]').forEach(b=>b.setAttribute('aria-pressed','false'));
    } else {state.selected=id; renderRegionInfo();}
    if(changeView && !mapRegions[id].views.includes(state.mapView)) {state.mapView=mapRegions[id].views[0]; renderMap();}
    else $('brain-map').querySelectorAll('[data-region]').forEach(el => {el.classList.toggle('is-selected',el.dataset.region===id); el.setAttribute('aria-pressed',el.dataset.region===id);});
  }
  function render() {
    $('theory-tag').textContent=lesson().tag.toUpperCase();
    $('theory-name').textContent=theories[state.theory].name;
    $('theory-year').textContent=theories[state.theory].year;
    $('theory-claim').textContent=lesson().title;
    $('takeaway').textContent=lesson().takeaway;
    renderSequence(); renderDetail(); renderMap();
  }
  function stop() {clearTimeout(timer); timer=null; state.playing=false; $('play-btn').textContent='▶ Reproducir'; $('play-btn').setAttribute('aria-pressed','false');}
  function setStep(index, manual=true) {
    if(manual) stop();
    state.overview=false;
    state.step=Math.max(0,Math.min(index,lesson().stages.length-1));
    state.mapView=stage().view;
    state.selected=null;
    render();
  }
  function tick() {
    timer=setTimeout(() => {
      if(!state.playing) return;
      if(state.step===lesson().stages.length-1) {stop(); return;}
      setStep(state.step+1,false); tick();
    }, 4200);
  }
  function showMode(mode) {
    stop(); state.mode=mode;
    $('explore-view').hidden=mode!=='explore'; $('compare-view').hidden=mode!=='compare';
    renderNavigation();
    if(mode==='compare') renderCompare();
  }
  function renderCompare() {
    const a=$('compare-a').value,b=$('compare-b').value;
    [['a',a],['b',b]].forEach(([panel,key]) => {
      const data=lessons[key], regions=[...new Set(data.stages.flatMap(s=>s.regions))];
      $(`compare-panel-${panel}`).innerHTML=`<p class="compare-subtitle">${escape(data.title)}</p><div class="compare-sequence">${data.stages.map((s,i)=>stageMarkup(s,i,false,true,false)).join('')}</div><p class="compare-example">${escape(data.stages.at(-1).example)}</p><p class="compare-neuro"><strong>Asociaciones neuroanatómicas</strong>${regions.map(id=>escape(regionName(id))).join(' · ')}</p>`;
    });
    $('compare-table-head').innerHTML=`<tr><th scope="col">En qué fijarte</th><th scope="col">${escape(theories[a].name)}</th><th scope="col">${escape(theories[b].name)}</th></tr>`;
    $('compare-table-body').innerHTML=['Papel del cuerpo','Papel de la evaluación','Relación propuesta'].map((title,i)=>`<tr><th scope="row">${title}</th><td>${escape(lessons[a].dimensions[i])}</td><td>${escape(lessons[b].dimensions[i])}</td></tr>`).join('');
  }
  function renderGlossary() {
    const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const query=normalize($('glossary-search').value.trim());
    const items=glossary.filter(item=>normalize(item.name+' '+item.role).includes(query));
    $('glossary-content').innerHTML=items.map(item=>`<article class="glossary-item"><h3>${escape(item.name)}</h3><p>${escape(item.role)}</p><p class="ref">${escape(item.ref)}</p></article>`).join('');
    $('glossary-empty').hidden=items.length>0;
  }
  try {const saved=localStorage.getItem('emotion-theme'); if(['light','dark'].includes(saved)) document.documentElement.dataset.theme=saved;} catch {}
  $('theme-toggle').addEventListener('click',()=>{
    const dark=getComputedStyle(document.documentElement).colorScheme==='dark';
    const theme=dark?'light':'dark'; document.documentElement.dataset.theme=theme;
    try{localStorage.setItem('emotion-theme',theme);}catch{}
  });
  $('theory-nav').addEventListener('click',event=>{
    const b=event.target.closest('[data-theory]'); if(!b) return;
    state.theory=b.dataset.theory; state.step=0; state.overview=false; state.selected=null; state.mapView=stage().view;
    showMode('explore'); render();
    $('theory-nav').querySelector(`[data-theory="${state.theory}"]`).focus({preventScroll:true});
  });
  $('sequence').addEventListener('click',event=>{const b=event.target.closest('[data-step]'); if(b) setStep(Number(b.dataset.step));});
  $('prev-btn').addEventListener('click',()=>setStep(state.overview?0:state.step-1));
  $('next-btn').addEventListener('click',()=>setStep(state.overview?0:state.step+1));
  $('reset-btn').addEventListener('click',()=>setStep(0));
  $('overview-btn').addEventListener('click',()=>{stop(); state.overview=!state.overview; state.selected=null; render();});
  $('play-btn').addEventListener('click',()=>{
    if(state.playing) {stop(); return;}
    if(state.overview || state.step===lesson().stages.length-1) setStep(0);
    state.playing=true; $('play-btn').textContent='Ⅱ Pausar'; $('play-btn').setAttribute('aria-pressed','true'); tick();
  });
  document.querySelectorAll('[data-map-view]').forEach(b=>b.addEventListener('click',()=>{state.mapView=b.dataset.mapView; renderMap();}));
  $('connections-toggle').addEventListener('change',renderMap);
  $('region-chips').addEventListener('click',event=>{const b=event.target.closest('[data-region]'); if(b) {stop(); selectRegion(b.dataset.region,true);}});
  $('brain-map').addEventListener('click',event=>{const el=event.target.closest('[data-region]'); if(el) {stop(); selectRegion(el.dataset.region);}});
  $('brain-map').addEventListener('pointerover',event=>{const el=event.target.closest('[data-region]'); if(el && event.pointerType==='mouse') selectRegion(el.dataset.region);});
  $('brain-map').addEventListener('focusin',event=>{const el=event.target.closest('[data-region]'); if(el) selectRegion(el.dataset.region);});
  $('brain-map').addEventListener('keydown',event=>{const el=event.target.closest('[data-region]'); if(el && ['Enter',' '].includes(event.key)) {event.preventDefault(); selectRegion(el.dataset.region);}});
  $('compare-open').addEventListener('click',()=>{showMode('compare'); $('compare-a').focus({preventScroll:true});});
  $('compare-close').addEventListener('click',()=>{showMode('explore'); $('compare-open').focus({preventScroll:true});});
  ['a','b'].forEach((panel,i)=>{const select=$(`compare-${panel}`); select.innerHTML=keys.map(key=>`<option value="${key}">${escape(theories[key].name)}</option>`).join(''); select.value=i?'lazarus':'zajonc'; select.addEventListener('change',renderCompare);});
  $('glossary-search').addEventListener('input',renderGlossary);
  document.addEventListener('keydown',event=>{
    if(state.mode!=='explore' || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,select,textarea,[contenteditable="true"],#resources')) return;
    if(event.key==='ArrowRight') {event.preventDefault(); setStep(state.overview?0:state.step+1);}
    if(event.key==='ArrowLeft') {event.preventDefault(); setStep(state.overview?0:state.step-1);}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden) stop();});
  renderNavigation(); renderGlossary(); render();
})();
