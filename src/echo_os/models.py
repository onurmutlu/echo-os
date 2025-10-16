from __future__ import annotations
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field

class EchoLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str  # e.g., ECHO.LOG/001
    title: str
    content: str  # freeform text or JSON blob
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DONE = "done"

class TaskStatus(str, Enum):
    TODO = "todo"
    DOING = "doing"
    DONE = "done"
    BLOCKED = "blocked"

class TaskPriority(str, Enum):
    LOW = "low"
    MED = "med"
    HIGH = "high"

class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    vision: str = ""
    status: ProjectStatus = ProjectStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(index=True)
    title: str
    description: str = ""
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MED
    due: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Artifact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(index=True)
    kind: str  # file, image, note, url
    path: str
    meta: str = ""  # JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)
