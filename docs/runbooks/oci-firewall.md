# Runbook — exposição de rede em produção (OCI)

Este runbook fecha a exposição residual da API e da calculadora RFB sem
transformar uma mudança de firewall em risco de lockout.

> **Escopo:** os comandos e passos abaixo são operacionais e devem ser
> executados manualmente. O repositório não aplica regras na OCI nem nos hosts.

Referências oficiais: [conexão de console serial da
OCI](https://docs.oracle.com/en-us/iaas/Content/Compute/References/serialconsole.htm)
e [Security
Lists](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securitylists.htm).

## Estado desejado

| Destino | Origem | Portas TCP | Resultado |
|---|---|---:|---|
| VM ARM `<APP_PRIVATE_IP>` | Internet | 80, 443 | Permitido para o Caddy |
| VM ARM `<APP_PRIVATE_IP>` | IP administrativo atual `/32` | 22 | Permitido |
| VM ARM `<APP_PRIVATE_IP>` | Internet | 3000, 3333 | Bloqueado e sem publicação Docker |
| VM AMD `<CALCULATOR_PRIVATE_IP>` | IP administrativo atual `/32` | 22 | Permitido |
| VM AMD `<CALCULATOR_PRIVATE_IP>` | VM ARM `<APP_PRIVATE_IP>/32` | 8080, 8081 | Permitido pela VCN |
| VM AMD `<CALCULATOR_PRIVATE_IP>` | Qualquer outra origem | 8080, 8081 | Bloqueado |

O rate limiting do Fastify permanece ativo como defesa em profundidade.

## Regra arquitetural: a calculadora não recebe IP público

A VM AMD da calculadora RFB deve ser criada **sem IPv4 público e sem IPv6
público**. Ela é um serviço privado da VCN e só deve receber tráfego da VM ARM
pelos endereços privados, nas portas `8080` e `8081`.

> **Lição operacional:** a calculadora já teve um IP público atribuído. A
> correção efetiva foi remover esse IP público, não apenas ajustar a Security
> List. A lista já bloqueava o ingresso por omissão, mas manter um endereço
> público na VNIC preservava uma superfície de exposição desnecessária e
> dependente da configuração correta das regras de rede.

Ao criar, recriar ou substituir a instância da calculadora:

1. desative **Assign a public IPv4 address** na VNIC primária;
2. não atribua IPv6 público;
3. confirme no Console OCI que a VNIC mostra somente endereço privado;
4. configure a API para acessar o IP privado ou DNS privado da calculadora;
5. mantenha Security List/NSG e firewall do host como defesa em profundidade;
6. valide externamente que `8080` e `8081` continuam inacessíveis.

Uma Security List restritiva **não é justificativa para manter IP público** na
calculadora. Se uma instância recriada receber um por engano, remova-o antes de
considerar o ambiente pronto.

## Cuidado: Security List não é específica por VM

Security Lists são associadas à **subnet** e valem para todas as VNICs dessa
subnet. Antes de editar regras, abra cada instância em **Compute → Instances →
Attached VNICs → Subnet** e anote as listas associadas.

Se ARM e AMD compartilham subnet e Security List, as regras abaixo serão a união
das necessidades das duas VMs. A restrição específica da calculadora também
deve existir no firewall da VM AMD. Para isolamento por VNIC na camada OCI, use
Network Security Groups (NSGs) ou subnets separadas em uma mudança futura; não
migre para NSG durante este procedimento P0.

## 1. Pré-verificação e caminho de resgate

Não altere nenhuma regra até concluir estes passos:

1. Mantenha uma sessão SSH atual aberta.
2. No Console OCI, abra **Compute → Instances → `<APP_INSTANCE_NAME>`**.
3. Em **Resources → Console connection** (ou em **OS Management**), selecione
   **Launch Cloud Shell connection**.
4. Pressione `Enter` e confirme que a conexão serial é estabelecida e que a
   saída da instância aparece.
5. Confirme que a conta consegue editar a Security List usada pela subnet.
6. Tire capturas das regras atuais e registre os OCIDs da subnet e da Security
   List.
7. Na VM, salve o firewall atual sem modificá-lo:

```bash
stamp=$(date +%Y%m%d-%H%M%S)
sudo iptables-save | sudo tee "/root/iptables-before-taxsim-${stamp}.rules" >/dev/null
sudo iptables -S INPUT
sudo iptables -S DOCKER-USER
sudo ufw status verbose
sudo nft list ruleset
```

O teste já realizado na ARM confirmou conexão serial, boot visível, retorno
normal e manutenção do SSH. O GRUB usa `timeout=0`, portanto não foi pausado. A
VM AMD não foi reiniciada devido ao risco conhecido de pressão de memória.

## 2. Descobrir o IP administrativo atual

Execute na máquina da qual o SSH será usado, não dentro da VM:

```bash
curl -4 --fail --silent --show-error https://ifconfig.me/ip
```

Alternativa:

```bash
curl -4 --fail --silent --show-error https://api.ipify.org
```

Acrescente `/32` ao resultado. Exemplo: `<ADMIN_IP>/32`. Confirme que o IP
não mudou imediatamente antes de salvar a regra.

Se o provedor fornecer formalmente uma faixa CIDR estável, ela pode substituir
o `/32`, com maior superfície de exposição. Não tente deduzir a faixa a partir
de dois ou três IPs observados; use somente informação confirmada pelo provedor.

## 3. Alterar as regras no Console OCI

O Console é preferível neste procedimento porque `oci network security-list
update` substitui o conjunto completo de regras quando recebe JSON; um arquivo
incompleto pode apagar regras necessárias.

1. Abra **Networking → Virtual Cloud Networks → VCN do TaxSim**.
2. Abra a subnet das VMs e depois **Security Lists**.
3. Selecione a lista associada e abra **Ingress Rules**.
4. **Adicione primeiro** a nova regra SSH, sem remover a antiga:
   - Stateless: `No` (stateful);
   - Source type: `CIDR`;
   - Source: `<IP_ADMINISTRATIVO>/32`;
   - IP protocol: `TCP`;
   - Source port: `All`;
   - Destination port: `22`;
   - Description: `SSH administrativo - IP atual`.
5. Adicione ou confirme as regras públicas da ARM:
   - `0.0.0.0/0`, TCP, destino `80`;
   - `0.0.0.0/0`, TCP, destino `443`.
6. Adicione as regras privadas da calculadora:
   - `<APP_PRIVATE_IP>/32`, TCP, destino `8080`;
   - `<APP_PRIVATE_IP>/32`, TCP, destino `8081`.
7. Preserve as regras ICMP usadas para Path MTU Discovery e os egressos
   necessários. Não substitua a lista inteira por somente as regras acima.
8. Em uma segunda sessão, confirme que o SSH ainda abre pelo IP permitido.
9. Só depois remova regras de ingresso mais amplas que permitam:
   - SSH `22` a partir de `0.0.0.0/0`;
   - `3000`, `3333`, `8080` ou `8081` a partir da Internet;
   - todos os protocolos ou todas as portas a partir de `0.0.0.0/0`.

Se houver IPv6 público, repita a auditoria para regras IPv6. O script deste
repositório verifica somente IPv4/hostname.

## 4. Firewall do host

Primeiro identifique qual gerenciador está ativo. Não habilite UFW remotamente
se ele estiver inativo e não misture UFW, nftables e regras persistentes sem
entender a configuração existente.

### SSH com UFW já ativo

Adicione a permissão específica **antes** de apagar a permissão ampla:

```bash
admin_cidr="<ADMIN_IP>/32"
sudo ufw allow from "$admin_cidr" to any port 22 proto tcp comment 'SSH administrativo TaxSim'
sudo ufw status numbered
```

Abra uma segunda sessão SSH. Depois, remova pelo número exibido somente a regra
ampla de SSH:

```bash
sudo ufw delete NUMERO_DA_REGRA_AMPLA
```

### SSH com iptables

Se iptables for o firewall ativo, adicione primeiro o `ACCEPT`, depois o
`DROP`, e valide em uma segunda sessão:

```bash
admin_cidr="<ADMIN_IP>/32"
sudo iptables -I INPUT 1 -s "$admin_cidr" -p tcp --dport 22 -m conntrack --ctstate NEW -j ACCEPT
sudo iptables -I INPUT 2 -p tcp --dport 22 -m conntrack --ctstate NEW -j DROP
sudo iptables -S INPUT
```

Não torne as regras persistentes até validar o acesso e identificar o mecanismo
de persistência já usado pela VM (`netfilter-persistent`, unidade systemd ou
outro). Regras iptables não persistidas são perdidas após reboot.

### Calculadora publicada pelo Docker na VM AMD

Portas publicadas pelo Docker atravessam a chain `FORWARD`; limitar apenas
`INPUT` ou UFW pode não protegê-las. Na AMD, depois de salvar o estado atual:

```bash
app_private_ip="<APP_PRIVATE_IP>"
sudo iptables -C DOCKER-USER -s "$app_private_ip/32" -p tcp -m multiport --dports 8080,8081 -j ACCEPT 2>/dev/null || \
  sudo iptables -I DOCKER-USER 1 -s "$app_private_ip/32" -p tcp -m multiport --dports 8080,8081 -j ACCEPT

sudo iptables -C DOCKER-USER -p tcp -m multiport --dports 8080,8081 -j DROP 2>/dev/null || \
  sudo iptables -I DOCKER-USER 2 -p tcp -m multiport --dports 8080,8081 -j DROP

sudo iptables -S DOCKER-USER
```

Teste as chamadas da API na ARM antes de persistir essas regras.

## 5. Atualizar SSH quando o IP dinâmico mudar

1. Entre no Console OCI pelo navegador e confirme novamente a conexão serial.
2. Descubra o novo IP público da máquina administrativa.
3. **Adicione** a nova regra `/32` na Security List.
4. Adicione o novo `/32` no firewall do host.
5. Teste uma nova sessão SSH.
6. Remova o `/32` antigo somente depois do teste.

Essa ordem mantém sempre uma regra funcional durante a troca.

## 6. Rollback de lockout

### Security List da OCI

O console serial não ignora a Security List. Para restaurar temporariamente o
SSH na camada OCI, use o Console web autenticado:

1. **Networking → Virtual Cloud Networks → VCN → Subnet → Security List**.
2. Em **Ingress Rules**, adicione temporariamente uma regra stateful
   `0.0.0.0/0`, TCP, destino `22`.
3. Recupere o acesso, corrija o CIDR `/32` e remova imediatamente a regra
   temporária ampla.

### Firewall da VM via console serial

Se a Security List está correta e o bloqueio está no host, entre pela conexão
serial e libere SSH temporariamente no topo da chain:

```bash
sudo iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT
```

Com UFW ativo:

```bash
sudo ufw allow 22/tcp
```

Outra opção é restaurar o snapshot criado antes da mudança:

```bash
sudo iptables-restore < /root/iptables-before-taxsim-AAAAMMDD-HHMMSS.rules
```

Depois de recuperar o SSH, remova a liberação ampla e reaplique o `/32`
correto. Não deixe `0.0.0.0/0:22` como solução permanente.

## 7. Verificação externa

Depois do deploy do compose e das mudanças manuais, execute de uma máquina
externa no IP autorizado. Como a AMD não possui endereço público, use o
endpoint público da ARM como alvo negativo das portas `8080/8081`:

```bash
./scripts/verify-firewall.sh \
  --app-host <IP_OU_DNS_PUBLICO_ARM> \
  --calculator-host <IP_OU_DNS_PUBLICO_ARM> \
  --ssh-host <IP_OU_DNS_PUBLICO_ARM> \
  --expect-ssh open
```

Repita de uma origem não autorizada com `--expect-ssh closed`. O teste considera
`closed` e `filtered/timeout` igualmente inacessíveis, que é o resultado de
segurança esperado. Ele não prova que a origem privada `<APP_PRIVATE_IP>` alcança a
calculadora; valide isso de dentro da API/ARM com os endpoints de health ou uma
simulação controlada.

A ausência de endereço público na AMD deve ser confirmada separadamente nos
detalhes da VNIC no Console OCI ou pela CLI da OCI; um teste de portas não
comprova que nenhum IP público foi atribuído.

### Validação registrada em 24/09/2026

A verificação externa confirmou que somente o Caddy está alcançável
publicamente. A instância da calculadora estava sem IP público; por isso, o IP
público da aplicação foi usado também como alvo negativo para confirmar que as
portas da calculadora não estavam expostas naquele endpoint:

```text
OK       Caddy HTTP                          app-public.example:80 estado=open
OK       Caddy HTTPS                         app-public.example:443 estado=open
OK       Next.js sem publicacao              app-public.example:3000 estado=closed
OK       Fastify sem publicacao              app-public.example:3333 estado=closed
OK       Calculadora standard privada        app-public.example:8080 estado=closed
OK       Calculadora split privada           app-public.example:8081 estado=closed
OK       SSH conforme origem do teste        app-public.example:22 estado=open
Resultado: 7 verificacoes aprovadas.
```

Também foram executados testes de SSH a partir de duas origens: a origem
autorizada alcançou a VM e a origem não autorizada teve a conexão recusada.
Essas evidências confirmam a política de acesso externo, mas não substituem o
teste privado ARM → AMD mencionado acima.

Para validar apenas os argumentos e o plano localmente:

```bash
./scripts/verify-firewall.sh \
  --app-host app-public.example \
  --calculator-host app-public.example \
  --dry-run
```

## 8. Evidências para encerrar o P0

Registre, sem incluir segredos:

- saída de `docker compose -f docker-compose.prod.yml config` sem publicações
  de `3000/3333`;
- regras de ingresso finais da OCI;
- `iptables -S INPUT` e `iptables -S DOCKER-USER` (ou equivalente ativo);
- duas execuções do verificador: origem SSH autorizada e não autorizada;
- confirmação de que uma simulação ainda alcança a calculadora pela VCN.

Só marque a confirmação externa do roadmap como concluída depois dessas
evidências.
