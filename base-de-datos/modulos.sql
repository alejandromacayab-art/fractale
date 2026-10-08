-- ============================================================
--  Módulos de la app
--  Interruptores globales: qué partes de la app están en uso.
--  Entrenamiento y nutrición nacen archivados; el entrenador los
--  enciende desde el panel cuando el equipo los vaya a usar.
--  Ejecútalo después de esquema.sql.
-- ============================================================

create table if not exists public.modulos (
  clave       text primary key
              check (clave in ('entrenamiento','nutricion')),
  activo      boolean not null default false,
  actualizado timestamptz not null default now()
);

-- Las dos filas existen siempre: así la app lee un estado, no un vacío.
insert into public.modulos (clave, activo) values
  ('entrenamiento', false),
  ('nutricion',     false)
on conflict (clave) do nothing;

alter table public.modulos enable row level security;

-- Ver: cualquiera con cuenta. La app necesita saber qué mostrar.
drop policy if exists mod_ver on public.modulos;
create policy mod_ver on public.modulos
  for select to authenticated using (true);

-- Encender y apagar es cosa del entrenador.
drop policy if exists mod_editar on public.modulos;
create policy mod_editar on public.modulos
  for update to authenticated using (public.soy_coach()) with check (public.soy_coach());
