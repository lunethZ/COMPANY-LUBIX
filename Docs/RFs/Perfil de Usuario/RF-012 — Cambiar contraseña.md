# RF-012 — Cambiar contraseña

## Identificación

| Campo | Valor |
|---------|---------|
| ID | RF-012 |
| Nombre | Cambiar contraseña |
| Módulo | Perfil de Usuario |
| Prioridad | Alta |
| Estado | Implementado |
| Fecha | Febrero 2026 |

---

## Descripción

El sistema debe permitir al usuario cambiar su contraseña actual por una nueva contraseña segura.

---

## Entradas

| Campo | Tipo | Obligatorio | Validaciones |
|--------|------|-------------|--------------|
| current_password | Texto | Sí | Debe coincidir |
| new_password | Texto | Sí | Política de seguridad |

---

## Proceso

- Usuario ingresa contraseña actual y nueva.
- Backend valida contraseña actual.
- Se valida seguridad de nueva contraseña.
- Se actualiza con bcrypt.
- Se invalidan sesiones activas.

---

## Salidas

| Escenario | Código HTTP | Respuesta |
|------------|-------------|----------|
| Cambio exitoso | 200 | "Password updated" |
| Contraseña incorrecta | 400 | Error |

---

## Reglas de negocio

RN-001: La nueva contraseña debe cumplir política de seguridad.  
RN-002: Se invalidan sesiones activas tras el cambio.