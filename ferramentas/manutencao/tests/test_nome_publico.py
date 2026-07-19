from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[3]
IDENTIFICADOR_REMOVIDO = "del" + "fus"
IGNORAR = {".git", "node_modules", ".atualizacao-base-juridica"}
EXTENSOES_TEXTUAIS = {
    ".json", ".lock", ".md", ".py", ".sh", ".toml", ".ts", ".typ", ".yaml", ".yml"
}


class NomePublicoTest(unittest.TestCase):
    def test_identificador_removido_nao_aparece_em_caminhos_ou_textos(self) -> None:
        encontrados: list[str] = []
        for path in ROOT.rglob("*"):
            if any(parte in IGNORAR for parte in path.relative_to(ROOT).parts):
                continue
            relativo = str(path.relative_to(ROOT))
            if IDENTIFICADOR_REMOVIDO in relativo.casefold():
                encontrados.append(relativo)
            if not path.is_file() or path.suffix not in EXTENSOES_TEXTUAIS:
                continue
            try:
                texto = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if IDENTIFICADOR_REMOVIDO in texto.casefold():
                encontrados.append(relativo)
        self.assertEqual(encontrados, [])

    def test_vade_mecum_e_o_caminho_publicado(self) -> None:
        self.assertTrue((ROOT / "ferramentas" / "pesquisa" / "vade-mecum").is_dir())
        self.assertFalse((ROOT / "ferramentas" / "pesquisa" / ("busca_" + IDENTIFICADOR_REMOVIDO)).exists())


if __name__ == "__main__":
    unittest.main()
