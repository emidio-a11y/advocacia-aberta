from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from patchright.async_api import async_playwright

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

    from patchright.async_api import BrowserContext


@asynccontextmanager
async def browser_factory(
    headless: bool = True,
    slow_mo: float | None = None,
) -> "AsyncGenerator[BrowserContext, None]":
    async with (
        async_playwright() as playwright,
        await playwright.chromium.launch(headless=headless, slow_mo=slow_mo) as browser,
    ):
        yield await browser.new_context(
            extra_http_headers={
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
            }
        )
