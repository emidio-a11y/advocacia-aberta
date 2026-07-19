#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
FONTE="${REPO_ROOT}/.agents/skills/"

if [ ! -d "${FONTE}" ]; then
  echo "Erro: fonte canônica não encontrada em .agents/skills/." >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "Erro: rsync não está instalado." >&2
  exit 1
fi

# Todos os espelhos são gerados a partir da fonte canônica .agents/skills/.
# Nunca editar um espelho à mão — editar a fonte e rodar este script.
sincronizar() {
  local destino="$1"
  mkdir -p "${destino}"
  rsync -a --delete --exclude='.DS_Store' "${FONTE}" "${destino}"
}

sincronizar "${REPO_ROOT}/.claude/skills/"   # adaptador Claude Code (nível projeto)
sincronizar "${REPO_ROOT}/skills/"           # adaptador de plugin (lido via .claude-plugin/)

echo "Skills sincronizadas: .agents/skills/ → .claude/skills/ e → skills/"
python3 "${SCRIPT_DIR}/verificar_compatibilidade.py"
