from jose import jwt, JWTError, ExpiredSignatureError
from datetime import timedelta
from app.Config import config
from app.utils.Time import utcnow

SECRET_KEY = config.SECRET_KEY
ALGORITHM = config.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = config.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_DAYS = config.REFRESH_TOKEN_DAYS

def create_access_token(user_id: str, role: str):

    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def create_refresh_token(user_id: str):

    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def verify_token(token: str):
    
    try:
        print("Prueba token: ",token)
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload
    
    except ExpiredSignatureError:
        print("TOKEN EXPIRADO")
        return "expired"
    
    except JWTError as e:
        print("ERROR: ", str(e))
        return None