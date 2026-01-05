from typing import List, Optional
from datetime import date, datetime, time
from app.db import get_supabase_client_with_token
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatus

def get_tasks(user_id: str, token: str, status: Optional[str] = None, task_date: Optional[date] = None) -> List[dict]:
    """
    Obtiene todas las tareas del usuario con filtros opcionales
    """
    supabase = get_supabase_client_with_token(token)
    query = supabase.table("tasks").select("*")
    
    if status:
        query = query.eq("status", status)
    
    if task_date:
        query = query.eq("scheduled_for", task_date.isoformat())
    
    result = query.order("priority", desc=False).order("scheduled_time", desc=False).execute()
    return result.data if result.data else []

def get_task_by_id(task_id: str, user_id: str, token: str) -> Optional[dict]:
    """
    Obtiene una tarea específica por ID
    """
    supabase = get_supabase_client_with_token(token)
    result = supabase.table("tasks").select("*").eq("id", task_id).execute()
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None

def create_task(user_id: str, task: TaskCreate, token: str) -> dict:
    """
    Crea una nueva tarea
    Nota: El user_id se asigna automáticamente por RLS basado en el token JWT
    """
    supabase = get_supabase_client_with_token(token)
    task_data = {
        "user_id": user_id,  # Incluimos user_id para que RLS pueda validarlo
        "title": task.title,
        "status": task.status.value,
        "priority": task.priority,
        "scheduled_for": task.scheduled_for.isoformat() if task.scheduled_for else None,
        "scheduled_time": task.scheduled_time.isoformat() if task.scheduled_time else None,
    }
    
    result = supabase.table("tasks").insert(task_data).execute()
    return result.data[0] if result.data else {}

def update_task(task_id: str, user_id: str, task_update: TaskUpdate, token: str) -> Optional[dict]:
    """
    Actualiza una tarea existente
    """
    supabase = get_supabase_client_with_token(token)
    update_data = {}
    
    if task_update.title is not None:
        update_data["title"] = task_update.title
    if task_update.status is not None:
        update_data["status"] = task_update.status.value
    if task_update.priority is not None:
        update_data["priority"] = task_update.priority
    if task_update.scheduled_for is not None:
        update_data["scheduled_for"] = task_update.scheduled_for.isoformat()
    if task_update.scheduled_time is not None:
        update_data["scheduled_time"] = task_update.scheduled_time.isoformat()
    
    if not update_data:
        return get_task_by_id(task_id, user_id, token)
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
    return result.data[0] if result.data else None

def delete_task(task_id: str, user_id: str, token: str) -> bool:
    """
    Elimina una tarea
    """
    supabase = get_supabase_client_with_token(token)
    result = supabase.table("tasks").delete().eq("id", task_id).execute()
    return len(result.data) > 0 if result.data else False

def get_today_tasks(user_id: str, token: str) -> List[dict]:
    """
    Obtiene las tareas del día actual ordenadas por prioridad y hora
    """
    supabase = get_supabase_client_with_token(token)
    today = date.today().isoformat()
    
    result = supabase.table("tasks").select("*").eq("scheduled_for", today).execute()
    
    tasks = result.data if result.data else []
    
    # Ordenar por prioridad (menor = más prioridad) y luego por hora
    tasks.sort(key=lambda x: (
        x.get("priority", 10),
        x.get("scheduled_time") or "23:59:59"
    ))
    
    return tasks

def get_current_task(user_id: str, token: str) -> Optional[dict]:
    """
    Determina la tarea actual que el usuario debería estar haciendo
    Si hay una tarea con hora asignada que coincide con la hora actual, la devuelve
    Si no, devuelve la tarea pendiente con mayor prioridad del día
    """
    today = date.today()
    now = datetime.now()
    current_time = now.time()
    
    # Obtener tareas del día
    today_tasks = get_today_tasks(user_id, token)
    
    # Buscar tarea con hora asignada que coincida con la hora actual (con margen de ±30 min)
    for task in today_tasks:
        if task.get("scheduled_time") and task.get("status") != TaskStatus.DONE.value:
            task_time_str = task.get("scheduled_time")
            if task_time_str:
                try:
                    # Manejar diferentes formatos de tiempo
                    if isinstance(task_time_str, str):
                        # Puede venir como "HH:MM:SS" o "HH:MM"
                        time_parts = task_time_str.split(":")
                        if len(time_parts) >= 2:
                            task_time = time(int(time_parts[0]), int(time_parts[1]))
                            # Comparar horas (considerar margen de 30 minutos)
                            task_datetime = datetime.combine(today, task_time)
                            current_datetime = datetime.combine(today, current_time)
                            time_diff = abs((task_datetime - current_datetime).total_seconds())
                            if time_diff <= 1800:  # 30 minutos en segundos
                                return task
                except (ValueError, IndexError):
                    pass
    
    # Si no hay tarea con hora, devolver la primera pendiente con mayor prioridad
    for task in today_tasks:
        if task.get("status") == TaskStatus.PENDING.value:
            return task
    
    # Si no hay pendientes, devolver la primera en progreso
    for task in today_tasks:
        if task.get("status") == TaskStatus.IN_PROGRESS.value:
            return task
    
    return None

