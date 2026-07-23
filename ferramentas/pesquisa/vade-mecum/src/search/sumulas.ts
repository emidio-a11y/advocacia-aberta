import { createRequire } from "module";
import {
  descreverEfeitoSumula,
  FONTE_OFICIAL,
  NATUREZAS_DOCUMENTAIS,
} from "./taxonomia.js";
import {
  type BuscaAmpliada,
  buscarComEquivalencias,
} from "./lexico.js";
import { dataDoSnapshot, normalizeText, STOPWORDS } from "./utils.js";

const require = createRequire(import.meta.url);

// ── Types ──────────────────────────────────────────────────────────────────

export interface SumulaSTJ {
  readonly numero: number;
  readonly enunciado: string;
  readonly status:
    | "ativa"
    | "cancelada"
    | "alterada"
    | "superada"
    | "suspensa"
    | "inativa";
  readonly area: string;
  readonly tema: string;
  readonly orgao: string;
  readonly data: string;
  readonly url: string | null;
}

/**
 * Precedente representativo declarado pelo STF na página do enunciado: é a
 * própria Corte quem afirma que aquele julgado deu origem à súmula. Quando a
 * citação traz o tema de repercussão geral, o vínculo também vem da fonte.
 */
export interface PrecedenteSumula {
  readonly processo: string;
  readonly relator: string;
  readonly orgao: string;
  readonly julgamento: string;
  readonly publicacao: string;
  /** Inteiro teor no paginador do STF, como publicado na página da súmula. */
  readonly url: string;
  /** Consulta do acórdão por classe e número na jurisprudência do STF. */
  readonly consulta?: string;
  readonly temaRG?: number;
}

export interface SumulaSTF {
  readonly numero: number;
  readonly enunciado: string;
  readonly status: "ativa" | "cancelada" | "alterada" | "superada";
  readonly area: string;
  readonly data: string;
  readonly url: string;
  readonly precedentes?: readonly PrecedenteSumula[];
}

export interface SumulaVinculante {
  readonly numero: number;
  readonly enunciado: string;
  readonly status: "aprovada" | "cancelada" | "suspensa";
  readonly ramo: string;
  readonly data: string;
  readonly url: string;
  readonly precedentes?: readonly PrecedenteSumula[];
}

export type Tribunal = "STJ" | "STF" | "vinculante";

/** Valores aceitos no filtro de tribunal, para mensagens de erro e documentação. */
export const TRIBUNAIS_DISPONIVEIS = ["STJ", "STF", "vinculante"] as const;

/**
 * Interpreta o filtro de tribunal recebido de fora.
 *
 * `buscarSumulas` compara o tribunal por igualdade estrita, então "stj" em minúsculas
 * devolvia lista vazia — indistinguível de "não existe súmula sobre isso". Quem chama
 * o MCP é um modelo, que escreve o filtro como bem entende; aqui a caixa é normalizada
 * e o valor irreconhecível vira erro explícito, nunca silêncio.
 *
 * Devolve `null` quando o valor não corresponde a nenhum tribunal conhecido.
 */
export function normalizarTribunal(valor: string): Tribunal | "todos" | null {
  const limpo = valor.trim().toLowerCase();
  if (limpo === "" || limpo === "todos") return "todos";
  if (limpo === "stj") return "STJ";
  if (limpo === "stf") return "STF";
  if (limpo === "vinculante" || limpo === "vinculantes") return "vinculante";
  return null;
}

// ── Data loading ───────────────────────────────────────────────────────────

const stj = require("../../data/sumulas_stj.json") as {
  _meta: { gerado_em: string };
  sumulas: Record<string, SumulaSTJ>;
};
const stf = require("../../data/sumulas_stf.json") as {
  _meta: { gerado_em: string };
  sumulas: Record<string, SumulaSTF>;
};
const sv = require("../../data/sumulas_vinculantes.json") as {
  _meta: { gerado_em: string };
  sumulas: Record<string, SumulaVinculante>;
};
const kwStj = require("../../data/sumulas_keywords.json") as {
  keywords: Record<string, { numero: number; area: string; tema: string; keywords: string[] }>;
};
const kwStf = require("../../data/sumulas_stf_keywords.json") as {
  keywords: Record<string, { numero: number; area: string; keywords: string[] }>;
};

export const TOTAIS_SUMULAS = Object.freeze({
  STJ: Object.keys(stj.sumulas).length,
  STF: Object.keys(stf.sumulas).length,
  vinculantes: Object.keys(sv.sumulas).length,
});

export const SNAPSHOTS_SUMULAS = Object.freeze({
  STJ: dataDoSnapshot(stj._meta.gerado_em),
  STF: dataDoSnapshot(stf._meta.gerado_em),
  vinculante: dataDoSnapshot(sv._meta.gerado_em),
});

// ── Keyword indexes (lazy) ─────────────────────────────────────────────────

let idxStj: Map<string, Set<number>> | null = null;
let idxStf: Map<string, Set<number>> | null = null;

function buildIndex(
  keywords: Record<string, { numero: number; area: string; keywords: string[]; tema?: string }>
): Map<string, Set<number>> {
  const idx = new Map<string, Set<number>>();
  for (const d of Object.values(keywords)) {
    const words = [
      ...d.keywords.flatMap(k => normalizeText(k).split(/\s+/)),
      ...normalizeText(d.area).split(/\s+/),
      ...(d.tema ? normalizeText(d.tema).split(/\s+/) : []),
    ].filter(w => w.length >= 3);
    for (const w of words) {
      if (!idx.has(w)) idx.set(w, new Set());
      idx.get(w)!.add(d.numero);
    }
  }
  return idx;
}

function getIdxStj(): Map<string, Set<number>> {
  return idxStj ?? (idxStj = buildIndex(kwStj.keywords));
}

function getIdxStf(): Map<string, Set<number>> {
  return idxStf ?? (idxStf = buildIndex(kwStf.keywords));
}

// ── Generic ranked search ─────────────────────────────────────────────────

function rankByKeywords<T>(
  idx: Map<string, Set<number>>,
  lookup: (n: number) => T | null,
  query: string,
  limit: number
): T[] {
  const words = normalizeText(query)
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));

  if (words.length === 0) return [];

  const matchInfo = new Map<number, { score: number; matched: Set<string> }>();

  for (const word of words) {
    const exact = idx.get(word);
    if (exact) {
      for (const n of exact) {
        if (!matchInfo.has(n)) matchInfo.set(n, { score: 0, matched: new Set() });
        const m = matchInfo.get(n)!;
        m.score += 3;
        m.matched.add(word);
      }
    }
    if (word.length >= 4) {
      for (const [iw, nums] of idx.entries()) {
        if (iw.length >= 4 && (iw.startsWith(word.slice(0, 4)) || word.startsWith(iw.slice(0, 4)))) {
          for (const n of nums) {
            if (!matchInfo.has(n)) matchInfo.set(n, { score: 0, matched: new Set() });
            const m = matchInfo.get(n)!;
            if (!m.matched.has(word)) m.score += 1;
          }
        }
      }
    }
  }

  const minMatches = Math.max(1, Math.ceil(words.length * 0.4));

  return Array.from(matchInfo.entries())
    .filter(([, m]) => m.matched.size >= minMatches)
    .sort((a, b) => b[1].matched.size - a[1].matched.size || b[1].score - a[1].score)
    .slice(0, limit)
    .map(([n]) => lookup(n))
    .filter((x): x is T => x !== null);
}

// ── Vinculantes: full-text search (no pre-built keyword JSON) ─────────────

function searchVinculantes(query: string, limit: number): SumulaVinculante[] {
  const words = normalizeText(query)
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
  if (words.length === 0) return [];

  const scored: Array<{ sv: SumulaVinculante; score: number; matched: number }> = [];

  for (const s of Object.values(sv.sumulas)) {
    const norm = normalizeText(s.enunciado + " " + s.ramo);
    let score = 0;
    let matched = 0;
    for (const w of words) {
      if (norm.includes(w)) { score += 3; matched++; }
    }
    const minMatches = Math.max(1, Math.ceil(words.length * 0.4));
    if (matched >= minMatches) scored.push({ sv: s, score, matched });
  }

  return scored
    .sort((a, b) => b.matched - a.matched || b.score - a.score)
    .slice(0, limit)
    .map(x => x.sv);
}

// ── Public API ─────────────────────────────────────────────────────────────

export function buscarSumulas(
  query: string,
  tribunal: Tribunal | "todos",
  limit = 5
): Array<{ tribunal: Tribunal; sumula: SumulaSTJ | SumulaSTF | SumulaVinculante }> {
  const results: Array<{ tribunal: Tribunal; sumula: SumulaSTJ | SumulaSTF | SumulaVinculante }> = [];

  // Tenta lookup direto por número primeiro
  const numMatch = query.match(/^\s*(\d+)\s*$/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (tribunal === "STJ" || tribunal === "todos") {
      const s = stj.sumulas[String(n)];
      if (s) results.push({ tribunal: "STJ", sumula: s });
    }
    if (tribunal === "STF" || tribunal === "todos") {
      const s = stf.sumulas[String(n)];
      if (s) results.push({ tribunal: "STF", sumula: s });
    }
    if (tribunal === "vinculante" || tribunal === "todos") {
      const s = sv.sumulas[String(n)];
      if (s) results.push({ tribunal: "vinculante", sumula: s });
    }
    if (results.length > 0) return results;
  }

  // Busca por keywords
  if (tribunal === "STJ" || tribunal === "todos") {
    const found = rankByKeywords(getIdxStj(), n => stj.sumulas[String(n)] ?? null, query, limit);
    found.forEach(s => results.push({ tribunal: "STJ", sumula: s }));
  }
  if (tribunal === "STF" || tribunal === "todos") {
    const found = rankByKeywords(getIdxStf(), n => stf.sumulas[String(n)] ?? null, query, limit);
    found.forEach(s => results.push({ tribunal: "STF", sumula: s }));
  }
  if (tribunal === "vinculante" || tribunal === "todos") {
    const found = searchVinculantes(query, limit);
    found.forEach(s => results.push({ tribunal: "vinculante", sumula: s }));
  }

  return results.slice(0, limit * (tribunal === "todos" ? 3 : 1));
}

function formatFonteOficial(url: string | null): string {
  return url
    ? `\n**Proveniência:** ${FONTE_OFICIAL} — ${url}\n`
    : "\n**Proveniência:** link oficial não disponível neste snapshot.\n";
}

export type ResultadoSumula = {
  tribunal: Tribunal;
  sumula: SumulaSTJ | SumulaSTF | SumulaVinculante;
};

/** Busca com a expansão declarada do léxico (ver `lexico.ts`). */
export function buscarSumulasAmpliado(
  query: string,
  tribunal: Tribunal | "todos",
  limit = 5,
): BuscaAmpliada<ResultadoSumula> {
  return buscarComEquivalencias(
    query,
    limit,
    (consulta, limite) => buscarSumulas(consulta, tribunal, limite),
    ({ tribunal: t, sumula }) => `${t}:${sumula.numero}`,
  );
}

/**
 * Precedentes representativos, como o STF os publica na página da súmula.
 * Sem isto o usuário via o enunciado sem saber de onde ele veio e precisava
 * caçar os julgados em outra ferramenta.
 */
function formatPrecedentes(
  precedentes: readonly PrecedenteSumula[] | undefined,
): string {
  if (!precedentes || precedentes.length === 0) return "";
  const linhas = precedentes
    .map((item) => {
      const identificacao = [
        item.processo,
        item.relator ? `rel. min. ${item.relator}` : "",
        item.orgao,
        item.julgamento ? `j. ${item.julgamento}` : "",
        item.publicacao,
      ]
        .filter(Boolean)
        .join(", ");
      const tema = item.temaRG ? ` — Tema ${item.temaRG} de repercussão geral` : "";
      const links = [
        ["Inteiro teor", item.url],
        ["Consulta por classe e número", item.consulta],
      ]
        .filter((par): par is [string, string] => Boolean(par[1]))
        .map(([rotulo, url]) => `\n  ${rotulo}: ${url}`)
        .join("");
      return `- ${identificacao}${tema}${links}`;
    })
    .join("\n");
  return `\n\n**Precedentes representativos** (declarados pelo STF):\n${linhas}`;
}

// O rótulo da data acompanha o que cada fonte declara: no STF a página do
// enunciado informa "Data de aprovação ou publicação" — sem distinguir as duas —
// e no SCON do STJ a citação do verbete traz a data em que a súmula foi julgada.
// Um "Data:" genérico deixava o leitor supor o evento errado.
export function formatSumula(item: { tribunal: Tribunal; sumula: SumulaSTJ | SumulaSTF | SumulaVinculante }): string {
  const { tribunal, sumula } = item;

  if (tribunal === "vinculante") {
    const s = sumula as SumulaVinculante;
    const emoji = s.status === "aprovada" ? "✅" : "❌";
    const efeito = descreverEfeitoSumula(true, s.status);
    return `## 📋 ${NATUREZAS_DOCUMENTAIS.enunciadoSumular} | SÚMULA VINCULANTE STF

**Súmula Vinculante ${s.numero}** ${emoji} ${s.status.toUpperCase()}
**Efeito jurídico:** ${efeito}

**Enunciado:**
> ${s.enunciado}

**Ramo:** ${s.ramo} | **Aprovação/publicação:** ${s.data}${formatPrecedentes(s.precedentes)}${formatFonteOficial(s.url)}
`;
  }

  if (tribunal === "STF") {
    const s = sumula as SumulaSTF;
    const emoji = s.status === "ativa" ? "✅" : "⚠️";
    const efeito = descreverEfeitoSumula(false, s.status);
    return `## 📋 ${NATUREZAS_DOCUMENTAIS.enunciadoSumular} | SÚMULA STF

**Súmula ${s.numero} STF** ${emoji} ${s.status.toUpperCase()}
**Efeito jurídico:** ${efeito}

**Enunciado:**
> ${s.enunciado}

**Área:** ${s.area} | **Aprovação/publicação:** ${s.data}${formatPrecedentes(s.precedentes)}${formatFonteOficial(s.url)}
`;
  }

  const s = sumula as SumulaSTJ;
  const emoji = s.status === "ativa" ? "✅" : "❌";
  const efeito = descreverEfeitoSumula(false, s.status);
  return `## 📋 ${NATUREZAS_DOCUMENTAIS.enunciadoSumular} | SÚMULA STJ

**Súmula ${s.numero} STJ** ${emoji} ${s.status.toUpperCase()}
**Efeito jurídico:** ${efeito}

**Enunciado:**
> ${s.enunciado}

**Área:** ${s.area} | **Tema:** ${s.tema} | **Órgão:** ${s.orgao} | **Julgamento:** ${s.data}${formatFonteOficial(s.url)}
`;
}
