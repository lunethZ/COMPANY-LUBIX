# RNF-009 — Recuperación ante fallos

## Identificación

| Campo | Valor |
|-------|-------|
| ID | RNF-009 |
| Nombre | Recuperación ante fallos |
| Categoría | Disponibilidad |
| Prioridad | Alta |
| Estado | Definido |

---

## Descripción

El sistema debe garantizar la disponibilidad continua del servicio mediante políticas de reinicio automático, respaldos periódicos de base de datos y degradación elegante cuando servicios dependientes no están disponibles.

---

## Especificación

### Meta principal
El sistema debe recuperarse automáticamente de fallos sin intervención manual y preservar la integridad de los datos en todo momento.

### Criterios verificables

| Criterio | Valor objetivo |
|----------|---------------|
| Política de reinicio Docker | `unless-stopped` en todos los contenedores |
| Frecuencia de respaldo PostgreSQL | Cada 6 horas como mínimo |
| Tiempo de recuperación automático | Menor a 60 segundos |
| Logging de errores | 100% de excepciones registradas con timestamp |

### Estrategia de validación
Simular caída de cada contenedor y verificar reconexión automática. Restaurar respaldos en entorno de staging para validar integridad. Revisar logs para confirmar registro de errores durante degradación del servicio.

### Dependencias
- Docker Engine con `restart: unless-stopped` configurado
- Cron job o herramienta de backup para PostgreSQL
- Servicio de monitoreo de contenedores operativo
