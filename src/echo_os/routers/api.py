from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from ..store import init_db
from ..executor import ensure_project, upsert_tasks
from ..planner import plan_from_intent

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
