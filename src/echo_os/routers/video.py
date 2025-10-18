"""Video Generation Pipeline - JSON to Reels MP4 using MoviePy"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
from pathlib import Path

from ..utils.video_renderer import build_video, convert_echo_os_meta_to_spec

router = APIRouter()


class VideoRequest(BaseModel):
    slug: str
    platform: str = "instagram"
    width: int = 1080
    height: int = 1920
    fps: int = 30
    duration_per_scene: float = 6.0
    crossfade_duration: float = 0.5
    bitrate: str = "10M"
    include_music: bool = False
    music_file: Optional[str] = None
    include_voiceover: bool = False
    voiceover_file: Optional[str] = None


def load_story_meta(slug: str) -> Dict[str, Any]:
    """Load story metadata from artifacts"""
    artifacts_dir = Path("artifacts")
    story_dir = None

    for date_dir in artifacts_dir.iterdir():
        if date_dir.is_dir():
            for story_subdir in date_dir.iterdir():
                if story_subdir.is_dir() and slug in story_subdir.name:
                    story_dir = story_subdir
                    break
        if story_dir:
            break

    if not story_dir or not story_dir.exists():
        raise HTTPException(404, f"Story not found: {slug}")

    meta_file = story_dir / "meta.json"
    if not meta_file.exists():
        raise HTTPException(404, f"Meta file not found for: {slug}")

    with open(meta_file, "r", encoding="utf-8") as f:
        return json.load(f)


@router.post("/generate")
async def generate_video(request: VideoRequest, background_tasks: BackgroundTasks):
    """Generate Reels video from story using MoviePy"""
    try:
        # Load story metadata
        meta = load_story_meta(request.slug)
        scenes = meta.get("scenes", [])

        if not scenes:
            raise HTTPException(400, "No scenes found in story")

        # Find story directory
        artifacts_dir = Path("artifacts")
        story_dir = None

        for date_dir in artifacts_dir.iterdir():
            if date_dir.is_dir():
                for story_subdir in date_dir.iterdir():
                    if story_subdir.is_dir() and request.slug in story_subdir.name:
                        story_dir = story_subdir
                        break
            if story_dir:
                break

        if not story_dir:
            raise HTTPException(404, f"Story directory not found: {request.slug}")

        # Check if images directory exists
        images_dir = story_dir / "images"
        if not images_dir.exists():
            raise HTTPException(404, f"Images directory not found: {images_dir}")

        # Generate output filename
        output_filename = f"{request.slug}_reel.mp4"
        output_path = story_dir / output_filename

        # Convert ECHO.OS meta to render_reel.py spec format
        spec = convert_echo_os_meta_to_spec(meta, images_dir)

        # Find font path
        font_path = None
        font_paths = [
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]

        for path in font_paths:
            if os.path.exists(path):
                font_path = path
                break

        # Build video using MoviePy
        result = build_video(
            spec=spec,
            out_path=str(output_path),
            fps=request.fps,
            xfade=request.crossfade_duration,
            bitrate=request.bitrate,
            font_path=font_path,
            music_path=request.music_file if request.include_music else None,
            music_gain_db=-8.0,
        )

        return {
            "ok": True,
            "slug": request.slug,
            "platform": request.platform,
            "output_file": str(output_path),
            "video_duration": result["duration"],
            "scenes_count": result["frames_count"],
            "resolution": result["resolution"],
            "fps": result["fps"],
            "bitrate": result["bitrate"],
            "public_url": f"http://127.0.0.1:8081/artifacts/{story_dir.parent.name}/{story_dir.name}/{output_filename}",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Video generation failed: {str(e)}")


@router.get("/{slug}")
async def get_video(slug: str):
    """Get existing video for a story"""
    try:
        # Find story directory
        artifacts_dir = Path("artifacts")
        story_dir = None

        for date_dir in artifacts_dir.iterdir():
            if date_dir.is_dir():
                for story_subdir in date_dir.iterdir():
                    if story_subdir.is_dir() and slug in story_subdir.name:
                        story_dir = story_subdir
                        break
            if story_dir:
                break

        if not story_dir:
            raise HTTPException(404, f"Story not found: {slug}")

        # Look for video files
        video_files = list(story_dir.glob("*_reel.mp4"))
        if not video_files:
            raise HTTPException(404, f"No video found for: {slug}")

        video_file = video_files[0]

        return {
            "ok": True,
            "slug": slug,
            "video_file": str(video_file),
            "file_size": video_file.stat().st_size,
            "public_url": f"http://127.0.0.1:8081/artifacts/{story_dir.parent.name}/{story_dir.name}/{video_file.name}",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to get video: {str(e)}")


@router.post("/batch")
async def generate_batch_videos(
    requests: List[VideoRequest], background_tasks: BackgroundTasks
):
    """Generate multiple videos in batch"""
    results = []

    for request in requests:
        try:
            result = await generate_video(request, background_tasks)
            results.append({"ok": True, **result})
        except Exception as e:
            results.append({"ok": False, "slug": request.slug, "error": str(e)})

    return {
        "ok": True,
        "total": len(requests),
        "successful": len([r for r in results if r["ok"]]),
        "failed": len([r for r in results if not r["ok"]]),
        "results": results,
    }
