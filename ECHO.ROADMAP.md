# ECHO.OS v2 — Resonance Upgrade
_When consciousness meets GPU._

## Vision
Intent → Plan → **Visual** → Reflect.  
Bilinçten koda giden hat, v2'de görselle kapanıyor. Her ECHO.LOG, görsel/artefact'la mühürlenir.

## Phases

### Phase 1 — Echo Render Pipeline (2–3 hafta)
- [ ] **Artifact Engine**: `artifacts/` yapısı, meta.json, içerik adresleme (hash)
- [ ] **Render Adapters**: `adapters/render/` (comfyui, sd-webui, dall-e, local)
- [ ] **CLI**: `echo-os render "prompt"` + `echo-os batch @prompts.txt`
- [ ] **API**: `POST /api/render` (async job id, progress)
- [ ] **Jobs**: APScheduler ile kuyruk/ retry / timeout

### Phase 2 — Resonance Engine (2–3 hafta)
- [ ] **Feedback Loop**: artefact → reflect → otomatik varyasyon
- [ ] **Multimodal Plan**: görsel hedeflerini task'lara böl
- [ ] **Echo Memory**: embedding'li arama (offline, local)

### Phase 3 — Consciousness Expansion (3–4 hafta)
- [ ] **Multi-Model**: MJ / DALL-E / local SD seçim stratejisi
- [ ] **Modalities**: video(Comfy/Animate), audio(DDSP), 3D(NeRF)
- [ ] **Echo Intelligence**: pattern mining, style codebook

## Deliverables
- `/artifacts/<yyyy-mm-dd>/<slug>/<hash>/` → image|video + `meta.json`
- `/prompts/` → prompt paketleri + sürüm
- `/docs/` → usage, adapters, examples

## Acceptance Criteria
- `echo-os render "warm fractal"` → tek komutla görsel üretir, artefact kaydeder
- `/api/render` → job başlatır, `/api/job/{id}` → durum/indir
- `echo-os reflect` → son artefact'lardan öğrenme notu üretir

## Risks & Mitigation
- GPU yok → adapter fallback (hosted API / CPU lowres)
- Rate limit → exponential backoff + cached prompts
- Privasi → tüm meta yerel, upload opsiyonel/kapalı

## Milestones
- M2.1: Render/Artifact/CLI
- M2.2: API/Jobs
- M2.3: Feedback/Memory