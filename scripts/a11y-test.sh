#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
compose_file="$repo_dir/docker-compose.a11y.yml"

cleanup() {
  if [ "${A11Y_KEEP_STACK:-0}" = "1" ]; then
    return
  fi
  docker compose -f "$compose_file" down --volumes --remove-orphans
}

trap cleanup EXIT INT TERM

docker compose -f "$compose_file" up \
  --build \
  --abort-on-container-exit \
  --exit-code-from a11y \
  a11y
