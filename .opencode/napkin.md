
## [2026-06-05] Volume api_node_modules persiste dependências antigas
**Context:** Atualizando @fastify/jwt de 9.x para 10.x
**Problem:** `docker compose build --no-cache` não atualiza o volume anônimo `api_node_modules` — ele monta por cima da imagem com a versão antiga
**Fix:** `docker compose down && docker volume rm taxsim_api_node_modules && docker compose up`
**Rule:** Sempre que atualizar uma dependência npm, remover o volume `taxsim_api_node_modules` antes de rebuildar

## [2026-06-12] Prisma Decimal retorna sem casas decimais
**Context:** unitPrice retornando "2500" em vez de "2500.00"
**Problem:** Prisma Decimal.toString() trunca zeros à direita
**Fix:** Criar shared/formatters/decimal.ts com formatDecimal() usando .toDecimalPlaces(2).toString()
**Rule:** Nunca usar Number() ou toFixed() em campos Decimal — sempre usar o método do objeto Decimal do Prisma

## [2026-06-13] formatDecimal — toFixed(2) é o correto
**Context:** Serializar campos Decimal do Prisma para string com 2 casas decimais
**Problem:** .toDecimalPlaces(2).toString() remove zeros à direita
**Fix:** value.toFixed(2) — método nativo do objeto Decimal do Prisma
**Rule:** Usar toFixed(2) apenas para serialização de resposta HTTP, nunca em cálculos

## [2026-06-17] pnpm version must be pinned in Dockerfile
**Context:** Migrating API from npm to pnpm
**Problem:** `corepack prepare pnpm@latest` installs a different version than the host, causing lockfile verification failures and ERR_PNPM_IGNORED_BUILDS
**Fix:** Pin exact version: `corepack prepare pnpm@10.17.1 --activate` + `"packageManager": "pnpm@10.17.1"` in package.json
**Rule:** Never use @latest for package managers in Dockerfiles — always pin exact version

## [2026-06-19] Docker volumes must include tsconfig.json for path aliases
**Context:** Module not found for @/lib/utils after pnpm migration
**Problem:** docker-compose.yml only mounted src/ and public/ as volumes — tsconfig.json was baked into the image at build time, but when rebuilding only the deps layer, path alias resolution broke
**Fix:** Add explicit volume mounts for tsconfig.json and next.config.ts
**Rule:** Any config file Next.js reads at runtime (tsconfig.json, next.config.ts) must be in docker-compose volumes, not just copied at build time

## [2026-06-19] postcss.config.mjs must be mounted as Docker volume
**Context:** CSS loading with 200 but Tailwind classes not applying — page rendered unstyled
**Problem:** docker-compose.yml volumes only included src/, public/, tsconfig.json, next.config.ts — postcss.config.mjs was missing, so Tailwind v4 never processed @import "tailwindcss" in globals.css
**Fix:** Add ./apps/web/postcss.config.mjs:/app/postcss.config.mjs:cached to app service volumes
**Rule:** Every config file at the project root that a build tool reads (postcss, tailwind, next.config, tsconfig) must be explicitly mounted — Docker volumes don't auto-include root-level configs, only what's listed

## [2026-06-20] eslint.config.mjs also needs Docker volume mount
**Context:** Same root-cause class as tsconfig.json/postcss.config.mjs
**Fix:** Mount ./apps/web/eslint.config.mjs:/app/eslint.config.mjs:cached in docker-compose.yml
**Rule:** Any root-level config file referenced by a build/lint/format tool must be explicitly volume-mounted, not just present in the image build context
