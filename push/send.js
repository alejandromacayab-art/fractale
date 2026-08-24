/* Envía las alertas de Fractale por Web Push.
   Pensado para ejecutarse cada 30 min desde GitHub Actions (o cualquier cron).

   Variables de entorno:
     VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   claves generadas con `npm run keys`
     PUSH_SUBSCRIPTION                     JSON de la suscripción (uno o varios, en array)
   Opcional:
     node send.js --force habits|screens|sueno   → envía ya, ignorando el horario   */
"use strict";
const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
const TZ = cfg.timezone || "America/Santiago";

function setupVapid(){
  const PUB = process.env.VAPID_PUBLIC_KEY, PRIV = process.env.VAPID_PRIVATE_KEY;
  if(!PUB || !PRIV){ console.error("Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY"); process.exit(1); }
  webpush.setVapidDetails(cfg.contacto || "mailto:nadie@example.com", PUB, PRIV);
}

/* --- suscripciones --- */
function loadSubs(){
  const raw = process.env.PUSH_SUBSCRIPTION
    || (fs.existsSync(path.join(__dirname,"subscriptions.json"))
        && fs.readFileSync(path.join(__dirname,"subscriptions.json"),"utf8"));
  if(!raw){
    console.log("Todavía no hay ningún dispositivo suscrito.");
    console.log("Actívalo en la app (Ajustes → App en el celular) y guarda el texto");
    console.log("como el secreto PUSH_SUBSCRIPTION del repositorio.");
    return [];
  }
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

/* --- hora local según la zona horaria configurada --- */
function localNow(){
  if(process.env.FAKE_NOW){ const [h,m] = process.env.FAKE_NOW.split(":").map(Number); return h*60+m; }
  const f = new Intl.DateTimeFormat("es-CL", {timeZone:TZ, hour:"2-digit", minute:"2-digit", hour12:false});
  const [h,m] = f.format(new Date()).split(":").map(Number);
  return h*60 + m;
}
const hm = s => { const [h,m] = String(s).split(":").map(Number); return h*60 + m; };

/* Qué toca enviar en este momento. La ventana es de 30 min para tolerar
   el retraso habitual de los cron de GitHub Actions. */
const VENTANA = 30;
function pendientes(){
  const now = localNow(), out = [];
  const dentro = (target) => { const d = now - hm(target); return d >= 0 && d < VENTANA; };

  if(cfg.pantallas?.activo && dentro(cfg.pantallas.hora))
    out.push({kind:"screens",
      title:"🌙 Hora de dejar las pantallas",
      body:`Son las ${cfg.pantallas.hora}. Baja el ritmo y prepara tu descanso: mañana tu puntuación de sueño lo nota.`});

  if(cfg.sueno?.activo && dentro(cfg.sueno.hora))
    out.push({kind:"sueno",
      title:"☀️ Buenos días",
      body:"Registra cómo dormiste para calcular tu puntuación de sueño."});

  if(cfg.habitos?.activo){
    const a = hm(cfg.habitos.desde), b = hm(cfg.habitos.hasta);
    const paso = Math.max(30, cfg.habitos.cadaMinutos || 120);
    for(let t = a; t <= b; t += paso){
      const hh = String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0");
      if(dentro(hh)){
        out.push({kind:"habits",
          title:"Fractale 🏋️",
          body:"¿Cómo van tus círculos de hoy? Abre la app y completa lo que falte."});
        break;
      }
    }
  }
  return out;
}

async function main(){
  setupVapid();
  const forceIdx = process.argv.indexOf("--force");
  let jobs;
  if(forceIdx > -1){
    const k = process.argv[forceIdx+1] || "habits";
    jobs = [{kind:k, title:"Fractale 🏋️", body:"Notificación de prueba: si ves esto, las alertas funcionan."}];
  }else{
    jobs = pendientes();
  }
  if(!jobs.length){ console.log(`Nada que enviar a las ${Math.floor(localNow()/60)}:${String(localNow()%60).padStart(2,"0")} (${TZ}).`); return; }

  const subs = loadSubs();
  if(!subs.length) return;          // sin dispositivos: no es un error, simplemente no hay a quién avisar
  let ok = 0, gone = 0;
  for(const job of jobs){
    for(const sub of subs){
      try{
        await webpush.sendNotification(sub, JSON.stringify(job));
        ok++;
      }catch(err){
        if(err.statusCode === 404 || err.statusCode === 410){
          gone++;
          console.warn("Suscripción caducada; vuelve a activar las alertas en la app.");
        }else{
          console.error("Error al enviar:", err.statusCode, err.body || err.message);
          process.exitCode = 1;
        }
      }
    }
    console.log(`→ ${job.kind}: ${job.title}`);
  }
  console.log(`Enviadas ${ok} · caducadas ${gone}`);
}
if(require.main === module) main();
module.exports = {pendientes, localNow, hm};
