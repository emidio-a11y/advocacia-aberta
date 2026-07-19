from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[3]
MODULO_PATH = ROOT / "ferramentas" / "manutencao" / "gerar_snapshots.py"
SPEC = importlib.util.spec_from_file_location("gerar_snapshots", MODULO_PATH)
assert SPEC and SPEC.loader
snapshots = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = snapshots
SPEC.loader.exec_module(snapshots)


class GerarSnapshotsTest(unittest.TestCase):
    def test_manifesto_publicado_esta_coerente(self) -> None:
        self.assertEqual(snapshots.verificar(), 0)

    def test_manifesto_cobre_todos_os_arquivos_rastreados(self) -> None:
        manifesto = snapshots.carregar_manifesto()
        rastreados = {nome for nome, _, _ in snapshots.arquivos_rastreados()}
        self.assertEqual(set(manifesto["arquivos"]), rastreados)
        for nome, entrada in manifesto["arquivos"].items():
            self.assertGreaterEqual(entrada["versao"], 1, nome)
            self.assertRegex(entrada["sha256"], r"^[0-9a-f]{64}$", nome)

    def test_resumo_de_mudancas_conta_e_amostra_ids(self) -> None:
        anterior = {
            "artigos": {
                "1": {"numero": "1", "texto": "antigo"},
                "2": {"numero": "2", "texto": "mantido"},
                "3": {"numero": "3", "texto": "removido"},
            }
        }
        atual = {
            "artigos": {
                "1": {"numero": "1", "texto": "novo"},
                "2": {"numero": "2", "texto": "mantido"},
                "4": {"numero": "4", "texto": "adicionado"},
            }
        }
        resumo = snapshots.resumo_mudancas(anterior, atual, "artigos")
        assert resumo is not None
        self.assertEqual(resumo["adicionados"], 1)
        self.assertEqual(resumo["removidos"], 1)
        self.assertEqual(resumo["alterados"], 1)
        self.assertEqual(resumo["amostra_adicionados"], ["4"])
        self.assertEqual(resumo["amostra_removidos"], ["3"])
        self.assertEqual(resumo["amostra_alterados"], ["1"])

    def test_primeira_versao_nao_tem_resumo(self) -> None:
        self.assertIsNone(snapshots.resumo_mudancas(None, {"artigos": {}}, "artigos"))

    def test_verificar_acusa_sha_divergente(self) -> None:
        manifesto = snapshots.carregar_manifesto()
        nome = next(iter(manifesto["arquivos"]))
        original = manifesto["arquivos"][nome]["sha256"]
        manifesto["arquivos"][nome]["sha256"] = "0" * 64
        conteudo_original = snapshots.MANIFESTO.read_text(encoding="utf-8")
        try:
            snapshots.MANIFESTO.write_text(
                snapshots.serializar(manifesto), encoding="utf-8"
            )
            self.assertEqual(snapshots.verificar(), 1)
        finally:
            snapshots.MANIFESTO.write_text(conteudo_original, encoding="utf-8")
        self.assertEqual(len(original), 64)


if __name__ == "__main__":
    unittest.main()
