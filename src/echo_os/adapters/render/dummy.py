"""Dummy Render Adapter — GPU yoksa stub kaydetsin"""

from __future__ import annotations
import json
import time
from pathlib import Path
from .base import RenderAdapter, RenderResult


class DummyRender(RenderAdapter):
    name = "dummy"

    async def render(self, prompt: str, **kwargs) -> RenderResult:
        """Generate dummy artifact file"""
        out = Path("artifacts") / time.strftime("%Y-%m-%d") / "dummy"
        out.mkdir(parents=True, exist_ok=True)

        # Create dummy file
        timestamp = str(int(time.time()))
        img = out / f"echo_{timestamp}.txt"
        img.write_text(f"[rendered:{prompt}]")

        # Create metadata
        meta = {"adapter": self.name, "prompt": prompt, "timestamp": timestamp}
        meta_file = out / "meta.json"
        meta_file.write_text(json.dumps(meta, ensure_ascii=False, indent=2))

        return RenderResult(path=img, meta=meta)
