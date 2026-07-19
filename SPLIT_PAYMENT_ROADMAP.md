# Split Payment — Roadmap Técnico
> TaxSim | Referência: NT 2025.002 e NT 2026.001

## O que foi implementado (MVP / Portfólio)

- Campos de fundação no schema Prisma (`ibsRetainedAmount`, `cbsRetainedAmount`,
  `splitPaymentStatus`, `splitPaymentResourceId`)
- Modelo `SplitPaymentEvent` para rastrear eventos futuros de retenção
- Exibição dos valores retidos estimados na tela de Simulação
- Documentação arquitetural no PROJECT_CONTEXT.md

---

## Roadmap — O que um produto real precisaria implementar

### Fase 1 — Emissão de NF-e com Split Payment (2026-2027)

Contexto: A NT 2025.002 define novos nós XML no layout da NF-e para informar
o resourceId gerado pela plataforma pública e os valores de IBS/CBS retidos.

O que implementar:
- Módulo de geração de XML NF-e com os novos campos detPag e splitPay
- Integração com a Plataforma de Serviços do Contribuinte (PSC) do governo
  para obter o resourceId antes da emissão
- Armazenamento da chave da NF-e vinculada a cada Sale

Complexidade: Alta — requer parceria com uma SEFAZ autorizadora e
certificado digital A1/A3.

### Fase 2 — Integração com PSPs (2027+)

Contexto: Os PSPs precisarão suportar o campo splitPayment na criação de
cobranças PIX/boleto.

O que implementar:
- Adapter pattern por PSP
- Envio dos metadados fiscais na criação da cobrança (resourceId, vIBS, vCBS)
- Tratamento de erros específicos de split

Complexidade: Média — depende da disponibilidade dos PSPs.

### Fase 3 — Webhooks de Retenção e Conciliação (2027+)

O que implementar:
- Endpoint POST /webhooks/split-payment com validação HMAC
- Dois eventos distintos: pagamento confirmado (valor líquido) e retenção confirmada
- Fila assíncrona (Bull/BullMQ) para idempotência
- Dashboard de conciliação por status de split

Complexidade: Alta.

### Fase 4 — Relatórios Fiscais (2027+)

O que implementar:
- Relatório mensal de IBS/CBS retidos por PSP
- DCTF-Web integrada com valores já retidos
- Export para SPED Fiscal e EFD-Contribuições

---

## Dependências Externas (fora do controle do TaxSim)

| Dependência | Status (Jul/2026) | Impacto |
|---|---|---|
| Plataforma PSC do governo | Em desenvolvimento | Bloqueia Fase 1 |
| PSPs implementando split | Não iniciado | Bloqueia Fase 2 |
| Regulamentação BACEN split PIX | Em consulta pública | Bloqueia Fase 2 |
| Layout NF-e com splitPay (SEFAZ) | NT 2026.001 publicada | Bloqueia Fase 1 |

---

## Referências

- NT 2025.002 — Vinculação de Pagamentos e Documentos Fiscais Eletrônicos
- NT 2026.001 — Split Payment: Layout NF-e e NFC-e
- LC 214/2025 — Lei Complementar da Reforma Tributária
- Resolução BACEN sobre Split Payment PIX (em elaboração)
