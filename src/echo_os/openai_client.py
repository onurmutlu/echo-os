from __future__ import annotations
from typing import Iterable
import openai
from .config import settings

client = openai.OpenAI(
    api_key=settings.openai_api_key,
    organization=settings.openai_org,
    project=settings.openai_project,
)

async def chat(messages: list[dict], model: str | None = None) -> str:
    model = model or settings.model
    resp = client.chat.completions.create(model=model, messages=messages)
    return resp.choices[0].message.content or ""

async def suggest_tasks(context: str, project_name: str) -> list[str]:
    prompt = [
        {"role": "system", "content": "You are Echo: convert intent into 3-7 atomic, shippable tasks."},
        {"role": "user", "content": f"Project: {project_name}\nContext:\n{context}"},
    ]
    text = await chat(prompt)
    # naive parse: split bullets/lines
    lines = [l.strip("- •\t ") for l in text.splitlines() if l.strip()]
    return [l for l in lines if len(l) > 3][:10]
