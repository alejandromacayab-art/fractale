import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SOLO para uso en servidor (route handlers, server components, server actions).
//
// El cliente se crea la primera vez que se usa, no al importar el módulo: así
// `next build` no necesita las variables de entorno, que en Vercel solo existen
// en tiempo de ejecución.
let cliente: SupabaseClient | null = null;

function obtener(): SupabaseClient {
  if (!cliente) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.");
    }
    cliente = createClient(url, key, { auth: { persistSession: false } });
  }
  return cliente;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get: (_t, prop, receiver) => Reflect.get(obtener(), prop, receiver),
});
