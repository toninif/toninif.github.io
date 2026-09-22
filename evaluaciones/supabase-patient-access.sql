-- Migración para acceso del paciente mediante enlace privado.
-- Ejecutar una vez en Supabase SQL Editor después de supabase-schema.sql.

create or replace function public.get_patient_evaluation(access_token text)
returns table (
  evaluation_id uuid,
  patient_name text,
  battery_name text,
  evaluation_status text,
  modules jsonb
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token_hash text;
begin
  token_hash := encode(digest(convert_to(access_token, 'utf8'), 'sha256'), 'hex');
  return query
    select e.id,
           p.full_name,
           b.name,
           e.status,
           coalesce(jsonb_agg(jsonb_build_object(
             'id', m.id,
             'name', m.name,
             'description', m.description,
             'position', m.position,
             'config', m.config
           ) order by m.position) filter (where m.id is not null), '[]'::jsonb)
    from public.evaluations e
    join public.patients p on p.id = e.patient_id
    join public.batteries b on b.id = e.battery_id
    left join public.modules m on m.battery_id = b.id
    where e.access_token_hash = token_hash
    group by e.id, p.full_name, b.name, e.status;
end;
$$;

create or replace function public.save_patient_response(
  access_token text,
  target_module_id uuid,
  response_answers jsonb,
  response_score jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token_hash text;
  target_evaluation_id uuid;
begin
  token_hash := encode(digest(convert_to(access_token, 'utf8'), 'sha256'), 'hex');
  select e.id into target_evaluation_id
  from public.evaluations e
  join public.modules m on m.battery_id = e.battery_id and m.id = target_module_id
  where e.access_token_hash = token_hash;

  if target_evaluation_id is null then
    raise exception 'No se encontró una evaluación válida';
  end if;

  insert into public.responses (evaluation_id, module_id, answers, score, completed_at, updated_at)
  values (target_evaluation_id, target_module_id, response_answers, response_score, now(), now())
  on conflict (evaluation_id, module_id)
  do update set answers = excluded.answers, score = excluded.score, completed_at = excluded.completed_at, updated_at = now();

  update public.evaluations set status = 'in_progress', started_at = coalesce(started_at, now()) where id = target_evaluation_id;
  return target_evaluation_id;
end;
$$;

create or replace function public.complete_patient_evaluation(access_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token_hash text;
begin
  token_hash := encode(digest(convert_to(access_token, 'utf8'), 'sha256'), 'hex');
  update public.evaluations set status = 'to_review', completed_at = now() where access_token_hash = token_hash;
  return found;
end;
$$;

revoke all on function public.get_patient_evaluation(text) from public;
revoke all on function public.save_patient_response(text, uuid, jsonb, jsonb) from public;
revoke all on function public.complete_patient_evaluation(text) from public;
grant execute on function public.get_patient_evaluation(text) to anon, authenticated;
grant execute on function public.save_patient_response(text, uuid, jsonb, jsonb) to anon, authenticated;
grant execute on function public.complete_patient_evaluation(text) to anon, authenticated;
