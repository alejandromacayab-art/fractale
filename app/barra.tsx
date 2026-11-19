/** Barra mínima para las páginas internas, con la misma marca que la portada. */
export default function Barra() {
  return (
    <nav className="barra" aria-label="Global">
      <div className="wrap">
        <a href="/" aria-label="FRACTALE Sport Management, inicio">
          <img src="/assets/logo-light.png" alt="FRACTALE Sport Management" />
        </a>
        <a className="vuelta" href="/">Volver a la portada</a>
      </div>
    </nav>
  );
}
