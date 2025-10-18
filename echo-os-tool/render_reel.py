#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JSON -> Reels (1080x1920) renderer
- Reads Echo-OS style JSON (like cyberpunk_dreams_v2.json)
- Builds a vertical video with:
  * Smart-fit with blurred background
  * Gentle Ken Burns (zoom-in)
  * Top "subtitle" and bottom "caption_tr"
  * Crossfade transitions
  * Optional background music track
- No ImageMagick dependency (text rendered via PIL).

Usage:
  python render_reel.py --json /path/to/cyberpunk_dreams_v2.json --out out.mp4 \
    --font "/path/to/DejaVuSans.ttf" --fps 30 --bitrate 10M \
    [--music /path/to/music.mp3 --music-gain -6.0]

Install deps:
  pip install -r requirements.txt
"""

import os
import argparse
import uuid
import json
from typing import Optional
from PIL import Image, ImageFilter, ImageDraw, ImageFont
from moviepy.editor import (
    ImageClip,
    AudioFileClip,
    CompositeVideoClip,
    concatenate_videoclips,
    vfx,
)

W, H = 1080, 1920


def load_font(font_path: Optional[str], size: int):
    if font_path and os.path.exists(font_path):
        return ImageFont.truetype(font_path, size=size)
    # fallbacks
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
    ):
        if os.path.exists(p):
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()


def make_text_panel(
    text: str, max_width: int, font, padding=(24, 14), opacity=140
) -> Optional[str]:
    if not text or not text.strip():
        return None
    # wrap manually
    tmp_img = Image.new("RGBA", (max_width, 64), (0, 0, 0, 0))
    tmp_draw = ImageDraw.Draw(tmp_img)
    words = text.split()
    lines, line = [], ""
    for w in words:
        test = (line + " " + w).strip()
        bbox = tmp_draw.textbbox((0, 0), test, font=font)
        if bbox[2] > max_width - padding[0] * 2 and line:
            lines.append(line)
            line = w
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
    for ln in lines:
        draw.text((padding[0], y), ln, font=font, fill=(255, 255, 255, 255))
        y += line_h
    outp = os.path.join("/tmp", f"_txt_{uuid.uuid4().hex}.png")
    img.save(outp)
    return outp


def smart_fit_with_blur(
    img_path: str, dur: float, zoom_factor=0.05
) -> CompositeVideoClip:
    im = Image.open(img_path).convert("RGB")
    bg = im.copy().resize((W, H))
    bg = bg.filter(ImageFilter.GaussianBlur(radius=25))
    bg_path = os.path.join("/tmp", f"_bg_{uuid.uuid4().hex}.jpg")
    bg.save(bg_path, quality=85)
    bg_clip = ImageClip(bg_path, duration=dur)

    fg = ImageClip(img_path, duration=dur)
    iw, ih = fg.size
    scale = min(W / iw, (H * 0.9) / ih)
    fg = fg.resize(scale).set_position("center")
    comp = CompositeVideoClip([bg_clip, fg], size=(W, H)).set_duration(dur)
    # gentle Ken Burns zoom-in
    comp = comp.fx(vfx.resize, lambda t: 1.0 + zoom_factor * (t / max(dur, 0.01)))
    return comp


def make_clip_for_frame(
    fr: dict, fps: int, font_path: Optional[str], subtitle_size=40, caption_size=44
):
    asset = fr["asset"]
    dur = float(fr.get("dur", 6.0))
    subtitle = fr.get("subtitle", "")
    caption = fr.get("caption_tr", "")

    base = smart_fit_with_blur(asset, dur)
    layers = [base]

    # text layers
    font_sub = load_font(font_path, subtitle_size)
    font_cap = load_font(font_path, caption_size)

    sub_path = make_text_panel(
        subtitle, max_width=int(W * 0.9), font=font_sub, opacity=110
    )
    if sub_path:
        sub_clip = ImageClip(sub_path, duration=dur).set_position(("center", 80))
        layers.append(sub_clip)

    cap_path = make_text_panel(
        caption, max_width=int(W * 0.9), font=font_cap, opacity=140
    )
    if cap_path:
        # need height for positioning; open image to get size
        from PIL import Image

        cap_img = Image.open(cap_path)
        cap_h = cap_img.size[1]
        cap_clip = ImageClip(cap_path, duration=dur).set_position(
            ("center", H - cap_h - 120)
        )
        layers.append(cap_clip)

    comp = CompositeVideoClip(layers, size=(W, H)).set_duration(dur)
    return comp


def build_video(
    spec: dict,
    out_path: str,
    fps: int,
    xfade: float,
    bitrate: str,
    font_path: Optional[str],
    music_path: Optional[str],
    music_gain_db: float,
):
    frames = spec.get("frames", [])
    clips = []
    for i, fr in enumerate(frames):
        clips.append(make_clip_for_frame(fr, fps=fps, font_path=font_path))

    # crossfades
    seq = []
    for i, c in enumerate(clips):
        if i == 0:
            seq.append(c)
        else:
            seq.append(c.crossfadein(xfade))
    final = concatenate_videoclips(seq, method="compose", padding=-xfade)

    # audio (optional)
    if music_path and os.path.exists(music_path):
        audio = AudioFileClip(music_path).volumex(10 ** (music_gain_db / 20.0))
        final = final.set_audio(audio.set_duration(final.duration))

    final.write_videofile(
        out_path,
        fps=fps,
        codec="libx264",
        audio=(music_path is not None),
        bitrate=bitrate,
        threads=4,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", required=True, help="Echo-OS style JSON path")
    ap.add_argument("--out", required=True, help="Output mp4")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--xfade", type=float, default=0.5)
    ap.add_argument("--bitrate", default="10M")
    ap.add_argument("--font", default=None, help="TTF font path")
    ap.add_argument("--music", default=None, help="Optional music file (mp3/wav)")
    ap.add_argument("--music-gain", type=float, default=-8.0, help="dB")
    args = ap.parse_args()

    with open(args.json, "r", encoding="utf-8") as f:
        spec = json.load(f)

    build_video(
        spec=spec,
        out_path=args.out,
        fps=args.fps,
        xfade=args.xfade,
        bitrate=args.bitrate,
        font_path=args.font,
        music_path=args.music,
        music_gain_db=args.music_gain,
    )


if __name__ == "__main__":
    main()
