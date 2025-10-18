"""Dummy Render Adapter — GPU yoksa stub kaydetsin"""

from __future__ import annotations
import time
from .base import BaseRenderAdapter, RenderResult
from ...artifacts.storage import artifact_path, write_meta


class DummyRenderAdapter(BaseRenderAdapter):
    name = "dummy"

    async def render(self, project: str, prompt: str, **kwargs) -> RenderResult:
        """Generate dummy artifact file"""
        out = artifact_path(project, self.name, seed=str(time.time()))
        img = out / "echo.txt"
        img.write_text(f"[rendered:{prompt}]")
        meta = {"adapter": self.name, "prompt": prompt}
        write_meta(out, meta)
        return RenderResult(path=img, meta=meta)
