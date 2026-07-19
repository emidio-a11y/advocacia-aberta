from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
MODULO_PATH = ROOT / "ferramentas" / "manutencao" / "validar_integridade.py"
SPEC = importlib.util.spec_from_file_location("validar_integridade", MODULO_PATH)
assert SPEC and SPEC.loader
validador = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = validador
SPEC.loader.exec_module(validador)


class ValidarIntegridadeTest(unittest.TestCase):
    def test_base_publicada_esta_integra(self) -> None:
        self.assertEqual(validador.validar(), [])

    def test_url_oficial_rejeita_dominio_e_esquema_errados(self) -> None:
        self.assertTrue(
            validador.url_oficial("https://www.planalto.gov.br/ccivil_03/x.htm")
        )
        self.assertFalse(validador.url_oficial("http://www.planalto.gov.br/x.htm"))
        self.assertFalse(validador.url_oficial("https://exemplo.com/x.htm"))
        self.assertFalse(validador.url_oficial(None))

    def test_corpus_com_referencia_inexistente_e_detectado(self) -> None:
        corpus = {
            "casos": [
                {
                    "id": "caso-quebrado",
                    "grupo": "legislacao",
                    "filtro": {"codigo": "CC"},
                    "relevantes": ["CC:999999"],
                    "obrigatorios": ["CC:999999"],
                },
                {
                    "id": "filtro-quebrado",
                    "grupo": "legislacao",
                    "filtro": {"codigo": "XYZ"},
                    "relevantes": ["XYZ:1"],
                    "obrigatorios": ["XYZ:1"],
                },
            ]
        }
        with tempfile.TemporaryDirectory() as temp:
            caminho = Path(temp) / "consultas.json"
            caminho.write_text(json.dumps(corpus), encoding="utf-8")
            original = validador.CONSULTAS
            validador.CONSULTAS = caminho
            try:
                problemas: list[str] = []
                validador.validar_corpus(
                    problemas,
                    {"CC": {"1", "2"}},
                    {"STJ": set(), "STF": set(), "SV": set()},
                    set(),
                    set(),
                )
            finally:
                validador.CONSULTAS = original
        self.assertTrue(any("CC:999999" in problema for problema in problemas))
        self.assertTrue(any("XYZ" in problema for problema in problemas))

    def test_hierarquia_de_registro_nao_retido_sem_contrato_e_detectada(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            data = Path(temp)
            lei = {
                "_meta": {
                    "codigo": "XX",
                    "nome": "Lei de teste",
                    "lei": "Lei 1/2026",
                    "url_base": "https://www.planalto.gov.br/x",
                    "total_artigos": 1,
                    "gerado_em": "2026-07-19",
                    "registros_retidos_sem_correspondencia": [],
                },
                "artigos": {
                    "1": {
                        "numero": "1",
                        "texto": "Art. 1º Teste.",
                        "url": "https://www.planalto.gov.br/x#1",
                        "hierarchy": {"titulo": "I"},
                        "prev": None,
                        "next": None,
                    }
                },
            }
            (data / "lei_xx.json").write_text(json.dumps(lei), encoding="utf-8")
            original = validador.DATA
            validador.DATA = data
            try:
                problemas: list[str] = []
                validador.validar_legislacao(problemas)
            finally:
                validador.DATA = original
        self.assertTrue(
            any("hierarquia ausente ou incompleta" in problema for problema in problemas)
        )


if __name__ == "__main__":
    unittest.main()
