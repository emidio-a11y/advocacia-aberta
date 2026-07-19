from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[3]
MODULO_PATH = ROOT / "ferramentas" / "manutencao" / "gerar_expansao_legislacao.py"
SPEC = importlib.util.spec_from_file_location("gerar_expansao_legislacao", MODULO_PATH)
assert SPEC and SPEC.loader
gerador = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = gerador
SPEC.loader.exec_module(gerador)


class ManifestoExpansaoTest(unittest.TestCase):
    def test_manifesto_valido_sem_colisao_com_o_nucleo(self) -> None:
        normas = gerador.carregar_normas()
        self.assertGreater(len(normas), 200)
        siglas = [norma["sigla"] for norma in normas]
        self.assertEqual(len(siglas), len(set(siglas)))
        self.assertFalse(set(siglas) & gerador.siglas_do_nucleo())

    def test_nucleo_contem_os_diplomas_declarados_a_mao(self) -> None:
        nucleo = gerador.siglas_do_nucleo()
        self.assertIn("CPC", nucleo)
        self.assertIn("ECA", nucleo)

    def test_conjunto_esperado_e_deterministico_e_completo(self) -> None:
        normas = [
            {"sigla": "FGTS", "nome": "FGTS", "lei": "Lei 8.036/1990",
             "url": "https://www.planalto.gov.br/ccivil_03/leis/l8036consol.htm",
             "grupo": "esparsas_trabalhista"},
            {"sigla": "L605", "nome": "Repouso Semanal", "lei": "Lei 605/1949",
             "url": "https://www.planalto.gov.br/ccivil_03/leis/l0605.htm",
             "grupo": "esparsas_trabalhista"},
        ]
        conjunto = gerador.conjunto_esperado(normas)
        self.assertEqual(conjunto["adaptador"], "planalto_html_v1")
        self.assertEqual(
            [fonte["id"] for fonte in conjunto["fontes"]], ["fgts", "l605"]
        )
        self.assertEqual(conjunto["fontes"][0]["destino"], "lei_fgts.json")
        self.assertEqual(conjunto["fontes"][1]["arquivo_bruto"], "l605.html")

    def test_verificacao_de_sincronia_do_repositorio(self) -> None:
        self.assertEqual(gerador.verificar(), [])


if __name__ == "__main__":
    unittest.main()
