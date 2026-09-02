/* ============================================================
   Mi App · panel del entrenador
   Solo lectura: aquí no se modifica el registro de nadie.
   ============================================================ */
"use strict";

let perfil = null, atletas = [], invs = [];
let canal = null, vista = {tipo:"lista", id:null}, refrescoTimer = null, enVivo = false;
const $ = id => document.getElementById(id);
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kg  = n => Math.round(Number(n)||0).toLocaleString("es-CL");
const MESES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function toast(m){
  const t=$("toast"); t.textContent=m; t.classList.add("show");
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),1800);
}
function hoyKey(d=new Date()){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function diasDesde(fecha){
  if(!fecha) return null;
  return Math.floor((new Date(hoyKey()) - new Date(fecha)) / 86400000);
}
function fechaCorta(f){
  if(!f) return "—";
  const [y,m,d] = f.split("-").map(Number);
  return `${d} ${MESES[m-1]}`;
}
const iniciales = n => String(n||"?").trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();

/* ---------------- semáforos ---------------- */
function estadoActividad(dias){
  if(dias === null)  return {t:"nunca entró", c:"#6f7887"};
  if(dias <= 1)      return {t:"al día",      c:"#22e07a"};
  if(dias <= 3)      return {t:`hace ${dias} días`, c:"#22e07a"};
  if(dias <= 7)      return {t:`hace ${dias} días`, c:"#fbbf24"};
  return {t:`hace ${dias} días`, c:"#fb7185"};
}
function colorChatarra(n){ return n >= 5 ? "#fb7185" : n >= 3 ? "#fbbf24" : "#22e07a"; }

/* ---------------- equipo ---------------- */
const ROLES = {
  coach:         {e:"🏋️", l:"Entrenador"},
  medico:        {e:"🩺", l:"Médico"},
  nutricionista: {e:"🥗", l:"Nutricionista"},
  atleta:        {e:"🏃", l:"Deportista"}
};
const rotulo = r => ROLES[r] || ROLES.atleta;
/* Repartir el equipo, invitar y asignar objetivos es cosa del entrenador.
   El resto del equipo mira y escribe. */
const soyCoach = () => perfil?.rol === "coach";

/* ---------------- salud ---------------- */
const TIPOS_DOC = {medico:{e:"🩺", l:"Médico"}, nutricional:{e:"🥗", l:"Nutricional"}, otro:{e:"📄", l:"Otro"}};
/* Los mismos grupos y el mismo orden que la app: entrenador y deportista leen
   la ficha igual. Si cambia allá, cambia aquí. */
const FICHA_MED = [
  {g:"Identificación y contacto", c:[
    ["nacimiento","Fecha de nacimiento","date"], ["grupo","Grupo sanguíneo"],
    ["estatura","Estatura","cm"], ["prevision","Previsión o seguro"],
    ["contacto","Contacto de emergencia"], ["contacto2","Segundo contacto"],
    ["tratante","Médico o kinesiólogo tratante"]
  ]},
  {g:"Alergias", c:[
    ["alergiaMed","A medicamentos","!"], ["alergiaAlim","Alimentarias","!"], ["alergias","Otras alergias"]
  ]},
  {g:"Antecedentes médicos", c:[
    ["condiciones","Condiciones diagnosticadas"], ["cirugias","Cirugías y hospitalizaciones"],
    ["conmociones","Golpes en la cabeza o conmociones"], ["respiratorio","Problemas respiratorios con el ejercicio"]
  ]},
  {g:"Tamizaje cardiovascular", c:[
    ["cvDolor","Dolor u opresión en el pecho al esforzarse","sn"],
    ["cvDesmayo","Desmayos o mareos con el ejercicio","sn"],
    ["cvAhogo","Falta de aire o fatiga antes que sus pares","sn"],
    ["cvSoplo","Soplo o presión alta detectados","sn"],
    ["cvFamiliar","Muerte súbita familiar antes de los 50","sn"]
  ]},
  {g:"Medicación y sustancias", c:[
    ["medicacion","Medicación habitual"], ["medicacionOcas","Medicación ocasional"],
    ["tue","Autorización de uso terapéutico"], ["habitos","Tabaco y alcohol"]
  ]},
  {g:"Lesiones", c:[
    ["lesiones","Lesiones previas"], ["lesionActual","Molestia o lesión activa","!"],
    ["limitaciones","Movimientos o cargas a evitar","!"]
  ]},
  {g:"Controles y certificados", c:[
    ["ultimoControl","Último control médico deportivo","date"], ["ecg","Electrocardiograma"],
    ["sangre","Último examen de sangre"], ["certificaVence","Vence el certificado de aptitud","date"],
    ["vacunas","Vacunas relevantes"]
  ]}
];
const FICHA_NUT = [
  {g:"Alimentación", c:[
    ["restricciones","Restricciones e intolerancias","!"], ["suplementos","Suplementos"],
    ["objetivoNutri","Objetivo nutricional"], ["notasNutri","Indicaciones del nutricionista"]
  ]}
];
const SN = {si:"Sí", no:"No", nose:"No lo sé"};
const lleno = v => String(v ?? "").trim() !== "";
const fechaLargaP = f => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(f))) return f;
  const [y,m,d] = f.split("-").map(Number);
  return `${d} ${MESES[m-1]} ${y}`;
};
function edadP(f){
  const [y,m,d] = f.split("-").map(Number), h = new Date();
  let a = h.getFullYear() - y, dm = (h.getMonth()+1) - m;
  if(dm < 0 || (dm === 0 && h.getDate() < d)) a--;
  return a;
}
function valorFichaP(v, tipo, k){
  if(tipo === "sn")   return SN[v] || v;
  if(tipo === "date") return k === "nacimiento"
    ? `${fechaLargaP(v)} · ${edadP(v)} años` : fechaLargaP(v);
  if(tipo === "cm")   return v + " cm";
  return v;
}
/* Lo que el entrenador tiene que ver sin abrir la ficha. */
function banderasP(salud){
  const f = salud || {}, out = [];
  FICHA_MED.flatMap(s=>s.c).filter(([k,,t]) => t === "sn" && f[k] === "si")
    .forEach(([,l]) => out.push({t:"alta", txt:l}));
  if(lleno(f.alergiaMed))   out.push({t:"alta",  txt:"Alergia a medicamentos: " + f.alergiaMed});
  if(lleno(f.alergiaAlim))  out.push({t:"media", txt:"Alergia alimentaria: " + f.alergiaAlim});
  if(lleno(f.lesionActual)) out.push({t:"media", txt:"Lesión activa: " + f.lesionActual});
  if(lleno(f.limitaciones)) out.push({t:"media", txt:"Evitar: " + f.limitaciones});
  if(lleno(f.contacto))     out.push({t:"info",  txt:"Emergencia: " + f.contacto});
  if(lleno(f.certificaVence)){
    const n = faltan(f.certificaVence);
    if(n < 0)        out.push({t:"alta",  txt:`Certificado de aptitud vencido hace ${-n} días`});
    else if(n <= 30) out.push({t:"media", txt:`El certificado de aptitud vence en ${n} días`});
  }
  return out;
}
const un1 = n => Math.round(Number(n)*10)/10;
const pesoArchivo = b => !b ? "" : b >= 1048576 ? (b/1048576).toFixed(1)+" MB" : Math.max(1, Math.round(b/1024))+" KB";
/* La medición más reciente y la más cercana a 30 días atrás, para el delta. */
function medicionesDe(dias){
  const ms = dias.filter(r=>Number(r.datos?.cuerpo?.peso) > 0)
                 .map(r=>({fecha:r.fecha, ...r.datos.cuerpo}))
                 .sort((a,b)=> b.fecha.localeCompare(a.fecha));
  const limite = hoyKey(new Date(Date.now() - 30*86400000));
  return {ultima: ms[0] || null, antes: ms.find(m=>m.fecha <= limite) || null, todas: ms};
}
function deltaTxt(actual, antes, mejorSube){
  if(!antes || !Number(antes)) return {t:"—", c:"#6f7887"};
  const d = un1(actual - antes);
  if(d === 0) return {t:"sin cambio", c:"#6f7887"};
  const bueno = mejorSube === null ? null : (mejorSube ? d > 0 : d < 0);
  return {t:`${d>0?"▲":"▼"} ${Math.abs(d)}`,
          c: bueno === null ? "#a7b2c2" : bueno ? "#22e07a" : "#fb7185"};
}
function fichaHTML(salud, secs){
  const cuerpo = secs.map(sec=>{
    const llenos = sec.c.filter(([k]) => lleno(salud?.[k]));
    if(!llenos.length) return "";
    return `<div class="fcgrupo">${sec.g}</div>` + llenos.map(([k,l,t])=>{
      const rojo = t === "sn" ? salud[k] === "si" : t === "!";
      return `<div class="fcrow"><span>${l}</span>
        <b${rojo ? ' style="color:#fb7185"' : ""}>${esc(valorFichaP(salud[k], t, k))}</b></div>`;
    }).join("");
  }).join("");
  return cuerpo ? `<div class="panel">${cuerpo}</div>` : "";
}
function banderasHTML(salud){
  const bs = banderasP(salud);
  if(!bs.length) return "";
  return `<div class="flags">${bs.map(b=>
    `<div class="flag ${b.t}"><span>${b.t === "alta" ? "🚨" : b.t === "media" ? "⚠️" : "📞"}</span>${esc(b.txt)}</div>`
  ).join("")}</div>`;
}

/* ---------------- objetivos ----------------
   El entrenador asigna y edita lo que él escribió; marcar es cosa del
   deportista, así que aquí no hay botón para tildar. */
const CAT_OBJ = {
  redes:       {e:"📱", l:"Redes",       c:"#e879f9"},
  rendimiento: {e:"🏋️", l:"Rendimiento", c:"#22e07a"},
  equipo:      {e:"🤝", l:"Equipo",      c:"#38bdf8"},
  otro:        {e:"⭐️", l:"Otro",        c:"#fbbf24"}
};
const CADENCIAS = {semanal:"por semana", mensual:"por mes", unica:"una vez"};

function lunesDeP(d = new Date()){
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return hoyKey(x);
}
function inicioMesP(){
  const d = new Date();
  return hoyKey(new Date(d.getFullYear(), d.getMonth(), 1));
}
function avanceP(o, hechos){
  const desde = o.cadencia === "semanal" ? lunesDeP()
              : o.cadencia === "mensual" ? inicioMesP() : null;
  const n = hechos.filter(h => h.objetivo_id === o.id && (!desde || h.fecha >= desde)).length;
  const meta = o.cadencia === "unica" ? 1 : Math.max(1, o.meta || 1);
  return {n, meta, listo: n >= meta};
}
function objetivosHTML(objs, hechos){
  if(!objs.length) return `<div class="panel"><div class="empty">
    Sin objetivos asignados. Ponle el primero.</div></div>`;
  return `<div class="panel">${objs.map(o=>{
    const a = avanceP(o, hechos), cat = CAT_OBJ[o.categoria] || CAT_OBJ.otro;
    const mio = o.autor_id === perfil?.id;
    const vencido = o.vence && faltan(o.vence) < 0 && !a.listo;
    const periodo = o.cadencia === "unica"
      ? (o.vence ? "para el " + fechaLargaP(o.vence) : "sin plazo")
      : `${o.meta} ${CADENCIAS[o.cadencia]}`;
    return `<div class="objrow ${a.listo ? "listo" : ""}" style="--a:${cat.c}">
      <div class="objtick ${a.listo ? "on" : ""}">${a.listo ? "✓" : "·"}</div>
      <div class="objtx"><b>${esc(o.titulo)}</b>
        <span>${cat.e} ${cat.l} · ${periodo}${
          vencido ? ' · <em style="color:#fb7185;font-style:normal;font-weight:800">vencido</em>' : ""}${
          mio ? "" : " · se lo puso él"}</span>
        ${o.detalle ? `<span class="det">${esc(o.detalle)}</span>` : ""}
        ${o.cadencia === "unica" ? "" : `<div class="objdots">${
          Array.from({length: Math.min(a.meta, 12)}, (_,i)=>
            `<i class="${i < a.n ? "f" : ""}"></i>`).join("")}</div>`}
      </div>
      <div class="objn">${a.n}/${a.meta}</div>
      ${mio && perfil?.rol === "coach" ? `<button class="objedit" data-obj="${o.id}" title="Editar">✎</button>` : ""}
    </div>`;
  }).join("")}</div>`;
}

/* Modal de objetivo. Lo comparte con la app, salvo que aquí siempre se
   asigna a otra persona. */
let objEditando = null, objAtleta = null;

function ajustaMeta(){
  const cad = document.querySelector("#obCad [data-cad].on")?.dataset.cad || "semanal";
  $("obMetaWrap").classList.toggle("hidden", cad === "unica");
}
function openObjetivo(o, atletaId){
  objEditando = o || null;
  objAtleta = atletaId;
  $("obTitle").textContent = o ? "Editar objetivo" : "Asignar objetivo";
  $("obTitulo").value  = o?.titulo || "";
  $("obDetalle").value = o?.detalle || "";
  $("obVence").value   = o?.vence || "";
  $("obMeta").value    = o?.meta || 3;
  const cat = o?.categoria || "redes", cad = o?.cadencia || "semanal";
  document.querySelectorAll("#obCat [data-cat]").forEach(b=> b.classList.toggle("on", b.dataset.cat === cat));
  document.querySelectorAll("#obCad [data-cad]").forEach(b=> b.classList.toggle("on", b.dataset.cad === cad));
  ajustaMeta();
  $("obDel").classList.toggle("hidden", !o);
  $("obArch").classList.toggle("hidden", !o);
  $("objModal").classList.add("open");
}
document.querySelectorAll("#obCat [data-cat]").forEach(b=> b.onclick = ()=>{
  document.querySelectorAll("#obCat [data-cat]").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");
});
document.querySelectorAll("#obCad [data-cad]").forEach(b=> b.onclick = ()=>{
  document.querySelectorAll("#obCad [data-cad]").forEach(x=>x.classList.remove("on"));
  b.classList.add("on"); ajustaMeta();
});
$("obCancel").onclick = ()=> $("objModal").classList.remove("open");

$("obSave").onclick = async ()=>{
  const titulo = $("obTitulo").value.trim();
  if(!titulo){ toast("Escribe el objetivo"); return; }
  const cad = document.querySelector("#obCad [data-cad].on")?.dataset.cad || "semanal";
  const meta = cad === "unica" ? 1
    : Math.max(1, Math.min(99, Math.round(Number($("obMeta").value) || 1)));
  $("obSave").disabled = true; $("obSave").textContent = "Guardando…";
  try{
    await Nube.guardarObjetivo({
      ...(objEditando ? {id: objEditando.id} : {atleta_id: objAtleta}),
      titulo, meta, cadencia: cad,
      categoria: document.querySelector("#obCat [data-cat].on")?.dataset.cat || "otro",
      detalle: $("obDetalle").value.trim() || null,
      vence:   $("obVence").value || null
    });
    $("objModal").classList.remove("open");
    toast(objEditando ? "Objetivo actualizado" : "Objetivo asignado");
    verAtleta(objAtleta);
  }catch(e){ toast(Nube.traduce(e.message)); }
  finally{ $("obSave").disabled = false; $("obSave").textContent = "Guardar"; }
};
$("obArch").onclick = async ()=>{
  if(!objEditando) return;
  try{
    await Nube.guardarObjetivo({id: objEditando.id, archivado: true});
    $("objModal").classList.remove("open");
    toast("Objetivo archivado");
    verAtleta(objAtleta);
  }catch(e){ toast(Nube.traduce(e.message)); }
};
$("obDel").onclick = async ()=>{
  if(!objEditando) return;
  if(!confirm(`¿Eliminar "${objEditando.titulo}"? Se borra también su historial de cumplimiento.`)) return;
  try{
    await Nube.borrarObjetivo(objEditando.id);
    $("objModal").classList.remove("open");
    toast("Objetivo eliminado");
    verAtleta(objAtleta);
  }catch(e){ toast(Nube.traduce(e.message)); }
};

/* ---------------- mensajes ----------------
   El entrenador entra en la conversación del deportista, no al revés: la
   conversación se identifica siempre con el id del atleta. */
let chatMsgs = [], chatCanal = null, chatConv = null, chatNombres = {};

/* Ahora escriben varios: cada burbuja necesita decir de quién es. */
async function cargarNombres(){
  const faltan = chatMsgs.map(m=>m.autor_id).filter(id => id && !chatNombres[id]);
  if(!faltan.length) return;
  Object.assign(chatNombres, await Nube.nombresDe(faltan));
}
function firmaDe(m){
  const p = chatNombres[m.autor_id];
  if(!p) return "";
  const corto = String(p.nombre || "").trim().split(/\s+/)[0] || "Alguien";
  return `<div class="autor">${rotulo(p.rol).e} ${esc(corto)}</div>`;
}

function horaCorta(iso){
  const d = new Date(iso);
  return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}
function separadorDiaP(iso){
  const k = hoyKey(new Date(iso)), hoy = hoyKey();
  if(k === hoy) return "Hoy";
  if(k === hoyKey(new Date(Date.now()-86400000))) return "Ayer";
  return fechaLargaP(k);
}

function pintaChat(){
  const log = $("chatLog");
  if(!log) return;
  if(!chatMsgs.length){
    log.innerHTML = `<div class="empty">Sin mensajes todavía. Escríbele tú primero.</div>`;
    return;
  }
  let ultimo = "";
  log.innerHTML = chatMsgs.map(m=>{
    const dia = separadorDiaP(m.creado);
    const sep = dia !== ultimo ? `<div class="chatdia">${dia}</div>` : "";
    ultimo = dia;
    /* "Mío" aquí es el entrenador: su burbuja va a la derecha. */
    const mio = m.autor_id === perfil?.id;
    return `${sep}<div class="burb ${mio ? "mia" : ""}">
      ${mio ? "" : firmaDe(m)}
      <div class="tx">${esc(m.texto)}</div>
      <div class="hr">${horaCorta(m.creado)}</div></div>`;
  }).join("");
  log.scrollTop = log.scrollHeight;
}

async function montarChat(atletaId){
  chatConv = atletaId;
  cerrarChat();
  try{
    chatMsgs = await Nube.mensajes(atletaId);
    await cargarNombres();
  }catch(e){
    $("chatLog").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`;
    $("chatBar")?.classList.add("hidden");
    return;
  }
  pintaChat();
  Nube.marcarLeido(atletaId).catch(()=>{});

  chatCanal = Nube.escucharChat(atletaId, async m=>{
    if(chatMsgs.some(x => x.id === m.id)) return;
    chatMsgs.push(m);
    await cargarNombres();
    pintaChat();
    if(m.autor_id !== perfil?.id) Nube.marcarLeido(atletaId).catch(()=>{});
  });

  const enviar = async ()=>{
    const ta = $("chatTexto"), t = ta.value.trim();
    if(!t) return;
    $("chatSend").disabled = true;
    try{
      const m = await Nube.enviar(atletaId, t);
      if(m){ chatMsgs.push(m); pintaChat(); }
      ta.value = ""; ta.style.height = "auto";
    }catch(e){ toast(Nube.traduce(e.message)); }
    finally{ $("chatSend").disabled = false; ta.focus(); }
  };
  $("chatSend").onclick = enviar;
  $("chatTexto").oninput = e=>{
    e.target.style.height = "auto";
    e.target.style.height = Math.min(120, Math.max(40, e.target.scrollHeight)) + "px";
  };
  $("chatTexto").onkeydown = e=>{
    if(e.key === "Enter" && !e.shiftKey && !e.isComposing){ e.preventDefault(); enviar(); }
  };
}

/* Al salir de la ficha hay que soltar el canal o quedan varios escuchando. */
function cerrarChat(){
  if(chatCanal){ Nube.dejarDeEscuchar(chatCanal); chatCanal = null; }
}

/* ---------------- competencias y carga ----------------
   Las mismas reglas que usa la app del deportista, para que entrenador y
   atleta lean exactamente el mismo número. */
const PRIOS = {A:{e:"🔴", l:"Objetivo principal"}, B:{e:"🟡", l:"Preparatoria"}, C:{e:"🔵", l:"Test"}};
const FASES = [
  {d:57, l:"Base"}, {d:29, l:"Construcción"}, {d:8, l:"Específico"},
  {d:1,  l:"Puesta a punto"}, {d:0, l:"Día de competencia"}
];
const faseDe = n => (FASES.find(f=>n>=f.d) || FASES[FASES.length-1]).l;
const faltan = f => Math.round((new Date(f+"T00:00:00") - new Date(hoyKey()+"T00:00:00")) / 86400000);
function proximaComp(cfg){
  const cs = (cfg?.comps || []).filter(c=>c && c.fecha).sort((a,b)=>a.fecha.localeCompare(b.fecha));
  return cs.find(c => faltan(c.fecha) >= 0) || null;
}
const ZONAS = [
  {max:0.80, c:"#38bdf8", t:"Carga baja"},
  {max:1.30, c:"#22e07a", t:"Zona óptima"},
  {max:1.50, c:"#fbbf24", t:"Carga alta"},
  {max:99,   c:"#fb7185", t:"Riesgo de lesión"}
];
const zonaDe = r => ZONAS.find(z => r < z.max) || ZONAS[ZONAS.length-1];
/* Aguda = últimos 7 días. Crónica = media semanal de los últimos 28. */
function razonCarga(dias, vol){
  const suma = n => {
    let t = 0;
    for(let i=0;i<n;i++){
      const d = new Date(); d.setDate(d.getDate()-i);
      t += vol(dias.find(x=>x.fecha === hoyKey(d))?.datos);
    }
    return t;
  };
  const ag = suma(7), cr = suma(28)/4;
  return {ag, cr, r: cr > 0 ? ag/cr : 0};
}
function colorSueno(n){ return !n ? "#6f7887" : n >= 70 ? "#22e07a" : n >= 50 ? "#fbbf24" : "#fb7185"; }

/* ============================================================
   LISTA DE DEPORTISTAS
   ============================================================ */
async function verLista(){
  vista = {tipo:"lista", id:null};
  if(!document.querySelector(".tabla")) $("main").innerHTML = `<div class="empty">Cargando deportistas…</div>`;
  try{
    atletas = await Nube.misAtletas();
  }catch(e){ $("main").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`; return; }

  /* Mensajes sin leer, uno por deportista. Si la bandeja no está instalada
     todavía, `sinLeer` devuelve 0 y la lista se ve igual que siempre. */
  const pendientes = {};
  await Promise.all(atletas.map(async a=>{
    try{ pendientes[a.id] = await Nube.sinLeer(a.id); }catch(e){ pendientes[a.id] = 0; }
  }));

  const n = atletas.length;
  const kgTot   = atletas.reduce((a,x)=>a+Number(x.kg_30d||0),0);
  const ses     = atletas.reduce((a,x)=>a+Number(x.sesiones_30d||0),0);
  const conSue  = atletas.filter(x=>x.sueno_30d);
  const sueMed  = conSue.length ? Math.round(conSue.reduce((a,x)=>a+Number(x.sueno_30d),0)/conSue.length) : 0;
  const chat    = atletas.reduce((a,x)=>a+Number(x.chatarra_7d||0),0);
  const activos = atletas.filter(x=>{ const d=diasDesde(x.ultimo_registro); return d!==null && d<=3; }).length;

  $("main").innerHTML = `
    <section>
      <div class="stitle">Resumen del grupo · últimos 30 días</div>
      <div class="stats">
        <div class="stat"><b>${n}</b><span>Deportistas</span></div>
        <div class="stat"><b style="color:${activos===n&&n?'#22e07a':'#fbbf24'}">${activos}/${n}</b><span>Al día (3 días o menos)</span></div>
        <div class="stat"><b>${kg(kgTot)}</b><span>Kg movidos entre todos</span></div>
        <div class="stat"><b>${ses}</b><span>Sesiones de fuerza</span></div>
        <div class="stat"><b style="color:${colorSueno(sueMed)}">${sueMed||"–"}</b><span>Sueño promedio</span></div>
        <div class="stat"><b style="color:${colorChatarra(chat/Math.max(1,n))}">${chat}</b><span>Chatarra · 7 días</span></div>
        ${Object.values(pendientes).some(v=>v) ? `<div class="stat">
          <b style="color:#22e07a">${Object.values(pendientes).reduce((a,b)=>a+b,0)}</b>
          <span>Mensajes sin leer</span></div>` : ""}
      </div>
    </section>

    <section>
      <div class="stitle">Mis deportistas</div>
      <div class="panel scroll">
        ${n ? `<table class="tabla">
          <thead><tr>
            <th>Deportista</th>
            <th>Actividad</th>
            <th class="ocultar-movil">Kg · 30 d</th>
            <th class="ocultar-movil">Sesiones</th>
            <th>Sueño</th>
            <th>Chatarra 7 d</th>
          </tr></thead>
          <tbody>
            ${atletas.map(a=>{
              const d = diasDesde(a.ultimo_registro), act = estadoActividad(d);
              return `<tr data-id="${a.id}">
                <td><div class="who"><div class="ava">${esc(iniciales(a.nombre))}</div>
                  <div style="min-width:0"><b>${esc(a.nombre||a.correo)}${
                    pendientes[a.id] ? ` <span class="sinleer">${pendientes[a.id]}</span>` : ""}</b>
                  <span>${esc(a.correo||"")}</span></div></div></td>
                <td><span class="num" style="color:${act.c}">${act.t}</span>
                    <div class="sub">${a.dias_con_registro||0} días con registro</div></td>
                <td class="ocultar-movil"><span class="num">${kg(a.kg_30d)}</span> <span class="sub">kg</span></td>
                <td class="ocultar-movil"><span class="num">${a.sesiones_30d||0}</span>
                    <div class="sub">${((a.sesiones_30d||0)/30*7).toFixed(1)}/sem</div></td>
                <td><span class="num" style="color:${colorSueno(a.sueno_30d)}">${a.sueno_30d||"–"}</span></td>
                <td><span class="num" style="color:${colorChatarra(a.chatarra_7d)}">${a.chatarra_7d||0}</span></td>
              </tr>`;
            }).join("")}
          </tbody></table>`
        : `<div class="empty">Todavía no tienes deportistas.<br>Invita al primero para empezar.</div>`}
      </div>
      ${soyCoach() ? `<button class="btn" style="margin-top:12px" id="invitar">+ Invitar a alguien</button>` : ""}
    </section>`;

  document.querySelectorAll("[data-id]").forEach(tr=>tr.onclick=()=>verAtleta(tr.dataset.id));
  if(soyCoach()) $("invitar").onclick = abrirInvitar;
}

/* ============================================================
   FICHA DE UN DEPORTISTA
   ============================================================ */
async function verAtleta(id){
  const a = atletas.find(x=>x.id === id);
  const mismaFicha = vista.tipo === "ficha" && vista.id === id;
  vista = {tipo:"ficha", id};
  if(!mismaFicha) $("main").innerHTML = `<div class="empty">Cargando ficha…</div>`;
  let dias = [], cfg = null;
  try{
    const desde = new Date(); desde.setDate(desde.getDate()-45);
    dias = await Nube.diasDe(id, hoyKey(desde));
  }catch(e){ $("main").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`; return; }
  /* El calendario vive en la config, no en los días. Si falla, la ficha
     igual se muestra: es información añadida, no imprescindible. */
  try{ cfg = await Nube.configDe(id); }catch(e){ cfg = null; }
  /* Si `salud.sql` no se ha ejecutado todavía, la tabla no existe y la ficha
     igual tiene que abrirse: los documentos son un extra. */
  let documentos = [], docsError = "";
  try{ documentos = await Nube.docs(id); }
  catch(e){ docsError = Nube.traduce(e.message); }

  let miEquipo = [], staffTodos = [], equipoError = "";
  try{
    miEquipo = await Nube.equipoDe(id);
    if(soyCoach()) staffTodos = await Nube.staffDisponible();
  }catch(e){ equipoError = Nube.traduce(e.message); }

  let objs = [], objHechos = [], objError = "";
  try{
    [objs, objHechos] = await Promise.all([Nube.objetivos(id), Nube.hechos(id, inicioMesP())]);
  }catch(e){ objError = Nube.traduce(e.message); }

  const vol = d => Number(d?.workout?.volume || 0);
  const mn  = v => (v && typeof v === "object") ? (Number(v.min)||0) : (Number(v)||0);
  const km2 = v => (v && typeof v === "object") ? (Number(v.km)||0)  : 0;
  const act = d => Object.values(d?.actividad?.items || {}).reduce((a,v)=>a+mn(v), 0);
  const actKm = d => Object.values(d?.actividad?.items || {}).reduce((a,v)=>a+km2(v), 0);
  const junk = d => (d?.food?.junk||[]).reduce((s,j)=>s+(j.n||1),0);
  const sesiones = dias.filter(r=>vol(r.datos)>0);
  const kgTot = dias.reduce((s,r)=>s+vol(r.datos),0);
  const sue = dias.filter(r=>r.datos?.sleep).map(r=>r.datos.sleep);
  const sueMed = sue.length ? Math.round(sue.reduce((s,x)=>s+x.score,0)/sue.length) : 0;
  const hMed = sue.length ? (sue.reduce((s,x)=>s+x.hours,0)/sue.length).toFixed(1) : 0;
  const chat = dias.reduce((s,r)=>s+junk(r.datos),0);
  const maxVol = Math.max(1, ...dias.map(r=>vol(r.datos)));

  const comp = proximaComp(cfg);
  const med = medicionesDe(dias);
  const salud = cfg?.salud || {};
  const fMed = fichaHTML(salud, FICHA_MED), fNut = fichaHTML(salud, FICHA_NUT);
  const flags = banderasHTML(salud);
  const carga = razonCarga(dias, vol);
  const zc = zonaDe(carga.r);

  const ult14 = [];
  for(let i=13;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const f = hoyKey(d);
    ult14.push({f, r: dias.find(x=>x.fecha===f)});
  }

  $("main").innerHTML = `
    <a class="volver" id="volver">‹ Todos los deportistas</a>
    <div class="hero" style="margin-top:6px">
      <div class="ava" style="width:64px;height:64px;border-radius:18px;font-size:22px">${esc(iniciales(a?.nombre))}</div>
      <div class="hero-info">
        <h2>${esc(a?.nombre || "Deportista")}</h2>
        <p>${esc(a?.correo||"")}</p>
        <div class="chips">
          <span class="chip">Último registro: ${fechaCorta(a?.ultimo_registro)}</span>
          <span class="chip">${dias.length} días registrados en 45</span>
        </div>
      </div>
    </div>

    ${comp ? `<section>
      <div class="stitle">Próxima competencia</div>
      <div class="panel" style="display:flex;align-items:center;gap:15px">
        <div style="width:70px;flex:none;text-align:center">
          <b style="display:block;font-size:30px;font-weight:800;letter-spacing:-.05em;line-height:1">${
            faltan(comp.fecha) === 0 ? "¡Hoy!" : faltan(comp.fecha)}</b>
          <span style="font-size:10px;color:#6f7887;text-transform:uppercase;letter-spacing:.07em">${
            faltan(comp.fecha) === 0 ? "es el día" : faltan(comp.fecha) === 1 ? "día" : "días"}</span>
        </div>
        <div style="min-width:0">
          <b style="display:block;font-size:16px">${(PRIOS[comp.prio]||PRIOS.B).e} ${esc(comp.nombre)}</b>
          <span style="display:block;font-size:12.5px;color:#a7b2c2;margin-top:2px">${
            fechaCorta(comp.fecha)}${comp.lugar ? " · "+esc(comp.lugar) : ""}${
            comp.deporte ? " · "+esc(comp.deporte) : ""}</span>
          <span style="display:block;font-size:12.5px;color:#6f7887;margin-top:4px">${
            faseDe(faltan(comp.fecha))}${comp.objetivo ? " · objetivo: "+esc(comp.objetivo) : ""}</span>
        </div>
      </div>
    </section>` : ""}

    ${flags}

    <section>
      <div class="stitle">Equipo de trabajo</div>
      <div class="panel">${
        equipoError ? `<div class="empty">${esc(equipoError)}</div>`
        : !miEquipo.length ? `<div class="empty">Nadie asignado todavía.</div>`
        : miEquipo.map(m=>`<div class="hrow">
            <div class="m">${rotulo(m.rol).e}</div>
            <div class="t"><b>${esc(m.nombre || m.correo)}</b>
              <span>${rotulo(m.rol).l}${m.id === perfil?.id ? " · eres tú" : ""}</span></div>
            ${soyCoach() && m.id !== perfil?.id
              ? `<button class="mini" data-quitar-staff="${m.id}" style="color:#fb7185">Quitar</button>` : ""}
          </div>`).join("")}
        ${soyCoach() && !equipoError ? (()=>{
          const libres = staffTodos.filter(x => !miEquipo.some(m => m.id === x.id));
          return libres.length
            ? `<div style="display:flex;gap:8px;margin-top:12px">
                 <select class="inp" id="staffSel" style="flex:1">
                   ${libres.map(x=>`<option value="${x.id}">${rotulo(x.rol).e} ${
                     esc(x.nombre || x.correo)} · ${rotulo(x.rol).l}</option>`).join("")}
                 </select>
                 <button class="mini" id="addStaff">Añadir</button>
               </div>`
            : `<p style="font-size:12px;color:#6f7887;margin:12px 0 0">
                 Todos los profesionales del sistema ya están en este equipo.
                 Invita a más desde la lista de deportistas.</p>`;
        })() : ""}
      </div>
    </section>

    <section>
      <div class="stitle">Mensajes</div>
      <div class="chatwrap">
        <div class="chatlog" id="chatLog"><div class="empty">Cargando mensajes…</div></div>
        <div class="chatbar" id="chatBar">
          <textarea id="chatTexto" rows="1" placeholder="Escríbele a ${esc(a?.nombre?.split(" ")[0] || "tu deportista")}…"></textarea>
          <button id="chatSend" title="Enviar">➤</button>
        </div>
      </div>
    </section>

    <section>
      <div class="stitle">Objetivos Fractale</div>
      ${objError ? `<div class="panel"><div class="empty">${esc(objError)}</div></div>`
                 : objetivosHTML(objs, objHechos)}
      ${objError || !soyCoach() ? "" : `<button class="mini" style="margin-top:12px" id="addObj">+ Asignar objetivo</button>`}
    </section>

    ${med.ultima ? `<section>
      <div class="stitle">Composición corporal</div>
      <div class="stats">
        <div class="stat"><b style="color:#2dd4bf">${un1(med.ultima.peso)}</b><span>Peso (kg) · ${fechaCorta(med.ultima.fecha)}</span></div>
        <div class="stat"><b style="color:${deltaTxt(med.ultima.peso, med.antes?.peso, null).c}">${
          deltaTxt(med.ultima.peso, med.antes?.peso, null).t}</b><span>Peso vs 30 d</span></div>
        ${Number(med.ultima.grasa) ? `<div class="stat"><b>${un1(med.ultima.grasa)}%</b><span>Grasa · ${
          un1(med.ultima.peso*med.ultima.grasa/100)} kg</span></div>
        <div class="stat"><b style="color:${deltaTxt(Number(med.ultima.grasa), Number(med.antes?.grasa), false).c}">${
          deltaTxt(Number(med.ultima.grasa), Number(med.antes?.grasa), false).t}</b><span>Grasa vs 30 d</span></div>` : ""}
        ${Number(med.ultima.musculo) ? `<div class="stat"><b>${un1(med.ultima.musculo)}%</b><span>Músculo · ${
          un1(med.ultima.peso*med.ultima.musculo/100)} kg</span></div>
        <div class="stat"><b style="color:${deltaTxt(Number(med.ultima.musculo), Number(med.antes?.musculo), true).c}">${
          deltaTxt(Number(med.ultima.musculo), Number(med.antes?.musculo), true).t}</b><span>Músculo vs 30 d</span></div>` : ""}
      </div>
      ${med.ultima.nota ? `<p style="font-size:12.5px;color:#6f7887;margin:10px 0 0">${esc(med.ultima.nota)}</p>` : ""}
    </section>` : ""}

    ${fMed ? `<section><div class="stitle">Ficha médica</div>${fMed}</section>` : ""}
    ${fNut ? `<section><div class="stitle">Ficha nutricional</div>${fNut}</section>` : ""}

    <section>
      <div class="stitle">Documentos</div>
      <div class="panel">${
        docsError ? `<div class="empty">${esc(docsError)}</div>`
        : !documentos.length ? `<div class="empty">Sin documentos cargados.</div>`
        : documentos.map(d=>{
            const t = TIPOS_DOC[d.tipo] || TIPOS_DOC.otro;
            const quien = d.autor
              ? (d.autor.id === perfil?.id ? "lo subiste tú"
                 : `${rotulo(d.autor.rol).e} ${esc(String(d.autor.nombre||"").split(" ")[0])}`)
              : "lo subió el deportista";
            return `<div class="hrow">
              <div class="m">${t.e}</div>
              <div class="t"><b>${esc(d.titulo)}</b>
                <span>${t.l} · ${fechaCorta(d.fecha)}${d.tam ? " · "+pesoArchivo(d.tam) : ""} · ${quien}</span></div>
              <button class="mini" data-doc="${esc(d.ruta)}">Abrir</button>
              ${d.autor?.id === perfil?.id
                ? `<button class="mini" data-borrar-doc="${d.id}" style="color:#fb7185">✕</button>` : ""}
            </div>${d.notas ? `<p style="font-size:12px;color:#6f7887;margin:0 0 10px 45px">${esc(d.notas)}</p>` : ""}`;
          }).join("")}</div>
      ${docsError ? "" : `<button class="mini" style="margin-top:12px" id="addDoc">+ Subir documento</button>`}
    </section>

    <section>
      <div class="stitle">Cargas · últimos 45 días</div>
      <div class="stats">
        <div class="stat"><b>${kg(kgTot)}</b><span>Kg totales</span></div>
        <div class="stat"><b>${sesiones.length}</b><span>Sesiones</span></div>
        <div class="stat"><b>${sesiones.length?kg(kgTot/sesiones.length):0}</b><span>Kg por sesión</span></div>
        <div class="stat"><b style="color:${colorSueno(sueMed)}">${sueMed||"–"}</b><span>Sueño · ${hMed||"–"} h</span></div>
        <div class="stat"><b style="color:#fb923c">${dias.reduce((s,r)=>s+act(r.datos),0)}</b><span>Min de actividad</span></div>
        <div class="stat"><b style="color:#fb923c">${Math.round(dias.reduce((s,r)=>s+actKm(r.datos),0)*10)/10}</b><span>Km recorridos</span></div>
        <div class="stat"><b style="color:${colorChatarra(chat/6)}">${chat}</b><span>Chatarra total</span></div>
        <div class="stat"><b style="color:${zc.c}">${carga.cr ? carga.r.toFixed(2) : "–"}</b><span>${
          carga.cr ? zc.t : "Sin carga registrada"}</span></div>
      </div>
      <div class="panel" style="margin-top:12px">
        <div class="chart">
          ${ult14.map(x=>{
            const v = vol(x.r?.datos), alt = v ? Math.max(4, v/maxVol*100) : 3;
            return `<div class="cb" title="${x.f}${v?` · ${kg(v)} kg`:""}">
              <div class="cbar ${v?"":"empty"}" style="height:${alt}%"></div>
              <div class="cbl">${Number(x.f.slice(8))}</div></div>`;
          }).join("")}
        </div>
        <div class="hlbl"><span>Volumen por día · últimos 14 días</span></div>
      </div>
    </section>

    <section>
      <div class="stitle">Registro día a día</div>
      ${dias.length ? dias.map(r=>{
        const d = r.datos||{}, v = vol(d), j = junk(d), s = d.sleep;
        const ejercicios = (d.workout?.ex||[]).filter(e=>(e.sets||[]).some(x=>Number(x.w)&&Number(x.r)));
        const acts = Object.entries(d.actividad?.items||{}).filter(([,v])=>mn(v)>0||km2(v)>0);
        const grupos = (d.food?.groups||[]).length;
        if(!v && !j && !s && !ejercicios.length && !grupos && !d.note && !acts.length) return "";
        return `<div class="dcard">
          <div class="dhead">
            <b>${fechaCorta(r.fecha)}</b>
            ${s ? `<span class="pill" style="color:${colorSueno(s.score)}">😴 ${s.score} · ${s.hours} h</span>` : ""}
            ${grupos ? `<span class="pill">🥗 ${grupos} grupos</span>` : ""}
            ${j ? `<span class="pill" style="color:${colorChatarra(j)}">🍔 ${j}</span>` : ""}
            ${act(d) ? `<span class="pill" style="color:#fb923c">🏃 ${act(d)} min${actKm(d)?` · ${actKm(d)} km`:""}</span>` : ""}
            ${v ? `<span class="pill" style="color:#4ade80">🏋️ ${kg(v)} kg</span>` : ""}
          </div>
          ${ejercicios.map(e=>`<div class="ex"><b>${esc(e.name||"Ejercicio")}</b> · ${
            (e.sets||[]).filter(x=>Number(x.w)&&Number(x.r))
              .map(x=>`${x.w}×${x.r}`).join("  ·  ")}</div>`).join("")}
          ${acts.length ? `<div class="ex">${acts.map(([k,v])=>
              `${esc(k)} <b>${mn(v)}′</b>${km2(v)?` · <b>${km2(v)} km</b>`:""}`).join(" · ")}</div>` : ""}
          ${d.workout?.note ? `<div class="ex" style="color:var(--tx3);font-style:italic">“${esc(d.workout.note)}”</div>` : ""}
          ${d.note ? `<div class="ex" style="color:var(--tx3)">📝 ${esc(d.note)}</div>` : ""}
        </div>`;
      }).join("") : `<div class="empty">Sin registros todavía.</div>`}
    </section>`;

  $("volver").onclick = ()=>{ cerrarChat(); verLista(); };
  montarChat(id);

  if(soyCoach()){
    $("addStaff")?.addEventListener("click", async ()=>{
      const sid = $("staffSel").value;
      try{ await Nube.asignar(id, sid); toast("Añadido al equipo"); verAtleta(id); }
      catch(e){ toast(Nube.traduce(e.message)); }
    });
    document.querySelectorAll("[data-quitar-staff]").forEach(b=> b.onclick = async ()=>{
      const m = miEquipo.find(x => x.id === b.dataset.quitarStaff);
      if(!confirm(`¿Quitar a ${m?.nombre || "esta persona"} del equipo? Dejará de ver este panel.`)) return;
      try{ await Nube.quitarDelEquipo(id, b.dataset.quitarStaff); toast("Quitado del equipo"); verAtleta(id); }
      catch(e){ toast(Nube.traduce(e.message)); }
    });
    $("addObj")?.addEventListener("click", ()=> openObjetivo(null, id));
    document.querySelectorAll("[data-obj]").forEach(b=>
      b.onclick = ()=> openObjetivo(objs.find(o => o.id === b.dataset.obj), id));
  }

  $("addDoc")?.addEventListener("click", ()=>{
    docPara = {id, nombre: a?.nombre || "el deportista"};
    $("docFile").click();
  });
  document.querySelectorAll("[data-borrar-doc]").forEach(b=> b.onclick = async ()=>{
    const d = documentos.find(x => x.id === b.dataset.borrarDoc);
    if(!confirm(`¿Eliminar "${d.titulo}"? Dejará de verlo el deportista y el equipo.`)) return;
    try{ await Nube.borrarDoc(d); toast("Documento eliminado"); verAtleta(id); }
    catch(e){ toast(Nube.traduce(e.message)); }
  });

  /* Los archivos son privados: cada apertura pide un enlace firmado que caduca. */
  document.querySelectorAll("[data-doc]").forEach(b=> b.onclick = async ()=>{
    b.disabled = true; b.textContent = "…";
    try{ window.open(await Nube.urlDoc(b.dataset.doc), "_blank", "noopener"); }
    catch(e){ toast(Nube.traduce(e.message)); }
    finally{ b.disabled = false; b.textContent = "Abrir"; }
  });
  if(!mismaFicha) window.scrollTo({top:0});
}

/* ============================================================
   SUBIR DOCUMENTOS
   El equipo sube informes y pautas a la ficha de su deportista.
   ============================================================ */
let docPara = null, docArchivo = null;

$("docFile").onchange = e=>{
  const f = e.target.files?.[0];
  e.target.value = "";
  if(!f || !docPara) return;
  if(f.size > 15*1024*1024){ toast("El archivo pesa más de 15 MB"); return; }
  docArchivo = f;
  $("dcPara").textContent = `Se añade a la ficha de ${docPara.nombre}. PDF o imagen, hasta 15 MB.`;
  $("dcArchivo").innerHTML = `<div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:22px">${f.type.includes("pdf") ? "📄" : "🖼"}</div>
      <div style="min-width:0"><b style="display:block;font-size:13.5px;word-break:break-all">${esc(f.name)}</b>
        <span style="font-size:12px;color:#6f7887">${pesoArchivo(f.size)}</span></div>
    </div>`;
  $("dcTitulo").value = f.name.replace(/\.[^.]+$/, "").slice(0, 80);
  $("dcFecha").value  = hoyKey();
  $("dcNotas").value  = "";
  /* Por defecto, el tipo de tu especialidad. */
  const porDefecto = perfil?.rol === "nutricionista" ? "nutricional"
                   : perfil?.rol === "medico" ? "medico" : "otro";
  document.querySelectorAll("#dcTipo [data-tp]").forEach(b=>
    b.classList.toggle("on", b.dataset.tp === porDefecto));
  $("docModal").classList.add("open");
};
document.querySelectorAll("#dcTipo [data-tp]").forEach(b=> b.onclick = ()=>{
  document.querySelectorAll("#dcTipo [data-tp]").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");
});
$("dcCancel").onclick = ()=>{ docArchivo = null; $("docModal").classList.remove("open"); };
$("dcSave").onclick = async ()=>{
  const titulo = $("dcTitulo").value.trim();
  if(!docArchivo){ toast("Elige un archivo"); return; }
  if(!titulo){ toast("Ponle un título al documento"); return; }
  $("dcSave").disabled = true; $("dcSave").textContent = "Subiendo…";
  try{
    await Nube.subirDoc(docArchivo, {
      titulo,
      tipo:  document.querySelector("#dcTipo [data-tp].on")?.dataset.tp || "otro",
      fecha: $("dcFecha").value || hoyKey(),
      notas: $("dcNotas").value.trim(),
      atletaId: docPara.id
    });
    docArchivo = null;
    $("docModal").classList.remove("open");
    toast("Documento subido");
    verAtleta(docPara.id);
  }catch(e){ toast(Nube.traduce(e.message)); }
  finally{ $("dcSave").disabled = false; $("dcSave").textContent = "Subir"; }
};

/* ============================================================
   INVITACIONES
   ============================================================ */
async function abrirInvitar(){
  document.querySelectorAll("#invRol [data-rol]").forEach(b=>
    b.classList.toggle("on", b.dataset.rol === "atleta"));
  $("invModal").classList.add("open");
  await pintarInvitaciones();
}
async function pintarInvitaciones(){
  try{ invs = await Nube.invitaciones(); }catch(e){ invs = []; }
  $("invList").innerHTML = invs.length
    ? `<div class="stitle">Nombres reservados</div>` + invs.map(i=>`
        <div class="hrow">
          <div class="m">${i.usada ? "✅" : "⏳"}</div>
          <div class="t"><b>${esc(i.nombre||i.correo)}</b>
            <span>${esc(i.correo)} · ${rotulo(i.rol).e} ${rotulo(i.rol).l.toLowerCase()} · ${
              i.usada ? "ya entró" : "pendiente"}</span></div>
          <button class="mini" data-quitar="${esc(i.correo)}">Quitar</button>
        </div>`).join("")
    : `<div class="empty" style="padding:18px">Sin nombres reservados.</div>`;
  document.querySelectorAll("[data-quitar]").forEach(b=>b.onclick=async ()=>{
    if(!confirm(`¿Quitar la invitación de ${b.dataset.quitar}?`)) return;
    try{ await Nube.quitarInvitacion(b.dataset.quitar); toast("Invitación quitada"); pintarInvitaciones(); }
    catch(e){ toast(Nube.traduce(e.message)); }
  });
}
document.querySelectorAll("#invRol [data-rol]").forEach(b=> b.onclick = ()=>{
  document.querySelectorAll("#invRol [data-rol]").forEach(x=>x.classList.remove("on"));
  b.classList.add("on");
});
$("invSave").onclick = async ()=>{
  const c = $("invMail").value.trim(), n = $("invName").value.trim();
  const rol = document.querySelector("#invRol [data-rol].on")?.dataset.rol || "atleta";
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)){ toast("Escribe un correo válido"); return; }
  try{
    await Nube.invitar(c, n, rol);
    $("invMail").value = ""; $("invName").value = "";
    toast(rol === "atleta"
      ? "Nombre reservado para ese correo."
      : `Al registrarse entrará como ${rotulo(rol).l.toLowerCase()}.`);
    await pintarInvitaciones();
  }catch(e){ toast(Nube.traduce(e.message)); }
};
document.getElementById("copiarEnlace").onclick = async ()=>{
  const t = document.getElementById("enlaceReg").textContent.trim();
  try{ await navigator.clipboard.writeText(t); toast("Enlace copiado"); }
  catch(e){ toast("Selecciona y copia el enlace de arriba"); }
};
$("invClose").onclick = ()=>{ $("invModal").classList.remove("open"); verLista(); };
$("invModal").onclick = e=>{ if(e.target.id==="invModal"){ $("invModal").classList.remove("open"); verLista(); } };

/* ============================================================
   CAMBIOS EN VIVO
   La base avisa al panel en cuanto un deportista guarda algo.
   ============================================================ */
function pintarVivo(on){
  enVivo = on;
  const p = $("vivo");
  if(!p) return;
  p.classList.toggle("on", on);
  $("vivoTxt").textContent = on ? "en vivo" : "sin conexión";
}

function conectarEnVivo(){
  canal = Nube.escuchar(
    uid => { clearTimeout(refrescoTimer); refrescoTimer = setTimeout(()=>refrescar(uid), 1200); },
    estado => pintarVivo(estado === "SUBSCRIBED")
  );
}

async function refrescar(uid){
  if(vista.tipo === "lista"){
    const antes = JSON.stringify(atletas.find(a=>a.id===uid) || null);
    await verLista();
    const fila = document.querySelector(`[data-id="${uid}"]`);
    if(fila && antes !== JSON.stringify(atletas.find(a=>a.id===uid) || null)){
      fila.classList.add("cambio");
      setTimeout(()=>fila.classList.remove("cambio"), 2200);
    }
  }else if(vista.tipo === "ficha" && vista.id === uid){
    const y = window.scrollY;
    await verAtleta(uid);
    window.scrollTo({top:y});
    toast("Actualizado recién");
  }
}

/* ============================================================
   ACCESO Y ARRANQUE
   ============================================================ */
function mostrarLogin(v){ $("login").classList.toggle("hidden", !v); }

$("go").onclick = async ()=>{
  const c = $("mail").value.trim(), p = $("pass").value;
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)){ toast("Escribe un correo válido"); return; }
  if(!p){ toast("Escribe tu contraseña"); return; }
  $("go").disabled = true; $("go").textContent = "Entrando…";
  try{ await Nube.entrar(c, p); location.reload(); }
  catch(e){ toast(e.message); }
  finally{ $("go").disabled = false; $("go").textContent = "Entrar"; }
};
["mail","pass"].forEach(i=>$(i).addEventListener("keydown", e=>{ if(e.key==="Enter") $("go").click(); }));

$("themeBtn").onclick = ()=>{
  const d = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = d ? "light" : "dark";
  $("themeBtn").textContent = d ? "🌙" : "☀️";
  try{ const w = JSON.parse(localStorage.getItem("wellness.v1")||"{}"); w.theme = d?"light":"dark";
       localStorage.setItem("wellness.v1", JSON.stringify(w)); }catch(e){}
};

(async function init(){
  try{ const w = JSON.parse(localStorage.getItem("wellness.v1")||"{}");
       if(w.theme) document.documentElement.dataset.theme = w.theme; }catch(e){}

  if(!Nube.activa()){
    $("main").innerHTML = `<div class="empty">
      El panel todavía no está conectado a la base de datos.<br>
      Falta completar <b>config.js</b> con los datos de Supabase.</div>`;
    return;
  }
  const s = await Nube.sesion();
  if(!s){ mostrarLogin(true); $("cargando").remove(); return; }
  mostrarLogin(false);

  try{ perfil = await Nube.miPerfil(); }
  catch(e){ $("main").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`; return; }

  if(!perfil || !Nube.ROLES_STAFF.includes(perfil.rol)){
    $("main").innerHTML = `<div class="empty">
      Este panel es para el equipo de trabajo.<br><br>
      <a class="btn" style="display:inline-block;text-decoration:none;width:auto;padding:12px 20px"
         href="app.html">Ir a mi registro</a></div>`;
    return;
  }
  await verLista();
  conectarEnVivo();
  Nube.alCambiarSesion(s=>{ if(!s) location.reload(); });
  addEventListener("beforeunload", ()=>Nube.dejarDeEscuchar(canal));
})();
