"""Base Render Adapter — Abstract interface for visual generation"""

from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping


@dataclass
class RenderResult:
    path: Path
    meta: Mapping[str, Any]


class RenderAdapter:
    """Base render adapter class"""

    name = "base"

    async def render(self, prompt: str, **kwargs) -> RenderResult:
        """Generate visual from prompt"""
        raise NotImplementedError
