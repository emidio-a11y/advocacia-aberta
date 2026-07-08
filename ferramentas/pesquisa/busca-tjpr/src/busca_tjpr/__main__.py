"""CLI mínima para busca no TJPR.

Uso:
    uv run --project <caminho> python -m busca_tjpr "<query>" [<pagina>]
"""

import asyncio
import os
import sys

from busca_tjpr.browser import browser_factory
from busca_tjpr.tjpr import TjprLegalPrecedent


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


async def _run(query: str, page: int) -> None:
    show = _truthy(os.environ.get("BUSCA_TJPR_SHOW"))
    slow_mo_raw = os.environ.get("BUSCA_TJPR_SLOWMO")
    slow_mo = float(slow_mo_raw) if slow_mo_raw else (200.0 if show else None)
    async with browser_factory(headless=not show, slow_mo=slow_mo) as browser:
        browser_page = await browser.new_page()
        results = await TjprLegalPrecedent.research(
            browser_page,
            summary_search_prompt=query,
            desired_page=page,
            demo=show,
        )
        if show:
            await asyncio.sleep(0.6)
            urls = [r.url for r in results if r.url][:10]
            for url in urls:
                await browser_page.goto(url, wait_until="domcontentloaded")
                await asyncio.sleep(0.6)
        print(f"Total: {len(results)} acórdão(s)\n")
        for i, r in enumerate(results, 1):
            print(f"=== {i} ===")
            if r.url:
                print(f"URL: {r.url}")
            print(r.summary)
            print()


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python -m busca_tjpr \"<query>\" [<pagina>]", file=sys.stderr)
        sys.exit(2)
    query = sys.argv[1]
    page = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    asyncio.run(_run(query, page))


if __name__ == "__main__":
    main()
