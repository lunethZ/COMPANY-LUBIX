# RF-013 — Gestionar direcciones

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-013 |
| Nombre | Gestionar direcciones |
| Módulo | Perfil de Usuario |
| Prioridad | Media |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario agregar, editar y consultar direcciones de envío.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| address | Texto | Sí | 5–255 caracteres |
| city | Texto | Sí | válido |
| phone | Texto | No | válido |

---

## Proceso

- Usuario crea o edita dirección.
- Backend valida datos.
- Se guarda en tabla addresses.
- Se asocia al usuario.

---

## Reglas de negocio

RN-001: Un usuario puede tener múltiples direcciones.