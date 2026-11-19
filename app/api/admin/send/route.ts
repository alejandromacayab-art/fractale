import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { enviarMasivo } from "@/lib/email";

const schema = z.object({
  evento_slug: z.string(),
  asunto: z.string().min(3),
  mensaje_html: z.string().min(3),
  // opcional: segmentar, p. ej. solo quienes pasaron por el stand o compraron FORCE
  solo_con_interaccion: z
    .enum(["visita_stand", "recovery", "compra_force", "uso_plataforma", "sigue_instagram"])
    .optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { evento_slug, asunto, mensaje_html, solo_con_interaccion } = parsed.data;

  const { data: ev } = await supabaseAdmin.from("eventos").select("id").eq("slug", evento_slug).single();
  if (!ev) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

  // Solo personas que autorizaron y no se dieron de baja
  const { data: ins } = await supabaseAdmin
    .from("inscritos").select("id,email,nombre,token")
    .eq("evento_id", ev.id).eq("acepta_comunicaciones", true).eq("comunicaciones_activas", true)
    .range(0, 19999);

  let destinatarios = ins ?? [];
  if (solo_con_interaccion) {
    const { data: inter } = await supabaseAdmin
      .from("interacciones").select("inscrito_id").eq("evento_id", ev.id).eq("tipo", solo_con_interaccion)
      .range(0, 99999);
    const ok = new Set((inter ?? []).map((i) => i.inscrito_id));
    destinatarios = destinatarios.filter((d) => ok.has(d.id));
  }

  await enviarMasivo(destinatarios, asunto, mensaje_html);
  await supabaseAdmin.from("envios").insert({ evento_id: ev.id, asunto, destinatarios: destinatarios.length });
  return NextResponse.json({ ok: true, enviados: destinatarios.length });
}
