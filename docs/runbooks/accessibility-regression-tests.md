# Regressões automatizadas de acessibilidade

Este runbook define o gate automatizado de acessibilidade do TaxSim. Ele
complementa, mas não substitui, a auditoria manual com teclado, leitor de tela,
zoom e navegadores diferentes.

## Execução local

Pré-requisito: Docker com Compose.

```bash
./scripts/a11y-test.sh
```

O comando cria uma stack descartável, executa as migrações, aplica um seed
exclusivo de teste, inicia uma calculadora tributária simulada e roda o
Playwright. Ao terminar, a stack e seus volumes são removidos, inclusive em
caso de falha.

O seed destrutivo possui duas travas: somente executa com `NODE_ENV=test` e
`A11Y_SEED_ALLOWED=true`. Nunca aponte a composição de acessibilidade para um
banco compartilhado, de desenvolvimento ou de produção.

## Gate de pull request

O workflow `.github/workflows/ci.yml` executa a suíte em Chromium desktop e
em viewport móvel em todo pull request e push para `main`.

O merge é bloqueado quando:

- axe encontra qualquer violação de impacto `serious` ou `critical`;
- uma interação obrigatória por teclado falha, mesmo que o axe não a detecte;
- o ambiente determinístico não consegue preparar os dados ou concluir um
  cenário.

Não há consulta à demo pública nem à RFB real. A calculadora local responde de
forma determinística para evitar resultados flutuantes e dependências externas.

Relatórios HTML, traces e screenshots de falha são publicados como artefato
`accessibility-report` do workflow.

## Cobertura do baseline

- Login: estado inicial, erro e redirecionamento de sessão autenticada.
- Cadastro: formulário inicial e resumo/erros dos campos.
- Simulação: catálogo, NCM manual, múltiplos erros e resultado determinístico.
- Produtos: lista, busca, criação e edição em dialog.
- Clientes: lista, busca, criação e edição em dialog.
- Vendas: filtro, detalhes e ações de cancelar/confirmar.
- Compartilhados: sidebar expandida/recolhida, drawer móvel, retenção e
  restauração de foco, dialogs e ordem de tabulação.

Os testes ficam em `apps/web/tests/accessibility`; a configuração dos dois
projetos Chromium fica em `apps/web/playwright.a11y.config.ts`.

## Política de exceções

A allowlist está em `apps/web/tests/accessibility/allowlist.ts` e começa
vazia. Não são permitidas exclusões globais de regra, página ou subtree.

Uma exceção só pode ser adicionada quando contiver:

- identificador exato da regra axe;
- rota exata;
- projeto exato (desktop ou móvel);
- alvo exato reportado pelo axe;
- justificativa;
- data de expiração no formato ISO.

Exceções expiradas falham o teste. Toda inclusão exige revisão humana e deve
ter uma tarefa de remoção antes do prazo. Seletores passados ao axe para
ignorar conteúdo não são aceitos como alternativa à allowlist.

## Auditoria manual recorrente

Executar uma nova auditoria:

1. ao concluir este baseline;
2. após mudanças relevantes em navegação, shell, dialogs, formulários,
   autocompletes, componentes de foco, gráficos ou tokens visuais
   compartilhados;
3. antes de releases que alterem fluxos críticos, quando aplicável.

A matriz mínima é:

- teclado em Chromium e Firefox;
- NVDA com Chromium;
- desktop e viewport móvel;
- zoom em 200% e checagem dirigida em 400%.

Registrar em `docs/decisions-log.md` a data, versão/commit, rotas percorridas,
combinações efetivamente testadas, achados por severidade e pendências. A
automação em Chromium é executada a cada PR; Firefox, NVDA e a inspeção de zoom
permanecem verificações humanas periódicas.
