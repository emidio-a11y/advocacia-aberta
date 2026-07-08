import asyncio
import logging
import re
from typing import TYPE_CHECKING, Self

from pydantic import BaseModel, Field, field_validator

if TYPE_CHECKING:
    from patchright.async_api import Page

_LOGGER = logging.getLogger(__name__)

_WHITESPACE = re.compile(r"\s+")
_RESULT_START = re.compile(r"^\d+\.\s+\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}")


class TjprLegalPrecedent(BaseModel):
    """Acórdão do Tribunal de Justiça do Paraná."""

    url: str | None = Field(
        default=None,
        title="URL",
        description="Link direto para o acórdão no portal do tribunal.",
    )
    summary: str = Field(
        title="Ementa",
        description="Síntese do acórdão.",
        min_length=1,
    )

    @field_validator("summary")
    @classmethod
    def _strip_summary(cls, v: str) -> str:
        return v.strip()

    @classmethod
    async def research(
        cls,
        browser: "Page",
        *,
        summary_search_prompt: str,
        desired_page: int = 1,
        demo: bool = False,
    ) -> list[Self]:
        _LOGGER.info(
            "Iniciando busca de acórdãos do TJPR com critério %s",
            repr(summary_search_prompt),
        )

        await browser.goto(
            "https://portal.tjpr.jus.br/jurisprudencia/publico/pesquisa.do?actionType=iniciar",
            wait_until="domcontentloaded",
        )
        await browser.wait_for_selector("#criterioPesquisa", timeout=15000)

        prompt_field = browser.locator("#criterioPesquisa")
        if demo:
            await prompt_field.click()
            await prompt_field.press_sequentially(summary_search_prompt, delay=90)
            await asyncio.sleep(0.6)
        else:
            await prompt_field.fill(summary_search_prompt)
        await browser.locator("button.btn-icone-pesquisar").first.click()
        await browser.wait_for_selector("tr:has-text(\"Acórdão\")", timeout=20000)

        current_page = 1
        while current_page < desired_page:
            next_links = await browser.locator("a.arrowNextOn").all()
            if not next_links:
                _LOGGER.warning("Nenhum link de próxima página na página %d", current_page)
                break
            await next_links[0].click()
            await browser.wait_for_selector("tr:has-text(\"Acórdão\")", timeout=20000)
            current_page += 1

        rows_data = await browser.evaluate(
            """
            () => Array.from(document.querySelectorAll('tr'))
                .filter(r => {
                    const t = (r.textContent || '').toLowerCase();
                    return t.includes('acórdão') || t.includes('decisão monocrática');
                })
                .map(r => {
                    const link = r.querySelector('a.acordao.negrito');
                    return {
                        text: r.textContent.replace(/\\s+/g, ' ').trim(),
                        href: link ? link.getAttribute('href') : null,
                    };
                })
            """
        )

        _LOGGER.info("Encontrados %d acórdãos na página %d", len(rows_data), current_page)

        precedents: list[Self] = []
        for row in rows_data:
            text = row.get("text") or ""
            if not _RESULT_START.match(text):
                continue
            href_raw = row.get("href")
            href = f"https://portal.tjpr.jus.br{href_raw}" if href_raw else None
            precedents.append(cls(summary=text, url=href))

        return precedents
