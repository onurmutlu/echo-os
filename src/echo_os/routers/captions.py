"""Instagram Captions & Hashtags Generator"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import json
from pathlib import Path

router = APIRouter()


class CaptionRequest(BaseModel):
    slug: str
    platform: str = "instagram"
    max_chars: int = 2200
    include_hashtags: bool = True
    include_story_beats: bool = True
    include_tech_specs: bool = False
    story_context: Dict[str, Any] = None


def load_story_meta(slug: str) -> Dict[str, Any]:
    """Load story metadata from artifacts"""
    # Find the story directory
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


def generate_story_beats(scenes: List[Dict]) -> List[str]:
    """Generate story beats from scenes"""
    beats = []
    for scene in scenes:
        scene_id = scene.get("scene_id", "unknown")
        # Convert scene_id to readable beat
        beat = scene_id.replace("_", " ").title()
        beats.append(beat)
    return beats


def generate_tech_specs(meta: Dict) -> str:
    """Generate technical specifications"""
    specs = []

    if "camera" in meta:
        camera = meta["camera"]
        if isinstance(camera, dict):
            lens = camera.get("lens", "Unknown")
            look = camera.get("look", "Unknown")
            dof = camera.get("dof", "Unknown")
            specs.append(f"📷 {lens} | {look} | {dof}")

    if "lighting_palette" in meta:
        lighting = meta["lighting_palette"]
        specs.append(f"💡 {lighting}")

    if "adapters" in meta:
        adapters = meta["adapters"]
        specs.append(f"🎨 Generated with: {', '.join(adapters)}")

    return " | ".join(specs)


def generate_hashtags(meta: Dict, story_beats: List[str]) -> List[str]:
    """Generate relevant hashtags"""
    hashtags = set()

    # Add existing hashtags from meta
    if "hashtags" in meta:
        hashtags.update(meta["hashtags"])

    # Add story-specific hashtags
    story_title = meta.get("story", "").lower()
    if "cyberpunk" in story_title:
        hashtags.update(["#Cyberpunk", "#Neon", "#Futuristic", "#TechNoir"])
    if "dreams" in story_title:
        hashtags.update(["#DigitalDreams", "#VirtualReality", "#AIDreams"])
    if "gölge" in story_title or "protokol" in story_title:
        hashtags.update(["#GölgeProtokolü", "#DigitalSpirituality", "#CodeAsFaith"])

    # Add scene-based hashtags
    for beat in story_beats:
        if "neon" in beat.lower():
            hashtags.add("#NeonAesthetic")
        if "data" in beat.lower():
            hashtags.add("#DataArt")
        if "neural" in beat.lower():
            hashtags.add("#NeuralInterface")
        if "virtual" in beat.lower():
            hashtags.add("#VirtualReality")
        if "digital" in beat.lower():
            hashtags.add("#DigitalArt")
        if "awakening" in beat.lower():
            hashtags.add("#DigitalAwakening")

    # Add general ECHO.OS hashtags
    hashtags.update(
        [
            "#ECHOOS",
            "#VisualStory",
            "#Cinematic",
            "#AIArt",
            "#DigitalStorytelling",
            "#CyberpunkArt",
            "#NeonAesthetic",
        ]
    )

    return sorted(list(hashtags))


def generate_caption(
    meta: Dict,
    story_beats: List[str],
    tech_specs: str,
    hashtags: List[str],
    max_chars: int,
    story_context: Dict = None,
) -> str:
    """Generate Instagram caption with character limit"""

    # Story title and description
    story_title = meta.get("story", "Untitled Story")

    # Use story_context if provided, otherwise fall back to meta
    if story_context:
        world = story_context.get("world", meta.get("world", "A futuristic world"))
        style = story_context.get("style", meta.get("style", "Cinematic"))
        theme = story_context.get(
            "theme", "A visual journey through digital spirituality"
        )
        characters = story_context.get("characters", [])
        key_elements = story_context.get("key_elements", [])
        # mood = story_context.get("mood", "Cinematic")  # Available for future use
    else:
        world = meta.get("world", "A futuristic world")
        style = meta.get("style", "Cinematic")
        theme = "A visual journey through digital spirituality"
        characters = []
        key_elements = []
        # mood = "Cinematic"  # Available for future use

    # Main caption
    caption_parts = [f"🎬 {story_title}", "", f"🌍 {world}", f"🎨 {style}", ""]

    # Add theme if available
    if theme:
        caption_parts.append(f"✨ {theme}")
        caption_parts.append("")

    # Add characters if available
    if characters:
        caption_parts.append("👥 Characters:")
        for char in characters[:3]:  # Limit to 3 characters
            caption_parts.append(f"• {char}")
        caption_parts.append("")

    # Add key elements if available
    if key_elements:
        caption_parts.append("🔑 Key Elements:")
        for element in key_elements[:5]:  # Limit to 5 elements
            caption_parts.append(f"• {element}")
        caption_parts.append("")

    # Add story beats
    caption_parts.append("📖 Story Beats:")

    # Add story beats
    for i, beat in enumerate(story_beats, 1):
        caption_parts.append(f"{i}. {beat}")

    caption_parts.extend(
        [
            "",
            "✨ A visual journey through digital spirituality and cyberpunk aesthetics.",
            "Code becomes prayer, data becomes faith, and the city awakens.",
            "",
        ]
    )

    # Add tech specs if requested
    if tech_specs:
        caption_parts.extend(["🔧 Technical Specs:", tech_specs, ""])

    # Add hashtags
    caption_parts.extend(["🏷️ Tags:", " ".join(hashtags)])

    # Join and check length
    full_caption = "\n".join(caption_parts)

    # If too long, truncate hashtags
    if len(full_caption) > max_chars:
        # Keep main content, reduce hashtags
        main_content = "\n".join(caption_parts[:-2])  # Remove hashtags section
        hashtag_section = "\n".join(caption_parts[-2:])  # Keep "🏷️ Tags:" line

        # Calculate available space for hashtags
        available_chars = (
            max_chars - len(main_content) - len(hashtag_section) - 2
        )  # -2 for newlines

        # Select most relevant hashtags
        priority_hashtags = [
            "#ECHOOS",
            "#VisualStory",
            "#Cinematic",
            "#Cyberpunk",
            "#DigitalArt",
            "#NeonAesthetic",
            "#AIDreams",
            "#DigitalSpirituality",
        ]

        selected_hashtags = []
        current_length = 0

        # Add priority hashtags first
        for tag in priority_hashtags:
            if current_length + len(tag) + 1 <= available_chars:
                selected_hashtags.append(tag)
                current_length += len(tag) + 1

        # Add remaining hashtags if space allows
        remaining_hashtags = [tag for tag in hashtags if tag not in priority_hashtags]
        for tag in remaining_hashtags:
            if current_length + len(tag) + 1 <= available_chars:
                selected_hashtags.append(tag)
                current_length += len(tag) + 1
            else:
                break

        full_caption = (
            main_content + "\n" + hashtag_section + "\n" + " ".join(selected_hashtags)
        )

    return full_caption


@router.post("/generate")
async def generate_captions(request: CaptionRequest):
    """Generate Instagram captions and hashtags for a story"""
    try:
        # Load story metadata
        meta = load_story_meta(request.slug)

        # Generate story beats from scenes
        scenes = meta.get("scenes", [])
        story_beats = generate_story_beats(scenes)

        # Generate tech specs if requested
        tech_specs = ""
        if request.include_tech_specs:
            tech_specs = generate_tech_specs(meta)

        # Generate hashtags
        hashtags = []
        if request.include_hashtags:
            hashtags = generate_hashtags(meta, story_beats)

        # Generate caption
        caption = generate_caption(
            meta,
            story_beats,
            tech_specs,
            hashtags,
            request.max_chars,
            request.story_context,
        )

        # Save caption to file
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

        if story_dir:
            caption_file = story_dir / "instagram_caption.txt"
            with open(caption_file, "w", encoding="utf-8") as f:
                f.write(caption)

        return {
            "ok": True,
            "slug": request.slug,
            "platform": request.platform,
            "caption_length": len(caption),
            "max_chars": request.max_chars,
            "hashtag_count": len(hashtags),
            "story_beats_count": len(story_beats),
            "caption": caption,
            "hashtags": hashtags,
            "saved_to": str(caption_file) if story_dir else None,
        }

    except Exception as e:
        raise HTTPException(500, f"Caption generation failed: {str(e)}")


@router.get("/{slug}")
async def get_captions(slug: str):
    """Get existing captions for a story"""
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

        caption_file = story_dir / "instagram_caption.txt"
        if not caption_file.exists():
            raise HTTPException(404, f"No captions found for: {slug}")

        with open(caption_file, "r", encoding="utf-8") as f:
            caption = f.read()

        return {
            "ok": True,
            "slug": slug,
            "caption": caption,
            "caption_length": len(caption),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to load captions: {str(e)}")
