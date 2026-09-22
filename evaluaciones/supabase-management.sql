-- Cuarta migración: ejecutar después de supabase-stabilize.sql.
-- Conserva todos los datos existentes.
begin;
alter table public.evaluations add column if not exists review_notes text;
alter table public.evaluations add column if not exists review_notes_updated_at timestamptz;
alter table public.evaluations add column if not exists reviewed_at timestamptz;

-- Recupera fechas de revisiones realizadas con la versión anterior.
update public.evaluations e set reviewed_at = a.reviewed_at
from (select evaluation_id, max(created_at) as reviewed_at from public.audit_events
      where action = 'professional_reviewed' group by evaluation_id) a
where e.id = a.evaluation_id and e.reviewed_at is null;

create or replace function public.save_review_notes(target_evaluation_id uuid, notes text)
returns boolean language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if length(coalesce(notes, '')) > 20000 then raise exception 'La observación supera los 20000 caracteres'; end if;
  update public.evaluations set review_notes = nullif(btrim(notes), ''), review_notes_updated_at = now()
    where id = target_evaluation_id and professional_id = auth.uid();
  if not found then raise exception 'Evaluación no disponible'; end if;
  insert into public.audit_events(professional_id, evaluation_id, action)
    values(auth.uid(), target_evaluation_id, 'review_notes_saved');
  return true;
end $$;

create or replace function public.rotate_evaluation_link(target_evaluation_id uuid, new_token_hash text)
returns boolean language plpgsql security definer
set search_path = public, pg_temp as $$
declare ev public.evaluations%rowtype;
begin
  if new_token_hash is null or new_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Enlace inválido'; end if;
  select * into ev from public.evaluations where id = target_evaluation_id
    and professional_id = auth.uid() for update;
  if not found then raise exception 'Evaluación no disponible'; end if;
  if ev.status not in ('draft', 'invited', 'in_progress') then
    raise exception 'No se puede regenerar el enlace de una evaluación enviada o cerrada';
  end if;
  update public.evaluations set access_token_hash = new_token_hash,
    status = case when status = 'draft' then 'invited' else status end where id = ev.id;
  insert into public.audit_events(professional_id, evaluation_id, action)
    values(auth.uid(), ev.id, 'patient_link_rotated');
  return true;
end $$;

create or replace function public.review_evaluation(target_evaluation_id uuid)
returns boolean language plpgsql security definer
set search_path = public, pg_temp as $$
declare ev public.evaluations%rowtype;
begin
  select * into ev from public.evaluations where id = target_evaluation_id
    and professional_id = auth.uid() for update;
  if not found then raise exception 'Evaluación no disponible'; end if;
  if ev.status <> 'to_review' then raise exception 'No está pendiente de revisión'; end if;
  if not exists(select 1 from public.responses where evaluation_id = ev.id) then
    raise exception 'No hay respuestas para revisar';
  end if;
  update public.evaluations set status = 'completed', reviewed_at = now() where id = ev.id;
  insert into public.audit_events(professional_id, evaluation_id, action)
    values(auth.uid(), ev.id, 'professional_reviewed');
  return true;
end $$;

revoke all on function public.save_review_notes(uuid, text) from public, anon;
revoke all on function public.rotate_evaluation_link(uuid, text) from public, anon;
revoke all on function public.review_evaluation(uuid) from public, anon;
grant execute on function public.save_review_notes(uuid, text) to authenticated;
grant execute on function public.rotate_evaluation_link(uuid, text) to authenticated;
grant execute on function public.review_evaluation(uuid) to authenticated;
commit;
