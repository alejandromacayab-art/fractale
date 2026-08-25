-- ============================================================
--  Checklist de objetivos
--  El equipo asigna objetivos al deportista; el deportista los
--  va marcando. Ejecútalo después de esquema.sql.
-- ============================================================

-- ------------------------------------------------------------
-- 1. OBJETIVOS
--    `atleta_id` es de quién es el objetivo; `autor_id`, quién lo
--    puso. Un objetivo puede ser de una vez o repetirse cada
--    semana o cada mes.
-- ------------------------------------------------------------
create table if not exists public.objetivos (
  id         uuid primary key default gen_random_uuid(),
  atleta_id  uuid not null references auth.users on delete cascade,
  autor_id   uuid not null references auth.users on delete cascade,
  titulo     text not null check (length(trim(titulo)) between 1 and 200),
  detalle    text,
  categoria  text not null default 'redes'
             check (categoria in ('redes','rendimiento','equipo','otro')),
  cadencia   text not null default 'semanal'
             check (cadencia in ('unica','semanal','mensual')),
  meta       integer not null default 1 check (meta between 1 and 99),
  vence      date,
  archivado  boolean not null default false,
  creado     timestamptz not null default now()
);

create index if not exists objetivos_atleta_idx
  on public.objetivos (atleta_id, archivado, creado desc);

alter table public.objetivos enable row level security;

-- Ver: el dueño y su entrenador.
drop policy if exists obj_ver on public.objetivos;
create policy obj_ver on public.objetivos
  for select using (
    atleta_id = auth.uid() or public.es_mi_atleta(atleta_id)
  );

-- Crear: para ti mismo, o para tus deportistas. Siempre firmando.
drop policy if exists obj_crear on public.objetivos;
create policy obj_crear on public.objetivos
  for insert with check (
    autor_id = auth.uid()
    and (atleta_id = auth.uid() or public.es_mi_atleta(atleta_id))
  );

-- Editar y borrar: solo quien lo escribió. Así el deportista no puede
-- rebajarse una meta que le puso el equipo, ni borrarla.
drop policy if exists obj_editar on public.objetivos;
create policy obj_editar on public.objetivos
  for update using (autor_id = auth.uid()) with check (autor_id = auth.uid());

drop policy if exists obj_borrar on public.objetivos;
create policy obj_borrar on public.objetivos
  for delete using (autor_id = auth.uid());

-- ------------------------------------------------------------
-- 2. CUMPLIMIENTOS
--    Cada vez que se cumple, una fila. Van aparte del objetivo
--    para que marcar no dé permiso a reescribir la meta.
-- ------------------------------------------------------------
create table if not exists public.objetivo_hechos (
  id           uuid primary key default gen_random_uuid(),
  objetivo_id  uuid not null references public.objetivos on delete cascade,
  atleta_id    uuid not null references auth.users on delete cascade,
  fecha        date not null default current_date,
  nota         text,
  creado       timestamptz not null default now()
);

create index if not exists hechos_obj_idx
  on public.objetivo_hechos (objetivo_id, fecha desc);

alter table public.objetivo_hechos enable row level security;

drop policy if exists hecho_ver on public.objetivo_hechos;
create policy hecho_ver on public.objetivo_hechos
  for select using (
    atleta_id = auth.uid() or public.es_mi_atleta(atleta_id)
  );

-- Marcar y desmarcar: solo el deportista, y solo lo suyo.
drop policy if exists hecho_marcar on public.objetivo_hechos;
create policy hecho_marcar on public.objetivo_hechos
  for insert with check (atleta_id = auth.uid());

drop policy if exists hecho_desmarcar on public.objetivo_hechos;
create policy hecho_desmarcar on public.objetivo_hechos
  for delete using (atleta_id = auth.uid());

-- ------------------------------------------------------------
-- 3. EN VIVO · el panel ve el avance en cuanto se marca
-- ------------------------------------------------------------
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.objetivo_hechos';
  exception when duplicate_object then null; end;
end $$;
