/* Datos de ejemplo, solo para la copia de prueba.
   Nada de esto va a la app publicada. */
(function(){
  const k = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const hace = n => { const d = new Date(); d.setDate(d.getDate()-n); return d; };

  if(!localStorage.getItem("demo.fractale")){
    /* En el primer arranque todavía no hay nada guardado: se trabaja sobre el
       estado en memoria y se deja que la app lo escriba. */
    const st = S;
    /* 80 días de entrenamiento, con descanso domingo y miércoles */
    for(let i=0;i<80;i++){
      const d = hace(i);
      if(d.getDay()===0 || d.getDay()===3) continue;
      const carga = 2100 + Math.round(Math.sin(i/6)*400);
      st.logs[k(d)] = {
        values:{}, meals:{}, mt: Date.now()-i*1000,
        note: i%5 ? "" : "Buen entrenamiento, algo cansado al final.",
        mood: i%3 ? 4 : 3,
        sleep: i%5 ? {hours:7.5, quality:4, feel:4, score:78} : null,
        workout:{ex:[
          {name:"Sentadilla", sets:[{w:80,r:8},{w:85,r:6},{w:90,r:5}]},
          {name:"Press banca", sets:[{w:60,r:10},{w:65,r:8}]},
          {name:"Peso muerto", sets:[{w:100,r:5},{w:105,r:5}]}
        ], note:""},
        actividad:{items:{caminar:{min:35, km:2.8}}},
        food:{groups:["proteina","verduras","frutas"], junk: i%6 ? [] : [{e:"🍕", l:"Pizza", n:1}], note:""}
      };
      st.logs[k(d)].workout.volume = carga;
    }
    /* mediciones semanales, bajando de a poco */
    for(let i=0;i<12;i++){
      const d = hace(i*7), key = k(d);
      st.logs[key] = st.logs[key] || {values:{}, meals:{}, note:"", mood:0, sleep:null, mt:Date.now()};
      st.logs[key].cuerpo = {
        peso: Math.round((76.8-(11-i)*0.22)*10)/10,
        grasa: Math.round((16.5-(11-i)*0.12)*10)/10,
        musculo: Math.round((41.2+(11-i)*0.09)*10)/10,
        at: Date.now(), nota: i===0 ? "Báscula del gimnasio, en ayunas" : ""
      };
    }
    const mas = n => { const d = new Date(); d.setDate(d.getDate()+n); return k(d); };
    st.comps = [
      {id:"c1", nombre:"Corrida de invierno", fecha:mas(12), deporte:"5 km", lugar:"Viña del Mar",
       prio:"B", objetivo:"Test de ritmo", notas:"", resultado:""},
      {id:"c2", nombre:"Campeonato nacional", fecha:mas(38), deporte:"10 km", lugar:"Santiago",
       prio:"A", objetivo:"Bajar de 40 min", notas:"Llegar dos días antes para reconocer el circuito.", resultado:""},
      {id:"c3", nombre:"Clasificatorio regional", fecha:k(hace(20)), deporte:"10 km", lugar:"Rancagua",
       prio:"B", objetivo:"", notas:"", resultado:"41:20, 4º lugar"}
    ];
    st.salud = Object.assign({}, st.salud, {
      nacimiento:"1998-04-12", grupo:"O+", estatura:"178", prevision:"Isapre Consalud",
      contacto:"Carla Muñoz · +56 9 1234 5678", contacto2:"Diego Rojas · +56 9 8765 4321",
      tratante:"Dr. P. Salinas, traumatólogo · +56 2 2345 6789",
      alergiaMed:"Penicilina · urticaria y dificultad para respirar", alergias:"Polen en primavera",
      condiciones:"Asma leve inducida por ejercicio",
      cirugias:"Artroscopia rodilla izquierda, enero 2023",
      conmociones:"Una en 2021 jugando fútbol, sin secuelas",
      respiratorio:"Broncoespasmo con frío bajo 5 °C",
      cvDolor:"no", cvDesmayo:"no", cvAhogo:"no", cvSoplo:"si", cvFamiliar:"no",
      medicacion:"Salbutamol antes de sesiones intensas",
      medicacionOcas:"Ibuprofeno 400 mg tras sesiones largas",
      habitos:"Alcohol ocasional, fin de semana",
      lesiones:"Esguince tobillo derecho, marzo 2025. Recuperado.",
      lesionActual:"Molestia en el tendón de Aquiles derecho desde hace 10 días",
      limitaciones:"Sin pliometría ni cuestas hasta el alta",
      ultimoControl:"2026-03-14", ecg:"Marzo 2026 · normal",
      sangre:"Junio 2026 · ferritina baja, en tratamiento",
      certificaVence: mas(17), vacunas:"Tétanos al día (2024)",
      restricciones:"Intolerancia a la lactosa",
      suplementos:"Creatina 5 g diarios · Vitamina D en invierno",
      objetivoNutri:"Bajar a 74 kg manteniendo masa magra",
      notasNutri:"Carga de hidratos el día previo a competencia."
    });
    st.metaMt = Date.now();
    save();
    localStorage.setItem("demo.fractale", "1");
    location.reload();
    return;
  }

  /* Objetivos y mensajes viven en la nube, que aquí no existe: se rellenan a
     mano para que las pantallas se vean con contenido. */
  const hoy = k(new Date());
  const lunes = (()=>{ const d = new Date(); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return k(d); })();

  objs.push(
    {id:"o1", autor_id:"coach", categoria:"redes", cadencia:"semanal", meta:3,
     titulo:"Subir historias entrenando", detalle:"Etiquetar @fractale y usar el sticker de la marca.", vence:null},
    {id:"o2", autor_id:"coach", categoria:"redes", cadencia:"mensual", meta:2,
     titulo:"Publicación en el feed", detalle:"Foto o video con equipamiento visible.", vence:null},
    {id:"o3", autor_id:"coach", categoria:"equipo", cadencia:"unica", meta:1,
     titulo:"Grabar el video de presentación", detalle:"", vence:null},
    {id:"o4", autor_id:null, categoria:"rendimiento", cadencia:"semanal", meta:4,
     titulo:"Cuatro sesiones de fuerza", detalle:"", vence:null});
  objHechos.push(
    {id:"h1", objetivo_id:"o1", fecha:lunes, creado:lunes},
    {id:"h2", objetivo_id:"o1", fecha:hoy,   creado:hoy},
    {id:"h3", objetivo_id:"o2", fecha:hoy,   creado:hoy},
    {id:"h4", objetivo_id:"o2", fecha:hoy,   creado:hoy},
    {id:"h5", objetivo_id:"o4", fecha:hoy,   creado:hoy});

  const ayer = new Date(Date.now()-86400000);
  const a = (d,h,m)=>{ const x = new Date(d); x.setHours(h,m,0,0); return x.toISOString(); };
  chatMsgs.push(
    {id:"m1", autor_id:"coach", texto:"¿Cómo va el tendón después de la sesión del martes?", creado:a(ayer,9,12)},
    {id:"m2", autor_id:null,    texto:"Mejor. Sigue molestando al bajar escaleras, pero corriendo en plano ya casi no lo siento.", creado:a(ayer,9,40)},
    {id:"m3", autor_id:"coach", texto:"Bien. Mantenemos sin cuestas esta semana y lo revisamos el lunes antes de la corrida.", creado:a(ayer,9,44)},
    {id:"m4", autor_id:null,    texto:"Dale. ¿Cambio algo del entrenamiento del jueves?", creado:a(new Date(),8,2)},
    {id:"m5", autor_id:"coach", texto:"Sí: saca la pliometría y súmale 10 minutos de rodaje suave al final.", creado:a(new Date(),8,15)});

  /* La bandeja y los objetivos son de solo lectura en la prueba. */
  const pintaDemo = ()=>{
    pintaChat();
    document.getElementById("chatBar").classList.add("hidden");
    pintaListaObjetivos();
    document.getElementById("addObj").classList.add("hidden");
  };
  renderToday();
  document.querySelectorAll("nav.tabs button, #chatBtn").forEach(b=>
    b.addEventListener("click", ()=> setTimeout(pintaDemo, 0)));
  setTimeout(pintaDemo, 0);
})();
