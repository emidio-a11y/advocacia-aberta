/**
 * Recuperação por equivalência declarada.
 *
 * A busca deste motor é léxica: casa palavra com palavra. Isso deixa passar o
 * registro que descreve o instituto sem nomeá-lo — o Tema 1000 do STF trata de
 * nomeação de parente para cargo político e não escreve "nepotismo" em nenhum
 * campo, então some de uma consulta por essa palavra.
 *
 * A correção poderia ser silenciosa (jogar sinônimos dentro do índice, como os
 * temas repetitivos do STJ faziam), mas pesquisa jurídica que devolve resultado
 * sem dizer o que procurou não é conferível. Aqui a expansão é:
 *
 *  - **curada** — vem de `data/lexico_juridico.json`, com razão registrada e
 *    caso julgado no corpus de avaliação;
 *  - **posterior** — a busca direta roda primeiro e mantém sua ordem; nada muda
 *    de posição por causa da expansão;
 *  - **declarada** — a resposta diz quais termos foram acrescentados.
 */

import { createRequire } from "module";

import { tokenize } from "./utils.js";

const require = createRequire(import.meta.url);

export interface Equivalencia {
  readonly conceito: string;
  readonly termos: readonly string[];
  readonly razao: string;
}

const raw = require("../../data/lexico_juridico.json") as {
  _meta: { versao: number; atualizado_em: string };
  equivalencias: readonly Equivalencia[];
};

export const LEXICO_VERSAO = raw._meta.versao;
export const EQUIVALENCIAS = raw.equivalencias;

// Conceito e consulta são comparados já normalizados (sem acento, em minúsculas),
// no mesmo tokenizador que alimenta os índices — senão "citação" nunca casaria
// com "citacao" digitado sem acento.
const CONCEITOS = EQUIVALENCIAS.map((item) => ({
  equivalencia: item,
  tokens: tokenize(item.conceito),
}));

/** Equivalências cujo conceito aparece inteiro na consulta. */
export function equivalenciasDaConsulta(query: string): Equivalencia[] {
  const tokensConsulta = new Set(tokenize(query));
  return CONCEITOS.filter(
    ({ tokens }) =>
      tokens.length > 0 && tokens.every((token) => tokensConsulta.has(token)),
  ).map(({ equivalencia }) => equivalencia);
}

/** Consulta reescrita com os termos equivalentes, para a segunda passagem. */
export function consultaEquivalente(equivalencias: readonly Equivalencia[]): string {
  return equivalencias.flatMap((item) => item.termos).join(" ");
}

export interface BuscaAmpliada<T> {
  /** Resultados da consulta como foi escrita, na ordem original. */
  readonly diretos: readonly T[];
  /** Resultados que só apareceram pela equivalência, sempre depois dos diretos. */
  readonly porEquivalencia: readonly T[];
  /** Equivalências aplicadas; vazio quando a consulta não aciona nenhuma. */
  readonly equivalencias: readonly Equivalencia[];
  /** Resultados por equivalência que não couberam no limite pedido. */
  readonly omitidos: number;
}

/**
 * Roda a busca duas vezes: como o usuário escreveu e, se o léxico for acionado,
 * com os termos equivalentes. O total respeita o limite pedido — o que sobrar
 * é contado em `omitidos`, nunca descartado em silêncio.
 */
export function buscarComEquivalencias<T>(
  query: string,
  limit: number,
  buscar: (consulta: string, limite: number) => T[],
  identidade: (item: T) => string,
): BuscaAmpliada<T> {
  const diretos = buscar(query, limit);
  const equivalencias = equivalenciasDaConsulta(query);
  if (equivalencias.length === 0) {
    return { diretos, porEquivalencia: [], equivalencias: [], omitidos: 0 };
  }

  // Cada termo equivalente é buscado sozinho e o registro precisa aparecer em
  // mais de um deles para entrar. Uma consulta única com todos os termos
  // juntos traz qualquer coisa que case com o termo mais genérico do conjunto
  // ("cargo em comissão" sozinho devolve aposentadoria compulsória de
  // comissionado, que nada tem de nepotismo); exigir concorrência de termos
  // mantém o que a fonte descreve por perífrase e descarta a coincidência.
  const vistos = new Set(diretos.map(identidade));
  const termos = [...new Set(equivalencias.flatMap((item) => item.termos))];
  const candidatos = new Map<string, { item: T; termos: number; ordem: number }>();
  let ordem = 0;
  for (const termo of termos) {
    for (const item of buscar(termo, limit * 2)) {
      const id = identidade(item);
      if (vistos.has(id)) continue;
      const registrado = candidatos.get(id);
      if (registrado) registrado.termos += 1;
      else candidatos.set(id, { item, termos: 1, ordem: ordem++ });
    }
  }

  const minimoTermos = termos.length >= 3 ? 2 : 1;
  const novos = [...candidatos.values()]
    .filter((candidato) => candidato.termos >= minimoTermos)
    .sort((a, b) => b.termos - a.termos || a.ordem - b.ordem)
    .map((candidato) => candidato.item);
  const espaco = Math.max(0, limit - diretos.length);

  return {
    diretos,
    porEquivalencia: novos.slice(0, espaco),
    equivalencias,
    omitidos: Math.max(0, novos.length - espaco),
  };
}

/**
 * Nota que acompanha os resultados vindos da equivalência. Sem ela o usuário não
 * saberia que a busca procurou por termos que ele não escreveu.
 */
export function notaEquivalencia(
  equivalencias: readonly Equivalencia[],
  omitidos = 0,
): string {
  const descricao = equivalencias
    .map((item) => `**${item.conceito}** → ${item.termos.join(", ")}`)
    .join("; ");
  const sobra =
    omitidos > 0
      ? ` Outros ${omitidos} resultado(s) por equivalência ficaram fora do limite pedido — aumente \`limit\` para vê-los.`
      : "";
  return `> **Recuperado por equivalência declarada.** A consulta não trazia estes registros; a busca foi repetida com os termos que a fonte oficial usa: ${descricao}. Confira se o resultado corresponde à sua pergunta.${sobra}`;
}

const SEPARADOR = "\n---\n\n";

/**
 * Texto final: resultados diretos primeiro, depois a nota de equivalência e o
 * que ela trouxe. Sem equivalência acionada, a saída é idêntica à de antes.
 */
export function montarResposta<T>(
  resultado: BuscaAmpliada<T>,
  formatar: (item: T) => string,
): string {
  const diretos = resultado.diretos.map(formatar).join(SEPARADOR);
  const houveExpansao =
    resultado.porEquivalencia.length > 0 || resultado.omitidos > 0;
  if (!houveExpansao) return diretos;

  const nota = notaEquivalencia(resultado.equivalencias, resultado.omitidos);
  const extras = resultado.porEquivalencia.map(formatar).join(SEPARADOR);
  const blocos = [diretos, nota, extras].filter((bloco) => bloco.length > 0);
  return blocos.join(SEPARADOR);
}

/** Quantidade total de registros exibidos, para as mensagens de contagem. */
export function totalExibido<T>(resultado: BuscaAmpliada<T>): number {
  return resultado.diretos.length + resultado.porEquivalencia.length;
}
