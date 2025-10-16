from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .store import init_db
from .routers.api import router as api_router


def create_app() -> FastAPI:
    app = FastAPI(title="ECHO.OS", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def _startup():
        await init_db()

    @app.get("/health")
    async def health():
        return {"ok": True}

    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
