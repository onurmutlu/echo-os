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
def render(prompt: str):
    async def run():
        r = await DummyRender().render(prompt)
        print(json.dumps({"ok": True, "path": str(r.path)}, ensure_ascii=False))

    asyncio.run(run())


if __name__ == "__main__":
    app()
