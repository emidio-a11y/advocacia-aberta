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
  "CAG",
  "CBA",
  "CBT",
  "CC",
  "CDC",
  "CE",
  "CF",
  "CFLO",
  "CLT",
  "CMIN",
  "CP",
  "CPC",
  "CPM",
  "CPP",
  "CPPM",
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
  "FGTS",
  "L10101",
  "L11770",
  "L11788",
  "L12506",
  "L12815",
  "L13103",
  "L14442",
  "L14611",
  "L3207",
  "L4090",
  "L4749",
  "L4950A",
  "L5584",
  "L5889",
  "L6019",
  "L605",
  "L6321",
  "L6533",
  "L6615",
  "L7064",
  "L7418",
  "L7783",
  "L7998",
  "L9029",
  "L9601",
  "LBPS",
  "LC123",
  "LC150",
  "LD",
  "LEP",
  "LGPD",
  "LINDB",
  "LLC",
  "LMIG",
  "LMP",
];

describe("cobertura declarada pelo motor", () => {
  test("expõe exatamente os 70 diplomas que possuem arquivo", () => {
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
    expect(legislacoes).toHaveLength(70);
    expect(legislacoes.reduce((total, item) => total + item.registros, 0)).toBe(
      12057,
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
