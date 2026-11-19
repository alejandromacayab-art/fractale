import EfectosPortada from "./efectos-portada";

export default function Portada() {
  return (
    <>
      <EfectosPortada />

      {/* barra global */}
      <nav className="gnav" id="head" aria-label="Global">
        <div className="wrap">
          <a className="brand" href="#top" aria-label="FRACTALE Sport Management, inicio">
            <img src="/assets/logo-light.png" alt="FRACTALE Sport Management" />
          </a>
          <div className="links">
            <a href="#atletas">Atletas</a>
            <a href="#alianzas">Alianzas</a>
            <a href="#eventos">Eventos</a>
            <a href="#marcas">Marcas</a>
            <a href="#terreno">En terreno</a>
            <a href="#contacto">Contacto</a>
            <a href="/panel.html">Panel del equipo</a>
          </div>
          <a className="btn btn-blue btn-sm" href="/inscripcion">Inscríbete</a>
          <a className="icon" href="/app.html" aria-label="Entrar a mi cuenta">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8.5" r="4" />
              <path d="M4.5 21c.8-4 3.9-6 7.5-6s6.7 2 7.5 6" /></svg>
          </a>
          <button className="icon burger" id="burger" aria-label="Menú" aria-expanded="false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M4 9h16M4 15h16" /></svg>
          </button>
        </div>
      </nav>

      <div className="sheet" id="sheet">
        <a href="#atletas">Atletas</a>
        <a href="#alianzas">Alianzas</a>
        <a href="#eventos">Eventos</a>
        <a href="#marcas">Marcas</a>
        <a href="#terreno">En terreno</a>
        <a href="#contacto">Contacto</a>
        <hr />
        <a className="chico" href="/inscripcion">Inscríbete a la Media Maratón</a>
        <a className="chico" href="/app.html">Soy deportista</a>
        <a className="chico" href="/panel.html">Panel del equipo</a>
        <a className="chico" href="https://instagram.com/fractale.cl" target="_blank" rel="noopener">@fractale.cl</a>
      </div>

      <div className="ribbon">
        Media Maratón Internacional Ruta de los Ulmos: gestión y producción de eventos de alto estándar.
        {" "}<a className="more" href="/inscripcion">Inscríbete</a>
      </div>

      <main id="top">

        {/* portada */}
        <section className="hero" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <p className="eyebrow">FRACTALE Sport Management</p>
            <h1 className="display">El éxito está en el sur.</h1>
            <p className="lead">Profesionalizamos carreras deportivas y llevamos a las marcas a los eventos clave del sur de Chile.</p>
            <div className="ctas">
              <a className="btn btn-blue" href="/inscripcion">Inscríbete</a>
              <a className="btn btn-line" href="#contacto">Agendar reunión</a>
              <a className="btn btn-line" href="#marcas">Propuesta para marcas</a>
            </div>
          </div>
          <div className="portada"><div role="img" aria-label="Bahía de Puerto Montt"></div>
            <p className="foto-pie">Puerto Montt, Región de Los Lagos.</p></div>
        </section>

        {/* manifiesto */}
        <section className="night" style={{ marginTop: 110 }}>
          <div className="wrap">
            <div className="manifest">
              <p className="eyebrow">El paradigma que rompemos</p>
              <h2 className="headline">El alto rendimiento ya no pide permiso en la capital.</h2>
              <p>El sur de Chile tiene <b>las condiciones geográficas, climáticas y humanas más exigentes del territorio</b>:
                una cuna natural de resiliencia, disciplina y potencial deportivo de clase mundial.
                Aun así, el alto rendimiento estuvo condicionado a la centralización.</p>
              <p>En FRACTALE demostramos que <b>no es necesario migrar a Santiago para llegar a la élite.</b>
                Profesionalizamos la carrera del deportista y ofrecemos a las marcas
                <b> una entrada auténtica, estructurada y rentable</b> a un mercado con una identidad
                y una fidelidad incomparables.</p>
              <p className="quote">El éxito está en el sur.</p>
            </div>
          </div>
        </section>

        {/* acompañamiento 360 */}
        <section id="atletas" className="gray">
          <div className="wide">
            <div className="railhead">
              <div>
                <p className="eyebrow mini">Acompañamiento integral 360°</p>
                <h2 className="headline">Descentralizando la élite.</h2>
                <p className="lead">Liberamos al atleta de la carga operativa, administrativa y médica para que ponga toda su energía en rendir y ganar.</p>
              </div>
              <div className="arrows">
                <button className="arrow" data-rail="prev" aria-label="Anterior">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg></button>
                <button className="arrow" data-rail="next" aria-label="Siguiente">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg></button>
              </div>
            </div>
            <div className="rail" id="rail">
              <article className="card">
                <div className="art foto f-karate" role="img" aria-label="Deportista de karate en competencia"></div>
                <div className="txt"><p className="k">Performance</p>
                  <h4>Entrenar con estándar internacional.</h4>
                  <p>Programas de alta exigencia, planificación técnica y monitoreo de cargas.</p></div>
              </article>
              <article className="card">
                <div className="art foto f-patagonia" role="img" aria-label="Centro médico Patagonia Medical"></div>
                <div className="txt"><p className="k">Salud y bienestar</p>
                  <h4>Medicina y nutrición que aceleran la recuperación.</h4>
                  <p>Cobertura médica especializada y nutrición deportiva orientada al rendimiento.</p></div>
              </article>
              <article className="card">
                <div className="art foto f-ua" role="img" aria-label="Marca Under Armour junto a FRACTALE"></div>
                <div className="txt"><p className="k">Marketing y gestión comercial</p>
                  <h4>Una marca personal que atrae patrocinio.</h4>
                  <p>Posicionamiento, gestión de prensa, patrocinios y financiamiento privado.</p></div>
              </article>
            </div>
          </div>
        </section>

        {/* alianzas */}
        <section id="alianzas">
          <div className="wrap">
            <div className="center">
              <p className="eyebrow mini">Respaldados por un ecosistema de clase mundial</p>
              <h2 className="headline">Nuestra red de alianzas oficiales.</h2>
              <p className="lead muted" style={{ maxWidth: "34ch", marginLeft: "auto", marginRight: "auto" }}>Para que nuestros atletas entrenen con los mejores estándares del país.</p>
            </div>
            <div className="allies">
              <article><div className="logo"><img className="l-patagonia" src="/assets/marcas/patagonia-medical.png" alt="Patagonia Medical" /></div>
                <h4>Patagonia Medical</h4><p>Laboratorio y centro médico integral especializado en alta competencia.</p></article>
              <article><div className="logo"><img className="l-ua" src="/assets/marcas/under-armour.png" alt="Under Armour" /></div>
                <h4>Under Armour</h4><p>Indumentaria e ingeniería deportiva que viste y equipa a nuestra nómina.</p></article>
              <article><div className="logo"><img className="l-winkler" src="/assets/marcas/winkler-nutrition.png" alt="Winkler Nutrition" /></div>
                <h4>Winkler Nutrition</h4><p>Empresa chilena de suplementos deportivos y alimenticios.</p></article>
            </div>
            <p className="allies-tit">Colaboradores.</p>
            <div className="allies" style={{ marginTop: 24 }}>
              <article><div className="logo"><img className="l-fthaus" src="/assets/marcas/fthaus.png" alt="FThaus" /></div>
                <h4>Fthaus</h4><p>Centro clínico y de entrenamiento de vanguardia técnica y metodológica.</p></article>
              <article><div className="logo"><img className="l-redbull" src="/assets/marcas/red-bull.png" alt="Red Bull" /></div>
                <h4>Red Bull</h4><p>Referente mundial en el apoyo al deporte de alto rendimiento.</p></article>
              <article><div className="logo"><img className="l-oxxean" src="/assets/marcas/oxxean.png" alt="Oxxean" /></div>
                <h4>Oxxean</h4><p>Empresa del sur que respalda a nuestros atletas en su propio territorio.</p></article>
            </div>
            <div className="pertenencia">
              <b>Sentido de pertenencia.</b>
              <p>Atletas orgullosos de su origen, respaldados por una estructura que nada tiene que envidiar a las grandes capitales latinoamericanas.</p>
            </div>
          </div>
        </section>

        {/* eventos */}
        <section id="eventos" style={{ paddingTop: 0 }}>
          <div className="wide">
            <div className="bigtile">
              <div className="art foto f-meta" role="img" aria-label="Largada de la corrida, arco de meta"></div>
              <div>
                <p className="eyebrow mini" style={{ color: "rgba(255,255,255,.8)" }}>Eventos deportivos de alto estándar</p>
                <h2 className="title">Conexión real y territorio.</h2>
                <p className="lead muted" style={{ maxWidth: "36ch", fontSize: "clamp(17px,1.8vw,21px)" }}>En el sur el deporte es identidad comunitaria. Convertimos cada evento en una plataforma donde las marcas son protagonistas, no pancartas.</p>
                <div className="ctas" style={{ justifyContent: "flex-start" }}>
                  <a className="btn btn-white" href="/inscripcion">Inscríbete a la Media Maratón</a>
                  <a className="btn btn-line" href="#contacto">Sumar mi marca a un evento</a>
                </div>
              </div>
              <div className="trio">
                <div><b>Producción e inmersión</b><span>Trazados, activaciones y logística con estándares internacionales.</span></div>
                <div><b>Activación de activos</b><span>La marca en cada punto de contacto: recuperación, race village, premiación y contenido.</span></div>
                <div><b>Impacto orgánico</b><span>Vínculos profundos con audiencias comprometidas con el bienestar y la vida al aire libre.</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* propuesta b2b */}
        <section id="marcas" className="gray">
          <div className="wrap">
            <div className="center">
              <p className="eyebrow mini">Propuesta de valor B2B</p>
              <h2 className="headline">¿Por qué aliarse con FRACTALE?</h2>
              <p className="lead muted" style={{ maxWidth: "36ch", marginLeft: "auto", marginRight: "auto" }}>No es un patrocinio tradicional. Es una inversión en posicionamiento, reputación y retorno.</p>
            </div>
            <div className="bento">
              <div className="b w3"><span className="n">01</span><b>Posicionamiento territorial exclusivo.</b>
                <p>Domine el segmento de mayor crecimiento del sur asociándose a la descentralización y al orgullo regional.</p></div>
              <div className="b w3"><span className="n">02</span><b>Retorno directo y medible.</b>
                <p>Activaciones B2C y B2B alineadas a sus KPI: de leads a punto de venta y beneficios corporativos.</p></div>
              <div className="b"><span className="n">03</span><b>Atletas de élite.</b>
                <p>Resiliencia, innovación y alto desempeño, contados por nuestros deportistas.</p></div>
              <div className="b"><span className="n">04</span><b>Responsabilidad social y ESG.</b>
                <p>Desarrollo deportivo local con métricas transparentes de impacto.</p></div>
              <div className="b"><span className="n">05</span><b>Carga operativa cero.</b>
                <p>Gestionamos, activamos y reportamos su presencia de principio a fin.</p></div>
            </div>
          </div>
        </section>

        {/* galería del perfil */}
        <section id="terreno">
          <div className="wrap">
            <div className="center">
              <p className="eyebrow mini">En terreno</p>
              <h2 className="headline">Lo que hacemos, semana a semana.</h2>
              <p className="lead muted">Competencias, eventos y trabajo con marcas.</p>
              <div className="ctas"><a className="more" href="https://instagram.com/fractale.cl" target="_blank" rel="noopener">Seguir a @fractale.cl</a></div>
            </div>
            <div className="galeria">
              <a href="https://instagram.com/fractale.cl" target="_blank" rel="noopener" aria-label="Podio de nuestras deportistas, en Instagram">
                <span className="ig">@fractale.cl</span><div className="foto f-podio"></div></a>
              <a href="https://instagram.com/fractale.cl" target="_blank" rel="noopener" aria-label="Trail de 65 kilómetros, en Instagram">
                <span className="ig">@fractale.cl</span><div className="foto f-trail"></div></a>
              <a href="https://instagram.com/fractale.cl" target="_blank" rel="noopener" aria-label="Evento de fútbol gestionado por FRACTALE, en Instagram">
                <span className="ig">@fractale.cl</span><div className="foto f-futbol"></div></a>
            </div>
          </div>
        </section>

        {/* dos entradas */}
        <div className="duo">
          <article className="tile light">
            <h3 className="title">Soy deportista</h3>
            <p>Entrena, registra y deja que tu equipo siga tu progreso.</p>
            <div className="ctas"><a className="btn btn-blue btn-sm" href="/app.html">Entrar a la plataforma</a></div>
            <div className="glyph"><img src="/assets/symbol-light.png" alt="" aria-hidden="true" /></div>
          </article>
          <article className="tile dark">
            <h3 className="title">Soy una marca</h3>
            <p>Integre sus objetivos comerciales en nuestra estructura.</p>
            <div className="ctas"><a className="btn btn-blue btn-sm" href="#contacto">Agendar reunión</a></div>
            <div className="glyph"><img src="/assets/symbol-dark.png" alt="" aria-hidden="true" /></div>
          </article>
        </div>

        {/* llamada final */}
        <section className="final" id="contacto">
          <div className="wrap">
            <p className="eyebrow mini">¿Cuál es tu meta?</p>
            <h2 className="headline">El deporte en el sur cambió. Sea parte del liderazgo.</h2>
            <p className="lead">Las marcas pioneras no esperan a que los mercados se consoliden: los construyen.</p>
            <div className="ctas">
              <a className="btn btn-blue" href="mailto:Fractalechile@gmail.com?subject=Reuni%C3%B3n%20de%20alineaci%C3%B3n%20estrat%C3%A9gica">Escribir a FRACTALE</a>
              <a className="btn btn-line" href="https://instagram.com/fractale.cl" target="_blank" rel="noopener">Seguir en Instagram</a>
            </div>
          </div>
        </section>

      </main>

      <footer>
        <div className="wrap">
          <p className="nota">FRACTALE Sport Management trabaja con atletas, eventos y marcas desde Puerto Montt, Región de Los Lagos, Chile. Escríbenos a <a href="mailto:Fractalechile@gmail.com" style={{ color: "var(--link)" }}>Fractalechile@gmail.com</a>.</p>
          <div className="cols">
            <div><h5>Atletas</h5>
              <a href="#atletas">Acompañamiento 360°</a><a href="#atletas">Performance</a>
              <a href="#atletas">Salud y bienestar</a><a href="#atletas">Marketing y gestión</a>
              <a href="/app.html">Plataforma del deportista</a></div>
            <div><h5>Marcas</h5>
              <a href="#marcas">Propuesta B2B</a><a href="#eventos">Eventos</a>
              <a href="#alianzas">Alianzas</a><a href="#contacto">Agendar reunión</a></div>
            <div><h5>Equipo</h5>
              <a href="/panel.html">Panel</a><a href="/panel.html">Entrenadores</a>
              <a href="/panel.html">Médicos</a><a href="/panel.html">Nutricionistas</a></div>
            <div><h5>FRACTALE</h5>
              <a href="#top">Quiénes somos</a>
              <a href="/inscripcion">Inscripciones</a>
              <a href="https://instagram.com/fractale.cl" target="_blank" rel="noopener">Instagram</a>
              <a href="#contacto">Contacto</a></div>
            <div><h5>Dónde estamos</h5>
              <p>Puerto Montt, Región de Los Lagos, Chile.</p>
              <p>Instagram oficial: @fractale.cl</p></div>
          </div>
          <div className="legal">
            <span>Copyright © {new Date().getFullYear()} FRACTALE Sport Management. Todos los derechos reservados.</span>
            <span className="spacer"></span>
            <span><a href="/terminos">Términos y privacidad</a></span>
            <span className="spacer"></span>
            <span>Puerto Montt · Chile</span>
          </div>
        </div>
      </footer>
    </>
  );
}
