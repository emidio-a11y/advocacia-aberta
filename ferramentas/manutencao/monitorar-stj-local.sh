#!/usr/bin/env bash
#
# Verificação local das fontes do STJ (SCON) — súmulas e Jurisprudência em Teses.
#
# Por que existe: o WAF do SCON recusa requisição vinda de IP de nuvem. O runner do
# GitHub Actions e a VM recebem 403; a mesma coleta, com o mesmo cliente, responde 200
# de uma rede aceita. Não é bloqueio a "robô": é bloqueio por origem. Por isso o
# monitor agendado na nuvem exclui essas duas famílias e elas são verificadas aqui,
# de uma máquina cuja rede o STJ aceita.
#
# Mantém a mesma disciplina do monitor: sinal barato, não prepara candidato e não
# toca em dado publicado. Quando há sinal, abre (ou comenta) uma issue no GitHub —
# a decisão de preparar e promover continua humana.
#
# Uso manual:
#   bash ferramentas/manutencao/monitorar-stj-local.sh
#
# Agendamento semanal (launchd no macOS): ver base-juridica/ATUALIZACAO.md
#
# Requer: python3, curl e a CLI `gh` autenticada (só para abrir/comentar a issue).

set -euo pipefail

FAMILIAS="${STJ_FAMILIAS:-sumulas_stj,jurisprudencia_teses_stj}"
TITULO="${STJ_ISSUE_TITULO:-Monitoramento da base jurídica (STJ/SCON): sinais de mudança}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

json="$(mktemp)"
trap 'rm -f "$json"' EXIT

echo "[stj-local] $(date -u +%Y-%m-%dT%H:%M:%SZ) verificando: $FAMILIAS"

# Uma única passada na fonte (o --json carrega tudo; o texto é formatado daqui).
python3 ferramentas/manutencao/atualizar_base_juridica.py monitorar \
  --conjunto "$FAMILIAS" --json > "$json"

leia() { python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$json" "$1"; }
mudancas="$(leia mudancas)"
erros="$(leia erros)"

relatorio="$(python3 - "$json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))
linhas = [f"Verificação de fontes em {d['verificado_em']}"]
for conjunto_id, itens in d["conjuntos"].items():
    for item in itens:
        linhas.append(f"[{item['situacao']}] {conjunto_id}/{item['alvo']}: {item['detalhe']}")
linhas.append(
    f"Total: {d['mudancas']} sinal(is) de mudança, {d['erros']} erro(s)."
)
print("\n".join(linhas))
PY
)"

echo "$relatorio"

if [ "$mudancas" = "0" ] && [ "$erros" = "0" ]; then
  echo "[stj-local] nenhum sinal; nada a reportar."
  exit 0
fi

if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
  echo "[stj-local] AVISO: gh ausente ou não autenticado — relatório acima não virou issue." >&2
  exit 1
fi

corpo="$(mktemp)"
trap 'rm -f "$json" "$corpo"' EXIT
{
  echo "A verificação local do STJ encontrou **${mudancas} sinal(is) de mudança** e ${erros} erro(s)."
  echo
  echo '```'
  echo "$relatorio"
  echo '```'
  echo
  echo "Estas fontes ficam fora do monitor agendado na nuvem porque o WAF do SCON recusa IP de datacenter;"
  echo "a verificação roda de uma máquina cuja rede o STJ aceita."
  echo
  echo "O sinal indica que vale preparar um candidato; a decisão de promover continua humana."
  echo "Procedimento completo em \`base-juridica/ATUALIZACAO.md\`."
} > "$corpo"

numero="$(gh issue list --state open --search "\"$TITULO\" in:title" \
  --json number --jq '.[0].number // empty')"
if [ -n "$numero" ]; then
  gh issue comment "$numero" --body-file "$corpo"
  echo "[stj-local] comentado na issue #$numero"
else
  gh issue create --title "$TITULO" --body-file "$corpo"
fi
