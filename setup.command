#!/usr/bin/env bash
# Dois cliques aqui no Finder (macOS) abrem o Terminal e preparam o ambiente.
cd "$(dirname "$0")"
bash setup.sh
echo
read -r -p "Tudo certo. Pressione Enter para fechar esta janela."
