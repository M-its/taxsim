---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: What will the next session be used for?
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it to a path produced by `mktemp -t handoff-XXXXXX.md` (read the file before you write to it).

Suggest the skills to be used, if any, by the next session.

Do not duplicate content already captured in other artifacts. Reference them by path instead:
- Architecture decisions → `PROJECT_CONTEXT.md`
- API contracts → `API_CONTRACTS.md`
- DB schema → `apps/api/prisma/schema.prisma`
- Learned environment quirks → `.opencode/napkin.md`

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## TaxSim handoff must always include

- Current implementation status (what is done, what is in progress)
- Last command run and its result
- Containers currently running (`docker compose ps` output)
- Next task with enough context to start immediately
