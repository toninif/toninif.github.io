const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../management.js'), 'utf8');

test('borrador de correo contiene el destinatario y enlace exactos, sin enviar nada', () => {
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const link = 'https://fernandotonini.com.ar/evaluaciones/?access=abc_123-xyz';
  const href = context.buildInvitationMailto('persona+test@example.com', link);
  assert.ok(href.startsWith('mailto:persona%2Btest%40example.com?'));
  const query = new URLSearchParams(href.split('?')[1]);
  assert.ok(query.get('body').includes(link));
  assert.equal(query.get('subject'), 'Acceso a tu evaluación');
  assert.throws(() => context.buildInvitationMailto('a@example.com?bcc=x@example.com', link));
  assert.throws(() => context.buildInvitationMailto('a@example.com\r\nBcc:x@y.com', link));
  assert.throws(() => context.buildInvitationMailto('', link));
});

test('observaciones: guarda el id correcto y permite continuar la revisión', async () => {
  const input = {value:'Observación <privada>', dataset:{saved:'', evaluationId:'eval-1'}};
  const message = {}, button = {};
  let calls = 0;
  const context = vm.createContext({
    notifyAction: () => {},
    document:{querySelector:s => s === '#review-notes' ? input : s === '#review-note-message' ? message : button},
    supabaseClient:{rpc:async (name,args) => {
      calls++;
      assert.equal(name,'save_review_notes');
      assert.equal(args.target_evaluation_id,'eval-1');
      assert.equal(args.notes,input.value);
      return {data:true,error:null};
    }}
  });
  vm.runInContext(source,context);
  vm.runInContext('notifyAction = () => {}',context);
  assert.equal(await context.savePendingReviewNotes(),true);
  assert.equal(input.dataset.saved,input.value);
  assert.equal(button.disabled,false);
  assert.equal(await context.savePendingReviewNotes(),true);
  assert.equal(calls,1);
});

test('si falla el guardado conserva el texto y detiene la revisión', async () => {
  const input = {value:'Texto pendiente', dataset:{saved:'Anterior',evaluationId:'eval-2'}};
  const message = {}, button = {};
  const context = vm.createContext({
    document:{querySelector:s => s === '#review-notes' ? input : s === '#review-note-message' ? message : button},
    supabaseClient:{rpc:async () => ({error:{message:'Error de conexión'}})}
  });
  vm.runInContext(source,context);
  vm.runInContext('notifyAction = () => {}',context);
  assert.equal(await context.savePendingReviewNotes(),false);
  assert.equal(input.value,'Texto pendiente');
  assert.equal(input.dataset.saved,'Anterior');
  assert.equal(input.disabled,false);
  assert.match(message.textContent,/Error de conexión/);
});

test('Gmail precarga el correo y el enlace sin agregar destinatarios por parámetros', () => {
  const context = vm.createContext({URLSearchParams});
  vm.runInContext(source,context);
  const link = 'https://fernandotonini.com.ar/evaluaciones/?access=abc-123&extra=1';
  const url = new URL(context.buildInvitationGmail('persona+prueba@example.com',link));
  assert.equal(url.origin,'https://mail.google.com');
  assert.equal(url.searchParams.get('to'),'persona+prueba@example.com');
  assert.ok(url.searchParams.get('body').includes(link));
  assert.equal(url.searchParams.get('view'),'cm');
  assert.equal(url.searchParams.has('bcc'),false);
  assert.throws(() => context.buildInvitationGmail('a@example.com?bcc=b@example.com',link));
});

test('copiar confirma en el botón y aviso; si falla ofrece selección manual', async () => {
  const nodes = {};
  for (const selector of ['.share-link','.share-email','form','.share-email-form + p','.copy-access-link','.share-message']) {
    nodes[selector] = {insertAdjacentHTML(){},focus(){},select(){this.selected=true;}};
  }
  const section = {querySelector:s=>nodes[s],innerHTML:''};
  const notices = [];
  let fail = false;
  const context = vm.createContext({
    document:{createElement:()=>section},
    navigator:{clipboard:{writeText:async value=>{assert.equal(value,'https://example.com/?access=token');if(fail)throw Error('denied');}}}
  });
  vm.runInContext(source,context);
  context.recordNotice = text=>notices.push(text);
  vm.runInContext('notifyAction = recordNotice',context);
  context.renderLinkSharing({querySelector:()=>null,append(){}},'https://example.com/?access=token','a@b.com');
  await nodes['.copy-access-link'].onclick();
  assert.equal(nodes['.copy-access-link'].textContent,'Enlace copiado ✓');
  assert.match(notices[0],/Enlace copiado/);
  fail = true;
  await nodes['.copy-access-link'].onclick();
  assert.equal(nodes['.share-link'].selected,true);
  assert.match(nodes['.share-message'].textContent,/Ctrl\+C/);
  assert.equal(nodes['.copy-access-link'].disabled,false);
});
