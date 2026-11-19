-- Fractale · Inscripciones + embudo del stand
create extension if not exists pgcrypto;

create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  fecha date not null,
  lugar text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inscritos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  nombre text not null,
  rut text,
  email text not null,
  telefono text,
  fecha_nacimiento date,
  genero text,
  categoria text not null,
  talla_polera text,
  ciudad text,
  club text,
  contacto_emergencia text,
  acepta_terminos boolean not null default false,
  -- Autoriza usar su correo para enviarle información de Fractale, del evento y de marcas auspiciadoras.
  acepta_comunicaciones boolean not null default false,
  -- Se pone en false si el usuario pide la baja desde un correo.
  comunicaciones_activas boolean not null default true,
  origen text not null default 'web' check (origen in ('web','stand')),
  created_at timestamptz not null default now(),
  unique (evento_id, email)
);
create index if not exists inscritos_evento_idx on inscritos(evento_id);

-- Cada acción del participante en el stand. Una por tipo y persona (sirve para contar personas distintas).
create table if not exists interacciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references eventos(id) on delete cascade,
  inscrito_id uuid not null references inscritos(id) on delete cascade,
  tipo text not null check (tipo in ('visita_stand','recovery','compra_force','uso_plataforma','sigue_instagram')),
  monto integer,            -- opcional: monto de la compra en CLP
  created_at timestamptz not null default now(),
  unique (inscrito_id, tipo)
);
create index if not exists interacciones_evento_tipo_idx on interacciones(evento_id, tipo);

create table if not exists envios (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references eventos(id),
  asunto text not null,
  destinatarios int not null,
  created_at timestamptz not null default now()
);

-- RLS activado SIN políticas: el navegador (anon key) no puede leer ni escribir nada.
-- Solo el servidor, con la service_role key, accede a los datos.
alter table eventos enable row level security;
alter table inscritos enable row level security;
alter table interacciones enable row level security;
alter table envios enable row level security;

insert into eventos (slug, nombre, fecha, lugar)
values ('media-maraton-los-ulmos', 'Media Maratón Internacional Ruta de los Ulmos', '2027-04-18', 'Los Lagos, Chile')
on conflict (slug) do nothing;
