---
name: napkin
description: Persistent scratchpad for errors, surprises and learned preferences. Read at session start, write throughout. Prevents repeating mistakes across sessions.
---

## On session start

1. Read `.opencode/napkin.md` from the project root
2. Load all entries as active context — treat them as hard-won facts
3. If file does not exist, create it with empty sections

## During the session

Append to napkin when any of the following occur:
- A command fails with an unexpected error
- An assumption about the environment proves wrong
- The user corrects a behavior or preference
- A workaround is discovered for a known environment quirk
- A tool produces output in an unexpected format

## Entry format

```
## [YYYY-MM-DD] <short title>
**Context:** what was being attempted
**Problem:** what went wrong or surprised
**Fix:** what resolved it
**Rule:** one-line takeaway to avoid repeating this
```

## TaxSim-specific known facts (bootstrap)

Load these as initial napkin entries on first run:

- Docker port 8080/8081 reserved for tax-calculator container — never use for local servers
- Tax calculator image is `calculadora-image` (imported via `docker import`, not `docker pull`)
- Prisma migrations must run inside container: `docker compose run --rm api npx prisma migrate dev`
- `sale_items` intentionally has no `company_id` — multi-tenant isolation via parent `sales` table
- All monetary fields use `Decimal`, never `Float` or `number`
- Refresh token lives in HttpOnly cookie, never localStorage
