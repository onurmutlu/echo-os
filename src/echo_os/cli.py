from __future__ import annotations
import asyncio
import json
import typer
from rich import print
from .store import init_db
from .executor import ensure_project, upsert_tasks
from .planner import plan_from_intent
from .echo import engine
from .adapters.render.dummy import DummyRenderAdapter
from .adapters.render.comfyui import ComfyUIRenderAdapter
from .adapters.render.openai_image import OpenAIImageRenderAdapter
from .adapters.audio.openai_tts import tts_generate
from .adapters.audio.openai_asr import transcribe

app = typer.Typer(add_completion=False)


@app.command()
def boot():
    print("[bold cyan]ECHO.PROTOCOL v1 — online[/]")


@app.command()
def observe(text: str):
    print(json.dumps(engine.observe(text), ensure_ascii=False, indent=2))


@app.command()
def intend(vector: str):
    print(json.dumps(engine.intend(vector), ensure_ascii=False, indent=2))


@app.command()
def commit(task: str, minutes: int = typer.Option(90, "--minutes", "-m")):
    print(json.dumps(engine.commit(task, minutes), ensure_ascii=False, indent=2))


@app.command()
def reflect():
    print(json.dumps(engine.reflect(), ensure_ascii=False, indent=2))


@app.command()
def plan(project: str, context: str):
    async def run():
        await init_db()
        proj = await ensure_project(project)
        titles = await plan_from_intent(project, context)
        await upsert_tasks(proj.id, titles)
        print(
            json.dumps(
                {"project": project, "tasks": titles}, ensure_ascii=False, indent=2
            )
        )

    asyncio.run(run())


@app.command()
def render(prompt: str, project: str = "Default", adapter: str = "dummy"):
    async def run():
        ad = DummyRenderAdapter() if adapter == "dummy" else ComfyUIRenderAdapter()
        res = await ad.render(project=project, prompt=prompt)
        print(
            json.dumps(
                {"ok": True, "adapter": ad.name, "path": str(res.path)},
                ensure_ascii=False,
            )
        )

    asyncio.run(run())


@app.command()
def batch(project: str, file: str, adapter: str = "dummy"):
    """
    file: satır başı bir prompt
    """
    import asyncio
    import json

    async def run():
        if adapter == "openai-image":
            ad = OpenAIImageRenderAdapter()
        elif adapter == "dummy":
            ad = DummyRenderAdapter()
        else:
            ad = ComfyUIRenderAdapter()
        out = []
        for p in Path(file).read_text().splitlines():
            if not p.strip():
                continue
            res = await ad.render(project=project, prompt=p.strip())
            out.append(str(res.path))
        print(json.dumps({"ok": True, "paths": out}, ensure_ascii=False))

    from pathlib import Path

    asyncio.run(run())


@app.command()
def render_openai(prompt: str, project: str = "Default", size: str = "1024x1024"):
    """Generate image using OpenAI Images API"""
    import asyncio
    import json

    async def run():
        res = await OpenAIImageRenderAdapter().render(
            project=project, prompt=prompt, size=size
        )
        print(json.dumps({"ok": True, "path": str(res.path)}, ensure_ascii=False))

    asyncio.run(run())


@app.command()
def tts(text: str, project: str = "Default", voice: str = "alloy"):
    """Generate speech from text using OpenAI TTS"""
    import asyncio
    import json

    async def run():
        path = await tts_generate(project=project, text=text, voice=voice)
        print(json.dumps({"ok": True, "path": str(path)}, ensure_ascii=False))

    asyncio.run(run())


@app.command()
def asr(file_path: str):
    """Transcribe audio file to text using OpenAI Whisper"""
    import asyncio
    import json

    async def run():
        text = await transcribe(file_path)
        print(json.dumps({"ok": True, "text": text}, ensure_ascii=False))

    asyncio.run(run())


@app.command()
def pipeline(
    project: str,
    prompt: str,
    text: str = "",
    voice: str = "alloy",
    adapter: str = "openai-image",
    size: str = "1024x1024",
    log_code: str = "ECHO.LOG/005",
    log_title: str = "",
):
    """Complete pipeline: render → tts → log in one command"""
    import asyncio
    import json
    import httpx

    async def run():
        results = {"images": [], "audios": [], "logs": []}

        # 1) Generate image
        if prompt:
            if adapter == "openai-image":
                res = await OpenAIImageRenderAdapter().render(
                    project=project, prompt=prompt, size=size
                )
            else:
                ad = (
                    DummyRenderAdapter()
                    if adapter == "dummy"
                    else ComfyUIRenderAdapter()
                )
                res = await ad.render(project=project, prompt=prompt)
            results["images"].append(str(res.path))

        # 2) Generate audio
        if text:
            audio_path = await tts_generate(project=project, text=text, voice=voice)
            results["audios"].append(str(audio_path))

        # 3) Log to API
        if results["images"] or results["audios"]:
            log_data = {
                "code": log_code,
                "title": log_title or f"{project} Pipeline",
                "content": f"Generated {len(results['images'])} images, {len(results['audios'])} audios",
            }

            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "http://127.0.0.1:8081/api/log",
                        json=log_data,
                        headers={"content-type": "application/json"},
                    )
                    if response.status_code == 200:
                        results["logs"].append("logged to API")
                    else:
                        results["logs"].append(f"API error: {response.status_code}")
            except Exception as e:
                results["logs"].append(f"API error: {str(e)}")

        print(json.dumps({"ok": True, "pipeline": results}, ensure_ascii=False))

    asyncio.run(run())


@app.command()
def batch_pipeline(
    project: str,
    prompts_file: str,
    text_template: str = "Generated {prompt}",
    voice: str = "alloy",
    adapter: str = "openai-image",
    size: str = "1024x1024",
):
    """Batch pipeline: process multiple prompts from file"""
    import asyncio
    import json
    import httpx

    async def run():
        results = {"batches": []}

        # Read prompts from file
        with open(prompts_file, "r") as f:
            prompts = [line.strip() for line in f if line.strip()]

        for i, prompt in enumerate(prompts, 1):
            batch_result = {"prompt": prompt, "images": [], "audios": [], "logs": []}

            # Generate image
            if adapter == "openai-image":
                res = await OpenAIImageRenderAdapter().render(
                    project=project, prompt=prompt, size=size
                )
            else:
                ad = (
                    DummyRenderAdapter()
                    if adapter == "dummy"
                    else ComfyUIRenderAdapter()
                )
                res = await ad.render(project=project, prompt=prompt)
            batch_result["images"].append(str(res.path))

            # Generate audio
            text = text_template.format(prompt=prompt, index=i)
            audio_path = await tts_generate(project=project, text=text, voice=voice)
            batch_result["audios"].append(str(audio_path))

            # Log to API
            log_data = {
                "code": f"ECHO.LOG/{i:03d}",
                "title": f"Batch {i}: {prompt[:50]}...",
                "content": f"Generated image and audio for: {prompt}",
            }

            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "http://127.0.0.1:8081/api/log",
                        json=log_data,
                        headers={"content-type": "application/json"},
                    )
                    if response.status_code == 200:
                        batch_result["logs"].append("logged to API")
                    else:
                        batch_result["logs"].append(
                            f"API error: {response.status_code}"
                        )
            except Exception as e:
                batch_result["logs"].append(f"API error: {str(e)}")

            results["batches"].append(batch_result)

        print(json.dumps({"ok": True, "batch_pipeline": results}, ensure_ascii=False))

    asyncio.run(run())


@app.command()
def ninegrid(
    story: str,
    csv: str,
    adapter: str = "openai-image",
    freq_profile: str = "warm_fractal_amber_v1",
    freq_override: str = None,
    use_scene_freq: bool = False,
):
    """Generate 9-grid story with Dynamic Frequency System"""
    import asyncio
    import json
    import httpx

    async def run():
        # Prepare request data
        data = {
            "story": story,
            "csv_path": csv,
            "adapter": adapter,
            "freq_profile": freq_profile,
            "use_csv_scene_freq": use_scene_freq,
        }

        if freq_override:
            data["freq_story_override"] = json.loads(freq_override)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "http://127.0.0.1:8081/api/pipeline/ninegrid",
                    json=data,
                    headers={"content-type": "application/json"},
                )

                if response.status_code == 200:
                    result = response.json()
                    print("✅ Story generated successfully!")
                    print(f"📁 Directory: {result['dir']}")
                    print(f"🎬 Story: {result['story']}")
                    print(f"🖼️  Images: {result['images']}")
                    print(f"🔗 Public URL: {result['public_url']}")
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"Response: {response.text}")

        except Exception as e:
            print(f"❌ Connection error: {e}")

    asyncio.run(run())


@app.command()
def captions(
    slug: str,
    platform: str = "instagram",
    max_chars: int = 2200,
    include_hashtags: bool = True,
    include_story_beats: bool = True,
    include_tech_specs: bool = False,
):
    """Generate Instagram captions and hashtags for a story"""
    import asyncio
    import httpx

    async def run():
        data = {
            "slug": slug,
            "platform": platform,
            "max_chars": max_chars,
            "include_hashtags": include_hashtags,
            "include_story_beats": include_story_beats,
            "include_tech_specs": include_tech_specs,
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    "http://127.0.0.1:8081/api/captions/generate",
                    json=data,
                    headers={"content-type": "application/json"},
                )

                if response.status_code == 200:
                    result = response.json()
                    print("✅ Captions generated successfully!")
                    print(
                        f"📝 Caption length: {result['caption_length']}/{result['max_chars']} characters"
                    )
                    print(f"🏷️  Hashtags: {result['hashtag_count']}")
                    print(f"📖 Story beats: {result['story_beats_count']}")
                    if result.get("saved_to"):
                        print(f"💾 Saved to: {result['saved_to']}")
                    print("\n" + "=" * 50)
                    print("CAPTION:")
                    print("=" * 50)
                    print(result["caption"])
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"Response: {response.text}")

        except Exception as e:
            print(f"❌ Connection error: {e}")

    asyncio.run(run())


@app.command()
def video(
    slug: str,
    platform: str = "instagram",
    width: int = 1080,
    height: int = 1920,
    fps: int = 30,
    duration_per_scene: float = 6.0,
    crossfade_duration: float = 0.5,
    bitrate: str = "10M",
    include_music: bool = False,
    music_file: str = None,
):
    """Generate Reels video from story"""
    import asyncio
    import httpx

    async def run():
        data = {
            "slug": slug,
            "platform": platform,
            "width": width,
            "height": height,
            "fps": fps,
            "duration_per_scene": duration_per_scene,
            "crossfade_duration": crossfade_duration,
            "bitrate": bitrate,
            "include_music": include_music,
            "music_file": music_file,
        }

        try:
            async with httpx.AsyncClient(
                timeout=300
            ) as client:  # 5 min timeout for video generation
                response = await client.post(
                    "http://127.0.0.1:8081/api/video/generate",
                    json=data,
                    headers={"content-type": "application/json"},
                )

                if response.status_code == 200:
                    result = response.json()
                    print("✅ Video generated successfully!")
                    print(f"🎬 Story: {result['slug']}")
                    print(f"📱 Platform: {result['platform']}")
                    print(f"⏱️  Duration: {result['video_duration']:.1f}s")
                    print(f"🎞️  Scenes: {result['scenes_count']}")
                    print(f"📐 Resolution: {result['resolution']}")
                    print(f"🎯 FPS: {result['fps']}")
                    print(f"💾 Bitrate: {result['bitrate']}")
                    print(f"📁 Output: {result['output_file']}")
                    print(f"🔗 Public URL: {result['public_url']}")
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"Response: {response.text}")

        except Exception as e:
            print(f"❌ Connection error: {e}")

    asyncio.run(run())


if __name__ == "__main__":
    app()
