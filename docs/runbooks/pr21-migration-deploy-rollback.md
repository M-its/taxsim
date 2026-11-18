# PR #21 — preflight, migration e deploy de API/Web

Preparado em **17/11/2026**, revisado em **18/11/2026**, sem acesso ao ambiente produtivo. Este documento
e os comandos abaixo são um plano para revisão, **não autorização de execução**.
Nenhum preflight no banco, backup, ensaio, migration ou deploy foi executado
durante sua preparação. Resultados operacionais, configuração, referências de
imagens, destinos de backup e qualquer dado pessoal ficam em registro privado.

Alvo: `ef09eb5a35ae134946471b42cd9bdc3a64c55e2f`, merge do
[PR #21](https://github.com/M-its/taxsim/pull/21). O
[CI pós-merge](https://github.com/M-its/taxsim/actions/runs/44017215056) passou
em API, Web e acessibilidade: 106 E2E aprovados e dois skips de viewport previstos.
Isso comprova a execução descartável da CI, não o estado do banco produtivo.

## Escopo e ponto de parada

- Construir e substituir **API e Web**; aplicar somente a migration
  `20261116120000_unique_user_email` depois de autorização específica.
- PostgreSQL, Caddy, calculadora, redes, domínios, segredos e parâmetros fiscais
  mantêm imagens/configuração. Não executar seed, importação, `db push`, reset,
  `migrate dev`, limpeza de volumes ou atualização da stack inteira.
- A migration usa transação, bloqueia escritas em `users`, verifica colisões de
  `lower(email)`, normaliza caixa, cria índice único global e CHECK de minúsculas,
  e remove o índice composto anterior. Não elimina nem une contas. O bloqueio e
  o índice não são concorrentes: prever janela de indisponibilidade, não zero downtime.
- Não aplicar o roteiro histórico [somente Web](./release-deploy-rollback.md)
  a esta mudança. Não executar operações neste checkout com os diffs locais
  anteriores; usar futuramente um checkout operacional limpo e identificado.

**Ainda pendente:** comprovar revisões/imagens efetivamente implantadas, estado
das migrations, duplicidades, backup/restauração e compatibilidade de retorno.
Sem esses resultados e autorização da janela, permanecer no preflight.

## 1. Identidade e preparação sem troca de serviços

1. Identificar separadamente API e Web em execução: ID/digest, arquitetura,
   revisão de origem e configuração efetiva. Não presumir que o Git no servidor
   represente as imagens. O deploy anterior documentado não substitui esta conferência.
2. Comparar cada revisão comprovada com o alvo: backend/dependências, schema e
   histórico SQL, Dockerfiles, Compose, Caddy e configuração. Qualquer diferença
   não explicada pelo release impede avançar. Conferir Node 22/arquitetura da
   aplicação; a calculadora permanece na infraestrutura existente.
3. Preservar **antes do build** as duas imagens antigas por referências imutáveis
   locais. Preparar override privado contendo somente `services.api.image` e
   `services.app.image` para retorno. Conferir as referências por ID/digest e
   manter as imagens fora de rotinas de limpeza. Não depender do tag padrão que
   será sobrescrito pelo build.
4. Preparar um override privado separado para as imagens alvo, com tags únicas,
   sem alterar portas, redes, volumes ou environment. Exemplo de estrutura:

   ```yaml
   services:
     api:
       image: ${RELEASE_API_IMAGE:?Defina a imagem alvo da API}
     app:
       image: ${RELEASE_WEB_IMAGE:?Defina a imagem alvo do Web}
   ```

5. Preparar variáveis em sessão privada, sem registrar valores no Git. Os blocos
   Bash deste documento usam a função abaixo e o Compose **de produção**, não
   os arquivos de desenvolvimento ou acessibilidade:

   ```bash
   set -eu
   : "${release_env_file:?Arquivo privado de ambiente existente}"
   : "${release_target_override:?Override privado com imagens alvo}"
   : "${release_rollback_override:?Override privado com imagens anteriores}"
   : "${RELEASE_API_IMAGE:?Tag unica da API alvo}"
   : "${RELEASE_WEB_IMAGE:?Tag unica do Web alvo}"
   : "${release_health_timeout:?Timeout em segundos aprovado no ensaio}"
   export RELEASE_API_IMAGE RELEASE_WEB_IMAGE
   dc() {
     docker compose --env-file "$release_env_file" \
       -f docker-compose.prod.yml -f "$release_target_override" "$@"
   }
   dc config --quiet
   docker compose --env-file "$release_env_file" -f docker-compose.prod.yml \
     -f "$release_rollback_override" config --quiet
   ```

6. Conferir presença, sem imprimir conteúdo, de JWT/pepper, senha do banco,
   NEXTAUTH_SECRET e configuração privada da calculadora/CORS. Não rotacionar
   segredos. `NEXT_PUBLIC_API_URL` produtiva entra no build Web; não usar a origem
   sintética dos testes. Registrar baseline de IDs/imagens/início de banco,
   Caddy e calculadora, bem como API/Web antigos.

## 2. Preflight somente leitura e decisão sobre e-mails

Arquivo específico: [pr21-preflight.sql](./pr21-preflight.sql). O roteiro
histórico [release-preflight.sql](./release-preflight.sql) pode complementar
o diagnóstico fiscal, mas não substitui este arquivo. Toda saída permanece privada.

Com o alvo e o banco confirmados, a futura execução somente leitura será:

```bash
dc exec -T db sh -c \
  'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < docs/runbooks/pr21-preflight.sql
```

O SQL usa snapshot consistente, transação READ ONLY, timeout por statement e
retorna somente contagens, estrutura de índices/CHECK e histórico/checksums de
migrations. Não lista e-mails, IDs de pessoas, senhas, tokens ou logs. Código de
saída zero significa apenas que as consultas rodaram; **não é aprovação automática**.

Gates antes da migration:

- PostgreSQL/namespace correspondem ao alvo esperado (Compose atual: PostgreSQL
  16, schema `public`); tabelas e permissões existem. Erro/timeout/resultado
  inesperado interrompe a janela, sem ampliar permissões automaticamente.
- `missing_emails = 0`, `duplicate_email_groups = 0`, `affected_users = 0` e
  `cross_company_duplicate_groups = 0`. Contar duplicados após `lower(email)`
  inclui contas da mesma empresa e de empresas diferentes.
- `emails_to_normalize` pode ser maior que zero antes, mas deve ser zero depois.
  A caixa original não será recuperada apenas retornando imagens; se sua retenção
  for necessária, o backup privado é a referência, não um arquivo público de e-mails.
- `unresolved_migrations = 0`. Comparar todas as migrations concluídas e seus
  checksums com os arquivos da imagem alvo. A **única pendência permitida** é
  `20261116120000_unique_user_email`; `migrate deploy` aplicaria todas as pendentes.
- Antes: alvo sem aplicação concluída, índice `users_companyId_email_key` único,
  válido e pronto, com chaves `(companyId, email)`; novo índice/CHECK ausentes.
  Se o alvo já constar concluído e a estrutura nova estiver correta, não reaplicar:
  registrar esse estado e revisar o plano. Histórico e estrutura divergentes bloqueiam.
- Investigar transações prolongadas/locks em `users` e escritores externos. A
  consulta de locks é indicativa; não prova ausência de acesso fora da API.

**Se houver duplicados:** parar antes de aplicar ou publicar a API nova. Ela
rejeita login ambíguo e não oferece seleção de tenant. O responsável deve
identificar privadamente os titulares e decidir identidades/e-mails verificados;
nunca escolher o primeiro registro, comparar senhas para escolher empresa,
adicionar sufixos fictícios, apagar/mesclar contas ou mover `companyId` por script
automático. Qualquer correção de dados exige plano/autorização próprios e novo
preflight. Não gravar nem publicar a lista de afetados neste checkout.

## 3. Construção, backup e ensaio antes da janela

Após autorização própria para preparação operacional, construir as duas imagens
alvo, preservando os containers que atendem:

```bash
dc build api app
dc run --rm --no-deps --pull never api pnpm exec prisma migrate status
```

`migrate status` é diagnóstico; pode sair com código não zero por existir uma
pendência. Ler a causa, não usar `|| true` para avançar. A imagem da API contém
Prisma/schema/migrations; o comando one-off não inicia o servidor. `--no-deps`
impede iniciar dependências, e não se publica porta. Não usar `--build` no passo
de migration: construir, identificar e conferir os artefatos antes.

Preparar backup completo em formato custom, validar checksum/leitura e **ensaiar
restauração real em PostgreSQL isolado**, sem portas públicas, sem acesso à
calculadora real e sem configuração/credenciais produtivas da aplicação. A lista
do dump não substitui a restauração. O ensaio futuro precisa de autorização;
nesta preparação nenhum banco foi criado e nenhum SQL foi aplicado.

Na cópia restaurada, após autorização, validar a migration alvo, os gates pós-SQL
e os smokes descritos abaixo. Ensaiar também as imagens anteriores contra o schema
novo, incluindo login, refresh, cadastro e consultas. O código revisado sugere
compatibilidade (campos de usuário não foram removidos), mas as imagens antigas
reais precisam comprová-la. Sem isso, não assumir rollback por imagem como seguro.

## 4. Janela futura: pausar escritores, backup final, migrar

Executar apenas com autorização explícita de migration/deploy e aprovação do
preflight/ensaio. Definir responsável e limite de duração para a janela e para a
migration com base no ensaio e no tamanho real de `users`; se excedido, cancelar
e diagnosticar locks/estado antes de qualquer retry. A migration versionada não
define seus próprios timeouts de lock/statement; os do preflight não se propagam.

1. Pausar **apenas API e Web** e confirmar ausência de outros escritores. Caddy
   continua ativo e pode responder 502/indisponibilidade até o retorno; comunicar
   a janela. Não parar/recriar PostgreSQL, proxy ou calculadora.

   ```bash
   dc stop api app
   ```

2. Repetir o preflight depois da pausa: a leitura anterior não elimina corrida
   com um cadastro ocorrido antes da parada. Se qualquer gate falhar, não migrar;
   retornar as imagens anteriores e tratar a causa em janela separada.
3. Gerar **backup final após cessarem as escritas**; guardar novo arquivo privado,
   sem sobrescrever outro backup, checksum e evidência de leitura/restauração
   isolada. Confirmar espaço e tempo de restauração compatíveis com a janela.

   ```bash
   : "${release_backup:?Destino privado novo para o backup final}"
   test ! -e "$release_backup"
   dc exec -T db sh -c \
     'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$release_backup"
   test -s "$release_backup"
   sha256sum "$release_backup"
   dc exec -T db pg_restore --list < "$release_backup" >/dev/null
   ```

   Parar em qualquer erro; não tratar arquivo parcial como backup válido. Registrar
   separadamente o ensaio anterior e a validação do backup final. A restauração
   real desse backup deve ocorrer no alvo isolado conferido, nunca no banco vivo.
   A migration continua bloqueada até essa restauração real do backup final e
   a conferência de schema/histórico/contagens no alvo isolado.
4. Conferir novamente digest da API alvo, checksum do SQL e única pendência.
   Só então a futura aplicação será feita pela imagem alvo, não pela API antiga:

   ```bash
   dc run --rm --no-deps --pull never api pnpm exec prisma migrate deploy
   ```

5. Manter API/Web parados até conferir saída e repetir o preflight. Esperado:
   mesmo `users_total`; zero e-mails ausentes/duplicados/a normalizar; índice
   `users_email_key` único/válido/pronto em `(email)`; CHECK de minúsculas válido;
   índice composto anterior ausente; uma aplicação concluída do alvo; zero
   migrations não resolvidas. Não comparar contagens de usuários após reabrir
   tráfego como se novos cadastros fossem corrupção.
6. `prisma migrate status` deve confirmar ausência de pendências. Saída do cliente
   interrompida/timeout não basta para saber se COMMIT ocorreu: verificar estrutura
   e histórico antes de decidir por resolver, reaplicar ou voltar.

## 5. Troca exclusiva de API/Web e aceite

Depois dos gates pós-migration e da autorização da troca:

```bash
dc up --wait --wait-timeout "$release_health_timeout" --no-deps --no-build --pull never api
dc ps api
dc up --wait --wait-timeout "$release_health_timeout" --no-deps --no-build --pull never app
dc ps api app
```

`--wait` aguarda running/healthy e implica modo detached; confirmar previamente
que a versão instalada do Compose aceita `--wait` e `--wait-timeout`. O timeout
de saúde deve ser aprovado no ensaio, considerando os start periods existentes.
Se o primeiro `up` falhar ou expirar, parar antes do Web e diagnosticar; o timeout
não desfaz containers já iniciados. **Entre os dois `up`, conferir a imagem da API**.
Conferir Web healthy, imagens alvo,
baseline inalterado de banco/Caddy/calculadora e logs privados sem expor segredos.
Não usar `up` sem serviços explícitos, `down`, restart geral ou troca de `.env`.

Ao iniciar API, o proxy volta a encaminhar tráfego: considerar possíveis novas
escritas desde esse momento, não somente depois do aceite. O retorno padrão
conserva o banco migrado. Se for obrigatório validar antes de reabrir tráfego,
aprovar um controle de manutenção específico antes da janela; não improvisar
alteração de proxy neste procedimento.

Smoke dirigido pelo responsável, sem fornecer senha/token/cookie ao agente:

- Landing, login, HTTPS, health, robots/sitemap/OG e rotas privadas protegidas.
- Conta existente: login com caixa diferente no e-mail, empresa correta,
  recarga/refresh e logout. Preservar pepper/JWT; esta migration não exige reset
  de sessões nem rehash de senhas.
- Cadastro de demonstração autorizado com e-mail novo; tentativa em outra
  empresa com mesmo e-mail/caixa diferente recebe conflito genérico e não cria
  empresa órfã. Dados reais não viram fixtures; respeitar rate limit de produção.
- Produto/cliente, simulação elegível, bloqueio NCM inelegível e dashboard.
- Venda exclusivamente de demonstração: confirmar/cancelar e verificar estados;
  disputa controlada somente com autorização para essas mutações. O CI já cobre
  as duas ordens da disputa e isolamento; smoke não é novo teste de carga.

Registrar IDs das entidades de demonstração privadamente. Não limpar dados por
SQL ad hoc. Falha transitória da calculadora não é motivo para restaurar banco.

## 6. Rollback e reconciliação de migration

### Build ou preflight falhou, sem migration aplicada

Não trocar containers. Se já houve pausa, retornar API/Web pelas imagens antigas
conferidas. Banco permanece no baseline. Guardar erro/logs privados; sem retry cego.

### Migration falhou ou seu resultado ficou incerto

Manter API/Web parados. O SQL contém `BEGIN/COMMIT`; se a transação foi abortada,
as alterações em usuários/índices/CHECK não devem persistir, mas confirmar isso
no catálogo e nas contagens. Prisma pode deixar registro de falha mesmo assim.

- Estrutura antiga e falha pendente comprovadas: retornar imagens antigas;
  `migrate resolve --rolled-back 20261116120000_unique_user_email` é uma eventual
  operação **separadamente autorizada**, após verificar rollback real e corrigir
  a causa. Ela só reconcilia histórico; não desfaz DDL/dados. Não marcar a falha
  como aplicada para liberar a publicação.
- Estrutura nova e aplicação concluída: tratar como migration bem-sucedida e
  seguir o caminho de retorno por imagens com schema preservado.
- Histórico/estrutura divergentes: não editar `_prisma_migrations`, não remover
  o índice e não tentar `resolve` por suposição; manter a pausa e preparar reparo
  dirigido. Não alterar o arquivo SQL já integrado/aplicado para mascarar checksum.

### Migration concluiu, mas API/Web ou smoke falhou

Preferir retornar **as duas imagens anteriores**, mantendo índice global,
CHECK, minúsculas e histórico concluído. Isso preserva novas escritas e a
restrição de identidade. A compatibilidade deve ter sido comprovada no ensaio.

```bash
docker compose --env-file "$release_env_file" -f docker-compose.prod.yml \
  -f "$release_rollback_override" up --wait --wait-timeout "$release_health_timeout" \
  --no-deps --no-build --pull never api
docker compose --env-file "$release_env_file" -f docker-compose.prod.yml \
  -f "$release_rollback_override" up --wait --wait-timeout "$release_health_timeout" \
  --no-deps --no-build --pull never app
```

Parar se o retorno da API falhar ou expirar; conferir sua imagem antes do Web.
O retorno também aguarda healthchecks; conferir as imagens antigas e o smoke
de retorno. Não reaplicar migrations pela imagem antiga. Esse retorno recoloca
versões anteriores de dependências e a implementação antiga das transições de
venda: é mitigação temporária, com registro do risco e posterior correção dirigida.
Não desfaz a normalização de caixa e não restaura o índice composto.

Se o retorno conservando schema não for compatível, permanecer em manutenção e
decidir reparo dirigido ou restauração, com nova autorização. Não fornecer um
"down" automático que reabra e-mails duplicados ou apague o registro de migration.

### Restauração do banco: último recurso, autorização própria

Somente se comprovadamente não houver escritas legítimas posteriores ao backup
final, ou se houver plano aprovado de reconciliação dessas escritas. Pausar todos
os escritores; preservar também o estado com falha antes de restaurar. Restaurar
o backup completo **primeiro em banco/volume isolado e novo**, conferir schema,
histórico, contagens e aplicação antiga; planejar a troca do banco separadamente.
Não executar `pg_restore --clean` no banco vivo, excluir volumes ou restaurar só
`users`/`_prisma_migrations`. O backup pré-migration não contém a normalização nem
o registro concluído; o histórico deve permanecer coerente com o banco restaurado.

Após reabrir tráfego, não restaurar snapshot antigo por falha de interface: ele
descartaria cadastros, sessões, vendas e outras escritas posteriores. Preservar
dados e preferir retorno de imagens ou reparo progressivo. Backup ter checksum
e lista legível não garante restauração nem perda de dados aceitável.

## Registro mínimo para aceite da execução futura

Guardar privadamente: revisões e imagens antes/alvo/retorno, CI exato, configuração
validada sem valores públicos, contagens antes/depois, checksums do SQL e backup,
restauração ensaiada, duração/locks, resultado da migration, smokes e decisão do
responsável. Distinguir claramente "plano preparado", "preflight executado",
"migration aplicada" e "API/Web publicados". Este documento registra apenas o
primeiro estado; não autoriza commit/push, nova release ou execução operacional.

Validação desta preparação: preflight analisado por parser SQL, com 12 statements
e sem nós de escrita/DDL; oito blocos Bash passaram em `bash -n`. Isso é somente
verificação estática: não comprova permissões, volume de dados, locks, duplicidades,
backup restaurável ou compatibilidade das imagens produtivas.

Referências: [Prisma 6 — deploy/status/resolve](https://www.prisma.io/docs/orm/v6/reference/prisma-cli-reference),
[Prisma 6 — recuperação de migration](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/patching-and-hotfixing),
[Compose run](https://docs.docker.com/reference/cli/docker/compose/run/),
[Compose up](https://docs.docker.com/reference/cli/docker/compose/up/),
[pg_dump 16](https://www.postgresql.org/docs/16/app-pgdump.html) e
[pg_restore 16](https://www.postgresql.org/docs/16/app-pgrestore.html).
