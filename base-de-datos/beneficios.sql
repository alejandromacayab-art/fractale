-- ============================================================
--  Beneficios de las marcas aliadas
--  Los descuentos que tienen los deportistas por pertenecer a
--  Fractale. Los mantiene el entrenador; todo el mundo los ve.
--  Ejecútalo después de esquema.sql.
-- ============================================================

create table if not exists public.beneficios (
  id            uuid primary key default gen_random_uuid(),
  marca         text not null check (length(trim(marca)) between 1 and 80),
  logo          text,                       -- ruta dentro de assets/marcas/
  descuento     text not null,              -- "20%", "2x1", "Envío gratis"…
  detalle       text,                       -- en qué aplica
  codigo        text,                       -- cupón, si lo hay
  instrucciones text,                       -- cómo se usa
  enlace        text,                       -- tienda o web de la marca
  categoria     text not null default 'otro'
                check (categoria in ('ropa','nutricion','salud','entrenamiento','otro')),
  vence         date,                       -- sin fecha = sin caducidad
  activo        boolean not null default true,
  orden         integer not null default 0,
  creado        timestamptz not null default now()
);

create index if not exists beneficios_orden_idx
  on public.beneficios (activo, orden, creado desc);

alter table public.beneficios enable row level security;

-- Ver: cualquiera con cuenta, mientras esté activo. Son los
-- beneficios de pertenecer, iguales para todos los deportistas.
drop policy if exists ben_ver on public.beneficios;
create policy ben_ver on public.beneficios
  for select to authenticated using (activo);

-- Mantenerlos es cosa del entrenador.
drop policy if exists ben_ver_coach on public.beneficios;
create policy ben_ver_coach on public.beneficios
  for select to authenticated using (public.soy_coach());

drop policy if exists ben_crear on public.beneficios;
create policy ben_crear on public.beneficios
  for insert to authenticated with check (public.soy_coach());

drop policy if exists ben_editar on public.beneficios;
create policy ben_editar on public.beneficios
  for update to authenticated using (public.soy_coach()) with check (public.soy_coach());

drop policy if exists ben_borrar on public.beneficios;
create policy ben_borrar on public.beneficios
  for delete to authenticated using (public.soy_coach());
