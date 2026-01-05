import os
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from supabase import create_client, Client, ClientOptions

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url: str = os.environ.get("SUPABASE_URL", "")
supabase_key: str = os.environ.get("SUPABASE_KEY", "")

if not supabase_url or not supabase_key:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_KEY must be set as environment variables"
    )

# Important: SUPABASE_KEY should be the 'anon' key (public key), not 'service_role' key
# The 'anon' key respects RLS policies, while 'service_role' bypasses them

supabase: Client = create_client(supabase_url, supabase_key)

# Initialize FastAPI app
app = FastAPI(
    title="Task Manager API",
    description="API for managing tasks with Supabase authentication",
    version="1.0.0",
)

# HTTP Bearer token authentication
security = HTTPBearer()


# Pydantic Models
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, description="Task title")
    status: str = Field(default="pending", description="Task status")
    priority: int = Field(default=0, ge=0, description="Task priority")
    scheduled_time: Optional[datetime] = Field(
        None, description="Scheduled time for the task"
    )


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, description="Task title")
    status: Optional[str] = Field(None, description="Task status")
    priority: Optional[int] = Field(None, ge=0, description="Task priority")
    scheduled_time: Optional[datetime] = Field(
        None, description="Scheduled time for the task"
    )


class Task(TaskBase):
    id: int = Field(..., description="Task ID")
    user_id: UUID = Field(..., description="User ID of the task owner")

    class Config:
        from_attributes = True


# Authentication Dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Verify JWT token and extract user_id and token from it.
    Returns a dict with user_id and token for use with Supabase RLS.
    """
    token = credentials.credentials

    try:
        # Verify the token and get the user
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        user_id = user_response.user.id
        return {"user_id": user_id, "token": token}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )


def get_supabase_client_with_token(token: str) -> Client:
    """
    Create a Supabase client with the user's token for RLS.
    This is necessary for Row Level Security to work correctly.
    
    Important: Make sure SUPABASE_KEY is the 'anon' key, not 'service_role' key.
    The 'anon' key is the public key that respects RLS policies.
    """
    # Create client options with user's JWT token
    # Supabase expects both 'apikey' (anon key) and 'Authorization' (user JWT token)
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {token}",
    }
    
    options = ClientOptions(headers=headers)
    return create_client(supabase_url, supabase_key, options=options)


# API Endpoints
@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {"message": "Task Manager API is running"}


@app.get("/tasks", response_model=List[Task], tags=["Tasks"])
async def list_tasks(user_data: dict = Depends(get_current_user)):
    """
    List all tasks for the authenticated user.
    Only returns tasks belonging to the authenticated user.
    """
    user_id = user_data["user_id"]
    token = user_data["token"]
    
    try:
        # Use client with user token for RLS
        client = get_supabase_client_with_token(token)
        response = (
            client.table("tasks")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        tasks = []
        for item in response.data:
            # Convert scheduled_time string to datetime if present
            if item.get("scheduled_time"):
                item["scheduled_time"] = datetime.fromisoformat(
                    item["scheduled_time"].replace("Z", "+00:00")
                )
            tasks.append(Task(**item))

        return tasks
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tasks: {str(e)}",
        )


@app.post("/tasks", response_model=Task, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
async def create_task(
    task: TaskCreate, user_data: dict = Depends(get_current_user)
):
    """
    Create a new task.
    The task will be automatically associated with the authenticated user.
    """
    user_id = user_data["user_id"]
    token = user_data["token"]
    
    try:
        task_data = {
            "user_id": user_id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority,
            "scheduled_time": (
                task.scheduled_time.isoformat() if task.scheduled_time else None
            ),
        }

        # Use client with user token for RLS
        client = get_supabase_client_with_token(token)
        response = client.table("tasks").insert(task_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create task",
            )

        created_task = response.data[0]
        if created_task.get("scheduled_time"):
            created_task["scheduled_time"] = datetime.fromisoformat(
                created_task["scheduled_time"].replace("Z", "+00:00")
            )

        return Task(**created_task)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating task: {str(e)}",
        )


@app.put("/tasks/{task_id}", response_model=Task, tags=["Tasks"])
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    user_data: dict = Depends(get_current_user),
):
    """
    Update an existing task.
    Only the task owner can update their task.
    """
    user_id = user_data["user_id"]
    token = user_data["token"]
    
    try:
        # Use client with user token for RLS
        client = get_supabase_client_with_token(token)
        # First, verify the task exists and belongs to the user
        existing_response = (
            client.table("tasks")
            .select("*")
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or you don't have permission to update it",
            )

        # Build update data (only include fields that are provided)
        # Use model_dump to get only explicitly set fields
        update_dict = task_update.model_dump(exclude_unset=True)
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
        
        # Convert datetime to ISO format string for scheduled_time
        update_data = {}
        for key, value in update_dict.items():
            if key == "scheduled_time" and value is not None:
                update_data[key] = value.isoformat()
            elif key == "scheduled_time" and value is None:
                update_data[key] = None
            else:
                update_data[key] = value

        # Update the task
        response = (
            client.table("tasks")
            .update(update_data)
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update task",
            )

        updated_task = response.data[0]
        if updated_task.get("scheduled_time"):
            updated_task["scheduled_time"] = datetime.fromisoformat(
                updated_task["scheduled_time"].replace("Z", "+00:00")
            )

        return Task(**updated_task)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating task: {str(e)}",
        )


@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tasks"])
async def delete_task(
    task_id: int, user_data: dict = Depends(get_current_user)
):
    """
    Delete a task.
    Only the task owner can delete their task.
    """
    user_id = user_data["user_id"]
    token = user_data["token"]
    
    try:
        # Use client with user token for RLS
        client = get_supabase_client_with_token(token)
        # First, verify the task exists and belongs to the user
        existing_response = (
            client.table("tasks")
            .select("*")
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found or you don't have permission to delete it",
            )

        # Delete the task
        response = (
            client.table("tasks")
            .delete()
            .eq("id", task_id)
            .eq("user_id", user_id)
            .execute()
        )

        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting task: {str(e)}",
        )
