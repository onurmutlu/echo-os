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
        # vfx,  # Available for future use
    )
except ImportError:
    from moviepy import (
        ImageClip,
        AudioFileClip,
        CompositeVideoClip,
        concatenate_videoclips,
    )

# Reels dimensions
W, H = 1080, 1920


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


def smart_fit_with_blur(
    img_path: str, dur: float, zoom_factor: float = 0.05
) -> CompositeVideoClip:
    """Create smart-fit image with blurred background and Ken Burns effect"""
    im = Image.open(img_path).convert("RGB")

    # Create blurred background
    bg = im.copy().resize((W, H))
    bg = bg.filter(ImageFilter.GaussianBlur(radius=25))
    bg_path = os.path.join("/tmp", f"_bg_{uuid.uuid4().hex}.jpg")
    bg.save(bg_path, quality=85)
    bg_clip = ImageClip(bg_path, duration=dur)

    # Create foreground with smart scaling
    fg = ImageClip(img_path, duration=dur)
    iw, ih = fg.size
    scale = min(W / iw, (H * 0.9) / ih)
    fg = fg.resized(scale).with_position("center")

    comp = CompositeVideoClip([bg_clip, fg], size=(W, H)).with_duration(dur)

    # Gentle Ken Burns zoom-in - simplified for now
    # comp = comp.with_effects([vfx.resize(lambda t: 1.0 + zoom_factor * (t / max(dur, 0.01)))])

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
    base = smart_fit_with_blur(asset, dur)
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
            sub_clip = ImageClip(sub_path, duration=dur).with_position(("center", 80))
            layers.append(sub_clip)

    # Create caption text panel
    if caption:
        cap_path = make_text_panel(
            caption, max_width=int(W * 0.9), font=font_cap, opacity=140
        )
        if cap_path:
            cap_img = Image.open(cap_path)
            cap_h = cap_img.size[1]
            cap_clip = ImageClip(cap_path, duration=dur).with_position(
                ("center", H - cap_h - 120)
            )
            layers.append(cap_clip)

    comp = CompositeVideoClip(layers, size=(W, H)).with_duration(dur)
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
) -> Dict[str, Any]:
    """Build video from Echo-OS JSON spec"""
    frames = spec.get("frames", [])
    if not frames:
        raise ValueError("No frames found in spec")

    # Create clips for each frame
    clips = []
    for i, frame in enumerate(frames):
        clip = make_clip_for_frame(frame, fps=fps, font_path=font_path)
        clips.append(clip)

    # Apply crossfade transitions - simplified for now
    seq = []
    for i, clip in enumerate(clips):
        seq.append(clip)

    # Concatenate with crossfade
    final = concatenate_videoclips(seq, method="compose", padding=-xfade)

    # Add background music if provided
    if music_path and os.path.exists(music_path):
        audio = AudioFileClip(music_path).volumex(10 ** (music_gain_db / 20.0))
        final = final.set_audio(audio.set_duration(final.duration))

    # Write video file
    final.write_videofile(
        out_path,
        fps=fps,
        codec="libx264",
        audio=(music_path is not None),
        bitrate=bitrate,
        threads=4,
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
        }
        frames.append(frame)

    # Create spec in render_reel.py format
    spec = {
        "echo_os_version": "3.0",
        "project": meta.get("project", "ECHO.Story"),
        "series": meta.get("story", "Untitled Story"),
        "episode_title": meta.get("story", "Untitled Story"),
        "frames": frames,
    }

    return spec
