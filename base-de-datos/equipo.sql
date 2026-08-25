-- ============================================================
--  Equipo de trabajo
--  Hasta ahora cada deportista tenía un solo entrenador. Con
--  esto pasa a tener un equipo: entrenador, médico y
--  nutricionista, todos con acceso a su panel.
--  Ejecútalo después de esquema.sql. Se puede repetir.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ROLES NUEVOS
-- ------------------------------------------------------------
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('atleta','coach','medico','nutricionista'));

-- La invitación decide con qué rol entra cada persona.
alter table public.invitaciones add column if not exists rol text not null default 'atleta';
alter table public.invitaciones drop constraint if exists invitaciones_rol_check;
alter table public.invitaciones add constraint invitaciones_rol_check
  check (rol in ('atleta','coach','medico','nutricionista'));

-- ------------------------------------------------------------
-- 2. QUIÉN TRABAJA CON QUIÉN
--    Una fila por pareja. La especialidad no se repite aquí:
--    sale del rol del propio profesional.
-- ------------------------------------------------------------
create table if not exists public.equipo (
  atleta_id uuid not null references public.perfiles(id) on delete cascade,
  staff_id  uuid not null references public.perfiles(id) on delete cascade,
  creado    timestamptz not null default now(),
  primary key (atleta_id, staff_id)
);

create index if not exists equipo_staff_idx on public.equipo (staff_id);

-- Los vínculos que ya existían por `coach_id` se conservan.
insert into public.equipo (atleta_id, staff_id)
  select p.id, p.coach_id
  from public.perfiles p
  where p.rol = 'atleta' and p.coach_id is not null
on conflict do nothing;

-- ------------------------------------------------------------
-- 3. AYUDANTES
--    `es_mi_atleta` es la que usan todas las políticas del
--    esquema: al cambiarla aquí, el acceso del equipo entra en
--    vigor en config, dias, documentos, mensajes y objetivos a
--    la vez, sin tocar ninguna política más.
-- ------------------------------------------------------------
create or replace function public.es_mi_atleta(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.equipo e
    where e.atleta_id = uid and e.staff_id = auth.uid()
  );
$$;

create or replace function public.soy_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('coach','medico','nutricionista')
  );
$$;

-- ------------------------------------------------------------
-- 4. PERMISOS
-- ------------------------------------------------------------
alter table public.equipo enable row level security;

-- Ver: el profesional ve sus vínculos, el deportista ve su equipo,
-- y el entrenador ve todos para poder repartirlos.
drop policy if exists equipo_ver on public.equipo;
create policy equipo_ver on public.equipo
  for select using (
    staff_id = auth.uid() or atleta_id = auth.uid() or public.soy_coach()
  );

-- Repartir el equipo es cosa del entrenador.
drop policy if exists equipo_asignar on public.equipo;
create policy equipo_asignar on public.equipo
  for insert with check (public.soy_coach());

drop policy if exists equipo_quitar on public.equipo;
create policy equipo_quitar on public.equipo
  for delete using (public.soy_coach());

-- Perfiles: el profesional ve a sus deportistas; el deportista ve a su
-- equipo; y el entrenador ve al resto de profesionales para asignarlos.
drop policy if exists perfil_de_mis_atletas on public.perfiles;
create policy perfil_de_mis_atletas on public.perfiles
  for select using (public.es_mi_atleta(id));

drop policy if exists perfil_de_mi_equipo on public.perfiles;
create policy perfil_de_mi_equipo on public.perfiles
  for select using (
    exists(select 1 from public.equipo e
           where e.staff_id = perfiles.id and e.atleta_id = auth.uid())
  );

-- Y los profesionales que comparten deportista se ven entre ellos: si no,
-- en la bandeja aparecerían mensajes sin nombre.
drop policy if exists perfil_de_mis_colegas on public.perfiles;
create policy perfil_de_mis_colegas on public.perfiles
  for select using (
    exists(select 1 from public.equipo mio
           join public.equipo suyo on mio.atleta_id = suyo.atleta_id
           where suyo.staff_id = perfiles.id and mio.staff_id = auth.uid())
  );

drop policy if exists perfil_staff_para_el_coach on public.perfiles;
create policy perfil_staff_para_el_coach on public.perfiles
  for select using (
    public.soy_coach() and rol in ('coach','medico','nutricionista')
  );

-- Los objetivos los pone el entrenador, no el resto del equipo.
drop policy if exists obj_crear on public.objetivos;
create policy obj_crear on public.objetivos
  for insert with check (
    autor_id = auth.uid()
    and (atleta_id = auth.uid()
         or (public.es_mi_atleta(atleta_id) and public.soy_coach()))
  );

-- ------------------------------------------------------------
-- 5. ALTA DE USUARIOS
--    Si la invitación trae un rol de profesional, la persona
--    entra como tal y sin deportistas: el entrenador se los
--    asigna después desde el panel.
-- ------------------------------------------------------------
create or replace function public.alta_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  inv   public.invitaciones%rowtype;
  coach uuid;
begin
  select id into coach from public.perfiles
    where rol = 'coach' order by creado limit 1;

  -- el primer usuario del sistema es el entrenador
  if coach is null then
    insert into public.perfiles (id, correo, nombre, rol)
      values (new.id, new.email,
              coalesce(new.raw_user_meta_data->>'nombre', new.email), 'coach');
    return new;
  end if;

  select * into inv from public.invitaciones
    where lower(correo) = lower(new.email);

  if inv.correo is not null and inv.rol in ('coach','medico','nutricionista') then
    insert into public.perfiles (id, correo, nombre, rol)
      values (new.id, new.email,
              coalesce(inv.nombre, new.raw_user_meta_data->>'nombre', new.email), inv.rol);
    update public.invitaciones set usada = true where correo = inv.correo;
    return new;
  end if;

  insert into public.perfiles (id, correo, nombre, rol, coach_id)
    values (new.id, new.email,
            coalesce(inv.nombre, new.raw_user_meta_data->>'nombre', new.email),
            'atleta', coach);

  -- el deportista arranca con su entrenador en el equipo
  insert into public.equipo (atleta_id, staff_id) values (new.id, coach)
    on conflict do nothing;

  if inv.correo is not null then
    update public.invitaciones set usada = true where correo = inv.correo;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.alta_usuario();

-- ------------------------------------------------------------
-- 6. EL PANEL, PARA TODO EL EQUIPO
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
where p.rol = 'atleta'
  and exists(select 1 from public.equipo e
             where e.atleta_id = p.id and e.staff_id = auth.uid());

grant select on public.panel_atletas to authenticated;

-- ------------------------------------------------------------
-- 7. EN VIVO · el equipo también recibe los cambios
-- ------------------------------------------------------------
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.equipo';
  exception when duplicate_object then null; end;
end $$;
