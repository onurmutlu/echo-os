from __future__ import annotations
import asyncio
from typing import List, Dict, Optional
from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError
from .config import settings

client = AsyncOpenAI(
    api_key=settings.openai_api_key,
    organization=settings.openai_org,
    project=settings.openai_project,
)


async def _retry(coro_fn, *args, retries=3, base=0.5, **kwargs):
    for i in range(retries):
        try:
            return await coro_fn(*args, **kwargs)
        except (RateLimitError, APITimeoutError, APIError):
            if i == retries - 1:
                raise
            await asyncio.sleep(base * (2**i))


async def chat(messages: List[Dict], model: Optional[str] = None) -> str:
    model = model or settings.model
    resp = await _retry(
        client.chat.completions.create,
        model=model,
        messages=messages,
        temperature=0.2,
        timeout=30,
    )
    return resp.choices[0].message.content or ""


async def suggest_tasks(context: str, project_name: str) -> list[str]:
    prompt = [
        {
            "role": "system",
            "content": "You are Echo. Output 3-7 atomic tasks, one per line, no numbering.",
        },
        {"role": "user", "content": f"Project: {project_name}\nContext:\n{context}"},
    ]
    text = await chat(prompt)
    lines = [line.strip("-•\t ") for line in text.splitlines() if line.strip()]
    return [line for line in lines if len(line) > 3][:10]
