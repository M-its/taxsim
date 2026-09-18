# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-09-13] Preserve pre-existing worktree changes**
   Do instead: inspect `git status` and targeted diffs before editing; never overwrite unrelated user work.
2. **[2026-09-13] Production migrations require explicit review**
   Do instead: generate Prisma migrations with `--create-only`, show the SQL, and never run `migrate deploy` unless explicitly requested.

## Shell & Command Reliability
1. **[2026-09-13] Run project commands through Linux/bash**
   Do instead: invoke commands in Ubuntu WSL and avoid PowerShell-native project operations.
2. **[2026-09-13] Use local Docker images when WSL Node is unavailable**
   Do instead: run Prisma, Vitest, and `tsc --noEmit` in an ephemeral local API/Node container without modifying real `.env` files.

## Domain Behavior Guardrails
1. **[2026-09-13] Refresh-token migration is a hard session reset**
   Do instead: retain the approved `DELETE FROM "refresh_tokens"` before replacing plaintext `token` with required `tokenHash`.
2. **[2026-09-13] Refresh-token reuse must revoke every user session**
   Do instead: preserve revoked token rows, detect re-presentation atomically, delete all tokens for the user, and expose only a generic 401.

## User Directives
1. **[2026-09-13] Keep secrets out of tracked and real env files**
   Do instead: document placeholders only and ask the user to generate deployment secrets themselves.
