import { describe, expect, test } from "bun:test";

import {
  buscarComEquivalencias,
  EQUIVALENCIAS,
  equivalenciasDaConsulta,
  montarResposta,
  notaEquivalencia,
} from "./lexico.js";
import { buscarSumulasAmpliado, buscarSumulas } from "./sumulas.js";
import { buscarTemasRG, buscarTemasRGAmpliado, formatTemaRG } from "./temas_rg_stf.js";

describe("léxico de equivalências declaradas", () => {
  test("cada entrada registra conceito, termos e razão", () => {
    expect(EQUIVALENCIAS.length).toBeGreaterThan(0);
    for (const item of EQUIVALENCIAS) {
      expect(item.conceito.trim()).not.toBe("");
      expect(item.termos.length).toBeGreaterThan(0);
      // Sem razão registrada, ninguém consegue auditar por que a busca foi
      // ampliada — é o que separa curadoria de palpite.
      expect(item.razao.trim().length).toBeGreaterThan(20);
    }
  });

  test("aciona pelo conceito, ignorando acento e caixa", () => {
    expect(equivalenciasDaConsulta("Nepotismo em cargo público")).toHaveLength(1);
    expect(equivalenciasDaConsulta("citacao por edital")).toHaveLength(1);
    expect(equivalenciasDaConsulta("prescrição intercorrente")).toEqual([]);
  });

  test("consulta sem gatilho devolve exatamente a busca direta", () => {
    const query = "ICMS na base de cálculo do PIS e da COFINS";
    const ampliada = buscarTemasRGAmpliado(query, 5);
    expect(ampliada.equivalencias).toEqual([]);
    expect(ampliada.porEquivalencia).toEqual([]);
    expect(ampliada.diretos.map((t) => t.numero)).toEqual(
      buscarTemasRG(query, 5).map((t) => t.numero),
    );
  });
});

describe("recuperação por equivalência", () => {
  test("preserva a ordem dos resultados diretos e acrescenta depois", () => {
    const diretos = buscarTemasRG("nepotismo", 5).map((t) => t.numero);
    const ampliada = buscarTemasRGAmpliado("nepotismo", 5);

    expect(ampliada.diretos.map((t) => t.numero)).toEqual(diretos);
    for (const tema of ampliada.porEquivalencia) {
      expect(diretos).not.toContain(tema.numero);
    }
  });

  test("recupera o Tema 1000, que não contém a palavra nepotismo", () => {
    // O tema trata de nomeação de cônjuge, companheiro ou parente para cargo
    // político: a fonte descreve a conduta sem nomeá-la, e a busca léxica
    // sozinha nunca o alcançava.
    const ampliada = buscarTemasRGAmpliado("nepotismo", 5);
    expect(ampliada.porEquivalencia.map((t) => t.numero)).toContain(1000);
    expect(buscarTemasRG("nepotismo", 20).map((t) => t.numero)).not.toContain(1000);
  });

  test("recupera a Súmula Vinculante 13 pela conduta descrita", () => {
    expect(buscarSumulas("nepotismo", "vinculante", 5)).toHaveLength(0);
    const ampliada = buscarSumulasAmpliado("nepotismo", "vinculante", 5);
    expect(ampliada.porEquivalencia.map(({ sumula }) => sumula.numero)).toContain(13);
  });

  test("exige concorrência de termos para evitar o casamento genérico", () => {
    // "cargo em comissão" sozinho traz aposentadoria compulsória de
    // comissionado — assunto alheio ao conceito consultado.
    const ampliada = buscarTemasRGAmpliado("nepotismo", 8);
    expect(ampliada.porEquivalencia.map((t) => t.numero)).not.toContain(763);
  });

  test("respeita o limite pedido e conta o que ficou de fora", () => {
    const ampliada = buscarTemasRGAmpliado("nepotismo", 3);
    expect(ampliada.diretos.length + ampliada.porEquivalencia.length).toBeLessThanOrEqual(3);
    expect(ampliada.omitidos).toBeGreaterThan(0);
  });

  test("a resposta declara os termos acrescentados", () => {
    const ampliada = buscarTemasRGAmpliado("nepotismo", 5);
    const resposta = montarResposta(ampliada, formatTemaRG);

    expect(resposta).toContain("Recuperado por equivalência declarada");
    expect(resposta).toContain("cônjuge");
    expect(resposta).toContain("Tema 1000 STF");
    // A declaração vem antes do resultado que ela trouxe, nunca depois.
    expect(resposta.indexOf("equivalência declarada")).toBeLessThan(
      resposta.indexOf("Tema 1000 STF"),
    );
  });

  test("sem expansão acionada, a resposta é só a lista direta", () => {
    const ampliada = buscarTemasRGAmpliado("tema 69", 1);
    expect(montarResposta(ampliada, formatTemaRG)).not.toContain(
      "equivalência declarada",
    );
  });

  test("a nota informa quantos resultados ficaram fora do limite", () => {
    const nota = notaEquivalencia(equivalenciasDaConsulta("nepotismo"), 4);
    expect(nota).toContain("Outros 4 resultado(s)");
    expect(notaEquivalencia(equivalenciasDaConsulta("nepotismo"))).not.toContain(
      "ficaram fora",
    );
  });

  test("função genérica não repete item já visto na busca direta", () => {
    const chamadas: string[] = [];
    const acervo: Record<string, string[]> = {
      nepotismo: ["a", "b"],
      cônjuge: ["b", "c"],
      companheiro: ["c", "d"],
      parente: ["c"],
    };
    const resultado = buscarComEquivalencias(
      "nepotismo",
      5,
      (consulta) => {
        chamadas.push(consulta);
        return acervo[consulta] ?? [];
      },
      (item) => item,
    );

    expect(chamadas[0]).toBe("nepotismo");
    expect(resultado.diretos).toEqual(["a", "b"]);
    // "c" aparece em três termos equivalentes; "d", em um só.
    expect(resultado.porEquivalencia).toEqual(["c"]);
  });
});
