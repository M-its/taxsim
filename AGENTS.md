# AGENTS.md — Workflow de Desenvolvimento

Este documento descreve como o TaxSim foi desenvolvido, incluindo o uso de
ferramentas de IA como aceleradoras de produtividade.

---

## Papéis no Desenvolvimento

**Mitsrael ([@M-its](https://github.com/M-its)) — Arquiteto de Software & Lead Developer**

- Definição de requisitos e escopo do produto
- Decisões arquiteturais (stack, modelagem de dados, contratos de API, segurança)
- Sessões de design técnico antes de qualquer implementação ("grill-me" sessions)
- Code review de todo o código gerado
- Debugging, correção de bugs e validação de comportamento
- Testes manuais e integração end-to-end
- Definição de padrões de qualidade e consistência do codebase

---

## Ferramentas de IA Utilizadas

### Claude (Anthropic) — Modelagem e Arquitetura
Usado como ferramenta de raciocínio arquitetural para:
- Avaliar trade-offs de decisões técnicas antes da implementação
- Conduzir sessões estruturadas de decisão (ex: contrato do Tax Engine,
  estratégia de autenticação, modelagem do Split Payment)
- Revisão e debugging de problemas complexos de ambiente (Docker, pnpm,
  TypeScript, Next.js App Router)
- Documentação técnica (`docs/PROJECT_CONTEXT.md`, `docs/API_CONTRACTS.md`, roadmaps)

### Kimi K2.7-code (Moonshot AI) via OpenCode — Geração de Código
Usado como ferramenta de aceleração de implementação para:
- Geração de código a partir de especificações técnicas já definidas
- Implementação de módulos com contratos previamente acordados
- Criação de componentes frontend seguindo design system definido

### Codex (OpenAI) — Implementação e Verificação

- Correções de sessão, interface, acessibilidade e descoberta pública a partir
  de decisões aprovadas pelo responsável
- Testes automatizados, typechecks, lint e medições locais reproduzíveis
- Organização de commits locais e documentação; integração e aceite de release
  continuam sob responsabilidade humana

---

## Fluxo de Trabalho

```
1. Requisito identificado
       ↓
2. Sessão de design técnico (decisões, trade-offs, contratos)
       ↓
3. Especificação detalhada do que deve ser implementado
       ↓
4. Geração de código via Kimi K2.7-code
       ↓
5. Code review, testes e validação manual
       ↓
6. Correção de bugs e ajustes de qualidade
       ↓
7. Commit
```

Commits locais podem ser preparados por agentes após autorização. A existência
de commit ou teste automatizado não comprova revisão humana: o responsável
revisa e valida as mudanças antes de qualquer integração ou publicação.

## Contexto para contribuições

- O README é a vitrine; ROADMAP registra escopo/estado; `docs/` guarda contratos,
  contexto vigente, limites fiscais e runbooks. Não criar PRODUCT.md ou DESIGN.md.
- Conferir contratos e código antes de reutilizar uma decisão histórica. Não
  descrever propostas futuras como funcionalidades já disponíveis.
- Preservar diffs anteriores; adicionar caminhos explícitos ao staging. Não
  incluir materiais locais ignorados nem executar seed/migration/deploy sem
  autorização específica.
- Documentos públicos não devem conter endereços de infraestrutura, caminhos
  operacionais, credenciais ou identificadores de backup. Evidências completas
  de operação e pesquisa/entrevista ficam fora do checkout, em armazenamento privado.

---

## Por que esse modelo?

Desenvolvedores sênior usam as melhores ferramentas disponíveis para entregar
software de qualidade com eficiência. O uso de IA como aceleradora de
produtividade — mantendo o arquiteto humano no controle das decisões —
reflete o estado atual da engenharia de software profissional.

O valor demonstrado neste projeto está nas **decisões técnicas**: escolha de
stack, modelagem de dados multi-tenant, estratégia de autenticação,
arquitetura do Tax Engine, integração com a calculadora oficial da RFB,
fundação do Split Payment e pipeline de deploy com Docker.
