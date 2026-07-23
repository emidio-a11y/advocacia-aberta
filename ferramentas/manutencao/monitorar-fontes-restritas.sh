#!/usr/bin/env bash
#
# Verificação das fontes que recusam requisição vinda de IP de datacenter.
#
# Por que existe: os portais do STF e o SCON do STJ respondem 403 a requisições
# vindas de nuvem. Não é bloqueio a "robô" — o mesmo curl, com o mesmo User-Agent,
# responde 200 de uma rede aceita e devolve o conteúdo íntegro. O que muda é a
# origem da requisição, não o cliente. Por isso o monitor agendado exclui estas
# famílias (declarando a exclusão no relatório) e elas são verificadas aqui, de uma
# máquina em rede aceita.
#
# Mantém a mesma disciplina do monitor: sinal barato, não prepara candidato e não
# toca em dado publicado. Quando há sinal, abre (ou comenta) uma issue no GitHub —
# a decisão de preparar e promover continua humana.
#
# Uso manual:
#   bash ferramentas/manutencao/monitorar-fontes-restritas.sh
#
# Agendamento semanal (launchd, systemd ou cron): ver base-juridica/ATUALIZACAO.md
#
# Requer: python3, curl e a CLI `gh` autenticada (só para abrir/comentar a issue).

set -euo pipefail

FAMILIAS="${FAMILIAS_RESTRITAS:-sumulas_stj,jurisprudencia_teses_stj,sumulas_stf,sumulas_vinculantes,temas_rg_stf,informativo_stf}"
TITULO="${ISSUE_TITULO:-Monitoramento da base jurídica (fontes restritas): sinais de mudança}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

json="$(mktemp)"
corpo="$(mktemp)"
trap 'rm -f "$json" "$corpo"' EXIT

echo "[fontes-restritas] $(date -u +%Y-%m-%dT%H:%M:%SZ) verificando: $FAMILIAS"

# Uma única passada nas fontes (o --json carrega tudo; o texto é formatado daqui).
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
linhas.append(f"Total: {d['mudancas']} sinal(is) de mudança, {d['erros']} erro(s).")
print("\n".join(linhas))
PY
)"

echo "$relatorio"

if [ "$mudancas" = "0" ] && [ "$erros" = "0" ]; then
  echo "[fontes-restritas] nenhum sinal; nada a reportar."
  exit 0
fi

if ! command -v gh >/dev/null 2>&1 || ! gh auth status >/dev/null 2>&1; then
  echo "[fontes-restritas] AVISO: gh ausente ou não autenticado — relatório acima não virou issue." >&2
  exit 1
fi

{
  echo "A verificação das fontes restritas encontrou **${mudancas} sinal(is) de mudança** e ${erros} erro(s)."
  echo
  echo '```'
  echo "$relatorio"
  echo '```'
  echo
  echo "Estas fontes ficam fora do monitor agendado porque os portais do STF e o SCON do STJ"
  echo "recusam requisição vinda de IP de datacenter; a verificação roda de uma rede aceita."
  echo
  echo "O sinal indica que vale preparar um candidato; a decisão de promover continua humana."
  echo "Procedimento completo em \`base-juridica/ATUALIZACAO.md\`."
} > "$corpo"

numero="$(gh issue list --state open --search "\"$TITULO\" in:title" \
  --json number --jq '.[0].number // empty')"
if [ -n "$numero" ]; then
  gh issue comment "$numero" --body-file "$corpo"
  echo "[fontes-restritas] comentado na issue #$numero"
else
  gh issue create --title "$TITULO" --body-file "$corpo"
fi
