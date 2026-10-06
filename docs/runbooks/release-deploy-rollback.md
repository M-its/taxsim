# Deploy e rollback do release

## Preflight

1. No host `<DEPLOY_HOST>` (`<DEPLOY_IP>`), registrar SHA/imagens atuais, SHA alvo e migrations aplicadas. Guardar as imagens anteriores; executar `release-preflight.sql` no banco alvo. Não há evidência local do último SHA implantado nem confirmação de dados demo2 em produção.
2. Configurar `.env` fora do Git e Caddyfile com `<WEB_HOST>` e `<API_HOST>`. Revisar `docker compose -f docker-compose.prod.yml config --quiet` (sem imprimir segredos). Caddy/API/web compartilham `app_network`; DB/API compartilham `db_network` interna. Somente Caddy publica 80/443; não publicar 3000/3333.
3. Pausar escrita e realizar backup consistente: `docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > <BACKUP_PATH>`. Validar backup e procedimento de restauração em banco isolado.

## Variáveis

- Compose exige explicitamente `POSTGRES_PASSWORD`, `JWT_SECRET`, `REFRESH_TOKEN_PEPPER`, `NEXTAUTH_SECRET`. Gerar segredos fora do repositório; não rotacionar o pepper sem planejamento de invalidação das sessões.
- API: `DATABASE_URL` (montada pelo compose), `JWT_SECRET`, `REFRESH_TOKEN_PEPPER`; configurar `CORS_ORIGIN=https://<WEB_HOST>` e `TAX_CALCULATOR_STANDARD_URL=<CALCULATOR_URL>/api`. Compose também passa `TAX_CALCULATOR_SPLIT_PAYMENT_URL`.
- Web: `NEXT_PUBLIC_API_URL=https://<API_HOST>` em build e runtime; mudar exige rebuild. Compose passa também `API_INTERNAL_URL=http://api:3333`, `NEXTAUTH_URL=https://<WEB_HOST>` e `NEXTAUTH_SECRET`; o código atual usa autenticação própria, sem consumo desses três valores na aplicação.
- Defaults do compose: `POSTGRES_DB=taxsim_db`, `POSTGRES_USER=taxsim_user`, `JWT_EXPIRES_IN=15m`, `REFRESH_TOKEN_EXPIRES_IN=7d`, `DEFAULT_TAX_REGIME=SIMPLES_NACIONAL`. Os três últimos são passados mas não lidos atualmente pela API. Fixos: `API_PORT=3333`, `API_HOST=0.0.0.0`, `NODE_ENV=production` (API), `TZ=America/Sao_Paulo`, `NEXT_TELEMETRY_DISABLED=1`. Web imagem fixa `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `PORT=3000`.
- Opcionais da API fora do compose: `AUTH_RATE_LIMIT_MAX` (5), `TAX_CALCULATOR_TIMEOUT_MS` (10000).
- Novidade rastreável: `REFRESH_TOKEN_PEPPER` introduzido em `6e26518`; em `248dc25`, as quatro variáveis secretas acima passam a ser obrigatórias no compose. Sem SHA do último deploy, não é possível afirmar quais são novas naquele ambiente. Comparar `<PREVIOUS_DEPLOY_SHA>` com o release.

## Deploy

1. Com checkout em `<RELEASE_SHA>`, construir API/web: `docker compose -f docker-compose.prod.yml build api app`. Não executar seeds.
2. A imagem API inicia somente `node dist/server.js`: **não executa migrate deploy**. Após revisão/aceite do SQL, parar API/web para evitar escrita concorrente e aplicar explicitamente `docker compose -f docker-compose.prod.yml run --rm --no-deps api pnpm exec prisma migrate deploy`. DB deve estar saudável.
3. Migrations versionadas em ordem (somente as ausentes em `_prisma_migrations` serão aplicadas):
   - `20260519145502_init`
   - `20260614213115_add_tax_engine_fields`
   - `20260718064912_add_split_payment_fields`
   - `20260721230859_add_ncm_catalog`
   - `20260905142925_refresh_token_hash`: apaga refresh tokens antigos; exige novo login.
   - `20260921180000_correct_obsolete_ncm_rules`: mapeia quatro NCMs de produtos/regras, arquiva regras antigas e fictícias; preserva snapshots de vendas. Produtos `99999999` exigem correção manual. Falha se houver regra ACTIVE e ARCHIVED coexistentes no mesmo código/regime obsoleto.
4. Subir `docker compose -f docker-compose.prod.yml up -d --no-build`, verificar healthchecks e HTTPS em `https://<WEB_HOST>/api/health` e `https://<API_HOST>/health`. Validar login/refresh, Produtos, Clientes e simulação. Executar novamente o SQL de preflight.

## Rollback

- Antes de migrations: restaurar SHA/imagens anteriores e configuração compatível; subir com `up -d --no-build`.
- Depois de migrations: não basta voltar imagem; a API antiga pode exigir coluna token removida. Manter escrita suspensa, restaurar backup em banco novo/isolado, validar, apontar a configuração para ele e subir imagens anteriores. Não usar `migrate reset`, não apagar volume e não improvisar SQL reverso. Restauração perde escritas posteriores ao backup; conciliar antes de reabrir tráfego.
- Preservar logs, banco atual e SHA para investigação. Não fazer deploy ou rollback automaticamente a partir deste documento.
