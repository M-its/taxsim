# TaxSim — Roadmap geral

## Estado atual

Atualizado em **07/11/2026**. **Versão alvo: v1.0** — implementação integrada,
CI verde, Web implantado em 05/11 e fluxos principais aceitos pelo responsável
em 06/11. Limitações e detalhes não bloqueantes registrados; publicação formal
da tag/release `v1.0.0` e reconciliação das issues ainda aguardam autorização.

O [PR #18](https://github.com/M-its/taxsim/pull/18) foi integrado à `main` em
30/10, na revisão `4526eb1`; o CI pós-merge passou. O deploy foi exclusivamente
Web, com API, banco e Caddy preservados. Não confundir implantação/aceite da
aplicação com criação de tag ou publicação de release, ainda não realizadas.
Esta atualização é documental: não corrige código, altera configuração remota
ou encerra issues. Os dois diffs preexistentes continuam preservados e separados.

### Checklist de release, em ordem

1. **Fechar conteúdo — concluído e revisado.** Sessão, landing, descoberta,
   polimento e correções integrados. Performance encerrada como **medido**, sem
   alegar metas móveis cumpridas. Arquivo privado verificado antes da retirada
   de material pessoal do índice; não repetir remoções ou recópias.
2. **CI — aprovado no PR e na `main`; checks agora obrigatórios.** Em 07/11,
   após autorização, a proteção da `main` passou a exigir os três checks atuais
   do GitHub Actions (API, Web e acessibilidade), com branch atualizada e aplicação
   inclusive a administradores. O PR temporário #19, sem mudanças de arquivos ou
   checks executados, ficou bloqueado apesar de não ter conflitos; foi fechado
   sem merge e sua branch removida. Nenhuma aprovação de segunda pessoa foi
   imposta. A `main` permaneceu no mesmo SHA. #6 pode ser proposta para fechamento,
   mas nenhuma issue foi alterada.
3. **Integrar na main — concluído em 30/10.** PR #18 revisado pelo responsável,
   merge autorizado e CI pós-merge aprovado na revisão `4526eb1`.
4. **Preparação do servidor — concluída e renovada na janela de 05/11.**
   Procedência das imagens confirmada por registros BuildKit/digests e hashes;
   preflight somente leitura sem bloqueios conhecidos, pepper presente,
   backup novo com checksum/leitura e restauração isolada aprovados. Imagem Web
   de retorno preservada e override privado validado. Cópia externa conferida.
   [Runbook](./docs/runbooks/release-deploy-rollback.md). Evidências operacionais
   e dados de backup permanecem privados.
5. **Deploy — concluído em 05/11, somente Web (`app`).** Build e troca exclusivos
   do Web; sem migration, seed ou alteração de configuração produtiva. API,
   banco e Caddy mantiveram IDs, imagens e horários de início. Web saudável.
6. **Smoke test — concluído no escopo dirigido.** Em 05/11, 44 verificações
   públicas, redirect HTTPS e sete verificações de portas da origem autorizada
   aprovados. Em 06/11, responsável confirmou login, sessão/logout, dashboard,
   cálculo com `85171300`, bloqueio de `85171200` e preview social. Não se afirma
   nova auditoria completa, teste de todas as mutações ou teste autenticado
   direto do 422: o código obsoleto foi barrado na UI. Não foram repetidos testes
   de firewall de outra origem/IPv6 nesta janela.
7. **Tag/notas/issues — formalização pendente.** Notas finalizadas para revisão,
   ainda não publicadas; proposta de reconciliação preparada sem alterar issues.
   Revisar/integrar esta documentação e autorizar separadamente a tag `v1.0.0`,
   a release e os fechamentos exatos. Distinguir o SHA de código implantado de
   eventual commit posterior exclusivamente documental.

### Detalhes aceitos como não bloqueantes em 07/11

- **NCM manual:** diagnóstico e validação podem repetir “NCM não encontrado no
  catálogo.” em duas mensagens próximas. O bloqueio funciona; consolidar a
  apresentação mantendo associação ao campo/resumo em manutenção futura.
- **Catálogo:** `85171200` não consta da base versionada e é apresentado como
  não encontrado. Não inventar histórico para classificá-lo como expirado.
- **Preview social:** aparência correta aceita pelo responsável. Avisos de
  descrição/meta description longa ficam para acabamento. “Image is missing
  conversion text” permanece aviso a esclarecer, sem atribuir significado não
  comprovado; `og:image:alt` foi confirmado presente.

Estes detalhes foram aceitos explicitamente. A pendência distinta de proteção da
`main` foi resolvida depois por autorização específica em 07/11, sem mudança no
código do produto. Nenhuma correção funcional desses detalhes foi realizada.

### Validação local mais recente

Em **22/10/2026**, depois do commit do ajuste do runner: **106 testes E2E
aprovados, dois skips condicionais de viewport, zero falhas**, sem retries;
**115 testes API e 55 Web**, ambos os typechecks e lint aprovados. O lint mantém
zero erros e dois warnings conhecidos. Builds produtivos e 40 cenários de
descoberta/landing/autenticação passaram na rodada anterior de correção do foco;
não foram reexecutados só por mudanças posteriores no ambiente de testes.

O runner descartável usa init e memória compartilhada ampliada, sem compartilhar
IPC com o host. Não houve novo crash nem acúmulo de processos zumbis na execução
final. A causa exata do SIGSEGV nativo anterior não foi comprovada: preservar a
evidência histórica, sem trocar testes ou tratar o resultado local como CI remoto.
Relatórios e dados operacionais completos permanecem privados.

### Fechamento implementado e limites aceitos

- CTAs públicos estáveis e restauração limitada a oito segundos, com recuperação
  manual; refresh não é repetido automaticamente. App conserva formulários.
- Hero com produto primeiro e exemplo versionado/sintético, header móvel,
  navegação por âncoras, foco e ícones TS. Pequenos ajustes no app sem redesign.
- P2 #3 implementado, conferido no domínio publicado e no smoke pós-deploy.
- P2 #4 encerrado como **medido**, não como otimizado nem metas móveis cumpridas.

### Performance — medido em laboratório

Em 14/10/2026, medianas de três execuções por página/perfil, ordem
**landing/login/dashboard**: **desktop 100/99/92; móvel simulado 86/82/59**.
**Metas móveis de LCP, TBT e pontuação não atingidas**: LCP 2,80/3,40/4,52 s;
TBT 409/352/1.408 ms. Metas mantidas: LCP ≤ 2,5 s, TBT ≤ 200 ms, pontuação
≥ 90 nas públicas e ≥ 80 no dashboard. CLS e transferências JS/fontes/imagens
ficaram dentro dos orçamentos da amostra. Não foi retido o experimento sem ganho
consistente; não houve refatoração ampla de gráficos/arquitetura.

Build standalone de produção, API/usuário/dados sintéticos, cache HTTP frio,
Lighthouse 12.8.2 e navegador fixo; móvel simulado 390 × 844, rede com RTT 150 ms,
CPU 4×; desktop 1440 × 900, RTT 40 ms, CPU 1×. São dados de laboratório local,
não Core Web Vitals de tráfego real, INP de usuários ou tempo do backend produtivo.

Comando a partir de `apps/web` (placeholders substituídos):
`node scripts/performance-audit.mjs --build=<BUILD_ISOLADO> --tools=<FERRAMENTAS> --output=<RELATORIOS_FORA_DO_CHECKOUT> --phase=before`.
Build isolado com `NEXT_PUBLIC_API_URL=http://localhost:3339`, dependências Web,
Chromium Playwright e Lighthouse externo preparados conforme README/ajuda do
script. Relatórios brutos ficam privados, fora do checkout, sem caminhos locais
ou de servidor nos documentos públicos.

**Três maiores oportunidades do relatório — backlog pós-v1.0:**

1. Perfilar scripting/hidratação na thread principal móvel, especialmente
   dashboard/Recharts, antes de escolher outra alteração.
2. Avaliar carregamento tardio de gráficos/tour com espaço reservado,
   alternativa textual e testes de regressão. Ganho ainda não comprovado.
3. Revisar preloads de fontes não usados no login; não alterados nem medidos
   isoladamente nesta rodada.

### Fora do escopo da v1.0

- P3: Split Payment operacional, NF-e/PSC, PSPs, conciliação e exportações.
- Atualização automática do catálogo NCM, métricas reais/monitoramento periódico.
- Novo redesign amplo. As oportunidades móveis acima ficam pós-v1.0, sem reabrir
  o escopo de implementação deste fechamento.

### Diffs preexistentes preservados e fora do PR

Nenhum dos dois acréscimos locais será incluído no pacote de diff do PR desta
rodada. Não foram descartados, editados ou adicionados ao staging. Excluir seus
diffs não remove os arquivos já versionados nem seu histórico; uma decisão futura
de descarte, publicação ou retirada do índice exige aprovação separada.

- **pnpm-lock.yaml:** 94 linhas acrescentam um documento YAML de resolução do
  próprio `pnpm`/`@pnpm/exe` 10.17.1 e binários por plataforma, antes do documento
  original intacto. Compatível com gestão automática de
  `devEngines.packageManager`; não há registro suficiente para atribuir a um
  comando específico. Não muda as dependências das apps. Proposta: descartar
  apenas esse acréscimo após aprovação; se desejado como tooling, avaliar em
  commit próprio. Mantido nesta rodada.
- **SPLIT_PAYMENT_ROADMAP.md:** acréscimo local de notas de pesquisa, com nomes
  de fontes sem links e afirmações regulatórias não verificadas nesta rodada.
  O arquivo completo é rascunho, não backlog fiscal validado. Não editado nem
  commitado. Proposta: manter a pesquisa privada e usar a seção P3 abaixo como
  backlog público; decidir depois, com aprovação, se o arquivo sai do índice ou
  vira um resumo sem afirmações legais. P3 é a referência vigente deste ROADMAP.

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

- [x] Confirmar que somente o Caddy é alcançável externamente.
- [x] Remover publicações de porta desnecessárias do compose de produção.
- [x] Documentar firewall, Security List, troca de IP administrativo e rollback.
- [x] Executar a verificação externa a partir de origens SSH autorizada e não autorizada.
- [x] Manter rate limiting no Fastify como defesa em profundidade.

**Evidência (24/09/2026):** 7 verificações externas aprovadas. Caddy em
`80/443` aberto; Next.js `3000`, Fastify `3333` e calculadora `8080/8081`
fechados no IP público da aplicação. SSH alcançável da origem autorizada e
recusado da origem não autorizada. A VM da calculadora permanece sem IP
público; sua remoção foi a correção efetiva da exposição, documentada no
[runbook OCI](./docs/runbooks/oci-firewall.md).

## P1 — Confiabilidade e acessibilidade essencial

### 1. Cobrir o núcleo fiscal e o circuit breaker com testes

- [x] Testar aritmética, arredondamento e limites do Tax Engine.
- [x] Testar estados fechado, aberto e half-open do circuit breaker.
- [x] Testar timeout, recuperação e propagação de erros da calculadora oficial.

### 2. Melhorar seleção e diagnóstico de NCM na interface

- [x] Implementar autocomplete de NCM no modo de preenchimento manual.
- [x] Indicar se o NCM possui regra fiscal ativa para o regime da empresa.
- [x] Destacar diretamente cada produto ou linha que bloqueia a simulação.
- [x] Manter os itens preenchidos após o erro para permitir correção sem retrabalho.
- [x] Testar catálogo, modo manual e mensagens com múltiplos itens.

### 3. Atualizar CNPJ alfanumérico

- [x] Aceitar letras e números nos 12 primeiros caracteres e manter os dois verificadores numéricos.
- [x] Atualizar máscara, normalização, schema Zod e mensagens.
- [x] Cobrir CNPJs antigos e novos com testes.

**Contexto:** mudança vigente desde julho de 2026; deixou de ser apenas uma melhoria futura.

### 4. Estabelecer baseline WCAG 2.2 AA

- [x] Adicionar “Pular para o conteúdo” e destino estável no `<main>`.
- [x] Auditar landmarks, headings e títulos de página.
- [x] Garantir nome acessível em botões de ícone e controles compactos.
- [x] Associar erros e ajuda aos campos com `aria-describedby` e `aria-invalid`.
- [x] Anunciar falhas, confirmações e carregamentos relevantes com `aria-live`, sem duplicidade.
- [x] Garantir teclado em sidebar, menu, selects, dialogs e tour.
- [x] Manter foco visível e restaurá-lo ao fechar overlays.
- [x] Não comunicar status fiscal somente por cor.
- [x] Oferecer alternativa textual aos gráficos.
- [x] Respeitar `prefers-reduced-motion` em transições, gráficos e onboarding.

**Validação manual concluída (aceite informado pelo responsável):** teclado em Firefox,
NVDA com Chromium, zoom a 200% e checagem dirigida a 400%.
Tooltips nativos de editar/excluir adicionados a Produtos e Clientes.

**Aceite:** login, cadastro, simulação, produtos, clientes e vendas podem ser concluídos por teclado e leitor de tela, sem violações críticas conhecidas.

### 5. Automatizar regressões de acessibilidade

- [x] Adicionar axe aos fluxos prioritários.
- [x] Testar teclado em menu, dialogs e simulação.
- [x] Executar na CI sem substituir auditoria manual.
- [x] Fazer violações críticas ou sérias novas falharem no job da CI.
- [x] Exigir os checks na proteção/regras da `main` para bloquear merge.

Proteção configurada e consultada novamente em 07/11 após autorização. Checks
vinculados ao GitHub Actions e aplicados a administradores; PR #19 bloqueado por
checks ausentes, sem tentativa de merge. Issue #6 ainda aberta, aguardando somente
autorização de reconciliação; configuração não fecha issues automaticamente.

### 6. Impedir indexação de rotas privadas

- [x] Definir `robots: { index: false, follow: false }` nos layouts de autenticação e dashboard.
- [x] Criar `robots.ts` permitindo apenas superfícies públicas.
- [x] Nunca incluir dashboard, configurações, clientes, vendas ou simulação autenticada no sitemap.
- [x] Confirmar que metadados não revelam dados de tenant.

## P2 — Descoberta pública e evolução de UX

### 1. Criar landing page pública em `/`

- [x] Substituir o redirecionamento para `/login` por uma página pública leve.
- [x] Explicar proposta de valor, escopo de demonstração e ausência de vínculo com a RFB.
- [x] Mostrar funcionalidades e arquitetura sem expor dados internos.
- [x] Oferecer CTAs para demonstração, login e dashboard autenticado.
- [x] Manter login e cadastro fora do índice.

**Dependência:** os próximos itens de SEO só geram valor depois que existe conteúdo público indexável.

### 2. Completar metadados e compartilhamento social

- [x] Configurar `metadataBase` com origem confiável.
- [x] Usar template de títulos e descrição específica para a landing.
- [x] Adicionar canonical, application name, autor, creator e publisher.
- [x] Configurar Open Graph com URL, locale, site name e imagem 1200 × 630 com texto alternativo.
- [x] Configurar Twitter/X Card consistente.
- [x] Manter `lang="pt-BR"`.
- [x] Não adicionar `meta keywords`; conteúdo e metadados semânticos têm prioridade.

### 3. Adicionar superfícies técnicas de descoberta

- [x] Criar `sitemap.ts` somente com a landing pública canônica.
- [x] Criar manifest informativo com nome, descrição, cores e ícones (sem PWA offline).
- [x] Revisar favicon, Apple Touch Icon e `themeColor` com monograma TS aprovado.
- [x] Adicionar JSON-LD `WebApplication` à landing.
- [x] Validar robots, sitemap, canonical e dados estruturados por HTTP de build local de produção.
- [x] Confirmar os mesmos metadados na revisão publicada após deploy.

### 4. Performance de laboratório — medido

- [x] Medir landing, login e dashboard preenchido em build de produção isolado.
- [x] Definir orçamentos: JS transferido ≤ 180 kB públicas/400 kB dashboard;
  fontes ≤ 150 kB; imagens iniciais ≤ 300 kB; imagem principal ≤ 150 kB quando
  aplicável (sem imagem principal nesta amostra). Limites de métricas no Estado atual.
- [x] Registrar CLS e transferência, preservar renderização pública com componentes
  de servidor e descartar experimento sem melhora consistente.
- [x] Documentar método, comando reproduzível e resultados sem alegar dados reais.
- [ ] Pós-v1.0: reduzir LCP/TBT móveis e atingir as metas de pontuação, seguindo
  as três oportunidades do Estado atual. Não bloqueante para este escopo aceito.

Não há gate Lighthouse nem execução periódica nesta v1.0. Monitoramento real e
INP de campo estão fora do escopo; medições de laboratório não os substituem.

### 5. Validar NCM contra o catálogo vigente

- [x] Validar NCM em criação e edição no backend.
- [x] Criar endpoint batch ou join eficiente para evitar N+1.
- [x] Mostrar aviso acessível quando o NCM não estiver vigente.
- [x] Diferenciar formato inválido de código ausente no catálogo.

### 6. Refinar 404 e estados globais

- [x] Usar design system no lugar de estilos inline.
- [x] Oferecer retorno contextual para landing, login ou dashboard.
- [x] Garantir título, heading e anúncio acessível nos erros globais.

## P3 — Split Payment e integrações externas

- [ ] Fase 1: emissão de NF-e e integração com a PSC.
- [ ] Fase 2: adapters para PSPs.
- [ ] Fase 3: webhooks, idempotência e conciliação.
- [ ] Fase 4: relatórios fiscais e exportações.

Esta seção é o backlog público vigente. O documento separado de pesquisa está
pendente de decisão de publicação, conforme os diffs locais acima; não usar suas
notas legais como contrato ou funcionalidade prometida.

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
