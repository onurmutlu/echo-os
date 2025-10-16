from __future__ import annotations
from datetime import datetime
from typing import Optional
from enum import Enum
from sqlmodel import SQLModel, Field


class ProjectStatus(str, Enum):
    active = "active"
    paused = "paused"
    done = "done"


class TaskStatus(str, Enum):
    todo = "todo"
    doing = "doing"
    done = "done"
    blocked = "blocked"


class Priority(str, Enum):
    low = "low"
    med = "med"
    high = "high"


class EchoLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True)
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    vision: str = ""
    status: ProjectStatus = Field(default=ProjectStatus.active)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    title: str
    description: str = ""
    status: TaskStatus = Field(default=TaskStatus.todo)
    priority: Priority = Field(default=Priority.med)
    due: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Artifact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True)
    kind: str
    path: str
    meta: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
