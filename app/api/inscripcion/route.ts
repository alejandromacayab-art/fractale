import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { enviarConfirmacion } from "@/lib/email";

const schema = z.object({
  evento_slug: z.string().min(1),
  nombre: z.string().trim().min(3).max(120),
  rut: z.string().trim().max(15).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email(),
  telefono: z.string().trim().max(20).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  genero: z.string().optional().or(z.literal("")),
  categoria: z.string().min(1),
  talla_polera: z.string().optional().or(z.literal("")),
  ciudad: z.string().trim().max(80).optional().or(z.literal("")),
  club: z.string().trim().max(80).optional().or(z.literal("")),
  contacto_emergencia: z.string().trim().max(160).optional().or(z.literal("")),
  acepta_terminos: z.literal(true),
  acepta_comunicaciones: z.literal(true),
  origen: z.enum(["web", "stand"]).default("web"),
  website: z.string().optional(), // honeypot anti-bots
});

const nul = (v?: string) => (v ? v : null);

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa los datos del formulario." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot: fingimos éxito

  const { data: evento } = await supabaseAdmin
    .from("eventos").select("id,nombre").eq("slug", d.evento_slug).eq("activo", true).single();
  if (!evento) return NextResponse.json({ error: "Evento no disponible." }, { status: 404 });

  const { data: ins, error } = await supabaseAdmin
    .from("inscritos")
    .insert({
      evento_id: evento.id,
      nombre: d.nombre,
      rut: nul(d.rut),
      email: d.email,
      telefono: nul(d.telefono),
      fecha_nacimiento: nul(d.fecha_nacimiento),
      genero: nul(d.genero),
      categoria: d.categoria,
      talla_polera: nul(d.talla_polera),
      ciudad: nul(d.ciudad),
      club: nul(d.club),
      contacto_emergencia: nul(d.contacto_emergencia),
      acepta_terminos: true,
      acepta_comunicaciones: true,
      origen: d.origen,
    })
    .select("token")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este correo ya está inscrito en el evento." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "No pudimos registrar tu inscripción." }, { status: 500 });
  }

  // Si el correo falla, la inscripción igual queda guardada.
  try {
    await enviarConfirmacion({
      email: d.email, nombre: d.nombre, evento: evento.nombre,
      categoria: d.categoria, token: ins.token,
    });
  } catch (e) {
    console.error("Email confirmación falló", e);
  }

  return NextResponse.json({ ok: true, token: ins.token });
}
