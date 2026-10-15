# Deploy e rollback

Procedimento manual, não autorização para executar comandos. Preencher os
placeholders com configuração privada; não publicar hosts, endereços, caminhos
operacionais, identificadores de backup ou saídas com segredos.

## Antes do deploy

1. Registrar privadamente revisão e imagens atuais, revisão alvo e migrations
   aplicadas. Um deploy anterior não comprova que a branch de fechamento está
   publicada. Conferir a revisão exata aprovada na CI.
2. Validar configuração com `docker compose -f docker-compose.prod.yml config --quiet`,
   sem imprimir valores. Caddy é o único serviço publicado em 80/443; não
   publicar Web/API/banco. Confirmar a configuração externa separadamente.
3. Executar o SQL somente leitura [release-preflight.sql](./release-preflight.sql)
   pelo container do banco, cuja rede é interna. Ler toda a saída: regras e
   produtos obsoletos, dados demo e histórico de migrations. O retorno anterior
   do responsável confirmou esses pontos em 11/10/2026; repetir antes de novo
   deploy se o estado puder ter mudado.
4. Conferir presença do pepper sem exibir o valor. Gerar segredos apenas fora
   do Git e guardá-los em gerenciador seguro. Não rotacionar o pepper existente
   inadvertidamente: invalida a capacidade de usar sessões anteriores.
5. Suspender escrita, obter backup consistente e validar tamanho, leitura do
   arquivo e restauração em banco isolado. Guardar local, checksum e revisão
   correspondente em registro privado. Não sobrescrever backups de rollback.

Exemplo de backup (substituir o destino; contém dados privados):

```bash
docker compose -f docker-compose.prod.yml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > <BACKUP_PATH>
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

## Publicação aprovada

1. Construir API/Web da revisão aprovada:
   `docker compose -f docker-compose.prod.yml build api app`. Não rodar seeds.
2. Comparar migrations já aplicadas com as versionadas. O startup da API não
   roda migrations. Somente se houver pendências, SQL revisado, backup validado
   e autorização específica, suspender API/Web e executar o procedimento
   explícito de migrations. Não reaplicar manualmente nem usar reset.
3. A migração histórica de hash de refresh encerra sessões antigas; a correção
   histórica de NCM preserva snapshots e requer revisão de produtos fictícios.
   Conferir o estado aplicado em vez de presumir nova execução necessária.
4. Subir a revisão construída com
   `docker compose -f docker-compose.prod.yml up -d --no-build`; conferir
   healthchecks, HTTPS e logs sem dados sensíveis.
5. Smoke: cadastro/login, recarga com sessão, logout e recuperação de falha;
   produtos/clientes; simulação manual/catálogo; venda e dashboard. Validar
   metadados públicos e noindex privado pelo HTTP da revisão publicada.
   `/health` não prova disponibilidade da calculadora: testar fluxo fiscal
   controlado e mensagem de indisponibilidade. Não usar dados fiscais reais.
6. Registrar resultados privadamente e atualizar status público resumido.
   Somente depois reconciliar issues e criar release/tag em autorização própria.
   Este documento não executa essas ações.

## Rollback

- Sem mudança de schema: restaurar revisão/imagens/configuração compatíveis
  previamente guardadas; verificar saúde e smoke antes de reabrir escrita.
- Com mudança de schema: imagem antiga pode ser incompatível. Manter escrita
  suspensa, restaurar backup validado em banco novo/isolado e validar antes de
  apontar a aplicação. Não apagar volume, executar `migrate reset` ou improvisar
  SQL reverso. Restauração pode perder escritas posteriores; conciliar antes de
  reabrir o serviço.
- Preservar logs e banco atual para investigação. Não fazer rollback automático
  com base apenas em Lighthouse ou em falha transitória de dependência.
