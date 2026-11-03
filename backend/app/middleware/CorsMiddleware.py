# este codigo busca una comunicacion con frontend
# y asi mismo seguridad al hacerlo
# creando la configuracion del middleware para
# darle acceso al frontend asignado, permitiendo
# autenticaciones y todos los metodos HTTP
# bloqueando el acceso a la peticion recibida si el backend
# no esta autorizado
# app/middleware/CorsMiddleware.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.Config import config

DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]


def allowed_origins() -> list[str]:
    """Combina los orígenes locales con URL_FRONTEND y CORS_ORIGINS."""
    origins = list(DEFAULT_ORIGINS)
    candidates = []

    if config.URL_FRONTEND:
        candidates.append(config.URL_FRONTEND)

    if config.CORS_ORIGINS:
        candidates.extend(config.CORS_ORIGINS.split(","))

    for origin in candidates:
        origin = origin.strip().rstrip("/")
        if origin and origin not in origins:
            origins.append(origin)

    return origins


def setup_cors(app: FastAPI) -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
