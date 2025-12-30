"""MoviePy-based Video Renderer for ECHO.OS"""

import os
import uuid
from typing import Optional, Dict, Any
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw, ImageFont

try:
    from moviepy.editor import (
        ImageClip,
        AudioFileClip,
        CompositeVideoClip,
        concatenate_videoclips,
        vfx,
    )
except ImportError:
    from moviepy import (
        ImageClip,
        AudioFileClip,
        CompositeVideoClip,
        concatenate_videoclips,
        vfx,
    )

# Reels dimensions
W, H = 1080, 1920


def _ease_in_out(t01: float) -> float:
    """Smooth easing for motion (0..1 -> 0..1)."""
    x = max(0.0, min(1.0, float(t01)))
    # Smoothstep: 3x^2 - 2x^3
    return x * x * (3.0 - 2.0 * x)


def _with_duration(clip, dur: float):
    return (
        clip.with_duration(dur)
        if hasattr(clip, "with_duration")
        else clip.set_duration(dur)
    )


def _with_position(clip, pos):
    return (
        clip.with_position(pos)
        if hasattr(clip, "with_position")
        else clip.set_position(pos)
    )


def _resized(clip, scale_or_size):
    return (
        clip.resized(scale_or_size)
        if hasattr(clip, "resized")
        else clip.resize(scale_or_size)
    )


def _set_audio(video_clip, audio_clip):
    return (
        video_clip.set_audio(audio_clip)
        if hasattr(video_clip, "set_audio")
        else video_clip.with_audio(audio_clip)
    )


def load_font(font_path: Optional[str], size: int) -> ImageFont.ImageFont:
    """Load font with fallbacks"""
    if font_path and os.path.exists(font_path):
        return ImageFont.truetype(font_path, size=size)

    # Fallback fonts
    fallback_paths = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]

    for path in fallback_paths:
        if os.path.exists(path):
            return ImageFont.truetype(path, size=size)

    return ImageFont.load_default()


def make_text_panel(
    text: str,
    max_width: int,
    font: ImageFont.ImageFont,
    padding: tuple = (24, 14),
    opacity: int = 140,
) -> Optional[str]:
    """Create text panel with PIL"""
    if not text or not text.strip():
        return None

    # Manual text wrapping
    tmp_img = Image.new("RGBA", (max_width, 64), (0, 0, 0, 0))
    tmp_draw = ImageDraw.Draw(tmp_img)
    words = text.split()
    lines, line = [], ""

    for word in words:
        test = (line + " " + word).strip()
        bbox = tmp_draw.textbbox((0, 0), test, font=font)
        if bbox[2] > max_width - padding[0] * 2 and line:
            lines.append(line)
            line = word
        else:
            line = test

    if line:
        lines.append(line)

    line_h = font.getbbox("Ay")[3] + 6
    total_h = line_h * len(lines) + padding[1] * 2

    img = Image.new("RGBA", (max_width, total_h), (0, 0, 0, 0))
    panel = Image.new("RGBA", img.size, (0, 0, 0, opacity))
    img.paste(panel, (0, 0))

    draw = ImageDraw.Draw(img)
    y = padding[1]
    for line in lines:
        draw.text((padding[0], y), line, font=font, fill=(255, 255, 255, 255))
        y += line_h

    # Save to temp file
    output_path = os.path.join("/tmp", f"_txt_{uuid.uuid4().hex}.png")
    img.save(output_path)
    return output_path


def _normalize_characters(value: Any) -> list[str]:
    """Normalize characters field to a list of display names."""
    if not value:
        return []
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if isinstance(item, str):
                if item.strip():
                    out.append(item.strip())
            elif isinstance(item, dict):
                name = (
                    item.get("name")
                    or item.get("id")
                    or item.get("title")
                    or item.get("label")
                )
                if isinstance(name, str) and name.strip():
                    out.append(name.strip())
        return out
    if isinstance(value, dict):
        # Common shapes: {"characters": [...]} or {"name": "..."}
        if "characters" in value:
            return _normalize_characters(value.get("characters"))
        name = (
            value.get("name")
            or value.get("id")
            or value.get("title")
            or value.get("label")
        )
        if isinstance(name, str) and name.strip():
            return [name.strip()]
    return []


def _derive_universe_label(meta: Dict[str, Any]) -> str:
    """Best-effort universe label from meta fields."""
    for k in ("universe", "universe_id", "series", "project"):
        v = meta.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()

    slug = meta.get("slug")
    if isinstance(slug, str):
        s = slug.lower()
        if "nasip" in s:
            return "NasipVerse"
        if "sefer" in s:
            return "SeferVerse"
        if "delta" in s:
            return "DeltaNova"

    world = meta.get("world")
    if isinstance(world, str) and world.strip():
        # Keep it short for overlay readability
        return world.strip()[:28]

    return "ECHO.Story"


def _make_badge_panel(
    text: str,
    font_path: Optional[str],
    max_width: int,
    size: int = 34,
    opacity: int = 160,
) -> Optional[str]:
    if not text or not text.strip():
        return None
    font = load_font(font_path, size)
    return make_text_panel(
        text=text.strip(),
        max_width=max_width,
        font=font,
        padding=(20, 12),
        opacity=opacity,
    )


def smart_fit_with_blur(
    img_path: str,
    dur: float,
    enable_kenburns: bool = True,
    zoom_factor: float = 0.06,
) -> CompositeVideoClip:
    """Create smart-fit image with blurred background and Ken Burns effect"""
    im = Image.open(img_path).convert("RGB")

    # Create blurred background
    bg = im.copy().resize((W, H))
    bg = bg.filter(ImageFilter.GaussianBlur(radius=25))
    bg_path = os.path.join("/tmp", f"_bg_{uuid.uuid4().hex}.jpg")
    bg.save(bg_path, quality=85)
    bg_clip = _with_duration(ImageClip(bg_path), dur)

    # Create foreground with smart scaling
    fg = _with_duration(ImageClip(img_path), dur)
    iw, ih = fg.size
    base_scale = min(W / iw, (H * 0.9) / ih)

    # Smooth Ken Burns zoom (real motion, makes the video feel less "static")
    if enable_kenburns and zoom_factor and zoom_factor > 0:
        dur_safe = max(float(dur), 0.01)

        def _scale_at_time(t: float) -> float:
            return base_scale * (1.0 + float(zoom_factor) * _ease_in_out(t / dur_safe))

        # MoviePy 1.x expects resize() + fx(); MoviePy 2.x still supports fx().
        fg = fg.fx(vfx.resize, _scale_at_time)
    else:
        fg = _resized(fg, base_scale)

    fg = _with_position(fg, "center")

    comp = _with_duration(CompositeVideoClip([bg_clip, fg], size=(W, H)), dur)

    return comp


def make_clip_for_frame(
    frame: Dict[str, Any],
    fps: int,
    font_path: Optional[str],
    subtitle_size: int = 40,
    caption_size: int = 44,
) -> CompositeVideoClip:
    """Create video clip for a single frame"""
    asset = frame["asset"]
    dur = float(frame.get("dur", 6.0))
    subtitle = frame.get("subtitle", "")
    caption = frame.get("caption_tr", "")

    # Create base clip with smart fit and blur
    base = smart_fit_with_blur(
        asset,
        dur,
        enable_kenburns=bool(frame.get("enable_kenburns", True)),
        zoom_factor=float(frame.get("kenburns_zoom", 0.06)),
    )
    layers = [base]

    # Load fonts
    font_sub = load_font(font_path, subtitle_size)
    font_cap = load_font(font_path, caption_size)

    # Create subtitle text panel
    if subtitle:
        sub_path = make_text_panel(
            subtitle, max_width=int(W * 0.9), font=font_sub, opacity=110
        )
        if sub_path:
            sub_clip = _with_position(
                _with_duration(ImageClip(sub_path), dur), ("center", 80)
            )
            layers.append(sub_clip)

    # Universe + character consistency overlays (top corners)
    universe = frame.get("universe")
    if isinstance(universe, str) and universe.strip():
        uni_path = _make_badge_panel(
            text=universe,
            font_path=font_path,
            max_width=int(W * 0.55),
            size=32,
            opacity=165,
        )
        if uni_path:
            uni_clip = _with_position(
                _with_duration(ImageClip(uni_path), dur),
                (40, 40),
            )
            layers.append(uni_clip)

    chars = frame.get("characters")
    char_list = _normalize_characters(chars)
    if char_list:
        char_text = " · ".join(char_list[:3])
        char_path = _make_badge_panel(
            text=char_text,
            font_path=font_path,
            max_width=int(W * 0.55),
            size=30,
            opacity=150,
        )
        if char_path:
            char_clip = _with_position(
                _with_duration(ImageClip(char_path), dur),
                (W - 40, 40),
            )
            # right-align: MoviePy can accept ("right", y), but we keep numeric
            # by shifting with clip's width when available.
            try:
                w = char_clip.size[0]
                char_clip = _with_position(char_clip, (W - w - 40, 40))
            except Exception:
                pass
            layers.append(char_clip)

    # Create caption text panel
    if caption:
        cap_path = make_text_panel(
            caption, max_width=int(W * 0.9), font=font_cap, opacity=140
        )
        if cap_path:
            cap_img = Image.open(cap_path)
            cap_h = cap_img.size[1]
            cap_clip = _with_position(
                _with_duration(ImageClip(cap_path), dur),
                ("center", H - cap_h - 120),
            )
            layers.append(cap_clip)

    comp = _with_duration(CompositeVideoClip(layers, size=(W, H)), dur)
    return comp


def build_video(
    spec: Dict[str, Any],
    out_path: str,
    fps: int = 30,
    xfade: float = 0.5,
    bitrate: str = "10M",
    font_path: Optional[str] = None,
    music_path: Optional[str] = None,
    music_gain_db: float = -8.0,
    enable_kenburns: bool = True,
    kenburns_zoom: float = 0.06,
) -> Dict[str, Any]:
    """Build video from Echo-OS JSON spec"""
    frames = spec.get("frames", [])
    if not frames:
        raise ValueError("No frames found in spec")

    # Create clips for each frame
    clips = []
    for i, frame in enumerate(frames):
        # Allow global motion defaults (frame can override)
        frame = dict(frame)
        frame.setdefault("enable_kenburns", enable_kenburns)
        frame.setdefault("kenburns_zoom", kenburns_zoom)
        clip = make_clip_for_frame(frame, fps=fps, font_path=font_path)
        clips.append(clip)

    # Real crossfade: overlap + fade-in on subsequent clips
    seq = []
    xfade = max(0.0, float(xfade))
    for i, clip in enumerate(clips):
        if i > 0 and xfade > 0 and hasattr(clip, "crossfadein"):
            seq.append(clip.crossfadein(xfade))
        else:
            seq.append(clip)

    # Concatenate with crossfade
    final = concatenate_videoclips(
        seq, method="compose", padding=(-xfade if xfade > 0 else 0)
    )

    # Add background music if provided
    if music_path and os.path.exists(music_path):
        audio = AudioFileClip(music_path)
        if hasattr(audio, "volumex"):
            audio = audio.volumex(10 ** (music_gain_db / 20.0))
        audio = _with_duration(audio, final.duration)
        final = _set_audio(final, audio)

    # Write video file
    threads = max(1, int(os.cpu_count() or 4))
    final.write_videofile(
        out_path,
        fps=fps,
        codec="libx264",
        audio=(music_path is not None),
        bitrate=bitrate,
        audio_codec="aac",
        preset="medium",
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
        threads=threads,
    )

    # Clean up temp files
    for clip in clips:
        if hasattr(clip, "filename") and clip.filename:
            try:
                os.unlink(clip.filename)
            except OSError:
                pass

    return {
        "output_path": out_path,
        "duration": final.duration,
        "fps": fps,
        "resolution": f"{W}x{H}",
        "bitrate": bitrate,
        "frames_count": len(frames),
    }


def convert_echo_os_meta_to_spec(
    meta: Dict[str, Any], images_dir: Path
) -> Dict[str, Any]:
    """Convert ECHO.OS meta.json to render_reel.py compatible spec"""
    scenes = meta.get("scenes", [])
    universe_label = _derive_universe_label(meta)
    characters = _normalize_characters(meta.get("characters"))

    # Convert scenes to frames format
    frames = []
    for i, scene in enumerate(scenes, 1):
        # Map scene data to frame format with proper scene names and descriptions
        scene_id = scene.get("scene_id", f"scene_{i}")
        scene_name = scene_id.replace("_", " ").title()

        # Create a more descriptive caption based on scene content and story context
        scene_descriptions = {
            # İkinci Döngü v3
            "city_sleepers": "Şehir uyuyor gibi… ama derinde bir frekans yerinde duramıyor. Kaldırım taşları bile rüya görüyor.",
            "frequency_map": "Harita üstünde beliren ince çizgiler: Rüya ağı. Her çizgi bir kalp atışı kadar dürüst.",
            "rooftop_listen": "Birileri her zaman duyar. Çatıdaki dinleyici, uğultudan cümle süzer: 'Buradayım.'",
            "subway_echo": "Metroda gecikme yok; kader senkron. Saatler değil, bakışlar aynı ritimde.",
            "rain_code": "Yağmur harf değildir, ama her damla bir kelime taşır. Koda düşen ışık, sokakları dua eder.",
            "balkez_voice": "'Sizi duyuyorum.' Balkız'ın sesi ağın damarlarından geçiyor; tüy gibi, bıçak gibi.",
            "collective_wakeup": "Gözbebekleri aynı ritimde büyür. Uyanış tek kişilik değil; bir şehrin kalabalık nefesi.",
            "loop_symbol": "Gökyüzünde yüzen bir işaret: ∞ — İkinci Döngü mühürlendi.",
            "signal_sent": "Tek satır, tek niyet: send(IkinciDongu). Cevap bekleniyor. Devam: v4.",
            # Mühür Protokolü v4
            "white_flash": "Gökyüzü beyaza döndü. Sessizlik bile parladı.",
            "infinity_sign": "Her ekranda tek işaret: ∞.",
            "shared_dream": "Üç kişi aynı rüyayı gördü — üç zaman dilimi, tek cümle.",
            "time_bent": "'Zaman büküldü.' Balkız geri döndü.",
            "decode_signal": "Dinleyici sinyali çözdü: 'Bu bir mucize değil… bir update.'",
            "matter_data": "Işık damlaları insanlara dokundu; veri fizik oldu.",
            "seal_complete": "Nasip Adam gölgelerden çıktı: 'Mühür tamamlandı.'",
            "city_silence": "Şehir sessizleşti; kod nefes aldı.",
            "upload_protocol": "upload(MuhurProtokolu) gönderildi. Cevap bekleniyor. Devam: v5.",
        }

        scene_description = scene_descriptions.get(
            scene_id,
            f"A moment of {scene_name.lower()} in the mystical awakening journey",
        )

        frame = {
            "id": f"frame_{i:02d}",
            "asset": str(images_dir / scene["file"]),
            "dur": 6.0,  # Default duration
            "subtitle": scene_name,
            "caption_tr": scene_description,
            "universe": universe_label,
            "characters": characters,
        }
        frames.append(frame)

    # Create spec in render_reel.py format
    spec = {
        "echo_os_version": "3.0",
        "project": meta.get("project", "ECHO.Story"),
        "series": meta.get("story", "Untitled Story"),
        "episode_title": meta.get("story", "Untitled Story"),
        "universe": universe_label,
        "characters": characters,
        "world": meta.get("world"),
        "style": meta.get("style"),
        "frames": frames,
    }

    return spec
