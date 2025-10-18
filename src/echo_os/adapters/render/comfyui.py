"""ComfyUI Render Adapter — Local ComfyUI integration"""

from __future__ import annotations
import json
import httpx
from .base import BaseRenderAdapter, RenderResult
from ...config import settings
from ...artifacts.storage import artifact_path, write_meta

# Basit bir ComfyUI iş akışı: text prompt -> image (PNG)
# Not: Kendi Comfy workflow'unun JSON'unu burada `workflow` değişkenine koy.
WORKFLOW = {
    "prompt": {
        "3": {
            "inputs": {
                "seed": 123,
                "steps": 20,
                "cfg": 6.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
            },
            "class_type": "KSampler",
        },
        "4": {
            "inputs": {"text": "PROMPT_HERE", "clip": "5"},
            "class_type": "CLIPTextEncode",
        },
        "5": {
            "inputs": {"ckpt_name": "SDXL.safetensors"},
            "class_type": "CheckpointLoaderSimple",
        },
        "6": {
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1},
            "class_type": "EmptyLatentImage",
        },
        "7": {
            "inputs": {
                "samples": "6",
                "num_steps": 20,
                "cfg": 6.0,
                "positive": "4",
                "negative": "",
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
            },
            "class_type": "KSampler",
        },
        "8": {"inputs": {"samples": "7", "vae": "5"}, "class_type": "VAEDecode"},
        "9": {
            "inputs": {"filename_prefix": "echo", "images": "8"},
            "class_type": "SaveImage",
        },
    }
}


class ComfyUIRenderAdapter(BaseRenderAdapter):
    name = "comfyui"

    async def render(self, project: str, prompt: str, **kwargs) -> RenderResult:
        """Generate image using ComfyUI"""
        wf = json.loads(json.dumps(WORKFLOW))
        # basit replace
        wf["prompt"]["4"]["inputs"]["text"] = prompt

        base = f"{settings.comfy_host}:{settings.comfy_port}"
        async with httpx.AsyncClient(timeout=60) as client:
            # queue prompt
            r = await client.post(f"{base}/prompt", json=wf)
            r.raise_for_status()
            # Comfy'de dosyayı out klasörüne yazar; biz artifact'e kopyalamıyoruz (şimdilik meta kaydı)
            out = artifact_path(
                project, self.name, seed=str(r.json().get("prompt_id", "echo"))
            )
            meta = {"adapter": self.name, "prompt": prompt, "workflow": "inline"}
            write_meta(out, meta)
            # Not: dosya kopyalama için /view veya /history API'lerine bağlanıp output path'i alabilirsin.
            return RenderResult(path=out / "comfy.txt", meta=meta)
