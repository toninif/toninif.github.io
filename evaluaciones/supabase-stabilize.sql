-- Ejecutar completo en SQL Editor. No elimina pacientes ni respuestas.
begin;

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
  if not found then raise exception 'Enlace no válido'; end if;
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

-- Compatible con el cliente anterior; el envío ahora es atómico en save_patient_response.
create or replace function public.complete_patient_evaluation(access_token text)
returns boolean language sql security definer
set search_path = public, extensions, pg_temp as $$
  select exists (select 1 from public.evaluations e
    where e.access_token_hash = encode(digest(convert_to(access_token, 'utf8'), 'sha256'), 'hex')
      and e.status in ('to_review', 'completed')
      and exists (select 1 from public.responses r where r.evaluation_id = e.id));
$$;

create or replace function public.review_evaluation(target_evaluation_id uuid)
returns boolean language plpgsql security definer
set search_path = public, pg_temp as $$
declare ev public.evaluations%rowtype;
begin
  select * into ev from public.evaluations
    where id = target_evaluation_id and professional_id = auth.uid() for update;
  if not found then raise exception 'Evaluación no disponible'; end if;
  if ev.status <> 'to_review' then raise exception 'No está pendiente de revisión'; end if;
  if not exists(select 1 from public.responses where evaluation_id = ev.id) then
    raise exception 'No hay respuestas para revisar';
  end if;
  update public.evaluations set status = 'completed' where id = ev.id;
  insert into public.audit_events(professional_id, evaluation_id, action)
    values(auth.uid(), ev.id, 'professional_reviewed');
  return true;
end $$;

revoke all on function public.save_patient_response(text, uuid, jsonb, jsonb) from public;
revoke all on function public.complete_patient_evaluation(text) from public;
revoke all on function public.review_evaluation(uuid) from public, anon;
grant execute on function public.save_patient_response(text, uuid, jsonb, jsonb) to anon, authenticated;
grant execute on function public.complete_patient_evaluation(text) to anon, authenticated;
grant execute on function public.review_evaluation(uuid) to authenticated;
commit;
