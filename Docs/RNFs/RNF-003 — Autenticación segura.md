# RNF-003 — Autenticación segura

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-003 |
| Nombre | Autenticación segura |
| Categoría | Security |
| Prioridad | Alta |
| Estado | Definido |

---

## Descripción

El mecanismo de autenticación debe implementar estándares de seguridad robustos para proteger las credenciales y sesiones de los usuarios.

---

## Especificación

### Meta principal
Todos los flujos de autenticación deben utilizar mecanismos criptográficos estándar y protegerse contra intentos de acceso no autorizados.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Tokens JWT con expiración | <= 30 minutos |
| Almacenamiento de contraseñas | bcrypt (nunca texto plano) |
| Comunicación en producción | HTTPS obligatorio |
| Intentos de login fallidos permitidos | <= 5 por minuto por IP |
| Tokens de recuperación de contraseña | Expiración en 24 horas |

### Estrategia de validación
Revisiones de seguridad periódicas. Verificación de que no existan contraseñas en texto plano en la base de datos. Pruebas de penetración en el flujo de autenticación.

### Dependencias
- Biblioteca bcrypt para hashing
- JWT (PyJWT o python-jose) para tokens
- Certificado SSL/TLS configurado en el servidor de producción