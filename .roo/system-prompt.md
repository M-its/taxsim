# TaxSim — Project Context & Engineering Decisions

This document is the **single source of truth** for all architectural decisions,
stack choices and design justifications applied to **TaxSim**.

It is intended to onboard AI tools (Claude, Gemini, Cursor, Codex, Kimi),
technical recruiters and future contributors without requiring them to read
through chat histories.

**Update this file whenever a significant decision is made or revised.**

---

## 1. Project Overview

TaxSim is a **Multi-tenant Fiscal SaaS MVP** focused on simulating and comparing
the impact of Brazil's 2026 Tax Reform (Lei Complementar 214/2025).

### Core value proposition

> Compare the current tax model (PIS / COFINS / ICMS / ISS) with the new model
> (CBS / IBS / Imposto Seletivo) on real sales data, using the official
> Brazilian Federal Revenue calculator as the source of truth for the new model.

### What TaxSim is NOT

- Not a full ERP
- Not a NF-e issuer or government integration
- Not a stock management system
- Not a financial or payment system
- Not a BI or advanced analytics platform
- Not a generative AI product

---

## 2. Engineering Philosophy

**Priorities:** simplicity · architectural clarity · separation of concerns ·
reasonable security · future scalability.

**Avoid:** overengineering · unnecessary abstractions · premature microservices ·
enterprise patterns that add complexity without MVP value.

**Architecture type:** Modular monolith.

```
/apps
  /api   ← Fastify + TypeScript
  /web   ← Next.js 15
```

The Tax Engine is designed to be easily extractable into a separate service
in the future, but lives inside the API process for now.

---

## 3. Core Tech Stack

### 3.1 Frontend — Next.js 15 (App Router)

**Decisions:**
- React Server Components (RSC) and Server Actions as the primary data pattern
- Streaming with Suspense for complex fiscal simulation results
- Experimental Partial Prerendering (PPR) where applicable
- Shadcn/ui over Tailwind CSS with a desaturated Zinc palette (Vercel/Linear aesthetic)
- Recharts for comparative tax breakdown charts
- Framer Motion for subtle transition animations

**Justification:**
- Server-side data fetching hides internal API structure from the client
- Eliminates legacy `useEffect` patterns for data mutation and listing
- Zinc palette signals enterprise-grade SaaS, not a student project

### 3.2 Backend — Fastify + TypeScript

**Decisions:**
- Isolated REST API process separate from Next.js internal routes
- Zod for runtime input validation and schema inference
- Swagger / OpenAPI documentation is mandatory (serves as API contract,
  technical onboarding reference and context source for AI tools)

**Justification:**
- Fastify is up to 5x faster than Express — critical for processing large
  sale batches in fiscal simulations
- Decoupled architecture allows independent horizontal scaling of the
  Tax Engine without touching the frontend

### 3.3 Database — PostgreSQL 16 + Prisma ORM

**Decisions:**
- PostgreSQL 16 running in an isolated Docker container
- Prisma ORM for type-safe, schema-driven development
- `uuid-ossp` and `pgcrypto` extensions enabled at init

**Justification:**
- ACID transactions guarantee fiscal data integrity
- Prisma schema drives TypeScript types end-to-end (DX acceleration)
- PostgreSQL native concurrency handles multi-tenant query isolation safely

---

## 4. Data Architecture

### 4.1 Multi-tenancy Strategy

**Decision:** Shared Database, Shared Schema (row-level discriminator).
Every main operational table (`products`, `clients`, `sales`) has a
`company_id` foreign key.

**Justification:** Best cost/complexity tradeoff for a scalable SaaS MVP.
Logical isolation is enforced at the application query layer.

**Rule:** Every query against a tenant-owned table MUST include:
```sql
WHERE company_id = :companyId
```

### 4.2 Why `sale_items` has no `company_id`

**Decision:** `sale_items` is intentionally omitted from the `company_id`
pattern. It relates strictly to `sale_id`.

**Justification (3NF — normalization):**
- Prevents data redundancy and the critical risk of logical inconsistency
  (e.g. a sale belonging to Company A while one of its items points to
  Company B due to a mutation bug)
- Tenant security is guaranteed via **protected joins**: any query for sale
  items must validate `company_id` through the parent `sales` table

### 4.3 Primary Keys — UUID v7

**Decision:** UUID v7 instead of UUID v4 or sequential integers.

**Justification:**
- UUID v7 is time-ordered, which massively optimizes index performance and
  INSERT throughput in PostgreSQL
- Remains completely unpredictable and safe for external URLs

### 4.4 Monetary Fields — Decimal(12,2)

**Decision:** All monetary and tax rate fields use `Decimal(12,2)`.
`Float` and `Real` are prohibited.

**Justification:** Avoids IEEE 754 binary floating-point rounding errors.
Centesimal mathematical precision is a legal requirement for fiscal records
in Brazil.

### 4.5 Historical Snapshots in `sale_items`

**Decision:** When a sale is closed, the unit price, NCM code and all
applicable tax rates at that moment are physically copied into each
`sale_item` row.

**Justification:** Guarantees **fiscal historical immutability**. Even if a
product price changes or a tax rule for that NCM is updated in the future,
the original sale record remains legally correct and untouched.

### 4.6 Core Domain Entities

| Entity | Description |
|---|---|
| `companies` | Tenant root |
| `users` | Authentication, belongs to one company |
| `refresh_tokens` | Auth token rotation |
| `products` | SKU unique per company |
| `clients` | Document unique per company |
| `sales` | Transaction header |
| `sale_items` | Line items with fiscal snapshots |
| `tax_rules` | Global table (no `company_id`) — NCM rates per tax regime |

---

## 5. Infrastructure & Orchestration

### 5.1 Network Isolation Architecture

```
[ Browser ]
     │
     ▼ ports 3000 / 3333
┌─────────────────────────────────────────────────────┐
│ app_network (bridge)                                │
│   ├── taxsim-web  (Next.js 15   — port 3000)        │
│   └── taxsim-api  (Fastify      — port 3333)        │
└──────────┬──────────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────────────────────┐
    │  db_network (internal: true)                    │
    │   ├── taxsim-api (bridges both networks)        │
    │   └── taxsim-db  (PostgreSQL 16 — hidden)       │
    └──────┬──────────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────────────────────┐
    │  tax_calculator_network (internal: true)         │
    │   ├── taxsim-api        (bridges both networks) │
    │   └── taxsim-tax-calculator (Java — hidden)     │
    └─────────────────────────────────────────────────┘
```

**Principle applied:** Least Privilege. Each service only joins the networks
it strictly needs. The database and the tax calculator are never reachable
from the browser or from the Next.js container.

### 5.2 Official Tax Calculator — Brazilian Federal Revenue

**Decision:** Integrate the official offline Docker image provided by the
Brazilian Federal Revenue at:
https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/calculadora/calculadora-offline

**Context:**
- The image is distributed as a `.tar.gz` filesystem archive (not a Docker
  Hub image) and must be imported once with `docker import`
- It is a Java/Spring Boot application that exposes two independent REST APIs:
  - `http://tax-calculator:8080/api` — Standard Regime (IBS / CBS / IS)
  - `http://tax-calculator:8081/api` — Simplified Split Payment
- The official startup command is `bash start.sh` in the `/calculadora` workdir

**Import command (run once before first `docker compose up`):**
```bash
docker import /path/to/calculadora.tar.gz calculadora-image
```

**Environment variables injected into the API:**
```
TAX_CALCULATOR_STANDARD_URL=http://tax-calculator:8080/api
TAX_CALCULATOR_SPLIT_PAYMENT_URL=http://tax-calculator:8081/api
```

### 5.3 Docker Compose Key Decisions

| Decision | Justification |
|---|---|
| `depends_on` with `service_healthy` | Prevents race conditions on cold start |
| Anonymous volumes for `node_modules` | Prevents native binary conflicts between Alpine Linux container and WSL2/Windows host |
| `127.0.0.1` port bindings | Ports only listen on loopback, not all host interfaces |
| `:?` syntax on secrets | Compose fails immediately with a clear message if a required secret is missing |
| `API_INTERNAL_URL` vs `NEXT_PUBLIC_API_URL` | Separates SSR/RSC server-side calls (internal Docker hostname) from client-side browser calls |

### 5.4 Production Compose (`docker-compose.prod.yml`)

Extends the base compose and overrides:
- Nginx reverse proxy as the single exposed port (80 / 443)
- All internal ports removed from host binding
- CPU and memory limits per service (2 vCPUs for the API)
- `NODE_ENV=production` and compiled builds
- Tax calculator port hidden (accessible only via `tax_calculator_network`)

---

## 6. Tax Engine Architecture

### 6.1 Role of Each Component

The **Internal Tax Engine** (Node.js module inside the API) is responsible for
calculating the **current tax model**: PIS, COFINS, ICMS, ISS — based on the
`tax_rules` global table and the company's tax regime.

The **Official Tax Calculator** (Federal Revenue Docker service) is responsible
for calculating the **new tax model**: IBS, CBS, Imposto Seletivo — as defined
by LC 214/2025. This is the legal source of truth.

The **API orchestration layer** calls both, merges the results and returns a
single comparative breakdown to the frontend.

### 6.2 Expected API Contract

**Input:**
```json
{
  "items": [],
  "company": {},
  "mode": "CURRENT | REFORM | COMPARATIVE"
}
```

**Output:**
```json
{
  "currentModel": { "totalTaxes": 0, "breakdown": [] },
  "reformModel":  { "totalTaxes": 0, "breakdown": [] },
  "delta":        { "absolute": 0, "percentual": 0 }
}
```

### 6.3 Design Principles

- **Pure functions:** Tax calculation functions receive inputs and return
  outputs with no side effects — 100% unit testable without a database
- **Decoupled:** No direct HTTP dependency, no tight framework coupling —
  extractable to a microservice (or rewritten in Go) without touching the API
- **Future evolution:** If CPU bottlenecks or high-concurrency mass simulations
  become a concern, the Internal Tax Engine is a candidate for Go rewrite.
  Node.js is sufficient for the MVP.

### 6.4 Tax Rule Update Strategy — Draft & Approval

**Problem:** Can the system auto-update tax rules when legislation changes?

**Decision:** Yes, via scheduled jobs or webhooks from fiscal APIs (e.g. IBPT).
However, new rules follow the **Draft & Approval pattern**:

1. New rate detected → record created with status `DRAFT`
2. Admin/accountant is notified
3. Rule only becomes `ACTIVE` after human approval

**Justification:** Prevents bugs in external APIs from silently breaking
production tax calculations mid-fiscal-day.

---

## 7. API Endpoints

### Auth
```
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### Products
```
GET  /products
POST /products
```

### Clients
```
GET  /clients
POST /clients
```

### Sales
```
GET  /sales
POST /sales
```

### Simulation
```
POST /sales/simulate
```

Swagger/OpenAPI documentation is mandatory and serves as:
- API contract between frontend and backend
- Technical onboarding reference
- Context source for AI coding tools

---

## 8. Security

### Implemented in MVP
- JWT Authentication with Refresh Token rotation
- Input validation via Zod on all endpoints
- Multi-tenant isolation via `company_id` on every query
- Database isolated in internal Docker network (no host exposure)
- Port binding restricted to loopback (`127.0.0.1`)

### Explicitly out of scope for MVP
- PostgreSQL Row Level Security (RLS) — compatible with future addition
- Advanced RBAC
- WAF / DDoS protection
- Full audit log
- Rate limiting beyond Nginx basic config

---

## 9. Frontend Guidelines

### Dashboard Components
- Estimated tax savings
- IBS breakdown
- CBS breakdown
- Imposto Seletivo breakdown
- Comparative bar/line chart (Recharts)
- Tax composition donut chart
- Transactions table

### UX Directives
- Prioritize clarity and fast reading
- Focus on the simulation differential — avoid widget bloat
- Zinc palette, thin borders, clean typography (Linear/Vercel aesthetic)
- Subtle Framer Motion transitions on route changes and data loads

### Easter Egg — Developer Console
On dashboard load in development, inject a styled `console.log` message:

> *"Where taxes obscure the path, TaxSim lights the way.
>  Welcome to the console, recruiter."*

Demonstrates personality, attention to detail, and passion for building
beyond the obvious. Targets senior engineers inspecting the portfolio.

---

## 10. Development Priority Order

1. Database schema (Prisma)
2. Docker environment validation
3. Auth (JWT + Refresh Token)
4. Internal Tax Engine (current model — pure functions)
5. Official Tax Calculator integration (new model)
6. REST API endpoints
7. Frontend — Dashboard
8. Simulation comparative view

---

## 11. Guidelines for AI Code Generation

When generating code for this project:

**Prefer:**
- Simplicity and maintainability over cleverness
- Low coupling between modules
- Explicit types over `any`
- Zod schemas as the single validation layer
- Pure functions for all tax calculation logic

**Avoid:**
- Unnecessary abstractions or design patterns
- Premature microservice boundaries
- Enterprise boilerplate that adds no MVP value
- `useEffect` for data fetching (use RSC / Server Actions)
- `Float` for monetary values (use `Decimal`)

---

## 12. Current Project Status

| Item | Status |
|---|---|
| Architecture defined | ✅ |
| Stack defined | ✅ |
| Docker Compose (dev + prod) | ✅ |
| Official Tax Calculator imported | ✅ |
| Nginx reverse proxy configured | ✅ |
| Dashboard design defined | ✅ |
| Prisma schema | ⏳ next |
| Domain implementation | ❌ not started |

---

## 13. Useful Development Commands

### Prisma (always run inside the container)
```bash
# Run migrations
docker compose run --rm api npx prisma migrate dev --name <migration_name>

# Open Prisma Studio
docker compose run --rm api npx prisma studio

# Reset database (⚠️ deletes all data)
docker compose run --rm api npx prisma migrate reset
```
