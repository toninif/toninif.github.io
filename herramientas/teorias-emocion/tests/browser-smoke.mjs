// No dependencies. Start a Chromium browser with --remote-debugging-port=9223.
// Run: node tests/browser-smoke.mjs
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const endpoint = process.env.BROWSER_CDP_URL || 'http://127.0.0.1:9223';
const tab = await (await fetch(`${endpoint}/json/new?about:blank`, {method:'PUT'})).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((done, fail) => { ws.onopen=done; ws.onerror=fail; });
let nextId=0;
const pending=new Map(), errors=[];
ws.onmessage=event=>{
  const message=JSON.parse(event.data);
  if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  if(message.id && pending.has(message.id)) {
    const {done,fail}=pending.get(message.id); pending.delete(message.id);
    if(message.error) fail(Error(message.error.message)); else done(message.result);
  }
};
function send(method,params={}) {
  return new Promise((done,fail)=>{
    const id=++nextId; pending.set(id,{done,fail}); ws.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression) {
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function viewport(width,height) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
}
async function screenshot(name) {
  // Let short color transitions settle after changing the theme or current step.
  await new Promise(r=>setTimeout(r,250));
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  const path=join(tmpdir(),`emotion-${name}.png`);
  await writeFile(path,Buffer.from(shot.data,'base64'));
  console.log(`Screenshot: ${path}`);
}
try {
  await send('Page.enable'); await send('Runtime.enable');
  await viewport(1440,1180);
  await send('Page.navigate',{url:pathToFileURL(resolve('index.html')).href});
  for(let i=0;i<100;i++) {
    if(await evaluate("document.readyState==='complete' && !!document.querySelector('#sequence .stage')")) break;
    await new Promise(r=>setTimeout(r,50));
  }
  const checks=await evaluate(`(() => {
    let count=0;
    const check=(condition,label)=>{if(!condition) throw Error(label);count++;};
    const click=selector=>document.querySelector(selector).click();
    for(const [key,data] of Object.entries(lessons)) {
      click('[data-theory="'+key+'"]');
      check(document.getElementById('theory-name').textContent===theories[key].name,key+' title');
      for(let i=0;i<data.stages.length;i++) {
        click('[data-step="'+i+'"]');
        check(document.getElementById('step-title').textContent===data.stages[i].title,key+' step '+i);
        check(document.querySelector('#sequence [aria-current="step"]').dataset.step===String(i),'Current step');
        for(const id of data.stages[i].regions) {
          click('#region-chips [data-region="'+id+'"]');
          check(!!document.querySelector('#brain-map [data-region="'+id+'"][aria-pressed="true"]'),'Map changes view for '+id);
          check(!!document.querySelector('#region-info strong'),'Region description');
        }
        click('#connections-toggle');
        check(!document.getElementById('brain-map').innerHTML.includes('NaN'),'Valid connections');
      }
      check(document.getElementById('next-btn').disabled,'Last step boundary');
      click('#overview-btn');
      check(document.querySelectorAll('#sequence .is-reached').length===data.stages.length,'Overview');
      click('#reset-btn');
      check(document.getElementById('prev-btn').disabled,'Reset boundary');
    }
    click('[data-theory="cannon"]');
    check(document.querySelectorAll('#sequence .branch-label').length===2,'Cannon parallel branches');
    click('[data-theory="schachter"]');
    check(document.querySelectorAll('#sequence .branch-label').length===2,'Two-factor merge');
    click('#compare-open');
    for(const a of Object.keys(lessons)) for(const b of Object.keys(lessons)) {
      const sa=document.getElementById('compare-a'),sb=document.getElementById('compare-b');
      sa.value=a;sb.value=b;sb.dispatchEvent(new Event('change'));
      check(document.querySelectorAll('#compare-panel-a .stage').length===lessons[a].stages.length,'Compare A '+a);
      check(document.querySelectorAll('#compare-panel-b .stage').length===lessons[b].stages.length,'Compare B '+b);
      const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
      check(ids.length===new Set(ids).size,'Unique IDs');
    }
    click('#compare-close');
    const search=document.getElementById('glossary-search');
    search.value='insula';search.dispatchEvent(new Event('input'));
    check(document.querySelectorAll('.glossary-item').length===1,'Accent-insensitive glossary');
    search.value='qwertyuiop';search.dispatchEvent(new Event('input'));
    check(!document.getElementById('glossary-empty').hidden,'Empty glossary result');
    search.value='';search.dispatchEvent(new Event('input'));
    click('[data-theory="james"]');
    document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
    check(document.querySelector('#sequence [aria-current="step"]').dataset.step==='1','Keyboard navigation');
    return count;
  })()`);
  await evaluate(`document.documentElement.dataset.theme='light'; document.querySelector('[data-step="2"]').click();`);
  await screenshot('desktop-light');
  await evaluate(`document.getElementById('workspace').scrollIntoView()`);
  await screenshot('desktop-explorer');
  await evaluate('window.scrollTo(0,0)');
  await evaluate(`document.documentElement.dataset.theme='dark'`);
  await screenshot('desktop-dark');
  await evaluate(`document.querySelector('#compare-open').click();document.getElementById('compare-a').value='cannon';document.getElementById('compare-b').value='schachter';document.getElementById('compare-b').dispatchEvent(new Event('change'));`);
  await screenshot('comparison');
  for(const width of [390,768,1024,1440]) {
    await viewport(width,1000);
    const overflow=await evaluate('document.documentElement.scrollWidth > innerWidth');
    if(overflow) throw Error('Comparison overflows at '+width);
  }
  await viewport(390,1000);
  await evaluate(`document.getElementById('compare-close').click();document.documentElement.dataset.theme='light';document.getElementById('workspace').scrollIntoView();`);
  await screenshot('mobile');
  await evaluate(`document.querySelector('.atlas').scrollIntoView();`);
  await screenshot('mobile-map');
  for(const width of [320,390,768,1024,1440]) {
    await viewport(width,1000);
    if(await evaluate('document.documentElement.scrollWidth > innerWidth')) throw Error('Explorer overflows at '+width);
  }
  await evaluate(`document.getElementById('reset-btn').click();document.getElementById('play-btn').click();`);
  await new Promise(r=>setTimeout(r,4400));
  if(await evaluate(`document.querySelector('#sequence [aria-current="step"]').dataset.step`) !== '1') throw Error('Playback does not advance');
  await evaluate(`document.getElementById('play-btn').click();`);
  await new Promise(r=>setTimeout(r,4400));
  if(await evaluate(`document.querySelector('#sequence [aria-current="step"]').dataset.step`) !== '1') throw Error('Pause does not stop playback');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await evaluate(`document.getElementById('connections-toggle').checked=true;document.getElementById('connections-toggle').dispatchEvent(new Event('change'));`);
  if(await evaluate(`[...document.querySelectorAll('.map-route')].some(el=>getComputedStyle(el).animationName!=='none')`)) throw Error('Reduced motion ignored');
  if(errors.length) throw Error(errors.join('\n'));
  console.log('PASS: '+checks+' content/interaction checks; responsive layouts, playback, pause, reduced motion; no JS exceptions.');
} finally {
  await send('Page.close').catch(()=>{});
  ws.close();
}
