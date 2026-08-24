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
async function invitaciones(){
  const {data, error} = await sb.from("invitaciones").select("*").order("creada",{ascending:false});
  if(error) throw new Error(traduce(error.message));
  return data || [];
}
async function invitar(correo, nombre){
  const u = await usuario(); if(!u) throw new Error("Sin sesión");
  const {error} = await sb.from("invitaciones").upsert({
    correo: correo.trim().toLowerCase(), nombre: (nombre||"").trim() || null, coach_id: u.id
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
  if(/row-level security|permission denied/i.test(s)) return "No tienes permiso para ver eso.";
  if(/Failed to fetch|NetworkError/i.test(s)) return "Sin conexión a internet.";
  if(/signup.*disabled/i.test(s))             return "El registro está cerrado. Pide una invitación.";
  return s;
}

global.Nube = {
  activa, cliente:()=>sb, sesion, usuario, salir, alCambiarSesion,
  entrar, registrarse, recuperar, cambiarClave,
  miPerfil, ponerNombre, bajar, subir,
  misAtletas, diasDe, configDe, invitaciones, invitar, quitarInvitacion,
  escuchar, dejarDeEscuchar, traduce
};
})(window);
