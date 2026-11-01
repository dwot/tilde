#!/usr/bin/env bash
# Builds sources/tilde-sources.tar from public/v86/third-party.txt: the source to publish alongside that build.
# Package versions float between builds, so make this from the same build you ship.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf sources
mkdir sources
docker run --rm -v "$PWD/public/v86/third-party.txt:/third-party.txt:ro" -v "$PWD/image/sources.py:/sources.py:ro" -v "$PWD/sources:/out" \
  alpine:3.21 sh -c "apk add -q bash curl git python3 tar && python3 /sources.py /third-party.txt /out; status=\$?; chown -R $(id -u):$(id -g) /out; exit \$status"
rm -rf sources/tilde-sources
sha256sum sources/tilde-sources.tar | tee sources/tilde-sources.tar.sha256
