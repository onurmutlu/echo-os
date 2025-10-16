"""Base Render Adapter — Abstract interface for visual generation"""

from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


@dataclass
class RenderResult:
    path: Path
    meta: Mapping


class RenderAdapter:
    name = "base"

    async def render(self, project: str, prompt: str, **kwargs) -> RenderResult:
        """Generate visual from prompt"""
        raise NotImplementedError
