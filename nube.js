/* ============================================================
   Fractale · capa de datos en la nube
   Lo usan tanto la app (index.html) como el panel (panel.html).
   Si no hay configuración, todo esto queda inactivo y la app
   sigue funcionando solo con el almacenamiento del dispositivo.
   ============================================================ */
(function(global){
"use strict";

const CFG = global.APP_CONFIG || {};
const activa = () => !!(CFG.url && CFG.key && global.supabase);

let sb = null;
if(activa()){
  sb = global.supabase.createClient(CFG.url, CFG.key, {
    auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
}

/* ---------------- sesión ---------------- */
async function sesion(){
  if(!sb) return null;
  const {data} = await sb.auth.getSession();
  return data.session || null;
}
async function usuario(){
  const s = await sesion();
  return s ? s.user : null;
}
async function entrar(correo, clave){
  if(!sb) throw new Error("La app no está conectada a la base de datos");
  const {data, error} = await sb.auth.signInWithPassword({
    email: correo.trim().toLowerCase(), password: clave
  });
  if(error) throw new Error(traduce(error.code || error.message));
  return data.session;
}

async function registrarse(correo, clave, nombre){
  if(!sb) throw new Error("La app no está conectada a la base de datos");
  const {data, error} = await sb.auth.signUp({
    email: correo.trim().toLowerCase(), password: clave,
    options: { data: { nombre: (nombre||"").trim() || null } }
  });
  if(error) throw new Error(traduce(error.code || error.message));
  return data.session;
}

/* Recuperar contraseña sí necesita correo, y ahí manda el límite de Supabase */
async function recuperar(correo){
  if(!sb) throw new Error("La app no está conectada a la base de datos");
  const {error} = await sb.auth.resetPasswordForEmail(correo.trim().toLowerCase(),
    { redirectTo: location.href.split("#")[0] });
  if(error) throw new Error(traduce(error.code || error.message));
  return true;
}

async function cambiarClave(nueva){
  const {error} = await sb.auth.updateUser({password: nueva});
  if(error) throw new Error(traduce(error.code || error.message));
}
async function salir(){ if(sb) await sb.auth.signOut(); }
function alCambiarSesion(cb){ if(sb) sb.auth.onAuthStateChange((_e,s)=>cb(s)); }

/* ---------------- perfil ---------------- */
async function miPerfil(){
  if(!sb) return null;
  const u = await usuario();
  if(!u) return null;
  const {data, error} = await sb.from("perfiles").select("*").eq("id", u.id).maybeSingle();
  if(error) throw new Error(traduce(error.message));
  return data;
}
async function ponerNombre(nombre){
  const u = await usuario(); if(!u) return;
  await sb.from("perfiles").update({nombre}).eq("id", u.id);
}

/* ---------------- datos del usuario ---------------- */
/* Devuelve {config:{datos,mt}|null, dias:{fecha:{datos,mt}}} */
async function bajar(uid){
  if(!sb) return null;
  const id = uid || (await usuario())?.id;
  if(!id) return null;
  const [c, d] = await Promise.all([
    sb.from("config").select("datos,mt").eq("user_id", id).maybeSingle(),
    sb.from("dias").select("fecha,datos,mt").eq("user_id", id)
  ]);
  if(c.error) throw new Error(traduce(c.error.message));
  if(d.error) throw new Error(traduce(d.error.message));
  const dias = {};
  (d.data||[]).forEach(r=>{ dias[r.fecha] = {datos:r.datos, mt:Number(r.mt)||0}; });
  return {config: c.data ? {datos:c.data.datos, mt:Number(c.data.mt)||0} : null, dias};
}

/* Sube solo lo que cambió. filas = [{fecha, datos, mt}] */
async function subir({config, dias}){
  if(!sb) return;
  const u = await usuario(); if(!u) return;
  if(config){
    const {error} = await sb.from("config").upsert({
      user_id: u.id, datos: config.datos, mt: config.mt, actualizado: new Date().toISOString()
    });
    if(error) throw new Error(traduce(error.message));
  }
  if(dias && dias.length){
    for(let i=0;i<dias.length;i+=200){                    // por tandas, para no exceder límites
      const lote = dias.slice(i,i+200).map(r=>({
        user_id:u.id, fecha:r.fecha, datos:r.datos, mt:r.mt, actualizado:new Date().toISOString()
      }));
      const {error} = await sb.from("dias").upsert(lote);
      if(error) throw new Error(traduce(error.message));
    }
  }
}

/* ---------------- documentos médicos y nutricionales ----------------
   El archivo va a Storage, en una carpeta con el id de su dueño. La ficha
   (título, tipo, fecha) va a la tabla `documentos`. Para abrirlo se pide un
   enlace firmado que caduca: nunca hay una URL pública. */
const BUCKET = "documentos";

async function docs(uid){
  if(!sb) return [];
  const id = uid || (await usuario())?.id;
  if(!id) return [];
  const {data, error} = await sb.from("documentos").select("*")
    .eq("user_id", id).order("fecha", {ascending:false});
  if(error) throw new Error(traduce(error.message));
  const lista = data || [];
  /* Quién subió cada uno: ahora puede haberlo hecho el equipo. */
  const autores = await nombresDe(lista.map(d=>d.autor_id).filter(Boolean));
  return lista.map(d => ({...d, autor: autores[d.autor_id] || null}));
}

/* `atletaId` solo hace falta cuando sube alguien del equipo: si se omite, el
   documento es para uno mismo. La ruta cambia según el caso, porque es la
   propia ruta la que decide después quién puede borrar el archivo. */
async function subirDoc(archivo, {titulo, tipo, fecha, notas, atletaId}){
  if(!sb) throw new Error("Sin conexión con la base de datos.");
  const u = await usuario(); if(!u) throw new Error("Sin sesión");
  const dueño = atletaId || u.id;
  const ext   = (archivo.name.split(".").pop() || "pdf").toLowerCase();
  const nombre = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const ruta  = dueño === u.id ? `${dueño}/${nombre}` : `${dueño}/${u.id}/${nombre}`;

  const sub = await sb.storage.from(BUCKET).upload(ruta, archivo, {
    contentType: archivo.type || "application/pdf", upsert:false
  });
  if(sub.error) throw new Error(traduce(sub.error.message));

  const {data, error} = await sb.from("documentos").insert({
    user_id:dueño, autor_id:u.id, tipo: tipo||"medico", titulo, ruta,
    tam: archivo.size, fecha: fecha || new Date().toISOString().slice(0,10),
    notas: notas || null
  }).select().single();
  /* Si la ficha no se pudo guardar, el archivo quedaría huérfano en Storage. */
  if(error){
    await sb.storage.from(BUCKET).remove([ruta]).catch(()=>{});
    throw new Error(traduce(error.message));
  }
  return data;
}

/* Enlace temporal para abrir o descargar el archivo. */
async function urlDoc(ruta, segundos = 300){
  if(!sb) return null;
  const {data, error} = await sb.storage.from(BUCKET).createSignedUrl(ruta, segundos);
  if(error) throw new Error(traduce(error.message));
  return data.signedUrl;
}

async function borrarDoc(doc){
  if(!sb) return;
  const {error} = await sb.from("documentos").delete().eq("id", doc.id);
  if(error) throw new Error(traduce(error.message));
  await sb.storage.from(BUCKET).remove([doc.ruta]).catch(()=>{});
}

/* ---------------- objetivos ----------------
   El equipo asigna, el deportista marca. Editar el objetivo solo puede quien
   lo escribió; marcarlo, solo el deportista. */
async function objetivos(atletaId, incluirArchivados){
  if(!sb) return [];
  const id = atletaId || (await usuario())?.id;
  if(!id) return [];
  let q = sb.from("objetivos").select("*").eq("atleta_id", id).order("creado", {ascending:false});
  if(!incluirArchivados) q = q.eq("archivado", false);
  const {data, error} = await q;
  if(error) throw new Error(traduce(error.message));
  return data || [];
}

/* Los cumplimientos desde una fecha: con el mes en curso basta para calcular
   tanto el avance semanal como el mensual. */
async function hechos(atletaId, desde){
  if(!sb) return [];
  const id = atletaId || (await usuario())?.id;
  if(!id) return [];
  let q = sb.from("objetivo_hechos").select("*").eq("atleta_id", id).order("fecha", {ascending:false});
  if(desde) q = q.gte("fecha", desde);
  const {data, error} = await q;
  if(error) throw new Error(traduce(error.message));
  return data || [];
}

async function guardarObjetivo(obj){
  if(!sb) throw new Error("Sin conexión con la base de datos.");
  const u = await usuario(); if(!u) throw new Error("Sin sesión");
  if(obj.id){
    const {id, ...campos} = obj;
    const {data, error} = await sb.from("objetivos").update(campos).eq("id", id).select().single();
    if(error) throw new Error(traduce(error.message));
    return data;
  }
  const {data, error} = await sb.from("objetivos")
    .insert({...obj, autor_id:u.id, atleta_id: obj.atleta_id || u.id}).select().single();
  if(error) throw new Error(traduce(error.message));
  return data;
}

async function borrarObjetivo(id){
  if(!sb) return;
  const {error} = await sb.from("objetivos").delete().eq("id", id);
  if(error) throw new Error(traduce(error.message));
}

async function marcarObjetivo(objetivoId, fecha, nota){
  if(!sb) throw new Error("Sin conexión con la base de datos.");
  const u = await usuario(); if(!u) throw new Error("Sin sesión");
  const {data, error} = await sb.from("objetivo_hechos").insert({
    objetivo_id: objetivoId, atleta_id: u.id,
    fecha: fecha || new Date().toISOString().slice(0,10), nota: nota || null
  }).select().single();
  if(error) throw new Error(traduce(error.message));
  return data;
}

async function desmarcarObjetivo(hechoId){
  if(!sb) return;
  const {error} = await sb.from("objetivo_hechos").delete().eq("id", hechoId);
  if(error) throw new Error(traduce(error.message));
}

/* ---------------- mensajes ----------------
   Una conversación por deportista: `atleta_id` la identifica, tanto si escribe
   él como si escribe su entrenador. */
async function mensajes(atletaId, desde){
  if(!sb) return [];
  let q = sb.from("mensajes").select("*").eq("atleta_id", atletaId).order("creado", {ascending:true});
  if(desde) q = q.gt("creado", desde);
  const {data, error} = await q;
  if(error) throw new Error(traduce(error.message));
  return data || [];
}

async function enviar(atletaId, texto){
  if(!sb) throw new Error("Sin conexión con la base de datos.");
  const u = await usuario(); if(!u) throw new Error("Sin sesión");
  const t = String(texto||"").trim();
  if(!t) return null;
  const {data, error} = await sb.from("mensajes")
    .insert({atleta_id:atletaId, autor_id:u.id, texto:t}).select().single();
  if(error) throw new Error(traduce(error.message));
  return data;
}

async function borrarMensaje(id){
  if(!sb) return;
  const {error} = await sb.from("mensajes").delete().eq("id", id);
  if(error) throw new Error(traduce(error.message));
}

/* Cuántos mensajes del otro llegaron después de la última vez que miraste. */
async function sinLeer(atletaId){
  if(!sb) return 0;
  const {data, error} = await sb.rpc("sin_leer", {conv: atletaId});
  if(error) return 0;
  return Number(data) || 0;
}

async function marcarLeido(atletaId){
  if(!sb) return;
  const u = await usuario(); if(!u) return;
  await sb.from("lecturas").upsert({
    atleta_id: atletaId, user_id: u.id, leido_hasta: new Date().toISOString()
  });
}

/* Avisa cuando entra un mensaje nuevo en esa conversación. */
function escucharChat(atletaId, alLlegar){
  if(!sb) return null;
  const canal = sb.channel("chat-" + atletaId)
    .on("postgres_changes",
        {event:"INSERT", schema:"public", table:"mensajes", filter:`atleta_id=eq.${atletaId}`},
        p => alLlegar && alLlegar(p.new))
    .subscribe();
  return canal;
}

/* ---------------- entrenador ---------------- */
async function misAtletas(){
  if(!sb) return [];
  const {data, error} = await sb.from("panel_atletas").select("*");
  if(error) throw new Error(traduce(error.message));
  return data || [];
}
async function diasDe(uid, desde){
  if(!sb) return [];
  let q = sb.from("dias").select("fecha,datos").eq("user_id", uid).order("fecha",{ascending:false});
  if(desde) q = q.gte("fecha", desde);
  const {data, error} = await q;
  if(error) throw new Error(traduce(error.message));
  return data || [];
}
async function configDe(uid){
  const {data, error} = await sb.from("config").select("datos").eq("user_id", uid).maybeSingle();
  if(error) throw new Error(traduce(error.message));
  return data ? data.datos : null;
}
/* ---------------- equipo de trabajo ---------------- */
const ROLES_STAFF = ["coach","medico","nutricionista"];

/* Quién trabaja con este deportista. */
async function equipoDe(atletaId){
  if(!sb) return [];
  const {data, error} = await sb.from("equipo")
    .select("staff_id, creado, perfiles!equipo_staff_id_fkey(id,nombre,correo,rol)")
    .eq("atleta_id", atletaId);
  if(error) throw new Error(traduce(error.message));
  return (data||[]).map(r => ({...r.perfiles, desde:r.creado})).filter(x=>x.id);
}

/* Todos los profesionales del sistema, para que el entrenador reparta. */
async function staffDisponible(){
  if(!sb) return [];
  const {data, error} = await sb.from("perfiles").select("id,nombre,correo,rol")
    .in("rol", ROLES_STAFF).order("nombre");
  if(error) throw new Error(traduce(error.message));
  return data || [];
}

async function asignar(atletaId, staffId){
  if(!sb) throw new Error("Sin conexión con la base de datos.");
  const {error} = await sb.from("equipo").insert({atleta_id:atletaId, staff_id:staffId});
  if(error) throw new Error(traduce(error.message));
}

async function quitarDelEquipo(atletaId, staffId){
  if(!sb) return;
  const {error} = await sb.from("equipo").delete()
    .eq("atleta_id", atletaId).eq("staff_id", staffId);
  if(error) throw new Error(traduce(error.message));
}

/* Nombres de quienes escriben en la bandeja: ahora puede ser más de uno. */
async function nombresDe(ids){
  if(!sb || !ids.length) return {};
  const {data, error} = await sb.from("perfiles").select("id,nombre,rol")
    .in("id", [...new Set(ids)]);
  if(error) return {};
  const out = {};
  (data||[]).forEach(p => out[p.id] = p);
  return out;
}

async function invitaciones(){
  const {data, error} = await sb.from("invitaciones").select("*").order("creada",{ascending:false});
  if(error) throw new Error(traduce(error.message));
  return data || [];
}
async function invitar(correo, nombre, rol){
  const u = await usuario(); if(!u) throw new Error("Sin sesión");
  const {error} = await sb.from("invitaciones").upsert({
    correo: correo.trim().toLowerCase(), nombre: (nombre||"").trim() || null,
    rol: rol || "atleta", coach_id: u.id
  });
  if(error) throw new Error(traduce(error.message));
}
async function quitarInvitacion(correo){
  const {error} = await sb.from("invitaciones").delete().eq("correo", correo);
  if(error) throw new Error(traduce(error.message));
}

/* ---------------- cambios en vivo ----------------
   La base avisa al panel en cuanto un deportista guarda algo.
   Solo llegan los cambios que los permisos por fila te dejan ver. */
function escuchar(alCambiar, alEstado){
  if(!sb) return null;
  const canal = sb.channel("panel-en-vivo")
    .on("postgres_changes", {event:"*", schema:"public", table:"dias"},
        p => alCambiar && alCambiar(p.new?.user_id || p.old?.user_id, p))
    .on("postgres_changes", {event:"*", schema:"public", table:"perfiles"},
        p => alCambiar && alCambiar(p.new?.id || p.old?.id, p))
    .subscribe(estado => alEstado && alEstado(estado));
  return canal;
}
function dejarDeEscuchar(canal){ if(sb && canal) sb.removeChannel(canal); }

/* ---------------- mensajes en cristiano ---------------- */
function traduce(m){
  const s = String(m||"");
  if(/invalid_credentials|Invalid login/i.test(s))  return "Correo o contraseña incorrectos.";
  if(/user_already_exists|already registered/i.test(s)) return "Ese correo ya tiene cuenta. Entra con tu contraseña.";
  if(/weak_password|Password should be/i.test(s))   return "La contraseña debe tener al menos 8 caracteres.";
  if(/unexpected_failure|Database error/i.test(s))  return "No se pudo crear la cuenta. Inténtalo de nuevo en un momento.";
  if(/over_email_send_rate_limit/i.test(s))   return "Supabase solo permite 2 correos por hora en el plan gratuito. "
                                                   + "Espera un rato o configura un servicio de correo propio.";
  if(/rate limit|too many/i.test(s))          return "Demasiados intentos seguidos. Espera un rato.";
  if(/invalid.*email|email.*invalid/i.test(s))return "Ese correo no parece válido.";
  if(/Bucket not found/i.test(s))             return "Falta crear el almacén de documentos. "
                                                   + "Ejecuta base-de-datos/salud.sql en Supabase.";
  if(/relation .*objetivo.* does not exist|objetivos.*not exist/i.test(s))
                                              return "Falta el checklist de objetivos. "
                                                   + "Ejecuta base-de-datos/objetivos.sql en Supabase.";
  if(/relation .*mensajes.* does not exist|Could not find the function public.sin_leer/i.test(s))
                                              return "Falta la bandeja de mensajes. "
                                                   + "Ejecuta base-de-datos/chat.sql en Supabase.";
  if(/relation .*documentos.* does not exist|documentos.*not exist/i.test(s))
                                              return "Falta la tabla de documentos. "
                                                   + "Ejecuta base-de-datos/salud.sql en Supabase.";
  if(/exceeded the maximum allowed size|Payload too large/i.test(s))
                                              return "El archivo pesa más de 15 MB.";
  if(/mime type.*not supported|invalid_mime/i.test(s)) return "Solo se aceptan PDF e imágenes.";
  if(/relation .*equipo.* does not exist|equipo.*not exist/i.test(s))
                                              return "Falta el equipo de trabajo. "
                                                   + "Ejecuta base-de-datos/equipo.sql en Supabase.";
  if(/duplicate key.*equipo/i.test(s))        return "Esa persona ya está en el equipo de este deportista.";
  if(/row-level security|permission denied/i.test(s)) return "No tienes permiso para ver eso.";
  if(/Failed to fetch|NetworkError/i.test(s)) return "Sin conexión a internet.";
  if(/signup.*disabled/i.test(s))             return "El registro está cerrado. Pide una invitación.";
  return s;
}

global.Nube = {
  activa, cliente:()=>sb, sesion, usuario, salir, alCambiarSesion,
  entrar, registrarse, recuperar, cambiarClave,
  miPerfil, ponerNombre, bajar, subir,
  docs, subirDoc, urlDoc, borrarDoc,
  mensajes, enviar, borrarMensaje, sinLeer, marcarLeido, escucharChat,
  objetivos, hechos, guardarObjetivo, borrarObjetivo, marcarObjetivo, desmarcarObjetivo,
  misAtletas, diasDe, configDe, invitaciones, invitar, quitarInvitacion,
  equipoDe, staffDisponible, asignar, quitarDelEquipo, nombresDe, ROLES_STAFF,
  escuchar, dejarDeEscuchar, traduce
};
})(window);
