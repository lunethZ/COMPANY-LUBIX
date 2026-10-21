# Estrategia de Pruebas - LUBIX Backend

## Línea base de cobertura backend

- **Fecha:** 2026-10-18
- **Comando usado:** `python -m pytest --cov=app --cov-report=term-missing`
- **Herramientas:** pytest 9.1.1, pytest-cov 7.1.6, coverage 7.16.2, Python 3.14.3
- **Porcentaje total de cobertura (línea base):** 0% (0/309 líneas cubiertas)
- **Comentario:** Registro inicial sin tests unitarios. Se creó un test mínimo `tests/test_main.py` que verifica que el módulo `app` se importa correctamente. Todos los módulos del paquete `app` quedaban sin cubrir (309 statements 100% missed).

### Post-primeras pruebas (EmailService + NasService)

- **Fecha:** 2026-10-18 (mismo día)
- **Comando usado:** `python -m pytest --cov=app --cov-report=term-missing`
- **Herramientas:** pytest 9.1.1, pytest-cov 7.1.6, coverage 7.16.2, Python 3.14.3
- **Porcentaje total de cobertura:** 22% (309 de 397 statements ahora cubiertos)
- **Comentario:** Se agregaron tests unitarios con dobles (mock/unittest.mock):
  - `test_email_service.py`: 2 tests que cubren EmailService.smtp completamente (100% cobertura en EmailService.py, 23 statements)
  - `test_nas_service.py`: 10 tests que cubren NasService methods con mocks de Minio client (72% cobertura en NasService.py, 65 statements; 18 statements aún no cubiertos)

### Estado actual

| Componente | Archivos | Statements | Cobertura |
|------------|----------|------------|-----------|
| `app/` | 51 archivos Python | 397 statements | 22% |
| Tests | 13 tests (test_main.py, test_email_service.py, test_nas_service.py) | — | 13 passed |
| EmailService.py | — | 23 statements | 100% |
| NasService.py | — | 65 statements | 72% |
| Config.py | — | 18 statements | 100% |
| main.py | — | 38 statements | 0% |

### Próximos pasos

- Implementar tests de servicios restantes (AuthService, JWTService, EmailService auxiliares)
- Alcanzar el umbral de cobertura semanal (esta semana: línea base 0%, próxima meta: 20%+)
- Añadir tests de errores externos y casos edge