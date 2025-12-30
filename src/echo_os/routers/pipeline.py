from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import os
import csv
import hashlib
from datetime import datetime
from pathlib import Path

from ..adapters.resonance import (
    compose_frequency,
    modulate_prompt,
    load_default_profile,
)
from ..adapters.render import get_adapter
from ..utils.bible_renderer import render_bible

router = APIRouter()


def _parse_csv_list(value: Optional[str]) -> list[str]:
    """Parse CSV cell like 'A, B; C | D' into ['A','B','C','D']."""
    if not value or not isinstance(value, str):
        return []
    raw = value.strip()
    if not raw:
        return []
    for sep in ("|", ";", "/"):
        raw = raw.replace(sep, ",")
    parts = [p.strip() for p in raw.split(",")]
    return [p for p in parts if p]


def _first_nonempty(*values: Optional[str]) -> Optional[str]:
    for v in values:
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def _canon_character_names(bible_data: Dict[str, Any]) -> list[str]:
    chars = bible_data.get("characters") if isinstance(bible_data, dict) else None
    out: list[str] = []
    if isinstance(chars, list):
        for c in chars:
            if isinstance(c, str) and c.strip():
                out.append(c.strip())
            elif isinstance(c, dict) and c.get("name"):
                out.append(str(c["name"]).strip())
    # de-dupe preserving order
    seen = set()
    return [n for n in out if not (n in seen or seen.add(n))]


def _infer_scene_characters(
    *, scene_id: Optional[str], prompt: Optional[str], bible_data: Dict[str, Any]
) -> list[str]:
    """Infer per-scene cast from scene_id/prompt, falling back to a stable default.

    Goal: keep identity consistent even when CSV doesn't specify characters.
    """
    canon = _canon_character_names(bible_data)
    if not canon:
        return []

    hay = f"{scene_id or ''} {prompt or ''}".lower()
    picked: list[str] = []
    for name in canon:
        if name and name.lower() in hay:
            picked.append(name)

    # If nothing matches, prefer "protagonist" role, else first character.
    if not picked:
        chars = bible_data.get("characters")
        if isinstance(chars, list):
            for c in chars:
                if (
                    isinstance(c, dict)
                    and c.get("name")
                    and str(c.get("role", "")).lower() == "protagonist"
                ):
                    return [str(c["name"]).strip()]
        return [canon[0]]

    # de-dupe preserving order
    seen = set()
    return [n for n in picked if not (n in seen or seen.add(n))]


class PipelineIn(BaseModel):
    story: str
    csv_path: str
    adapter: str = "openai-image"
    freq_profile: Optional[str] = None
    freq_story_override: Optional[Dict[str, Any]] = None
    use_csv_scene_freq: bool = False


async def _ninegrid(
    story: str,
    csv_path: str,
    adapter_name: str = "openai-image",
    freq_profile: Optional[str] = None,
    freq_story_override: Optional[Dict[str, Any]] = None,
    use_csv_scene_freq: bool = False,
):
    """Generate 9-grid story with Dynamic Frequency System and Bible integration"""

    # Load base frequency profile
    if freq_profile:
        # Load from frequency file
        freq_file = f"frequency/{freq_profile}.json"
        if os.path.exists(freq_file):
            with open(freq_file, "r") as f:
                base_profile = json.load(f)
        else:
            base_profile = load_default_profile()
    else:
        base_profile = load_default_profile()

    # Load CSV scenes
    scenes = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            scenes.append(row)

    # Generate Story Bible
    try:
        bible_data = await render_bible(story, scenes)
    except Exception as e:
        print(f"Bible generation failed: {e}")
        bible_data = {}

    # Create story directory
    timestamp = datetime.now().strftime("%Y-%m-%d")
    slug = story.lower().replace(" ", "-").replace("—", "--")
    story_dir = Path(f"artifacts/{timestamp}/{slug}")
    story_dir.mkdir(parents=True, exist_ok=True)

    # Initialize adapter
    adapter = get_adapter(adapter_name)

    # Process each scene
    saved = []
    for i, scene in enumerate(scenes, 1):
        try:
            # Scene-level universe/characters (optional, from CSV)
            scene_characters = _parse_csv_list(
                _first_nonempty(
                    scene.get("characters"),
                    scene.get("character"),
                    scene.get("cast"),
                    scene.get("people"),
                )
            )
            scene_universe = _first_nonempty(
                scene.get("universe"),
                scene.get("universe_id"),
                scene.get("series"),
                scene.get("world_id"),
            )
            if not scene_characters:
                scene_characters = _infer_scene_characters(
                    scene_id=scene.get("scene_id"),
                    prompt=scene.get("prompt"),
                    bible_data=bible_data or {},
                )

            # Parse scene frequency override
            scene_freq_override = {}
            if use_csv_scene_freq and scene.get("freq"):
                try:
                    scene_freq_override = json.loads(scene["freq"])
                except json.JSONDecodeError:
                    print(f"Invalid JSON in scene {i} freq: {scene.get('freq')}")

            # Compose final frequency
            final_freq = compose_frequency(
                base_profile, freq_story_override, scene_freq_override
            )

            # Modulate prompt with frequency and bible data
            original_prompt = scene["prompt"]
            scene_bible = dict(bible_data or {})
            if scene_characters:
                scene_bible["scene_characters"] = scene_characters
            if scene_universe:
                scene_bible["scene_universe"] = scene_universe
            modulated_prompt, freq_hash = modulate_prompt(
                original_prompt, final_freq, scene_bible
            )

            print(f"Scene {i} - Original: {original_prompt[:100]}...")
            print(f"Scene {i} - Modulated: {modulated_prompt[:100]}...")

            # Render image
            result = await adapter.render(project=story, prompt=modulated_prompt)

            # Create images directory
            images_dir = story_dir / "images"
            images_dir.mkdir(exist_ok=True)

            # Copy image with proper naming
            import shutil

            target_file = images_dir / f"{i:02d}_{scene['scene_id']}.png"

            # Handle different file types
            if result.path.suffix == ".txt":
                # Dummy adapter creates .txt files
                target_file = images_dir / f"{i:02d}_{scene['scene_id']}.txt"
                shutil.copy2(result.path, target_file)
            else:
                # Real image adapters create image files
                shutil.copy2(result.path, target_file)

            # Clean up the original adapter output directory immediately
            try:
                if result.path.parent.exists() and result.path.parent != images_dir:
                    # Remove all files in the adapter directory first
                    for file in result.path.parent.iterdir():
                        if file.is_file():
                            file.unlink()
                    # Then remove the directory
                    result.path.parent.rmdir()
                    print(f"Cleaned up adapter directory: {result.path.parent}")
            except Exception as e:
                print(f"Warning: Could not clean up {result.path.parent}: {e}")

            print(f"Scene {i} rendered successfully: {target_file}")

            # Save scene data
            scene_data = {
                "idx": i,
                "scene_id": scene["scene_id"],
                "file": f"{i:02d}_{scene['scene_id']}.png",
                "prompt_hash": hashlib.sha1(modulated_prompt.encode()).hexdigest()[:8],
                "freq_profile_id": final_freq.get("id", "unknown"),
                "freq_hash": freq_hash,
                "freq_effect": {
                    "weights": final_freq.get("weights", {}),
                    "palette": final_freq.get("emotional_palette", [])[:2],
                },
                # Optional scene-level consistency signals (if present in CSV)
                "characters": scene_characters,
                "universe": scene_universe,
            }
            saved.append(scene_data)

            print(f"Scene {i} rendered successfully: {result.path}")

        except Exception as e:
            print(f"Error processing scene {i}: {e}")
            continue

    # Create meta.json
    meta = {
        "story": story,
        "slug": slug,
        "grid": "3x3",
        "project": "ECHO.Story",
        "universe": bible_data.get("universe"),
        "world": bible_data.get("world", "Futuristic cityscape"),
        "style": bible_data.get("style", "Cinematic"),
        "characters": bible_data.get("characters", []),
        "props": bible_data.get("props", []),
        "camera": bible_data.get("camera", {}),
        "lighting_palette": bible_data.get(
            "lighting_palette", "Neon lights, high contrast"
        ),
        "public_base_url": f"/artifacts/{timestamp}/{slug}",
        "hashtags": bible_data.get(
            "hashtags", ["#ECHOOS", "#VisualStory", "#Cinematic"]
        ),
        "created_at": datetime.now().isoformat(),
        "adapters": [adapter_name],
        "scenes": saved,
    }

    # Save meta.json
    with open(f"{story_dir}/meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    # Generate Instagram captions automatically
    try:
        import httpx
        import asyncio

        async def generate_captions():
            async with httpx.AsyncClient(timeout=30) as client:
                # Create detailed story context for caption generation
                # Keep captions consistent with the same universe + cast used in renders
                def _character_names(chars):
                    out = []
                    if isinstance(chars, list):
                        for c in chars:
                            if isinstance(c, str) and c.strip():
                                out.append(c.strip())
                            elif isinstance(c, dict) and c.get("name"):
                                out.append(str(c["name"]).strip())
                    return out

                story_context = {
                    "story_title": story,
                    "universe": meta.get("universe"),
                    "world": meta.get("world"),
                    "style": meta.get("style"),
                    "characters": _character_names(meta.get("characters", [])),
                    "hashtags": meta.get("hashtags", []),
                }

                response = await client.post(
                    "http://127.0.0.1:8081/api/captions/generate",
                    json={
                        "slug": slug,
                        "platform": "instagram",
                        "max_chars": 2200,
                        "include_hashtags": True,
                        "include_story_beats": True,
                        "include_tech_specs": True,
                        "story_context": story_context,
                    },
                )
                if response.status_code == 200:
                    print("✅ Instagram captions generated automatically")
                else:
                    print(f"⚠️  Caption generation failed: {response.status_code}")

        # Run caption generation in background
        asyncio.create_task(generate_captions())
    except Exception as e:
        print(f"⚠️  Caption generation failed: {e}")

    # Video generation is now handled separately via /api/video/generate endpoint
    print(f"📹 Video generation available via: /api/video/generate?slug={slug}")

    # Count actual image files
    images_dir = story_dir / "images"
    image_count = 0
    if images_dir.exists():
        image_count = len([f for f in images_dir.iterdir() if f.is_file()])

    return {
        "ok": True,
        "dir": story_dir,
        "story": story,
        "slug": slug,
        "images": image_count,
        "adapter": adapter_name,
        "public_url": f"http://127.0.0.1:8081{meta['public_base_url']}",
    }


@router.post("/ninegrid")
async def ninegrid(pipeline_in: PipelineIn):
    """Generate 9-grid story with Dynamic Frequency System"""
    try:
        result = await _ninegrid(
            story=pipeline_in.story,
            csv_path=pipeline_in.csv_path,
            adapter_name=pipeline_in.adapter,
            freq_profile=pipeline_in.freq_profile,
            freq_story_override=pipeline_in.freq_story_override,
            use_csv_scene_freq=pipeline_in.use_csv_scene_freq,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
