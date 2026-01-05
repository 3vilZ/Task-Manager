from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional
from app.services.auth_service import get_user_id_from_token, verify_token
from app.db import supabase_admin
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Dependencia para obtener el user_id del token JWT
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    user_id = get_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user_id

def get_auth_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Dependencia para obtener el token JWT completo
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Remover 'Bearer ' si está presente
    token = authorization[7:] if authorization.startswith("Bearer ") else authorization
    return token

@router.get("/me")
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Devuelve los datos del usuario autenticado
    """
    try:
        # Obtener información del usuario desde Supabase Auth usando admin API
        # Nota: Esto requiere service_role key para acceder a auth.admin
        if supabase_admin:
            result = supabase_admin.auth.admin.get_user_by_id(user_id)
            
            if result and hasattr(result, 'user') and result.user:
                return UserResponse(
                    id=result.user.id,
                    email=result.user.email or ""
                )
    except Exception as e:
        pass
    
    # Si falla, al menos devolvemos el user_id
    # En producción, podrías tener una tabla de perfiles para obtener más información
    return UserResponse(id=user_id, email="")

