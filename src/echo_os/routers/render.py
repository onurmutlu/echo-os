"""Render API endpoints"""

from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..adapters.render.dummy import DummyRender
from ..adapters.render.comfyui import ComfyUIRender

router = APIRouter()


class RenderIn(BaseModel):
    project: str
    prompt: str
    adapter: str = "dummy"  # "dummy" | "comfyui"


@router.post("/render")
async def render_endpoint(data: RenderIn):
    if data.adapter == "dummy":
        adapter = DummyRender()
    elif data.adapter == "comfyui":
        adapter = ComfyUIRender()
    else:
        raise HTTPException(400, "unknown adapter")

    res = await adapter.render(project=data.project, prompt=data.prompt)
    return {"ok": True, "adapter": adapter.name, "path": str(res.path)}
