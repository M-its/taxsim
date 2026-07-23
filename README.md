# TaxSim — Simulador da Reforma Tributária Brasileira

> Projeto de portfólio demonstrando desenvolvimento full-stack de um SaaS fiscal multi-tenant do zero à produção.

**[Demo ao vivo](#)** · **[Autor](https://github.com/M-its)**

---

## O que é

TaxSim é um SaaS fiscal que permite empresas simularem e compararem o impacto financeiro da Reforma Tributária brasileira (LC 214/2025) — substituição do modelo atual (PIS/COFINS/ICMS/ISS) pelo IVA Dual (IBS/CBS/Imposto Seletivo).

A calculadora de tributos integrada é a **calculadora oficial da Receita Federal do Brasil** (uso público), garantindo que os cálculos do modelo reformado sejam tecnicamente precisos.

> ⚠️ **Disclaimer:** Este é um projeto de demonstração técnica sem vínculo com a Receita Federal do Brasil. Não utilize para fins fiscais reais. Veja o [aviso completo](#compliance) abaixo.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │ Next.js  │  │ Fastify  │  │  Calculadora RFB      │ │
│  │   15.5   │→ │   API    │→ │  (Java/Spring Boot)   │ │
│  │  :3000   │  │  :3333   │  │  :8080 / :8081        │ │
│  └──────────┘  └────┬─────┘  └───────────────────────┘ │
│                     │                                   │
│               ┌─────▼──────┐                           │
│               │ PostgreSQL │                            │
│               │     16     │                            │
│               └────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

**Stack:**
- **Backend:** Fastify + TypeScript + Prisma ORM + PostgreSQL 16
- **Frontend:** Next.js 15 (App Router) + Tailwind v4 + shadcn/ui (Base UI) + Recharts + Framer Motion
- **Infra:** Docker Compose, 4 containers, 3 redes isoladas
- **Gerenciador de pacotes:** pnpm 10.17.1 (pinado)

---

## Funcionalidades

### Core
- **Simulação fiscal real** — itens com NCM → Tax Engine interno → calculadora oficial RFB → comparativo lado a lado
- **Multi-tenant** — isolamento completo por empresa via JWT (companyId em todo WHERE)
- **Autenticação completa** — JWT de 15min em memória + refresh token HttpOnly (Path=/auth/refresh) com rotação
- **Dashboard executivo** — KPIs YTD, gráfico de 6 meses rolantes, donut de composição tributária — todos com dados reais agregados via SQL nativo

### Gestão
- **Produtos** — CRUD com NCM autocomplete (10.515 NCMs da tabela oficial RFB 2026)
- **Clientes** — CRUD com formatação CPF/CNPJ
- **Vendas** — listagem com filtro por status, modal de detalhes com breakdown fiscal completo, confirmar/cancelar inline
- **Configurações** — edição de dados fiscais da empresa com select de município dependente de UF (dados da calculadora RFB)

### Reforma Tributária
- **Split Payment** — fundação arquitetural implementada (campos no schema, exibição de valores retidos estimados) com [roadmap técnico detalhado](./SPLIT_PAYMENT_ROADMAP.md) para fases 1-4
- **IBS/CBS/IS** — calculados via integração real com a calculadora oficial da RFB
- **Seed de regras fiscais** — 63 regras cobrindo os NCMs mais comuns, auto-populadas no primeiro registro

---

## Decisões Técnicas Relevantes

| Decisão | Escolha | Motivo |
|---|---|---|
| Token de acesso | Memória (nunca localStorage) | Proteção contra XSS |
| Cookie de refresh | HttpOnly + Path=/auth/refresh | Minimiza superfície de ataque |
| Rotas protegidas | Client-side (RequireAuth) | Cookie path impede Middleware de ler o token |
| Tax Engine | Zero-Prisma, funções puras | Testável sem banco, extraível para Go |
| Calculadora RFB indisponível | Fail-fast 422 | Fonte da verdade legal — sem fallback enganoso |
| Agregação do dashboard | SQL nativo via $queryRaw | SUM/COUNT/AVG no banco, não no cliente |
| colunas DB | camelCase sem @map | Aspas duplas obrigatórias em SQL raw |

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
docker compose run --rm api pnpm exec prisma db seed
docker compose run --rm api pnpm run import:ncm

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
│   │   │   ├── schema.prisma   # Schema com 8 modelos
│   │   │   ├── seed.ts         # 63 regras fiscais
│   │   │   └── import-ncm.ts   # Import da tabela NCM oficial
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
│   │           ├── errors/     # AppError domain errors
│   │           ├── middlewares/ # authenticate preHandler
│   │           └── formatters/ # Decimal serialization
│   └── web/                    # Next.js frontend
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
│           └── lib/            # api.ts, formatters, types
├── docker-compose.yml
├── API_CONTRACTS.md            # Contratos de todos os endpoints
├── PROJECT_CONTEXT.md          # Decisões arquiteturais
└── SPLIT_PAYMENT_ROADMAP.md    # Roadmap Split Payment fases 1-4
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
