from __future__ import annotations
import asyncio
import typer
from rich import print
from .store import init_db
from .executor import ensure_project, upsert_tasks
from .planner import plan_from_intent
from .echo import engine

app = typer.Typer(add_completion=False)

@app.command()
def boot():
    print("[bold cyan]ECHO.PROTOCOL v1 — online[/]")

@app.command()
def observe(text: str):
    print(engine.observe(text))

@app.command()
def intend(vector: str):
    print(engine.intend(vector))

@app.command()
def commit(task: str, minutes: int = typer.Option(90, "--minutes", "-m")):
    print(engine.commit(task, minutes))

@app.command()
def reflect():
    print(engine.reflect())

@app.command()
def plan(project: str, context: str):
    async def run():
        await init_db()
        proj = await ensure_project(project)
        titles = await plan_from_intent(project, context)
        await upsert_tasks(proj.id, titles)
        print({"project": project, "tasks": titles})
    asyncio.run(run())

if __name__ == "__main__":
    app()
