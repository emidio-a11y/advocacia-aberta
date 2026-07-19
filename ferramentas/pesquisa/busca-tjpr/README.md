# busca-tjpr

Busca de acórdãos no portal de jurisprudência do Tribunal de Justiça do Paraná
via scraping headless (`patchright` + Chromium).

Módulo independente — não depende do `brlaw_mcp_server`. Originalmente escrito
como extensão daquele fork, foi extraído para simplificar manutenção e permitir
`pyproject.toml` enxuto (só `patchright` e `pydantic`).

## Uso (CLI)

```bash
uv run --project ferramentas/pesquisa/busca-tjpr \
  python -m busca_tjpr "responsabilidade civil dentista" 1
```

Parâmetros: `<query>` e `<página>` (opcional, default 1).

A skill `/buscar-tjpr` usa este módulo.

## Uso (biblioteca)

```python
import asyncio
from busca_tjpr import TjprLegalPrecedent, browser_factory

async def main():
    async with browser_factory(headless=True) as browser:
        page = await browser.new_page()
        results = await TjprLegalPrecedent.research(
            page, summary_search_prompt="erro odontológico", desired_page=1
        )
        for r in results:
            print(r.url, r.summary)

asyncio.run(main())
```
