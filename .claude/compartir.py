#!/usr/bin/env python3
"""Arma la portada en un solo archivo, para mandarla por correo o WhatsApp.

No toca nada de lo publicado: lee index.html y escribe portada.html con las
fotos y los logos dentro, en base64, de modo que se abre sin internet.
Usa la foto de la bahía en su versión chica: en un archivo para adjuntar
pesa más de lo que aporta.
"""
import base64, mimetypes, pathlib, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / ".claude" / "portada.html"

# en el archivo suelto no vale la pena la foto grande
EQUIVALE = {"assets/fotos/puerto-montt.jpg": "assets/fotos/puerto-montt-900.jpg"}

def datauri(rel):
    rel = EQUIVALE.get(rel, rel)
    ruta = RAIZ / rel
    tipo = mimetypes.guess_type(ruta.name)[0] or "application/octet-stream"
    return "data:%s;base64,%s" % (tipo, base64.b64encode(ruta.read_bytes()).decode())

s = (RAIZ / "index.html").read_text()

# fuera lo que necesita servidor
for etiqueta in ['<link rel="manifest" href="manifest.webmanifest">',
                 '<link rel="icon" href="icons/icon-192.png">',
                 '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">']:
    s = s.replace(etiqueta, "")

# cada archivo de assets/ pasa a vivir dentro del html
usados = sorted(set(re.findall(r'assets/[\w\-./]+\.(?:png|jpg|jpeg|webp)', s)))
for rel in usados:
    s = s.replace('"%s"' % rel, '"%s"' % datauri(rel))
    s = s.replace('url("%s")' % rel, 'url("%s")' % datauri(rel))

# la app y el panel no viajan en el archivo: esos enlaces van al sitio
SITIO = "https://alejandromacayab-art.github.io/fractale"
s = s.replace('href="app.html"',   'href="%s/app.html" target="_blank" rel="noopener"' % SITIO)
s = s.replace('href="panel.html"', 'href="%s/panel.html" target="_blank" rel="noopener"' % SITIO)

SALIDA.write_text(s)
print("escrito %s · %.1f MB" % (SALIDA, SALIDA.stat().st_size / 1048576))
print("archivos incrustados: %d" % len(usados))
