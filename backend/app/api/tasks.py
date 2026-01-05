from fastapi import APIRouter, Depends, HTTPException, Query, Header
from typing import Optional, List
from datetime import date
from app.services.auth_service import get_user_id_from_token
from app.services import task_service
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.api.auth import get_current_user_id, get_auth_token

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = Query(None, description="Filter by status"),
    task_date: Optional[date] = Query(None, description="Filter by date"),
    user_id: str = Depends(get_current_user_id),
    authorization: Optional[str] = Header(None)
):
    """
    Obtiene todas las tareas del usuario con filtros opcionales
    """
    token = authorization or ""
    tasks = task_service.get_tasks(user_id, token, status, task_date)
    return tasks

@router.get("/today", response_model=List[TaskResponse])
async def get_today_tasks(
    user_id: str = Depends(get_current_user_id),
    authorization: Optional[str] = Header(None)
):
    """
    Obtiene las tareas del día actual ordenadas por prioridad y hora
    """
    token = authorization or ""
    tasks = task_service.get_today_tasks(user_id, token)
    return tasks

@router.get("/current")
async def get_current_task(
    user_id: str = Depends(get_current_user_id),
    authorization: Optional[str] = Header(None)
):
    """
    Obtiene la tarea actual que el usuario debería estar haciendo
    """
    token = authorization or ""
    task = task_service.get_current_task(user_id, token)
    if not task:
        return {"message": "No current task"}
    return task

@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    task: TaskCreate,
    user_id: str = Depends(get_current_user_id),
    authorization: Optional[str] = Header(None)
):
    """
    Crea una nueva tarea
    """
    token = authorization or ""
    created_task = task_service.create_task(user_id, task, token)
    return created_task

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    authorization: Optional[str] = Header(None)
):
    """
    Obtiene una tarea específica por ID
    """
    token = authorization or ""
    task = task_service.get_task_by_id(task_id, user_id, token)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    user_id: str = Depends(get_current_user_id),
    authorization: Optional[str] = Header(None)
):
    """
    Actualiza una tarea existente
    """
    token = authorization or ""
    task = task_service.update_task(task_id, user_id, task_update, token)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    authorization: Optional[str] = Header(None)
):
    """
    Elimina una tarea
    """
    token = authorization or ""
    deleted = task_service.delete_task(task_id, user_id, token)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

