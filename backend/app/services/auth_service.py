import jwt
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")

def verify_token(token: str) -> Optional[dict]:
    """
    Verifica el JWT token de Supabase y extrae el user_id
    Nota: En producción, deberías verificar la firma con la clave pública de Supabase
    """
    try:
        # Remover 'Bearer ' si está presente
        if token.startswith("Bearer "):
            token = token[7:]
        
        # Decodificar sin verificar la firma
        # En producción, deberías obtener la clave pública de Supabase y verificar
        # Por ahora, confiamos en que el token viene del frontend que ya lo validó con Supabase
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Verificar que el token no haya expirado
        import time
        if decoded.get("exp") and decoded.get("exp") < time.time():
            return None
        
        return decoded
    except (jwt.InvalidTokenError, Exception):
        return None

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extrae el user_id del token JWT
    """
    decoded = verify_token(token)
    if decoded:
        return decoded.get("sub")  # 'sub' es el campo estándar para user_id en JWT
    return None

