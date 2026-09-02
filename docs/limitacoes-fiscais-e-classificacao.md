# Limitações fiscais e classificação IBS/CBS

> Estado documentado em 1º de setembro de 2026.

## Resumo honesto

O TaxSim é um simulador educacional com um catálogo fiscal deliberadamente limitado. Ele **não é, no estado atual, um motor universal de determinação de `CST` e `cClassTrib`**.

O seed mantém 63 regras: 21 NCMs multiplicados pelos três regimes tributários modelados. Depois da revisão dos cinco NCMs divergentes, todas usam `CST 000 / cClassTrib 000001`, representando a venda doméstica comum integralmente tributada pelo IBS e pela CBS. As demais alíquotas continuam distintas conforme o cenário didático.

As regras ficam em `apps/api/prisma/data/tax-rules-data.ts`. A pesquisa legal da auditoria **não foi importada como catálogo nem como árvore de decisão**; ela corrigiu os valores das regras existentes.

## O que acontece para um novo usuário

`TaxRule` é uma tabela global, sem `companyId`, e vale para todos os tenants. No primeiro cadastro de empresa de uma instalação vazia, o backend carrega automaticamente as 63 regras globais. Portanto, um usuário novo não precisa digitar `CST` ou `cClassTrib` para os 21 NCMs cobertos: ele informa o NCM do produto e a simulação busca `NCM + regime tributário + status ACTIVE`.

A limitação surge quando:

- o produto usa NCM fora dos 21 cobertos;
- a operação não é uma venda doméstica comum;
- o enquadramento depende de destinatário, finalidade, CFOP, benefício, origem/destino, ZFM/ALC ou outro regime especial;
- a classificação depende de informação que o contrato atual não coleta.

Nesses casos, o serviço devolve erro 422 de regra fiscal ausente. Um fallback silencioso para `000/000001` esconderia a falta de contexto e poderia produzir uma simulação incorreta.

## NCM não determina sozinho o cClassTrib

O NCM filtra possibilidades, mas o `cClassTrib` descreve a situação jurídica da **operação e do item**. O mesmo veículo pode ser venda comum, venda beneficiada para taxista/PcD ou operação de projeto automotivo incentivado. Transferência, exportação, bonificação e doação mudam a classificação sem mudar o NCM.

A tabela oficial confirma que os três primeiros dígitos do `cClassTrib` são o `CST`. O Assistente da SVRS pede NCM, tipo de DFe e filtros sobre fornecedor, bem, regime e operação; seu próprio aviso exige verificar requisitos legais e exceções.

## Como outros ERPs reduzem trabalho manual

ERPs maduros normalmente combinam:

1. **Catálogo oficial sincronizado:** importam códigos, vigências, fundamentos e indicadores em vez de redigitar.
2. **Grupos fiscais:** muitos produtos compartilham um perfil IBS/CBS ou IS.
3. **Regras por contexto:** estabelecimento, natureza, CFOP, participante, item/NCM, origem, destino, finalidade e vigência participam da determinação.
4. **Hierarquia e exceções:** uma regra geral é herdada, regras específicas a sobrescrevem e ambiguidades exigem confirmação auditável.

Exemplos documentados: o Datasul relaciona cClassTrib a estabelecimento, natureza, participante, item, classificação fiscal e CFOP; o Sankhya usa grupos IBS/CBS e IS; a Bluesoft automatizou NCMs inequívocos e deixou itens ambíguos para decisão humana.

## Evolução recomendada

### 1. Catálogo oficial versionado

Criar `TaxClassification` separado de `TaxRule`, contendo código, CST, descrições, fundamento, anexo, percentuais/indicadores, tipos de DFe, vigência e versão da fonte.

A SVRS oferece a API JSON gratuita `/api/v1/consultas/classTrib`, mas exige autenticação mútua com certificado ICP-Brasil. A orientação oficial é no máximo uma sincronização diária. Em desenvolvimento, um snapshot oficial versionado pode substituir a chamada.

### 2. Cenário fiscal explícito

A simulação deve declarar ao menos: venda doméstica comum, transferência, exportação, bonificação, doação, administração pública, ZFM/ALC ou outra operação especial.

Somente **venda doméstica comum, sem benefício ou regime especial** pode usar `000/000001` como padrão explícito. Isso não é um fallback universal: é uma premissa selecionada.

### 3. Resolver por candidatos

O resolver deve receber NCM, DFe, cenário, emitente, destinatário, origem/destino, data e indicadores especiais. A saída deve registrar classificação ou candidatas, confiança (`DETERMINISTIC`, `SUGGESTED`, `REQUIRES_REVIEW`), fundamento, regra e versão do catálogo.

### 4. Grupos e overrides por tenant

O tenant mantém apenas exceções e confirmações, preferencialmente por grupo fiscal, com vigência, autor e justificativa. A base oficial cobre o catálogo; regras globais cobrem cenários comuns; decisões particulares ficam auditáveis.

## Correção aplicada ao mecanismo de seed

O helper usava `upsert` com `update: {}`. Assim, corrigir o arquivo atualizava instalações novas, mas não bancos já populados. O helper agora sincroniza `cClassTrib` e `cst` quando `prisma db seed` é executado novamente, sem sobrescrever as alíquotas existentes.

Isso **não altera automaticamente um banco em execução**. O operador ainda precisa executar:

```bash
docker compose exec api npx prisma db seed
```

Não foi adicionado fallback automático nem sincronização online nesta mudança.

## Como testar dentro das limitações atuais

1. Use um dos 21 NCMs de `tax-rules-data.ts`.
2. Selecione um dos três regimes cobertos.
3. Trate a simulação como venda doméstica comum, integralmente tributada e sem benefício.
4. Espere `CST 000 / cClassTrib 000001` para IBS/CBS.
5. Não use o resultado para transferência, exportação, bonificação, doação, taxista/PcD, ZFM/ALC, administração pública ou outro cenário especial.
6. Para demonstrar a limitação, use um NCM do catálogo fora das 21 regras: o esperado é erro 422 de regra ausente.
7. Apresente o resultado como simulação educacional, não como orientação fiscal.

## Fontes

- [Tabela vigente no Portal Nacional da NF-e](https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=%2FNJarYc9nus%3D)
- [Tabela cClassTrib da SVRS](https://dfe-portal.svrs.rs.gov.br/CFF/ClassificacaoTributaria)
- [Assistente por NCM e operação](https://dfe-portal.svrs.rs.gov.br/CFF/ClassificacaoTributariaNCM)
- [APIs oficiais do Conformidade Fácil](https://dfe-portal.svrs.rs.gov.br/Cff/Servicos)
- [Relacionamento cClassTrib no TOTVS Datasul](https://tdn.totvs.com/display/LDT/Cadastro+relacionamento+do+cClassTrib+-+html.mre.relacClassTrib)
- [Grupos IBS/CBS no Sankhya](https://ajuda.sankhya.com.br/hc/pt-br/articles/39351165606039-Cadastro-por-Grupo-de-IBS-e-CBS-para-Reforma-Tribut%C3%A1ria)
- [Automação e ambiguidades na Bluesoft](https://ajuda.bluesoft.com.br/sistema/novidade/novidade-fiscal-atualizacao-e-cadastro-de-aliquotas-cbs-e-ibs-para-a-reforma-tributaria/146106)
