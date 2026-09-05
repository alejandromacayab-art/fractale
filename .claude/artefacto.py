#!/usr/bin/env python3
"""Arma la portada para publicarla como Artifact (una página en claude.ai).

El publicador envuelve el archivo en su propio documento, así que aquí no
van <!doctype>, <html>, <head> ni <body>: solo el título, los estilos y el
contenido. Las imágenes viajan dentro, en base64, porque en ese alojamiento
no existe la carpeta assets/.
"""
import base64, mimetypes, pathlib, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
SALIDA = RAIZ / ".claude" / "artefacto.html"
SITIO = "https://alejandromacayab-art.github.io/fractale"
EQUIVALE = {"assets/fotos/puerto-montt.jpg": "assets/fotos/puerto-montt-900.jpg"}

def datauri(rel):
    ruta = RAIZ / EQUIVALE.get(rel, rel)
    tipo = mimetypes.guess_type(ruta.name)[0] or "application/octet-stream"
    return "data:%s;base64,%s" % (tipo, base64.b64encode(ruta.read_bytes()).decode())

s = (RAIZ / "index.html").read_text()

titulo = "<title>FRACTALE Sport Management</title>"
estilo = re.search(r"<style>.*?</style>", s, re.S).group(0)
cuerpo = re.search(r"<body>(.*)</body>", s, re.S).group(1)

# las imágenes, dentro
for rel in sorted(set(re.findall(r'assets/[\w\-./]+\.(?:png|jpg|jpeg|webp)', estilo + cuerpo))):
    uri = datauri(rel)
    estilo = estilo.replace('url("%s")' % rel, 'url("%s")' % uri)
    cuerpo = cuerpo.replace('"%s"' % rel, '"%s"' % uri)

# la app y el panel viven en el sitio, no aquí
cuerpo = cuerpo.replace('href="app.html"',   'href="%s/app.html" target="_blank" rel="noopener"' % SITIO)
cuerpo = cuerpo.replace('href="panel.html"', 'href="%s/panel.html" target="_blank" rel="noopener"' % SITIO)

SALIDA.write_text("\n".join([titulo, estilo, cuerpo]))
print("escrito %s · %.1f MB" % (SALIDA, SALIDA.stat().st_size / 1048576))
