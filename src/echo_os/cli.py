from __future__ import annotations
import asyncio
import json
import typer
from rich import print
from .store import init_db
from .executor import ensure_project, upsert_tasks
from .planner import plan_from_intent
from .echo import engine
from .adapters.render.dummy import DummyRender
from .adapters.render.comfyui import ComfyUIRender

app = typer.Typer(add_completion=False)


@app.command()
def boot():
    print("[bold cyan]ECHO.PROTOCOL v1 — online[/]")


@app.command()
def observe(text: str):
    print(json.dumps(engine.observe(text), ensure_ascii=False, indent=2))


@app.command()
def intend(vector: str):
    print(json.dumps(engine.intend(vector), ensure_ascii=False, indent=2))


@app.command()
def commit(task: str, minutes: int = typer.Option(90, "--minutes", "-m")):
    print(json.dumps(engine.commit(task, minutes), ensure_ascii=False, indent=2))


@app.command()
def reflect():
    print(json.dumps(engine.reflect(), ensure_ascii=False, indent=2))


@app.command()
def plan(project: str, context: str):
    async def run():
        await init_db()
        proj = await ensure_project(project)
        titles = await plan_from_intent(project, context)
        await upsert_tasks(proj.id, titles)
        print(
            json.dumps(
                {"project": project, "tasks": titles}, ensure_ascii=False, indent=2
            )
        )

    asyncio.run(run())


@app.command()
def render(prompt: str, project: str = "Default", adapter: str = "dummy"):
    async def run():
        ad = DummyRender() if adapter == "dummy" else ComfyUIRender()
        res = await ad.render(project=project, prompt=prompt)
        print(
            json.dumps(
                {"ok": True, "adapter": ad.name, "path": str(res.path)},
                ensure_ascii=False,
            )
        )

    asyncio.run(run())


@app.command()
def batch(project: str, file: str, adapter: str = "dummy"):
    """
    file: satır başı bir prompt
    """
    import asyncio
    import json

    async def run():
        ad = DummyRender() if adapter == "dummy" else ComfyUIRender()
        out = []
        for p in Path(file).read_text().splitlines():
            if not p.strip():
                continue
            res = await ad.render(project=project, prompt=p.strip())
            out.append(str(res.path))
        print(json.dumps({"ok": True, "paths": out}, ensure_ascii=False))

    from pathlib import Path

    asyncio.run(run())


if __name__ == "__main__":
    app()
