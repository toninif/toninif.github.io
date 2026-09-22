-- Quinta migración. Ejecutar completa después de supabase-management.sql.
-- Conserva los protocolos y el envío SWLS anteriores. No elimina datos.
begin;
alter table public.evaluations add column if not exists workflow_version integer not null default 1;
alter table public.evaluations add column if not exists attention_required boolean not null default false;
alter table public.evaluations add column if not exists attention_reviewed_at timestamptz;

create or replace function public.evaluation_capabilities()
returns integer language sql stable set search_path = public as $$ select 2; $$;

create or replace function public.create_modular_evaluation(
  target_patient_id uuid, token_hash text, selected_modules jsonb, note text default null
) returns uuid language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  owner_id uuid := auth.uid();
  battery uuid;
  evaluation uuid;
  cfg jsonb;
  code text;
  codes text[] := '{}';
  pos integer := 0;
begin
  if owner_id is null or not exists(select 1 from public.patients where id = target_patient_id and professional_id = owner_id) then
    raise exception 'Paciente no disponible';
  end if;
  if token_hash is null or token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Enlace inválido'; end if;
  if jsonb_typeof(selected_modules) is distinct from 'array' then raise exception 'Elegí los módulos'; end if;
  if jsonb_array_length(selected_modules) not between 1 and 3 then raise exception 'Elegí entre uno y tres módulos'; end if;
  if length(coalesce(note, '')) > 20000 then raise exception 'Nota demasiado extensa'; end if;
  for cfg in select value from jsonb_array_elements(selected_modules) loop
    code := cfg->>'instrument';
    if code is null or code not in ('INTAKE', 'PHQ9', 'SWLS') or code = any(codes) then raise exception 'Módulo no habilitado o repetido'; end if;
    if (code = 'INTAKE' and cfg->>'version' is distinct from 'intake-1')
      or (code = 'PHQ9' and cfg->>'version' is distinct from 'phq9-msal-2025')
      or (code = 'SWLS' and cfg->>'version' is distinct from 'swls-legacy-1') then raise exception 'Versión no habilitada'; end if;
    if length(coalesce(cfg->>'name', '')) not between 1 and 120 or octet_length(cfg::text) > 20000 then raise exception 'Configuración inválida'; end if;
    codes := array_append(codes, code);
  end loop;
  -- Una batería por evaluación: sus preguntas no cambian al actualizar el catálogo.
  insert into public.batteries(professional_id, name, description)
    values(owner_id, (select string_agg(value->>'name', ' + ' order by ordinal)
      from jsonb_array_elements(selected_modules) with ordinality as x(value, ordinal)), 'Evaluación modular v2') returning id into battery;
  for cfg in select value from jsonb_array_elements(selected_modules) loop
    pos := pos + 1;
    insert into public.modules(battery_id, name, description, position, config)
      values(battery, cfg->>'name', cfg->>'description', pos, cfg || '{"workflow_version":2}'::jsonb);
  end loop;
  insert into public.evaluations(professional_id, patient_id, battery_id, access_token_hash, status, private_note, workflow_version)
    values(owner_id, target_patient_id, battery, token_hash, 'invited', nullif(btrim(note), ''), 2) returning id into evaluation;
  insert into public.audit_events(professional_id, evaluation_id, action) values(owner_id, evaluation, 'modular_evaluation_created');
  return evaluation;
end $$;

create or replace function public.get_patient_evaluation(access_token text)
returns table(evaluation_id uuid, patient_name text, battery_name text, evaluation_status text, modules jsonb)
language sql security definer set search_path = public, extensions, pg_temp as $$
  select e.id, p.full_name, b.name, e.status,
    coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'description', m.description,
      'position', m.position, 'config', m.config,
      'saved_answers', case when e.workflow_version = 2 and e.status in ('invited','in_progress') then r.answers else null end)
      order by m.position) filter(where m.id is not null), '[]'::jsonb)
  from public.evaluations e
  join public.patients p on p.id = e.patient_id and p.professional_id = e.professional_id
  join public.batteries b on b.id = e.battery_id and b.professional_id = e.professional_id
  left join public.modules m on m.battery_id = b.id and
    (e.workflow_version = 2 or m.config->>'instrument' = 'SWLS')
  left join public.responses r on r.evaluation_id = e.id and r.module_id = m.id
  where e.access_token_hash = encode(digest(convert_to(access_token, 'utf8'), 'sha256'), 'hex')
  group by e.id, p.full_name, b.name;
$$;

create or replace function public.save_patient_module(access_token text, target_module_id uuid, response_answers jsonb)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  ev public.evaluations%rowtype;
  cfg jsonb;
  code text;
  n integer;
  lo integer;
  hi integer;
  i integer;
  answer jsonb;
  key text;
  total integer := 0;
  score jsonb := null;
  critical boolean := false;
begin
  select * into ev from public.evaluations where access_token_hash = encode(digest(convert_to(access_token, 'utf8'), 'sha256'), 'hex') for update;
  if not found or ev.workflow_version <> 2 then raise exception 'Enlace no válido para este recorrido'; end if;
  if ev.status not in ('invited', 'in_progress') then raise exception 'La evaluación ya fue enviada o está cerrada'; end if;
  select m.config into cfg from public.modules m join public.batteries b on b.id = m.battery_id
    where m.id = target_module_id and m.battery_id = ev.battery_id and b.professional_id = ev.professional_id;
  if not found then raise exception 'Módulo no disponible'; end if;
  code := cfg->>'instrument';
  if jsonb_typeof(response_answers) is distinct from 'object' then raise exception 'Respuestas inválidas'; end if;
  if octet_length(response_answers::text) > 60000 then raise exception 'Respuestas demasiado extensas'; end if;
  if code = 'INTAKE' then
    for key in select jsonb_object_keys(response_answers) loop
      if key not in ('reason','onset','impact','expectations','previous_care','medication','health','support','other') then raise exception 'Campo desconocido'; end if;
      if jsonb_typeof(response_answers->key) is distinct from 'string' or length(response_answers->>key) > 3000 then raise exception 'Texto inválido o demasiado extenso'; end if;
    end loop;
    if length(btrim(coalesce(response_answers->>'reason', ''))) = 0 then raise exception 'Completá el motivo de consulta'; end if;
  elsif code in ('PHQ9','SWLS') then
    n := case when code = 'PHQ9' then 9 else 5 end;
    lo := case when code = 'PHQ9' then 0 else 1 end;
    hi := case when code = 'PHQ9' then 3 else 7 end;
    for key in select jsonb_object_keys(response_answers) loop
      if key not in (select 'item_' || g from generate_series(1,n) as g)
        and not (code = 'PHQ9' and key = 'difficulty') then raise exception 'Respuesta desconocida'; end if;
    end loop;
    for i in 1..n loop
      answer := response_answers->('item_' || i);
      if jsonb_typeof(answer) is distinct from 'number' then raise exception 'Respuesta faltante o inválida'; end if;
      if (answer::text)::numeric not between lo and hi or trunc((answer::text)::numeric) <> (answer::text)::numeric then raise exception 'Respuesta fuera de escala'; end if;
      total := total + (answer::text)::numeric::integer;
    end loop;
    if code = 'PHQ9' and (total > 0 or response_answers ? 'difficulty') then
      answer := response_answers->'difficulty';
      if jsonb_typeof(answer) is distinct from 'number' then raise exception 'Indicá la dificultad cotidiana'; end if;
      if (answer::text)::numeric not between 0 and 3 or trunc((answer::text)::numeric) <> (answer::text)::numeric then raise exception 'Dificultad inválida'; end if;
    end if;
    critical := code = 'PHQ9' and (response_answers->>'item_9')::integer > 0;
    score := jsonb_build_object('total',total,'min',n*lo,'max',n*hi,'instrument',code,'version',cfg->>'version','attention_required',critical);
  else raise exception 'Instrumento no habilitado';
  end if;
  insert into public.responses(evaluation_id,module_id,answers,score,completed_at,updated_at)
    values(ev.id,target_module_id,response_answers,score,now(),now())
    on conflict(evaluation_id,module_id) do update set answers=excluded.answers,score=excluded.score,completed_at=excluded.completed_at,updated_at=excluded.updated_at;
  -- La señal queda registrada aunque posteriormente se corrija la respuesta.
  update public.evaluations set status='in_progress',started_at=coalesce(started_at,now()),
    attention_required=attention_required or critical,
    attention_reviewed_at=case when critical then null else attention_reviewed_at end where id=ev.id;
  insert into public.audit_events(professional_id,evaluation_id,action)
    values(ev.professional_id,ev.id,case when critical then 'phq9_item9_attention' else 'patient_module_saved' end);
  return true;
end $$;

create or replace function public.complete_modular_evaluation(access_token text)
returns boolean language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare ev public.evaluations%rowtype;
begin
  select * into ev from public.evaluations where access_token_hash=encode(digest(convert_to(access_token,'utf8'),'sha256'),'hex') for update;
  if not found or ev.workflow_version <> 2 then raise exception 'Enlace no válido'; end if;
  if ev.status in ('to_review','completed') then return true; end if;
  if ev.status not in ('invited','in_progress') then raise exception 'Evaluación cerrada'; end if;
  if not exists(select 1 from public.modules where battery_id=ev.battery_id)
    or exists(select 1 from public.modules m where m.battery_id=ev.battery_id and not exists(
      select 1 from public.responses r where r.evaluation_id=ev.id and r.module_id=m.id and r.completed_at is not null)) then
    raise exception 'Faltan módulos por completar';
  end if;
  update public.evaluations set status='to_review',completed_at=now() where id=ev.id;
  insert into public.audit_events(professional_id,evaluation_id,action) values(ev.professional_id,ev.id,'patient_submitted_modules');
  return true;
end $$;

create or replace function public.acknowledge_evaluation_attention(target_evaluation_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare ev public.evaluations%rowtype;
begin
  select * into ev from public.evaluations where id=target_evaluation_id and professional_id=auth.uid() for update;
  if not found then raise exception 'Evaluación no disponible'; end if;
  if not ev.attention_required then raise exception 'No hay señal registrada'; end if;
  if length(btrim(coalesce(ev.review_notes,''))) = 0 then raise exception 'Registrá en observaciones la valoración y las acciones de seguimiento antes de confirmar'; end if;
  update public.evaluations set attention_reviewed_at=now() where id=ev.id;
  insert into public.audit_events(professional_id,evaluation_id,action) values(auth.uid(),ev.id,'attention_reviewed');
  return true;
end $$;

create or replace function public.review_evaluation(target_evaluation_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare ev public.evaluations%rowtype;
begin
  select * into ev from public.evaluations where id=target_evaluation_id and professional_id=auth.uid() for update;
  if not found then raise exception 'Evaluación no disponible'; end if;
  if ev.status <> 'to_review' then raise exception 'No está pendiente de revisión'; end if;
  if not exists(select 1 from public.responses where evaluation_id=ev.id) then raise exception 'No hay respuestas para revisar'; end if;
  if ev.attention_required and ev.attention_reviewed_at is null then raise exception 'Revisá y registrá primero la señal del ítem 9'; end if;
  update public.evaluations set status='completed',reviewed_at=now() where id=ev.id;
  insert into public.audit_events(professional_id,evaluation_id,action) values(auth.uid(),ev.id,'professional_reviewed');
  return true;
end $$;

create or replace function public.save_patient_response(
  access_token text, target_module_id uuid,
  response_answers jsonb, response_score jsonb default null
) returns uuid language plpgsql security definer
set search_path = public, extensions, pg_temp as $$
declare
  ev public.evaluations%rowtype;
  total integer := 0;
  i integer;
  answer jsonb;
begin
  select * into ev from public.evaluations
    where access_token_hash = encode(digest(convert_to(access_token, 'utf8'), 'sha256'), 'hex')
    for update;
  if not found or ev.workflow_version <> 1 then raise exception 'Enlace no válido'; end if;
  if ev.status not in ('invited', 'in_progress') then
    raise exception 'La evaluación ya fue enviada o está cerrada';
  end if;
  if not exists (select 1 from public.modules m
    join public.batteries b on b.id = m.battery_id
    where m.id = target_module_id and m.battery_id = ev.battery_id
      and b.professional_id = ev.professional_id and m.config->>'instrument' = 'SWLS') then
    raise exception 'Instrumento no habilitado';
  end if;
  if jsonb_typeof(response_answers) is distinct from 'object' then
    raise exception 'Se requieren cinco respuestas';
  end if;
  if (select count(*) from jsonb_object_keys(response_answers)) <> 5 then
    raise exception 'Se requieren cinco respuestas';
  end if;
  for i in 1..5 loop
    answer := response_answers->('item_' || i);
    if jsonb_typeof(answer) is distinct from 'number' then
      raise exception 'Respuesta faltante o inválida';
    end if;
    if (answer::text)::numeric not between 1 and 7
       or trunc((answer::text)::numeric) <> (answer::text)::numeric then
      raise exception 'Cada respuesta debe ser un entero entre 1 y 7';
    end if;
    total := total + (answer::text)::numeric::integer;
  end loop;
  insert into public.responses(evaluation_id, module_id, answers, score, completed_at, updated_at)
    values(ev.id, target_module_id, response_answers,
      jsonb_build_object('total', total, 'min', 5, 'max', 35, 'instrument', 'SWLS'), now(), now())
    on conflict (evaluation_id, module_id) do update
      set answers = excluded.answers, score = excluded.score,
          completed_at = excluded.completed_at, updated_at = excluded.updated_at;
  update public.evaluations set status = 'to_review',
    started_at = coalesce(started_at, now()), completed_at = now() where id = ev.id;
  insert into public.audit_events(professional_id, evaluation_id, action)
    values(ev.professional_id, ev.id, 'patient_submitted_swls');
  return ev.id;
end $$;

revoke all on function public.evaluation_capabilities() from public, anon;
revoke all on function public.create_modular_evaluation(uuid,text,jsonb,text) from public, anon;
revoke all on function public.save_patient_module(text,uuid,jsonb) from public;
revoke all on function public.complete_modular_evaluation(text) from public;
revoke all on function public.acknowledge_evaluation_attention(uuid) from public, anon;
revoke all on function public.review_evaluation(uuid) from public, anon;
grant execute on function public.evaluation_capabilities() to authenticated;
grant execute on function public.create_modular_evaluation(uuid,text,jsonb,text) to authenticated;
grant execute on function public.save_patient_module(text,uuid,jsonb) to anon,authenticated;
grant execute on function public.complete_modular_evaluation(text) to anon,authenticated;
grant execute on function public.acknowledge_evaluation_attention(uuid) to authenticated;
grant execute on function public.review_evaluation(uuid) to authenticated;
commit;
