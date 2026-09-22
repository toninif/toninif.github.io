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
  assert.equal(await context.savePendingReviewNotes(),false);
  assert.equal(input.value,'Texto pendiente');
  assert.equal(input.dataset.saved,'Anterior');
  assert.equal(input.disabled,false);
  assert.match(message.textContent,/Error de conexión/);
});
