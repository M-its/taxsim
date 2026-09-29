# Auditoria WCAG 2.2 AA — fluxos prioritários

Data: 23 de setembro de 2026
Escopo: login, cadastro, simulação, produtos, clientes e vendas
Método: inspeção estática do código React/Next.js e dos componentes compartilhados
Implementação de correções: fora do escopo desta rodada

## Limitações

Este levantamento identifica problemas comprováveis no código. Ele não substitui
uma auditoria dinâmica com navegador, teclado, leitor de tela, zoom de 200%/400%
e medição de contraste. Comportamentos fornecidos por Base UI, como retenção e
restauração de foco em dialogs, precisam ser confirmados manualmente no fluxo
renderizado antes de uma declaração de conformidade.

## Resumo executivo

- Achados sérios: 13
- Achados moderados: 11
- Achados críticos: 0
- Pontos positivos confirmados: dialogs e selects usam primitivos Base UI;
  botões compactos de editar/excluir possuem texto `sr-only`; status de vendas
  inclui texto visível; os fluxos auditados não possuem gráficos sem alternativa
  textual.

## Achados transversais

### WCAG-COM-01 — Mesmo título de documento em todas as rotas

- Severidade: sério
- Critério: 2.4.2 — Page Titled (A)
- Local: `apps/web/src/app/layout.tsx:16-19`; ausência de metadata específica
  nas seis páginas auditadas
- Descrição: login, cadastro, simulação, produtos, clientes e vendas herdam
  “TaxSim — Simulação da Reforma Tributária”. O título não identifica a tela
  atual para usuários de leitor de tela ou de múltiplas abas.

### WCAG-COM-02 — Não existe mecanismo para pular a navegação repetida

- Severidade: sério
- Critério: 2.4.1 — Bypass Blocks (A)
- Local: `apps/web/src/components/layout/dashboard-shell.tsx:23-29`
- Descrição: as páginas autenticadas possuem header e sidebar antes do conteúdo,
  mas não oferecem “Pular para o conteúdo” nem um destino identificável no
  `main`.

### WCAG-COM-03 — Links perdem o nome acessível quando a sidebar é recolhida

- Severidade: sério
- Critérios: 1.3.1 — Info and Relationships (A); 4.1.2 — Name, Role, Value (A)
- Local: `apps/web/src/components/layout/sidebar.tsx:104-128` e
  `apps/web/src/components/layout/sidebar.tsx:136-157`
- Descrição: ao recolher a sidebar no desktop, o texto de cada link deixa de ser
  renderizado e resta apenas o SVG. Os links não têm `aria-label`, portanto
  Dashboard, Produtos, Clientes, Vendas, Simulação e Configurações ficam sem
  nome acessível.

### WCAG-COM-04 — Drawer móvel não gerencia a ordem de foco

- Severidade: sério
- Critérios: 2.1.1 — Keyboard (A); 2.4.3 — Focus Order (A)
- Local: `apps/web/src/components/layout/dashboard-shell.tsx:23-29` e
  `apps/web/src/components/layout/sidebar.tsx:37-44`
- Descrição: a sidebar móvel é apenas um `aside` fixo sobre a página. Não há
  backdrop modal, contenção de foco, deslocamento inicial do foco nem
  restauração explícita ao botão que abriu o menu. O conteúdo atrás do drawer
  continua na sequência de Tab.

### WCAG-COM-05 — Movimento não respeita a preferência do usuário

- Severidade: moderado
- Referência: 2.3.3 — Animation from Interactions (AAA, fora do nível AA) e
  requisito explícito do roadmap
- Local: `apps/web/src/components/layout/sidebar.tsx:57-64`;
  `apps/web/src/components/onboarding/taxsim-tour.tsx:187-203`; páginas de
  produtos, clientes e vendas; componentes de simulação
- Descrição: Framer Motion, Driver.js, transições e skeletons animados são
  executados sem consultar `prefers-reduced-motion`. Não foi observada
  cintilação que configure falha de 2.3.1, mas o requisito de movimento reduzido
  do roadmap não está atendido.

## Login

### WCAG-LOGIN-01 — Landmark principal e heading principal ausentes

- Severidade: moderado
- Critérios: 1.3.1 — Info and Relationships (A); 2.4.6 — Headings and Labels
  (AA)
- Local: `apps/web/src/app/(auth)/login/page.tsx:62-128`;
  `apps/web/src/components/ui/card.tsx:27-34`
- Descrição: a tela usa uma `div` como contêiner e “Entrar no TaxSim” é um
  `h3`. Não há `main` nem `h1`.

### WCAG-LOGIN-02 — Erro não é anunciado nem associado aos campos

- Severidade: sério
- Critérios: 3.3.1 — Error Identification (A); 3.3.3 — Error Suggestion (AA);
  4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(auth)/login/page.tsx:42-56` e
  `apps/web/src/app/(auth)/login/page.tsx:73-107`
- Descrição: o erro aparece visualmente antes dos campos, mas não usa
  `role="alert"`/`aria-live`, não possui id e os inputs não recebem
  `aria-invalid` ou `aria-describedby`. O foco também não é levado ao erro
  ou ao primeiro campo inválido.

### WCAG-LOGIN-03 — Estado de autenticação em andamento não é anunciado

- Severidade: moderado
- Critério: 4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(auth)/login/page.tsx:111-117`
- Descrição: “Entrar” muda para “Entrando...” e o botão é desabilitado, mas não
  existe região de status ou `aria-busy`.

## Cadastro

### WCAG-REGISTER-01 — Landmark principal e heading principal ausentes

- Severidade: moderado
- Critérios: 1.3.1 — Info and Relationships (A); 2.4.6 — Headings and Labels
  (AA)
- Local: `apps/web/src/app/(auth)/register/page.tsx:114-285`;
  `apps/web/src/components/ui/card.tsx:27-34`
- Descrição: a tela não possui `main`; “Criar conta no TaxSim” é `h3`, sem
  `h1`.

### WCAG-REGISTER-02 — Validação retorna somente um erro global sem relação com o campo

- Severidade: sério
- Critérios: 1.3.1 — Info and Relationships (A); 3.3.1 — Error Identification
  (A); 3.3.3 — Error Suggestion (AA)
- Local: `apps/web/src/app/(auth)/register/page.tsx:64-83` e
  `apps/web/src/app/(auth)/register/page.tsx:125-264`
- Descrição: a validação interrompe no primeiro erro e mostra uma mensagem
  global. Nenhum campo recebe `aria-invalid` ou referência à mensagem; o foco
  permanece no botão de envio.

### WCAG-REGISTER-03 — Erros e estado de envio não são anunciados

- Severidade: sério
- Critério: 4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(auth)/register/page.tsx:125-129` e
  `apps/web/src/app/(auth)/register/page.tsx:267-274`
- Descrição: o erro e a troca para “Criando conta...” são mudanças visuais sem
  live region ou `aria-busy`.

## Simulação

### WCAG-SIM-01 — Erros dos itens não são associados aos respectivos controles

- Severidade: sério
- Critérios: 1.3.1 — Info and Relationships (A); 3.3.1 — Error Identification
  (A); 3.3.3 — Error Suggestion (AA)
- Local: `apps/web/src/components/simulation/simulation-form.tsx:390-459`
- Descrição: NCM, preço e quantidade não recebem `aria-invalid` nem
  `aria-describedby`. As mensagens são agrupadas no fim do item, sem indicar
  programaticamente qual campo falhou.

### WCAG-SIM-02 — Busca de produto não possui nome/semântica de autocomplete

- Severidade: sério
- Critérios: 1.3.1 — Info and Relationships (A); 3.3.2 — Labels or
  Instructions (A); 4.1.2 — Name, Role, Value (A)
- Local: `apps/web/src/components/simulation/simulation-form.tsx:101-160` e
  `apps/web/src/components/simulation/simulation-form.tsx:374-385`
- Descrição: o `Label` “Produto” não aponta para o input interno. O placeholder
  é o único texto identificador. A lista dinâmica não implementa
  `combobox`/`listbox`, `aria-expanded`, `aria-controls` ou navegação por
  setas.

### WCAG-SIM-03 — Resultados, erros e carregamentos não são anunciados

- Severidade: sério
- Critério: 4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(dashboard)/simulation/page.tsx:11-12`,
  `apps/web/src/app/(dashboard)/simulation/page.tsx:115-129` e
  `apps/web/src/components/simulation/simulation-form.tsx:266-277`
- Descrição: skeletons, erro da API e aparecimento do comparativo não têm
  `role="status"`, `role="alert"`, `aria-live` ou `aria-busy`.

### WCAG-SIM-04 — Estado do seletor de modo não é exposto

- Severidade: moderado
- Critério: 4.1.2 — Name, Role, Value (A)
- Local: `apps/web/src/components/simulation/simulation-form.tsx:328-358`
- Descrição: “Produto do catálogo” e “NCM manual” funcionam como seleção
  exclusiva, mas são botões comuns. O item selecionado é indicado por estilo,
  sem `aria-pressed` ou semântica de tabs/radiogroup.

### WCAG-SIM-05 — Hierarquia salta de h1 para h3

- Severidade: moderado
- Critérios: 1.3.1 — Info and Relationships (A); 2.4.6 — Headings and Labels
  (AA)
- Local: `apps/web/src/app/(dashboard)/simulation/page.tsx:102` e
  `apps/web/src/components/simulation/simulation-form.tsx:297`
- Descrição: “Parâmetros de Simulação” inicia em `h3` sem `h2` anterior.

## Produtos

### WCAG-PRODUCTS-01 — Erros de formulário não são programaticamente associados

- Severidade: sério
- Critérios: 1.3.1 — Info and Relationships (A); 3.3.1 — Error Identification
  (A); 3.3.3 — Error Suggestion (AA)
- Local: `apps/web/src/app/(dashboard)/products/page.tsx:295-364`
- Descrição: o variant visual vermelho não define `aria-invalid`; mensagens
  não têm id e inputs não usam `aria-describedby`. O erro da API também não é
  anunciado.

### WCAG-PRODUCTS-02 — Autocomplete de NCM não tem label ou semântica de combobox

- Severidade: sério
- Critérios: 3.3.2 — Labels or Instructions (A); 4.1.2 — Name, Role, Value (A)
- Local: `apps/web/src/app/(dashboard)/products/page.tsx:113-153` e
  `apps/web/src/app/(dashboard)/products/page.tsx:330-348`
- Descrição: o label aponta para `ncmCode`, mas o input interno não possui esse
  id. Resultados e carregamento não são anunciados e não há semântica de
  autocomplete/listbox nem navegação por setas.

### WCAG-PRODUCTS-03 — Lista e operações assíncronas não são anunciadas

- Severidade: moderado
- Critério: 4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(dashboard)/products/page.tsx:558-584` e
  `apps/web/src/app/(dashboard)/products/page.tsx:638-655`
- Descrição: erro de listagem, skeleton, exclusão e confirmação temporária
  alteram a interface sem live region. “Confirmar?” também não identifica no
  nome acessível qual produto será excluído.

## Clientes

### WCAG-CUSTOMERS-01 — Erros de formulário não são programaticamente associados

- Severidade: sério
- Critérios: 1.3.1 — Info and Relationships (A); 3.3.1 — Error Identification
  (A); 3.3.3 — Error Suggestion (AA)
- Local: `apps/web/src/app/(dashboard)/customers/page.tsx:168-224`
- Descrição: inputs inválidos recebem somente aparência vermelha. Não há
  `aria-invalid`, `aria-describedby`, ids nas mensagens ou anúncio do erro
  da API.

### WCAG-CUSTOMERS-02 — Lista e operações assíncronas não são anunciadas

- Severidade: moderado
- Critério: 4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(dashboard)/customers/page.tsx:417-439` e
  `apps/web/src/app/(dashboard)/customers/page.tsx:483-500`
- Descrição: carregamento, falha, salvamento, exclusão e confirmação temporária
  não são comunicados por live region. “Confirmar?” não inclui o cliente no
  nome acessível.

## Vendas

### WCAG-SALES-01 — Filtro de status não possui label persistente

- Severidade: moderado
- Critérios: 3.3.2 — Labels or Instructions (A); 4.1.2 — Name, Role, Value (A)
- Local: `apps/web/src/app/(dashboard)/sales/page.tsx:429-445`
- Descrição: o select possui apenas o placeholder “Filtrar por status”. Não há
  label visível ou nome explícito associado ao trigger.

### WCAG-SALES-02 — Carregamento, erros e conclusão de ações não são anunciados

- Severidade: sério
- Critério: 4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(dashboard)/sales/page.tsx:307-402` e
  `apps/web/src/app/(dashboard)/sales/page.tsx:448-478`
- Descrição: carregar a lista, abrir detalhes, confirmar ou cancelar uma venda
  altera estados e mensagens sem `aria-live`, `role="status"`,
  `role="alert"` ou `aria-busy`.

### WCAG-SALES-03 — Confirmação temporizada de cancelamento não fornece contexto

- Severidade: moderado
- Critérios: 2.4.6 — Headings and Labels (AA); 4.1.3 — Status Messages (AA)
- Local: `apps/web/src/app/(dashboard)/sales/page.tsx:372-386` e
  `apps/web/src/app/(dashboard)/sales/page.tsx:542-560`
- Descrição: o texto muda de “Cancelar” para “Confirmar?” por dois segundos sem
  anúncio. Há vários botões homônimos na tabela e o nome não inclui a operação
  ou cliente correspondente.

## Verificações sem falha estática confirmada

- Botões de ícone: editar/excluir em produtos e clientes possuem texto
  `sr-only`; menu, usuário, sidebar e tour possuem `aria-label`.
- Status por cor: badges de venda incluem “Rascunho”, “Confirmada” ou
  “Cancelada”; NCM inválido inclui o texto “inválido”; os valores da simulação
  possuem rótulos textuais. Não foi encontrado status fiscal comunicado
  exclusivamente por cor nos seis fluxos.
- Gráficos: não há gráficos nos seis fluxos auditados. Os gráficos do dashboard
  estão fora do escopo solicitado e devem ser auditados separadamente.
- Dialogs, selects e dropdown: usam Base UI, que fornece a base semântica e de
  teclado. Retenção/restauração de foco, Escape, setas e leitura dos nomes devem
  ser validados no navegador antes de marcar o checklist como conforme.
- Foco visível: Button, Input e Select possuem estilos `focus-visible`. Links,
  botões HTML dos resultados de busca, sidebar e controles do Driver.js ainda
  precisam de inspeção visual em navegador para confirmar contraste e
  persistência do indicador.

## Prioridade sugerida para a rodada de correção

1. Nome acessível da sidebar recolhida e skip link.
2. Associação/anúncio de erros em todos os formulários.
3. Semântica e teclado dos autocompletes de produto e NCM.
4. Títulos por rota e landmarks/headings de autenticação.
5. Live regions para carregamentos, resultados e operações.
6. Drawer móvel e validação manual de foco dos overlays.
7. Movimento reduzido e ajustes moderados restantes.
