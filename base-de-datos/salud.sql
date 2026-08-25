-- ============================================================
--  Apartado médico y nutricional
--  Ejecútalo en Supabase → SQL Editor → New query, después de
--  esquema.sql. Se puede volver a ejecutar sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. DOCUMENTOS · exámenes, informes, pautas
--    El archivo vive en Storage; aquí solo guardamos su ficha.
-- ------------------------------------------------------------
create table if not exists public.documentos (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  tipo     text not null default 'medico'
           check (tipo in ('medico','nutricional','otro')),
  titulo   text not null,
  ruta     text not null unique,             -- ruta dentro del bucket
  tam      bigint,
  fecha    date not null default current_date,
  notas    text,
  subido   timestamptz not null default now()
);

create index if not exists documentos_user_idx
  on public.documentos (user_id, fecha desc);

alter table public.documentos enable row level security;

drop policy if exists docs_propios on public.documentos;
create policy docs_propios on public.documentos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- El equipo de trabajo lee, no escribe: un informe médico no se edita
-- desde el panel.
drop policy if exists docs_de_mis_atletas on public.documentos;
create policy docs_de_mis_atletas on public.documentos
  for select using (public.es_mi_atleta(user_id));

-- ------------------------------------------------------------
-- 2. BUCKET PRIVADO
--    Sin `public`, los archivos solo se abren con un enlace
--    firmado que caduca. No hay URL adivinable.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 15728640,
        array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- 3. PERMISOS DEL BUCKET
--    Cada archivo va en una carpeta con el id de su dueño:
--    documentos/<user_id>/<archivo>. La primera carpeta de la
--    ruta es la que decide quién puede tocarlo.
-- ------------------------------------------------------------
drop policy if exists docs_leer_propio on storage.objects;
create policy docs_leer_propio on storage.objects
  for select using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists docs_leer_de_mis_atletas on storage.objects;
create policy docs_leer_de_mis_atletas on storage.objects
  for select using (
    bucket_id = 'documentos'
    and public.es_mi_atleta(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists docs_subir_propio on storage.objects;
create policy docs_subir_propio on storage.objects
  for insert with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists docs_borrar_propio on storage.objects;
create policy docs_borrar_propio on storage.objects
  for delete using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
