# Deploy e rollback — somente Web

Procedimento manual, não autorização para executar comandos. Preencher os
placeholders com configuração privada; não publicar hosts, endereços, caminhos
operacionais, identificadores de backup ou saídas com segredos.

Revisado em 23/10/2026. Escopo desta release: construir e substituir apenas o
serviço Web, chamado `app` no Compose. API, banco, Caddy, calculadora e seus dados
continuam em execução, com as mesmas imagens e configuração. O ajuste do runner
em `docker-compose.a11y.yml` não é configuração de produção.

O diff local não altera API executável, schema/migrations, Dockerfiles ou
infraestrutura produtiva, mas **isso não confirma a revisão que está no servidor**.
Se a comparação com a revisão efetivamente implantada mostrar essas diferenças,
parar: este roteiro não autoriza deploy de API, migration ou mudança de proxy.

## Antes do deploy

1. Aprovar PR/CI da revisão final e uma janela com o responsável disponível para
   rollback. Confirmar a origem SSH atual na OCI, acesso de resgate e estado
   saudável da stack. Não misturar atualização/reboot do host com esta release.
2. Registrar privadamente revisão efetiva, imagem atual do Web e revisão alvo.
   Não usar a main local como prova de produção. Se o checkout não representar
   as imagens em execução, resolver a identidade antes de seguir. Comparar
   backend executável/dependências, schema/migrations, Dockerfiles, Compose de
   produção e Caddy/infra entre retorno e alvo; qualquer diferença interrompe
   este procedimento. Scripts auxiliares da fixture e Compose de E2E não são
   alteração de backend produtivo.
3. Validar configuração com `docker compose -f docker-compose.prod.yml config --quiet`,
   sem imprimir valores. Caddy é o único serviço publicado em 80/443; não
   publicar Web/API/banco. Confirmar a configuração externa separadamente.
4. Executar o SQL somente leitura [release-preflight.sql](./release-preflight.sql)
   pelo container do banco, cuja rede é interna. Ler toda a saída: regras e
   produtos obsoletos, dados demo e histórico de migrations. O retorno anterior
   do responsável confirmou esses pontos em 11/10/2026; repetir antes de novo
   deploy se o estado puder ter mudado.
5. Conferir presença do pepper sem exibir o valor. Gerar segredos apenas fora
   do Git e guardá-los em gerenciador seguro. Não rotacionar o pepper existente
   inadvertidamente: invalida a capacidade de usar sessões anteriores.
6. Obter backup consistente, validar tamanho plausível, leitura do arquivo e
   restauração em banco temporário isolado, sem rede/portas. Não parar a API para
   este backup: `pg_dump` fornece snapshot consistente com escrita concorrente.
   O backup não inclui escritas posteriores; rollback apenas do Web não restaura
   banco. Guardar local, checksum e revisão em registro privado, sem sobrescrever
   backups existentes. Cópia privada de documentos não é backup do banco.
7. Registrar IDs, imagens e horários de início de API/banco/Caddy antes da troca
   para confirmar que não foram recriados ou reiniciados ao final.

Exemplo de backup (substituir o destino; contém dados privados):

```bash
: "${release_backup:?Defina um arquivo novo de backup em local privado}"
test ! -e "$release_backup"
docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$release_backup"
test -s "$release_backup"
sha256sum "$release_backup"
```

## Configuração

- Compose exige `POSTGRES_PASSWORD`, `JWT_SECRET`, `REFRESH_TOKEN_PEPPER` e
  `NEXTAUTH_SECRET`. O último ainda é exigido pelo compose, embora a aplicação
  use autenticação própria, não NextAuth.
- API recebe `DATABASE_URL`, origens permitidas de CORS e URLs da calculadora.
  `CORS_ORIGIN=https://<WEB_HOST>` deve ser explícito, com credenciais. Não
  usar wildcard em produção. Calculadora deve ser alcançável somente pela rede
  privada; ausência de publicação local não prova o firewall externo.
- `NEXT_PUBLIC_API_URL=https://<API_HOST>` é embutida no build; mudar a variável
  somente em runtime não altera o bundle. `API_INTERNAL_URL` e `NEXTAUTH_URL`
  são passadas pelo compose, mas não usadas pelo fluxo atual de dados do Web.
- JWT de 15 minutos e refresh de sete dias são definidos no código; as variáveis
  `JWT_EXPIRES_IN` e `REFRESH_TOKEN_EXPIRES_IN` do compose não alteram esses prazos.
  `DEFAULT_TAX_REGIME` também não é lida hoje pela API.
- `AUTH_RATE_LIMIT_MAX` não está no compose de produção: mantém o padrão de
  cinco tentativas por minuto em login/cadastro. Não relaxar para aprovar smoke.
- Cookie: `SameSite=None; Secure; HttpOnly; Path=/auth` em produção. A separação
  de sites Web/API exige o atributo None; Path inclui refresh e logout. Limites
  de CORS/cookies de terceiros/CSRF nos [contratos](../API_CONTRACTS.md).

## Publicação aprovada — apenas `app`

Após registrar/preservar a imagem anterior e validar as condições acima, mudar o
checkout limpo para a revisão integrada, aprovada na CI e autorizada. Construir
somente o Web enquanto o container antigo continua atendendo:

```bash
docker compose -f docker-compose.prod.yml build app
```

Manter as variáveis produtivas existentes: `NEXT_PUBLIC_API_URL` entra no build.
Não usar a URL sintética de testes; não alterar `.env`, domínio, cookies, pepper,
Dockerfiles, Caddy ou redes. Se o build falhar, não trocar o container antigo.
Esta release não executa seeds, importadores nem migrations.

Substituir exclusivamente `app`, sem iniciar/recriar dependências nem puxar
outras imagens:

```bash
docker compose -f docker-compose.prod.yml up -d --no-deps --no-build --pull never app
docker compose -f docker-compose.prod.yml ps app
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

Não usar `up` sem serviço explícito, `down`, `restart` ou parada da stack inteira.
Confirmar healthcheck do Web, nova imagem e baseline inalterado de IDs/imagens e
horários de início de API/banco/Caddy. Se algum dependente mudou, parar e investigar;
não ampliar o deploy para tentar corrigir. Uma única instância pode ter breve
indisponibilidade do Web na troca; não é um procedimento de zero downtime.

## Smoke e aceite

- Parte automatizável, externa: HTTPS/redirect, landing, robots, sitemap apenas
  público, manifest, ícones/OG, cabeçalhos, health e respostas anônimas protegidas.
  Registrar cabeçalhos ausentes, sem introduzir hardening do proxy neste deploy.
- Firewall: roteiro existente a partir de origem SSH autorizada e não autorizada;
  não abrir novas portas ou publicar a calculadora para testar.
- Responsável, sem compartilhar senha/token/cookie: login incorreto/correto,
  recarga/refresh, logout, produtos/clientes, simulação e dashboard. Em regime com
  regra ativa, `85171300` deve calcular. `85171200` é bloqueado na UI; para comprovar
  o 422 do backend, usar uma requisição autenticada controlada pelo próprio
  navegador, sem enviar credenciais ao agente. Não criar vendas fiscais reais.
- Confirmar preview social e sessões nos fluxos principais. Health não comprova
  banco/calculadora nem substitui uma simulação controlada real.
- Preservar resultados privados. Somente após aceite e autorização própria criar
  tag/release, reconciliar issues e anunciar a v1.0 no README. CI local e uma demo
  anterior não comprovam que esta revisão foi publicada.

## Rollback — somente a imagem do Web

Preservar a imagem antiga antes do build, por referência local de rollback e
registro privado do ID. Não deixar limpeza de imagens removê-la. Em caso de falha,
o operador decide o retorno e usa um override **privado**, preparado e conferido
com apenas `services.app.image` apontando para essa imagem anterior:

```bash
: "${release_web_override:?Defina o arquivo privado do override conferido}"
docker compose -f docker-compose.prod.yml -f "$release_web_override" up -d --no-deps --no-build --pull never app
```

Confirmar imagem/health do Web, baseline intacto de API/banco/Caddy e smoke de
retorno. Não restaurar banco, revogar sessões, parar API ou recriar Caddy por uma
troca de imagem do Web. Escritas legítimas posteriores ao backup devem permanecer.
Registrar que o checkout alvo e a imagem Web em execução podem divergir após o
retorno; uma próxima publicação deve resolver essa identidade explicitamente.

Se schema, dados, backend ou configuração mudaram inesperadamente, este rollback
Web-only não resolve a situação: parar e solicitar plano específico. Não apagar
volumes, improvisar SQL reverso ou executar rollback automático por Lighthouse
ou falha transitória da calculadora. Preservar logs e imagens para investigação.

Referências: [Compose build](https://docs.docker.com/reference/cli/docker/compose/build/),
[Compose up e `--no-deps`](https://docs.docker.com/reference/cli/docker/compose/up/)
e [backup consistente com pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html).
