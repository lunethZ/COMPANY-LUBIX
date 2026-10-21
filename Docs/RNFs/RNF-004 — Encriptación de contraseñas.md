# RNF-004 — Encriptación de contraseñas

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-004 |
| Nombre | Encriptación de contraseñas |
| Categoría | Security |
| Prioridad | Alta |
| Estado | Definido |

---

## Descripción

Todas las contraseñas de usuarios deben ser encriptadas usando algoritmos de hashing robustos antes de almacenarse en la base de datos.

---

## Especificación

### Meta principal
Garantizar que ninguna contraseña sea almacenada en texto plano y que el proceso de hashing sea resistente a ataques de fuerza bruta.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Algoritmo de hashing | bcrypt |
| Salt rounds | >= 12 |
| Contraseñas en texto plano en BD | 0 (prohibido) |
| Tokens de reset de contraseña | Hash con expiración |
| Validación de complejidad de contraseña | Minimo 8 caracteres, mayúscula, minúscula, número |

### Estrategia de validación
Auditoría directa de la tabla de usuarios verificando que todos los hashes correspondan a bcrypt. Pruebas unitarias del módulo de hashing.

### Dependencias
- Biblioteca bcrypt (passlib o equivalente)
- Política de contraseñas definida en el backend
- Tokens de recuperación con hash almacenado