from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .store import init_db
from .routers.api import router as api_router
from .routers.pipeline import router as pipeline_router
from .routers.captions import router as captions_router
from .routers.video import router as video_router


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
    app.include_router(pipeline_router, prefix="/api/pipeline")
    app.include_router(captions_router, prefix="/api/captions")
    app.include_router(video_router, prefix="/api/video")
    return app


app = create_app()
