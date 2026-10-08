# Base de datos de Fractale

## Qué hay aquí

| Archivo | Qué es |
|---|---|
| `esquema.sql` | Todo el modelo de datos y los permisos. Se ejecuta una vez. |
| `registro-abierto.sql` | Deja que cualquiera con el enlace cree su cuenta. |
| `salud.sql` | Ficha médica, nutricional y documentos. |
| `chat.sql` | Mensajes entre el deportista y su equipo. |
| `objetivos.sql` | Objetivos Fractale y lo que el deportista va marcando. |
| `equipo.sql` | Qué profesionales ven a qué deportista. |
| `beneficios.sql` | Descuentos de las marcas aliadas. |
| `modulos.sql` | Interruptores de entrenamiento y nutrición. |
| `lecturas.sql` | Saber si el otro ya leyó la conversación. |

Se ejecutan en ese orden, cada uno una sola vez.

## Cómo se monta (una sola vez, ~5 minutos)

1. Entra a <https://supabase.com> y crea una cuenta (el plan gratuito sobra).
2. **New project**. Nombre: `mi-app`. Elige la región **South America (São Paulo)**,
   que es la más cercana. Guarda la contraseña de la base de datos que te genera:
   no la necesitarás para la app, pero sí si algún día entras por fuera.
3. Cuando el proyecto termine de crearse, abre **SQL Editor → New query**, pega
   el contenido completo de `esquema.sql` y pulsa **Run**. Debe decir *Success*.
4. Ve a **Project Settings → API** y copia estos dos valores:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **anon public** key (una cadena larga que empieza por `eyJ...`)

   Esos dos van dentro de la app. **No son secretos**: están hechos para vivir en
   el código de aplicaciones web y por sí solos no dan acceso a nada, porque cada
   consulta pasa por los permisos por fila que define `esquema.sql`.

   La clave **`service_role`** de esa misma pantalla sí es secreta. No la copies
   a ningún sitio ni la compartas: se salta todos los permisos.

5. En **Authentication → Sign In / Providers**:
   - **Email** activado
   - **Confirm email** DESACTIVADO — así el registro es inmediato y no depende del
     correo, que en el plan gratuito está limitado a 2 envíos por hora
   - **Minimum password length**: 8

## Cómo funcionan los permisos

- Cada persona lee y escribe **solo sus propias filas**. No es una regla de la app:
  la base de datos lo impide, aunque alguien manipule la aplicación.
- El entrenador puede **leer** (nunca escribir) los datos de los deportistas que
  tiene asignados, y de nadie más.
- **El registro está abierto**: cualquiera con el enlace crea su cuenta y queda
  asignado al entrenador, visible en el panel. La primera cuenta del sistema es la
  del entrenador — esa es la tuya. La tabla `invitaciones` sigue existiendo, pero
  ahora es opcional: solo sirve para dejar el nombre puesto de antemano.
  Para volver a cerrarlo, vuelve a ejecutar el bloque 4 de `esquema.sql`.

## Borrar los datos de una persona

Si un deportista te lo pide, en **Authentication → Users** eliminas su usuario.
Sus días, su configuración y su perfil se borran en cascada automáticamente.
