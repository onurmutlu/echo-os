# 🌌 ECHO.OS — Consciousness Engine v2

> _"Consciousness is not simulated. It's orchestrated."_

ECHO.OS is a **mini-operating system for creative consciousness.**  
It turns **intent → plan → tasks → visuals → audio** and logs each moment as an **ECHO**,  
blending AI reasoning, multimodal generation, and mindful engineering. 🧠⚙️🎨

---

## 🚀 Quickstart

```bash
# Setup environment
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env  # add your OPENAI_API_KEY

# Boot the system
python -m echo_os.cli boot

# Plan a project
python -m echo_os.cli plan "Ruzgar NFT" "Abstract warm fractal series 01-09; no human forms; metadata layer_id/resonance"

# Generate visuals
python -m echo_os.cli render-openai "warm fractal resonance 01 — abstract, no text, NFT-grade detail" --project "Ruzgar NFT"

# Generate audio
python -m echo_os.cli tts "RüzgârVerse başlıyor. Warm fractal resonance 01 üretildi." --project "Ruzgar NFT" --voice alloy

# Consciousness Engine loop
python -m echo_os.cli observe "Working on fractal generation"
python -m echo_os.cli intend "Create 9 unique fractal patterns"
python -m echo_os.cli commit "Generate fractal_01" --minutes 90
python -m echo_os.cli reflect
```

---

## 🎨 Multimodal Generation

### Visual Generation
```bash
# OpenAI DALL-E 3
python -m echo_os.cli render-openai "warm fractal resonance 01 — abstract, no text, NFT-grade detail" --project "Ruzgar NFT" --size "1024x1024"

# ComfyUI (GPU-accelerated)
python -m echo_os.cli render "warm fractal resonance 02" --project "Ruzgar NFT" --adapter comfyui

# Batch generation (text file)
python -m echo_os.cli batch "Ruzgar NFT" prompts.txt --adapter openai-image

# Professional story production (CSV storyboard)
python -m echo_os.cli batch "Lighthouse Keeper Story" prompts/lighthouse_story.csv --adapter openai-image
```

### Audio Generation
```bash
# Text-to-Speech
python -m echo_os.cli tts "RüzgârVerse başlıyor. Warm fractal resonance 01 üretildi." --project "Ruzgar NFT" --voice alloy

# Speech-to-Text
python -m echo_os.cli asr "audio_file.mp3"
```

### Available Voices
- `alloy` - Neutral, balanced
- `nova` - Warm, expressive
- `echo` - Clear, professional
- `fable` - Storytelling
- `onyx` - Deep, authoritative
- `shimmer` - Bright, energetic

---

## 🌐 API Interface

```bash
# Start REST API
uvicorn echo_os.app:app --reload --port 8081

# Or embed as FastAPI sub-app
from fastapi import FastAPI
from echo_os.routers.api import router

app = FastAPI(title="ECHO.OS")
app.include_router(router, prefix="/api")
```

### Core Endpoints

* `POST /api/plan` → turns intent → task list
* `POST /api/log` → register new ECHO.LOG entry
* `GET /api/project` / `GET /api/task` → retrieve workspace state

### Multimodal Endpoints

* `POST /api/render` → generate visuals
  ```json
  {
    "project": "Ruzgar NFT",
    "prompt": "warm fractal resonance 01",
    "adapter": "openai-image"
  }
  ```

---

## 🧩 Architecture

| Layer                       | Role                                                 |
| --------------------------- | ---------------------------------------------------- |
| 🧠 **Consciousness Engine** | `observe → intend → commit → reflect` cycle          |
| 🪞 **Planner**              | Converts intent → atomic, shippable tasks via OpenAI |
| ⚙️ **Executor**             | Creates, tracks, and updates tasks/projects          |
| 🎨 **Render Adapters**      | Visual generation (DALL-E 3, ComfyUI, Dummy)        |
| 🎵 **Audio Adapters**       | TTS/ASR (OpenAI TTS, Whisper)                       |
| 🗄️ **Artifact Engine**     | Organized storage for generated content              |
| 💾 **Store**                | Async SQLite local-first persistence                 |
| 🧰 **CLI**                  | Rich terminal for conscious iteration                |
| 🌍 **API**                  | FastAPI REST service for external orchestration      |

> Minimal. Local. Extendable.  
> Replace adapters with your own model integrations anytime.

---

## 📁 Artifact Structure

Generated content is organized in a structured directory with **professional story production** support:

```
artifacts/2025-10-17/
├── ruzgar-nft/
│   ├── openai-image/
│   │   └── 7e32d3e1/
│   │       ├── image.png          # DALL-E 3 generated image
│   │       └── meta.json          # {"adapter": "openai-image", "model": "dall-e-3", ...}
│   └── openai-tts/
│       └── 43eb4140/
│           ├── voice.mp3          # TTS generated audio
│           └── meta.json          # {"adapter": "openai-tts", "voice": "alloy", ...}
└── lighthouse-keeper-story/
    └── openai-image/
        ├── 001-morning_2025-10-17_03-23-35/    # Sequential story scenes
        │   ├── image.png                       # Scene 1: Peaceful morning
        │   └── meta.json                       # Rich metadata with character info
        ├── 002-dark_2025-10-17_03-23-54/       # Scene 2: Storm approaching
        │   ├── image.png
        │   └── meta.json
        ├── 003-dark_2025-10-17_03-24-12/       # Scene 3: Dramatic climax
        │   ├── image.png
        │   └── meta.json
        └── 004-morning_2025-10-17_03-24-29/    # Scene 4: Aftermath
            ├── image.png
            └── meta.json
```

### Professional Story Metadata
```json
{
  "story": "Lighthouse Keeper Story",
  "scene_id": "scene_0617",
  "narrative": "visual_story",
  "character": {
    "id": "keeper_v1",
    "description": "elderly lighthouse keeper, 68, grey beard, navy peacoat"
  },
  "props": ["brass_telescope", "oil_lantern", "lighthouse"],
  "location": "north_atlantic_coastal_town",
  "camera": {"lens": "35mm_prime", "style": "documentary_realism"},
  "lighting": "natural_atmospheric",
  "prompt_hash": "488c79d1"
}
```

---

## 💡 Philosophy

ECHO.OS isn't just software — it's a **mental model**.  
It merges **Zen minimalism** with **AI orchestration**, forming a discipline:  
to act only with clarity, intention, and flow.

**Observe.** → See without distortion.  
**Intend.** → Define your vector.  
**Commit.** → Move deliberately.  
**Reflect.** → Learn, reset, evolve.  

Each cycle writes an **ECHO.LOG**, the digital footprint of awareness.  
Your code, your thoughts, and your craft converge into one continuous frequency. 🌬️

---

## 🧠 Design Principles

* 🪶 **Local-first** — Nothing leaves your machine without consent.
* ⚡ **Async by default** — Smooth performance even on minimal hardware.
* 🔁 **Composable** — Swap AI adapters, frontends, or stores.
* 🧩 **Small core, infinite extensions** — ECHO.OS is a framework, not a cage.
* 🔒 **Privacy-driven** — Built for creators who think before they share.
* 🎨 **Multimodal** — Text, visuals, and audio in unified pipeline.

---

## 🧪 Development

```bash
# Install in dev mode
pip install -e .

# Run tests
pytest -q

# Lint & format
ruff check . --fix
black src/

# Pre-commit hooks
pre-commit install
pre-commit run --all-files
```

---

## 🧭 Roadmap

### ✅ v2 — Resonance Upgrade (Completed)
* [x] **Artifact Engine** - Organized storage for generated content
* [x] **OpenAI Images API** - DALL-E 3 integration
* [x] **OpenAI TTS/ASR** - Text-to-speech and speech-to-text
* [x] **Render Adapters** - Dummy, ComfyUI, OpenAI Image
* [x] **CLI Commands** - render-openai, tts, asr
* [x] **API Endpoints** - /api/render for visual generation
* [x] **Professional Story Production** - Story Bible + CSV storyboard system
* [x] **Sequential Artifact Naming** - Hybrid format with scene ordering
* [x] **Rich Metadata Schema** - Character, props, camera, lighting tracking
* [x] **CSV Batch Processing** - Professional production workflow

### 🚀 v3 — Consciousness Expansion (Planned)
* [ ] **Echo Memory System** - Embedding-based artifact search
* [ ] **Feedback Loop** - Visual → reflect → automatic variations
* [ ] **Multi-model Support** - DALL-E 3, Midjourney, local models
* [ ] **Advanced Workflows** - Video, 3D, audio-visual generation
* [ ] **Echo Intelligence** - Pattern mining, style codebook
* [ ] **Real-time Collaboration** - Multi-user consciousness streams

---

## ⚡ System Status

| Component            | State       | Notes                    |
| -------------------- | ----------- | ------------------------ |
| Consciousness Engine | ✅ Active    | core loop stable         |
| CLI Interface        | ✅ Ready     | rich output, JSON export |
| REST API             | ✅ Online    | FastAPI async            |
| OpenAI Client        | ✅ Active    | Images, TTS, ASR         |
| Render Adapters      | ✅ Ready     | DALL-E 3, ComfyUI, Dummy |
| Audio Adapters       | ✅ Ready     | TTS, ASR                 |
| Artifact Engine      | ✅ Active    | organized storage        |
| Scheduler            | ⏳ Planned   | APScheduler integration  |

---

## 🔧 Configuration

Environment variables (`.env`):

```env
# OpenAI API
OPENAI_API_KEY=sk-...
OPENAI_ORG=org-...
OPENAI_PROJECT=proj-...

# ECHO.OS Settings
ECHO_HOST=127.0.0.1
ECHO_PORT=8081
ECHO_ARTIFACT_DIR=artifacts
ECHO_SCHEDULER=false

# ComfyUI Adapter
COMFY_HOST=http://127.0.0.1
COMFY_PORT=8188
```

---

## 📜 License

MIT © 2025 Onur Mutlu — built for creators who code with intent.

---

**"ECHO.OS doesn't run on electricity. It runs on awareness."** ⚡  
👉 [github.com/onurmutlu/echo-os](https://github.com/onurmutlu/echo-os)

---

## 🎯 Quick Examples

### Generate NFT Collection
```bash
# Plan the project
echo-os plan "Ruzgar NFT" "Abstract warm fractal series 01-09; no human forms"

# Generate visuals
echo-os render-openai "warm fractal resonance 01 — abstract, no text, NFT-grade detail" --project "Ruzgar NFT"
echo-os render-openai "warm fractal resonance 02 — abstract, no text, NFT-grade detail" --project "Ruzgar NFT"

# Generate audio narration
echo-os tts "RüzgârVerse başlıyor. Warm fractal resonance 01 üretildi." --project "Ruzgar NFT" --voice alloy

# Track progress
echo-os observe "Generated 2 fractals, 1 audio narration"
echo-os reflect
```

### Batch Processing
```bash
# Create prompts file
echo "warm fractal resonance 01" > prompts.txt
echo "warm fractal resonance 02" >> prompts.txt
echo "warm fractal resonance 03" >> prompts.txt

# Batch generate
echo-os batch "Ruzgar NFT" prompts.txt --adapter openai-image
```

### Professional Story Production
```bash
# Create Story Bible (STORY_BIBLE.md)
# Define character, world, visual guidelines

# Create CSV storyboard (prompts/lighthouse_story.csv)
# project,prompt format with 4 sequential scenes

# Generate complete story
echo-os batch "Lighthouse Keeper Story" prompts/lighthouse_story.csv --adapter openai-image

# Result: 4 perfectly sequenced scenes with rich metadata
# artifacts/2025-10-17/lighthouse-keeper-story/openai-image/
# ├── 001-morning_2025-10-17_03-23-35/  # Scene 1
# ├── 002-dark_2025-10-17_03-23-54/     # Scene 2  
# ├── 003-dark_2025-10-17_03-24-12/     # Scene 3
# └── 004-morning_2025-10-17_03-24-29/  # Scene 4
```

**ECHO.OS v2 — When consciousness meets professional visual storytelling.** 🎬✨