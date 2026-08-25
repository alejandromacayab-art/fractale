# Fractale · dónde está todo

Resumen para retomar el proyecto desde cero, en esta sesión o en otra.

## Las tres direcciones

| Qué | Dónde |
|---|---|
| La app | <https://alejandromacayab-art.github.io/fractale/> |
| El panel del entrenador | <https://alejandromacayab-art.github.io/fractale/panel.html> |
| El código | Esta carpeta, y <https://github.com/alejandromacayab-art/fractale> |
| La base de datos | Supabase, proyecto `fractale` · ref `oysxzbbnodmxqaknsirb` · São Paulo |

## Cómo se publica un cambio

```bash
cd "/Users/alejandromacaya/Desktop/FRACTALE"
git add . && git commit -m "lo que cambió" && git push
```

GitHub Pages tarda 1 o 2 minutos. La app avisa a quien la tenga instalada y se
actualiza sola: no hay que pedirle a nadie que reinstale.

Al tocar `index.html`, sube `APP_VERSION`; al tocar cualquier archivo cacheado,
sube también el número de `CACHE` en `sw.js`. Así el service worker se renueva.

## Ver la app sin publicar

```bash
node .claude/servidor.js
```

Abre <http://localhost:4173>. Ese servidor sirve un `config.js` vacío, así que
la app arranca sin cuenta y guarda solo en el navegador: sirve para probar
cambios de pantalla sin tocar la base de datos ni el `config.js` de verdad.

## Estado

Ejecutados en Supabase: `esquema.sql`, `registro-abierto.sql`, `salud.sql`,
`chat.sql`, `objetivos.sql` y `equipo.sql`.

Funcionando: base de datos con permisos por fila, registro abierto a cualquiera,
panel en vivo, cuentas con correo y contraseña sin confirmación por correo,
calendario de competencias con cuenta regresiva y carga semanal de tonelaje
(pestaña **Plan**), y apartado de salud con composición corporal, ficha médica
y nutricional y documentos (pestaña **Salud**), registro diario de
entrenamiento, actividad y alimentación en **Hoy**, y bandeja de mensajes entre cada
deportista y su entrenador (botón 💬 de la cabecera) y checklist de objetivos
que el equipo asigna (pestaña **Plan**, con recordatorio en **Hoy**). Todo se
refleja en la ficha del panel del entrenador.

Pendiente:
- Invitar al médico y al nutricionista desde el panel, y asignarlos a cada
  deportista en su ficha.
- *Redirect URLs* en Supabase → Authentication → URL Configuration
  (`https://alejandromacayab-art.github.io/fractale/**`). Solo hace falta para
  recuperar contraseñas.
- Notificaciones push: sin configurar. Ver `push/` y el README.

## Cuidado con esto

- La clave de `config.js` es **pública por diseño**. Lo que protege los datos son
  los permisos por fila del esquema, no esconderla.
- La clave `service_role` de Supabase **no debe entrar nunca** en este repositorio.
- Los hábitos genéricos se retiraron. Lo que se registra a diario ahora son
  tres cosas propias —entrenamiento, actividad física y alimentación— más el
  check-in de sueño, y sus metas viven en `S.settings.metas`. Los hábitos
  antiguos siguen guardados en `S.habits` y viajan intactos a la nube, sin que
  la app los lea: si algún día se quieren recuperar, están.
- Las competencias viven en `S.comps` y la ficha de salud en `S.salud`; ambas
  viajan dentro de `config.datos`, igual que los hábitos. Las mediciones de peso
  van en el día (`logs[fecha].cuerpo`). Nada de eso necesita tabla nueva.
- Los mensajes son una conversación por deportista: `mensajes.atleta_id` la
  identifica, escriba quien escriba. Las políticas no permiten `UPDATE`, así que
  un mensaje enviado no se edita; la marca de lectura vive aparte, en `lecturas`,
  para que nadie pueda tocar la del otro.
- Cada deportista tiene un **equipo**, no un entrenador: la tabla `equipo` une
  profesionales con deportistas. Todas las políticas del esquema pasan por
  `es_mi_atleta`, así que cambiarla ahí cambió el acceso en config, dias,
  documentos, mensajes y objetivos a la vez. El `coach_id` de `perfiles` sigue
  ahí por compatibilidad, pero ya no decide nada.
- El rol con el que entra cada persona lo fija la invitación
  (`invitaciones.rol`). Invitar, repartir el equipo y asignar objetivos son del
  entrenador; el resto del equipo mira y escribe en la bandeja.
- En los objetivos manda quien los escribió: `obj_editar` y `obj_borrar` piden
  `autor_id = auth.uid()`, así que el deportista no puede rebajarse una meta que
  le puso el equipo. Marcar va en `objetivo_hechos`, una fila por cumplimiento,
  para que tildar no dé permiso a reescribir la meta.
- Los documentos sí: tabla `documentos` y bucket privado `documentos`, ambos en
  `base-de-datos/salud.sql`. El entrenador los lee, no los edita, y cada
  apertura usa un enlace firmado que caduca a los 5 minutos.
- La plantilla limpia de la que salió esto está en `/Users/alejandromacaya/plantilla-app`.
