# TaxSim — Documento 2: Segurança
> Continuação do Documento 0. Foco: a auditoria de segurança, os 8 findings, e como comunicar isso como maturidade, não como "achei bugs".

## Por que fazer uma auditoria de segurança em projeto de portfólio

Pergunta que vale antecipar: "por que gastar tempo com isso num projeto que não é produto real?" Resposta honesta: a maioria dos projetos de portfólio júnior nunca é testada adversarialmente — funciona no "caminho feliz" e para por aí. Uma auditoria real, com findings reais corrigidos (não hipotéticos), é evidência concreta de que o candidato pensa em segurança como parte do trabalho, não como afterthought.

## Ferramenta usada: Codex Security (OpenAI)

CLI open-source construído sobre o agente Codex, especializado em varrer repositórios em busca de vulnerabilidades com contexto de projeto (reduz falso-positivo em relação a SAST tradicional baseado só em padrões de regex).

**Detalhes técnicos do processo, caso perguntem:**
- Login via conta ChatGPT (não API key) — mais simples, sem custo adicional além da assinatura.
- Primeira tentativa com plano gratuito falhou (não completou nem a fase de leitura de arquivos). Segunda tentativa com um plano superior também não foi suficiente. Sucesso só com um plano com mais capacidade computacional.
- Cobertura: 115 de 167 arquivos do repositório (parcial — limite de tempo/custo do scan).
- Custo real do scan: ~$29 em tokens, mas gasto vinculado a um free trial de plano superior, sem custo direto ao usuário.

## Os 8 Findings — tabela resumo

| # | Finding | CWE | Severidade | Status |
|---|---|---|---|---|
| 1 | Exponentes decimais em campos monetários (`1e100000000`) causando risco de exaustão de memória | CWE-400, CWE-770 | Alta | ✅ Corrigido em Sales e Products |
| 2 | `redirectTo` pós-login sem validação — open redirect / DOM XSS | CWE-79, CWE-601 | Alta | ✅ Corrigido |
| 3 | Fallback de `JWT_SECRET` para valor público conhecido | CWE-798, CWE-321 | Média | ✅ Corrigido |
| 5 | Porta da API exposta diretamente, contornando o proxy e a terminação TLS | — | Média | ✅ Corrigido — Web/API sem publicação direta; somente Caddy exposto |
| 6 | Tráfego de autenticação sem TLS | — | Média | ✅ Corrigido |
| 8 | Logout não revogava sessão no servidor (path de cookie divergente) | CWE-613 | Baixa | ✅ Corrigido |
| 4 | Resposta da calculadora RFB confiada sem validação de schema em runtime | — | Média | ✅ Corrigido |
| 7 | Refresh tokens armazenados em texto puro no banco | — | Baixa | ✅ Corrigido |

## Finding 1 — detalhe técnico e por que a correção não é trivial

**O problema:** o schema de validação original usava `Number(val) > 0` para validar preço unitário. `Number()` no JavaScript aceita notação científica: `Number("1e100000000")` retorna `Infinity`, que ainda satisfaz `Infinity > 0`. O valor original era então entregue ao `Decimal` e podia chegar a `.toFixed(2)`, criando risco de alocação descontrolada a partir de um payload minúsculo — um clássico caso de "amplificação de payload pequeno".

**Por que a correção usa regex em vez de só validar o valor numérico:** a ideia é rejeitar a **sintaxe perigosa antes mesmo de qualquer conversão numérica acontecer**. O regex `^\d{1,9}(\.\d{1,2})?$` só aceita dígitos puros com até 2 casas decimais — `e`, `+`, `-` (usados em notação científica) nunca fazem parte do padrão, então strings perigosas são rejeitadas na validação de formato, antes de chegar perto de `Number()` ou `Decimal`.

**Sobre segurança do próprio regex:** o padrão escolhido é seguro contra ReDoS (Regular Expression Denial of Service) porque é ancorado (`^...$`), usa classes de caracteres simples, sem quantificadores aninhados nem alternância ambígua — não existe "explosão combinatória" possível nesse padrão específico.

**Limites de negócio adicionados junto:** máximo de 100 itens por venda/simulação, máximo de 10.000 de quantidade por item — não são limites de segurança "matemáticos", são limites de domínio (o projeto não é um ERP de alto volume, então um array de 50 mil itens já seria abuso, não uso legítimo).

O schema seguro existe hoje em `sales.schema.ts`:

```ts
const monetaryStringSchema = z
  .string()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, 'unitPrice must be a plain decimal string (e.g. 1234.56)')
  .refine((val) => Number(val) > 0, { message: 'unitPrice must be greater than zero' })
```

✅ DIVERGÊNCIA ENCERRADA: `products.schema.ts` passou a reutilizar o mesmo padrão restritivo no campo `unitPrice`. Quatro testes específicos rejeitam notação científica, `Infinity` e mais de duas casas decimais, além de aceitar um valor decimal normal. A proteção agora cobre tanto simulação/venda quanto o CRUD de produtos.

## Finding 2 — open redirect / DOM XSS

**O problema:** após login, o sistema lia `redirectTo` da query string e redirecionava sem validar. Um atacante poderia montar um link tipo `/login?redirectTo=//attacker.com` (URL protocol-relative, interpretada pelo navegador como "vá para outro domínio") ou `/login?redirectTo=javascript:alert(1)`.

**A correção:** função centralizada `safeRedirectPath()`, usada nos três pontos que liam esse parâmetro (`login`, `register`, `PublicRoute`). Ela só aceita caminhos que comecem com exatamente uma barra, rejeitando: URLs protocol-relative (`//`), qualquer scheme antes de um caractere de path válido (`javascript:`, `data:`), e backslashes (que alguns navegadores normalizam como forward slash, contornando validações ingênuas).

## Finding 3 — JWT secret com fallback conhecido

**O problema:** `secret: process.env.JWT_SECRET ?? '<FALLBACK_PUBLICO_DE_DESENVOLVIMENTO>'`. Se a variável de ambiente não estivesse definida em produção, o servidor subia silenciosamente assinando tokens com uma string pública e previsível — qualquer atacante poderia forjar tokens JWT válidos.

**A correção:** fail-fast — se `NODE_ENV === 'production'` e `JWT_SECRET` estiver ausente, o processo registra um log fatal e encerra imediatamente (`process.exit(1)`), em vez de subir com uma configuração insegura. Em desenvolvimento, o fallback continua existindo (com um `warn` no log), para não quebrar o fluxo local.

**Detalhe importante de defesa em profundidade:** o `docker-compose.prod.yml` já tinha uma proteção equivalente via sintaxe do Docker Compose (`${JWT_SECRET:?Set JWT_SECRET in .env}`), mas essa proteção não existiria se alguém rodasse a imagem standalone (via `Dockerfile.prod` diretamente, sem o compose) — o fail-fast em código cobre esse cenário que o compose sozinho não cobria.

## Findings 5 e 6 — tratados pela mesma mudança de infraestrutura

Ambos apontavam, essencialmente, para a mesma causa raiz: a API estava exposta diretamente numa porta pública (3333), sem terminação TLS e sem um ponto central de entrada. A introdução do Caddy versionou terminação HTTPS automática e roteamento por hostname:

```caddy
taxsim-web.duckdns.org {
    reverse_proxy app:3000
}

taxsim-api.duckdns.org {
    reverse_proxy api:3333
}
```

✅ DIVERGÊNCIA ENCERRADA: login e cadastro agora têm rate limiting dentro do Fastify, não no Caddy. A proteção acompanha a rota e limita cada IP a 5 tentativas por minuto. A sexta tentativa retorna 429, `Retry-After` e `RATE_LIMIT_EXCEEDED`; testes cobrem `/auth/login` e `/auth/register`.

```ts
const AUTH_RATE_LIMIT = { max: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 5), timeWindow: '1 minute' } as const
await app.register(rateLimit, { global: false, /* resposta 429 customizada */ })
app.post('/register', { config: { rateLimit: AUTH_RATE_LIMIT } }, registerHandler)
app.post('/login', { config: { rateLimit: AUTH_RATE_LIMIT } }, loginHandler)
```

O `docker-compose.prod.yml` não publica mais `3000` nem `3333` no host. Web e API permanecem acessíveis somente pela rede Docker interna, e o Caddy é o único serviço da stack principal com publicação de portas (`80/443`). A verificação externa do P0 #4 confirmou essas duas portas abertas e `3000`, `3333`, `8080` e `8081` inacessíveis no endereço público da aplicação. Security List e firewall do host continuam como defesa em profundidade e para restrição do SSH administrativo.

O Fastify confia em `X-Forwarded-For` somente quando a conexão chega por loopback ou faixas privadas do Docker. Isso evita que clientes públicos forjem facilmente o IP usado como chave do limiter, sem impedir que o Caddy encaminhe o IP original.

## Finding 8 — logout não revogava sessão

**O problema:** o cookie de refresh token tinha `Path=/auth/refresh`. Cookies só são enviados pelo navegador para rotas dentro do `Path` configurado — então, ao chamar `/auth/logout`, o navegador nunca enviava o cookie, e o handler de logout não tinha como saber qual token revogar no banco. O logout limpava o cookie do navegador (aparentando funcionar), mas o token continuava válido no servidor até expirar naturalmente (7 dias) ou até um "logout de todos os dispositivos".

**A correção:** ampliar o `Path` do cookie para `/auth` (ainda restrito ao namespace de autenticação, não vazando para o resto da aplicação) — assim ele passa a ser enviado corretamente também para `/auth/logout`.

**Efeito colateral encontrado durante a validação (vale contar como exemplo de rigor):** ao testar a correção, cookies antigos (emitidos antes do fix, com o `Path` anterior) coexistiam no navegador com os novos — como cookies são identificados por (nome, domínio, Path), dois cookies `refreshToken` com Paths diferentes não se substituem, e o navegador enviava os dois na mesma requisição, causando um 401 confuso. Diagnosticado inspecionando o header `Cookie` bruto da requisição. Resolvido limpando cookies manualmente durante o teste — não é um bug de produção real, é um artefato esperado de qualquer migração de escopo de cookie (usuários que estivessem logados exatamente no momento do deploy teriam esse sintoma até o cookie antigo expirar).

## Findings anteriormente documentados como limitação

**Finding 4 — validação da resposta da calculadora RFB: corrigido.** O cliente agora valida em runtime somente a projeção consumida da resposta com Zod, aceita as representações decimais observadas no Swagger e no serviço real e rejeita valores inválidos. Antes do merge fiscal, correlaciona `itens[].numero` e `objetos[].nObj` de forma bijetiva e reconcilia os totais oficiais de IBS e CBS separadamente.

A tolerância de reconciliação é `ceil(quantidadeDeItens / 2) × R$ 0,01` para cada tributo. Ela deriva do arredondamento `HALF_EVEN` independente por item e no agregado; chamadas reais confirmaram divergência de R$ 0,01 com 3 itens e de R$ 0,02 nos casos-limite com 3 e 4 itens. Respostas incompatíveis contam como falha do circuit breaker e geram somente logs estruturados seguros, sem payload fiscal.

**Finding 7 — refresh tokens em texto puro no banco: corrigido.** O armazenamento passou a usar HMAC-SHA-256 com pepper externo, com rotação, detecção de reuso e revogação das sessões do usuário.

⚠️ “Proveniência” e “schema” continuam sendo controles diferentes. A validação runtime impede que uma mudança estrutural seja incorporada silenciosamente ao cálculo; autenticação adicional do serviço, se um dia oferecida pela RFB, continuaria sendo uma camada separada.
