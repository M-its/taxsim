# Handoff — TaxSim Dashboard Backend → Frontend Integration

**Path:** `/tmp/handoff-HELwaU.md`
**Date:** 2026-06-27

---

## 1. Current Implementation Status

### Done
- **Backend:** `GET /dashboard/summary` implemented and live at `http://localhost:3333/dashboard/summary`.
- **Module files:**
  - `apps/api/src/modules/dashboard/dashboard.types.ts`
  - `apps/api/src/modules/dashboard/dashboard.schema.ts`
  - `apps/api/src/modules/dashboard/dashboard.service.ts`
  - `apps/api/src/modules/dashboard/dashboard.controller.ts`
  - `apps/api/src/modules/dashboard/dashboard.routes.ts`
- **Route registration:** `apps/api/src/server.ts` registers `dashboardRoutes` with prefix `/dashboard`.
- **Contract docs:** `API_CONTRACTS.md` section 5 documents the endpoint.
- **Pre-existing TS error fixed:** `apps/api/src/modules/tax-calculator/tax-calculator.client.ts` response type changed from `number` to `string` so `tsc` passes.

### Aggregation behavior (already decided, in code)
| Widget | Window | Status filter |
|---|---|---|
| KPIs | YTD: 1 Jan → now | `CONFIRMED` only |
| Tax composition donut | YTD | `CONFIRMED` only |
| Tax load bar chart | Rolling last 6 real months, zero-filled | `CONFIRMED` only |

### Known issues resolved during this session
- Raw SQL columns are camelCase and double-quoted (`"companyId"`, `"createdAt"`, `"totalPis"`, etc.).
- SELECT aliases in YTD query are double-quoted (`"currentTotal"`, `"reformTotal"`, ...).
- Null aggregates are coalesced to `new Decimal(0)` via a `toDecimal()` helper.

### In progress / next
- **Frontend integration:** replace mock data in the dashboard with real calls to `GET /dashboard/summary`.

---

## 2. Last Commands Run & Results

```bash
docker compose -f "\\wsl.localhost\Ubuntu\home\mitsrael\projects\taxsim\docker-compose.yml" run --rm \
  -v "\\wsl.localhost\Ubuntu\home\mitsrael\projects\taxsim\apps\api\tsconfig.json:/app/tsconfig.json:cached" \
  api pnpm build
# output: tsc completed with no errors

docker compose -f "\\wsl.localhost\Ubuntu\home\mitsrael\projects\taxsim\docker-compose.yml" restart api
# result: container restarted and healthy

curl -s http://127.0.0.1:3333/health
# {"status":"ok","service":"taxsim-api","timestamp":"..."}
```

---

## 3. Containers Currently Running

```
NAME                    IMAGE                STATUS                    PORTS
taxsim-api              taxsim-api           Up 5 minutes (healthy)    127.0.0.1:3333->3333/tcp
taxsim-db               postgres:16-alpine   Up 4 hours (healthy)      5432/tcp
taxsim-tax-calculator   calculadora-image    Up 25 hours (healthy)     80/tcp, 8080-8081/tcp
taxsim-web              taxsim-app           Up 25 hours (healthy)     127.0.0.1:3000->3000/tcp
```

---

## 4. Next Task: Connect Frontend Dashboard to Real Endpoint

### Goal
Replace `apps/web/src/lib/mock-data.ts` consumption in the dashboard with live data from `GET /dashboard/summary`.

### Starting points
- Mock shape used by frontend: `apps/web/src/lib/mock-data.ts` (especially `mockKpiData`, `mockTaxLoadByMonth`, `mockTaxComposition`).
- Backend response shape: see `API_CONTRACTS.md` section 5 or call the endpoint directly.
- Endpoint: `GET http://localhost:3333/dashboard/summary` (requires `Authorization: Bearer <token>`).
- Web app base URL env: `NEXT_PUBLIC_API_URL=http://localhost:3333` (already set in `.env` / compose).

### Quick validation
A confirmed token flow exists in `API_CONTRACTS.md` section 1; use `POST /auth/register` or `/auth/login` to obtain a token, then:

```bash
curl -s http://127.0.0.1:3333/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

### Notes
- Response monetary/percentage fields are strings with 2 decimals (e.g., `"4200.00"`, `"72.00"`).
- `taxLoadByMonth[].month` is ISO `YYYY-MM` (e.g., `"2026-01"`). Frontend may localize labels.
- `estimatedSavings` and `estimatedSavingsPercent` are signed; the KPI card should show `abs()` and color/icon styling as a presentation concern.
- The Operações Recentes table already uses `GET /sales` directly; do not change that.

### Recommended skills for next session
- `interface-design` — when adapting dashboard UI to real data and ensuring the implementation matches the established Zinc/Linear aesthetic.
- `napkin` — to capture any new frontend/environment quirks (already used for backend Docker config issues).

---

## 5. Reference Artifacts (do not duplicate — read them)

- Architecture & decisions: `PROJECT_CONTEXT.md`
- API contracts: `API_CONTRACTS.md`
- Database schema: `apps/api/prisma/schema.prisma`
- Environment quirks: `.opencode/napkin.md` (note: API `tsconfig.json` must be manually volume-mounted for in-container `tsc` builds)
