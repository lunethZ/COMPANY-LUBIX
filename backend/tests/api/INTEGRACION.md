# Nota de Integración - Tests API (Health, Auth, User)

## Archivos creados por esta tarea

```
backend/tests/api/
├── __init__.py   # ya existente en Develop desde 81053fa
├── conftest.py
├── test_health_router.py
├── test_auth_router.py
└── test_user_router.py
```

## Fixtures y dependency_overrides (prefijo `api_`)

| Fixture | Descripción |
|---------|-------------|
| `api_db_engine` | Engine SQLite en memoria (`sqlite:///:memory:`) con tablas creadas |
| `api_db_session` | Sesión SQLAlchemy por test, con roles `user`, `company`, `admin` precreados |
| `api_client` | `TestClient` con `app.dependency_overrides[get_db]` apuntando a `api_db_session` |
| `api_fake_user` | Usuario verificado (`role=user`) en BD de test |
| `api_fake_company` | Usuario verificado (`role=company`) + registro en tabla `Company` |
| `api_auth_headers_user` | `{"Authorization": "Bearer <access_token>"}` para usuario normal |
| `api_auth_headers_company` | `{"Authorization": "Bearer <access_token>"}` para empresa |
| `_mock_external_services` | (autouse) Mocks de: `CheckNetwork.check_internet_connection`, `AuthService.create_code_and_send_code`, `AuthService.verify_code`, `AuthService.EmailRegisterCompany`, `NasService.subir.upload_file` |

## Parches globales en conftest (nivel módulo, antes de importar modelos)

1. **MinIO**: este `conftest.py` reemplaza `sys.modules["minio"]` a nivel de módulo (líneas 16–21). El `conftest.py` raíz no reemplaza `sys.modules`; parchea `minio.Minio` después de `import minio` (líneas 42–46).
2. **UUID bind processors**: Parche a `sqlalchemy.UUID.bind_processor` y `sqlalchemy.dialects.postgresql.UUID.bind_processor` para que SQLite acepte strings UUID (convierte a hex sin guiones). **Nota:** este parche es global y no se restaura al terminar; podría afectar tests de otras carpetas que se ejecuten después.

## Dependencias nuevas

Ninguna. Se usa `httpx` (ya en `pyproject.toml` para `TestClient`) y `pytest` (disponible en entorno).

## Posibles conflictos con otros `conftest.py`

| Conflicto | Resolución |
|-----------|------------|
| `tests/conftest.py` raíz parchea MinIO a nivel de módulo (`import minio`; `minio.Minio = MagicMock(...)`, líneas 42–46), no en `pytest_configure` | Nuestro `tests/api/conftest.py` reemplaza `sys.modules["minio"]` a nivel de módulo (líneas 16–21). Es un mecanismo distinto; el mock efectivo para `NasService` ya importado es el del conftest raíz. Los tests API mockean `NasService.subir.upload_file` (línea 211), así que no dependen de ese mock |
| Fixtures con nombres genéricos (`client`, `db_session`, `user`) | Usamos prefijo `api_` (`api_client`, `api_db_session`, `api_fake_user`, etc.) para evitar colisiones |
| `dependency_overrides` no limpiado | `api_client` hace `app.dependency_overrides.clear()` en teardown |

## Comando para ejecutar solo estos tests

```bash
cd backend
python -m pytest tests/api -v
# o solo un router:
python -m pytest tests/api/test_health_router.py -v
python -m pytest tests/api/test_auth_router.py -v
python -m pytest tests/api/test_user_router.py -v
```

## Supuestos sobre la app

| Aspecto | Supuesto |
|---------|----------|
| App FastAPI | Variable `app` en `app.main` |
| Routers | `AuthRouters.router` (`/auth`), `HealthRouter.router` (`/health`), `UserRouter.router` (`/user`) |
| BD | `get_db` dependency en `app.database.Connection` devuelve `SessionLocal` |
| Auth | Middleware `auth_middleware` lee `Authorization: Bearer <token>`, valida con `JWTService.verify_token`, setea `request.state.user_id` y `request.state.role` |
| JWT | `SECRET_KEY`, `ALGORITHM` desde `app.Config.config` |
| Modelos | Usan `UUID(as_uuid=True)` (PostgreSQL dialect) para PKs |
| Servicios externos | `NasService.subir`, `EmailService` (`create_code_and_send_code`, `verify_code`, `EmailRegisterCompany`), `CheckNetwork.check_internet_connection` |
| Duplicado en router | No hay endpoint duplicado: `/auth/resend-verification` aparece una vez en `AuthRouters.py:96`. La ruta sí está repetida en la lista de rutas públicas de `AuthMiddleware.py:17,20` |

## Cobertura

Medición real de la suite completa ejecutada desde `backend/` el **2026-10-26** sobre la rama local **`Develop`** (no sobre `main`):

```bash
python -m pytest --cov=app -v
```

| Métrica | Valor |
|---------|-------|
| Tests | 166 passed, 0 failed, 0 skipped |
| Statements | 2249 |
| Miss | 941 |
| Cobertura total | **58%** |

La medición incluye `tests/api`, `tests/integration`, `tests` (raíz) y `tests/unit`.

## Sugerencia de línea para `Docs/estrategia-pruebas.md`

```markdown
### Post-tests API routers (Health, Auth, User)

- **Fecha:** 2026-10-26
- **Comando usado:** `python -m pytest --cov=app -v`
- **Porcentaje total de cobertura:** 58% (2249 statements, 941 miss)
- **Comentario:** Suite completa: 166 tests passed, 0 failed, 0 skipped. `tests/api` contiene 84 tests en total: 71 son de esta tarea (`test_health_router.py`: 4, `test_auth_router.py`: 28, `test_user_router.py`: 39) y 13 pertenecen a archivos ya existentes en Develop (`test_auth_middleware.py`: 3, `test_pqrs_validation.py`: 10), que **no** entran en este commit.
- Tests aislados: SQLite en memoria, mocks de MinIO, Email, Network; sin red ni BD real.
```