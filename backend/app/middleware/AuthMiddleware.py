from fastapi import Request
from starlette.responses import JSONResponse
from app.middleware.CorsMiddleware import allowed_origins
from app.services.authentication.JWTService import verify_token

CORS_HEADERS = {
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
}

PUBLIC_ROUTES = [
    "/auth/login-user",
    "/auth/login-company",
    "/auth/register-user",
    "/auth/register-company",
    "/auth/verify-email-user",
    "/auth/resend-verification",
    "/auth/forgot-password-user",
    "/auth/reset-password-user",
    "/auth/resend-verification",
    "/auth/refresh",
    "/auth/logout",
    "/health",
    "/health/database",
    "/health/internet",
    "/products/search",
    "/docs",
    "/openapi.json",
    "/files",
]


def _is_public_route(path: str) -> bool:
    normalized = path.rstrip("/") or "/"
    return any(
        normalized == route.rstrip("/") or normalized.startswith(route.rstrip("/") + "/")
        for route in PUBLIC_ROUTES
    )


ROLES_PERMISSIONS_ROUTERS = {

    "admin": [
        "",
        "/",
        "/admin/pqrs"
    ],

    "company": [
        "/company/dashboard/me",
        "/company/dashboard/my-profile",
        "/company/dashboard/upgrade-my-profile",
        "/company/dashboard/upload-logo",
        "/company/dashboard/upload-banner",
        "/company/products",
        "/company/orders",
        "/pqrs",
        "/company/products/upload-image",
    ],

    "user": [
        "/user/dashboard",
        "/user/profile",
        "/user/change-password",
        "/user/account",
        "/user/export",
        "/user/addresses",
        "/user/orders",
        "/user/favorites",
        "/user/avatar",
        "/user/banner",
        "/cart",
        "/pqrs"
    ]
    
}

def _cors_response(status_code: int, detail: str, request: Request | None = None):
    headers = dict(CORS_HEADERS)
    origin = request.headers.get("origin") if request is not None else None
    if origin and origin in allowed_origins():
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail},
        headers=headers,
    )

async def auth_middleware(request: Request, call_next):

    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path

    if path.startswith("/files/"):
        return await call_next(request)

    if _is_public_route(path):
        return await call_next(request)

    if path.startswith("/products/"):
        if request.method == "GET":
            return await call_next(request)
        else:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return _cors_response(401, "Token requerido", request)
            try:
                scheme, token = auth_header.split()
                if scheme.lower() != "bearer":
                    return _cors_response(401, "Formato de autorizacion invalido", request)
                payload = verify_token(token)
                if not isinstance(payload, dict) or payload is None:
                    return _cors_response(401, "Token invalido", request)
                if payload.get("type") != "access":
                    return _cors_response(401, "Access token requerido", request)
                user_id = payload.get("sub")
                role = payload.get("role")
                if not user_id:
                    return _cors_response(401, "Token invalido", request)
                request.state.user_id = user_id
                request.state.role = role
                if role != "user":
                    return _cors_response(403, "Solo usuarios pueden crear reseñas", request)
                return await call_next(request)
            except Exception as e:
                return _cors_response(401, "Token invalido", request)
    
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return _cors_response(401, "Token requerido", request)
    
    try:
        scheme, token = auth_header.split()

        if scheme.lower() != "bearer":
            return _cors_response(401, "Formato de autorizacion invalido", request)
        
        payload = verify_token(token)

        if not isinstance(payload, dict) or payload is None:
            return _cors_response(401, "Token invalido", request)

        if payload.get("type") != "access":
            return _cors_response(401, "Access token requerido", request)
        
        user_id = payload.get("sub")
        role = payload.get("role")

        if not user_id:
            return _cors_response(401, "Token invalido", request)
        
        request.state.user_id = user_id
        request.state.role = role

        if role == "admin":
            return await call_next(request)
        
        
        allowed_routers = ROLES_PERMISSIONS_ROUTERS.get(role, [])

        has_permission = any(
            path.startswith(route)
            for route in allowed_routers
        )

        if not has_permission:
            return _cors_response(401, "no tienes permiso para acceder a este recurso", request)
        
        
        return await call_next(request)
    
    except Exception as e:
        print("Auth Error", e)
        return _cors_response(401, "Token invalido", request)
