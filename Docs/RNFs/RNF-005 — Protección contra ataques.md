# RNF-005 — Protección contra ataques

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-005 |
| Nombre | Protección contra ataques |
| Categoría | Security |
| Prioridad | Alta |
| Estado | Definido |

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
| CSRF | Tokens de protección en formularios |
| Rate limiting | Implementado en FastAPI (slowapi o equivalente) |
| Validación de entradas | Pydantic schemas en todos los endpoints |

### Estrategia de validación
Pruebas de seguridad automatizadas (OWASP ZAP, Bandit). Revisiones de código enfocadas en validación de inputs. Auditoría de dependencias con herramientas como Safety.

### Dependencias
- SQLAlchemy para acceso seguro a la base de datos
- Pydantic para validación de esquemas
- slowapi o equivalente para rate limiting
- CORS configurado correctamente en FastAPI
