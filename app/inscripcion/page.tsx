"use client";
import { useState } from "react";
import Barra from "../barra";

const EVENTO_SLUG = "media-maraton-los-ulmos";
const CATEGORIAS = ["21K", "10K", "5K"];
const TALLAS = ["XS", "S", "M", "L", "XL", "XXL"];

export default function Inscripcion() {
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("enviando");
    // /inscripcion?origen=stand → para registrar a alguien en tablet desde el stand
    const origen = new URLSearchParams(window.location.search).get("origen") === "stand" ? "stand" : "web";
    const f = new FormData(e.currentTarget);
    const body = {
      evento_slug: EVENTO_SLUG,
      origen,
      nombre: f.get("nombre"),
      rut: f.get("rut"),
      email: f.get("email"),
      telefono: f.get("telefono"),
      fecha_nacimiento: f.get("fecha_nacimiento"),
      genero: f.get("genero"),
      categoria: f.get("categoria"),
      talla_polera: f.get("talla_polera"),
      ciudad: f.get("ciudad"),
      club: f.get("club"),
      contacto_emergencia: f.get("contacto_emergencia"),
      acepta_terminos: f.get("acepta_terminos") === "on",
      acepta_comunicaciones: f.get("acepta_comunicaciones") === "on",
      website: f.get("website"),
    };
    const formulario = e.currentTarget;
    const res = await fetch("/api/inscripcion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setEstado("ok");
      formulario.reset();
    } else {
      setEstado("error");
      setMsg(data.error ?? "Ocurrió un error.");
    }
  }

  if (estado === "ok")
    return (
      <>
        <Barra />
        <main className="listo">
          <div className="tic" aria-hidden="true">✓</div>
          <h1 className="title">¡Inscripción lista!</h1>
          <p>Te enviamos un correo de confirmación con tu código QR. Guárdalo: lo necesitarás para retirar tu kit.</p>
          <div className="ctas"><a className="btn btn-line" href="/">Volver a la portada</a></div>
        </main>
      </>
    );

  return (
    <>
      <Barra />
      <main className="hoja">
        <p className="eyebrow mini">Media Maratón Internacional Ruta de los Ulmos</p>
        <h1 className="title">Inscríbete.</h1>
        <p className="lead">Completa tus datos y recibirás por correo tu confirmación con el código QR de acreditación.</p>

        <form className="ficha" onSubmit={onSubmit}>
          <fieldset className="grupo">
            <legend>Tus datos</legend>
            <div className="rejilla">
              <label className="campo ancho"><span>Nombre completo <i className="req">*</i></span>
                <input name="nombre" required autoComplete="name" /></label>
              <label className="campo"><span>RUT</span>
                <input name="rut" placeholder="12.345.678-9" /></label>
              <label className="campo"><span>Fecha de nacimiento</span>
                <input name="fecha_nacimiento" type="date" /></label>
              <label className="campo"><span>Correo <i className="req">*</i></span>
                <input name="email" type="email" required autoComplete="email" /></label>
              <label className="campo"><span>Teléfono</span>
                <input name="telefono" type="tel" autoComplete="tel" /></label>
              <label className="campo"><span>Género</span>
                <select name="genero" defaultValue="">
                  <option value="">—</option>
                  <option>Femenino</option><option>Masculino</option><option>Otro</option>
                </select></label>
              <label className="campo"><span>Ciudad</span>
                <input name="ciudad" /></label>
            </div>
          </fieldset>

          <fieldset className="grupo">
            <legend>La carrera</legend>
            <div className="rejilla">
              <label className="campo"><span>Categoría <i className="req">*</i></span>
                <select name="categoria" required defaultValue="">
                  <option value="" disabled>Selecciona…</option>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select></label>
              <label className="campo"><span>Talla de polera</span>
                <select name="talla_polera" defaultValue="">
                  <option value="">—</option>
                  {TALLAS.map((t) => <option key={t}>{t}</option>)}
                </select></label>
              <label className="campo ancho"><span>Club o equipo</span>
                <input name="club" /></label>
              <label className="campo ancho"><span>Contacto de emergencia (nombre y teléfono)</span>
                <input name="contacto_emergencia" /></label>
            </div>
          </fieldset>

          {/* Honeypot: los humanos no lo ven */}
          <input name="website" tabIndex={-1} autoComplete="off" className="oculto" aria-hidden="true" />

          <fieldset className="grupo">
            <legend>Autorizaciones</legend>
            <label className="visto-bueno">
              <input type="checkbox" name="acepta_terminos" required />
              <span>Acepto los <a href="/terminos" target="_blank">términos y condiciones</a> del evento. *</span>
            </label>
            <label className="visto-bueno">
              <input type="checkbox" name="acepta_comunicaciones" required />
              <span>
                Autorizo que mi correo electrónico sea usado por FRACTALE Sport Management y por las marcas
                auspiciadoras del evento para enviarme información, beneficios y novedades. Puedo darme de baja
                en cualquier momento. *
              </span>
            </label>
          </fieldset>

          {estado === "error" && <p className="aviso">{msg}</p>}
          <button className="btn btn-blue btn-ancho" disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando…" : "Inscribirme"}
          </button>
          <p className="nota-legal">
            Tus datos se tratan conforme a nuestra <a href="/terminos">política de privacidad</a>.
            Los campos marcados con * son obligatorios.
          </p>
        </form>
      </main>
    </>
  );
}
