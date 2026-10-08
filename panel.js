/* ============================================================
   Mi App · panel del entrenador
   Solo lectura: aquí no se modifica el registro de nadie.
   ============================================================ */
"use strict";

let perfil = null, atletas = [], invs = [];
let canal = null, vista = {tipo:"lista", id:null}, refrescoTimer = null, enVivo = false;
let vistaPrevia = "lista";
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
    ["nacimiento","Fecha de nacimiento","date"], ["rut","RUT"], ["grupo","Grupo sanguíneo"],
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
const REL_P = {
  padre:{l:"Padre", e:"👨"}, madre:{l:"Madre", e:"👩"},
  pareja:{l:"Esposa o pareja", e:"💞"}, hijo:{l:"Hijo o hija", e:"🧒"},
  hermano:{l:"Hermano o hermana", e:"🧑"}, otro:{l:"Familiar", e:"👤"}
};
const relDeP = r => REL_P[r] || REL_P.otro;
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
/* Hasta dónde ha leído el deportista: {user_id: fechaISO}. */
let chatLecturas = {}, chatLatido = null;

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

/* ¿Ya lo leyó el deportista? Solo en el último mensaje propio: es lo que
   uno quiere saber después de escribir una indicación. */
function acuseDeP(m){
  const t = new Date(m.creado).getTime();
  const leyo = Object.values(chatLecturas).some(iso => new Date(iso).getTime() >= t);
  return leyo ? ` · <span class="acuse leido">✓✓ Leído</span>`
              : ` · <span class="acuse">Enviado</span>`;
}

async function refrescarLecturasP(){
  if(!chatConv) return;
  try{
    const antes = JSON.stringify(chatLecturas);
    chatLecturas = await Nube.lecturasDe(chatConv);
    if(JSON.stringify(chatLecturas) !== antes) pintaChat();
  }catch(e){}
}

function pintaChat(){
  const log = $("chatLog");
  if(!log) return;
  if(!chatMsgs.length){
    log.innerHTML = `<div class="empty">Sin mensajes todavía. Escríbele tú primero.</div>`;
    return;
  }
  const mios = chatMsgs.filter(m => m.autor_id === perfil?.id);
  const ultimoMio = mios.length ? mios[mios.length-1].id : null;
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
      <div class="hr">${horaCorta(m.creado)}${
        mio && m.id === ultimoMio ? acuseDeP(m) : ""}</div></div>`;
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
  refrescarLecturasP();
  chatLatido = setInterval(refrescarLecturasP, 30000);

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
  clearInterval(chatLatido); chatLatido = null;
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
   MÓDULOS DE LA APP
   Entrenamiento y nutrición están archivados mientras no se usen. Se
   enciende desde aquí y aparece en la app de todos los deportistas.
   ============================================================ */
let MODULOS = {entrenamiento:false, nutricion:false};
const modOn = k => !!MODULOS[k];

async function cargarModulos(){
  try{ MODULOS = Object.assign({entrenamiento:false, nutricion:false}, await Nube.modulos()); }
  catch(e){}
}

/* ============================================================
   RESUMEN DEL ATLETA
   Lo primero que se ve al abrir una ficha: un veredicto, cuatro cifras
   y dos gráficos. Si algo está mal tiene que saltar sin leer la tabla.
   ============================================================ */
/* Una serie de n días hasta hoy, con los huecos incluidos: un día sin
   registrar no es un cero, es un hueco, y en el gráfico se ve distinto. */
function serieDias(dias, n, valor){
  const out = [];
  for(let i = n-1; i >= 0; i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const f = hoyKey(d), r = dias.find(x => x.fecha === f);
    out.push({f, v: r ? valor(r.datos) : null});
  }
  return out;
}

/* Barras + línea sobre el mismo eje de días. Las barras son la carga del
   día; la línea, el sueño. Se dibuja a mano porque una librería para dos
   gráficos no se paga. */
function graficoMixto(barras, linea, opc = {}){
  const W = 320, H = 108, B = 18, T = 6;
  const n = barras.length, paso = W / n, ancho = Math.max(3, paso - 4);
  const maxB = Math.max(1, ...barras.map(x => Number(x.v) || 0));
  const altoB = v => H - B - (v / maxB) * (H - B - T);
  const altoL = v => H - B - (Math.min(100, v) / 100) * (H - B - T);

  const rects = barras.map((x, i) => {
    const v = Number(x.v) || 0;
    const y = v ? altoB(v) : H - B - 2;
    return `<rect x="${(i*paso + (paso-ancho)/2).toFixed(1)}" y="${y.toFixed(1)}"
      width="${ancho.toFixed(1)}" height="${(H - B - y).toFixed(1)}" rx="2"
      fill="${v ? (opc.colorBarra || "#22e07a") : "var(--line)"}" ${v ? "" : 'opacity=".6"'}></rect>`;
  }).join("");

  /* La línea se corta en los días sin dato: inventar continuidad sería mentir. */
  const col = opc.colorLinea || "#a5b4fc";
  const tramos = [];
  let actual = [];
  linea.forEach((x, i) => {
    if(x.v == null || !Number(x.v)){ if(actual.length) tramos.push(actual); actual = []; return; }
    actual.push([i*paso + paso/2, altoL(Number(x.v))]);
  });
  if(actual.length) tramos.push(actual);
  const path = tramos.map(t => t.length === 1
    ? `<rect x="${(t[0][0]-2).toFixed(1)}" y="${(t[0][1]-2).toFixed(1)}" width="4" height="4"
         rx="1.5" fill="${col}"></rect>`
    : `<polyline points="${t.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" ")}" fill="none"
         stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         vector-effect="non-scaling-stroke"></polyline>`).join("");

  return `<svg viewBox="0 0 ${W} ${H-B}" width="100%" height="${H-B}" preserveAspectRatio="none"
            role="img" aria-label="${esc2(opc.alt || "Gráfico")}">
    <line x1="0" y1="${H-B-0.5}" x2="${W}" y2="${H-B-0.5}" stroke="var(--line)" stroke-width="1"
      vector-effect="non-scaling-stroke"></line>
    ${rects}${path}</svg>
    <div class="gdias">${barras.map(x=>`<span>${
      (barras.length <= 14 || Number(x.f.slice(8)) % 3 === 0) ? Number(x.f.slice(8)) : ""}</span>`).join("")}</div>`;
}
const esc2 = s => String(s??"").replace(/"/g,"&quot;");

/* Un gráfico de línea solo, para el peso: pocos puntos y muy juntos. */
function graficoLinea(puntos, color){
  const W = 320, H = 92, B = 16, T = 8, L = 2;
  if(puntos.length < 2) return `<div class="empty">Con dos mediciones o más aparece la curva.</div>`;
  const vs = puntos.map(p => p.v);
  const lo = Math.min(...vs), hi = Math.max(...vs), rango = (hi - lo) || 1;
  const paso = (W - L*2) / (puntos.length - 1);
  const pts = puntos.map((p, i) =>
    [L + i*paso, H - B - ((p.v - lo)/rango) * (H - B - T)]);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none"
            role="img" aria-label="Evolución del peso">
    <polyline points="${pts.map(q=>q[0].toFixed(1)+","+q[1].toFixed(1)).join(" ")}" fill="none"
      stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      vector-effect="non-scaling-stroke"></polyline>
    ${pts.map(q=>`<rect x="${(q[0]-2).toFixed(1)}" y="${(q[1]-2).toFixed(1)}" width="4" height="4"
      rx="1.5" fill="${color}"></rect>`).join("")}
  </svg>
  <div class="gdias"><span style="text-align:left">${fechaCorta(puntos[0].f)} · ${un1(puntos[0].v)} kg</span>
    <span style="text-align:right">${fechaCorta(puntos[puntos.length-1].f)} · ${
      un1(puntos[puntos.length-1].v)} kg · entre ${un1(lo)} y ${un1(hi)}</span></div>`;
}

/* Qué hay que mirar hoy, en orden de urgencia. Es la parte que hace que el
   resumen sirva: las cifras solas no dicen qué hacer. */
function avisosEstado(d){
  const a = [];
  if(d.constancia < 40)
    a.push({t:"alta", txt:`Solo registra ${d.diasConDato} de los últimos 14 días. Las cifras de abajo valen poco con tan pocos datos.`});
  else if(d.constancia < 70)
    a.push({t:"media", txt:`Registra ${d.diasConDato} de 14 días: hay huecos.`});
  if(d.sueMed && d.sueMed < 50)
    a.push({t:"alta", txt:`Sueño bajo: ${d.sueMed} de 100 en promedio, ${d.hMed} h por noche.`});
  else if(d.sueMed && d.sueMed < 70)
    a.push({t:"media", txt:`Sueño justo: ${d.sueMed} de 100, ${d.hMed} h por noche.`});
  if(d.ent && d.carga.cr){
    if(d.carga.r >= 1.5)
      a.push({t:"alta", txt:`La carga de esta semana es ${d.carga.r.toFixed(2)} veces su media. Zona de riesgo de lesión.`});
    else if(d.carga.r >= 1.3)
      a.push({t:"media", txt:`La carga subió rápido (${d.carga.r.toFixed(2)} veces su media).`});
    else if(d.carga.r < 0.8)
      a.push({t:"info", txt:`Carga por debajo de lo habitual (${d.carga.r.toFixed(2)}): descanso o desentrenamiento.`});
  }
  if(d.diasSinEntrar !== null && d.diasSinEntrar > 7)
    a.push({t:"alta", txt:`No registra nada desde hace ${d.diasSinEntrar} días.`});
  if(d.med.ultima){
    const dd = diasDesde(d.med.ultima.fecha);
    if(dd > 45) a.push({t:"info", txt:`El peso no se mide desde hace ${dd} días.`});
  }else{
    a.push({t:"info", txt:"Sin ninguna medición de peso registrada."});
  }
  if(d.animo && d.animo < 2.5)
    a.push({t:"media", txt:`Ánimo bajo: ${d.animo.toFixed(1)} de 5 en las últimas dos semanas.`});
  if(d.banderas) a.push({t:"alta", txt:`${d.banderas} ${d.banderas===1?"alerta":"alertas"} en la ficha médica, más abajo.`});
  return a;
}

const ORDEN_AVISO = {alta:0, media:1, info:2};
const COLOR_AVISO = {alta:"#fb7185", media:"#fbbf24", info:"#38bdf8"};

function resumenHTML(d){
  const avisos = avisosEstado(d).sort((x,y)=>ORDEN_AVISO[x.t]-ORDEN_AVISO[y.t]);
  const peor = avisos.length ? avisos[0].t : null;
  const vd = peor === "alta"  ? {c:"#fb7185", e:"⚠️", t:"Requiere atención"}
           : peor === "media" ? {c:"#fbbf24", e:"👀", t:"Hay que mirarlo"}
           : peor === "info"  ? {c:"#38bdf8", e:"ℹ️", t:"En orden, con detalles"}
           :                    {c:"#22e07a", e:"✓",  t:"Todo en orden"};

  /* Las barras son lo que cargó cada día: kilos si se usa el entrenamiento
     de fuerza, minutos de actividad si no. */
  const unidad = d.ent ? "kg" : "min";
  return `
    <section>
      <div class="stitle">Estado actual</div>
      <div class="panel">
        <div class="vd" style="--c:${vd.c}">
          <div class="vd-e">${vd.e}</div>
          <div class="vd-t"><b>${vd.t}</b>
            <span>Lectura automática de los últimos 14 días</span></div>
        </div>
        <div class="stats" style="margin:14px 0 0">
          <div class="stat"><b style="color:${d.constancia>=70?'#22e07a':d.constancia>=40?'#fbbf24':'#fb7185'}">${
            d.diasConDato}/14</b><span>Días con registro</span></div>
          <div class="stat"><b style="color:${colorSueno(d.sueMed)}">${d.sueMed||"–"}</b>
            <span>Sueño · ${d.hMed||"–"} h</span></div>
          ${d.ent
            ? `<div class="stat"><b style="color:${d.zc.c}">${d.carga.cr ? d.carga.r.toFixed(2) : "–"}</b>
                 <span>${d.carga.cr ? d.zc.t : "Sin carga"}</span></div>`
            : `<div class="stat"><b style="color:#fb923c">${d.minSem}</b><span>Min de actividad · semana</span></div>`}
          <div class="stat"><b style="color:#2dd4bf">${d.med.ultima ? un1(d.med.ultima.peso) : "–"}</b>
            <span>Peso (kg)${d.med.ultima ? " · "+deltaTxt(d.med.ultima.peso, d.med.antes?.peso, null).t : ""}</span></div>
          <div class="stat"><b>${d.animo ? d.animo.toFixed(1) : "–"}</b><span>Ánimo · de 5</span></div>
          <div class="stat"><b style="color:${d.banderas?'#fb7185':'#22e07a'}">${d.banderas}</b>
            <span>Alertas en la ficha</span></div>
        </div>

        ${avisos.length ? `<div class="avisos">${avisos.slice(0,5).map(x=>
          `<div class="av" style="--c:${COLOR_AVISO[x.t]}">${esc(x.txt)}</div>`).join("")}</div>`
        : `<div class="avisos"><div class="av" style="--c:#22e07a">Constancia, sueño y carga dentro de lo esperado.
             Nada que corregir ahora mismo.</div></div>`}

        <div class="gtit">Carga diaria y sueño · 14 días</div>
        ${graficoMixto(d.serieCarga, d.serieSueno,
          {colorBarra: d.ent ? "#22e07a" : "#fb923c", colorLinea:"#a5b4fc",
           alt:"Carga diaria y puntuación de sueño de los últimos catorce días"})}
        <div class="gleg">
          <span><i style="background:${d.ent?'#22e07a':'#fb923c'}"></i>Carga del día (${unidad})</span>
          <span><i style="background:#a5b4fc"></i>Sueño (0–100)</span>
        </div>

        <div class="gtit" style="margin-top:16px">Peso · últimas mediciones</div>
        ${graficoLinea(d.seriePeso, "#2dd4bf")}
      </div>
    </section>`;
}

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
      <button class="btn ghost" style="margin-top:12px" id="verBandeja">💬 Bandeja de mensajes</button>
      ${soyCoach() ? `<button class="btn" style="margin-top:8px" id="invitar">+ Invitar a alguien</button>
        <button class="btn ghost" style="margin-top:8px" id="verBen">🎁 Beneficios de las marcas</button>
        <button class="btn ghost" style="margin-top:8px" id="verMods">⬢ Módulos de la app</button>` : ""}
    </section>`;

  document.querySelectorAll("[data-id]").forEach(tr=>tr.onclick=()=>verAtleta(tr.dataset.id));
  $("verBandeja").onclick = verBandeja;
  /* El contador vive de lo que ya se consultó para la tabla. */
  sinLeerTotal = pendientes;
  pintarAvisoMensajes();
  if(soyCoach()){
    $("invitar").onclick = abrirInvitar;
    $("verBen").onclick  = verBeneficios;
    $("verMods").onclick = verModulos;
  }
}

/* ============================================================
   BANDEJA DE MENSAJES
   Todas las conversaciones en una pantalla, por orden de lo último
   que llegó. Sin esto hay que entrar deportista por deportista para
   descubrir quién escribió.
   ============================================================ */
let bandeja = [], canalBandeja = null, sinLeerTotal = {};

async function cargarBandeja(){
  if(!atletas.length) atletas = await Nube.misAtletas();
  const ultimos = await Nube.ultimosMensajes();
  /* Vienen del más nuevo al más viejo: el primero de cada conversación
     es el último que se dijo. */
  const porAtleta = {};
  ultimos.forEach(m=>{ if(!porAtleta[m.atleta_id]) porAtleta[m.atleta_id] = m; });

  const pendientes = {};
  await Promise.all(atletas.map(async a=>{
    try{ pendientes[a.id] = await Nube.sinLeer(a.id); }catch(e){ pendientes[a.id] = 0; }
  }));
  sinLeerTotal = pendientes;

  /* Nombres de quien escribió, para poder firmar la última línea. */
  const autores = Object.values(porAtleta).map(m=>m.autor_id)
    .filter(id => id && id !== perfil?.id && !chatNombres[id]);
  if(autores.length){
    try{ Object.assign(chatNombres, await Nube.nombresDe(autores)); }catch(e){}
  }

  bandeja = atletas.map(a => ({
    atleta: a,
    ultimo: porAtleta[a.id] || null,
    sinLeer: pendientes[a.id] || 0
  })).sort((x, y)=>{
    if(!!y.sinLeer !== !!x.sinLeer) return y.sinLeer - x.sinLeer;   // lo no leído, arriba
    return String(y.ultimo?.creado || "").localeCompare(String(x.ultimo?.creado || ""));
  });
  pintarAvisoMensajes();
}

/* "hace 5 min", "ayer": en una bandeja importa cuán reciente es, no la hora. */
function haceCuanto(iso){
  if(!iso) return "";
  const min = Math.floor((Date.now() - new Date(iso)) / 60000);
  if(min < 1)  return "ahora";
  if(min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if(h < 24)   return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if(d === 1)  return "ayer";
  if(d < 7)    return `hace ${d} días`;
  return fechaCorta(hoyKey(new Date(iso)));
}

async function verBandeja(){
  vista = {tipo:"bandeja", id:null};
  if(!document.querySelector(".bzlista")) $("main").innerHTML = `<div class="empty">Cargando mensajes…</div>`;
  try{ await cargarBandeja(); }
  catch(e){
    $("main").innerHTML = `
      <a class="volver" id="volver">‹ Todos los deportistas</a>
      <div class="empty">${esc(Nube.traduce(e.message))}</div>`;
    $("volver").onclick = verLista; return;
  }

  const conMensajes = bandeja.filter(x => x.ultimo);
  const sinNada     = bandeja.filter(x => !x.ultimo);
  const totalSin    = bandeja.reduce((a, x)=> a + x.sinLeer, 0);
  const avisosOff   = ("Notification" in window) && Notification.permission !== "granted";

  $("main").innerHTML = `
    <a class="volver" id="volver">‹ Todos los deportistas</a>
    <section>
      <div class="stitle">Mensajes${totalSin ? ` · ${totalSin} sin leer` : ""}</div>
      ${avisosOff ? `<div class="acceso" id="pedirAvisos">
        <div class="m">🔔</div>
        <div class="t"><b>Activa los avisos del navegador</b>
          <span>Te avisa cuando un deportista escribe, aunque el panel esté en otra pestaña.</span></div>
        <div class="fl">›</div>
      </div>` : ""}
      <div class="panel bzlista" style="margin-top:12px">${
        conMensajes.length
          ? conMensajes.map(filaBandeja).join("")
          : `<div class="empty">Nadie ha escrito todavía.</div>`}
      </div>
    </section>
    ${sinNada.length ? `<section>
      <div class="stitle">Sin conversación todavía</div>
      <div class="panel bzlista">${sinNada.map(filaBandeja).join("")}</div>
    </section>` : ""}`;

  $("volver").onclick = verLista;
  $("pedirAvisos")?.addEventListener("click", pedirAvisos);
  document.querySelectorAll("[data-conv]").forEach(fila=>
    fila.onclick = ()=> verAtleta(fila.dataset.conv));
}

function filaBandeja(x){
  const m = x.ultimo;
  const mio = m && m.autor_id === perfil?.id;
  const suyo = m && m.autor_id === x.atleta.id;
  const quien = !m ? "" : mio ? "Tú: " : suyo ? "" :
    `${esc(String(chatNombres[m.autor_id]?.nombre || "Equipo").split(" ")[0])}: `;
  return `<div class="bzfila ${x.sinLeer ? "nueva" : ""}" data-conv="${x.atleta.id}">
    <div class="ava">${esc(iniciales(x.atleta.nombre))}</div>
    <div class="t">
      <b>${esc(x.atleta.nombre || x.atleta.correo)}</b>
      <span>${m ? quien + esc(String(m.texto).slice(0, 90))
                : "Sin mensajes. Escríbele tú primero."}</span>
    </div>
    <div class="meta">
      <span class="cuando">${m ? haceCuanto(m.creado) : ""}</span>
      ${x.sinLeer ? `<span class="sinleer">${x.sinLeer}</span>` : ""}
    </div>
  </div>`;
}

/* El aviso de la cabecera: se ve desde cualquier pantalla del panel. */
function pintarAvisoMensajes(){
  const b = $("bandejaBtn");
  if(!b) return;
  const total = Object.values(sinLeerTotal).reduce((a, n)=> a + Number(n || 0), 0);
  b.innerHTML = total ? `💬<span class="pip"></span>` : "💬";
  b.title = total ? `${total} ${total === 1 ? "mensaje" : "mensajes"} sin leer` : "Mensajes";
}

/* Un solo canal para todas las conversaciones: el aviso llega aunque estés
   mirando la ficha de otro deportista. La base ya filtra por fila, así que
   de aquí solo salen las conversaciones que te tocan. */
function escucharBandeja(){
  if(canalBandeja) return;
  canalBandeja = Nube.escucharMensajes(async m=>{
    if(m.autor_id === perfil?.id) return;          // lo acabo de escribir yo
    if(chatConv === m.atleta_id) return;           // esa conversación ya tiene su canal
    sinLeerTotal[m.atleta_id] = (Number(sinLeerTotal[m.atleta_id]) || 0) + 1;
    pintarAvisoMensajes();
    const a = atletas.find(x => x.id === m.atleta_id);
    const nombre = String(a?.nombre || "").split(" ")[0];
    toast(nombre ? `💬 ${nombre}: ${String(m.texto).slice(0, 60)}`
                 : "💬 Mensaje nuevo de un deportista");
    avisarEnElSistema(nombre, m.texto);
    if(vista.tipo === "bandeja") verBandeja();
  });
}

/* Aviso del sistema, para cuando el panel quedó en otra pestaña. Solo si el
   entrenador dio permiso: no se pide solo al entrar. */
function avisarEnElSistema(nombre, texto){
  try{
    if(!("Notification" in window) || Notification.permission !== "granted") return;
    if(!document.hidden) return;
    new Notification(nombre ? `Mensaje de ${nombre}` : "Mensaje nuevo · Fractale",
      {body: String(texto).slice(0, 120), icon: "icons/icon-192.png", tag: "fractale-chat"});
  }catch(e){}
}

async function pedirAvisos(){
  if(!("Notification" in window)){ toast("Este navegador no admite avisos"); return; }
  if(Notification.permission === "granted"){ toast("Los avisos ya están activos"); return; }
  const r = await Notification.requestPermission();
  toast(r === "granted" ? "Avisos activados" : "Avisos no permitidos");
  if(vista.tipo === "bandeja") verBandeja();
}

/* ============================================================
   MÓDULOS DE LA APP
   Entrenamiento y nutrición nacieron archivados porque nadie los estaba
   usando. Desde aquí se encienden y aparecen en la app de todos.
   ============================================================ */
const FICHA_MODULOS = [
  {k:"entrenamiento", e:"🏋️", l:"Entrenamiento de fuerza",
   q:"Registro de sesiones con series y kilos, tonelaje semanal, carga aguda:crónica y el resumen de entrenamiento en Progreso.",
   nota:"La actividad física (correr, bici, trekking) se registra siempre, esté esto encendido o no."},
  {k:"nutricion", e:"🥗", l:"Alimentación diaria",
   q:"Grupos de alimentos priorizados cada día, recuento de comida chatarra y sus límites.",
   nota:"La ficha nutricional y los documentos de nutrición no dependen de esto: siguen disponibles."}
];

async function verModulos(){
  vista = {tipo:"modulos", id:null};
  $("main").innerHTML = `<div class="empty">Cargando módulos…</div>`;
  try{ await cargarModulosEstricto(); }
  catch(e){ $("main").innerHTML = `
    <a class="volver" id="volver">‹ Todos los deportistas</a>
    <div class="empty">${esc(e.message)}<br><br>
      Si es la primera vez, falta ejecutar <b>base-de-datos/modulos.sql</b> en Supabase.</div>`;
    $("volver").onclick = verLista; return; }

  $("main").innerHTML = `
    <a class="volver" id="volver">‹ Todos los deportistas</a>
    <section>
      <div class="stitle">Módulos de la app</div>
      <p style="font-size:13px;color:var(--tx2);margin:0 0 14px;line-height:1.6">
        Lo que está apagado desaparece de la app de todos los deportistas: no se
        borra nada, queda archivado y vuelve a aparecer tal cual al encenderlo.</p>
      <div class="panel">
        ${FICHA_MODULOS.map(m=>`<div class="sw">
          <div class="t"><b>${m.e} ${m.l}</b><span>${m.q}</span></div>
          <button class="knob ${modOn(m.k)?"on":""}" data-mod="${m.k}" role="switch"
            aria-checked="${modOn(m.k)}" aria-label="${m.l}"></button>
        </div>
        <p class="fcnota" style="margin:-4px 0 14px">${m.nota}</p>`).join("")}
      </div>
    </section>`;

  $("volver").onclick = verLista;
  document.querySelectorAll("[data-mod]").forEach(b=> b.onclick = async ()=>{
    const k = b.dataset.mod, nuevo = !modOn(k);
    b.disabled = true;
    try{
      await Nube.guardarModulo(k, nuevo);
      MODULOS[k] = nuevo;
      toast(nuevo ? "Módulo encendido" : "Módulo archivado");
      verModulos();
    }catch(e){ toast(Nube.traduce(e.message)); b.disabled = false; }
  });
}

/* Igual que cargarModulos, pero aquí sí queremos que el error se vea: si la
   tabla no existe, el entrenador tiene que saberlo. */
async function cargarModulosEstricto(){
  MODULOS = Object.assign({entrenamiento:false, nutricion:false}, await Nube.modulos());
}

/* ============================================================
   BENEFICIOS DE LAS MARCAS
   Iguales para todos los deportistas; solo el entrenador los toca.
   ============================================================ */
const LOGOS = [
  {f:"", l:"Sin logo"},
  {f:"assets/marcas/under-armour.png",     l:"Under Armour"},
  {f:"assets/marcas/fthaus.png",           l:"FThaus"},
  {f:"assets/marcas/patagonia-medical.png",l:"Patagonia Medical"},
  {f:"assets/marcas/winkler-nutrition.png",l:"Winkler Nutrition"}
];
const CATS_BEN = {ropa:"👕 Ropa", nutricion:"🥗 Nutrición", salud:"✚ Salud",
                  entrenamiento:"🏋️ Entrenamiento", otro:"⭐️ Otro"};
let bens = [], benEdit = null;

async function verBeneficios(){
  vista = {tipo:"beneficios", id:null};
  $("main").innerHTML = `<div class="empty">Cargando beneficios…</div>`;
  try{ bens = await Nube.beneficios(true); }
  catch(e){ $("main").innerHTML = `<div class="empty">${esc(Nube.traduce(e.message))}</div>`; return; }

  $("main").innerHTML = `
    <a class="volver" id="benVolver">‹ Todos los deportistas</a>
    <section>
      <div class="stitle">🎁 Beneficios de las marcas</div>
      <div class="panel">
        ${bens.length ? bens.map(b=>`
          <div class="hrow" data-ben="${b.id}" style="cursor:pointer">
            <div class="m">${b.logo ? `<img src="${esc(b.logo)}" alt="" style="width:100%;height:100%;object-fit:contain">` : "🎁"}</div>
            <div class="t"><b>${esc(b.marca)} · ${esc(b.descuento)}</b>
              <span>${esc(b.detalle || CATS_BEN[b.categoria] || "")}${
                b.vence ? " · caduca " + fechaCorta(b.vence) : ""}${
                b.activo ? "" : " · oculto"}</span></div>
            <button class="mini">Editar</button>
          </div>`).join("")
        : `<div class="empty">Aún no has cargado ningún beneficio.</div>`}
      </div>
      <button class="btn" style="margin-top:12px" id="benNuevo">+ Añadir beneficio</button>
    </section>`;

  $("benVolver").onclick = verLista;
  $("benNuevo").onclick  = ()=>abrirBeneficio(null);
  document.querySelectorAll("[data-ben]").forEach(el=>el.onclick=()=>
    abrirBeneficio(bens.find(b=>b.id === el.dataset.ben)));
}

function abrirBeneficio(b){
  benEdit = b || null;
  $("benTitulo").textContent = b ? "Editar beneficio" : "Nuevo beneficio";
  $("bMarca").value   = b?.marca || "";
  $("bDto").value     = b?.descuento || "";
  $("bDetalle").value = b?.detalle || "";
  $("bCodigo").value  = b?.codigo || "";
  $("bInstr").value   = b?.instrucciones || "";
  $("bEnlace").value  = b?.enlace || "";
  $("bVence").value   = b?.vence || "";
  document.querySelectorAll("[data-cat]").forEach(x=>
    x.classList.toggle("on", x.dataset.cat === (b?.categoria || "otro")));
  $("bLogo").innerHTML = LOGOS.map(o=>
    `<button class="tag ${(b?.logo||"") === o.f ? "on" : ""}" data-logo="${esc(o.f)}">${esc(o.l)}</button>`).join("");
  document.querySelectorAll("[data-cat]").forEach(x=>x.onclick=()=>{
    document.querySelectorAll("[data-cat]").forEach(y=>y.classList.remove("on")); x.classList.add("on"); });
  document.querySelectorAll("[data-logo]").forEach(x=>x.onclick=()=>{
    document.querySelectorAll("[data-logo]").forEach(y=>y.classList.remove("on")); x.classList.add("on"); });
  $("bBorrar").classList.toggle("hidden", !b);
  $("benModal").classList.add("open");
}

$("bGuardar").onclick = async ()=>{
  const marca = $("bMarca").value.trim(), dto = $("bDto").value.trim();
  if(!marca){ toast("Falta el nombre de la marca"); return; }
  if(!dto){ toast("Falta el descuento"); return; }
  const datos = {
    marca, descuento: dto,
    detalle:       $("bDetalle").value.trim() || null,
    codigo:        $("bCodigo").value.trim() || null,
    instrucciones: $("bInstr").value.trim() || null,
    enlace:        $("bEnlace").value.trim() || null,
    vence:         $("bVence").value || null,
    categoria:     document.querySelector("[data-cat].on")?.dataset.cat || "otro",
    logo:          document.querySelector("[data-logo].on")?.dataset.logo || null,
    activo: true
  };
  try{
    await Nube.guardarBeneficio(benEdit ? {...datos, id:benEdit.id} : datos);
    $("benModal").classList.remove("open");
    toast("Beneficio guardado");
    verBeneficios();
  }catch(e){ toast(Nube.traduce(e.message)); }
};
$("bBorrar").onclick = async ()=>{
  if(!benEdit) return;
  if(!confirm(`¿Quitar el beneficio de ${benEdit.marca}? Tus deportistas dejarán de verlo.`)) return;
  try{
    await Nube.borrarBeneficio(benEdit.id);
    $("benModal").classList.remove("open");
    toast("Beneficio quitado");
    verBeneficios();
  }catch(e){ toast(Nube.traduce(e.message)); }
};
$("bCerrar").onclick = ()=> $("benModal").classList.remove("open");
$("benModal").onclick = e=>{ if(e.target.id === "benModal") $("benModal").classList.remove("open"); };

/* ============================================================
   FICHA DE UN DEPORTISTA
   ============================================================ */
async function verAtleta(id){
  const a = atletas.find(x=>x.id === id);
  const mismaFicha = vista.tipo === "ficha" && vista.id === id;
  /* De dónde se entró, para que «volver» devuelva al mismo sitio. */
  const desdeBandeja = vista.tipo === "bandeja" || (mismaFicha && vistaPrevia === "bandeja");
  if(!mismaFicha) vistaPrevia = vista.tipo;
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
  const familia = Array.isArray(salud.familiares) ? salud.familiares : [];
  const carga = razonCarga(dias, vol);
  const zc = zonaDe(carga.r);

  const ult14 = [];
  for(let i=13;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const f = hoyKey(d);
    ult14.push({f, r: dias.find(x=>x.fecha===f)});
  }

  /* ---- lo que alimenta el resumen de arriba ---- */
  const ent = modOn("entrenamiento");
  const f14 = ult14[0].f;
  const dias14 = dias.filter(r => r.fecha >= f14);
  const diasConDato = dias14.filter(r => {
    const x = r.datos || {};
    return x.sleep || vol(x) || act(x) || junk(x) || x.mood || String(x.note||"").trim()
           || Number(x.cuerpo?.peso);
  }).length;
  const sue14 = dias14.filter(r=>r.datos?.sleep).map(r=>r.datos.sleep);
  const sue14Med = sue14.length ? Math.round(sue14.reduce((s,x)=>s+x.score,0)/sue14.length) : 0;
  const h14Med = sue14.length ? (sue14.reduce((s,x)=>s+x.hours,0)/sue14.length).toFixed(1) : 0;
  const animos = dias14.map(r=>Number(r.datos?.mood)||0).filter(x=>x>0);
  const animo = animos.length ? animos.reduce((a,b)=>a+b,0)/animos.length : 0;
  const min7 = dias.filter(r => r.fecha >= ult14[7].f).reduce((s,r)=>s+act(r.datos), 0);
  const resumen = {
    ent,
    diasConDato, constancia: Math.round(diasConDato/14*100),
    sueMed: sue14Med, hMed: h14Med, animo,
    minSem: min7,
    carga, zc, med,
    banderas: banderasP(salud).filter(x=>x.t === "alta").length,
    diasSinEntrar: diasDesde(a?.ultimo_registro),
    serieCarga: serieDias(dias, 14, d => ent ? vol(d) : act(d)),
    serieSueno: serieDias(dias, 14, d => d?.sleep?.score || null),
    seriePeso: dias.filter(r=>Number(r.datos?.cuerpo?.peso) > 0)
                   .map(r=>({f:r.fecha, v:Number(r.datos.cuerpo.peso)}))
                   .sort((x,y)=>x.f.localeCompare(y.f))
  };

  $("main").innerHTML = `
    <a class="volver" id="volver">‹ Todos los deportistas</a>
    <div class="hero" style="margin-top:6px">
      <div class="ava" style="width:64px;height:64px;border-radius:18px;font-size:22px${
        salud.foto ? `;background:url('${salud.foto}') center/cover no-repeat;color:transparent` : ""}">${
        esc(iniciales(a?.nombre))}</div>
      <div class="hero-info">
        <h2>${esc(a?.nombre || "Deportista")}</h2>
        <p>${esc(a?.correo||"")}</p>
        <div class="chips">
          <span class="chip">Último registro: ${fechaCorta(a?.ultimo_registro)}</span>
          <span class="chip">${dias.length} días registrados en 45</span>
        </div>
      </div>
    </div>

    ${resumenHTML(resumen)}

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

    ${familia.length ? `<section>
      <div class="stitle">Familia declarada</div>
      <div class="panel">
        ${familia.map(x=>`<div class="hrow">
          <div class="m">${relDeP(x.rel).e}</div>
          <div class="t"><b>${esc(x.nombre)}</b>
            <span>${relDeP(x.rel).l}${x.rut ? " · RUT " + esc(x.rut) : ""}</span></div>
        </div>`).join("")}
        <p class="fcnota" style="margin:10px 0 0">Lo que el deportista declaró en su
          credencial. Es la lista con la que se verifica un beneficio familiar.</p>
      </div>
    </section>` : ""}

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
        ${ent ? `<div class="stat"><b>${kg(kgTot)}</b><span>Kg totales</span></div>
        <div class="stat"><b>${sesiones.length}</b><span>Sesiones</span></div>
        <div class="stat"><b>${sesiones.length?kg(kgTot/sesiones.length):0}</b><span>Kg por sesión</span></div>` : ""}
        <div class="stat"><b style="color:${colorSueno(sueMed)}">${sueMed||"–"}</b><span>Sueño · ${hMed||"–"} h</span></div>
        <div class="stat"><b style="color:#fb923c">${dias.reduce((s,r)=>s+act(r.datos),0)}</b><span>Min de actividad</span></div>
        <div class="stat"><b style="color:#fb923c">${Math.round(dias.reduce((s,r)=>s+actKm(r.datos),0)*10)/10}</b><span>Km recorridos</span></div>
        ${modOn("nutricion") ? `<div class="stat"><b style="color:${colorChatarra(chat/6)}">${chat}</b><span>Chatarra total</span></div>` : ""}
        ${ent ? `<div class="stat"><b style="color:${zc.c}">${carga.cr ? carga.r.toFixed(2) : "–"}</b><span>${
          carga.cr ? zc.t : "Sin carga registrada"}</span></div>` : ""}
      </div>
      ${ent ? `<div class="panel" style="margin-top:12px">
        <div class="chart">
          ${ult14.map(x=>{
            const v = vol(x.r?.datos), alt = v ? Math.max(4, v/maxVol*100) : 3;
            return `<div class="cb" title="${x.f}${v?` · ${kg(v)} kg`:""}">
              <div class="cbar ${v?"":"empty"}" style="height:${alt}%"></div>
              <div class="cbl">${Number(x.f.slice(8))}</div></div>`;
          }).join("")}
        </div>
        <div class="hlbl"><span>Volumen por día · últimos 14 días</span></div>
      </div>` : ""}
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

  $("volver").textContent = desdeBandeja ? "‹ Bandeja de mensajes" : "‹ Todos los deportistas";
  $("volver").onclick = ()=>{ cerrarChat(); desdeBandeja ? verBandeja() : verLista(); };
  montarChat(id);
  /* Entrar a la ficha es leer: el contador de esa conversación se vacía. */
  sinLeerTotal[id] = 0;
  pintarAvisoMensajes();

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
  /* Salud y nutrición trabajan con informes, no con fotos del celular. */
  if(!(f.type === "application/pdf" || /\.pdf$/i.test(f.name))){
    toast("Solo se pueden adjuntar archivos PDF"); return;
  }
  if(f.size > 15*1024*1024){ toast("El archivo pesa más de 15 MB"); return; }
  docArchivo = f;
  $("dcPara").textContent = `Se añade a la ficha de ${docPara.nombre}. Solo PDF, hasta 15 MB.`;
  $("dcArchivo").innerHTML = `<div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:22px">📄</div>
      <div style="min-width:0"><b style="display:block;font-size:13.5px;word-break:break-all">${esc(f.name)}</b>
        <span style="font-size:12px;color:#6f7887">${pesoArchivo(f.size)}</span></div>
    </div>`;
  $("dcTitulo").value = f.name.replace(/\.[^.]+$/, "").slice(0, 80);
  $("dcFecha").value  = hoyKey();
  $("dcNotas").value  = "";
  /* Por defecto, el tipo de tu especialidad. */
  const porDefecto = perfil?.rol === "nutricionista" ? "nutricional"
                   : "medico";
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
      tipo:  document.querySelector("#dcTipo [data-tp].on")?.dataset.tp || "medico",
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
  await cargarModulos();
  await verLista();
  conectarEnVivo();
  escucharBandeja();
  $("bandejaBtn").onclick = verBandeja;
  Nube.alCambiarSesion(s=>{ if(!s) location.reload(); });
  addEventListener("beforeunload", ()=>{
    Nube.dejarDeEscuchar(canal);
    if(canalBandeja) Nube.dejarDeEscuchar(canalBandeja);
  });
})();
