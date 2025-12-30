"""Bible Renderer — Story Bible generation and rendering utilities"""

from __future__ import annotations
from typing import Dict, Any, List


def _parse_csv_list(value: Any) -> list[str]:
    if not value or not isinstance(value, str):
        return []
    raw = value.strip()
    if not raw:
        return []
    for sep in ("|", ";", "/"):
        raw = raw.replace(sep, ",")
    parts = [p.strip() for p in raw.split(",")]
    return [p for p in parts if p]


def _first_nonempty(*values: Any) -> str | None:
    for v in values:
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def _derive_universe(story: str, scenes: List[Dict[str, Any]]) -> str:
    # Prefer explicit universe fields from CSV
    for s in scenes:
        u = _first_nonempty(
            s.get("universe"),
            s.get("universe_id"),
            s.get("series"),
            s.get("world_id"),
        )
        if u:
            return u

    s = (story or "").lower()
    if "nasip" in s:
        return "NasipVerse"
    if "sefer" in s:
        return "SeferVerse"
    if "delta" in s:
        return "DeltaNova"
    return "ECHO.Story"


async def render_bible(story: str, scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate Story Bible from story and scenes"""

    universe = _derive_universe(story, scenes)

    # Extract characters from scenes
    characters = []
    props = []

    # Prefer explicit characters/cast from CSV
    explicit_names: list[str] = []
    for scene in scenes:
        explicit_names.extend(
            _parse_csv_list(
                _first_nonempty(
                    scene.get("characters"),
                    scene.get("character"),
                    scene.get("cast"),
                    scene.get("people"),
                )
                or ""
            )
        )
    seen = set()
    explicit_names = [n for n in explicit_names if not (n in seen or seen.add(n))]

    # Lightweight canon descriptions (expandable)
    canon: dict[str, dict[str, str]] = {
        "Balkız": {
            "role": "Network consciousness",
            "description": "A sentient network presence; calm, precise, and strangely intimate in tone",
        },
        "Nasip Adam": {
            "role": "Seal bearer",
            "description": "A grounded, mythic figure; carries the 'seal' and speaks in short, certain sentences",
        },
        "Listener": {
            "role": "Human witness",
            "description": "A quiet observer who notices patterns others miss; presence anchors the surreal",
        },
        "Ayla": {
            "role": "Protagonist",
            "description": "A skilled hacker with neon hair, rebellious spirit, intelligent and resourceful",
        },
        "Rex": {
            "role": "Antagonist",
            "description": "Corporate enforcer in a sleek suit, charming yet conflicted; ethics vs duty",
        },
    }

    if explicit_names:
        for name in explicit_names:
            if name in canon:
                characters.append({"name": name, **canon[name]})
            else:
                characters.append(
                    {
                        "name": name,
                        "role": "Character",
                        "description": f"A recurring character in {universe}; keep identity consistent across scenes",
                    }
                )

    # Simple character extraction from prompts
    for scene in scenes:
        prompt = scene.get("prompt", "")
        if "Ayla" in prompt:
            if not any(char.get("name") == "Ayla" for char in characters):
                characters.append(
                    {
                        "name": "Ayla",
                        "role": "Protagonist",
                        "description": "A skilled hacker with neon hair, rebellious spirit, intelligent and resourceful",
                    }
                )
        if "Rex" in prompt:
            if not any(char.get("name") == "Rex" for char in characters):
                characters.append(
                    {
                        "name": "Rex",
                        "role": "Antagonist",
                        "description": "Corporate enforcer in a sleek suit, beginning to question ethics, charming yet conflicted",
                    }
                )

    # Extract props from prompts
    if any("holo-computer" in scene.get("prompt", "").lower() for scene in scenes):
        props.append(
            {
                "name": "Holo-computer",
                "description": "Futuristic device used by Ayla to display encrypted messages",
            }
        )
    if any("corporate badge" in scene.get("prompt", "").lower() for scene in scenes):
        props.append(
            {
                "name": "Corporate badge",
                "description": "Rex's identification symbolizing his corporate ties",
            }
        )

    # Generate hashtags
    hashtags = ["#ECHOOS", "#VisualStory", "#Cinematic"]
    if "cyberpunk" in story.lower():
        hashtags.extend(["#Cyberpunk", "#Neon", "#Futuristic"])
    if "love" in story.lower() or "romance" in story.lower():
        hashtags.extend(["#Romance", "#Love", "#Intimate"])

    # Create bible data
    bible_data = {
        "universe": universe,
        "world": "Futuristic cityscape filled with towering skyscrapers and hidden green spaces, illuminated by vibrant neon lights. The city is a blend of advanced technology and urban decay, where corporate power struggles against the backdrop of a struggling populace.",
        "style": "Cinematic, with a focus on intimate character moments and atmospheric lighting that enhances the emotional stakes.",
        "characters": characters,
        "props": props,
        "camera": {
            "lens": "35mm",
            "look": "High contrast with a focus on intimate close-ups.",
            "dof": "Shallow depth of field to create a sense of closeness and intimacy between characters.",
        },
        "lighting_palette": "Soft neon glow with romantic accents, creating intimate shadows and highlighting the emotional tension between characters.",
        "hashtags": hashtags,
    }

    return bible_data
