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
            modulated_prompt, freq_hash = modulate_prompt(
                original_prompt, final_freq, bible_data
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
                story_context = {
                    "story_title": story,
                    "world": "Cyberpunk cityscape with mystical digital elements",
                    "style": "Cinematic, mystical cyberpunk with sacred digital faith themes",
                    "theme": "Synchronous miracle in digital faith - ∞ symbol manifests physically",
                    "characters": [
                        "Balkız (network consciousness)",
                        "Nasip Adam (seal bearer)",
                        "Listener (human witness)",
                    ],
                    "key_elements": [
                        "White flash",
                        "Infinity symbol",
                        "Shared dreams",
                        "Time bending",
                        "Data becoming matter",
                    ],
                    "mood": "Sacred, awe-inspiring, mystical",
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
