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

def setup_cors(app: FastAPI) -> None:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )