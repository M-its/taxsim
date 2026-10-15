# TaxSim — contexto de arquitetura

Estado do código em 15/10/2026. Este documento descreve o que existe, não uma
lista de intenções já implementadas. Escopo/release em [ROADMAP](../ROADMAP.md),
vitrine e limitações no [README](../README.md), integração nos
[contratos](./API_CONTRACTS.md). A v1.0 ainda depende de integração, CI e deploy.

## Produto e limites

Demonstração técnica multi-tenant de comparação tributária, em pt-BR. Não é
ERP, emissor de NF-e, processador de pagamentos ou ferramenta de apuração
fiscal. A integração com software disponibilizado pela RFB não implica vínculo,
certificação ou precisão universal. O catálogo é um snapshot manual; as regras
didáticas cobrem apenas um subconjunto de NCMs e operações.

## Componentes efetivos

- Web: Next.js 15.5, React 19, App Router, Tailwind v4, Base UI/shadcn,
  Recharts, Framer Motion e driver.js. Landing renderizada com componentes de
  servidor e ilhas interativas; telas privadas usam hooks e API REST no
  navegador. Não há adoção de Server Actions nem PPR experimental.
- API: monólito modular Fastify/TypeScript; schemas Zod; Prisma/PostgreSQL 16;
  módulos de auth, empresa, produtos, clientes, vendas, NCM e dashboard.
  Não há especificação OpenAPI servida automaticamente.
- Infraestrutura: Caddy termina HTTPS e encaminha Web/API; somente 80/443 são
  publicados na stack de produção. Banco em rede Docker interna. Calculadora
  externa configurada na API, isolada do navegador. Implantação separa aplicação
  e calculadora por compatibilidade ARM/x86; nenhum endereço operacional precisa
  constar na documentação pública.
- Desenvolvimento usa compose próprio com calculadora local; produção usa
  `docker-compose.prod.yml` independente, não uma extensão implícita do compose
  de desenvolvimento. `NEXT_PUBLIC_API_URL` é resolvida no build do Web;
  `API_INTERNAL_URL` não é hoje um caminho de acesso a dados usado pela interface.

## Dados e isolamento

Banco/esquema compartilhados; `companyId` nas entidades de tenant. Colunas
Prisma usam camelCase; SQL raw deve respeitar aspas, como `"companyId"`.
Leituras e verificações de propriedade restringem tenant antes de mutações por
ID. Itens herdam a propriedade da venda pai. Não há RLS no PostgreSQL;
isolamento depende da aplicação e de testes, não só da concorrência do banco.

Preços/totais são `Decimal(12,2)`; alíquotas `Decimal(8,4)`; campos de retenção
têm precisão própria. UUIDs são gerados pelo banco. Snapshots de preço, NCM e
alíquotas são gravados ao criar a venda DRAFT, não somente ao confirmá-la;
edições futuras de produto não recalculam o histórico. Não equivale a garantia
de conformidade legal. Regras fiscais e catálogo NCM são globais.

## Cálculo e elegibilidade

1. Validar payload, existência/vigência dos NCMs e regra ACTIVE para o regime,
   em lote, antes de qualquer chamada fiscal.
2. Executar o motor atual, puro e sem Prisma, com valores decimais e regras
   fornecidas pelo orquestrador.
3. Aguardar a calculadora integrada para o modelo reformado. O fluxo efetivo é
   sequencial, não `Promise.all` entre motores.
4. Validar schema externo, finitude e sinal, correlação bijetiva `numero`/`nObj`
   e reconciliação de totais; somente então juntar resultados/snapshots.

Timeout e circuit breaker retornam indisponibilidade; não há fallback que
invente valores da reforma. Histórico persistido continua consultável sem a
calculadora. Datas de integração usam offset explícito. A simulação avulsa usa
localização didática fixa; vendas usam município/UF da empresa.

Cadastro de produto exige NCM existente/vigente, mas permite ausência de regra;
simulação revalida e bloqueia todos os itens inelegíveis. Edição de produto
revalida NCM quando o código muda. Status antecipado indisponível não declara
NCM inválido: o backend decide no envio. Pesquisa compartilhada por código e
descrição, sem fuzzy match. CNPJ é canônico sem máscara/em maiúsculas, com DV
numérico nos dois formatos; CPF permanece numérico.

Não existem sincronização automática NCM, catálogo jurídico universal,
workflow administrativo de aprovação fiscal ou determinação por CFOP/benefícios.
Estados DRAFT/ACTIVE/ARCHIVED no schema não implementam esses workflows.

## Autenticação e restauração

JWT de acesso em memória (15 min), refresh opaco HttpOnly (sete dias), HMAC com
pepper externo no banco e rotação atômica. Reuso revoga as sessões do usuário.
Logout comum revoga só o refresh apresentado; `/auth/logout/all` é separado.
JWT emitido não possui denylist. Cookie de produção: Secure, SameSite=None,
Path=/auth; motivo e limitações nos [contratos](./API_CONTRACTS.md#autenticação-e-cookie).
Sem token anti-CSRF dedicado; CORS explícito é necessário, não proteção universal.
Rate limiting Fastify em login/cadastro; segredos obrigatórios falham no startup.

`AuthProvider` limita restauração a oito segundos; após cerca de 2,5 s uma rota
protegida mostra esqueleto genérico. Falha técnica oferece retry manual e não
é prova de sessão inválida. Refresh não tem retry automático; uma leitura
transitória de `me()` pode repetir uma vez sem refresh indireto. Respostas
tardias não substituem sessão mais recente. Formulários permanecem montados
durante recuperação. Landing é pública mesmo com sessão: CTA principal estável,
dashboard secundário quando confirmado. Redirects autenticados são client-side;
cookie com Path restrito não é uma sessão disponível no middleware da landing.

## Interface, descoberta e qualidade

Identidade TS, neutros com acento verde, hierarquia legível e foco visível.
Landing tem exemplo versionado de notebook/NCM 84713012, 1 × R$ 1.000, Lucro
Real: motor atual real e resposta reformada sintética, claramente sinalizada.
Não há conta demo compartilhada, promessa de economia nem chamada à RFB na landing.
Manifest informativo, sem service worker/offline ou instalação PWA prometida.
Sitemap/OG/JSON-LD somente públicos; rotas privadas sem canonical/OG e noindex.

Erros inline com resumo e foco; gráficos com alternativa textual; movimento
reduzido respeitado. Confirmações inline não expiram por tempo. Vitest cobre
domínio, segurança e interface; Playwright/axe usa banco/calculadora descartáveis
nos seis fluxos, não produção. CI executa testes, typechecks, lint Web (erros
bloqueiam; avisos informam) e acessibilidade Chromium desktop/móvel. Proteção da
branch deve exigir os checks; presença do workflow sozinha não impede merge.
Firefox/NVDA/zoom continuam auditoria humana, sem alegar certificação WCAG.

Performance foi **medida**, não considerada resolvida: medianas Lighthouse de
landing/login/dashboard desktop 100/99/92 e móvel simulado 86/82/59. Metas móveis
de LCP, TBT e pontuação não atingidas; detalhes e backlog no README/ROADMAP.

## Fora da v1.0

Split Payment/NF-e/PSPs/webhooks/conciliação: apenas campos/modelos de fundação,
sem movimentação de dinheiro. Sem atualização automática de catálogo, métricas
reais de tráfego ou novo redesign amplo. Nunca tratar propostas futuras como
capacidade disponível. Histórico de decisões/estudo permanece privado; manter
aqui apenas contratos e decisões vigentes verificáveis.
