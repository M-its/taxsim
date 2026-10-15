# Limitações fiscais e de classificação

Estado do código em 15/10/2026. Demonstração técnica, sem validade fiscal ou
vínculo com a Receita Federal. Este documento descreve limites do software;
não é interpretação legal nem orientação para apuração de tributos.

## Cobertura

Regras globais versionadas em `apps/api/prisma/data/tax-rules-data.ts` cobrem um
subconjunto do catálogo e três regimes. São cenários didáticos de venda
doméstica comum; não uma árvore universal de determinação de CST/cClassTrib.
Não presumir que todo NCM vigente possui regra, nem que NCM sozinho determina
o enquadramento jurídico de uma operação.

A aplicação não modela de forma abrangente CFOP, benefícios, finalidade,
participante, origem/destino ou regimes especiais. Transferência, exportação,
doação, bonificação e operações especiais não são casos fiscais suportados.
Não há fallback silencioso de classificação ou de resultado da calculadora.

## O que é validado

- Produto novo: formato, existência e vigência do NCM no snapshot instalado.
- Produto editado: revalida NCM quando o código muda, preservando edição dos
  demais campos de registros legados.
- Simulação/venda: revalida todos os itens, catálogo e regra ativa antes da RFB.
  Configuração malformada é indisponibilidade interna, não erro fiscal do usuário.
- Simulação avulsa usa localização didática fixa; venda persistida usa a empresa.
- Resposta externa: schema, valores, itens e totais reconciliados. Isso detecta
  incompatibilidade de contrato, não certifica a correção jurídica do cálculo.

Catálogo NCM é importado manualmente de snapshot; não existe atualização
automática. Importação/seed são operações de dados que exigem revisão e
autorização específicas, nunca um passo automático de deploy ou uma forma de
corrigir produção sem preflight/backup.

## Exemplo da landing

Notebook, NCM 84713012, 1 × R$ 1.000, Lucro Real. A fixture usa o motor atual e
a mesma lógica de elegibilidade, mas a resposta reformada é **sintética**.
R$ 272,50 e R$ 10,00 são valores demonstrativos, não promessa de economia nem
resposta da RFB obtida ao abrir a landing. Dados/avisos e teste acompanham o
exemplo em `apps/web/src/lib/landing-example.json` e no teste
`apps/web/tests/accessibility/landing-proof.spec.ts`.

## Futuro

Atualização automática e classificação por contexto ficam pós-v1.0, com nova
decisão de produto, fontes versionadas, revisão fiscal e testes. Split Payment,
NF-e, PSPs e conciliação não são integrações operacionais desta entrega.
