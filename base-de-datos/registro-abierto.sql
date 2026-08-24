-- ============================================================
--  Mi App · abrir el registro
--  Cualquiera que se registre entra como deportista y queda
--  asignado al entrenador. La invitación pasa a ser opcional:
--  si existe, solo sirve para que llegue con su nombre puesto.
--  Pégalo en Supabase → SQL Editor → New query → Run.
-- ============================================================
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

  insert into public.perfiles (id, correo, nombre, rol, coach_id)
    values (new.id, new.email,
            coalesce(inv.nombre, new.raw_user_meta_data->>'nombre', new.email),
            'atleta', coach);

  if inv.correo is not null then
    update public.invitaciones set usada = true where correo = inv.correo;
  end if;

  return new;
end;
$$;
