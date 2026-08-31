from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database.Connection import SessionLocal
from app.routers import AuthRouters
from app.routers import HealthRouter
from app.routers import CompanyRouter
from app.routers import UserRouter
from app.routers import AdminRouter
from app.routers import ProductsRouter
from app.routers import FavoritesRouter
from app.routers import PQRSRouter
from app.routers import CardRouters
import app.models
from app.middleware.AuthMiddleware import auth_middleware
from app.middleware.CorsMiddleware import setup_cors
from app.utils.seed import run_seed
from app.Config import config


@asynccontextmanager
async def lifespan(app):
    db = SessionLocal()
    if config.RUN_SEED:
        run_seed(db)
    db.close()
    yield

app = FastAPI(lifespan=lifespan)

app.middleware("http")(auth_middleware)
setup_cors(app)

app.include_router(AuthRouters.router)
app.include_router(HealthRouter.router)
app.include_router(CompanyRouter.router)
app.include_router(UserRouter.router)
app.include_router(AdminRouter.router)
app.include_router(ProductsRouter.router)
app.include_router(FavoritesRouter.router)
app.include_router(PQRSRouter.router)
app.include_router(CardRouters.router)
