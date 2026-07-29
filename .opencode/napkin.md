
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

## [2026-06-21] DB columns are camelCase (no @map in schema)
**Context:** Raw SQL query failed with "column created_at does not exist"
**Problem:** Prisma schema has no @map directives, so DB columns are camelCase exactly as written (createdAt, companyId, totalPis, etc.), not snake_case
**Fix:** Any $queryRaw must use double-quoted camelCase: "createdAt", "companyId"
**Rule:** Never assume snake_case in raw SQL for this project — check schema.prisma first, columns match TS field names exactly, case-sensitive with required double quotes

## [2026-07] CNPJ alfanumérico — decisão pendente
**Context:** A partir de julho/2026 novos CNPJs podem ter letras nos primeiros 12 caracteres
**Impact:** Frontend: máscara numérica atual rejeita letras. Backend: Zod schema aceita string mas regex de validação pode precisar de ajuste
**Decision needed:** Atualizar máscara e validação para aceitar [A-Z0-9] nos primeiros 12 dígitos, mantendo os 2 verificadores numéricos no final
**Status:** Pendente — não bloqueante para MVP

## [2026-07-10] NCM autocomplete — pendente
**Context:** Usuário não sabe os códigos NCM ao cadastrar produtos
**Solution:** Importar tabela NCM oficial da RFB (dados.gov.br, ~11.000 códigos CSV)
**Steps:**
1. Baixar CSV da tabela NCM da RFB em dados.gov.br
2. Criar tabela ncm_catalog no schema Prisma (read-only, sem companyId)
3. Script de import do CSV
4. Endpoint GET /ncm/search?q=... com busca por descrição
5. Autocomplete no formulário de produto (similar ao product search na simulação)
**Priority:** Medium — melhora UX do cadastro de produtos significativamente
**References:** Omie, Bling e Conta Azul têm esse fluxo como padrão

## [2026-07-14] Build /404 error — cache corrompido
**Context:** Next.js 15 falhando com "<Html> should not be imported outside of pages/_document"
**Problem:** Cache .next no host estava corrompido após downgrade de Next.js 16 para 15
**Fix:** rm -rf .next && rm -rf node_modules/.cache && docker compose down && docker volume rm taxsim_web_next_cache
**Rule:** Ao trocar versão do Next.js, sempre limpar .next local E o volume Docker de cache

## [2026-07-14] VS Code IntelliSense sem tipos — node_modules só no Docker
**Context:** VS Code exibindo "Cannot find module X" para @prisma/client, fastify, zod, etc.
**Problem:** node_modules existe apenas dentro do volume Docker, não no host WSL2
**Fix:** Rodar pnpm install localmente em apps/api e apps/web (não altera o Docker)
**Note:** Ignorar ERR_PNPM_IGNORED_BUILDS — install local é só para IntelliSense, não para execução
**Rule:** Após qualquer clone do projeto em nova máquina ou WSL, sempre rodar pnpm install localmente para restaurar IntelliSense

## [2026-07] Validação de NCM no cadastro de produto — pendente
**Context:** Produtos podem ser cadastrados com NCMs que não existem no NcmCatalog
**Options:**
A) Backend: validar ncmCode contra NcmCatalog em POST/PUT /products → 422 se inválido
B) Frontend: mostrar badge "NCM não encontrado" na tabela quando descrição não carrega
**Recommended:** B agora (visual, rápido), A depois (rigor fiscal para produção)
**Note:** NCM 84713012 do produto de teste não existe na tabela vigente 2026.
  Correto para notebook: 8471.30.xx | Para mouse: 8471.60.53

## [2026-07] Badge de NCM inválido — limitação atual
**Context:** Produtos com NCM fora do catálogo (NcmCatalog) não recebem badge de aviso
**Problem:** Validação de formato (8 dígitos) passa para NCMs como 84716060 que existem
  como formato mas não estão na tabela oficial vigente
**Current behavior:** Badge âmbar só aparece para NCMs malformados (< 8 dígitos ou letras)
**Full fix:** Backend: validar ncmCode contra NcmCatalog em POST/PUT /products → 422 se inválido
  Frontend: buscar descrição de cada NCM na listagem e mostrar badge se não encontrado
**Why deferred:** Requer N+1 queries na listagem ou endpoint batch de validação — over-engineering para MVP
**Note:** Usuários que usam o autocomplete nunca cadastram NCM inválido — problema só ocorre
  em cadastros manuais (testes) ou migração de dados legados

## [2026-07-29] Deploy Oracle Cloud — configurações que funcionaram

**Infraestrutura:**
- VM ARM (A1.Flex, 2 OCPUs, 12GB): API + Web + PostgreSQL — IP: 168.138.127.91
- VM AMD (E2.1.Micro, 1GB): Calculadora RFB — IP interno: 10.0.0.98
- Comunicação entre VMs via VCN interna (sem expor portas externas da calculadora)

**Problemas resolvidos:**
- bcrypt não compilava: precisou de pnpm-workspace.yaml com onlyBuiltDependencies
- Next.js standalone não escutava em 0.0.0.0: adicionar ENV HOSTNAME=0.0.0.0 no Dockerfile
- NEXT_PUBLIC_API_URL embarcado no build: passar como ARG no Dockerfile + args no compose
- CORS rejeitando porta 3000: CORS_ORIGIN deve incluir a porta (http://IP:3000)
- Portas bloqueadas: Security List Oracle + iptables na VM

**Comandos para redeployar após mudanças:**
docker compose -f docker-compose.prod.yml build app --no-cache
docker compose -f docker-compose.prod.yml up -d --force-recreate

**Seed após recriar banco:**
docker exec taxsim-api npx prisma migrate deploy
docker exec taxsim-api npx prisma db seed
docker exec taxsim-api pnpm run import:ncm
