# Fractale · Inscripciones + embudo del stand

Next.js (App Router) + Supabase + Resend, pensado para Vercel.

## Qué hace
1. `/inscripcion` — formulario con checkbox de términos y checkbox obligatorio de autorización de correo.
   Guarda en Supabase y envía confirmación con QR.
2. El QR abre `/admin/stand/[token]`: en el stand marcas con un toque *pasó por el stand, recovery,
   compró FORCE, usó la plataforma, sigue en Instagram*.
3. `/admin` — embudo con % del total y % de quienes pasaron por el stand; buscador; descarga CSV.
4. `POST /api/admin/send` — correo masivo solo a quienes autorizaron (con link de baja),
   segmentable por interacción.
5. `/baja/[token]` — baja de comunicaciones.

## Instalación
```bash
# copia las carpetas app/, lib/, middleware.ts a tu proyecto Next.js
npm i @supabase/supabase-js resend zod qrcode
npm i -D @types/qrcode
```
Ejecuta `supabase/migrations/001_inscripciones.sql` en el SQL Editor de Supabase.

## Variables de entorno (Vercel → Settings → Environment Variables)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=     # NUNCA con prefijo NEXT_PUBLIC
RESEND_API_KEY=
EMAIL_FROM="Fractale <inscripciones@tudominio.cl>"   # dominio verificado en Resend
SITE_URL=https://tudominio.cl
ADMIN_USER=
ADMIN_PASS=                    # contraseña larga
```

## Correo masivo (ejemplo)
```bash
curl -u USUARIO:CLAVE -X POST https://tudominio.cl/api/admin/send \
  -H "Content-Type: application/json" \
  -d '{"evento_slug":"media-maraton-los-ulmos","asunto":"Gracias por pasar por FRACTALE",
       "mensaje_html":"<p>Aquí tu beneficio...</p>","solo_con_interaccion":"visita_stand"}'
```

## Pendiente de tu lado
- Crear la página `/terminos` (términos y política de privacidad).
- Verificar el dominio en Resend.
- Que un abogado revise el texto de consentimiento (Ley 19.628 y la nueva Ley 21.719).
