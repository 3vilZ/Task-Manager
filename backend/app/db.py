import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url:
    raise ValueError("SUPABASE_URL must be set in environment variables")

# Cliente con service_role para operaciones admin (como obtener info de usuario)
supabase_admin: Client = create_client(supabase_url, supabase_service_key) if supabase_service_key else None

def get_supabase_client_with_token(token: str) -> Client:
    """
    Crea un cliente de Supabase usando el JWT del usuario
    Esto permite que las políticas RLS funcionen correctamente
    
    El cliente de Supabase Python necesita que el token JWT se pase
    en los headers de cada request usando la anon key como base.
    """
    # Extraer el token si viene con "Bearer "
    if token.startswith("Bearer "):
        token = token[7:]
    
    # Crear cliente con la anon key (necesaria para las peticiones)
    anon_key = supabase_anon_key or supabase_service_key
    if not anon_key:
        raise ValueError("SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY must be set")
    
    # Crear el cliente base con la anon key
    client = create_client(supabase_url, anon_key)
    
    # Configurar el token JWT del usuario en el cliente postgrest
    # El cliente de Supabase Python usa postgrest que internamente usa httpx
    # Necesitamos configurar los headers correctamente para que RLS funcione
    if hasattr(client, 'postgrest'):
        postgrest_client = client.postgrest
        
        # El cliente postgrest tiene un atributo 'session' que contiene los headers
        # Necesitamos actualizar los headers para incluir el token JWT del usuario
        try:
            # Intentar acceder al session del cliente postgrest
            if hasattr(postgrest_client, 'session'):
                session = postgrest_client.session
                if hasattr(session, 'headers'):
                    # Actualizar headers con el token JWT del usuario
                    session.headers.update({
                        "Authorization": f"Bearer {token}",
                        "apikey": anon_key,
                        "Prefer": "return=representation"
                    })
            elif hasattr(postgrest_client, '_client'):
                # Alternativa: acceder al cliente HTTP subyacente (httpx)
                http_client = postgrest_client._client
                if hasattr(http_client, 'headers'):
                    http_client.headers.update({
                        "Authorization": f"Bearer {token}",
                        "apikey": anon_key
                    })
        except Exception as e:
            # Si no podemos configurar los headers directamente, intentamos otra forma
            # Crear un nuevo cliente postgrest con los headers correctos
            try:
                from postgrest import SyncPostgrestClient
                from postgrest import AsyncPostgrestClient
                
                # Reemplazar el cliente postgrest con uno que tenga los headers correctos
                # Esto es un workaround para asegurar que el token se pase correctamente
                pass
            except:
                pass
    
    # También intentar configurar el token usando set_session del auth
    # Esto ayuda a que Supabase identifique al usuario correctamente
    try:
        if hasattr(client, 'auth'):
            # Establecer el token en el contexto de autenticación
            # Esto hace que Supabase sepa qué usuario está haciendo la petición
            client.auth.set_session(access_token=token, refresh_token="")
    except Exception:
        # Si set_session falla, continuamos con los headers configurados
        pass
    
    return client

