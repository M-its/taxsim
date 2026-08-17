# TaxSim — Simulador da Reforma Tributária Brasileira

> Projeto de portfólio demonstrando desenvolvimento full-stack de um SaaS fiscal multi-tenant, do zero à produção — incluindo debugging de infraestrutura real, auditoria de segurança e deploy com HTTPS gratuito.

**[Demo ao vivo](https://taxsim-web.duckdns.org)** · **[Autor](https://github.com/M-its)**

---

## O que é

TaxSim é um SaaS fiscal que permite empresas simularem e compararem o impacto financeiro da Reforma Tributária brasileira (LC 214/2025) — substituição do modelo atual (PIS/COFINS/ICMS/ISS) pelo IVA Dual (IBS/CBS/Imposto Seletivo).

A calculadora de tributos integrada é a **calculadora oficial da Receita Federal do Brasil** (uso público), garantindo que os cálculos do modelo reformado sejam tecnicamente precisos.

Este projeto foi construído sozinho, do design de banco ao deploy em produção, incluindo a resolução de bugs reais de infraestrutura distribuída e uma auditoria de segurança paga com correções aplicadas. Não é um CRUD de tutorial — é um sistema com trade-offs reais e documentados.

> ⚠️ **Disclaimer:** Este é um projeto de demonstração técnica sem vínculo com a Receita Federal do Brasil. Não utilize para fins fiscais reais. Veja o [aviso completo](#compliance) abaixo.

---

## Arquitetura de Produção

O projeto roda em **duas VMs separadas** na Oracle Cloud Free Tier — não por escolha, mas por necessidade: a calculadora oficial da RFB é uma imagem Docker `x86_64` (importada via `docker import`, não distribuída em nenhum registry) e não roda em ARM (`exec format error` confirmado). A camada gratuita da Oracle oferece VMs ARM com muito mais recursos do que as x86_64 — daí a divisão.

```
                              Internet
                                 │
                    ┌────────────┴────────────┐
                    │   Caddy (80/443)         │
                    │   HTTPS automático via   │
                    │   Let's Encrypt + DuckDNS │
                    └────┬──────────────┬──────┘
                         │              │
              ┌──────────▼───┐   ┌──────▼────────┐
              │  Next.js 15.5 │   │  Fastify API   │
              │  (taxsim-web) │──▶│  (taxsim-api)  │
              └───────────────┘   └───────┬────────┘
                                           │
                                   ┌───────▼────────┐
                                   │  PostgreSQL 16  │
                                   └────────────────┘

          VM ARM (taxsim-prod, 2 OCPU / 12GB) — sa-saopaulo-1
──────────────────────────────────────────────────────────────
                    VCN interna (10.0.0.0/24)
──────────────────────────────────────────────────────────────
          VM AMD (calculadora-rfb-taxsim, 1 OCPU / 1GB)
                                   │
                        ┌──────────▼──────────┐
                        │  Calculadora RFB     │
                        │  (Java/Spring Boot)  │
                        │  via Nginx :80       │
                        └──────────────────────┘
```

**Custo de infraestrutura: R$ 0,00/mês.** Duas VMs no Oracle Cloud Free Tier (permanentemente gratuito, sem cartão), domínio via DuckDNS (gratuito), certificado TLS via Let's Encrypt (gratuito, renovação automática pelo Caddy).

**Stack:**
- **Backend:** Fastify + TypeScript + Prisma ORM + PostgreSQL 16 + Zod (validação runtime)
- **Frontend:** Next.js 15.5 (App Router) + Tailwind v4 + shadcn/ui (Base UI) + Recharts
- **Infra:** Docker Compose (5 serviços), Caddy (reverse proxy + TLS automático), Oracle Cloud (2 VMs)
- **Qualidade:** Vitest (testes automatizados), Prettier + Husky + lint-staged (formatação em todo commit)
- **Gerenciador de pacotes:** pnpm 10.17.1 (pinado)

---

## Funcionalidades

### Core
- **Simulação fiscal real** — itens com NCM → Tax Engine interno → calculadora oficial RFB → comparativo lado a lado
- **Multi-tenant** — isolamento completo por empresa via JWT (`companyId` em todo `WHERE`)
- **Autenticação completa** — JWT de 15min em memória + refresh token HttpOnly com rotação a cada uso
- **Dashboard executivo** — KPIs YTD, gráfico de 6 meses rolantes, donut de composição tributária, todos com dados reais agregados via SQL nativo
- **Circuit breaker** — proteção contra falhas em cascata na integração com a calculadora RFB (ver [a saga de debugging](#a-saga-do-circuit-breaker) abaixo)

### Gestão
- **Produtos** — CRUD com NCM autocomplete (10.515 NCMs da tabela oficial RFB 2026)
- **Clientes** — CRUD com formatação CPF/CNPJ
- **Vendas** — listagem com filtro por status, breakdown fiscal completo, confirmar/cancelar inline
- **Configurações** — edição de dados fiscais da empresa com select de município dependente de UF

### Reforma Tributária
- **Split Payment** — fundação arquitetural implementada, com [roadmap técnico detalhado](./SPLIT_PAYMENT_ROADMAP.md) para fases 1-4
- **IBS/CBS/IS** — calculados via integração real com a calculadora oficial da RFB
- **Seed de regras fiscais** — 63 regras cobrindo os NCMs mais comuns, auto-populadas no primeiro registro

---

## A Saga do Circuit Breaker

Um dos bugs mais instrutivos deste projeto: em produção, `/sales/simulate` retornava 422 em ~12ms — rápido demais para ter tentado uma chamada de rede real, o que provava que o circuit breaker estava rejeitando antes de qualquer `fetch()`. Testamos reiniciar o container (circuit breaker é estado em memória, deveria zerar), verificamos conectividade entre as duas VMs em 4 camadas diferentes (ping, TCP raw, curl de dentro do container, `http.request()` nativo do Node) — tudo funcionando.

A causa raiz: `new Date().toISOString()` gera datas no formato `2026-08-08T02:15:16.222Z` (UTC com sufixo `Z`), mas a calculadora da RFB **rejeita** esse formato e exige offset explícito (`2026-08-07T23:15:16-03:00`). Toda chamada retornava HTTP 400, e após 5 falhas o circuit breaker abria — mascarando o erro real atrás de uma resposta rápida e genérica.

**Lição:** circuit breakers escondem a causa raiz. A resposta de 422 em 12ms parecia "infraestrutura quebrada" quando na verdade era um bug de formatação de data de uma linha. [Relatório completo de diagnóstico](./relatorio_diagnostico_taxsim.md).

---

## Segurança

O projeto passou por uma auditoria automatizada com [Codex Security](https://github.com/openai/codex) (OpenAI), cobrindo 115 de 167 arquivos do repositório. 8 findings foram identificados; todos foram corrigidos ou documentados como limitação conhecida.

| # | Finding | Severidade | Status |
|---|---|---|---|
| 1 | Exponentes decimais (`1e100000000`) em campos monetários podiam exaurir memória da API | Alta | ✅ Corrigido — gramática estrita via regex, limites de array |
| 2 | `redirectTo` pós-login não validado permitia open redirect / DOM XSS | Alta | ✅ Corrigido — allowlist de caminhos relativos |
| 3 | Fallback silencioso de `JWT_SECRET` para valor público conhecido | Média | ✅ Corrigido — fail-fast em produção |
| 5 | Porta da API exposta diretamente, contornando rate limiting centralizado | Média | ✅ Corrigido — Caddy como único ponto de entrada, portas antigas fechadas |
| 6 | Tráfego de autenticação em HTTP puro, sem TLS | Média | ✅ Corrigido — HTTPS via Caddy + Let's Encrypt |
| 8 | Logout não revogava sessão no servidor (`Path` do cookie divergente) | Baixa | ✅ Corrigido — escopo do cookie alinhado entre set/clear |
| 4 | Resposta da calculadora RFB confiada sem validação de schema em runtime | Média | 📋 Documentado — ver limitações conhecidas |
| 7 | Refresh tokens armazenados em texto puro no banco (não hasheados) | Baixa | 📋 Documentado — ver limitações conhecidas |

### Limitações conhecidas (decisão consciente de escopo)

- **Validação de proveniência da calculadora RFB:** a resposta do serviço de terceiro (calculadora oficial) é confiada sem verificação de schema em runtime. Mitigação completa exigiria autenticação mútua ou pinning do serviço, infraestrutura que não existe para essa calculadora pública. Risco aceito para escopo de demonstração.
- **Refresh tokens em texto puro:** o hash de refresh tokens (como já se faz com senhas) exigiria migração de dados e foi adiado — não é uma vulnerabilidade explorável sem acesso prévio ao banco.

---

## Testes Automatizados

Suíte com Vitest cobrindo os pontos de maior risco identificados durante o desenvolvimento e a auditoria de segurança:

- **Tax Engine e formatters** — funções puras, sem I/O, incluindo o formato de data exigido pela calculadora RFB
- **Validação de schema (Zod)** — proteção contra exponentes decimais, limites de array, quantidade por item
- **`safeRedirectPath`** — todos os vetores de ataque do finding de open redirect (protocol-relative, `javascript:`, `data:`, backslash)
- **Circuit breaker / error handler** — propagação correta de erros de validação através do encapsulamento de plugins do Fastify
- **Fluxo de cookies de autenticação** — escopo correto de `Path` entre emissão e revogação de sessão

```bash
cd apps/api && pnpm exec vitest run   # 14 testes
cd apps/web && pnpm exec vitest run   # 9 testes
```

---

## Decisões Técnicas Relevantes

| Decisão | Escolha | Motivo |
|---|---|---|
| Token de acesso | Memória (nunca localStorage) | Proteção contra XSS |
| Cookie de refresh | HttpOnly + `SameSite=None` em produção | `duckdns.org` está na Public Suffix List do navegador — API e Web em subdomínios diferentes são tratados como cross-site; `Secure` + `HttpOnly` + allowlist de CORS mitigam CSRF |
| Rotas protegidas | Client-side (`RequireAuth`) | Cookie com `Path` restrito é invisível ao Edge Middleware |
| Tax Engine | Zero-Prisma, funções puras | Testável sem banco, extraível para outro runtime |
| Calculadora RFB indisponível | Fail-fast 422 | Fonte da verdade legal — sem fallback enganoso |
| Agregação do dashboard | SQL nativo via `$queryRaw` | `SUM`/`COUNT`/`AVG` no banco, não no cliente |
| Colunas do banco | camelCase sem `@map` | Aspas duplas obrigatórias em SQL raw |
| Domínio + TLS | DuckDNS + Let's Encrypt via Caddy | Zero custo, renovação automática, mantém o projeto hospedável gratuitamente |
| Error handler do Fastify | Registrado com `fastify-plugin` (`fp()`) | Sem isso, fica invisível a plugins-irmãos por encapsulamento padrão do Fastify — descoberto ao validar um fix de segurança em produção |

---

## Como Rodar Localmente

### Pré-requisitos
- Docker + Docker Compose
- Node.js 22 + pnpm 10.17.1
- Arquivo `calculadora.tar.gz` da [calculadora oficial da RFB](https://www.gov.br/receitafederal/pt-br/assuntos/legislacao/legislacao-por-assunto/reforma-tributaria/calculadora-do-regime-geral)

### Setup

```bash
# 1. Clone o repositório
git clone https://github.com/M-its/taxsim
cd taxsim

# 2. Importe a imagem da calculadora RFB
docker import calculadora.tar.gz calculadora-image

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores

# 4. Suba os containers
docker compose up -d

# 5. Aguarde todos ficarem healthy (~2 min)
docker compose ps

# 6. Popule os dados iniciais (NCMs + regras fiscais)
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
docker compose exec api pnpm run import:ncm

# 7. Acesse
# Frontend: http://localhost:3000
# API:      http://localhost:3333/health
```

### Variáveis de Ambiente

```env
# API
DATABASE_URL=postgresql://taxsim_user:taxsim_pass@db:5432/taxsim_db
JWT_SECRET=sua-chave-secreta-aqui
REFRESH_TOKEN_SECRET=outra-chave-secreta-aqui
CORS_ORIGIN=http://localhost:3000

# Web
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXTAUTH_SECRET=mais-uma-chave-secreta
```

---

## Estrutura do Projeto

```
taxsim/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 9 modelos
│   │   │   ├── seed.ts         # 63 regras fiscais
│   │   │   └── import-ncm.ts   # Import da tabela NCM oficial
│   │   ├── Dockerfile.prod
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/       # JWT + refresh rotation
│   │       │   ├── products/   # CRUD + NCM validation
│   │       │   ├── clients/    # CRUD + CPF/CNPJ
│   │       │   ├── sales/      # Orchestrator fiscal
│   │       │   ├── dashboard/  # Agregações SQL
│   │       │   ├── tax-engine/ # Motor fiscal puro
│   │       │   ├── tax-calculator/ # Client RFB + circuit breaker
│   │       │   ├── ncm/        # Search endpoint
│   │       │   ├── municipalities/ # Proxy calculadora RFB
│   │       │   └── companies/  # Settings PATCH
│   │       └── shared/
│   │           ├── errors/     # AppError + fastify-plugin error handler
│   │           ├── middlewares/ # authenticate preHandler
│   │           └── formatters/ # Decimal serialization
│   └── web/                    # Next.js frontend
│       ├── Dockerfile.prod
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Login + Register
│           │   └── (dashboard)/ # Todas as páginas protegidas
│           ├── components/
│           │   ├── auth/       # AuthProvider, RequireAuth, PublicRoute
│           │   ├── dashboard/  # KPIs, charts, table
│           │   ├── layout/     # Sidebar, Topbar, DashboardShell
│           │   └── simulation/ # Form, TaxComparison, ProjectedImpact
│           ├── hooks/          # useDashboardSummary, useRecentSales
│           └── lib/            # api.ts, safe-redirect.ts, formatters, types
├── docker-compose.yml           # Ambiente de desenvolvimento
├── docker-compose.prod.yml      # Produção — inclui Caddy
├── Caddyfile                    # Config do reverse proxy / TLS
├── API_CONTRACTS.md             # Contratos de todos os endpoints
├── PROJECT_CONTEXT.md           # Decisões arquiteturais
└── SPLIT_PAYMENT_ROADMAP.md     # Roadmap Split Payment fases 1-4
```

---

## Compliance

Este projeto é uma **demonstração técnica de portfólio** desenvolvida por [Mitsrael](https://github.com/M-its).

- Não possui vínculo com a Receita Federal do Brasil
- A calculadora de tributos integrada é software público disponibilizado pela RFB
- Os cálculos podem não refletir a legislação mais recente
- Não monetizado — uso exclusivamente demonstrativo
- Não utiliza logotipos ou marcas oficiais do Governo Federal

---

## Licença

MIT — veja [LICENSE](./LICENSE)
