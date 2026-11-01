#!/usr/bin/env bash
# Builds the guest, its 9p files and its snapshot (the Dockerfile's `v86` stage) into public/v86/ for `npm run dev`.
# The old files are only replaced once the build succeeds.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf public/v86.new
docker build --target v86 --output type=local,dest=public/v86.new .
rm -rf public/v86
mv public/v86.new public/v86
