#!/usr/bin/env python3
"""Arma una copia de la app en un solo archivo, para mirarla en el celular.

No toca nada de lo publicado: lee index.html y escribe preview.html con el CSS
y los logos dentro, sin service worker, sin base de datos y con datos de
ejemplo para que las pantallas se vean con contenido.
"""
import base64, json, pathlib, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / ".claude" / "preview.html"

def datauri(rel):
    b = (RAIZ / rel).read_bytes()
    return "data:image/png;base64," + base64.b64encode(b).decode()

s = (RAIZ / "index.html").read_text()

# --- CSS dentro
s = s.replace('<link rel="stylesheet" href="estilos.css">',
              "<style>\n" + (RAIZ / "estilos.css").read_text() + "\n</style>")

# --- fuera lo que necesita servidor
for tag in ['<link rel="manifest" href="manifest.webmanifest">',
            '<link rel="icon" href="icons/icon-192.png">',
            '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">']:
    s = s.replace(tag, "")

# --- logos como datos
for rel in ["assets/symbol-dark.png", "assets/symbol-light.png", "assets/logo-dark.png"]:
    s = s.replace('src="%s"' % rel, 'src="%s"' % datauri(rel))

# --- sin nube: la app arranca en modo local y no pide cuenta
s = s.replace('<script src="config.js"></script>\n'
              '<script src="vendor/supabase.js"></script>\n'
              '<script src="nube.js"></script>',
              '<script>window.APP_CONFIG = {url:"", key:""};</script>')

# --- sin service worker: la copia de prueba no se instala ni se cachea
s = s.replace('if(!("serviceWorker" in navigator)) return;',
              'return;   // copia de prueba: sin service worker')
assert "copia de prueba: sin service worker" in s

demo = (RAIZ / ".claude/demo.js").read_text()
s = s.replace("</body>", "<script>\n%s\n</script>\n</body>" % demo)

# --- el publicador envuelve el archivo en su propio documento, así que hay que
#     entregarle solo el contenido: sin doctype, sin <html>, <head> ni <body>.
cabeza = re.search(r"<head>(.*?)</head>", s, re.S).group(1)
cuerpo = re.search(r"<body>(.*?)</body>", s, re.S).group(1)

# El título va primero: solo se busca en los primeros 8 KB, y el CSS pesa más.
estilo = re.search(r"<style>.*?</style>", cabeza, re.S).group(0)
meta_vista = re.search(r'<meta name="viewport"[^>]*>', cabeza).group(0)
# `applyTheme` lee esta etiqueta; dentro del cuerpo sigue siendo consultable.
meta_color = '<meta name="theme-color" content="#0E0E11">'

# Sin `viewport` el celular asume 980 px de ancho y lo encoge todo. Va como
# etiqueta y, además, inyectada desde el cuerpo: cuando el publicador envuelve
# esto en su propio documento, la etiqueta ya no cae dentro de <head>.
arregla_vista = """<script>
(function(){
  var m = document.querySelector('meta[name=viewport]');
  if(!m){ m = document.createElement('meta'); m.name = 'viewport'; document.head.appendChild(m); }
  m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
})();
</script>"""

s = "\n".join(["<title>Fractale</title>", meta_vista, meta_color,
               arregla_vista, estilo, cuerpo])

SALIDA.write_text(s)
print("escrito %s · %.0f KB" % (SALIDA, SALIDA.stat().st_size / 1024))
