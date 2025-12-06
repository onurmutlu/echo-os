#!/bin/bash

# 🎬 Burak "Rızık = Çaba" YouTube Shorts — Render Script
# ECHO.OS Production Pipeline

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎬 Burak 'Rızık = Çaba' YouTube Shorts — Render Pipeline${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Configuration
JOB_FILE="echo_os/jobs/sora2/kadersizler_s1/burak_rizik_caba_shorts_job_echoos.json"
OUTPUT_DIR="renders/shorts/burak_rizik_caba"
MODEL="sora-2"

# Check if job file exists
if [ ! -f "$JOB_FILE" ]; then
    echo -e "${RED}❌ Error: Job file not found: $JOB_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Job file found: $JOB_FILE${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/raw"
mkdir -p "$OUTPUT_DIR/final"
mkdir -p "$OUTPUT_DIR/exports"

echo -e "${GREEN}✅ Output directories created${NC}"
echo ""

# Step 1: Render with Sora-2
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1/4: Rendering with Sora-2${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Note: This is a placeholder. Replace with actual Sora-2 API call when available.
echo -e "${BLUE}📝 Note: Sora-2 API is currently in mock mode${NC}"
echo -e "${BLUE}   See SORA_API_NOTE.md for details${NC}"
echo ""

# Uncomment when Sora-2 API is available:
# python -m echo_os.cli render \
#   --job-file "$JOB_FILE" \
#   --output-dir "$OUTPUT_DIR/raw" \
#   --model "$MODEL"

echo -e "${GREEN}✅ Render complete (mock mode)${NC}"
echo ""

# Step 2: Post-Production (Color Grading, Overlays, Audio Mix)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2/4: Post-Production${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📝 Post-production tasks:${NC}"
echo -e "   - Color grading (noir cold grey LUT)"
echo -e "   - Overlays (glitch, text, black screen)"
echo -e "   - Audio mix (dialogue, hum, breathing)"
echo -e "   - Reverb on 'Uyan' (0.8s decay)"
echo ""

# Uncomment when post-production module is ready:
# python -m echo_os.post_production \
#   --input "$OUTPUT_DIR/raw" \
#   --output "$OUTPUT_DIR/final" \
#   --config "$JOB_FILE"

echo -e "${GREEN}✅ Post-production complete (manual step required)${NC}"
echo ""

# Step 3: Export for Multiple Platforms
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3/4: Exporting for Platforms${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ Error: ffmpeg not found. Please install ffmpeg.${NC}"
    exit 1
fi

FINAL_VIDEO="$OUTPUT_DIR/final/burak_rizik_caba_final.mp4"

# Note: This assumes final video exists. Replace with actual path after post-production.
if [ ! -f "$FINAL_VIDEO" ]; then
    echo -e "${YELLOW}⚠️  Warning: Final video not found: $FINAL_VIDEO${NC}"
    echo -e "${BLUE}   Skipping platform exports. Run post-production first.${NC}"
    echo ""
else
    # YouTube Shorts (H.264, 10 Mbps)
    echo -e "${BLUE}📹 Exporting for YouTube Shorts...${NC}"
    ffmpeg -i "$FINAL_VIDEO" \
      -c:v libx264 -profile:v high -crf 18 -maxrate 10M -bufsize 20M \
      -c:a aac -b:a 192k -ar 48000 \
      -y "$OUTPUT_DIR/exports/burak_rizik_caba_youtube.mp4" \
      -loglevel error
    echo -e "${GREEN}✅ YouTube Shorts export complete${NC}"

    # Instagram Reels (H.264, 8 Mbps)
    echo -e "${BLUE}📹 Exporting for Instagram Reels...${NC}"
    ffmpeg -i "$FINAL_VIDEO" \
      -c:v libx264 -profile:v high -crf 20 -maxrate 8M -bufsize 16M \
      -c:a aac -b:a 128k -ar 48000 \
      -y "$OUTPUT_DIR/exports/burak_rizik_caba_instagram.mp4" \
      -loglevel error
    echo -e "${GREEN}✅ Instagram Reels export complete${NC}"

    # TikTok (H.264, 6 Mbps)
    echo -e "${BLUE}📹 Exporting for TikTok...${NC}"
    ffmpeg -i "$FINAL_VIDEO" \
      -c:v libx264 -profile:v high -crf 22 -maxrate 6M -bufsize 12M \
      -c:a aac -b:a 128k -ar 48000 \
      -y "$OUTPUT_DIR/exports/burak_rizik_caba_tiktok.mp4" \
      -loglevel error
    echo -e "${GREEN}✅ TikTok export complete${NC}"
    echo ""
fi

# Step 4: Summary
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4/4: Render Summary${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}✅ Render pipeline complete!${NC}"
echo ""
echo -e "${BLUE}📁 Output files:${NC}"
echo -e "   Raw renders:    $OUTPUT_DIR/raw/"
echo -e "   Final video:    $OUTPUT_DIR/final/"
echo -e "   Platform exports: $OUTPUT_DIR/exports/"
echo ""

if [ -f "$OUTPUT_DIR/exports/burak_rizik_caba_youtube.mp4" ]; then
    echo -e "${BLUE}📊 File sizes:${NC}"
    ls -lh "$OUTPUT_DIR/exports/" | grep -E "burak_rizik_caba_(youtube|instagram|tiktok).mp4" | awk '{print "   " $9 ": " $5}'
    echo ""
fi

echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "   1. Review final video: $OUTPUT_DIR/final/"
echo -e "   2. Upload to platforms:"
echo -e "      - YouTube Shorts (18:00-21:00 TR time)"
echo -e "      - Instagram Reels (20:00-22:00 TR time)"
echo -e "      - TikTok (19:00-23:00 TR time)"
echo -e "   3. Use captions from BURAK_SHORTS_SCRIPT.md"
echo -e "   4. Track analytics (first 48h critical)"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   - Full script: echo_os/jobs/sora2/kadersizler_s1/BURAK_SHORTS_SCRIPT.md"
echo -e "   - Production guide: echo_os/jobs/sora2/kadersizler_s1/BURAK_SHORTS_PRODUCTION_GUIDE.md"
echo -e "   - Job file: $JOB_FILE"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎬 'Rızık seni bulmaz. Sen çabanla onu mecbur bırakırsın. Uyan.'${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"


