-- ============================================================
--  Mi App · esquema de la base de datos
--  Pégalo entero en Supabase → SQL Editor → New query → Run.
--  Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PERFILES · una fila por persona
-- ------------------------------------------------------------
create table if not exists public.perfiles (
  id        uuid primary key references auth.users on delete cascade,
  correo    text,
  nombre    text,
  rol       text not null default 'atleta' check (rol in ('atleta','coach')),
  coach_id  uuid references public.perfiles(id) on delete set null,
  activo    boolean not null default true,
  creado    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. INVITACIONES · nadie entra sin estar en esta lista
-- ------------------------------------------------------------
create table if not exists public.invitaciones (
  correo    text primary key,
  nombre    text,
  coach_id  uuid references public.perfiles(id) on delete cascade,
  creada    timestamptz not null default now(),
  usada     boolean not null default false
);

-- ------------------------------------------------------------
-- 3. DATOS · configuración y un registro por día
-- ------------------------------------------------------------
create table if not exists public.config (
  user_id      uuid primary key references auth.users on delete cascade,
  datos        jsonb not null default '{}'::jsonb,   -- hábitos + ajustes + tema
  mt           bigint not null default 0,            -- marca de tiempo para fusionar
  actualizado  timestamptz not null default now()
);

create table if not exists public.dias (
  user_id      uuid not null references auth.users on delete cascade,
  fecha        date not null,
  datos        jsonb not null default '{}'::jsonb,   -- valores, comidas, sueño, notas…
  mt           bigint not null default 0,
  actualizado  timestamptz not null default now(),
  primary key (user_id, fecha)
);

create index if not exists dias_user_fecha_idx on public.dias (user_id, fecha desc);

-- ------------------------------------------------------------
-- 4. ALTA AUTOMÁTICA · solo si el correo fue invitado
--    Si no está invitado, el registro falla y no se crea la cuenta.
-- ------------------------------------------------------------
create or replace function public.alta_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv public.invitaciones%rowtype;
  hay_coach boolean;
begin
  select exists(select 1 from public.perfiles where rol = 'coach') into hay_coach;
  select * into inv from public.invitaciones
    where lower(correo) = lower(new.email);

  -- el primer usuario del sistema es el entrenador
  if not hay_coach then
    insert into public.perfiles (id, correo, nombre, rol)
      values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', new.email), 'coach');
    return new;
  end if;

  if inv.correo is null then
    raise exception 'Este correo no está invitado. Pídele el acceso a tu entrenador.';
  end if;

  insert into public.perfiles (id, correo, nombre, rol, coach_id)
    values (new.id, new.email,
            coalesce(inv.nombre, new.raw_user_meta_data->>'nombre', new.email),
            'atleta', inv.coach_id);

  update public.invitaciones set usada = true where correo = inv.correo;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.alta_usuario();

-- ------------------------------------------------------------
-- 5. AYUDANTES · evitan recursión dentro de las políticas
-- ------------------------------------------------------------
create or replace function public.soy_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.perfiles where id = auth.uid() and rol = 'coach');
$$;

create or replace function public.es_mi_atleta(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.perfiles where id = uid and coach_id = auth.uid());
$$;

-- ------------------------------------------------------------
-- 6. PERMISOS POR FILA
--    Cada persona ve lo suyo. El entrenador ve, solo de lectura,
--    lo de sus propios deportistas. Nadie más ve nada.
-- ------------------------------------------------------------
alter table public.perfiles     enable row level security;
alter table public.invitaciones enable row level security;
alter table public.config       enable row level security;
alter table public.dias         enable row level security;

-- perfiles
drop policy if exists perfil_propio on public.perfiles;
create policy perfil_propio on public.perfiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists perfil_de_mis_atletas on public.perfiles;
create policy perfil_de_mis_atletas on public.perfiles
  for select using (coach_id = auth.uid());

-- invitaciones: solo el entrenador las gestiona
drop policy if exists invita_el_coach on public.invitaciones;
create policy invita_el_coach on public.invitaciones
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid() and public.soy_coach());

-- config
drop policy if exists config_propia on public.config;
create policy config_propia on public.config
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists config_de_mis_atletas on public.config;
create policy config_de_mis_atletas on public.config
  for select using (public.es_mi_atleta(user_id));

-- días
drop policy if exists dias_propios on public.dias;
create policy dias_propios on public.dias
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists dias_de_mis_atletas on public.dias;
create policy dias_de_mis_atletas on public.dias
  for select using (public.es_mi_atleta(user_id));

-- ------------------------------------------------------------
-- 7. RESUMEN PARA EL PANEL
--    Una sola consulta con lo que el entrenador necesita ver.
-- ------------------------------------------------------------
create or replace view public.panel_atletas
with (security_invoker = true) as
select
  p.id,
  p.nombre,
  p.correo,
  p.creado,
  (select max(d.fecha) from public.dias d where d.user_id = p.id)              as ultimo_registro,
  (select count(*) from public.dias d
     where d.user_id = p.id and d.fecha > current_date - 30)                   as dias_con_registro,
  (select coalesce(sum((d.datos->'workout'->>'volume')::numeric), 0)
     from public.dias d
     where d.user_id = p.id and d.fecha > current_date - 30)                   as kg_30d,
  (select count(*) from public.dias d
     where d.user_id = p.id and d.fecha > current_date - 30
       and (d.datos->'workout'->>'volume')::numeric > 0)                       as sesiones_30d,
  (select round(avg((d.datos->'sleep'->>'score')::numeric))
     from public.dias d
     where d.user_id = p.id and d.fecha > current_date - 30
       and d.datos->'sleep'->>'score' is not null)                             as sueno_30d,
  (select coalesce(sum(x.n), 0) from public.dias d
     cross join lateral (
       select coalesce(sum((j->>'n')::int), 0) as n
       from jsonb_array_elements(coalesce(d.datos->'food'->'junk','[]'::jsonb)) j
     ) x
     where d.user_id = p.id and d.fecha > current_date - 7)                    as chatarra_7d
from public.perfiles p
where p.rol = 'atleta' and p.coach_id = auth.uid();

grant select on public.panel_atletas to authenticated;

-- ------------------------------------------------------------
-- 8. CAMBIOS EN VIVO
--    Permite que el panel del entrenador se entere al instante
--    cuando un deportista guarda algo. Los permisos por fila
--    siguen mandando: solo llegan los cambios que puedes ver.
-- ------------------------------------------------------------
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.dias';
  exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.perfiles';
  exception when duplicate_object then null; end;
end $$;

alter table public.dias replica identity full;
