from fastapi import Request
from starlette.responses import JSONResponse
from app.services.authentication.JWTService import verify_token

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
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
        "/cart",
        "/pqrs"
    ]
    
}

def _cors_response(status_code: int, detail: str):
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail},
        headers=CORS_HEADERS,
    )

async def auth_middleware(request: Request, call_next):

    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path

    if path.startswith("/files/"):
        return await call_next(request)

    if path in PUBLIC_ROUTES:
        return await call_next(request)

    if path.startswith("/products/"):
        if request.method == "GET":
            return await call_next(request)
        else:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return _cors_response(401, "Token requerido")
            try:
                scheme, token = auth_header.split()
                if scheme.lower() != "bearer":
                    return _cors_response(401, "Formato de autorizacion invalido")
                payload = verify_token(token)
                if not isinstance(payload, dict) or payload is None:
                    return _cors_response(401, "Token invalido")
                if payload.get("type") != "access":
                    return _cors_response(401, "Access token requerido")
                user_id = payload.get("sub")
                role = payload.get("role")
                if not user_id:
                    return _cors_response(401, "Token invalido")
                request.state.user_id = user_id
                request.state.role = role
                if role != "user":
                    return _cors_response(403, "Solo usuarios pueden crear reseñas")
                return await call_next(request)
            except Exception as e:
                return _cors_response(401, "Token invalido")
    
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return _cors_response(401, "Token requerido")
    
    try:
        scheme, token = auth_header.split()

        if scheme.lower() != "bearer":
            return _cors_response(401, "Formato de autorizacion invalido")
        
        payload = verify_token(token)

        if not isinstance(payload, dict) or payload is None:
            return _cors_response(401, "Token invalido")

        if payload.get("type") != "access":
            return _cors_response(401, "Access token requerido")
        
        user_id = payload.get("sub")
        role = payload.get("role")

        if not user_id:
            return _cors_response(401, "Token invalido")
        
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
            return _cors_response(401, "no tienes permiso para acceder a este recurso")
        
        
        return await call_next(request)
    
    except Exception as e:
        print("Auth Error", e)
        return _cors_response(401, "Token invalido")
