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

## Estado

Funcionando: base de datos con permisos por fila, registro abierto a cualquiera,
panel en vivo, cuentas con correo y contraseña sin confirmación por correo.

Pendiente:
- Registrar la primera cuenta (queda como entrenador)
- *Redirect URLs* en Supabase → Authentication → URL Configuration
  (`https://alejandromacayab-art.github.io/fractale/**`). Solo hace falta para
  recuperar contraseñas.
- Notificaciones push: sin configurar. Ver `push/` y el README.

## Cuidado con esto

- La clave de `config.js` es **pública por diseño**. Lo que protege los datos son
  los permisos por fila del esquema, no esconderla.
- La clave `service_role` de Supabase **no debe entrar nunca** en este repositorio.
- Al cambiar los hábitos por defecto, sube `S.v` y añade el cambio a
  `CAMBIOS_HABITOS` en `index.html`, o los registros existentes se rompen.
- La plantilla limpia de la que salió esto está en `/Users/alejandromacaya/plantilla-app`.
