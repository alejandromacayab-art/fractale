#!/usr/bin/env python3
"""
Pone tu marca en la app: logotipo, iconos y nombre, todo de una vez.

    python3 personalizar.py --nombre "Mi Marca" --logo ~/Desktop/logo.png

Opciones:
    --nombre       Nombre completo, el que se ve en la app
    --corto        Nombre para el icono del móvil (por defecto, el mismo)
    --logo         Imagen del logotipo para fondo oscuro (PNG o JPG, cuanto más grande mejor)
    --logo-claro   Versión para fondo claro (opcional; si falta se usa la misma)
    --icono        Imagen para el icono (opcional). Si tu logotipo es alargado, aquí
                   va un símbolo o una inicial, que sí se lee en pequeño
    --fondo        Color de fondo del icono, en hexadecimal (por defecto #0B1521)

Recorta el logotipo, le quita el fondo liso y genera los cuatro iconos.
"""
import argparse, os, re, sys
try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip3 install Pillow")

RAIZ = os.path.dirname(os.path.abspath(__file__))

def sin_fondo(ruta, tol=24):
    """Quita el fondo liso (el color de las esquinas) y recorta al contenido.
    Si la imagen ya viene con transparencia, se respeta tal cual."""
    orig = Image.open(ruta)
    if orig.mode in ("RGBA","LA") or "transparency" in orig.info:
        out = orig.convert("RGBA")
        caja = out.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
        return out.crop(caja) if caja else out
    im = orig.convert("RGB")
    w, h = im.size
    px = im.load()
    esquinas = [px[1,1], px[w-2,1], px[1,h-2], px[w-2,h-2]]
    br, bg, bb = max(set(esquinas), key=esquinas.count)
    out = Image.new("RGBA", (w,h)); op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x,y]
            d = max(abs(r-br), abs(g-bg), abs(b-bb))
            a = 0 if d <= 8 else (255 if d >= 40 else (d-8)*255//32)
            op[x,y] = (r,g,b,a) if a else (0,0,0,0)
    caja = out.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox()
    return out.crop(caja) if caja else out

def escalar(img, ancho):
    w, h = img.size
    return img.resize((ancho, max(1, round(ancho*h/w))), Image.LANCZOS)

def icono(marca, size, frac, fondo):
    c = Image.new("RGBA", (size,size), fondo+(255,))
    w = int(size*frac); h = max(1, round(w*marca.size[1]/marca.size[0]))
    if h > size*frac:
        h = int(size*frac); w = max(1, round(h*marca.size[0]/marca.size[1]))
    m = marca.resize((w,h), Image.LANCZOS)
    c.paste(m, ((size-w)//2, (size-h)//2), m)
    return c.convert("RGB")

def hex_a_rgb(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i+2], 16) for i in (0,2,4))

def reemplazar(ruta, cambios):
    if not os.path.exists(ruta): return
    t = open(ruta, encoding="utf-8").read()
    for viejo, nuevo in cambios:
        t = t.replace(viejo, nuevo)
    open(ruta, "w", encoding="utf-8").write(t)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--nombre", required=True)
    ap.add_argument("--corto")
    ap.add_argument("--logo", required=True)
    ap.add_argument("--logo-claro", dest="logo_claro")
    ap.add_argument("--icono", help="imagen para el icono; si falta se usa el logotipo. "
                                    "Útil cuando el logotipo es muy alargado y no se lee en pequeño")
    ap.add_argument("--fondo", default="#0B1521")
    a = ap.parse_args()
    corto = a.corto or a.nombre
    fondo = hex_a_rgb(a.fondo)

    os.makedirs(os.path.join(RAIZ,"assets"), exist_ok=True)
    os.makedirs(os.path.join(RAIZ,"icons"), exist_ok=True)

    print("Procesando el logotipo…")
    oscuro = sin_fondo(a.logo)
    claro  = sin_fondo(a.logo_claro) if a.logo_claro else oscuro
    escalar(oscuro, 1200).save(os.path.join(RAIZ,"assets/logo-dark.png"))
    escalar(claro,  1200).save(os.path.join(RAIZ,"assets/logo-light.png"))
    escalar(oscuro,  512).save(os.path.join(RAIZ,"assets/symbol-dark.png"))
    escalar(claro,   512).save(os.path.join(RAIZ,"assets/symbol-light.png"))

    print("Generando los iconos…")
    marca_icono = sin_fondo(a.icono) if a.icono else oscuro
    ancho = .62 if a.icono else .80
    icono(marca_icono, 512, ancho, fondo).save(os.path.join(RAIZ,"icons/icon-512.png"))
    icono(marca_icono, 192, ancho, fondo).save(os.path.join(RAIZ,"icons/icon-192.png"))
    icono(marca_icono, 180, ancho, fondo).save(os.path.join(RAIZ,"icons/apple-touch-icon.png"))
    icono(marca_icono, 512, ancho*.75, fondo).save(os.path.join(RAIZ,"icons/maskable-512.png"))

    print("Poniendo el nombre…")
    cambios = [("Mi App", a.nombre)]
    for f in ("index.html","app.html","panel.html","manifest.webmanifest","sw.js","nube.js",
              "push/send.js","push/package.json",".github/workflows/reminders.yml",
              "README.md","base-de-datos/README.md"):
        reemplazar(os.path.join(RAIZ,f), cambios)

    m = os.path.join(RAIZ,"manifest.webmanifest")
    t = open(m, encoding="utf-8").read()
    t = re.sub(r'"short_name":\s*"[^"]*"', f'"short_name": "{corto}"', t)
    t = re.sub(r'"theme_color":\s*"[^"]*"', f'"theme_color": "{a.fondo}"', t)
    t = re.sub(r'"background_color":\s*"[^"]*"', f'"background_color": "{a.fondo}"', t)
    open(m,"w",encoding="utf-8").write(t)

    ix = os.path.join(RAIZ,"app.html")
    t = open(ix, encoding="utf-8").read()
    t = re.sub(r'<meta name="theme-color" content="[^"]*">',
               f'<meta name="theme-color" content="{a.fondo}">', t)
    t = re.sub(r'<meta name="apple-mobile-web-app-title" content="[^"]*">',
               f'<meta name="apple-mobile-web-app-title" content="{corto}">', t)
    open(ix,"w",encoding="utf-8").write(t)

    print(f"\nListo. La app se llama «{a.nombre}».")
    print("Siguiente paso: los cuatro pasos del README.")

if __name__ == "__main__":
    main()
