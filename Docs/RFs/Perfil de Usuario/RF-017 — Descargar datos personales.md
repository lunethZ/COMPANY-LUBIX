# RF-017 — Descargar datos personales

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-017 |
| Nombre | Descargar datos personales |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario descargar toda su información personal almacenada en la plataforma.

---

## Proceso

- Usuario solicita exportación.
- Backend recopila datos.
- Se genera archivo JSON o PDF.
- Se entrega descarga.

---

## Reglas de negocio

RN-001: Debe incluir todos los datos personales del usuario.  
RN-002: La descarga debe ser segura y autenticada.