# Endpoints de API

Base URL: `http://127.0.0.1:8000`

---

## Health Check

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health/test | Verifica conexión a base de datos |

---

## Autenticación

### Registro de usuario

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| fullName | Texto | Sí |
| email | Texto | Sí |
| tell | Texto | No |
| password | Texto | Sí |

```json
POST /api/v1/auth/register
{
  "fullName": "Juan Pérez",
  "email": "juan@email.com",
  "tell": "+573001234567",
  "password": "MiPassword1"
}
```

### Registro de empresa

```json
POST /api/v1/auth/register-company
{
  "companyName": "Mi Empresa",
  "companyEmail": "empresa@email.com",
  "companyPassword": "Pass1234",
  "companyTell": "+573001234567",
  "companyAddress": "Calle 123",
  "companyNIT": "900123456",
  "companyNITDV": "7"
}
```

### Inicio de sesión

```json
POST /api/v1/auth/login
{
  "email": "usuario@email.com",
  "password": "MiPassword1"
}
```

### Inicio de sesión (empresa)

```json
POST /api/v1/auth/login-company
{
  "companyNIT": "900123456",
  "companyPassword": "Pass1234"
}
```

### Verificación de correo

```json
POST /api/v1/auth/verify-email
{
  "email": "usuario@email.com",
  "code": "123456"
}
```

### Recuperación de contraseña

```json
POST /api/v1/auth/forgot-password
{
  "email": "usuario@email.com"
}
```

### Restablecimiento de contraseña

```json
POST /api/v1/auth/reset-password
{
  "email": "usuario@email.com",
  "code": "123456",
  "new_password": "NuevaPassword1"
}
```