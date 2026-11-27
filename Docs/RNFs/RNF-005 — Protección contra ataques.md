# RNF-005 — Protección contra ataques

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-005 |
| Nombre | Protección contra ataques |
| Categoría | Security |
| Prioridad | Alta |
| Estado | Verificado (parcial) |

---

## Descripción

El sistema debe implementar mecanismos de protección contra los vectores de ataque más comunes en aplicaciones web.

---

## Especificación

### Meta principal
Prevenir las vulnerabilidades OWASP Top 10 mediante controles técnicos en el backend y el frontend.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| SQL Injection | Prevenido via SQLAlchemy ORM (parametrización automática) |
| XSS (Cross-Site Scripting) | Sanitización de entradas y salidas en React |
| CSRF | No aplica (arquitectura stateless con JWT en cabecera Authorization: Bearer, sin cookies de sesión automáticas) |
| Rate limiting | Mitigación perimetral recomendada en proxy inverso / plataforma cloud (pendiente middleware nativo en API) |
| Validación de entradas | Pydantic schemas en todos los endpoints |

### Estrategia de validación
Pruebas de seguridad automatizadas (OWASP ZAP, Bandit). Revisiones de código enfocadas en validación de inputs. Auditoría de dependencias con herramientas como Safety.

### Dependencias
- SQLAlchemy para acceso seguro a la base de datos
- Pydantic para validación de esquemas
- slowapi o equivalente para rate limiting
- CORS configurado correctamente en FastAPI

---

## Estado de verificación

| Estado actual | Método / Evidencia | Fecha |
|---------------|--------------------|-------|
| Verificado (parcial) | ORM SQLAlchemy, validación Pydantic, CORS restringido y escaneo Trivy en CI; rate limiting nativo como deuda técnica | 2026-11-27 |
