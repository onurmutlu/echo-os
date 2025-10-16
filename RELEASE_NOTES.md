# ECHO.OS v1 → v2 Notes

**v1**: Intent → Plan → Task → Reflect (local-first, async SQLite, OpenAI planner, FastAPI/CLI).  
**v2**: Adds Visual layer — render adapters, artifacts, feedback memory.

Upgrade path:
1) `pip install -e .` (new deps)
2) `echo-os migrate` (DB evolve – future)
3) `echo-os render "prompt"`
