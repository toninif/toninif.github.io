// Prueba la migración real en PostgreSQL WASM, sin conectarse a Supabase.
// Dependencia opcional: EVALUATIONS_QA_ROOT/node_modules/@electric-sql/pglite
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { instruments } = require('../instruments.js');
const qa = process.env.EVALUATIONS_QA_ROOT;
const hash = token => createHash('sha256').update(token).digest('hex');
const answers = (n,value) => Object.fromEntries(Array.from({length:n},(_,i)=>[`item_${i+1}`,value]));

test('migraciones y recorrido modular en PostgreSQL', {skip: !qa && 'Definí EVALUATIONS_QA_ROOT para ejecutar PostgreSQL local'}, async t => {
  const { PGlite } = require(path.join(qa,'node_modules/@electric-sql/pglite'));
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema extensions;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid; $$;
    create function public.digest(bytea,text) returns bytea language sql as $$ select sha256($1); $$;`);
  // PGlite no incluye pgcrypto: digest usa sha256 nativo solo en este entorno.
  for (const file of ['supabase-schema.sql','supabase-patient-access.sql','supabase-stabilize.sql','supabase-management.sql','supabase-modules.sql']) {
    const sql = fs.readFileSync(path.join(__dirname,'..',file),'utf8').replace('create extension if not exists "pgcrypto";', '');
    await db.exec(sql);
  }
  // La quinta migración debe poder ejecutarse nuevamente sin alterar respuestas.
  await db.exec(fs.readFileSync(path.join(__dirname,'../supabase-modules.sql'),'utf8'));
  const owner = '00000000-0000-4000-8000-000000000001';
  const other = '00000000-0000-4000-8000-000000000002';
  const patient = '00000000-0000-4000-8000-000000000003';
  await db.query('insert into auth.users values ($1),($2)',[owner,other]);
  await db.query("insert into profiles(id,full_name) values ($1,'Profesional ficticio'),($2,'Otro ficticio')",[owner,other]);
  await db.query("insert into patients(id,professional_id,full_name) values ($1,$2,'Paciente ficticio')",[patient,owner]);
  const login = async id => db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
  await login(owner);
  const create = async (token,codes) => (await db.query('select create_modular_evaluation($1,$2,$3::jsonb,$4) as id',[patient,hash(token),JSON.stringify(codes.map(code=>instruments[code])),'Nota privada secreta'])).rows[0].id;
  const get = async token => (await db.query('select * from get_patient_evaluation($1)',[token])).rows[0];
  const save = (token,module,values) => db.query('select save_patient_module($1,$2,$3::jsonb)',[token,module,JSON.stringify(values)]);
  const complete = token => db.query('select complete_modular_evaluation($1)',[token]);
  const token = 'enlace-ficticio-largo-modular-1';
  const id = await create(token,['INTAKE','PHQ9','SWLS']);
  let result = await get(token);
  const [intake,phq,swls] = result.modules;
  assert.equal(result.modules.length,3);
  assert.ok(!JSON.stringify(result).includes('Nota privada secreta'));
  await assert.rejects(complete(token),/Faltan módulos/);
  await assert.rejects(save('incorrecto',intake.id,{reason:'Prueba'}),/Enlace/);
  await assert.rejects(save(token,intake.id,{reason:' '}),/motivo/);
  await assert.rejects(save(token,intake.id,{reason:'Prueba',extra:'No permitido'}),/Campo/);
  await save(token,intake.id,{reason:'Consulta ficticia',expectations:'Prueba'});
  assert.equal((await get(token)).evaluation_status,'in_progress');
  assert.equal((await get(token)).modules[0].saved_answers.reason,'Consulta ficticia');
  await assert.rejects(save(token,phq.id,{...answers(9,1)}),/dificultad/);
  for (const value of [null,'1',1.5,-1,4]) await assert.rejects(save(token,phq.id,{...answers(9,0),item_1:value}));
  await save(token,phq.id,{...answers(9,0),item_9:1,difficulty:0});
  assert.equal((await db.query('select attention_required from evaluations where id=$1',[id])).rows[0].attention_required,true);
  await save(token,phq.id,answers(9,0));
  assert.equal((await db.query('select attention_required from evaluations where id=$1',[id])).rows[0].attention_required,true);
  await assert.rejects(db.query('select save_patient_response($1,$2,$3::jsonb,null)',[token,swls.id,JSON.stringify(answers(5,1))]),/Enlace/);
  await assert.rejects(complete(token),/Faltan módulos/);
  await save(token,swls.id,answers(5,7));
  const scores = (await db.query('select score from responses where evaluation_id=$1 order by score->>\'instrument\'',[id])).rows.map(r=>r.score);
  assert.ok(scores.some(score=>score===null));
  assert.ok(scores.some(score=>score?.instrument==='SWLS' && score.total===35));
  await complete(token);
  await complete(token); // reintento por respuesta de red perdida
  assert.equal((await get(token)).evaluation_status,'to_review');
  assert.ok((await get(token)).modules.every(m=>m.saved_answers===null));
  await assert.rejects(save(token,swls.id,answers(5,1)),/cerrada/);
  await assert.rejects(db.query('select review_evaluation($1)',[id]),/ítem 9/);
  await assert.rejects(db.query('select acknowledge_evaluation_attention($1)',[id]),/observaciones/);
  await login(other);
  await assert.rejects(db.query('select acknowledge_evaluation_attention($1)',[id]),/disponible/);
  await assert.rejects(create('otro-enlace',['INTAKE']),/Paciente/);
  await login(owner);
  await db.query("select save_review_notes($1,'Valoración ficticia y seguimiento de prueba')",[id]);
  await db.query('select acknowledge_evaluation_attention($1)',[id]);
  await db.query('select review_evaluation($1)',[id]);
  assert.equal((await get(token)).evaluation_status,'completed');
  // Un token válido no puede escribir un módulo perteneciente a otra evaluación.
  await create('segundo-token',['INTAKE']);
  await assert.rejects(save('segundo-token',intake.id,{reason:'Prueba'}),/Módulo/);
  // Los enlaces anteriores conservan el envío atómico de SWLS.
  const battery=(await db.query("insert into batteries(professional_id,name) values ($1,'Batería inicial') returning id",[owner])).rows[0].id;
  const legacyModule=(await db.query("insert into modules(battery_id,name,config) values ($1,'SWLS',$2::jsonb) returning id",[battery,JSON.stringify(instruments.SWLS)])).rows[0].id;
  await db.query("insert into evaluations(professional_id,patient_id,battery_id,status,access_token_hash) values($1,$2,$3,'invited',$4)",[owner,patient,battery,hash('legacy')]);
  await db.query('select save_patient_response($1,$2,$3::jsonb,$4::jsonb)',['legacy',legacyModule,JSON.stringify(answers(5,1)),JSON.stringify({total:999})]);
  assert.equal((await get('legacy')).evaluation_status,'to_review');
  assert.equal((await db.query('select score from responses where module_id=$1',[legacyModule])).rows[0].score.total,5);
  // Permisos efectivos de funciones (el paciente no crea evaluaciones ni revisa).
  assert.equal((await db.query("select has_function_privilege('anon','public.create_modular_evaluation(uuid,text,jsonb,text)','execute') as allowed")).rows[0].allowed,false);
  assert.equal((await db.query("select has_function_privilege('anon','public.acknowledge_evaluation_attention(uuid)','execute') as allowed")).rows[0].allowed,false);
  assert.equal((await db.query("select has_function_privilege('anon','public.save_patient_module(text,uuid,jsonb)','execute') as allowed")).rows[0].allowed,true);
});
