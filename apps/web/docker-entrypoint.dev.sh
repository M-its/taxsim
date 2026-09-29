#!/bin/sh
set -eu

if [ ! -f /app/src/app/layout.tsx ] || [ ! -f /app/next.config.ts ]; then
  echo >&2 "ERROR: os bind mounts do frontend estao vazios ou indisponiveis."
  echo >&2 "Execute ./scripts/dev-up.sh para recriar os containers sem apagar o banco."
  exit 66
fi

# Mantem o volume nomeado /app/node_modules alinhado ao lockfile atual.
pnpm install --frozen-lockfile

# `next build` grava BUILD_ID e um layout de chunks diferente do `next dev`.
# Como ambos usam o volume nomeado /app/.next, remova somente artefatos de
# producao antes de iniciar o servidor de desenvolvimento.
if [ -f /app/.next/BUILD_ID ]; then
  echo "Limpando artefatos de producao do cache .next antes do next dev..."
  find /app/.next -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
fi

exec pnpm exec next dev
