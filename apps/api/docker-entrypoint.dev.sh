#!/bin/sh
set -eu

if [ ! -f /app/src/server.ts ] || [ ! -f /app/prisma/schema.prisma ]; then
  echo >&2 "ERROR: os bind mounts da API estao vazios ou indisponiveis."
  echo >&2 "Execute ./scripts/dev-up.sh para recriar os containers sem apagar o banco."
  exit 66
fi

# O volume nomeado /app/node_modules sobrepoe as dependencias da imagem.
# Reconciliar no startup evita que ele retenha pacotes antigos apos um rebuild.
pnpm install --frozen-lockfile
pnpm exec prisma generate

exec pnpm exec tsx watch src/server.ts
