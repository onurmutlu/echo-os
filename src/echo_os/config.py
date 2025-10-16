from __future__ import annotations
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_org: str | None = os.getenv("OPENAI_ORG")
    openai_project: str | None = os.getenv("OPENAI_PROJECT")
    model: str = os.getenv("ECHO_MODEL", "gpt-4o-mini")
    db_path: str = os.getenv("ECHO_DB", "echo.db")

    host: str = os.getenv("ECHO_HOST", "127.0.0.1")
    port: int = int(os.getenv("ECHO_PORT", "8081"))
    log_level: str = os.getenv("ECHO_LOG_LEVEL", "INFO")
    env: str = os.getenv("ECHO_ENV", "dev")

    artifact_dir: str = os.getenv("ECHO_ARTIFACT_DIR", "artifacts")
    scheduler: bool = os.getenv("ECHO_SCHEDULER", "false").lower() == "true"

    # ComfyUI & SD adapters
    comfy_host: str = os.getenv("COMFY_HOST", "http://127.0.0.1")
    comfy_port: int = int(os.getenv("COMFY_PORT", "8188"))


settings = Settings()
