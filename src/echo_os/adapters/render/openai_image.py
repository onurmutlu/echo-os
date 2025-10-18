"""OpenAI Images API Adapter — gpt-image-1 integration"""

from __future__ import annotations
import base64
import time
from openai import OpenAI
from .base import BaseRenderAdapter, RenderResult
from ...artifacts.storage import artifact_path, write_meta


class OpenAIImageRenderAdapter(BaseRenderAdapter):
    name = "openai-image"

    async def render(self, project: str, prompt: str, **kwargs) -> RenderResult:
        """Generate image using OpenAI Images API"""
        client = OpenAI()
        size = kwargs.get("size", "1024x1024")

        # Call OpenAI Images API (using DALL-E 3 for now)
        # Check if prompt contains 9:16 aspect ratio request
        if (
            "9:16" in prompt
            or "vertical composition" in prompt
            or "reels" in prompt.lower()
        ):
            size = "1024x1792"  # 9:16 aspect ratio for Reels
        elif "1:1" in prompt or "square" in prompt or "grid" in prompt.lower():
            size = "1024x1024"  # Square for grid
        else:
            size = size  # Use provided size

        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            n=1,
        )

        # Get image data (DALL-E 3 returns URL, not b64_json)
        image_data = response.data[0]

        # Create artifact directory
        out = artifact_path(project, self.name, seed=str(time.time()))
        img_path = out / "image.png"

        # Download image from URL
        import httpx

        if image_data.b64_json:
            # Use base64 data if available
            img_path.write_bytes(base64.b64decode(image_data.b64_json))
        else:
            # Download from URL
            async with httpx.AsyncClient() as client:
                img_response = await client.get(image_data.url)
                img_path.write_bytes(img_response.content)

        # Write metadata
        meta = {
            "adapter": self.name,
            "prompt": prompt,
            "size": size,
            "model": "dall-e-3",
        }
        write_meta(out, meta)

        return RenderResult(path=img_path, meta=meta)
