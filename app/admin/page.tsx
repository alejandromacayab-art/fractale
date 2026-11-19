import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const EMBUDO = [
  ["visita_stand", "Pasaron por el stand"],
  ["recovery", "Se hicieron recovery"],
  ["compra_force", "Compraron FORCE"],
  ["uso_plataforma", "Usaron la plataforma"],
  ["sigue_instagram", "Siguen en Instagram"],
] as const;

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");

export default async function Admin({
  searchParams,
}: { searchParams: Promise<{ evento?: string; q?: string }> }) {
  const sp = await searchParams;

  const { data: eventos } = await supabaseAdmin
    .from("eventos").select("id,slug,nombre,fecha").order("fecha", { ascending: false });
  const evento = eventos?.find((e) => e.slug === sp.evento) ?? eventos?.[0];
  if (!evento) return <main style={{ padding: 24 }}>No hay eventos.</main>;

  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const total = await count(
    supabaseAdmin.from("inscritos").select("id", { count: "exact", head: true }).eq("evento_id", evento.id));
  const conCorreo = await count(
    supabaseAdmin.from("inscritos").select("id", { count: "exact", head: true })
      .eq("evento_id", evento.id).eq("acepta_comunicaciones", true).eq("comunicaciones_activas", true));
  const porTipo: Record<string, number> = {};
  for (const [tipo] of EMBUDO) {
    porTipo[tipo] = await count(
      supabaseAdmin.from("interacciones").select("id", { count: "exact", head: true })
        .eq("evento_id", evento.id).eq("tipo", tipo));
  }
  const visitas = porTipo["visita_stand"];

  let resultados: { token: string; nombre: string; email: string; categoria: string }[] = [];
  if (sp.q) {
    const q = sp.q.replace(/[%,()]/g, "");
    const { data } = await supabaseAdmin.from("inscritos")
      .select("token,nombre,email,categoria").eq("evento_id", evento.id)
      .or(`nombre.ilike.%${q}%,email.ilike.%${q}%,rut.ilike.%${q}%`).limit(15);
    resultados = data ?? [];
  }

  const th = { textAlign: "left", padding: 8, borderBottom: "2px solid #111" } as const;
  const td = { padding: 8, borderBottom: "1px solid #ddd" } as const;

  return (
    <main style={{ maxWidth: 760, margin: "24px auto", padding: 16, fontFamily: "Arial" }}>
      <h1>{evento.nombre}</h1>
      <p>
        <b>{total}</b> inscritos · <b>{conCorreo}</b> con correo autorizado ({pct(conCorreo, total)}) ·{" "}
        <a href={`/api/admin/export?evento=${evento.slug}`}>Descargar Excel (CSV)</a>
      </p>

      <h2>Embudo del stand</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Métrica</th><th style={th}>Personas</th>
            <th style={th}>% del total</th><th style={th}>% de quienes pasaron por el stand</th>
          </tr>
        </thead>
        <tbody>
          {EMBUDO.map(([tipo, label]) => (
            <tr key={tipo}>
              <td style={td}>{label}</td>
              <td style={td}>{porTipo[tipo]}</td>
              <td style={td}>{pct(porTipo[tipo], total)}</td>
              <td style={td}>{tipo === "visita_stand" ? "—" : pct(porTipo[tipo], visitas)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Registrar a un participante</h2>
      <form>
        <input name="q" defaultValue={sp.q} placeholder="Nombre, correo o RUT" style={{ padding: 10, width: "70%" }} />
        <button style={{ padding: 10 }}>Buscar</button>
      </form>
      <ul>
        {resultados.map((r) => (
          <li key={r.token} style={{ margin: "8px 0" }}>
            <a href={`/admin/stand/${r.token}`}>{r.nombre}</a> · {r.categoria} · {r.email}
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 13, color: "#666" }}>
        Tip: escanea el QR del participante con la cámara del celular y se abre directo su ficha.
        Si alguien no está inscrito, usa <a href="/inscripcion?origen=stand">/inscripcion?origen=stand</a> en una tablet.
      </p>
    </main>
  );
}
