from __future__ import annotations
from sqlmodel import select
from .models import Project, Task
from .store import session_scope


async def ensure_project(name: str, vision: str = "") -> Project:
    async with session_scope() as s:
        res = await s.exec(select(Project).where(Project.name == name))
        proj = res.first()
        if proj:
            return proj
        proj = Project(name=name, vision=vision)
        s.add(proj)
        await s.flush()
        return proj


async def upsert_tasks(project_id: int, titles: list[str]) -> list[Task]:
    created: list[Task] = []
    async with session_scope() as s:
        for t in titles:
            task = Task(project_id=project_id, title=t)
            s.add(task)
            created.append(task)
        await s.flush()
    return created
