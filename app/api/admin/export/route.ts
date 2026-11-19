import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const TIPOS = ["visita_stand", "recovery", "compra_force", "uso_plataforma", "sigue_instagram"];
const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("evento");
  const { data: ev } = await supabaseAdmin.from("eventos").select("id,slug").eq("slug", slug ?? "").single();
  if (!ev) return new Response("Evento no encontrado", { status: 404 });

  const { data: ins } = await supabaseAdmin.from("inscritos").select("*").eq("evento_id", ev.id).range(0, 19999);
  const { data: inter } = await supabaseAdmin
    .from("interacciones").select("inscrito_id,tipo").eq("evento_id", ev.id).range(0, 99999);

  const mapa = new Map<string, Set<string>>();
  for (const i of inter ?? []) {
    if (!mapa.has(i.inscrito_id)) mapa.set(i.inscrito_id, new Set());
    mapa.get(i.inscrito_id)!.add(i.tipo);
  }

  const cols = ["nombre", "rut", "email", "telefono", "fecha_nacimiento", "genero", "categoria",
    "talla_polera", "ciudad", "club", "origen", "acepta_comunicaciones", "comunicaciones_activas", "created_at"];
  const head = [...cols, ...TIPOS].join(",");
  const rows = (ins ?? []).map((r) =>
    [...cols.map((c) => csv((r as Record<string, unknown>)[c])),
     ...TIPOS.map((t) => (mapa.get(r.id)?.has(t) ? "1" : "0"))].join(","));

  // BOM para que Excel abra bien las tildes
  return new Response("﻿" + [head, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ev.slug}-inscritos.csv"`,
    },
  });
}
