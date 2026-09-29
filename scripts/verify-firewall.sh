#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Verifica, a partir da maquina atual, as portas publicas esperadas do TaxSim.

Uso:
  ./scripts/verify-firewall.sh \
    --app-host HOST_PUBLICO_ARM \
    --calculator-host HOST_PUBLICO_AMD \
    [--ssh-host HOST]... \
    [--expect-ssh open|closed|skip] \
    [--timeout SEGUNDOS] \
    [--dry-run]

Expectativas:
  ARM: 80/443 abertas; 3000/3333 fechadas.
  AMD: 8080/8081 fechadas para a Internet.
  SSH: aberto quando executado do IP administrativo permitido; fechado de
       qualquer outra origem. Por padrao, testa a porta 22 do host ARM.

Exemplos:
  # Do IP administrativo permitido:
  ./scripts/verify-firewall.sh --app-host app-public.example \
    --calculator-host calculator-public.example --ssh-host app-public.example \
    --ssh-host calculator-public.example --expect-ssh open

  # De uma origem nao autorizada:
  ./scripts/verify-firewall.sh --app-host app-public.example \
    --calculator-host calculator-public.example --expect-ssh closed

  # Apenas mostra o plano; nao abre conexoes:
  ./scripts/verify-firewall.sh --app-host app-public.example \
    --calculator-host calculator-public.example --dry-run
EOF
}

app_host=""
calculator_host=""
expect_ssh="open"
connect_timeout=3
dry_run=false
declare -a ssh_hosts=()

while (($# > 0)); do
  case "$1" in
    --app-host)
      [[ $# -ge 2 ]] || { echo "ERRO: --app-host exige um valor" >&2; exit 2; }
      app_host=$2
      shift 2
      ;;
    --calculator-host)
      [[ $# -ge 2 ]] || { echo "ERRO: --calculator-host exige um valor" >&2; exit 2; }
      calculator_host=$2
      shift 2
      ;;
    --ssh-host)
      [[ $# -ge 2 ]] || { echo "ERRO: --ssh-host exige um valor" >&2; exit 2; }
      ssh_hosts+=("$2")
      shift 2
      ;;
    --expect-ssh)
      [[ $# -ge 2 ]] || { echo "ERRO: --expect-ssh exige um valor" >&2; exit 2; }
      expect_ssh=$2
      shift 2
      ;;
    --timeout)
      [[ $# -ge 2 ]] || { echo "ERRO: --timeout exige um valor" >&2; exit 2; }
      connect_timeout=$2
      shift 2
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERRO: argumento desconhecido: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

[[ -n "$app_host" ]] || { echo "ERRO: informe --app-host" >&2; exit 2; }
[[ -n "$calculator_host" ]] || { echo "ERRO: informe --calculator-host" >&2; exit 2; }
[[ "$expect_ssh" =~ ^(open|closed|skip)$ ]] || {
  echo "ERRO: --expect-ssh deve ser open, closed ou skip" >&2
  exit 2
}
[[ "$connect_timeout" =~ ^[1-9][0-9]*$ ]] || {
  echo "ERRO: --timeout deve ser um inteiro positivo" >&2
  exit 2
}

validate_host() {
  local host=$1
  # O verificador aceita IPv4 ou hostname. IPv6 deve ser verificado separadamente.
  [[ "$host" =~ ^[A-Za-z0-9.-]+$ ]] || {
    echo "ERRO: host invalido: $host" >&2
    exit 2
  }
}

validate_host "$app_host"
validate_host "$calculator_host"

if ((${#ssh_hosts[@]} == 0)); then
  ssh_hosts=("$app_host")
fi
for host in "${ssh_hosts[@]}"; do
  validate_host "$host"
done

if [[ "$dry_run" == false ]]; then
  command -v getent >/dev/null 2>&1 || {
    echo "ERRO: getent e necessario para validar a resolucao IPv4 dos hosts" >&2
    exit 2
  }

  for host in "$app_host" "$calculator_host" "${ssh_hosts[@]}"; do
    getent ahostsv4 "$host" >/dev/null 2>&1 || {
      echo "ERRO: host nao resolve para IPv4: $host" >&2
      exit 2
    }
  done
fi

if [[ "$dry_run" == false ]] && ! command -v nc >/dev/null 2>&1 && ! command -v timeout >/dev/null 2>&1; then
  echo "ERRO: instale netcat-openbsd (nc) ou coreutils (timeout) para executar os testes" >&2
  exit 2
fi

probe_port() {
  local host=$1
  local port=$2

  if command -v nc >/dev/null 2>&1; then
    nc -z -w "$connect_timeout" "$host" "$port" >/dev/null 2>&1
    return
  fi

  CHECK_HOST=$host CHECK_PORT=$port timeout "$connect_timeout" \
    bash -c 'exec 3<>"/dev/tcp/${CHECK_HOST}/${CHECK_PORT}"' >/dev/null 2>&1
}

failures=0
checks=0

check_port() {
  local host=$1
  local port=$2
  local expected=$3
  local description=$4
  local actual

  checks=$((checks + 1))

  if [[ "$dry_run" == true ]]; then
    printf 'DRY-RUN  %-35s %s:%s esperado=%s\n' "$description" "$host" "$port" "$expected"
    return
  fi

  if probe_port "$host" "$port"; then
    actual=open
  else
    actual=closed
  fi

  if [[ "$actual" == "$expected" ]]; then
    printf 'OK       %-35s %s:%s estado=%s\n' "$description" "$host" "$port" "$actual"
  else
    printf 'FALHA    %-35s %s:%s esperado=%s obtido=%s\n' \
      "$description" "$host" "$port" "$expected" "$actual" >&2
    failures=$((failures + 1))
  fi
}

check_port "$app_host" 80 open "Caddy HTTP"
check_port "$app_host" 443 open "Caddy HTTPS"
check_port "$app_host" 3000 closed "Next.js sem publicacao"
check_port "$app_host" 3333 closed "Fastify sem publicacao"
check_port "$calculator_host" 8080 closed "Calculadora standard privada"
check_port "$calculator_host" 8081 closed "Calculadora split privada"

if [[ "$expect_ssh" != skip ]]; then
  for host in "${ssh_hosts[@]}"; do
    check_port "$host" 22 "$expect_ssh" "SSH conforme origem do teste"
  done
fi

if [[ "$dry_run" == true ]]; then
  printf '\nPlano gerado: %d verificacoes; nenhuma conexao foi aberta.\n' "$checks"
  exit 0
fi

if ((failures > 0)); then
  printf '\nResultado: %d de %d verificacoes falharam.\n' "$failures" "$checks" >&2
  exit 1
fi

printf '\nResultado: %d verificacoes aprovadas.\n' "$checks"
