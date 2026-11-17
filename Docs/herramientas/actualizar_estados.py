"""Actualiza el campo Estado de los RF y las HU para que coincida con el backlog final.
Ejecutar desde la raíz del repo:  python Docs/herramientas/actualizar_estados.py [RF|HU]
Sin argumento actualiza ambos."""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rf_data import RF, H, P, N

estado = {r[0]: r[3] for r in RF}
nombre = {H: "Implementado", P: "Parcial", N: "No implementado"}


def procesar(carpeta, prefijo):
    cambios = 0
    for raiz, _, archivos in os.walk(carpeta):
        for f in archivos:
            m = re.match(rf"{prefijo}-(\d+)", f)
            if not f.lower().endswith(".md") or not m:
                continue
            rf_id = f"RF-{m.group(1)}"
            if rf_id not in estado:
                continue
            ruta = os.path.join(raiz, f)
            with open(ruta, encoding="utf8", newline="") as fh:
                txt = fh.read()
            nuevo = re.sub(
                r"(\|\s*Estado\s*\|\s*)([^|]+?)(\s*\|)",
                lambda mm: mm.group(1) + nombre[estado[rf_id]] + mm.group(3),
                txt, count=1)
            if nuevo != txt:
                with open(ruta, "w", encoding="utf8", newline="") as fh:
                    fh.write(nuevo)
                cambios += 1
    return cambios


objetivos = [a.upper() for a in sys.argv[1:]] or ["RF", "HU"]
if "RF" in objetivos:
    print(f"RF actualizados: {procesar('Docs/RFs', 'RF')}")
if "HU" in objetivos:
    print(f"HU actualizadas: {procesar('Docs/HUs', 'HU')}")
