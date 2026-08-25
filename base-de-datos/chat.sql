-- ============================================================
--  Bandeja de mensajes
--  Una conversación por deportista, entre él y su entrenador.
--  Ejecútalo después de esquema.sql. Se puede repetir.
-- ============================================================

-- ------------------------------------------------------------
-- 1. MENSAJES
--    `atleta_id` es la conversación; `autor_id` es quien habla.
--    No hay UPDATE en las políticas: un mensaje enviado no se
--    edita, ni el tuyo ni el del otro.
-- ------------------------------------------------------------
create table if not exists public.mensajes (
  id        uuid primary key default gen_random_uuid(),
  atleta_id uuid not null references auth.users on delete cascade,
  autor_id  uuid not null references auth.users on delete cascade,
  texto     text not null check (length(trim(texto)) between 1 and 4000),
  creado    timestamptz not null default now()
);

create index if not exists mensajes_conv_idx
  on public.mensajes (atleta_id, creado);

alter table public.mensajes enable row level security;

-- Ver: el dueño de la conversación y su entrenador.
drop policy if exists msg_ver on public.mensajes;
create policy msg_ver on public.mensajes
  for select using (
    atleta_id = auth.uid() or public.es_mi_atleta(atleta_id)
  );

-- Escribir: solo en tu propia conversación o en la de tus deportistas,
-- y siempre firmando con tu propio id.
drop policy if exists msg_escribir on public.mensajes;
create policy msg_escribir on public.mensajes
  for insert with check (
    autor_id = auth.uid()
    and (atleta_id = auth.uid() or public.es_mi_atleta(atleta_id))
  );

-- Borrar: solo lo que escribiste tú.
drop policy if exists msg_borrar_propio on public.mensajes;
create policy msg_borrar_propio on public.mensajes
  for delete using (autor_id = auth.uid());

-- ------------------------------------------------------------
-- 2. HASTA DÓNDE HA LEÍDO CADA UNO
--    En una tabla aparte para que nadie pueda tocar la marca de
--    lectura del otro, ni de paso el texto de sus mensajes.
-- ------------------------------------------------------------
create table if not exists public.lecturas (
  atleta_id   uuid not null references auth.users on delete cascade,
  user_id     uuid not null references auth.users on delete cascade,
  leido_hasta timestamptz not null default now(),
  primary key (atleta_id, user_id)
);

alter table public.lecturas enable row level security;

drop policy if exists lectura_propia on public.lecturas;
create policy lectura_propia on public.lecturas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- 3. SIN CONTAR · cuántos mensajes sin leer tiene cada quien
-- ------------------------------------------------------------
create or replace function public.sin_leer(conv uuid)
returns integer language sql stable security invoker as $$
  select count(*)::int
  from public.mensajes m
  where m.atleta_id = conv
    and m.autor_id <> auth.uid()
    and m.creado > coalesce(
      (select l.leido_hasta from public.lecturas l
        where l.atleta_id = conv and l.user_id = auth.uid()),
      'epoch'::timestamptz);
$$;

-- ------------------------------------------------------------
-- 4. EN VIVO · el mensaje aparece sin recargar
-- ------------------------------------------------------------
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.mensajes';
  exception when duplicate_object then null; end;
end $$;
