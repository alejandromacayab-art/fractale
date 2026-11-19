import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ACCIONES = [
  ["visita_stand", "Pasó por el stand"],
  ["recovery", "Se hizo recovery"],
  ["compra_force", "Compró FORCE"],
  ["uso_plataforma", "Usó la plataforma"],
  ["sigue_instagram", "Sigue en Instagram"],
] as const;

export default async function Stand({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: ins } = await supabaseAdmin
    .from("inscritos")
    .select("id,evento_id,nombre,categoria,email")
    .eq("token", token)
    .single();
  if (!ins) notFound();

  const { data: hechas } = await supabaseAdmin
    .from("interacciones").select("tipo").eq("inscrito_id", ins.id);
  const activas = new Set((hechas ?? []).map((h) => h.tipo));

  async function toggle(formData: FormData) {
    "use server";
    const tipo = String(formData.get("tipo"));
    if (!ACCIONES.some(([t]) => t === tipo)) return;
    const { data: existe } = await supabaseAdmin
      .from("interacciones").select("id").eq("inscrito_id", ins!.id).eq("tipo", tipo).maybeSingle();

    if (existe) {
      await supabaseAdmin.from("interacciones").delete().eq("id", existe.id);
    } else {
      const filas = [{ evento_id: ins!.evento_id, inscrito_id: ins!.id, tipo }];
      // Cualquier acción implica que pasó por el stand
      if (tipo !== "visita_stand")
        filas.push({ evento_id: ins!.evento_id, inscrito_id: ins!.id, tipo: "visita_stand" });
      await supabaseAdmin.from("interacciones")
        .upsert(filas, { onConflict: "inscrito_id,tipo", ignoreDuplicates: true });
    }
    revalidatePath(`/admin/stand/${token}`);
  }

  return (
    <main style={{ maxWidth: 420, margin: "24px auto", padding: 16, fontFamily: "Arial" }}>
      <h2 style={{ marginBottom: 0 }}>{ins.nombre}</h2>
      <p style={{ marginTop: 4, color: "#666" }}>{ins.categoria} · {ins.email}</p>
      {ACCIONES.map(([tipo, label]) => {
        const on = activas.has(tipo);
        return (
          <form action={toggle} key={tipo}>
            <input type="hidden" name="tipo" value={tipo} />
            <button style={{
              width: "100%", padding: 16, margin: "6px 0", fontSize: 16, borderRadius: 8,
              border: "1px solid #111", background: on ? "#111" : "#fff", color: on ? "#fff" : "#111",
            }}>
              {on ? "✓ " : ""}{label}
            </button>
          </form>
        );
      })}
      <p><a href="/admin">← Volver al panel</a></p>
    </main>
  );
}
