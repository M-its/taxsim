# Contratos da API — TaxSim

Estado do código em 15/10/2026. Referência para integração, não uma promessa de
conformidade fiscal. Os exemplos são didáticos; as respostas da calculadora
dependem da versão instalada. Schemas, controllers e testes em `apps/api/src`
são a referência executável. Não há Swagger/OpenAPI publicado nesta versão.

## Convenções

- Desenvolvimento: `http://localhost:3333`; produção: `<API_ORIGIN>` via HTTPS.
- JSON em requisições com corpo e em respostas, exceto `204 No Content`.
- Bearer JWT para rotas protegidas; tenant derivado de `companyId` no JWT,
  nunca de um campo livre enviado pelo cliente.
- IDs UUID; datas ISO 8601; dinheiro em strings decimais, normalmente com duas
  casas na saída; alíquotas fracionárias com quatro casas. `0.1800` significa 18%.
- Paginação: `page=1`, `limit=20`, máximo 100. Listas retornam
  `{ data, pagination: { page, limit, total, totalPages } }`.
- Erros de aplicação: `{ error: { code, message, details? } }`. Zod retorna
  `400 VALIDATION_ERROR`; autenticação `401 UNAUTHORIZED`; recursos ausentes
  `404 NOT_FOUND`; conflitos `409 CONFLICT`; regra de negócio normalmente
  `422 UNPROCESSABLE_ENTITY`. Diagnósticos de NCM têm códigos específicos abaixo.
- Login/cadastro têm rate limit padrão de cinco tentativas por minuto;
  excesso retorna `429 RATE_LIMIT_EXCEEDED`. `AUTH_RATE_LIMIT_MAX` é destinado
  a ambientes controlados e não está definido no compose de produção.

## Autenticação e cookie

O token de acesso dura 15 minutos e fica em memória no navegador. O refresh é
opaco, rotacionado em cada uso, com prazo de sete dias e somente seu hash
HMAC-SHA-256 armazenado no banco. O pepper é configuração secreta externa.

Em produção, login/cadastro/refresh enviam:

```http
Set-Cookie: refreshToken=<TOKEN>; HttpOnly; Secure; SameSite=None; Path=/auth; Max-Age=604800
```

`SameSite=None` permite o envio entre as origens Web/API da implantação:
no provedor de domínio compartilhado usado pelo projeto, os dois subdomínios
são tratados como sites distintos pelo navegador. Exige HTTPS e `Secure`.
`HttpOnly` impede leitura do cookie por JavaScript, mas não elimina XSS/CSRF;
manter CORS com origem explícita e `credentials: true`, sem wildcard em produção.
Políticas de bloqueio de cookies de terceiros ainda podem impedir a sessão.
Não existe token anti-CSRF dedicado nesta entrega.

`Path=/auth` inclui refresh e logout: o antigo escopo `/auth/refresh` impedia
que logout recebesse o token a revogar. A remoção usa o mesmo `Path=/auth`.
Path limita o envio do cookie, não é uma fronteira de autorização. Em
desenvolvimento/testes o cookie usa `SameSite=Lax`, sem `Secure`, em origens
compatíveis com o mesmo site. Clientes HTTP devem enviar cookies com credenciais.

### POST /auth/register — público

Cria empresa, usuário OWNER e sessão; resposta `201` com
`{ user: { id, name, email, role }, company, accessToken }`.

```json
{
  "company": {
    "name": "Empresa de demonstração",
    "document": "11222333000181",
    "taxRegime": "LUCRO_REAL",
    "municipioCode": 4314902,
    "uf": "RS"
  },
  "user": {
    "name": "Pessoa de demonstração",
    "email": "pessoa@example.com",
    "password": "<SENHA_DE_TESTE>"
  }
}
```

Senha mínima de oito caracteres. CNPJ numérico ou alfanumérico é normalizado
para 14 caracteres sem máscara, em maiúsculas, e validado por DV; CPF não serve
para cadastro de empresa. CNPJ inválido ou duplicado expõe a mesma mensagem
`CNPJ inválido`, embora o status HTTP possa diferir (`400`/`422`/`409`). Isso
reduz detalhes na interface, mas não torna os protocolos indistinguíveis.
Conflito de email tem mensagem genérica de cadastro. Não há migração de valor
dos CNPJs numéricos existentes.

### POST /auth/login — público

Corpo `{ email, password }`. Resposta `200`:
`{ user: { id, name, email, role, companyId }, accessToken }` e cookie.
Credenciais incorretas retornam `401`, sem indicar o campo errado. O cliente
não tenta refresh nem repete login/cadastro ao receber esse erro.

### POST /auth/refresh — cookie

Sem corpo. Rotaciona o cookie e retorna `200 { accessToken }`. Token ausente,
expirado ou inválido retorna `401`. Reuso detectado revoga as sessões do usuário;
não repetir automaticamente a operação após falha técnica.

### GET /auth/me — Bearer

Retorna `200 { user: { id, name, email, role, companyId }, company }`.
Empresa contém `id, name, document, taxRegime, municipioCode, uf`.
Esta leitura pode ser repetida sem rotacionar o cookie.

### POST /auth/logout — cookie

Revoga apenas o refresh apresentado, se houver, limpa o cookie em `/auth` e
retorna `204`. Idempotente; não exige Bearer. JWTs de acesso já emitidos não
possuem denylist e podem continuar válidos até expirar.

### POST /auth/logout/all — Bearer

Revoga todos os refresh tokens do usuário autenticado, limpa o cookie e retorna
`204`. Não confundir com logout da sessão atual.

## Produtos — Bearer

- `GET /products`: paginação e `search` por nome, SKU ou NCM, sem diferença de
  caixa. Cada item inclui `id, companyId, name, sku, ncmCode, unitPrice,
  createdAt, updatedAt, ncmStatus, ncmDescription`. A resposta também inclui
  `metadata.ncmCatalogVersion`.
- `GET /products/:id`: produto do tenant, sem enriquecimento de diagnóstico.
- `POST /products`: `{ name, sku, ncmCode, unitPrice }`, resposta `201`.
- `PUT /products/:id`: mesmos campos obrigatórios, resposta `200`.
- `DELETE /products/:id`: resposta `204`.

NCM deve ter oito dígitos; preço é string decimal positiva, sem expoente,
com até nove dígitos inteiros e duas casas. SKU é único por empresa (`409`).
Criação valida existência e vigência do NCM; edição revalida quando o código
muda. É permitido cadastrar NCM vigente sem regra ativa: isso bloqueia a
simulação, não o cadastro. `422 INVALID_NCM` inclui código e status quando
inexistente/não vigente. Um produto antigo com NCM mantido pode continuar
editável; lista e envio da simulação detectam sua inelegibilidade atual.

## Clientes — Bearer

- `GET /clients`: paginação e `search` por nome/documento; documento mascarado
  ou canônico, sem diferença de caixa.
- `GET /clients/:id`: cliente do tenant.
- `POST /clients`: `{ name, document, email? }`, resposta `201`.
- `PUT /clients/:id`: mesmos campos, resposta `200`.
- `DELETE /clients/:id`: resposta `204`.

Cliente contém `id, companyId, name, document, email, createdAt, updatedAt`.
CPF permanece numérico; CNPJ aceita letras nos primeiros 12 caracteres e dois
DV numéricos. Normalização remove máscara/espaços e converte CNPJ para
maiúsculas. Documento é único por tenant. A mensagem pública não diferencia
CNPJ inválido de duplicado; registros legados mantidos podem ser editados sem
alteração do documento.

## NCM — Bearer

### GET /ncm/search?q=<CONSULTA>&taxRegime=<REGIME>

`q`: 1–50 caracteres. Busca prefixo de código ou substring da descrição sem
acentos/caixa, sem fuzzy match; retorna até dez NCMs vigentes, priorizando os
elegíveis. Resposta é array de `{ code, description, status }`.
Status: `ELIGIBLE`, `NO_ACTIVE_RULE` ou `CONFIGURATION_UNAVAILABLE`.
Ausência de regra não remove o NCM da pesquisa.

### POST /ncm/diagnose

Corpo `{ codes: ["84713012"], taxRegime: "LUCRO_REAL" }`, 1–100 entradas.
Retorna array na ordem recebida: `{ code, description: string | null, status }`.
Status adicionais: `INVALID_FORMAT`, `NOT_FOUND`, `NOT_CURRENT`.
Falha técnica HTTP não equivale a NCM inválido; o cliente permite o envio para
a validação final. Catálogo é snapshot versionado, não sincronizado online.

## Simulação e vendas — Bearer

Regimes aceitos: `SIMPLES_NACIONAL`, `LUCRO_PRESUMIDO`, `LUCRO_REAL`.
Limite de 100 itens, quantidade inteira entre 1 e 10.000 por item.

### POST /sales/simulate

Não persiste registros. Entrada:

```json
{
  "taxRegime": "LUCRO_REAL",
  "items": [{ "ncmCode": "84713012", "quantity": 1, "unitPrice": "1000.00" }]
}
```

Resposta `200`: `{ totalAmount, currentModel, reformModel, delta, breakdown }`.
`currentModel` contém `totalPis, totalCofins, totalIcms, totalIss, total,
effectiveRate`; `reformModel` contém `totalIbs, totalCbs, totalIs, total,
effectiveRate`. `delta` contém `absolute` e `percentual` (reformado menos atual;
percentual usa base atual, retorna zero se essa base for zero).
Cada breakdown contém `ncmCode, quantity, unitPrice, totalPrice`, alíquotas e
`totalTax` dos dois modelos. Os valores da reforma vêm da calculadora integrada,
não do exemplo sintético da landing.

Limitação atual: apesar da autenticação, a simulação avulsa usa município/UF
didáticos fixos (Porto Alegre/RS); não usa a localização da empresa. A venda
persistida usa os dados da empresa. Isso não é equivalente a apuração fiscal.

### POST /sales

Entrada `{ clientId, items: [{ productId, quantity }] }`. Cliente e produtos
devem pertencer ao tenant; preços e NCMs vêm do cadastro. Calcula os modelos
antes de persistir venda `DRAFT` e snapshots por item. Resposta `201`: venda
com `id, status, clientId, totalAmount, currentModel, reformModel,
delta, items, createdAt`. As respostas de venda não incluem `effectiveRate`.

### Consulta e transições

- `GET /sales`: paginação; filtros opcionais `status`, `from`, `to` (datas ISO).
- `GET /sales/:id`: venda completa com itens/snapshots.
- `PATCH /sales/:id/confirm`: somente DRAFT → CONFIRMED; retorna `{ id, status }`.
- `PATCH /sales/:id/cancel`: DRAFT → CANCELLED; aceita repetir em CANCELLED e
  rejeita CONFIRMED. Retorna `{ id, status }`.

Antes de chamar a calculadora, simulação/venda validam todos os itens. Erro
`422 NCM_NOT_ELIGIBLE` inclui `details.issues[]` com `itemIndex` (base zero),
`ncmCode`, `reason` e `details`. Reasons: `INVALID_FORMAT`, `NCM_NOT_FOUND`,
`NCM_NOT_CURRENT`, `NO_ACTIVE_RULE`. Formato inválido também pode ser rejeitado
antes pelo schema (`400 VALIDATION_ERROR`). Configuração CST/cClassTrib malformada
retorna `503 TAX_CONFIGURATION_UNAVAILABLE`, sem diagnóstico técnico ao usuário.
Indisponibilidade/resposta incompatível da calculadora retorna `422
UNPROCESSABLE_ENTITY`, sem fallback fiscal inventado.

## Empresa, dashboard e municípios — Bearer

- `PATCH /companies/:id`: `{ name, taxRegime, municipioCode, uf }`, resposta
  `200` com empresa atualizada. `:id` não seleciona tenant: usa `companyId` do
  JWT. Documento não é editável nesse endpoint.
- `GET /dashboard/summary`: `{ kpis, taxLoadByMonth, taxComposition }`, apenas
  vendas CONFIRMED do tenant. KPIs YTD incluem `estimatedSavings` (reformado
  menos atual), `estimatedSavingsPercent`, `projectedIbs`, `projectedCbs`,
  `projectedIs`. Série de seis meses: `{ month: "YYYY-MM", current, reform }`,
  meses vazios preenchidos com zero. Composição: `{ name, value }`, percentual
  em string. Janelas usam referências UTC do serviço.
- `GET /municipalities?uf=RS`: array `{ code, name }`, cache em memória por UF;
  consulta a calculadora, retorna `502` se falhar. O endpoint exige sessão e
  ainda depende de endereço de serviço fixo no código; não é configurável pela
  mesma variável da simulação. Cadastro solicita código IBGE e UF manualmente.
- `GET /health`: público, `{ status, service, timestamp }`; não comprova
  disponibilidade fiscal da calculadora.
