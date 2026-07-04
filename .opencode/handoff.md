# TaxSim Handoff — Dashboard Summary Integration Complete

Date: 2026-06-28

## Current implementation status

Done:
- `apps/web/src/lib/dashboard.types.ts` created with exact `GET /dashboard/summary` response shape.
- `apps/web/src/hooks/use-dashboard-summary.ts` created — calls `GET /dashboard/summary` via `apiFetch`, returns `{ data, isLoading, error }` using `useState`/`useEffect`.
- `apps/web/src/lib/api.ts` modified to export `apiFetch` so the hook can consume it.
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` converted to `"use client"`, consumes `useDashboardSummary()`, and maps real data to existing components.
- `KpiGrid`, `TaxBarChart`, and `TaxDonutChart` were not modified; data is transformed in the page to match their existing prop shapes.
- `RecentOperationsTable` still uses `mockRecentSales` intentionally.
- Type check passed: `docker compose exec app pnpm exec tsc --noEmit`.
- Dashboard page returns HTTP 200 after restart.

Next up (this is the focus of the next session):
- Connect the **Simulation page** to the real `POST /sales/simulate` endpoint.
- Backend endpoint is already implemented and tested.
- See `API_CONTRACTS.md` §6 for request/response shape and `apps/api/src/modules/sales/*` for the implementation.
- Likely need to create `apps/web/src/lib/simulation.types.ts` and `apps/web/src/hooks/use-simulation.ts` following the same pattern as the dashboard work.

## Key references

- Architecture decisions → `PROJECT_CONTEXT.md`
- API contracts → `API_CONTRACTS.md`
- DB schema → `apps/api/prisma/schema.prisma`
- Environment quirks → `.opencode/napkin.md`

## Relevant files from this session

- `apps/web/src/lib/dashboard.types.ts`
- `apps/web/src/hooks/use-dashboard-summary.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/lib/mock-data.ts` (unchanged)
- `apps/web/src/components/dashboard/kpi-card.tsx` (unchanged)
- `apps/web/src/components/dashboard/tax-bar-chart.tsx` (unchanged)
- `apps/web/src/components/dashboard/tax-donut-chart.tsx` (unchanged)
- `apps/web/src/components/dashboard/recent-operations-table.tsx` (unchanged)

## Last command run and its result

```bash
docker compose restart app && sleep 20 && curl -s http://localhost:3000/dashboard -o /dev/null -w "%{http_code}"
```

Result: `200`

## Containers currently running

```
NAME                    IMAGE                COMMAND                  SERVICE          CREATED        STATUS                  PORTS
taxsim-api              taxsim-api           "docker-entrypoint.s…"   api              38 hours ago   Up 34 hours (healthy)   127.0.0.1:3333->3333/tcp
taxsim-db               postgres:16-alpine   "docker-entrypoint.s…"   db               38 hours ago   Up 38 hours (healthy)   5432/tcp
taxsim-tax-calculator   calculadora-image    "bash start.sh"          tax-calculator   2 days ago     Up 2 days (healthy)     80/tcp, 8080-8081/tcp
taxsim-web              taxsim-app           "docker-entrypoint.s…"   app              2 days ago     Up 24 hours (healthy)   127.0.0.1:3000->3000/tcp
```

## Recommended skills for next session

- **napkin** — read first to pick up learned environment quirks.
- **interface-design** — if the Simulation page UI needs new interactions or feedback states.
