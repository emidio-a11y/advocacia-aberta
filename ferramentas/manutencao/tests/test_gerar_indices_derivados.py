from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[3]
MODULO_PATH = ROOT / "ferramentas" / "manutencao" / "gerar_indices_derivados.py"
SPEC = importlib.util.spec_from_file_location("gerar_indices_derivados", MODULO_PATH)
assert SPEC and SPEC.loader
gerador = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = gerador
SPEC.loader.exec_module(gerador)


class IndicesDerivadosTest(unittest.TestCase):
    def test_manifesto_declara_processo_local_sem_modelo(self) -> None:
        manifesto = gerador.carregar_manifesto()
        config = manifesto["gerador"]
        self.assertEqual(config["versao"], "1.0.0")
        self.assertEqual(config["algoritmo"], "tokens-significativos-v1")
        self.assertIsNone(config["modelo"])
        self.assertIsNone(config["prompt"])
        self.assertEqual(config["parametros"]["stopwords"], "pt-juridico-v1")

    def test_saidas_publicadas_sao_exatamente_reproduziveis(self) -> None:
        for destino, esperado in gerador.gerar_todos():
            atual = json.loads(destino.read_text(encoding="utf-8"))
            self.assertEqual(atual, esperado, destino.name)

    def test_indices_cobrem_as_fontes_em_relacao_um_para_um(self) -> None:
        manifesto = gerador.carregar_manifesto()
        diretorio = ROOT / manifesto["diretorio_dados"]
        for config in manifesto["conjuntos"].values():
            fonte_path = diretorio / config["fonte"]
            fonte = json.loads(fonte_path.read_text(encoding="utf-8"))
            registros = fonte[config["colecao"]]
            indice = json.loads((diretorio / config["destino"]).read_text(encoding="utf-8"))
            itens = indice["keywords"]
            self.assertEqual(len(itens), len(registros))
            self.assertEqual(
                {item["numero"] for item in itens.values()},
                {item["numero"] for item in registros.values()},
            )
            self.assertTrue(all(item["keywords"] for item in itens.values()))
            self.assertEqual(indice["_meta"]["fonte"]["sha256"], hashlib.sha256(fonte_path.read_bytes()).hexdigest())


if __name__ == "__main__":
    unittest.main()
