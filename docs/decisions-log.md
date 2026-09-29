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

## 2026-09-25 — P1 #4: baseline WCAG 2.2 AA

### 1. Sidebar recolhida e skip link — concluído

- Foi adicionado o link **Pular para o conteúdo** como primeiro controle do
  shell autenticado. Ele permanece visualmente oculto até receber foco e então
  aparece com contraste e indicador de foco explícitos.
- O `main` agora possui destino estável `main-content` e aceita foco
  programático, permitindo ultrapassar topbar e navegação repetida.
- Todos os links da sidebar mantêm nome acessível por `aria-label` quando o
  texto visual é removido no estado recolhido.
- A rota ativa passou a expor `aria-current="page"`; o link de Configurações foi
  normalizado para `/settings`.

Arquivos: `apps/web/src/components/layout/dashboard-shell.tsx`,
`apps/web/src/components/layout/sidebar.tsx`.

Validação: TypeScript e suíte Web serão executados cumulativamente ao final do
próximo subitem e novamente no fechamento da rodada.

### 2. Erros de formulários — concluído

- Login e cadastro agora validam todos os campos de uma vez, exibem resumo no
  topo com links para os controles, mantêm mensagens junto aos campos e usam
  `aria-invalid`/`aria-describedby`.
- Produtos e clientes receberam o mesmo padrão dentro dos dialogs, incluindo
  anúncio de falhas da API e associação programática de cada mensagem.
- A simulação mantém o resumo por quantidade de itens e agora também lista cada
  erro com link para o controle correspondente; mensagens de produto, NCM,
  preço e quantidade ficam junto ao respectivo campo.
- No envio inválido, o foco é movido para o primeiro controle com erro segundo
  a ordem visual. Falhas gerais da API levam o foco ao resumo; falhas de
  documento retornam diretamente ao campo de documento.
- Os formulários usam `noValidate` para evitar competição entre mensagens
  nativas inconsistentes do navegador e o padrão acessível do produto.

Arquivos: `apps/web/src/app/(auth)/login/page.tsx`,
`apps/web/src/app/(auth)/register/page.tsx`,
`apps/web/src/app/(dashboard)/products/page.tsx`,
`apps/web/src/app/(dashboard)/customers/page.tsx`,
`apps/web/src/components/simulation/simulation-form.tsx`.

Validação: `tsc --noEmit` Web aprovado após as correções.

### 3. Autocompletes — concluído

- Os autocompletes de NCM no cadastro de produtos e no modo manual da
  simulação, além da busca de produtos do catálogo na simulação, agora seguem
  o padrão de `combobox` com `listbox` e opções identificadas.
- Setas percorrem todas as opções com retorno circular; `Home` e `End` saltam
  para os extremos, `Enter` seleciona e `Escape` fecha a lista. O foco permanece
  no campo e a opção ativa é comunicada por `aria-activedescendant`.
- As listas só são expostas como abertas enquanto estão disponíveis e o campo
  está ativo. Clique nas opções não dispara indevidamente a validação de `blur`.
- Quantidade de resultados, carregamento e falha de busca são anunciados por
  região de status sem adicionar ruído visual. A elegibilidade continua visível
  em cada opção de NCM e produto.
- A lógica de teclado foi centralizada no hook compartilhado
  `use-combobox-navigation`, evitando divergência entre os três usos.

Arquivos: `apps/web/src/hooks/use-combobox-navigation.ts`,
`apps/web/src/hooks/use-combobox-navigation.test.ts`,
`apps/web/src/app/(dashboard)/products/page.tsx`,
`apps/web/src/components/simulation/simulation-form.tsx`.

Validação: `tsc --noEmit --incremental false` Web aprovado. O runner do host não
iniciou porque o binding nativo opcional do Rolldown não corresponde ao WSL;
na validação cumulativa pelo container Linux, o teste do hook e toda a suíte Web
foram aprovados.

### 4. Títulos, landmarks e headings — concluído

- Cada rota auditada passou a ter título de documento próprio por metadata do
  App Router, usando o padrão “Página | TaxSim” para login, cadastro, dashboard,
  simulação, produtos, clientes, vendas e configurações.
- Login e cadastro agora usam `main` e um `h1`; os estados globais 404/erro
  também possuem landmark principal e hierarquia iniciada em `h1`.
- Os blocos secundários da simulação, dashboard e configurações foram
  normalizados para `h2`, removendo saltos de `h1` diretamente para `h3`.
  `CardTitle` ganhou nível semântico configurável, mantendo `h3` como padrão
  compatível para os demais usos.
- Os dois gráficos do dashboard expõem alternativa textual acionável: tabela
  mensal para carga tributária e lista percentual para composição. Os SVGs
  puramente visuais foram ocultados da árvore de acessibilidade para evitar
  duplicação e ruído.

Arquivos: `apps/web/src/app/layout.tsx`, layouts de rota em
`apps/web/src/app/(auth)/*/layout.tsx` e
`apps/web/src/app/(dashboard)/*/layout.tsx`, páginas de login/cadastro,
`apps/web/src/app/global-error.tsx`, `apps/web/src/app/not-found.tsx`,
`apps/web/src/components/ui/card.tsx`, componentes de simulação e componentes
de dashboard.

Validação: `tsc --noEmit --incremental false` Web aprovado e varredura estática
da hierarquia confirmou `h1` por página seguido de seções em `h2`.

### 5. Estados assíncronos — concluído

- Foi criado `AsyncStatus`, uma região compartilhada `role="status"` com
  anúncio atômico, aplicada a login, cadastro, simulação, dashboard,
  configurações, produtos, clientes e vendas. Carregamentos curtos são
  anunciados sem inserir indicadores visuais adicionais.
- Conclusão da simulação, carregamento de listas e detalhes, cadastro, edição,
  exclusão, confirmação e cancelamento passam a produzir mensagens de status.
  Contêineres relevantes também expõem `aria-busy` durante processamento.
- Falhas visíveis de simulação, dashboard e listas foram marcadas como
  `role="alert"`; os resumos de erro dos formulários já mantêm essa semântica.
- As confirmações “Confirmar?” de produto, cliente e venda não possuem mais
  timeout. Permanecem ativas até clique fora ou acionamento do botão explícito
  de cancelamento, com anúncio e nome acessível contextual contendo o item ou a
  operação afetada.
- A mensagem de sucesso de Configurações também deixa de desaparecer por tempo:
  permanece visível até nova edição ou novo envio.

Arquivos: `apps/web/src/components/ui/async-status.tsx`, páginas de login,
cadastro, simulação, dashboard, configurações, produtos, clientes e vendas,
além de `apps/web/src/components/simulation/simulation-form.tsx`.

Validação: `tsc --noEmit --incremental false` Web aprovado. Varredura estática
confirmou a remoção dos timers de confirmação; os únicos textos
“Confirmar?” restantes pertencem ao estado persistente deliberado dos botões.

### 6. Drawer e foco — concluído

- Em viewport móvel, a sidebar passa a ser exposta como dialog modal nomeado,
  com backdrop visual aprovado e bloqueio de rolagem da página ao fundo.
- Ao abrir, o restante do shell recebe `inert` e `aria-hidden`; o foco inicial é
  movido para “Fechar menu” e `Tab`/`Shift+Tab` ficam contidos nos controles
  visíveis do drawer.
- `Escape`, o botão de fechar, o backdrop e a navegação para uma rota fecham o
  drawer. Ao fechar sem navegar, o foco é restaurado ao botão “Abrir menu”.
- O acionador expõe `aria-controls="app-sidebar"` e `aria-expanded`; o conteúdo
  ao fundo deixa de participar da sequência de foco enquanto o drawer está
  aberto.
- A mudança entre breakpoints usa `matchMedia`, mantendo o comportamento de
  sidebar expandida/recolhida no desktop separado do drawer móvel.

Arquivos: `apps/web/src/components/layout/dashboard-shell.tsx`,
`apps/web/src/components/layout/sidebar.tsx`,
`apps/web/src/components/layout/topbar.tsx`.

Validação automatizada: `tsc --noEmit --incremental false` Web aprovado. A
validação de interação por teclado nos navegadores integra a matriz manual do
fechamento da rodada.

### 7. Movimento reduzido e moderados restantes — concluído

- O app inteiro foi envolvido em `MotionConfig reducedMotion="user"`, fazendo
  os componentes Framer Motion respeitarem a preferência do sistema.
- A folha global reduz animações, transições e rolagem suave sob
  `prefers-reduced-motion: reduce`, incluindo a pulsação dos skeletons. O tour
  também desativa explicitamente animação e `smoothScroll` quando a preferência
  está ativa.
- O indicador global de `focus-visible` foi reforçado para controles
  interativos com contorno esmeralda de 3 px e afastamento de 3 px, sem depender
  somente de mudança sutil de borda ou cor.
- O seletor “Produto do catálogo”/“NCM manual” está agrupado e cada botão expõe
  `aria-pressed`; o grupo recebe nome por item.
- O filtro de vendas ganhou label visual persistente, associado ao trigger por
  `htmlFor`/`id`.
- Os demais moderados do relatório foram absorvidos nos subitens anteriores:
  landmarks/headings, estados de autenticação, operações de listas e
  confirmações contextualizadas sem timeout.

Arquivos: `apps/web/src/components/accessibility/motion-preferences.tsx`,
`apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`,
`apps/web/src/components/onboarding/taxsim-tour.tsx`,
`apps/web/src/components/simulation/simulation-form.tsx`,
`apps/web/src/app/(dashboard)/sales/page.tsx`.

Validação automatizada: `tsc --noEmit --incremental false` Web aprovado. A
matriz manual de teclado, leitor de tela, viewport e zoom é registrada abaixo.

### Validação cumulativa

- TypeScript Web no container: aprovado, sem emissão de arquivos.
- Vitest Web no container: **5 arquivos e 23 testes aprovados**, incluindo o
  novo teste de navegação do autocomplete.
- Build Next.js de produção: aprovado; 15 páginas geradas. Os artefatos
  confirmam títulos próprios para as oito rotas auditadas.
- `git diff --check` nos arquivos Web e neste log: aprovado.
- Checagens estáticas mandatórias: zero ocorrências críticas no baseline, nenhum
  timer de confirmação remanescente, implementação de movimento reduzido em
  CSS/Framer/Driver.js e alternativa textual presente nos dois gráficos.
- ESLint: não iniciou porque a instalação existente não contém
  `@eslint/eslintrc`, embora `eslint.config.mjs` importe o pacote. O build
  registrou o mesmo aviso e concluiu com sucesso; não houve diagnóstico de lint
  contra o código desta rodada.

### Matriz de validação manual

- **Teclado — Chromium, desktop e móvel:** conhecido, não bloqueante; pendente.
  A automação de navegador falhou ao inicializar duas vezes com
  `failed to write kernel assets`, antes de abrir qualquer janela.
- **Teclado — Firefox, desktop e móvel:** conhecido, não bloqueante; pendente.
  Não há Firefox instalado ou sessão automatizável disponível neste ambiente.
- **NVDA com Chromium:** conhecido, não bloqueante; pendente. A falha do canal
  Windows impediu abrir/controlar Chromium e observar a navegação com NVDA.
- **Zoom 200% e checagem dirigida em 400%:** conhecido, não bloqueante;
  pendente pelo mesmo bloqueio da automação visual.
- **Plano de correção/fechamento futuro:** repetir a matriz em uma estação
  Windows com Chromium, Firefox e NVDA disponíveis; percorrer login, cadastro,
  simulação, produtos, clientes, vendas e dashboard, verificando skip link,
  resumos de erro, autocompletes, drawer, regiões de status, gráficos e reflow.
  Qualquer regressão encontrada deve ser registrada por critério WCAG e
  corrigida antes de transformar os sérios em gate absoluto.

O baseline continua com **zero achados críticos conhecidos**. Todos os 13
achados sérios do relatório receberam correção de código nesta rodada; a
confirmação manual multiplataforma acima permanece explicitamente pendente sob
o baseline pragmático, sem ser apresentada como teste aprovado.

## 2026-09-25 — P1 #5: regressões automatizadas de acessibilidade

### Gate e cobertura implementados

- Playwright e `@axe-core/playwright` foram integrados em dois projetos:
  Chromium desktop (1440 × 900) e Chromium em viewport Pixel 7. Os dois rodam
  em todo pull request e push para `main`, após testes e typecheck.
- O gate falha para qualquer ocorrência axe de impacto `serious` ou
  `critical`. O resultado completo do axe é anexado ao relatório de cada
  estado, inclusive quando não há bloqueio.
- Testes explícitos de teclado cobrem sidebar expandida/recolhida, contenção e
  restauração de foco no drawer móvel, abertura/fechamento de dialog e seleção
  por teclado nos modos catálogo e NCM manual da simulação. Falhas nesses testes
  bloqueiam o workflow independentemente da classificação do axe.
- Os seis fluxos do aceite estão cobertos: login (inicial, erro e sessão
  autenticada), cadastro (formulário e erros), simulação (catálogo, manual,
  múltiplos erros e resultado), produtos/clientes (lista, busca, criação e
  edição), vendas (filtro, detalhes e ações) e estados compartilhados da
  navegação.
- Retries permanecem desativados. O timeout por cenário é de 90 segundos para
  suportar a compilação fria do Next.js no container sem transformar falhas em
  aprovações intermitentes.

### Ambiente determinístico

- A suíte usa `docker-compose.a11y.yml`, com PostgreSQL em `tmpfs`, API e Web
  próprias e remoção de volumes ao final.
- O seed de acessibilidade apaga e recria somente o banco descartável e exige
  simultaneamente `NODE_ENV=test` e `A11Y_SEED_ALLOWED=true`. Ele inclui
  empresa, usuário, catálogo NCM, regras, produtos, cliente e vendas com IDs e
  datas estáveis.
- A calculadora oficial foi substituída nesse ambiente por um servidor HTTP
  local determinístico. A suíte não consulta a RFB nem a demo pública para
  aprovar merge.
- O limite de autenticação é configurável no ambiente de teste para que a
  matriz completa não seja afetada por rate limiting, sem mudar o padrão de
  produção.
- O comando local oficial é `./scripts/a11y-test.sh`. O CI preserva a stack
  somente até coletar logs em caso de erro; o passo final sempre remove
  containers, rede e volumes.

### Allowlist e auditoria manual

- A allowlist está vazia. Não há exclusão global de regra, rota, seletor ou
  subtree.
- A estrutura aceita somente exceção exata por regra, rota, projeto e alvo,
  acompanhada de justificativa e data de expiração. Entradas vencidas deixam de
  ser aceitas pelo gate.
- O processo de nova auditoria manual foi documentado em
  `docs/runbooks/accessibility-regression-tests.md`: deve ocorrer ao concluir
  o baseline e após mudanças relevantes em componentes compartilhados, usando
  teclado em Chromium/Firefox, NVDA com Chromium, desktop/móvel e zoom
  200%/checagem dirigida em 400%. Essa recorrência é um processo humano, não uma
  automação criada nesta rodada.

### Ajustes encontrados pelo novo baseline

- A execução real do axe revelou contrastes insuficientes em textos auxiliares,
  erros de autenticação e estados de hover. Os tokens afetados foram elevados,
  links de autenticação receberam sublinhado persistente e ações de venda
  preservam contraste no hover.
- O gráfico de composição, que é visualmente redundante com sua alternativa
  textual, deixou de expor foco interno; tabelas horizontalmente roláveis
  passaram a aceitar teclado e nome acessível.
- As animações de entrada de KPIs, gráficos e operações recentes foram removidas
  do dashboard. Além de evitar contraste intermediário durante fades, isso
  garante conteúdo estável desde o primeiro frame e reforça o requisito de
  redução de movimento.
- O Vitest ganhou configuração própria para não coletar os arquivos Playwright;
  os dois runners permanecem independentes.

### Arquivos alterados

- Infraestrutura e CI: `.github/workflows/ci.yml`, `.gitignore`,
  `docker-compose.a11y.yml`, `scripts/a11y-test.sh`.
- Ambiente de teste: `apps/api/prisma/seed-a11y.ts`,
  `apps/api/test/a11y/mock-tax-calculator.mjs`,
  `apps/api/src/modules/auth/auth.routes.ts`.
- Runner Web: `apps/web/package.json`, `apps/web/pnpm-lock.yaml`,
  `apps/web/playwright.a11y.config.ts`, `apps/web/vitest.config.mts` e
  `apps/web/tests/accessibility/*`.
- Correções confirmadas pelo baseline: estilos/páginas de autenticação e vendas,
  `apps/web/src/components/ui/table.tsx` e componentes do dashboard
  (`kpi-card`, `tax-bar-chart`, `tax-donut-chart` e
  `recent-operations-table`).
- Processo: `docs/runbooks/accessibility-regression-tests.md` e este log.

### Validação

- Matriz Playwright/axe: **24 cenários executáveis aprovados** nos projetos
  desktop e móvel; **2 skips condicionais esperados** (drawer não se aplica ao
  desktop e sidebar recolhível não se aplica ao móvel). Todos os fluxos foram
  executados sem allowlist e sem violação séria/crítica remanescente.
- API Vitest: **25 arquivos e 101 testes aprovados**.
- Web Vitest: **5 arquivos e 23 testes aprovados**; a pasta Playwright é
  explicitamente excluída desse runner.
- TypeScript API e Web: aprovados com `--noEmit --incremental false`.
