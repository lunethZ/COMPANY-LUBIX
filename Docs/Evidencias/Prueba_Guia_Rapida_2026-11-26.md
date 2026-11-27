# Prueba de la guía rápida por un compañero — 2026-11-26

**Documento asociado:** [`Guia_Rapida_Usuario.md`](../Guia_Rapida_Usuario.md)
**Entregable:** Capacitación, ayudas en línea y ensamblaje del plan (S8)
**Tipo de prueba:** validación interna de legibilidad y ejecución por un par
**Resultado global:** **PASS**

---

## 1. Objetivo

Verificar que un compañero de equipo, sin acompañamiento del autor, pueda completar las tareas principales de la guía rápida usando únicamente el documento y la plataforma desplegada.

Esta prueba es interna y complementa —no sustituye— la validación con el cliente simulado descrita en [`Pruebas_Aceptacion_Cliente_Simulado.md`](../Pruebas_Aceptacion_Cliente_Simulado.md).

## 2. Participantes

| Rol | Persona | Responsabilidad |
|---|---|---|
| Autor de la guía | @josearmenta2163 | Prepara el documento y observa sin intervenir |
| Tester (compañero) | @WinStormX | Ejecuta las tareas siguiendo solo la guía |
| Registro | @nacoooobit | Consolida el resultado en este documento |

## 3. Método

1. El tester recibe únicamente el enlace a la guía rápida y las cuentas de demostración.
2. Ejecuta cinco tareas de distinto rol sin ayuda del autor.
3. Se registran tiempo, resultado y dudas por tarea.
4. Las dudas se convierten en mejoras del documento antes del cierre.

## 4. Tareas ejecutadas

| # | Tarea | Rol | Resultado | Tiempo | Observación |
|---|---|---|---|---|---|
| 1 | Ingresar por la pestaña correcta y recuperar contraseña | Usuario final | PASS | 3 min | La guía aclara qué pestaña usar |
| 2 | Buscar un producto, agregarlo al carrito y confirmar el pedido | Usuario final | PASS | 6 min | El paso de revisión del checkout quedó claro |
| 3 | Consultar el estado de un pedido en **Mis pedidos** | Usuario final | PASS | 2 min | Sin dudas |
| 4 | Publicar un producto con imagen y stock | Empresa | PASS | 5 min | Se aclaró que la imagen es obligatoria |
| 5 | Resolver una PQRS pendiente | Administrador | PASS | 4 min | Sin dudas |

**Promedio:** 4 minutos por tarea. **Tareas aprobadas:** 5/5.

## 5. Hallazgos y mejoras aplicadas

| # | Hallazgo | Mejora aplicada |
|---|---|---|
| 1 | El tester dudó entre las pestañas **Usuario** y **Empresa** | Se añadió la tabla de pestañas al inicio de la guía |
| 2 | No era evidente dónde estaba **Mis pedidos** | Se indicó explícitamente el menú y la ruta de consulta |
| 3 | Faltaba un ejemplo de contraseña válida | Se añadieron los cuatro requisitos en el apartado de ingreso |
| 4 | No se mencionaba el cold start de Render | Se agregó la nota de espera al inicio de la guía |
| 5 | El canal para errores técnicos no era claro | Se enlazó la FAQ y el manual 1.1.8 |

## 6. Criterio de aceptación

La guía se considera probada cuando un compañero completa al menos 4 de 5 tareas sin ayuda y las dudas registradas quedan resueltas en el documento.

| Criterio | Resultado |
|---|---|
| Tareas completadas sin ayuda | 5/5 — cumple |
| Dudas resueltas en la guía | 5/5 — cumple |
| Documento actualizado tras la prueba | Sí — cumple |
| Resultado global | **PASS** |

## 7. Evidencias

- Guía probada: [`Guia_Rapida_Usuario.md`](../Guia_Rapida_Usuario.md)
- FAQ consolidada: [`FAQ_Usuarios.md`](../FAQ_Usuarios.md)
- Entregable final: [`Entrega_Final_Capacitacion.md`](../Entrega_Final_Capacitacion.md)
- Integración en el plan de implantación: [`BC-Implantacion.md`](../BC-Implantacion.md) §9

## 8. Firmas

| Rol | Nombre | Fecha | Resultado |
|---|---|---|---|
| Tester | @WinStormX | 2026-11-26 | PASS |
| Autor | @josearmenta2163 | 2026-11-26 | Conforme |
| Registro | @nacoooobit | 2026-11-26 | Conforme |
