"""Artifact Storage — File system organization for generated content"""

from __future__ import annotations
from pathlib import Path
from datetime import datetime
import hashlib
import json
from ..config import settings


def _root() -> Path:
    p = Path(settings.artifact_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


def _slugify(txt: str) -> str:
    return "".join(
        c for c in txt.lower().replace(" ", "-") if c.isalnum() or c in "-_"
    )[:48]


def artifact_path(project: str, adapter: str, seed: str) -> Path:
    date = datetime.now().strftime("%Y-%m-%d")
    slug = _slugify(project) or "echo"
    h = hashlib.sha1(seed.encode()).hexdigest()[:8]
    p = _root() / date / slug / adapter / h
    p.mkdir(parents=True, exist_ok=True)
    return p


def write_meta(dirpath: Path, meta: dict) -> Path:
    mp = dirpath / "meta.json"
    mp.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    return mp
