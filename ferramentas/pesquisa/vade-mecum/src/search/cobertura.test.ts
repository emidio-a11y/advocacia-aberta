import { describe, expect, test } from "bun:test";

import { TOTAL_EDICOES_JT, TOTAL_TESES_STJ } from "./jt.js";
import {
  CODIGOS_DISPONIVEIS,
  listarLegislacaoDisponivel,
  normalizarCodigo,
  resolverCodigos,
  type CodigoCodigo,
} from "./legislacao.js";
import { TOTAIS_SUMULAS } from "./sumulas.js";
import { TOTAL_TEMAS_STJ } from "./temas.js";

const CODIGOS_ESPERADOS: CodigoCodigo[] = [
  "ADCT",
  "CC",
  "CDC",
  "CE",
  "CF",
  "CLT",
  "CP",
  "CPC",
  "CPP",
  "CTB",
  "CTN",
  "ECA",
  "ECID",
  "ED",
  "EDT",
  "EI",
  "EIND",
  "EIR",
  "EJUV",
  "EMET",
  "EMIL",
  "EMUS",
  "EOAB",
  "EPC",
  "EPD",
  "EREF",
  "ET",
  "LBPS",
  "LC123",
  "LD",
  "LEP",
  "LGPD",
  "LINDB",
  "LLC",
  "LMIG",
  "LMP",
];

describe("cobertura declarada pelo motor", () => {
  test("expõe exatamente os 36 diplomas que possuem arquivo", () => {
    expect([...CODIGOS_DISPONIVEIS].sort()).toEqual(CODIGOS_ESPERADOS);
    expect(resolverCodigos("todos").toSorted()).toEqual(CODIGOS_ESPERADOS);
  });

  test("aceita EI agora que o Estatuto da Pessoa Idosa tem base", () => {
    // Até a expansão de julho de 2026, EI era anunciado sem arquivo (BASE-003)
    // e precisava ser recusado; hoje o código resolve para a base promovida.
    expect(normalizarCodigo("EI")).toBe("EI");
    expect(normalizarCodigo("ei")).toBe("EI");
  });

  test("código desconhecido continua produzindo null", () => {
    expect(normalizarCodigo("XYZ")).toBeNull();
    expect(normalizarCodigo("E I")).toBeNull();
  });

  test("carrega e descreve todos os diplomas disponíveis", () => {
    const legislacoes = listarLegislacaoDisponivel();
    expect(legislacoes).toHaveLength(36);
    expect(legislacoes.reduce((total, item) => total + item.registros, 0)).toBe(
      9564,
    );
    for (const item of legislacoes) {
      expect(item.registros).toBeGreaterThan(0);
      expect(item.urlBase).toStartWith("https://www.planalto.gov.br/");
    }
  });

  test("deriva as quantidades das bases carregadas", () => {
    expect(TOTAIS_SUMULAS).toEqual({
      STJ: 676,
      STF: 736,
      vinculantes: 63,
    });
    expect(TOTAL_TESES_STJ).toBe(3508);
    expect(TOTAL_EDICOES_JT).toBe(283);
    expect(TOTAL_TEMAS_STJ).toBe(1462);
  });
});
