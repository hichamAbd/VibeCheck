#!/bin/sh
# Serves a copy of the app at http://localhost:8765/VibeCheck/ (like GitHub Pages).
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SITE=/tmp/site
rm -rf "$SITE/VibeCheck" && mkdir -p "$SITE/VibeCheck"
cd "$REPO" && tar --exclude=.git --exclude=data --exclude=dev -cf - . | (cd "$SITE/VibeCheck" && tar xf -)
mkdir -p "$SITE/VibeCheck/data"
cd "$SITE" && exec python3 -m http.server 8765 --bind 127.0.0.1
