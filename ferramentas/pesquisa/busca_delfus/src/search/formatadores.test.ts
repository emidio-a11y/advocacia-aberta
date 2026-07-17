import { describe, expect, test } from "bun:test";

import { buscarTeses, formatTese } from "./jt.js";
import { buscarSumulas, formatSumula, type Tribunal } from "./sumulas.js";
import { buscarTemas, formatTema } from "./temas.js";

describe("rastreabilidade dos formatadores", () => {
  for (const tribunal of ["STJ", "STF", "vinculante"] as const satisfies readonly Tribunal[]) {
    test(`inclui a fonte oficial da súmula ${tribunal}`, () => {
      const resultado = buscarSumulas("1", tribunal, 1)[0];
      expect(resultado).toBeDefined();

      const url = resultado.sumula.url;
      expect(url).toBeTruthy();
      expect(formatSumula(resultado)).toContain(url!);
    });
  }

  test("inclui a fonte oficial da Jurisprudência em Teses", () => {
    const tese = buscarTeses("edição 1", 1)[0];
    expect(tese).toBeDefined();
    expect(tese.url).toBeTruthy();
    expect(formatTese(tese)).toContain(tese.url);
  });

  test("inclui todos os links oficiais disponíveis do tema repetitivo", () => {
    const tema = buscarTemas("tema 1", 1)[0];
    expect(tema).toBeDefined();

    const links = Object.values(tema.links).filter(
      (url): url is string => Boolean(url),
    );
    expect(links.length).toBeGreaterThan(0);

    const formatado = formatTema(tema);
    for (const url of links) expect(formatado).toContain(url);
  });
});
