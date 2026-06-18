# TaxSim — Agent Context
> Dense reference for AI agents. Read before any action.

## Project
Tax reform simulation SaaS. Compares BR current model (PIS/COFINS/ICMS/ISS) vs reform (IBS/CBS/IS).
Multi-tenant. Portfolio project. Engineering quality is the goal.

## Stack
- API: Fastify + TypeScript + Prisma + PostgreSQL 16
- Web: Next.js 16 + Shadcn/ui + Tailwind v4 + Recharts
- Infra: Docker Compose (4 containers)

## Containers
```
taxsim-db               → PostgreSQL 16    → localhost:5432 (dev only)
taxsim-tax-calculator   → RFB Java API     → localhost:8080/api (Regime Geral)
                                           → localhost:8081/api (Split Payment)
taxsim-api              → Fastify          → localhost:3333
taxsim-web              → Next.js          → localhost:3000
```

## Networks (internal: true = no host routing)
- app_network: web ↔ api
- db_network: api ↔ db
- tax_calculator_network: api ↔ tax-calculator

## Critical rules
- EVERY query on operational tables needs `WHERE company_id = ?`
- NEVER use Float for money — always Decimal
- NEVER recalculate taxes on a CONFIRMED sale
- NEVER store refresh token in localStorage — HttpOnly cookie only
- `sale_items` has no `company_id` by design (3NF — join via parent `sales`)
- Tax calculator image: `calculadora-image` (docker import, not docker pull)
- Prisma migrations: `docker compose run --rm api npx prisma migrate dev --name <name>`
- Reserved ports: 8080, 8081 (tax-calculator), 3000 (web), 3333 (api), 5432 (db)

## File structure
```
apps/api/src/
  modules/{auth,products,clients,sales,tax-engine}/
    *.routes.ts → *.controller.ts → *.service.ts
    *.schema.ts (Zod) | *.types.ts
  shared/{errors,middlewares,validators}/
  lib/{prisma.ts,tax-calculator.ts}
  server.ts
apps/web/src/
  app/          (Next.js App Router)
  components/   (reusable UI)
  lib/          (utilities)
```

## Key files
- `PROJECT_CONTEXT.md` — full architecture decisions
- `API_CONTRACTS.md` — all endpoint payloads/responses
- `apps/api/prisma/schema.prisma` — DB schema with indexes
- `.opencode/napkin.md` — learned env quirks (read first)

## Commit convention
feat | fix | chore | docs | refactor: short description

## Never commit
.env — secrets live in environment only

DEBUGGING RULES

1. Never rebuild containers to fix TypeScript or React errors.

2. If a compiler error exists:
   stop all other investigations.

3. Follow one hypothesis at a time.

4. Never modify a file unless you can explain why that file is related to the current issue.

5. After every modification:
   - run typecheck
   - run build
   - verify the original error

6. If a route returns 500:
   inspect logs before changing code.

7. Stop after finding the root cause.
   Do not continue exploring alternative fixes.