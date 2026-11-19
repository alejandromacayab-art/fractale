# Plantilla de app de registro y panel

Una copia limpia, sin marca y sin claves, lista para convertirse en una app nueva.
Trae todo: la app del deportista, el panel del entrenador, la base de datos, las
notificaciones y la sincronización.

## Los cinco pasos

### 1. Ponle tu marca

```bash
cd "/Users/alejandromacaya/Desktop/03 FRACTALE/FRACTALE"
python3 personalizar.py --nombre "Mi Marca" --logo ~/Desktop/mi-logo.png
```

Recorta el logotipo, le quita el fondo, genera los cuatro iconos y pone el nombre
en toda la app. Si tienes una versión del logotipo para fondos claros, añade
`--logo-claro ~/Desktop/logo-claro.png`. Para cambiar el color del icono,
`--fondo "#101820"`.

**Este es el único paso que cambia el aspecto.** El resto es conectar servicios.

### 2. Publícala

Crea un repositorio en GitHub y sube la carpeta:

```bash
git init -b main && git add . && git commit -m "Primera versión"
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

En el repo: **Settings → Pages → Deploy from a branch → main → /(root)**.
Te queda en `https://TU-USUARIO.github.io/TU-REPO/`.

Esa dirección va en dos sitios: en `panel.html` y en `panel.js`, donde ahora
pone `TU-DIRECCION-AQUI`.

### 3. Base de datos

1. Crea un proyecto en <https://supabase.com>
2. **SQL Editor → New query**, pega `base-de-datos/esquema.sql` y ejecútalo
3. Si quieres registro abierto a cualquiera, ejecuta también
   `base-de-datos/registro-abierto.sql` (si no, hace falta invitación)
4. Para el panel en vivo, ejecuta el bloque 8 de `esquema.sql`
5. Para el apartado médico y nutricional, ejecuta `base-de-datos/salud.sql`
   (crea la tabla de documentos y el almacén privado de archivos)
6. Para la bandeja de mensajes, ejecuta `base-de-datos/chat.sql`
7. Para el checklist de objetivos, ejecuta `base-de-datos/objetivos.sql`
8. Para que el médico y el nutricionista entren al panel, ejecuta
   `base-de-datos/equipo.sql`
9. Para los descuentos de las marcas aliadas, ejecuta
   `base-de-datos/beneficios.sql`
10. **Authentication → Sign In / Providers**: Email activado, **Confirm email
   desactivado**, contraseña mínima 8
11. **Authentication → URL Configuration**: pon tu dirección como *Site URL* y
   añádela a *Redirect URLs* terminada en `/**`
12. **Project Settings → API**: copia *Project URL* y la clave *anon/publishable*
   a `config.js`

**La primera cuenta que se registre queda como entrenador.** Regístrate tú primero.

### 4. Notificaciones (opcional)

```bash
cd push && npm install && npm run keys
```

La clave pública va en `app.html` (`PUSH_PUBLIC_KEY`); las dos van como
secretos del repositorio. Horarios en `push/config.json`.

### 5. Compruébalo

- Entra, registra algo, y mira que aparezca en el panel
- Instálala en el móvil: Safari → Compartir → Agregar a pantalla de inicio

## Qué hay en cada archivo

| Archivo | Qué es |
|---|---|
| `index.html` | La portada pública: qué es, para quién y por dónde entrar |
| `app.html` | La app completa: hábitos, entrenamiento, alimentación, sueño |
| `panel.html` · `panel.js` | El panel de quien supervisa |
| `estilos.css` | Los estilos de ambos |
| `nube.js` | Cuentas y sincronización |
| `config.js` | Los dos valores de conexión |
| `personalizar.py` | El script de marca |
| `base-de-datos/` | Esquema y permisos |
| `push/` · `.github/workflows/` | Las alertas programadas |
| `vendor/` | Librería de Supabase, incluida para funcionar sin internet |

## Si cambias los hábitos por defecto

Están en `DEF_HABITS`, dentro de `app.html`. Si los cambias **después** de que
alguien ya use la app, sube `S.v` y añade tu cambio a `CAMBIOS_HABITOS`: eso
convierte los registros existentes en vez de romperlos.

## Lo que conviene saber

- **Nunca subas** `push/.vapid.json` ni las claves privadas. El `.gitignore` ya
  los excluye.
- La clave de Supabase que va en `config.js` **sí** es pública por diseño; lo que
  protege los datos son los permisos por fila del esquema.
- En iPhone las notificaciones solo funcionan con la app instalada en la pantalla
  de inicio, con iOS 16.4 o superior.

---

## Desde noviembre de 2026: el sitio corre sobre Next.js

La portada dejó de ser un `index.html` suelto y ahora es una aplicación Next.js
(App Router), para poder alojar el módulo de inscripciones, que necesita servidor.

```bash
npm install     # una sola vez
npm run dev     # http://localhost:3000
npm run build   # comprobar antes de desplegar
```

Qué hay dónde:

| Carpeta | Qué contiene |
|---|---|
| `app/` | La portada (`page.tsx`), `/inscripcion`, `/terminos`, `/admin`, `/ticket`, `/baja` y las rutas `api/`. |
| `app/globals.css` | Los estilos de la portada, antes dentro del `<style>` de `index.html`. |
| `lib/` | Clientes de Supabase (service role) y de Resend. Solo servidor. |
| `middleware.ts` | Contraseña (Basic Auth) sobre `/admin` y `/api/admin`. |
| `public/` | La PWA del deportista tal cual: `app.html`, `panel.html`, `estilos.css`, `nube.js`, `sw.js`, `config.js`, `assets/`, `icons/`. |
| `supabase/migrations/` | El SQL del módulo de inscripciones. **Se ejecuta a mano** en Supabase. |

Las variables de entorno están en `.env.example`; copia ese archivo a `.env.local`
y complétalo. Ver `INSCRIPCIONES.md` para el detalle del módulo.

**Ojo con el despliegue:** GitHub Pages solo sirve archivos estáticos, así que el
sitio ya no puede publicarse ahí. Hay que desplegarlo en Vercel.
