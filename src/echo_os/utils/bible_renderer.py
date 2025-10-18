"""Bible Renderer — Story Bible generation and rendering utilities"""

from __future__ import annotations
from typing import Dict, Any, List


async def render_bible(story: str, scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate Story Bible from story and scenes"""

    # Extract characters from scenes
    characters = []
    props = []

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
