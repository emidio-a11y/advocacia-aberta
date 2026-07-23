import { createRequire } from "module";
import {
  descreverEfeitoTemaRG,
  FONTE_OFICIAL,
  meritoDecididoRG,
  NATUREZAS_DOCUMENTAIS,
} from "./taxonomia.js";
import {
  type BuscaAmpliada,
  buscarComEquivalencias,
} from "./lexico.js";
import { dataDoSnapshot, tokenize } from "./utils.js";

const require = createRequire(import.meta.url);

// ── Types ──────────────────────────────────────────────────────────────────

export interface TemaRGData {
  readonly numero: number;
  readonly leadingCase: string;
  readonly relator: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly repercussao: string;
  readonly situacao: string;
  readonly dataJulgamento: string;
  readonly tese: string;
  readonly dataTese: string;
  readonly observacao: string;
  readonly links: {
    readonly paginaTema?: string;
    readonly detalhamento?: string;
    readonly manifestacao?: string;
    readonly acordao?: string;
  };
}

// ── Data loading ───────────────────────────────────────────────────────────

const raw = require("../../data/temas_rg_stf.json") as {
  _meta: { totalTemas: number; generatedAt: string };
  temas: Record<string, TemaRGData>;
};

export const TOTAL_TEMAS_RG_STF = Object.keys(raw.temas).length;
export const SNAPSHOT_TEMAS_RG_STF = dataDoSnapshot(raw._meta.generatedAt);

// ── Índice textual em memória ──────────────────────────────────────────────
// Construído a partir do texto publicado de cada tema, cobre todos os temas em
// relação 1:1 e dispensa índice derivado no disco. Isso evita a lacuna dos
// temas repetitivos do STJ (BASE-020), em que temas fora do índice legado só
// eram encontrados por número.

const INDICE = new Map<string, Map<number, number>>();

function indexar(numero: number, texto: string, peso: number): void {
  for (const token of tokenize(texto)) {
    let posting = INDICE.get(token);
    if (!posting) {
      posting = new Map();
      INDICE.set(token, posting);
    }
    posting.set(numero, (posting.get(numero) ?? 0) + peso);
  }
}

for (const tema of Object.values(raw.temas)) {
  indexar(tema.numero, tema.titulo, 3);
  indexar(tema.numero, tema.tese, 3);
  indexar(tema.numero, tema.descricao, 1);
  indexar(tema.numero, `${tema.leadingCase} ${tema.relator}`, 1);
}

// ── Public API ─────────────────────────────────────────────────────────────

export function buscarTemasRG(query: string, limit = 5): TemaRGData[] {
  // Lookup por número: "tema 69", "RG 69", "repercussão geral 69" ou só "69".
  const numMatch = query.match(
    /^\s*(?:tema|rg|repercuss[aã]o\s+geral)?\s*n?[º°.]?\s*(\d+)\s*$/i,
  );
  if (numMatch) {
    const tema = raw.temas[numMatch[1]];
    if (tema) return [tema];
  }

  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scores = new Map<number, number>();
  for (const token of tokens) {
    const posting = INDICE.get(token);
    if (!posting) continue;
    for (const [numero, peso] of posting) {
      scores.set(numero, (scores.get(numero) ?? 0) + peso);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([n]) => raw.temas[String(n)])
    .filter((t): t is TemaRGData => t !== undefined);
}

/** Busca com a expansão declarada do léxico (ver `lexico.ts`). */
export function buscarTemasRGAmpliado(
  query: string,
  limit = 5,
): BuscaAmpliada<TemaRGData> {
  return buscarComEquivalencias(query, limit, buscarTemasRG, (tema) =>
    String(tema.numero),
  );
}

export function formatTemaRG(tema: TemaRGData): string {
  const tese = tema.tese?.trim()
    ? `\n**Tese firmada:**\n> ${tema.tese}\n`
    : "\n**Tese firmada:** não registrada neste snapshot\n";
  const links = [
    ["Página do tema", tema.links.paginaTema],
    ["Detalhamento do processo", tema.links.detalhamento],
    ["Manifestação", tema.links.manifestacao],
    ["Acórdão", tema.links.acordao],
  ]
    .filter((item): item is [string, string] => Boolean(item[1]))
    .map(([rotulo, url]) => `- ${rotulo}: ${url}`)
    .join("\n");
  const fontes = links
    ? `\n**Proveniência:** ${FONTE_OFICIAL} — STF\n${links}\n`
    : "\n**Proveniência:** links oficiais não disponíveis neste snapshot.\n";
  const efeito = descreverEfeitoTemaRG(tema.situacao, tema.tese);

  // A exportação do STF traz duas datas com significados distintos: a coluna
  // "Data do Julgamento" é a do julgamento da repercussão geral, não a do
  // mérito, e a fixação da tese vai na coluna "Data da Tese". Exibir só a
  // primeira, sob rótulo genérico, fazia o registro parecer contraditório —
  // tema com mérito julgado ao lado de uma data anterior ao julgamento. Os
  // rótulos abaixo acompanham os nomes das colunas oficiais; a publicação do
  // acórdão e o trânsito em julgado não têm data nesta rota.
  const datas: string[] = [];
  if (tema.dataJulgamento) {
    datas.push(`**Julgamento da repercussão geral:** ${tema.dataJulgamento}`);
  }
  if (tema.dataTese?.trim()) {
    datas.push(`**Tese fixada em:** ${tema.dataTese}`);
  } else if (meritoDecididoRG(tema.situacao)) {
    datas.push("**Tese fixada em:** não registrada neste snapshot");
  }
  const linhaDatas = datas.length > 0 ? `\n${datas.join(" | ")}` : "";

  return `## 📋 ${NATUREZAS_DOCUMENTAIS.registroPrecedenteQualificado} | TEMA DE REPERCUSSÃO GERAL STF

**Tema ${tema.numero} STF (repercussão geral)**
**Situação:** ${tema.situacao} | **Repercussão geral:** ${tema.repercussao}
**Efeito jurídico:** ${efeito}

**Controvérsia:**
> ${tema.titulo}
${tese}**Leading case:** ${tema.leadingCase}${tema.relator ? ` | **Relator(a):** ${tema.relator}` : ""}${linhaDatas}${fontes}
`;
}
