"""Base Render Adapter — Abstract interface for visual generation"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RenderRequest:
    prompt: str
    negative_prompt: str = ""
    width: int = 512
    height: int = 512
    steps: int = 20
    cfg_scale: float = 7.0
    seed: Optional[int] = None
    style: Optional[str] = None


@dataclass
class RenderResult:
    image_path: str
    metadata: Dict[str, Any]
    generation_time: float
    timestamp: datetime
    seed: Optional[int] = None


class RenderAdapter(ABC):
    """Abstract base class for render adapters"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = self.__class__.__name__

    @abstractmethod
    async def render(self, request: RenderRequest) -> RenderResult:
        """Generate image from prompt"""
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if adapter is available/healthy"""
        pass

    def get_default_config(self) -> Dict[str, Any]:
        """Return default configuration for this adapter"""
        return {}

    async def health_check(self) -> Dict[str, Any]:
        """Health check endpoint"""
        try:
            available = await self.is_available()
            return {
                "adapter": self.name,
                "available": available,
                "config": self.config,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {
                "adapter": self.name,
                "available": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }
