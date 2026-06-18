# TaxSim — Agent Handoff

Generated: 2026-06-15T22:57:48Z

## Current Implementation Status

### Backend — COMPLETE
All backend modules are implemented and verified:

- **Database**: Prisma schema migrated with `add_tax_engine_fields`; seeded with sample `tax_rules`.
- **Auth**: Registration requires `municipioCode` and `uf` fields (returns them in response too).
- **Internal Tax Engine**: Pure JS functions in `apps/api/src/modules/tax-engine/`.
- **Tax Calculator Client**: Integrated with live RFB service endpoint `/api/calculadora/regime-geral`.
- **Sales Orchestrator**: Calls both engines in parallel, merges results, persists snapshots.

### Verified Working Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /products`
- `POST /clients`
- `POST /sales/simulate`
- `POST /sales`
- `GET /health`

### Frontend — NOT STARTED
Next session should build the Next.js 15 frontend using `shadcn/ui`, Tailwind v4, and Recharts as specified in `PROJECT_CONTEXT.md`.

---

## Last Command Run and Result

```bash
curl.exe -s http://localhost:3333/health
```

Result: `{"status":"ok","service":"taxsim-api","timestamp":"2026-06-15T22:57:48.481Z"}`

Last functional test: `POST /sales` successfully created a draft sale with both current-model and reform-model tax snapshots.

---

## Containers Currently Running

```
NAME                    IMAGE                STATUS                  PORTS
taxsim-api              taxsim-api           Up 27 hours (healthy)   127.0.0.1:3333->3333/tcp
taxsim-db               postgres:16-alpine   Up 27 hours (healthy)   5432/tcp
taxsim-tax-calculator   calculadora-image    Up 28 hours (healthy)   80/tcp, 8080-8081/tcp
```

The Next.js container (`taxsim-web`) is **not running**. Start it with:

```bash
docker compose up app -d
```

---

## Reference Artifacts (do not duplicate)

- Architecture decisions → `PROJECT_CONTEXT.md`
- API contracts → `API_CONTRACTS.md`
- DB schema → `apps/api/prisma/schema.prisma`
- Learned environment quirks → `.opencode/napkin.md`

---

## Next Task: Frontend Development

### Scope
Build the TaxSim web dashboard and simulation UI. The backend is complete; all frontend work can use **mock data aligned with the API contracts** in `API_CONTRACTS.md`.

### Technology Stack
- **Framework**: Next.js 15 (App Router) — already configured in `apps/web/`
- **UI**: `shadcn/ui` + Tailwind v4
- **Charts**: Recharts
- **Style**: Zinc palette, Linear/Vercel aesthetic (see `PROJECT_CONTEXT.md` section 9)

### Key Frontend Requirements
1. **Dashboard** with comparative tax charts:
   - IBS / CBS / IS breakdown
   - Comparative bar/line chart (current vs reform model)
   - Tax composition donut chart
   - Estimated tax savings summary
2. **Simulation Page** (stateless):
   - Form for `taxRegime` + items (`ncmCode`, `quantity`, `unitPrice`)
   - Displays current/reform/delta results matching `API_CONTRACTS.md` `POST /sales/simulate` response shape
3. **Sales List / Detail views**
4. **Auth UI** (login/register)

### Mock Data Strategy
Use static mock payloads that mirror the exact response shapes in `API_CONTRACTS.md`:
- `POST /sales/simulate` response
- `GET /sales` response
- `POST /sales` response
- `GET /products` response

Do **not** wire to backend APIs yet unless specifically requested. Focus on component structure, layout, and chart rendering.

### Environment Notes
- API runs on `http://localhost:3333`
- Web app should run on `http://localhost:3000`
- Start web container: `docker compose up app -d`

### Useful Commands
```bash
# Start web container
docker compose up app -d

# Watch web logs
docker compose logs app -f

# Restart web container
docker compose restart app
```

---

## Critical Decisions Already Made

- **Tax Calculator fail-fast**: 422 response when RFB service unavailable.
- **Zero-Prisma Tax Engine**: Internal engine receives plain JS objects; Orchestrator loads rules.
- **Parallel engine execution**: Orchestrator merges results by array index.
- **cClassTrib / cst**: Added to `tax_rules`, seeded with `"000001"` / `"000"` as MVP approximation.
- **municipioCode / uf**: Added to `Company`; required at registration.

---

## Gotchas for Frontend Work

- The `app` web container went down and may need `docker compose up app -d` to restart.
- All API-facing code should expect string numeric values (e.g., `"2500.00"`, `"0.0700"`) per `API_CONTRACTS.md`.
- The dashboard should emphasize the **tax reform differential**; avoid widget bloat (see `PROJECT_CONTEXT.md` section 9).

---

## Suggested Skills

- `interface-design` — enforce high-quality UI/UX standards, prevent generic AI-generated interfaces.
