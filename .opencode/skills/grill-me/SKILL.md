---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use at the start of a new feature or when user says "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead of asking.

## TaxSim context

Before starting, read:
1. `PROJECT_CONTEXT.md` — architecture decisions already made (do not re-litigate these)
2. `API_CONTRACTS.md` — endpoint contracts already defined
3. `apps/api/prisma/schema.prisma` — data model already defined
4. `.opencode/napkin.md` — known environment quirks

Focus questions on what is NOT yet decided. Do not ask about decisions already documented.
