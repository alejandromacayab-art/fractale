import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sitio } from "@/lib/email";

export default async function Ticket({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: ins } = await supabaseAdmin
    .from("inscritos")
    .select("nombre,categoria,eventos(nombre,fecha)")
    .eq("token", token)
    .single();
  if (!ins) notFound();

  // El QR abre la ficha del participante en el panel del stand (protegida con contraseña).
  const svg = await QRCode.toString(`${sitio()}/admin/stand/${token}`, { type: "svg", margin: 1, width: 280 });
  const ev = ins.eventos as unknown as { nombre: string; fecha: string };

  return (
    <main style={{ maxWidth: 360, margin: "40px auto", textAlign: "center", fontFamily: "Arial" }}>
      <h2>{ev.nombre}</h2>
      <p><b>{ins.nombre}</b><br />Categoría {ins.categoria}</p>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <p style={{ fontSize: 12, color: "#777" }}>Presenta este QR al retirar tu kit y en el stand de FRACTALE.</p>
    </main>
  );
}
