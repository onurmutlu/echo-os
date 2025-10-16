"""OpenAI TTS Adapter — Text-to-Speech integration"""

from __future__ import annotations
import time
from pathlib import Path
from openai import OpenAI
from ...artifacts.storage import artifact_path, write_meta


async def tts_generate(project: str, text: str, voice: str = "alloy") -> Path:
    """Generate speech from text using OpenAI TTS"""
    client = OpenAI()

    # Create artifact directory
    out = artifact_path(project, "openai-tts", seed=str(time.time()))
    audio_path = out / "voice.mp3"

    # Generate speech
    response = client.audio.speech.create(
        model="gpt-4o-mini-tts", voice=voice, input=text
    )

    # Save audio file
    audio_path.write_bytes(response.content)

    # Write metadata
    meta = {
        "adapter": "openai-tts",
        "voice": voice,
        "text": text,
        "model": "gpt-4o-mini-tts",
    }
    write_meta(out, meta)

    return audio_path
