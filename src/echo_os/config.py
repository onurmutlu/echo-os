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


settings = Settings()
