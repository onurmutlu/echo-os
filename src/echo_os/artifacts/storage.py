"""Artifact Storage — File system organization for generated content"""

from __future__ import annotations
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict


@dataclass
class ArtifactMetadata:
    id: str
    slug: str
    prompt: str
    adapter: str
    timestamp: datetime
    file_path: str
    file_hash: str
    file_size: int
    generation_time: float
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data


class ArtifactStorage:
    """Manages artifact storage in organized directory structure"""

    def __init__(self, base_path: str = "artifacts"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)

    def _generate_hash(self, content: bytes) -> str:
        """Generate SHA256 hash of content"""
        return hashlib.sha256(content).hexdigest()

    def _get_date_path(self) -> Path:
        """Get today's date path: artifacts/YYYY-MM-DD/"""
        today = datetime.now().strftime("%Y-%m-%d")
        return self.base_path / today

    def _get_slug_path(self, slug: str) -> Path:
        """Get slug path: artifacts/YYYY-MM-DD/slug/"""
        return self._get_date_path() / slug

    async def store_artifact(
        self,
        content: bytes,
        prompt: str,
        adapter: str,
        slug: str,
        metadata: Dict[str, Any],
        generation_time: float = 0.0,
    ) -> ArtifactMetadata:
        """Store artifact with organized structure"""

        # Generate hash and paths
        file_hash = self._generate_hash(content)
        slug_path = self._get_slug_path(slug)
        slug_path.mkdir(parents=True, exist_ok=True)

        # Determine file extension from content or metadata
        file_ext = metadata.get("format", "png")
        if not file_ext.startswith("."):
            file_ext = f".{file_ext}"

        # Create unique filename with hash
        filename = f"{file_hash[:12]}{file_ext}"
        file_path = slug_path / filename

        # Write file
        with open(file_path, "wb") as f:
            f.write(content)

        # Create metadata
        artifact = ArtifactMetadata(
            id=file_hash[:16],  # Short ID
            slug=slug,
            prompt=prompt,
            adapter=adapter,
            timestamp=datetime.utcnow(),
            file_path=str(file_path),
            file_hash=file_hash,
            file_size=len(content),
            generation_time=generation_time,
            metadata=metadata,
        )

        # Save metadata JSON
        meta_path = slug_path / f"{file_hash[:12]}.meta.json"
        with open(meta_path, "w") as f:
            json.dump(artifact.to_dict(), f, indent=2)

        return artifact

    def get_artifact(self, artifact_id: str) -> Optional[ArtifactMetadata]:
        """Retrieve artifact metadata by ID"""
        # TODO: Implement artifact lookup
        # Search through date directories for matching ID
        pass

    def list_artifacts(self, slug: Optional[str] = None) -> list[ArtifactMetadata]:
        """List all artifacts, optionally filtered by slug"""
        artifacts = []

        for date_path in self.base_path.iterdir():
            if not date_path.is_dir():
                continue

            if slug:
                slug_path = date_path / slug
                if not slug_path.exists():
                    continue
                search_paths = [slug_path]
            else:
                search_paths = [p for p in date_path.iterdir() if p.is_dir()]

            for slug_path in search_paths:
                for meta_file in slug_path.glob("*.meta.json"):
                    try:
                        with open(meta_file, "r") as f:
                            meta_data = json.load(f)
                            # Convert timestamp back to datetime
                            meta_data["timestamp"] = datetime.fromisoformat(
                                meta_data["timestamp"]
                            )
                            artifacts.append(ArtifactMetadata(**meta_data))
                    except Exception:
                        continue

        return sorted(artifacts, key=lambda x: x.timestamp, reverse=True)

    def get_artifact_path(self, artifact_id: str) -> Optional[Path]:
        """Get file path for artifact"""
        # TODO: Implement path lookup
        pass
