/* Service worker de Fractale
   - cachea la app para que funcione sin internet
   - recibe las notificaciones push enviadas desde el servidor
   - lee el progreso del día desde IndexedDB para que el aviso sea específico */
const CACHE = "app-v34";
const SHELL = [
  "./", "./index.html", "./app.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
  "./assets/symbol-dark.png", "./assets/symbol-light.png", "./assets/logo-dark.png",
  "./assets/fotos/puerto-montt-900.jpg",
  "./estilos.css", "./config.js", "./nube.js", "./vendor/supabase.js",
  "./panel.html", "./panel.js"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

/* red primero para el HTML (para que veas los cambios), caché como respaldo */
self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // el HTML se pide siempre al servidor, sin pasar por la caché del navegador:
  // si no, una copia guardada podía tapar una versión nueva durante horas
  const esHTML = req.mode === "navigate" ||
                 (req.headers.get("accept")||"").includes("text/html") ||
                 /\.(html|js|css|webmanifest)$/.test(new URL(req.url).pathname);
  const pedir = esHTML ? fetch(new Request(req.url, {cache:"no-store"})) : fetch(req);
  e.respondWith(
    pedir.then(res=>{
      const copy = res.clone();
      caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(()=> caches.match(req).then(r=> r || caches.match("./app.html")))
  );
});

/* ---------- estado del día guardado por la app ---------- */
function readState(){
  return new Promise(res=>{
    let done=false; const fin=v=>{ if(!done){ done=true; res(v); } };
    setTimeout(()=>fin(null), 1200);
    try{
      const rq = indexedDB.open("bienestar-state", 1);
      rq.onupgradeneeded = ()=> rq.result.createObjectStore("kv");
      rq.onerror = ()=> fin(null);
      rq.onsuccess = ()=>{
        try{
          const db = rq.result;
          const g = db.transaction("kv","readonly").objectStore("kv").get("today");
          g.onsuccess = ()=> fin(g.result || null);
          g.onerror   = ()=> fin(null);
        }catch(e){ fin(null); }
      };
    }catch(e){ fin(null); }
  });
}
const hoyKey = ()=>{ const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };

self.addEventListener("push", e=>{
  let data = {};
  try{ data = e.data ? e.data.json() : {}; }catch(err){ data = {body: e.data && e.data.text()}; }
  const kind = data.kind || "habits";

  e.waitUntil((async ()=>{
    let title = data.title || "Fractale";
    let body  = data.body  || "";
    const st = await readState();
    const fresh = st && st.date === hoyKey();

    if(kind === "habits"){
      if(fresh && st.pct >= 100){
        title = "Día registrado 🎉";
        body  = "Ya anotaste todo lo de hoy. Descansa tranquilo.";
      }else if(fresh){
        title = "Te falta registrar el día 🏋️";
        body  = st.detail
          ? `${st.detail}${st.pending > 1 ? ` y ${st.pending-1} cosa${st.pending>2?"s":""} más` : ""}.`
          : `Te quedan ${st.pending} cosa${st.pending===1?"":"s"} por registrar.`;
      }
    }

    await self.registration.showNotification(title, {
      body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-192.png",
      tag: "bienestar-" + kind,
      renotify: true,
      data: {url: "./app.html"}
    });
  })());
});

self.addEventListener("notificationclick", e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window", includeUncontrolled:true}).then(list=>{
    for(const c of list){ if("focus" in c) return c.focus(); }
    return clients.openWindow((e.notification.data && e.notification.data.url) || "./app.html");
  }));
});
