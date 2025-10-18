# Echo-OS Reels Renderer (JSON → MP4)

Bu mini araç, Echo-OS formatındaki JSON'dan **1080×1920 Reels** videosu üretir.
- **PIL** ile metin paneli (ImageMagick gerekmez)
- Hafif **Ken Burns** zoom-in
- Crossfade
- Opsiyonel müzik

## Kurulum
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Kullanım
```bash
python render_reel.py --json /path/to/cyberpunk_dreams_v2.json --out /path/to/out.mp4   --font "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"   --fps 30 --bitrate 10M   --music /path/to/music.mp3 --music-gain -8
```

### Notlar
- JSON `frames[].asset`, `frames[].dur`, `frames[].subtitle`, `frames[].caption_tr` alanlarını kullanır.
- Reels oranı sabit: **1080×1920**.
- Export `libx264`, `yuv420p` (IG uyumlu).
- Müzik eklerken dosya süresi videodan uzunsa otomatik kırpılır.

## Performans İpuçları (M3 8GB)
- Terminalde diğer ağır uygulamaları kapat.
- `--fps 24` dene; render süresi düşer.
- JSON’da `dur` değerlerini 5s yap; toplam süre azalır.
