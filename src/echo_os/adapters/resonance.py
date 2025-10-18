import json
import hashlib
from typing import Dict, Any, Tuple, Optional


def _h(s: str) -> str:
    """Generate short hash for frequency tracking"""
    return hashlib.sha1(s.encode()).hexdigest()[:8]


def compose_frequency(
    base_profile: Dict[str, Any],
    story_override: Optional[Dict[str, Any]] = None,
    scene_override: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Compose final frequency profile from base, story, and scene overrides"""
    out = dict(base_profile)

    for override in [story_override or {}, scene_override or {}]:
        for k, v in override.items():
            if isinstance(v, dict) and isinstance(out.get(k), dict):
                out[k].update(v)
            else:
                out[k] = v

    return out


def modulate_prompt(
    prompt: str, freq: Dict[str, Any], bible_data: Optional[Dict[str, Any]] = None
) -> Tuple[str, str]:
    """Modulate prompt with frequency and bible data for character consistency"""

    # Start with original prompt
    modulated_parts = [prompt]

    # Add frequency-based modulations
    if base_color := freq.get("base_color"):
        modulated_parts.append(f"color scheme {base_color}")

    if emotional_palette := freq.get("emotional_palette"):
        if isinstance(emotional_palette, list) and emotional_palette:
            modulated_parts.append(f"tone {', '.join(emotional_palette[:2])}")

    if narrative_motif := freq.get("narrative_motif"):
        modulated_parts.append(f"motif {narrative_motif}")

    if camera_bias := freq.get("camera_bias"):
        modulated_parts.append(camera_bias)

    if weights := freq.get("weights"):
        if weights.get("documentary", 0) > 0.6:
            modulated_parts.append("documentary realism")
        if weights.get("surreal", 0) > 0.5:
            modulated_parts.append("subtle surreal symbolism")
        if weights.get("warmth", 0) > 0.6:
            modulated_parts.append("warm light bias")

    # Add bible-based character consistency
    if bible_data:
        # Character consistency
        if characters := bible_data.get("characters"):
            char_descriptions = []
            for char in characters:
                if isinstance(char, dict) and "name" in char and "desc" in char:
                    char_descriptions.append(f"{char['name']}: {char['desc']}")
                elif (
                    isinstance(char, dict) and "name" in char and "description" in char
                ):
                    char_descriptions.append(f"{char['name']}: {char['description']}")

            if char_descriptions:
                modulated_parts.append(f"CHARACTERS: {', '.join(char_descriptions)}")

        # World consistency
        if world := bible_data.get("world"):
            modulated_parts.append(f"WORLD: {world}")

        # Style consistency
        if style := bible_data.get("style"):
            modulated_parts.append(f"STYLE: {style}")

        # Props consistency
        if props := bible_data.get("props"):
            if isinstance(props, list):
                prop_descriptions = []
                for prop in props:
                    if isinstance(prop, dict) and "name" in prop and "desc" in prop:
                        prop_descriptions.append(f"{prop['name']}: {prop['desc']}")
                    elif isinstance(prop, str):
                        prop_descriptions.append(prop)

                if prop_descriptions:
                    modulated_parts.append(f"PROPS: {', '.join(prop_descriptions)}")

        # Camera consistency
        if camera := bible_data.get("camera"):
            if isinstance(camera, dict):
                camera_parts = []
                if lens := camera.get("lens"):
                    camera_parts.append(f"lens {lens}")
                if look := camera.get("look"):
                    camera_parts.append(look)
                if dof := camera.get("dof"):
                    camera_parts.append(f"depth of field {dof}")

                if camera_parts:
                    modulated_parts.append(f"CAMERA: {', '.join(camera_parts)}")

        # Lighting consistency
        if lighting := bible_data.get("lighting_palette"):
            modulated_parts.append(f"LIGHTING: {lighting}")
        elif lighting := bible_data.get("lighting"):
            if isinstance(lighting, list):
                modulated_parts.append(f"LIGHTING: {', '.join(lighting)}")
            else:
                modulated_parts.append(f"LIGHTING: {lighting}")

    # Add negatives
    if negatives := freq.get("negatives"):
        if isinstance(negatives, list):
            modulated_parts.append(", ".join(negatives))

    # Combine all parts
    modulated_prompt = " ; ".join(modulated_parts)

    # Generate frequency hash
    freq_hash = _h(json.dumps(freq, sort_keys=True))

    return modulated_prompt, freq_hash


def load_default_profile() -> Dict[str, Any]:
    """Load default frequency profile"""
    try:
        with open("frequency/profile.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "id": "default_v1",
            "title": "Default Profile",
            "base_color": "neutral",
            "emotional_palette": ["neutral"],
            "narrative_motif": "standard",
            "camera_bias": "35mm, standard",
            "negatives": ["no text", "no logos", "no watermark"],
            "weights": {"warmth": 0.5, "surreal": 0.5, "documentary": 0.5},
        }


def create_frequency_snapshot(profile: Dict[str, Any], user: str) -> str:
    """Create a timestamped frequency snapshot"""
    import datetime

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    snapshot_id = f"{profile.get('id', 'unknown')}_{user}_{timestamp}"

    snapshot = dict(profile)
    snapshot["id"] = snapshot_id
    snapshot["created_at"] = datetime.datetime.now().isoformat()
    snapshot["created_by"] = user

    # Save snapshot
    import os

    os.makedirs("frequency/snapshots", exist_ok=True)
    with open(f"frequency/snapshots/{snapshot_id}.json", "w") as f:
        json.dump(snapshot, f, indent=2)

    return snapshot_id
