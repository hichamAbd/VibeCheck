#!/bin/sh
# Re-copies the app code into the test site and clears its published data.
REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO" && tar --exclude=.git --exclude=data --exclude=dev -cf - . | (cd /tmp/site/VibeCheck && tar xf -)
rm -rf /tmp/site/VibeCheck/data && mkdir -p /tmp/site/VibeCheck/data
