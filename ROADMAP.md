# TaxSim — Roadmap geral

Este documento organiza features, correções e melhorias transversais do TaxSim por prioridade. O roadmap de Split Payment continua detalhado em [`SPLIT_PAYMENT_ROADMAP.md`](./SPLIT_PAYMENT_ROADMAP.md); aqui ele aparece apenas como uma trilha dependente de serviços externos.

## Critério de prioridade

- **P0 — Correção imediata:** risco de segurança, isolamento de tenant, perda de dados ou cálculo fiscal incorreto.
- **P1 — Próxima entrega:** confiabilidade do fluxo principal, acessibilidade essencial e controles anteriores à exposição pública.
- **P2 — Evolução:** descoberta pública e melhorias que não bloqueiam o fluxo fiscal principal.
- **P3 — Futuro ou dependência externa:** contratos, infraestrutura ou regulamentação ainda indisponíveis.

Dentro de cada prioridade, os itens estão na ordem recomendada. Um novo risco de segurança ou correção fiscal pode interromper essa ordem.

## P0 — Correção e segurança

### 1. Validar em runtime a resposta da calculadora da RFB

- [x] Criar schema explícito para a resposta externa.
- [x] Rejeitar respostas incompatíveis antes do merge fiscal.
- [x] Registrar erro sem expor payload fiscal sensível.
- [x] Testar mudanças de contrato e respostas malformadas.

### 2. Armazenar refresh tokens de forma não reversível

- [x] Definir estratégia de hash e lookup.
- [x] Migrar sessões existentes ou revogá-las explicitamente.
- [x] Ajustar rotação, logout e testes.

### 3. Corrigir elegibilidade e diagnóstico de NCM na simulação

- [x] Distinguir NCM existente no catálogo de NCM com regra fiscal ativa para o regime selecionado.
- [x] Auditar e migrar regras seed obsoletas que não existem na tabela NCM vigente ou na calculadora, começando por 85171200.
- [x] Validar todos os itens antes de chamar a calculadora da RFB.
- [x] Retornar código de erro estável com índice do item e NCM que bloqueou a simulação.
- [x] Não converter ausência de regra fiscal em “calculadora indisponível”.
- [x] Cobrir simulações com itens válidos e inválidos misturados.

### 4. Fechar a exposição residual da API em produção

- [ ] Confirmar que somente o Caddy é alcançável externamente.
- [ ] Remover publicações de porta desnecessárias do compose de produção.
- [ ] Documentar e testar firewall e Security List.
- [ ] Manter rate limiting no Fastify como defesa em profundidade.

## P1 — Confiabilidade e acessibilidade essencial

### 1. Cobrir o núcleo fiscal e o circuit breaker com testes

- [x] Testar aritmética, arredondamento e limites do Tax Engine.
- [x] Testar estados fechado, aberto e half-open do circuit breaker.
- [x] Testar timeout, recuperação e propagação de erros da calculadora oficial.

### 2. Melhorar seleção e diagnóstico de NCM na interface

- [ ] Implementar autocomplete de NCM no modo de preenchimento manual.
- [ ] Indicar se o NCM possui regra fiscal ativa para o regime da empresa.
- [ ] Destacar diretamente cada produto ou linha que bloqueia a simulação.
- [ ] Manter os itens preenchidos após o erro para permitir correção sem retrabalho.
- [ ] Testar catálogo, modo manual e mensagens com múltiplos itens.

### 3. Atualizar CNPJ alfanumérico

- [ ] Aceitar letras e números nos 12 primeiros caracteres e manter os dois verificadores numéricos.
- [ ] Atualizar máscara, normalização, schema Zod e mensagens.
- [ ] Cobrir CNPJs antigos e novos com testes.

**Contexto:** mudança vigente desde julho de 2026; deixou de ser apenas uma melhoria futura.

### 4. Estabelecer baseline WCAG 2.2 AA

- [ ] Adicionar “Pular para o conteúdo” e destino estável no `<main>`.
- [ ] Auditar landmarks, headings e títulos de página.
- [ ] Garantir nome acessível em botões de ícone e controles compactos.
- [ ] Associar erros e ajuda aos campos com `aria-describedby` e `aria-invalid`.
- [ ] Anunciar falhas, confirmações e carregamentos relevantes com `aria-live`, sem duplicidade.
- [ ] Garantir teclado em sidebar, menu, selects, dialogs e tour.
- [ ] Manter foco visível e restaurá-lo ao fechar overlays.
- [ ] Não comunicar status fiscal somente por cor.
- [ ] Oferecer alternativa textual aos gráficos.
- [ ] Respeitar `prefers-reduced-motion` em transições, gráficos e onboarding.

**Aceite:** login, cadastro, simulação, produtos, clientes e vendas podem ser concluídos por teclado e leitor de tela, sem violações críticas conhecidas.

### 5. Automatizar regressões de acessibilidade

- [ ] Adicionar axe aos fluxos prioritários.
- [ ] Testar teclado em menu, dialogs e simulação.
- [ ] Executar na CI sem substituir auditoria manual.
- [ ] Fazer violações críticas ou sérias novas bloquearem merge.

### 6. Impedir indexação de rotas privadas

- [ ] Definir `robots: { index: false, follow: false }` nos layouts de autenticação e dashboard.
- [ ] Criar `robots.ts` permitindo apenas superfícies públicas.
- [ ] Nunca incluir dashboard, configurações, clientes, vendas ou simulação autenticada no sitemap.
- [ ] Confirmar que metadados não revelam dados de tenant.

## P2 — Descoberta pública e evolução de UX

### 1. Criar landing page pública em `/`

- [ ] Substituir o redirecionamento para `/login` por uma página pública leve.
- [ ] Explicar proposta de valor, escopo de demonstração e ausência de vínculo com a RFB.
- [ ] Mostrar funcionalidades e arquitetura sem expor dados internos.
- [ ] Oferecer CTAs para demonstração, login e GitHub.
- [ ] Manter login e cadastro fora do índice.

**Dependência:** os próximos itens de SEO só geram valor depois que existe conteúdo público indexável.

### 2. Completar metadados e compartilhamento social

- [ ] Configurar `metadataBase` com origem confiável.
- [ ] Usar template de títulos e descrição específica para a landing.
- [ ] Adicionar canonical, application name, autor, creator e publisher.
- [ ] Configurar Open Graph com URL, locale, site name e imagem 1200 × 630 com texto alternativo.
- [ ] Configurar Twitter/X Card consistente.
- [ ] Manter `lang="pt-BR"`.
- [ ] Não adicionar `meta keywords`; conteúdo e metadados semânticos têm prioridade.

### 3. Adicionar superfícies técnicas de descoberta

- [ ] Criar `sitemap.ts` somente com páginas públicas canônicas.
- [ ] Criar manifest com nome, descrição, cores e ícones.
- [ ] Revisar favicon, Apple Touch Icon e `themeColor`.
- [ ] Adicionar JSON-LD `SoftwareApplication` ou `WebApplication` à landing.
- [ ] Validar robots, sitemap, canonical e dados estruturados publicados.

### 4. Definir metas de performance para SEO e acessibilidade

- [ ] Medir Core Web Vitals da landing e dos fluxos autenticados separadamente.
- [ ] Reservar dimensões de imagens e gráficos para evitar CLS.
- [ ] Priorizar Server Components na superfície pública.
- [ ] Evitar animações que atrasem conteúdo ou interação.
- [ ] Definir orçamento de JavaScript, imagens e fontes.
- [ ] Adicionar Lighthouse periódico após estabilizar a landing.

### 5. Validar NCM contra o catálogo vigente

- [ ] Validar NCM em criação e edição no backend.
- [ ] Criar endpoint batch ou join eficiente para evitar N+1.
- [ ] Mostrar aviso acessível quando o NCM não estiver vigente.
- [ ] Diferenciar formato inválido de código ausente no catálogo.

### 6. Refinar 404 e estados globais

- [ ] Usar design system no lugar de estilos inline.
- [ ] Oferecer retorno contextual para landing, login ou dashboard.
- [ ] Garantir título, heading e anúncio acessível nos erros globais.

## P3 — Split Payment e integrações externas

- [ ] Fase 1: emissão de NF-e e integração com a PSC.
- [ ] Fase 2: adapters para PSPs.
- [ ] Fase 3: webhooks, idempotência e conciliação.
- [ ] Fase 4: relatórios fiscais e exportações.

Detalhes permanecem em [`SPLIT_PAYMENT_ROADMAP.md`](./SPLIT_PAYMENT_ROADMAP.md).

## Itens existentes que devem ser preservados

- `lang="pt-BR"` no layout raiz.
- Título e descrição básicos via Metadata API.
- Estados `focus-visible` nos principais controles.
- Textos `sr-only` em parte das ações compactas.
- `aria-label` na navegação e no botão do tour.
- Comportamentos acessíveis dos primitivos Base UI/shadcn durante customizações.

## Definição de pronto para SEO e acessibilidade

1. Validado no fluxo real, não apenas isoladamente.
2. Teste automatizado quando o comportamento for estável e testável.
3. Funciona por teclado e não depende só de cor, hover ou animação.
4. Não expõe rotas ou dados privados a crawlers ou metadados.
5. Documentação relevante atualizada.
