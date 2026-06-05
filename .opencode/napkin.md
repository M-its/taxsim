
## [2026-06-05] Volume api_node_modules persiste dependências antigas
**Context:** Atualizando @fastify/jwt de 9.x para 10.x
**Problem:** `docker compose build --no-cache` não atualiza o volume anônimo `api_node_modules` — ele monta por cima da imagem com a versão antiga
**Fix:** `docker compose down && docker volume rm taxsim_api_node_modules && docker compose up`
**Rule:** Sempre que atualizar uma dependência npm, remover o volume `taxsim_api_node_modules` antes de rebuildar
