"""Genera Docs/Backlog_Final.md a partir de rf_data.py.
Ejecutar desde la raíz del repo:  python Docs/herramientas/generar_backlog.py"""
import os
import sys
from collections import OrderedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rf_data import RF, H, P, N

ICON = {H: "✅", P: "🟡", N: "❌"}
total = len(RF)
nh = sum(1 for r in RF if r[3] == H)
np_ = sum(1 for r in RF if r[3] == P)
nn = sum(1 for r in RF if r[3] == N)
avance = sum(r[4] for r in RF) / total

mods = OrderedDict()
for r in RF:
    mods.setdefault(r[2], []).append(r)

L = [
    "# Backlog final — LUBIX", "",
    "> Estado de los 68 requisitos funcionales (RF) frente a las 68 historias de usuario (HU) y al código del repositorio.",
    "> Corte: 16 de noviembre de 2026. Responsable del documento: José Andrés Armenta Farías (Dev D).", "",
    "## Cómo se calculó", "",
    "- **Hecho (100 %)**: existe el endpoint o la función completa y se probó en la API.",
    "- **Parcial (1–99 %)**: existe una parte; la columna de evidencia dice qué falta.",
    "- **No implementado (0 %)**: no hay código; se justifica y queda como deuda técnica.",
    "- El porcentaje de cada módulo es el promedio de los porcentajes de sus RF. El global es el promedio de los 68.",
    "- Base: revisión de los routers de `backend/app/routers/` y del frontend. Los ítems parciales o no implementados se confirman manualmente en la aplicación antes de la sustentación.", "",
    "## Resumen", "",
    "| Indicador | Valor |", "|---|---|",
    f"| Total de RF | {total} |",
    f"| Hecho | {nh} ({nh/total:.0%}) |",
    f"| Parcial | {np_} ({np_/total:.0%}) |",
    f"| No implementado | {nn} ({nn/total:.0%}) |",
    f"| **Avance global** | **{avance:.0f} %** |", "",
    "## Avance por módulo", "",
    "| Módulo | RF | Hecho | Parcial | No impl. | Avance |", "|---|---:|---:|---:|---:|---:|",
]
for m, rs in mods.items():
    L.append(
        f"| {m} | {len(rs)} | {sum(1 for r in rs if r[3]==H)} | {sum(1 for r in rs if r[3]==P)} "
        f"| {sum(1 for r in rs if r[3]==N)} | {sum(r[4] for r in rs)/len(rs):.0f} % |"
    )
L += ["", "## Detalle por requisito", ""]
for m, rs in mods.items():
    L += [f"### {m}", "", "| ID | Requisito | Estado | % | Evidencia o justificación |", "|---|---|---|---:|---|"]
    for i, n, _, e, p, ev in rs:
        L.append(f"| {i} | {n} | {ICON[e]} {e} | {p} % | {ev} |")
    L.append("")
L += ["## Lo no alcanzado y por qué", "",
      "Estos requisitos no se construyeron en esta entrega. Cada uno queda registrado como issue y como deuda técnica:", ""]
for i, n, _, e, p, ev in RF:
    if e == N:
        L.append(f"- **{i} {n}**: {ev}")
L += ["",
      "Los requisitos parciales (🟡) se completarían primero en la hoja de ruta a etapa productiva, empezando por los que más pesan en el flujo de compra: RF-050 (pago real), RF-056 (confirmar recepción) y RF-010 (gestión de sesiones).", "",
      "## Consideraciones", "",
      "- El pago se mantiene **simulado**; esto se aclara en el manual de usuario.",
      "- Las pruebas automatizadas del móvil quedan registradas como deuda técnica.", ""]

os.makedirs("Docs", exist_ok=True)
with open("Docs/Backlog_Final.md", "w", encoding="utf8") as f:
    f.write("\n".join(L))
print(f"Hecho {nh}, Parcial {np_}, No impl {nn}, avance {avance:.1f}%")
