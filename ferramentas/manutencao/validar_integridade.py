#!/usr/bin/env python3
"""Valida esquemas, campos obrigatórios e referências cruzadas da base publicada.

Complementa o auditor estrutural (BASE-011): enquanto o auditor confere
contagens e cobertura do motor, este validador confere o contrato de cada
registro publicado (campos obrigatórios, URLs em domínios oficiais,
encadeamento prev/next), os manifestos versionados contra suas regras e as
referências cruzadas do corpus de avaliação (todo ID julgado precisa existir
na base correspondente).

Usa somente a biblioteca padrão. Sai com código 1 quando há qualquer problema.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parents[2]
MANUTENCAO = Path(__file__).resolve().parent
sys.path.insert(0, str(MANUTENCAO))

from atualizar_base_juridica import HOSTS_OFICIAIS  # noqa: E402
from gerar_expansao_legislacao import carregar_normas  # noqa: E402
from gerar_indices_derivados import carregar_manifesto  # noqa: E402

DATA = RAIZ / "ferramentas" / "pesquisa" / "vade-mecum" / "data"
FONTES = RAIZ / "base-juridica" / "fontes.json"
CONSULTAS = RAIZ / "ferramentas" / "pesquisa" / "vade-mecum" / "avaliacao" / "consultas.json"

CAMPOS_META_LEI = ("codigo", "nome", "lei", "url_base", "total_artigos", "gerado_em")
CAMPOS_HIERARQUIA = (
    "title", "title_name", "chapter", "chapter_name", "section", "section_name",
)
CAMPOS_SUMULA = ("numero", "enunciado", "status", "url")
CAMPOS_TESE = ("id", "edicao", "enunciado", "url")
CAMPOS_TEMA = ("numero", "situacao", "links")


def carregar(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as arquivo:
        return json.load(arquivo)


def url_oficial(url: Any) -> bool:
    if not isinstance(url, str):
        return False
    partes = urlparse(url)
    return (
        partes.scheme == "https"
        and (partes.hostname or "").lower() in HOSTS_OFICIAIS
    )


def validar_manifesto_fontes(problemas: list[str]) -> None:
    dados = carregar(FONTES)
    if dados.get("schema_version") != 1:
        problemas.append("fontes.json: schema_version desconhecida")
    politica = dados.get("politica_promocao", {})
    percentual = politica.get("limite_mudanca_percentual")
    minimo = politica.get("limite_mudanca_minimo")
    if not (isinstance(percentual, int) and 1 <= percentual <= 100):
        problemas.append("fontes.json: limite_mudanca_percentual fora de 1..100")
    if not (isinstance(minimo, int) and minimo >= 1):
        problemas.append("fontes.json: limite_mudanca_minimo inválido")
    for nome, conjunto in dados.get("conjuntos", {}).items():
        if not str(conjunto.get("familia", "")).strip():
            problemas.append(f"fontes.json: {nome} sem família")
        for fonte in conjunto.get("fontes", []):
            for campo in ("id", "url", "arquivo_bruto"):
                if not str(fonte.get(campo, "")).strip():
                    problemas.append(f"fontes.json: {nome} tem fonte sem {campo}")
            if not url_oficial(fonte.get("url")):
                problemas.append(
                    f"fontes.json: {nome}/{fonte.get('id')} com URL fora dos domínios oficiais"
                )
            destino = fonte.get("destino")
            if destino is not None and ("/" in destino or not destino.endswith(".json")):
                problemas.append(f"fontes.json: {nome}/{fonte.get('id')} com destino inválido")


def validar_manifestos_derivados(problemas: list[str]) -> None:
    try:
        carregar_manifesto()
    except (ValueError, KeyError, OSError) as erro:
        problemas.append(f"indices-derivados.json: {erro}")
    try:
        carregar_normas()
    except (ValueError, KeyError, OSError) as erro:
        problemas.append(f"expansao/normas.json: {erro}")


def validar_legislacao(problemas: list[str]) -> dict[str, set[str]]:
    artigos_por_codigo: dict[str, set[str]] = {}
    for path in sorted(DATA.glob("lei_*.json")):
        dados = carregar(path)
        meta = dados.get("_meta", {})
        for campo in CAMPOS_META_LEI:
            if campo not in meta:
                problemas.append(f"{path.name}: _meta sem {campo}")
        artigos = dados.get("artigos", {})
        codigo = str(meta.get("codigo", ""))
        artigos_por_codigo[codigo] = set(artigos)
        retidos = set(meta.get("registros_retidos_sem_correspondencia", []))
        ordem = list(artigos)
        for posicao, (chave, artigo) in enumerate(artigos.items()):
            rotulo = f"{path.name}:{chave}"
            if artigo.get("numero") != chave:
                problemas.append(f"{rotulo}: numero diverge da chave")
            if not str(artigo.get("texto", "")).strip():
                problemas.append(f"{rotulo}: texto vazio")
            if not url_oficial(artigo.get("url")):
                problemas.append(f"{rotulo}: URL fora dos domínios oficiais")
            hierarquia = artigo.get("hierarchy")
            # Registros retidos do snapshot legado preservam a forma antiga de
            # hierarquia (chaves titulo/capitulo/livro, com nomes reais); eles
            # são artefatos preservados e não precisam do contrato do pipeline.
            if not isinstance(hierarquia, dict) or (
                chave not in retidos
                and any(campo not in hierarquia for campo in CAMPOS_HIERARQUIA)
            ):
                problemas.append(f"{rotulo}: hierarquia ausente ou incompleta")
            anterior = ordem[posicao - 1] if posicao else None
            seguinte = ordem[posicao + 1] if posicao + 1 < len(ordem) else None
            if artigo.get("prev") != anterior or artigo.get("next") != seguinte:
                problemas.append(f"{rotulo}: encadeamento prev/next incoerente")
    return artigos_por_codigo


def validar_colecao(
    problemas: list[str],
    arquivo: str,
    colecao: str,
    campos: tuple[str, ...],
    chave_campo: str,
) -> set[str]:
    dados = carregar(DATA / arquivo)
    registros = dados.get(colecao, {})
    for chave, registro in registros.items():
        rotulo = f"{arquivo}:{chave}"
        for campo in campos:
            valor = registro.get(campo)
            if valor is None or (isinstance(valor, str) and not valor.strip()):
                problemas.append(f"{rotulo}: campo obrigatório vazio: {campo}")
        if str(registro.get(chave_campo)) != str(chave):
            problemas.append(f"{rotulo}: {chave_campo} diverge da chave")
        if "url" in campos and not url_oficial(registro.get("url")):
            problemas.append(f"{rotulo}: URL fora dos domínios oficiais")
    return set(registros)


def validar_temas(problemas: list[str]) -> set[str]:
    dados = carregar(DATA / "flash_temas_stj.json")
    temas = dados.get("temas", {})
    for chave, tema in temas.items():
        rotulo = f"flash_temas_stj.json:{chave}"
        for campo in CAMPOS_TEMA:
            if campo not in tema:
                problemas.append(f"{rotulo}: campo obrigatório ausente: {campo}")
        if str(tema.get("numero")) != str(chave):
            problemas.append(f"{rotulo}: numero diverge da chave")
        pagina = tema.get("links", {}).get("paginaTema")
        if not url_oficial(pagina):
            problemas.append(f"{rotulo}: página oficial ausente ou fora dos domínios")
    return set(temas)


def validar_corpus(
    problemas: list[str],
    artigos_por_codigo: dict[str, set[str]],
    sumulas: dict[str, set[str]],
    teses: set[str],
    temas: set[str],
) -> None:
    corpus = carregar(CONSULTAS)
    for caso in corpus.get("casos", []):
        rotulo = f"consultas.json:{caso.get('id')}"
        grupo = caso.get("grupo")
        codigo_filtro = caso.get("filtro", {}).get("codigo")
        if grupo == "legislacao" and codigo_filtro not in artigos_por_codigo:
            problemas.append(f"{rotulo}: filtro aponta diploma inexistente: {codigo_filtro}")
        for referencia in list(caso.get("relevantes", [])) + list(caso.get("obrigatorios", [])):
            if grupo == "legislacao":
                codigo, _, numero = referencia.partition(":")
                if numero not in artigos_por_codigo.get(codigo, set()):
                    problemas.append(f"{rotulo}: dispositivo inexistente: {referencia}")
            elif grupo in ("sumulas_stj", "sumulas_stf", "sumulas_vinculantes"):
                prefixo, _, numero = referencia.partition(":")
                if numero not in sumulas.get(prefixo, set()):
                    problemas.append(f"{rotulo}: súmula inexistente: {referencia}")
            elif grupo == "jurisprudencia_teses":
                if referencia not in teses:
                    problemas.append(f"{rotulo}: tese inexistente: {referencia}")
            elif grupo == "temas_repetitivos":
                numero = referencia.partition(":")[2]
                if numero not in temas:
                    problemas.append(f"{rotulo}: tema inexistente: {referencia}")


def validar() -> list[str]:
    problemas: list[str] = []
    validar_manifesto_fontes(problemas)
    validar_manifestos_derivados(problemas)
    artigos_por_codigo = validar_legislacao(problemas)
    sumulas = {
        "STJ": validar_colecao(
            problemas, "sumulas_stj.json", "sumulas", CAMPOS_SUMULA, "numero"
        ),
        "STF": validar_colecao(
            problemas, "sumulas_stf.json", "sumulas", CAMPOS_SUMULA, "numero"
        ),
        "SV": validar_colecao(
            problemas, "sumulas_vinculantes.json", "sumulas", CAMPOS_SUMULA, "numero"
        ),
    }
    teses = validar_colecao(problemas, "jt_stj.json", "teses", CAMPOS_TESE, "id")
    temas = validar_temas(problemas)
    validar_corpus(problemas, artigos_por_codigo, sumulas, teses, temas)
    return problemas


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="imprime os problemas em JSON")
    args = parser.parse_args()
    problemas = validar()
    if args.json:
        print(json.dumps({"problemas": problemas}, ensure_ascii=False, indent=2))
    elif problemas:
        print("Problemas de esquema ou integridade:")
        for problema in problemas:
            print(f"- {problema}")
    else:
        print("Esquemas, campos obrigatórios e referências cruzadas válidos.")
    return 1 if problemas else 0


if __name__ == "__main__":
    raise SystemExit(main())
