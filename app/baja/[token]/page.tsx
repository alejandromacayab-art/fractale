import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function Baja({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: ins } = await supabaseAdmin
    .from("inscritos").select("email,comunicaciones_activas").eq("token", token).single();
  if (!ins) notFound();

  async function darDeBaja() {
    "use server";
    await supabaseAdmin.from("inscritos").update({ comunicaciones_activas: false }).eq("token", token);
  }

  return (
    <main style={{ maxWidth: 420, margin: "60px auto", fontFamily: "Arial", textAlign: "center" }}>
      {ins.comunicaciones_activas ? (
        <form action={darDeBaja}>
          <h2>¿Dejar de recibir correos?</h2>
          <p>{ins.email}</p>
          <button style={{ padding: "10px 20px" }}>Confirmar baja</button>
        </form>
      ) : (
        <h2>Listo, no recibirás más correos de promociones.</h2>
      )}
    </main>
  );
}
