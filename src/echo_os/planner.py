from __future__ import annotations
from .openai_client import suggest_tasks


async def plan_from_intent(project: str, context: str) -> list[str]:
    return await suggest_tasks(context=context, project_name=project)
