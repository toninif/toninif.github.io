-- Esquema inicial para la plataforma de evaluaciones.
-- Ejecutar en un proyecto Supabase nuevo y privado.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'professional' check (role in ('professional', 'patient')),
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.batteries (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  estimated_minutes integer,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  battery_id uuid not null references public.batteries(id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  config jsonb not null default '{}'::jsonb
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  battery_id uuid not null references public.batteries(id),
  access_token_hash text unique,
  status text not null default 'draft' check (status in ('draft', 'invited', 'in_progress', 'to_review', 'completed', 'archived')),
  private_note text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  module_id uuid not null references public.modules(id),
  answers jsonb not null default '{}'::jsonb,
  score jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (evaluation_id, module_id)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references public.profiles(id) on delete set null,
  evaluation_id uuid references public.evaluations(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.batteries enable row level security;
alter table public.modules enable row level security;
alter table public.evaluations enable row level security;
alter table public.responses enable row level security;
alter table public.audit_events enable row level security;

create policy "professionals manage own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "professionals manage own patients" on public.patients
  for all using (professional_id = auth.uid()) with check (professional_id = auth.uid());

create policy "professionals manage own batteries" on public.batteries
  for all using (professional_id = auth.uid()) with check (professional_id = auth.uid());

create policy "professionals manage own evaluations" on public.evaluations
  for all using (professional_id = auth.uid()) with check (professional_id = auth.uid());

create policy "professionals manage modules from own batteries" on public.modules
  for all using (exists (
    select 1 from public.batteries b
    where b.id = modules.battery_id and b.professional_id = auth.uid()
  )) with check (exists (
    select 1 from public.batteries b
    where b.id = modules.battery_id and b.professional_id = auth.uid()
  ));

create policy "professionals manage responses from own evaluations" on public.responses
  for all using (exists (
    select 1 from public.evaluations e
    where e.id = responses.evaluation_id and e.professional_id = auth.uid()
  ));

create policy "professionals read own audit events" on public.audit_events
  for select using (professional_id = auth.uid());

-- El acceso del paciente se implementará mediante Edge Functions con token de un solo uso.
-- No se habilita acceso anónimo directo a estas tablas.
