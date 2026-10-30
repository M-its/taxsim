# TaxSim Web

Frontend Next.js do TaxSim. Setup, arquitetura, verificações e limitações estão
no [README principal](../../README.md); contratos REST em
[docs/API_CONTRACTS.md](../../docs/API_CONTRACTS.md).

Use pnpm 10.17.1 e o lockfile desta aplicação. O ambiente padrão de
desenvolvimento é iniciado pela raiz com `./scripts/dev-up.sh`.
Não rode `next dev` sobre o mesmo `.next` de um build de produção; medições
Lighthouse usam build isolado e relatórios fora do checkout.
