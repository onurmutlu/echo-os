from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from ..store import session_scope, init_db
from ..executor import ensure_project, upsert_tasks
from ..planner import plan_from_intent
from ..models import EchoLog, Project, Task, TaskStatus, Priority
from . import render as render_router

router = APIRouter()


class PlanRequest(BaseModel):
    project: str
    context: str


@router.post("/plan")
async def plan(req: PlanRequest):
    await init_db()
    proj = await ensure_project(req.project)
    titles = await plan_from_intent(project=req.project, context=req.context)
    tasks = await upsert_tasks(proj.id, titles)
    return {"project_id": proj.id, "tasks": [t.title for t in tasks]}


# ---- EchoLog
class LogIn(BaseModel):
    code: str
    title: str
    content: str


@router.post("/log")
async def create_log(data: LogIn):
    async with session_scope() as s:
        log = EchoLog(code=data.code, title=data.title, content=data.content)
        s.add(log)
        await s.flush()
        return {"id": log.id, "code": log.code}


@router.get("/log")
async def list_logs(limit: int = 20, offset: int = 0):
    async with session_scope() as s:
        res = await s.exec(
            select(EchoLog)
            .order_by(EchoLog.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        items = res.all()
        return [
            {
                "id": x.id,
                "code": x.code,
                "title": x.title,
                "created_at": x.created_at.isoformat(),
            }
            for x in items
        ]


# ---- Projects
class ProjectIn(BaseModel):
    name: str
    vision: str = ""


@router.post("/project")
async def create_project(p: ProjectIn):
    async with session_scope() as s:
        proj = Project(name=p.name, vision=p.vision)
        s.add(proj)
        await s.flush()
        return {"id": proj.id, "name": proj.name}


@router.get("/project")
async def list_projects():
    async with session_scope() as s:
        res = await s.exec(select(Project).order_by(Project.created_at.desc()))
        return [{"id": p.id, "name": p.name, "status": p.status} for p in res.all()]


# ---- Tasks
class TaskIn(BaseModel):
    project_id: int
    title: str
    description: str = ""
    priority: Priority = Priority.med


@router.post("/task")
async def create_task(t: TaskIn):
    async with session_scope() as s:
        task = Task(
            project_id=t.project_id,
            title=t.title,
            description=t.description,
            priority=t.priority,
        )
        s.add(task)
        await s.flush()
        return {"id": task.id, "title": task.title}


class TaskPatch(BaseModel):
    status: TaskStatus | None = None
    title: str | None = None
    description: str | None = None
    priority: Priority | None = None


@router.patch("/task/{task_id}")
async def patch_task(task_id: int, data: TaskPatch):
    async with session_scope() as s:
        res = await s.exec(select(Task).where(Task.id == task_id))
        task = res.first()
        if not task:
            raise HTTPException(404, "task not found")
        for k, v in data.dict(exclude_unset=True).items():
            setattr(task, k, v)
        return {"ok": True}


@router.get("/task")
async def list_tasks(project_id: int | None = None):
    async with session_scope() as s:
        stmt = select(Task).order_by(Task.created_at.desc())
        if project_id:
            stmt = stmt.where(Task.project_id == project_id)
        res = await s.exec(stmt)
        return [
            {
                "id": t.id,
                "project_id": t.project_id,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
            }
            for t in res.all()
        ]


# Include render router
router.include_router(render_router.router, prefix="")
