#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_dir"

# Keep stateful/external services intact; refresh only source-mounted services.
docker compose up -d db tax-calculator
docker compose up -d --build --force-recreate api app
docker compose ps
