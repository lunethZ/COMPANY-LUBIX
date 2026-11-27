# Entregable final — Capacitación, ayudas en línea y ensamblaje del plan

> Documento consolidado de la actividad S8. Reúne el plan de capacitación por roles, la guía rápida, la FAQ, los aportes del equipo y la evidencia de validación por un compañero.
> Documentos asociados: [`Plan_Capacitacion.md`](./Plan_Capacitacion.md) · [`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md) · [`FAQ_Usuarios.md`](./FAQ_Usuarios.md) · [`BC-Implantacion.md`](./BC-Implantacion.md) §9 · [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md)

| Campo | Valor |
|---|---|
| Actividad | S8 — Capacitación, ayudas en línea y ensamblaje del plan |
| Versión | 1.0.0 |
| Fecha | 2026-11-26 |
| Responsable de ensamblaje | @nacoooobit |
| Revisión | @lunethZ · @juanpineda |
| Estado | Listo para revisión |

---

## 1. Resumen ejecutivo

La actividad deja cuatro productos integrados:

1. **Plan de capacitación por roles**, con módulos, duración, materiales y evidencia por perfil.
2. **Guía rápida de uso en Markdown**, probada por un compañero en cinco tareas de distinto rol.
3. **FAQ consolidada en Markdown**, organizada por perfil y alineada con el manual 1.1.10.
4. **Sección 9 integrada en el plan de implantación** ([`BC-Implantacion.md`](./BC-Implantacion.md) §9), que enlaza los entregables y registra la aceptación.

Resultado de la validación por par: **PASS (5/5 tareas, 4 min promedio)**.

## 2. Objetivo y alcance

**Objetivo:** capacitar a los usuarios de LUBIX por rol y dejar ayudas en línea que permitan operar la plataforma sin acompañamiento del equipo de desarrollo.

**Incluye:** Usuario final, Empresa, Administrador y mesa de ayuda; flujos de ingreso, compra, pedidos, productos, PQRS y soporte.

**No incluye:** funcionalidades fuera del alcance de la entrega (login con Google, doble factor, cupones, devoluciones, métodos de pago guardados) ni la app móvil, cuyo APK está pendiente en otro carril.

## 3. Plan de capacitación por roles

| Módulo | Contenido | Usuario final | Empresa | Administrador | Mesa de ayuda | Duración |
|---|---|---|---|---|---|---|
| M1. Acceso y cuenta | Pestañas, verificación, recuperación, contraseña | ✅ | ✅ | ✅ | ✅ | 20 min |
| M2. Compra | Catálogo, carrito, checkout, pedido | ✅ | — | — | ✅ | 40 min |
| M3. Pedidos y PQRS | Mis pedidos, PQRS, seguimiento | ✅ | ✅ | ✅ | ✅ | 30 min |
| M4. Panel de empresa | Productos, pedidos, estadísticas, perfil | — | ✅ | — | ✅ | 40 min |
| M5. Administración | Empresas, usuarios, PQRS, resumen | — | — | ✅ | ✅ | 40 min |
| M6. Mesa de ayuda | Triage, severidad, evidencia, escalamiento | — | — | — | ✅ | 30 min |

**Ruta sugerida:** M1 → M2 → M3 para usuarios; M1 → M3 → M4 para empresas; M1 → M3 → M5 para administradores; M1 → M6 para soporte.

**Evaluación:** cuestionario de 5 preguntas y práctica del rol sin asistencia. Aprobación con al menos 4/5 y la lista de verificación PA-01 a PA-06.

El detalle de objetivos, metodología, cronograma y riesgos está en [`Plan_Capacitacion.md`](./Plan_Capacitacion.md).

## 4. Guía rápida de uso

**Archivo:** [`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md)

Contenido:

- Antes de empezar: URLs, requisitos y cold start de Render.
- Ingreso y cuenta para los cuatro perfiles.
- Pasos de compra, pedidos, PQRS y perfil del usuario final.
- Publicación de productos, pedidos, estadísticas y perfil de empresa.
- Validación de empresas, usuarios y PQRS del administrador.
- Triage y evidencia para la mesa de ayuda.
- Tabla de errores comunes y tiempos de soporte.
- Checklist rápido de cierre.

La guía fue probada por un compañero; el registro está en [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md).

## 5. Preguntas frecuentes (FAQ)

**Archivo:** [`FAQ_Usuarios.md`](./FAQ_Usuarios.md)

Organización:

| Bloque | Preguntas |
|---|---|
| Acceso y cuenta | 1–8 |
| Usuario final: catálogo, carrito y pedidos | 9–15 |
| Empresa | 16–21 |
| Administrador | 22–26 |
| PQRS y soporte | 27–30 |
| Seguridad y privacidad | 31–33 |
| Ayudas en línea y app móvil | 34–36 |

La FAQ remite al manual 1.1.10 para el detalle extendido y no inventa canales ni tiempos distintos a los documentados.

## 6. Aportes del equipo consolidados

| Integrante | Aporte | Documento o evidencia |
|---|---|---|
| @josearmenta2163 | Diseño del plan de capacitación y guion de sesiones | [`Plan_Capacitacion.md`](./Plan_Capacitacion.md) · [`Sesion_Simulada_Capacitacion.md`](./Sesion_Simulada_Capacitacion.md) |
| @WinStormX | Prueba de la guía rápida y hallazgos de usabilidad | [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md) |
| @lunethZ | Validación técnica de los flujos y revisión de consistencia | [`BC-Implantacion.md`](./BC-Implantacion.md) §9 |
| @nacoooobit | Ensamblaje del entregable e integración en el plan de implantación | Este documento · [`BC-Implantacion.md`](./BC-Implantacion.md) §8–§9 |
| @juanpineda | Revisión y aprobación de cierre | Acta de implantación (§7.5 de `BC-Implantacion.md`) |

**Proceso de consolidación:**

1. Cada integrante entregó su aporte en una rama o documento propio.
2. Se revisó la consistencia con los manuales 1.1.5, 1.1.7, 1.1.8, 1.1.9 y 1.1.10.
3. Se resolvieron duplicidades y se unificaron tiempos, canales y nombres de pantallas.
4. Se integró el resultado en este entregable y en la sección 9 del plan de implantación.
5. Se registró la validación por par y el control de cambios.

## 7. Prueba de la guía rápida por un compañero

**Evidencia:** [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md)

| Criterio | Resultado |
|---|---|
| Tareas completadas sin ayuda | 5/5 |
| Tiempo promedio por tarea | 4 min |
| Dudas resueltas en la guía | 5/5 |
| Resultado global | **PASS** |

Hallazgos principales: se añadió la tabla de pestañas, se aclaró la ubicación de **Mis pedidos**, se incluyó un ejemplo de contraseña válida, se documentó el cold start de Render y se enlazó el canal de soporte.

## 8. Evidencias y criterios de aceptación

- [x] Plan de capacitación por roles diseñado.
- [x] Guía rápida redactada en Markdown.
- [x] FAQ redactada en Markdown y organizada por perfil.
- [x] Aportes de todo el equipo consolidados.
- [x] Guía rápida probada por un compañero (PASS 5/5).
- [x] Sección 9 integrada en el plan de implantación.
- [x] Entregables enlazados desde el README y el plan operativo.

## 9. Integración en el plan de implantación

La sección 9 de este entregable se integró en [`BC-Implantacion.md`](./BC-Implantacion.md) con el siguiente contenido:

| Subsección del plan de implantación | Contenido integrado |
|---|---|
| §9.1 Plan de capacitación por roles | Módulos M1–M6, rutas por perfil, duración y evaluación |
| §9.2 Guía rápida de uso | Enlace, alcance, contenido y resultado de la prueba por par |
| §9.3 Preguntas frecuentes (FAQ) | Enlace, organización por bloques y criterios de consistencia |
| §9.4 Prueba de la guía rápida | Tareas, tiempos, hallazgos y resultado PASS |
| §9.5 Evidencias y aceptación | Checklist de cierre y documentos de soporte |
| §9.6 Ensamblaje y control de cambios | Proceso de consolidación, responsables y versión |

**Criterio «Hecho cuando»:** la guía rápida fue probada por un compañero y toda la sección 9 está integrada en el plan de implantación. Ambos criterios se cumplen y quedan registrados en [`BC-Implantacion.md`](./BC-Implantacion.md) §9.

## 10. Referencias

- [`Plan_Capacitacion.md`](./Plan_Capacitacion.md)
- [`Guia_Rapida_Usuario.md`](./Guia_Rapida_Usuario.md)
- [`FAQ_Usuarios.md`](./FAQ_Usuarios.md)
- [`BC-Implantacion.md`](./BC-Implantacion.md)
- [`Sesion_Simulada_Capacitacion.md`](./Sesion_Simulada_Capacitacion.md)
- [`Pruebas_Aceptacion_Cliente_Simulado.md`](./Pruebas_Aceptacion_Cliente_Simulado.md)
- [`Manual Tecnico De Usuario/`](./Manual%20Tecnico%20De%20Usuario/)
- [`Evidencias/Prueba_Guia_Rapida_2026-11-26.md`](./Evidencias/Prueba_Guia_Rapida_2026-11-26.md)

## 11. Control de cambios

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0.0 | 2026-11-26 | Creación del entregable final y consolidación de aportes | @nacoooobit |
