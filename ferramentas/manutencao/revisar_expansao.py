#!/usr/bin/env python3
"""Relatório de revisão de uma execução da expansão legislativa.

Apoia — não substitui — a revisão humana antes da promoção. Para cada fonte do
conjunto informado, confere candidato e bruto da execução e imprime:

- total de artigos, primeiro e último;
- números-base ausentes na sequência 1..máximo;
- cabeçalho oficial da página (espécie, número e ano) comparado com o campo
  ``lei`` do manifesto da expansão — divergência é alerta;
- artigos cujo rótulo aponta para outra norma (excluídos pela transformação);
- primeiras palavras do art. 1º, para leitura de plausibilidade.

Uso:
    python3 ferramentas/manutencao/revisar_expansao.py \
        --execucao 2026-07-19-estatutos --conjunto legislacao_estatutos
"""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import re
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
NORMAS_PATH = ROOT / "base-juridica" / "expansao" / "normas.json"
FONTES_PATH = ROOT / "base-juridica" / "fontes.json"
AREA = ROOT / ".atualizacao-base-juridica"

_SPEC = importlib.util.spec_from_file_location(
    "atualizar_base_juridica_revisao",
    ROOT / "ferramentas" / "manutencao" / "atualizar_base_juridica.py",
)
assert _SPEC and _SPEC.loader
pipeline = importlib.util.module_from_spec(_SPEC)
sys.modules[_SPEC.name] = pipeline
_SPEC.loader.exec_module(pipeline)


CABECALHO = re.compile(
    r"(LEI COMPLEMENTAR|DECRETO-LEI|DECRETO|LEI)\s*N\s*[ºo°.]*\s*([\d.]+)"
    r".{0,40}?DE\s+\d{1,2}.{0,3}?\s*DE\s+[A-ZÇ]+\s+DE\s+(\d{4})",
    re.IGNORECASE | re.DOTALL,
)


def chave_artigo(valor: str) -> tuple[int, str]:
    base, _, sufixo = valor.partition("-")
    return int(base), sufixo


def digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor)


def cabecalho_da_pagina(texto: str) -> tuple[str, str, str] | None:
    match = CABECALHO.search(texto[:20000])
    if not match:
        return None
    especie = match.group(1).upper()
    rotulos = {
        "LEI COMPLEMENTAR": "Lei Complementar",
        "DECRETO-LEI": "Decreto-Lei",
        "DECRETO": "Decreto",
        "LEI": "Lei",
    }
    return rotulos[especie], match.group(2), match.group(3)


def artigos_com_rotulo_em_link(arvore: Any) -> list[str]:
    achados: list[str] = []
    paragrafos = [
        no
        for no in pipeline.buscar(arvore, tag="p")
        if not any(
            isinstance(filho, pipeline.Elemento) and filho.tag == "p"
            for filho in no.filhos
        )
    ]
    for paragrafo in paragrafos:
        simples = pipeline.texto_normalizado(pipeline.texto_elemento(paragrafo))
        match = pipeline.ARTIGO.match(simples)
        if not match:
            continue
        if not pipeline.tem_ancestral_riscado(paragrafo) and pipeline.rotulo_inicial_em_link(
            paragrafo
        ):
            achados.append(pipeline.numero_artigo(match))
    return achados


def revisar(execucao: str, conjunto_id: str) -> int:
    fontes_json = json.loads(FONTES_PATH.read_text(encoding="utf-8"))
    config = fontes_json["conjuntos"][conjunto_id]
    manifesto = json.loads(NORMAS_PATH.read_text(encoding="utf-8"))
    por_sigla = {norma["sigla"]: norma for norma in manifesto["normas"]}
    execucao_dir = AREA / execucao
    candidatos = execucao_dir / "candidatos"
    bruto_dir = execucao_dir / "bruto" / conjunto_id
    alertas = 0

    for fonte in config["fontes"]:
        sigla = fonte["codigo"]
        norma = por_sigla.get(sigla, {})
        candidato = json.loads((candidatos / fonte["destino"]).read_text(encoding="utf-8"))
        artigos = candidato["artigos"]
        numeros = sorted(artigos, key=chave_artigo)
        bases = {chave_artigo(numero)[0] for numero in numeros}
        faltantes = [n for n in range(1, max(bases) + 1) if n not in bases]

        texto_bruto = pipeline.decodificar_html(bruto_dir / fonte["arquivo_bruto"])
        arvore = pipeline.analisar_html(texto_bruto)
        # O título oficial vem entrecortado por tags no HTML; o cabeçalho é
        # procurado no texto renderizado da página.
        cabecalho = cabecalho_da_pagina(pipeline.texto_elemento(arvore))
        lei_manifesto = str(norma.get("lei", ""))
        problema_cabecalho = ""
        if cabecalho is None:
            problema_cabecalho = "cabeçalho oficial não reconhecido"
        else:
            especie, numero, ano = cabecalho
            especie_ok = lei_manifesto.startswith(especie + " ")
            numero_ok = digitos(lei_manifesto).startswith(digitos(numero))
            ano_ok = lei_manifesto.endswith("/" + ano)
            if not (especie_ok and numero_ok and ano_ok):
                problema_cabecalho = (
                    f"página informa {especie} {numero}/{ano}; manifesto diz {lei_manifesto!r}"
                )
        excluidos = artigos_com_rotulo_em_link(arvore)
        inicio = pipeline.texto_normalizado(artigos[numeros[0]]["texto"])[:90]

        linha = (
            f"{sigla:6s} {len(artigos):4d} artigos | 1º..{numeros[-1]:>6s}"
            f" | ausentes: {len(faltantes)}"
        )
        print(linha)
        print(f"       art. {numeros[0]}: {inicio}")
        if faltantes:
            print(f"       ! bases ausentes: {faltantes}")
        if problema_cabecalho:
            alertas += 1
            print(f"       ! {problema_cabecalho}")
        if excluidos:
            print(
                "       · rótulos com link para outra norma (excluídos): "
                + ", ".join(excluidos)
            )
    if alertas:
        print(f"\n{alertas} alerta(s) de cabeçalho — conferir antes de promover.")
    return 1 if alertas else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execucao", required=True)
    parser.add_argument("--conjunto", required=True)
    args = parser.parse_args()
    return revisar(args.execucao, args.conjunto)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError) as erro:
        print(f"erro: {erro}", file=sys.stderr)
        raise SystemExit(1)
