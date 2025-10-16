"""OpenAI ASR Adapter — Speech-to-Text integration"""

from __future__ import annotations
from openai import OpenAI


async def transcribe(path: str) -> str:
    """Transcribe audio file to text using OpenAI Whisper"""
    client = OpenAI()

    with open(path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1", file=audio_file
        )

    return response.text
