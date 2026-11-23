#!/usr/bin/env bash
# Turns recordings into the TETR.IO page's playlist: assets/video/tetrio-1.mp4, tetrio-2.mp4, ... (played in that order,
# then round again) + tetrio.webp poster from the first clip. Old tetrio-*.mp4 files are removed first.
# usage: site/scripts/encode-video.sh clip1.mkv [clip2.mkv ...]   (cut clips from GO! to just before the KO first)
# 720p60 H.264, no audio (the page plays it muted), faststart so it starts before fully downloaded.
# CRF 32 / slow: still sharp on flat-colour boards; the board shake on every attack is what costs bits (~6 MB per 40 s).
set -euo pipefail
[ $# -ge 1 ] || { echo "usage: $0 clip1 [clip2 ...]"; exit 1; }
out="$(dirname "$0")/../../assets/video"; mkdir -p "$out"; rm -f "$out"/tetrio-*.mp4 "$out/tetrio.mp4"
n=0
for c in "$@"; do
  n=$((n+1))
  ffmpeg -v error -y -i "$c" -vf "scale=1280:720:force_original_aspect_ratio=decrease:flags=lanczos,pad=1280:720:-1:-1:color=0x1f1e33,fps=60,format=yuv420p" \
    -an -c:v libx264 -preset slow -crf 32 -profile:v high -g 120 -movflags +faststart "$out/tetrio-$n.mp4"
done
ffmpeg -v error -y -ss 1 -i "$out/tetrio-1.mp4" -frames:v 1 -c:v libwebp -quality 80 "$out/tetrio.webp"
ls -lh "$out"
