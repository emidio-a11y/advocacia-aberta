import { createRequire } from "module";
import { normalizeText } from "./utils.js";

const require = createRequire(import.meta.url);

// ── Types ──────────────────────────────────────────────────────────────────

export interface Artigo {
  readonly numero: string;
  readonly texto: string;
  readonly url: string;
  readonly keywords?: string[];
}

interface CodigoJSON {
  _meta: { codigo: string; nome: string; lei: string; url_base: string; total_artigos: number };
  artigos: Record<string, Artigo>;
  indexes?: { keywords?: Record<string, number[]> };
}

export type CodigoCodigo = "CPC" | "CC" | "CP" | "CPP" | "CDC" | "CF" | "CLT" | "ADCT" | "CE" | "CTB" | "CTN" | "EI";

const CODIGOS: Record<CodigoCodigo, string> = {
  CPC:  "../../data/lei_cpc.json",
  CC:   "../../data/lei_cc.json",
  CP:   "../../data/lei_cp.json",
  CPP:  "../../data/lei_cpp.json",
  CDC:  "../../data/lei_cdc.json",
  CF:   "../../data/lei_cf.json",
  CLT:  "../../data/lei_clt.json",
  ADCT: "../../data/lei_adct.json",
  CE:   "../../data/lei_ce.json",
  CTB:  "../../data/lei_ctb.json",
  CTN:  "../../data/lei_ctn.json",
  EI:   "../../data/lei_ei.json",
};

const NOMES: Record<CodigoCodigo, string> = {
  CPC:  "Código de Processo Civil (Lei 13.105/2015)",
  CC:   "Código Civil (Lei 10.406/2002)",
  CP:   "Código Penal (Decreto-Lei 2.848/1940)",
  CPP:  "Código de Processo Penal (Decreto-Lei 3.689/1941)",
  CDC:  "Código de Defesa do Consumidor (Lei 8.078/1990)",
  CF:   "Constituição Federal de 1988",
  CLT:  "Consolidação das Leis do Trabalho",
  ADCT: "Ato das Disposições Constitucionais Transitórias",
  CE:   "Código Eleitoral (Lei 4.737/1965)",
  CTB:  "Código de Trânsito Brasileiro (Lei 9.503/1997)",
  CTN:  "Código Tributário Nacional (Lei 5.172/1966)",
  EI:   "Estatuto da Pessoa Idosa (Lei 10.741/2003)",
};

// ── Carregamento lazy ──────────────────────────────────────────────────────

const cache = new Map<CodigoCodigo, CodigoJSON>();

function loadCodigo(codigo: CodigoCodigo): CodigoJSON {
  if (cache.has(codigo)) return cache.get(codigo)!;
  const data = require(CODIGOS[codigo]) as CodigoJSON;
  cache.set(codigo, data);
  return data;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function buscarArtigo(
  codigo: CodigoCodigo,
  artigo: number | string
): Artigo | null {
  const data = loadCodigo(codigo);
  return data.artigos[String(artigo)] ?? null;
}

export function buscarLegislacao(
  query: string,
  codigo: CodigoCodigo | "todos",
  limit = 5
): Array<{ codigo: CodigoCodigo; artigo: Artigo }> {
  const codigos: CodigoCodigo[] = codigo === "todos"
    ? ["CPC", "CC", "CP", "CDC", "CF", "CLT"]
    : [codigo];

  // Tenta lookup direto "art. 702", "artigo 702", "702"
  const artMatch = query.match(/(?:art(?:igo)?\.?\s*)?(\d+)/i);
  if (artMatch && codigos.length === 1) {
    const art = buscarArtigo(codigos[0], artMatch[1]);
    if (art) return [{ codigo: codigos[0], artigo: art }];
  }

  // Busca por keywords
  const words = normalizeText(query).split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return [];

  const results: Array<{ codigo: CodigoCodigo; artigo: Artigo; score: number }> = [];

  for (const cod of codigos) {
    const data = loadCodigo(cod);
    const kwIdx = data.indexes?.keywords;

    if (kwIdx) {
      // Usa índice pré-computado
      const scores = new Map<string, number>();
      for (const w of words) {
        (kwIdx[w] ?? []).forEach(n => {
          const key = String(n);
          scores.set(key, (scores.get(key) ?? 0) + 2);
        });
        // Match parcial
        for (const [iw, nums] of Object.entries(kwIdx)) {
          if (iw.length >= 4 && w.length >= 4 && (iw.startsWith(w.slice(0, 4)) || w.startsWith(iw.slice(0, 4)))) {
            nums.forEach(n => {
              const key = String(n);
              scores.set(key, (scores.get(key) ?? 0) + 1);
            });
          }
        }
      }
      [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .forEach(([n, score]) => {
          const art = data.artigos[n];
          if (art) results.push({ codigo: cod, artigo: art, score });
        });
    } else {
      // Fulltext fallback
      for (const art of Object.values(data.artigos)) {
        const norm = normalizeText(art.texto);
        let score = 0;
        let matched = 0;
        for (const w of words) {
          if (norm.includes(w)) { score += 1; matched++; }
        }
        const minMatches = Math.max(1, Math.ceil(words.length * 0.4));
        if (matched >= minMatches) results.push({ codigo: cod, artigo: art, score });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ codigo: cod, artigo }) => ({ codigo: cod, artigo }));
}

export function formatArtigo(cod: CodigoCodigo, artigo: Artigo): string {
  const link = artigo.url ? `\n🔗 ${artigo.url}\n` : "";
  return `## 📋 FONTE PRIMÁRIA | LEGISLAÇÃO | ${cod}

**${NOMES[cod]}**
**Art. ${artigo.numero}**
${link}
${artigo.texto}
`;
}
