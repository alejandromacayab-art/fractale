# -*- coding: utf-8 -*-
"""Genera las historias de Instagram de FRACTALE: un HTML por historia,
1080x1920, con la misma identidad de la portada (negro azulado, Helvetica,
mayúsculas apretadas). Chrome sin ventana las convierte en PNG."""
import os, pathlib

RAIZ = "/Users/alejandromacaya/Desktop/FRACTALE"
SALIDA = pathlib.Path(__file__).parent

BASE = """<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>
:root{
  --ground:#0B0B0D; --surface:#141419; --ink:#F3F3F5; --mute:#9A9AA4;
  --line:#26262E; --bright:#FFFFFF; --band:#F3F3F5; --band-ink:#131318;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{
  background:var(--ground);color:var(--ink);
  font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
}
img{display:block;max-width:100%}
.frame{position:relative;width:1080px;height:1920px;overflow:hidden}
/* la foto de fondo, siempre bajo un velo que deja legible el texto */
.bg{position:absolute;inset:0;background-size:cover;background-position:center;
    filter:grayscale(1) contrast(1.05) blur(3px);transform:scale(1.05)}
.bg::after{content:"";position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(11,11,13,.93),rgba(11,11,13,.82) 42%,rgba(11,11,13,.97))}
/* la portada si lleva foto de verdad: alta resolucion y sin marcas encima */
.bg.limpio{filter:grayscale(.18) contrast(1.06);transform:none}
.bg.limpio::after{background:
  linear-gradient(180deg,rgba(0,0,0,.78),rgba(0,0,0,.42) 40%,rgba(0,0,0,.92)),
  radial-gradient(70% 60% at 50% 45%,rgba(0,0,0,.5),transparent 75%)}
/* zona segura: Instagram tapa ~250px arriba y ~300px abajo */
.inner{position:relative;height:100%;padding:230px 88px 300px;
       display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;gap:20px}
.logo img{height:34px;width:auto;opacity:.95}
.num{font-size:20px;letter-spacing:.22em;color:var(--mute)}
.mid{margin-top:auto;margin-bottom:auto}
.eyebrow{font-size:22px;letter-spacing:.24em;text-transform:uppercase;
  font-weight:600;color:var(--mute);margin-bottom:34px}
.rule{width:96px;height:4px;background:var(--bright);margin-bottom:40px}
h1{font-weight:800;text-transform:uppercase;letter-spacing:-.045em;
   line-height:.88;font-size:112px}
h1.xl{font-size:150px}
h1.sm{font-size:88px}
.lead{margin-top:40px;font-size:34px;line-height:1.35;color:#DCDCE2;max-width:27ch}
.lead b{color:#fff;font-weight:700}
ul{margin-top:56px;list-style:none;border-top:1px solid var(--line)}
li{border-bottom:1px solid var(--line);padding:26px 0;font-size:32px;
   display:flex;gap:22px;align-items:baseline}
li span{font-size:20px;letter-spacing:.18em;color:var(--mute);min-width:56px}
li b{font-weight:600}
li i{font-style:normal;color:var(--mute);font-size:26px;display:block;margin-top:6px}
.foot{position:absolute;left:88px;right:88px;bottom:150px;
      display:flex;justify-content:space-between;align-items:flex-end;
      font-size:24px;color:var(--mute);letter-spacing:.04em}
.pill{display:inline-flex;align-items:center;height:78px;padding:0 44px;
  border-radius:999px;background:var(--bright);color:#0B0B0D;
  font-size:30px;font-weight:600;margin-top:56px}
.pill.ghost{background:none;color:#fff;border:2px solid rgba(255,255,255,.55)}
/* la banda clara donde viven los logos de las marcas */
.marcas{margin-top:56px;background:var(--band);border-radius:28px;
  padding:56px 48px;display:grid;grid-template-columns:1fr 1fr;gap:52px 44px}
.marcas div{display:flex;align-items:center;justify-content:center;height:120px}
.marcas img{max-height:96px;max-width:100%;width:auto;object-fit:contain}
.dosb{margin-top:auto;display:grid;gap:22px}
.caja{border:1px solid var(--line);background:rgba(20,20,25,.72);
  border-radius:28px;padding:46px 44px}
.caja h3{font-size:44px;font-weight:800;text-transform:uppercase;
  letter-spacing:-.03em;margin-bottom:14px}
.caja p{font-size:28px;color:var(--mute);line-height:1.35}
.tags{margin-top:44px;font-size:26px;color:var(--mute);letter-spacing:.06em}
.retrato{position:absolute;right:0;top:0;width:520px;height:100%;
  background-size:cover;background-position:center;
  filter:grayscale(1) contrast(1.05) blur(2px)}
.retrato::after{content:"";position:absolute;inset:0;background:
  linear-gradient(90deg,var(--ground),rgba(11,11,13,.35) 45%,rgba(11,11,13,.85))}
</style></head><body><div class="frame">__CUERPO__</div></body></html>"""

LOGO = f'<div class="logo"><img src="{RAIZ}/assets/logo-dark.png" alt="FRACTALE"></div>'
def top(n):
    return f'<div class="top">{LOGO}<div class="num">{n}</div></div>'
def foot(izq="@fractale.cl", der="Puerto Montt · Chile"):
    return f'<div class="foot"><div>{izq}</div><div>{der}</div></div>'
def fondo(foto, clase=""):
    return (f'<div class="bg {clase}" '
            f'style="background-image:url(\'{RAIZ}/assets/fotos/{foto}\')"></div>')

H = []

# 01 · portada
H.append(("01-portada", fondo("puerto-montt.jpg","limpio") + f"""
<div class="inner" style="padding-top:230px">
  {top("01")}
  <div class="mid">
    <div class="eyebrow">Sport Management · Puerto Montt</div>
    <h1 class="xl">El éxito<br>está en<br>el sur</h1>
    <p class="lead">Profesionalizamos carreras deportivas y conectamos marcas
      con el alto rendimiento del sur de Chile.</p>
  </div>
</div>""" + foot()))

# 02 · manifiesto
H.append(("02-paradigma", f"""
<div class="inner">{top("02")}
  <div class="mid">
    <div class="eyebrow">El paradigma que rompemos</div>
    <div class="rule"></div>
    <h1>El alto<br>rendimiento<br>ya no pide<br>permiso en<br>la capital</h1>
    <p class="lead">No hay que migrar a Santiago para llegar a la élite.
      El sur tiene la geografía, el clima y la gente <b>más exigentes del país</b>.</p>
  </div>
</div>""" + foot(der="Desliza →")))

# 03 · profesionalizamos carreras
H.append(("03-profesionalizamos", fondo("trail.jpg") + f"""
<div class="inner">{top("03")}
  <div class="mid">
    <div class="eyebrow">01 · Acompañamiento integral 360°</div>
    <h1>Profesio-<br>nalizamos<br>carreras</h1>
    <p class="lead">Liberamos al atleta de la carga operativa, administrativa y
      médica para que enfoque el <b>100% de su energía en rendir y ganar</b>.</p>
  </div>
  <ul>
    <li><span>01</span><div><b>Performance</b><i>Planificación y control de cargas</i></div></li>
    <li><span>02</span><div><b>Salud y bienestar</b><i>Equipo médico y nutrición deportiva</i></div></li>
    <li><span>03</span><div><b>Marketing y gestión</b><i>Auspicios y marca personal</i></div></li>
  </ul>
</div>""" + foot()))

# 04 · performance
H.append(("04-performance", f"""
<div class="retrato" style="background-image:url('{RAIZ}/assets/fotos/karate.jpg')"></div>
<div class="inner">{top("04")}
  <div class="mid" style="max-width:640px">
    <div class="eyebrow">Performance</div>
    <div class="rule"></div>
    <h1 class="sm">Entrenar<br>con método,<br>no con<br>suerte</h1>
    <p class="lead">Programas de alta exigencia, planificación técnica y
      monitoreo de cargas bajo metodologías de <b>estándar internacional</b>.</p>
    <div class="tags">Todo queda registrado en la plataforma FRACTALE</div>
  </div>
</div>""" + foot()))

# 05 · equipo médico
H.append(("05-equipo-medico", f"""
<div class="inner">{top("05")}
  <div class="mid">
    <div class="eyebrow">Salud &amp; bienestar</div>
    <div class="rule"></div>
    <h1 class="sm">Un equipo<br>médico<br>detrás de<br>cada atleta</h1>
    <p class="lead">Médico deportivo, nutricionista y laboratorio.
      Cobertura especializada orientada a la optimización biomecánica,
      metabólica y a <b>acelerar la recuperación</b>.</p>
  </div>
  <ul>
    <li><span>—</span><div><b>Ficha médica y nutricional</b><i>Compartida con todo el equipo, en un solo lugar</i></div></li>
    <li><span>—</span><div><b>Composición corporal</b><i>Medida y seguida en el tiempo</i></div></li>
    <li><span>—</span><div><b>Exámenes y documentos</b><i>Guardados de forma privada</i></div></li>
  </ul>
</div>""" + foot()))

# 06 · auspicios
H.append(("06-auspicios", fondo("under-armour.jpg") + f"""
<div class="inner">{top("06")}
  <div class="mid">
    <div class="eyebrow">Marketing &amp; gestión comercial</div>
    <h1>Buscamos<br>los auspicios<br>que tu<br>carrera<br>necesita</h1>
    <p class="lead">Posicionamiento de marca personal, gestión de prensa,
      patrocinio y <b>consecución de financiamiento privado</b>.
      El atleta no tiene que negociar solo.</p>
  </div>
</div>""" + foot()))

# 07 · alianzas
H.append(("07-alianzas", f"""
<div class="inner">{top("07")}
  <div class="mid">
    <div class="eyebrow">Respaldados por un ecosistema de clase mundial</div>
    <h1 class="sm">Nuestra red<br>de alianzas<br>oficiales</h1>
    <div class="marcas">
      <div><img src="{RAIZ}/assets/marcas/fthaus.png" alt="Fthaus"></div>
      <div><img src="{RAIZ}/assets/marcas/patagonia-medical.png" alt="Patagonia Medical"></div>
      <div><img src="{RAIZ}/assets/marcas/under-armour.png" alt="Under Armour"></div>
      <div><img src="{RAIZ}/assets/marcas/winkler-nutrition.png" alt="Winkler Nutrition"></div>
    </div>
    <div class="tags">Centro clínico y de entrenamiento · Laboratorio y centro médico ·
      Indumentaria de alto rendimiento · Suplementación deportiva</div>
  </div>
</div>""" + foot()))

# 08 · eventos
H.append(("08-eventos", fondo("meta.jpg") + f"""
<div class="inner">{top("08")}
  <div class="mid">
    <div class="eyebrow">02 · Eventos deportivos de alto estándar</div>
    <h1>Donde las<br>marcas dejan<br>de ser<br>pancartas</h1>
    <p class="lead">Trazados, activaciones y logística con estándares
      internacionales. La marca entra en la narrativa del evento:
      <b>race village, recuperación, premiación y contenido</b>.</p>
    <div class="tags">Media Maratón Internacional Ruta de los Ulmos</div>
  </div>
</div>""" + foot()))

# 09 · propuesta B2B
H.append(("09-marcas-b2b", f"""
<div class="inner">{top("09")}
  <div class="mid">
    <div class="eyebrow">03 · Propuesta de valor B2B</div>
    <div class="rule"></div>
    <h1 class="sm">¿Por qué<br>aliarse con<br>FRACTALE?</h1>
  </div>
  <ul>
    <li><span>01</span><div><b>Posicionamiento territorial exclusivo</b></div></li>
    <li><span>02</span><div><b>Retorno directo y medible</b><i>Activaciones alineadas a sus KPI</i></div></li>
    <li><span>03</span><div><b>Asociación a atletas de élite</b></div></li>
    <li><span>04</span><div><b>Responsabilidad social &amp; ESG</b></div></li>
    <li><span>05</span><div><b>Carga operativa cero</b><i>Gestionamos, activamos y reportamos</i></div></li>
  </ul>
</div>""" + foot(der="Propuesta para marcas")))

# 10 · cierre
H.append(("10-contacto", fondo("podio.jpg") + f"""
<div class="inner">{top("10")}
  <div class="mid" style="margin-bottom:40px">
    <h1>¿Cuál<br>es tu<br>meta?</h1>
  </div>
  <div class="dosb">
    <div class="caja"><h3>Soy deportista</h3>
      <p>Entrena, registra y deja que tu equipo —entrenador, médico y
         nutricionista— siga tu progreso en la plataforma.</p></div>
    <div class="caja"><h3>Soy una marca</h3>
      <p>Agende una reunión de alineación estratégica.
         Fractalechile@gmail.com</p></div>
  </div>
</div>""" + foot(der="El éxito está en el sur")))

for nombre, cuerpo in H:
    (SALIDA / f"{nombre}.html").write_text(BASE.replace("__CUERPO__", cuerpo), encoding="utf-8")
print("\n".join(n for n, _ in H))
