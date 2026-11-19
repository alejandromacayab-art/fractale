import { Resend } from "resend";

// Igual que el cliente de Supabase: se crea al primer uso, no al importar.
let resend: Resend | null = null;
const correo = () => (resend ??= new Resend(process.env.RESEND_API_KEY!));

const FROM = () => process.env.EMAIL_FROM ?? "Fractale <inscripciones@tudominio.cl>";
export const sitio = () => process.env.SITE_URL ?? "http://localhost:3000";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const wrap = (inner: string, footer = "") => `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
  ${inner}
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0"/>
  <p style="font-size:12px;color:#777">FRACTALE Sport Management · Puerto Montt, Chile<br/>${footer}</p>
</div>`;

export async function enviarConfirmacion(p: {
  email: string; nombre: string; evento: string; categoria: string; token: string;
}) {
  const link = `${sitio()}/ticket/${p.token}`;
  return correo().emails.send({
    from: FROM(),
    to: p.email,
    subject: `Inscripción confirmada · ${p.evento}`,
    html: wrap(`
      <h2>¡Hola ${esc(p.nombre)}!</h2>
      <p>Tu inscripción a <b>${esc(p.evento)}</b> quedó registrada en la categoría <b>${esc(p.categoria)}</b>.</p>
      <p>Tu código QR de acreditación está aquí. Guárdalo, lo necesitarás para retirar tu kit:</p>
      <p><a href="${link}" style="background:#111;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">Ver mi QR</a></p>
    `),
  });
}

// Envío masivo en lotes de 100 (límite de Resend batch). Incluye link de baja.
export async function enviarMasivo(
  destinatarios: { email: string; nombre: string; token: string }[],
  asunto: string,
  mensajeHtml: string
) {
  for (let i = 0; i < destinatarios.length; i += 100) {
    const lote = destinatarios.slice(i, i + 100).map((d) => ({
      from: FROM(),
      to: d.email,
      subject: asunto,
      html: wrap(
        `<p>Hola ${esc(d.nombre)},</p>${mensajeHtml}`,
        `<a href="${sitio()}/baja/${d.token}">Dejar de recibir estos correos</a>`
      ),
    }));
    await correo().batch.send(lote);
  }
}
