# Registro de decisões implementadas

## 2026-09-25 — P1 #2: seleção e diagnóstico de NCM na interface

### Resumo

- A busca de NCM passou a usar código por prefixo e descrição por substring,
  ignorando caixa e acentos, sem fuzzy match.
- O cadastro de produtos e o modo manual da simulação compartilham o hook
  `useNcmSearch`.
- A busca retorna somente NCMs vigentes, ordena os elegíveis primeiro e mantém
  visíveis os códigos sem regra ativa, com status textual.
- Foi criado diagnóstico batch com os estados `INVALID_FORMAT`, `NOT_FOUND`,
  `NOT_CURRENT`, `NO_ACTIVE_RULE`, `ELIGIBLE` e o estado técnico genérico
  `CONFIGURATION_UNAVAILABLE`.
- O formulário valida NCM completo ou em `blur` e repete o diagnóstico de todos
  os itens no envio. Itens bloqueadores impedem a chamada da calculadora da RFB,
  sem desabilitar permanentemente o botão de simulação.
- Todos os itens inválidos são destacados simultaneamente, com resumo,
  associação dos erros aos campos e reconciliação por índice dos erros finais
  retornados pelo backend.
- Falhas técnicas da verificação antecipada geram `UNVERIFIED`, não invalidam o
  NCM e deixam o backend decidir no envio.
- O estado completo do formulário é preservado após erros e foi adicionado o
  botão **Limpar tudo**, que reinicia com uma linha vazia.
- Regras com CST ou `cClassTrib` incompatível agora retornam indisponibilidade
  fiscal genérica, sem expor detalhes internos ao usuário.

### Arquivos alterados

#### API

- `apps/api/src/modules/ncm/ncm.routes.ts`
- `apps/api/src/modules/ncm/ncm.service.ts`
- `apps/api/src/modules/ncm/ncm.service.test.ts`
- `apps/api/src/modules/sales/sales.schema.ts`
- `apps/api/src/modules/sales/sales.service.ts`
- `apps/api/src/modules/sales/tax-eligibility.ts`
- `apps/api/src/modules/sales/tax-eligibility.test.ts`
- `apps/api/src/shared/errors/app-error-details.test.ts`

#### Web

- `apps/web/src/app/(dashboard)/products/page.tsx`
- `apps/web/src/app/(dashboard)/simulation/page.tsx`
- `apps/web/src/components/ncm/ncm-status.tsx`
- `apps/web/src/components/simulation/simulation-form.tsx`
- `apps/web/src/hooks/use-ncm-search.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/ncm-eligibility.ts`
- `apps/web/src/lib/simulation-form-validation.ts`
- `apps/web/src/lib/simulation-form-validation.test.ts`

### Validação executada

- API: `vitest run` — 21 arquivos e 86 testes aprovados.
- Web: `vitest run` — 3 arquivos e 15 testes aprovados.
- API: `tsc --noEmit` — aprovado.
- Web: `tsc --noEmit` — aprovado.
- Smoke test somente leitura contra o PostgreSQL local — busca sem acento e
  diagnóstico `ELIGIBLE`/`NOT_FOUND` aprovados.
- O ESLint não pôde iniciar porque o ambiente Web existente não contém a
  dependência `@eslint/eslintrc`, já importada por `eslint.config.mjs`; nenhuma
  falha de lint do código desta entrega chegou a ser produzida.

## 2026-09-25 — P1 #3: CNPJ alfanumérico

### Resumo

- CNPJs numéricos existentes foram mantidos sem migração. A auditoria somente
  leitura encontrou 8 empresas e 5 clientes, todos já armazenados sem máscara,
  com comprimento esperado e em caixa canônica; não há duplicidade dentro dos
  respectivos escopos de unicidade.
- A validação de CNPJ agora aceita os formatos numérico e alfanumérico oficiais:
  12 posições numéricas/alfanuméricas e dois dígitos verificadores numéricos,
  calculados por módulo 11 com o valor ASCII do caractere menos 48.
- Formato inválido e dígito verificador incorreto permanecem diagnósticos
  internos distintos, mas cadastro, edição e conflitos de unicidade exibem uma
  única mensagem pública: **CNPJ inválido**.
- Entradas com máscara, espaços e letras minúsculas são aceitas. O valor enviado
  à persistência é sempre canônico, sem máscara e em maiúsculas.
- Cadastro da empresa, exibição em Configurações e CRUD de clientes usam máscara
  progressiva. CPF continua aceitando somente números e tem validação própria.
- A busca de clientes normaliza documentos mascarados e letras minúsculas antes
  de consultar o valor canônico, preservando simultaneamente a busca por nome.
- Clientes com documentos legados permanecem editáveis quando o documento não é
  alterado; valores novos ou modificados precisam passar pela validação atual.
- Não foi necessária alteração no schema Prisma nem migration: os campos já são
  `String`, e a normalização na fronteira de escrita mantém a unicidade
  independente de máscara e caixa.

### Arquivos alterados

#### API

- `apps/api/src/shared/documents/br-document.ts`
- `apps/api/src/shared/documents/br-document.test.ts`
- `apps/api/src/modules/auth/auth.schema.ts`
- `apps/api/src/modules/auth/auth.schema.test.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.controller.test.ts`
- `apps/api/src/modules/clients/clients.schema.ts`
- `apps/api/src/modules/clients/clients.schema.test.ts`
- `apps/api/src/modules/clients/clients.service.ts`
- `apps/api/src/modules/clients/clients.service.test.ts`

#### Web

- `apps/web/src/lib/br-document.ts`
- `apps/web/src/lib/br-document.test.ts`
- `apps/web/src/app/(auth)/register/page.tsx`
- `apps/web/src/app/(dashboard)/customers/page.tsx`
- `apps/web/src/app/(dashboard)/settings/page.tsx`

### Validação executada

- Auditoria somente leitura no PostgreSQL local — 8 empresas e 5 clientes sem
  necessidade de normalização ou correção de duplicidade por tenant.
- API: `vitest run` — 25 arquivos e 101 testes aprovados.
- Web: `vitest run` — 4 arquivos e 21 testes aprovados.
- API: `tsc --noEmit` — aprovado.
- Web: `tsc --noEmit` — aprovado.
- Testes específicos cobrem CNPJ numérico, exemplos alfanuméricos oficiais,
  cálculo de DV, máscara progressiva, CPF numérico, busca canônica, mensagem
  pública genérica e preservação de documento legado inalterado.
