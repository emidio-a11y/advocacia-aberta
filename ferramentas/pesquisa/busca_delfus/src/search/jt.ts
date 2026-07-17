import { createRequire } from "module";
import { normalizeText, STOPWORDS } from "./utils.js";

const require = createRequire(import.meta.url);

// ── Types ──────────────────────────────────────────────────────────────────

export interface TeseSTJ {
  readonly id: string;
  readonly edicao: number;
  readonly edicao_titulo: string;
  readonly tese_numero: number;
  readonly ramo_direito: string;
  readonly enunciado: string;
  readonly rito_especial: boolean;
  readonly data_publicacao: string;
  readonly url: string;
  readonly qtd_julgados: number;
}

// ── Data loading ───────────────────────────────────────────────────────────

const raw = require("../../data/jt_stj.json") as {
  _meta: { ramos_direito: Record<string, number> };
  teses: Record<string, TeseSTJ>;
};

const { teses } = raw;

// ── Public API ─────────────────────────────────────────────────────────────

export function buscarTeses(query: string, limit = 5): TeseSTJ[] {
  // Tenta extrair edição ("edição 142", "jt 142")
  const edicaoMatch = query.match(/edi[çc][ãa]o\s*(\d+)/i) ?? query.match(/\bjt\s*(\d+)/i);
  if (edicaoMatch) {
    const edicao = parseInt(edicaoMatch[1], 10);
    const found = Object.values(teses).filter(t => t.edicao === edicao);
    if (found.length > 0) return found.slice(0, limit);
  }

  // Busca por keywords
  const words = normalizeText(query)
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));

  if (words.length === 0) return [];

  const scored: Array<{ tese: TeseSTJ; score: number; matched: number }> = [];

  for (const tese of Object.values(teses)) {
    const enunciado = normalizeText(tese.enunciado);
    const titulo = normalizeText(tese.edicao_titulo);
    const ramo = normalizeText(tese.ramo_direito);

    let score = 0;
    let matched = 0;

    for (const w of words) {
      if (enunciado.includes(w)) { score += 3; matched++; }
      else if (titulo.includes(w)) { score += 2; matched++; }
      else if (ramo.includes(w)) { score += 1; matched++; }
    }

    const minMatches = Math.max(1, Math.ceil(words.length * 0.4));
    if (matched >= minMatches) scored.push({ tese, score, matched });
  }

  return scored
    .sort((a, b) => b.matched - a.matched || b.score - a.score)
    .slice(0, limit)
    .map(x => x.tese);
}

export function formatTese(tese: TeseSTJ): string {
  const rito = tese.rito_especial ? " | RITO ESPECIAL" : "";
  return `## 📋 FONTE PRIMÁRIA | JURISPRUDÊNCIA EM TESES STJ | ORIENTATIVA${rito}

**JT Edição ${tese.edicao} — Tese ${tese.tese_numero}**
**Força:** ORIENTATIVA — reflete entendimento predominante, NÃO vincula tribunais

**Tema:** ${tese.edicao_titulo}

**Enunciado:**
> ${tese.enunciado}

**Ramo:** ${tese.ramo_direito} | **Julgados:** ${tese.qtd_julgados} | **Publicação:** ${tese.data_publicacao}

**Fonte oficial:** ${tese.url}
`;
}
