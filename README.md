# ECHO.OS — Consciousness Engine

Mini‑OS that turns **intent → plan → tasks**, logs ECHO moments, and executes with AI help.

## Quickstart

```bash
# Setup
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env  # put your OPENAI_API_KEY

# Boot the system
python -m echo_os.cli boot

# Plan a project
python -m echo_os.cli plan --project "Ruzgar NFT" --context "Abstract warm fractal series 01-09; no human forms; metadata fields layer_id/resonance"

# Consciousness engine commands
python -m echo_os.cli observe "Working on fractal generation"
python -m echo_os.cli intend "Create 9 unique fractal patterns"
python -m echo_os.cli commit "Generate fractal 01" 90
python -m echo_os.cli reflect
```

## API

```bash
# Start the API server
uvicorn echo_os.routers.api:router --reload

# Or create a FastAPI app wrapper
from fastapi import FastAPI
from echo_os.routers.api import router

app = FastAPI()
app.include_router(router)
```

## Architecture

- **Consciousness Engine**: `observe → intend → commit → reflect` cycle
- **Planner**: Converts intent to atomic tasks using OpenAI
- **Executor**: Manages projects and task execution
- **Store**: SQLite-based local storage with async sessions
- **CLI**: Rich terminal interface for direct interaction
- **API**: FastAPI-based REST endpoints

## Notes

- Local SQLite storage, async sessions
- AI adapter is swappable; replace `openai_client.py` if needed
- Consciousness Engine provides observe→intend→commit→reflect cycle
- Privacy-first: all data stays local unless explicitly shared

## Development

```bash
# Install in development mode
pip install -e .

# Run tests
python -m pytest tests/

# Type checking
mypy src/
```
