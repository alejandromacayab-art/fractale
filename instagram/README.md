# Historias de Instagram

Diez piezas de 1080×1920 sacadas del dossier de la portada, en el orden en que
se publican. Misma identidad que `index.html`: fondo negro azulado, Helvetica en
mayúsculas apretadas, logo arriba y pie con @fractale.cl.

| # | Archivo | De qué habla |
|---|---|---|
| 01 | `01-portada.png` | El éxito está en el sur |
| 02 | `02-paradigma.png` | El alto rendimiento ya no pide permiso en la capital |
| 03 | `03-profesionalizamos.png` | Profesionalizamos carreras · acompañamiento 360° |
| 04 | `04-performance.png` | Entrenar con método: planificación y cargas |
| 05 | `05-equipo-medico.png` | Un equipo médico detrás de cada atleta |
| 06 | `06-auspicios.png` | Buscamos los auspicios que tu carrera necesita |
| 07 | `07-alianzas.png` | La red de alianzas oficiales |
| 08 | `08-eventos.png` | Eventos: donde las marcas dejan de ser pancartas |
| 09 | `09-marcas-b2b.png` | Los cinco argumentos para una marca |
| 10 | `10-contacto.png` | ¿Cuál es tu meta? · deportista y marca |

`prototipo-secuencia.png` es la lámina con las diez juntas, para revisar el
conjunto de un vistazo.

## Cambiar un titular

Los textos viven en `gen.py`, uno por historia. Se edita, se regenera el HTML y
se vuelven a sacar los PNG:

```bash
cd "/Users/alejandromacaya/Desktop/FRACTALE/instagram"
python3 gen.py
for f in [0-9]*.html; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=1 --window-size=1080,1920 \
    --screenshot="${f%.html}.png" "file://$PWD/$f"
done
```

## Lo que conviene saber

- Cada pieza deja 230 px libres arriba y 300 abajo: ahí van el nombre de
  usuario, la caja de respuesta y los stickers de Instagram, sin tapar texto.
- Las fotos de `assets/fotos/` son recortes del propio Instagram: traen logos y
  marcas de agua incrustadas y miden 360×640, así que van muy veladas y sirven
  de textura. La única que se usa como imagen de verdad es
  `puerto-montt.jpg`, que sí está en alta. Con originales en alta, las historias
  con foto (03, 06, 08 y 10) cambian de nivel: basta con ponerles la clase
  `limpio`, la misma que usa la portada.
- Los HTML apuntan a los assets con rutas absolutas desde esta carpeta. Si
  mueves el proyecto, cambia `RAIZ` en `gen.py`.
