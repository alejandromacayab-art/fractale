-- ============================================================
--  Quién leyó la conversación
--  La tabla `lecturas` solo deja ver la marca propia, así que
--  nadie puede saber si el otro lo leyó. Esta función devuelve
--  las marcas AJENAS de una conversación, y solo a quien ya
--  tiene derecho a leer esa conversación.
--  Ejecútalo después de chat.sql y de equipo.sql.
-- ============================================================

-- `security definer` porque tiene que saltarse la política de
-- `lecturas`, que es estrictamente propia. El permiso se comprueba
-- aquí dentro: o la conversación es tuya, o es la de un deportista
-- que tienes asignado.
create or replace function public.lecturas_de(conv uuid)
returns table (user_id uuid, leido_hasta timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.user_id, l.leido_hasta
  from public.lecturas l
  where l.atleta_id = conv
    and l.user_id <> auth.uid()
    and (conv = auth.uid() or public.es_mi_atleta(conv));
$$;

revoke all on function public.lecturas_de(uuid) from public, anon;
grant execute on function public.lecturas_de(uuid) to authenticated;
