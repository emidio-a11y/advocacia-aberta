from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[3]
MODULO_PATH = ROOT / "ferramentas" / "manutencao" / "verificar_compatibilidade.py"
SPEC = importlib.util.spec_from_file_location("verificar_compatibilidade", MODULO_PATH)
assert SPEC and SPEC.loader
compatibilidade = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = compatibilidade
SPEC.loader.exec_module(compatibilidade)


class VerificadorCompatibilidadeTest(unittest.TestCase):
    def test_detecta_caminho_do_espelho_em_arquivo_auxiliar(self) -> None:
        erros = compatibilidade.validar_texto_portavel(
            Path(".agents/skills/exemplo/template.typ"),
            '#import "/.claude/skills/exemplo/template.typ": *',
        )
        self.assertEqual(len(erros), 1)
        self.assertIn("dependência do espelho", erros[0])

    def test_aceita_referencia_para_arquivo_canonico_existente(self) -> None:
        erros = compatibilidade.validar_texto_portavel(
            Path(".agents/skills/3.2-diagramar-peca/SKILL.md"),
            'Use "/.agents/skills/3.2-diagramar-peca/template.typ".',
        )
        self.assertEqual(erros, [])


if __name__ == "__main__":
    unittest.main()
