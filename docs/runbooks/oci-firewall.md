# Exposição de rede em produção — OCI

Runbook manual e genérico. Endereços, nomes de instâncias, OCIDs, saídas brutas
e caminhos de restauração pertencem ao registro privado da operação. Os
placeholders abaixo não são configuração executável sem substituição.

## Política

- Aplicação: apenas Caddy em TCP 80/443 recebe tráfego público da stack.
- SSH: origem administrativa atual, restrita na camada OCI; trocar a regra
  quando o IP dinâmico mudar, sem manter a origem antiga.
- Web/API (3000/3333) e PostgreSQL sem publicação pública no compose de produção.
- Calculadora em infraestrutura privada, sem endereço público; ingresso fiscal
  permitido somente da aplicação. Conferir a VNIC além das regras de firewall.
- Security Lists são da subnet, não da VM. Auditar todas as listas efetivamente
  associadas e eventuais NSGs antes de inferir a política. Migração para NSG
  permanece fora do escopo deste fechamento.
- Publicações Docker atravessam FORWARD; uma regra INPUT/UFW sozinha pode não
  contê-las. Revisar DOCKER-USER ou regras nft equivalentes, sem misturar gestores.

O retorno operacional do responsável em 11/10/2026 confirmou remoção da origem
SSH antiga e ausência de container de restauração. O container de calculadora
incompatível com ARM foi parado, e posteriormente teve restart desabilitado;
nenhuma imagem/volume foi removido. Não há nova consulta ao servidor nesta rodada.
Na aplicação, o host aceita SSH e o bloqueio externo depende da Security List;
não alegar uma restrição por origem no firewall local que não foi aplicada.

## Antes de mudar regras

1. Manter sessão SSH aberta e validar um caminho de resgate pelo console serial.
2. Consultar subnet/VNIC, listas e NSGs efetivamente associados. Não executar
   atualização que substitua uma lista inteira sem preservar regras necessárias.
3. Salvar privadamente o estado atual do firewall e registrar como restaurá-lo.
4. Identificar o gerenciador ativo. Não ativar UFW remotamente só para seguir um
   exemplo; não instalar ou persistir regras sem avaliar risco de lockout.

Consultas de diagnóstico (não alteram regras):

```bash
sudo iptables -S INPUT
sudo iptables -S DOCKER-USER
sudo nft list ruleset
docker ps -a --format '{{.Names}} {{.Status}}'
```

Guardar saídas completas fora do repositório. Ausência de UFW não significa
ausência de controles OCI/nftables. Regras efetivas diferem por host.

## Troca de origem SSH

1. Obter o IP atual da máquina administrativa e confirmar imediatamente antes
   da mudança; usar `<ADMIN_IP>/32`, não faixa deduzida de IPs observados.
2. Adicionar primeiro a regra específica nova na Security List associada.
3. Se o firewall do host também restringir origem, alinhar a regra de forma
   segura antes de remover a antiga; no estado atual o filtro externo é OCI.
4. Abrir nova sessão a partir da origem permitida. Só então retirar a regra
   antiga e verificar que a origem antiga deixou de ter permissão.
5. Preservar ICMP necessário, tráfego privado e egressos; não ampliar todas as
   portas ou transformar liberação emergencial em configuração permanente.

## Verificação

Executar o script de uma máquina externa, com os alvos do registro privado:

```bash
./scripts/verify-firewall.sh --app-host <APP_PUBLIC_HOST> --calculator-host <APP_PUBLIC_HOST> --ssh-host <APP_PUBLIC_HOST> --expect-ssh open
```

Repetir de origem não autorizada com `--expect-ssh closed`. `closed`
e `filtered/timeout` indicam inacessibilidade no teste, não provam todas as
camadas. Usar a aplicação como alvo negativo da calculadora não prova acesso
privado nem ausência de endereço público na calculadora: conferir VNIC e testar
o caminho aplicação → calculadora separadamente. Conferir IPv6 se existir;
o script cobre IPv4/hostname. `--dry-run` valida o plano, não a rede.

Para recuperar lockout, usar o Console OCI autenticado e a conexão serial para
restaurar a regra específica ou o estado previamente salvo. Qualquer abertura
emergencial deve ser mínima, temporária e removida após recuperar acesso.
Não persistir mudanças sem testar segunda sessão e fluxo da aplicação.

## Evidência de release

Guardar em privado: revisão do compose sem publicações indevidas, regras OCI
finais, firewall efetivo, teste de origem autorizada/não autorizada e simulação
pela rede privada. Publicar apenas status resumido sem endereços ou saídas.
