"""Render Adapters — Visual generation backends"""

from .base import BaseRenderAdapter
from .dummy import DummyRenderAdapter
from .openai_image import OpenAIImageRenderAdapter
from .comfyui import ComfyUIRenderAdapter
from .dalle import DALLERenderAdapter


def get_adapter(adapter_name: str) -> BaseRenderAdapter:
    """Get render adapter by name"""
    adapters = {
        "dummy": DummyRenderAdapter(),
        "openai-image": OpenAIImageRenderAdapter(),
        "comfyui": ComfyUIRenderAdapter(),
        "dalle": DALLERenderAdapter(),
    }

    if adapter_name not in adapters:
        raise ValueError(f"Unknown adapter: {adapter_name}")

    return adapters[adapter_name]
