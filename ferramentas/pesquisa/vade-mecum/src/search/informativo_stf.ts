import { createRequire } from "module";
import { FONTE_OFICIAL, NATUREZAS_DOCUMENTAIS } from "./taxonomia.js";
import {
  type BuscaAmpliada,
  buscarComEquivalencias,
} from "./lexico.js";
import { dataDoSnapshot, tokenize } from "./utils.js";

const require = createRequire(import.meta.url);

// ── Types ──────────────────────────────────────────────────────────────────

export interface InformativoJulgado {
  readonly id: string;
  readonly edicao: number;
  readonly sequencial: number;
  readonly classeProcesso: string;
  readonly numeroProcesso: string;
  readonly dataJulgamento: string;
  readonly relator: string;
  readonly orgaoJulgador: string;
  readonly situacao: string;
  readonly titulo: string;
  readonly teseJulgado: string;
  readonly resumo: string;
  readonly ramoDireito: string;
  readonly materia: string;
  readonly repercussaoGeral: string;
  readonly temaRG: string;
  readonly legislacao: string;
  readonly links: { readonly edicao?: string };
}

// ── Data loading ───────────────────────────────────────────────────────────

const raw = require("../../data/informativo_stf.json") as {
  _meta: { totalRegistros: number; totalEdicoes: number; generatedAt: string };
  informativos: Record<string, InformativoJulgado>;
};

const { informativos } = raw;

export const TOTAL_INFORMATIVOS_STF = Object.keys(informativos).length;
export const SNAPSHOT_INFORMATIVO_STF = dataDoSnapshot(raw._meta.generatedAt);
export const TOTAL_EDICOES_INFORMATIVO = new Set(
  Object.values(informativos).map((item) => item.edicao),
).size;

// ── Índice textual em memória ──────────────────────────────────────────────
// Construído do texto publicado de cada julgado; cobre os 11.567 registros sem
// índice derivado no disco. "Matéria" (100% preenchida) e "Título" garantem
// recuperação mesmo nos julgados sem resumo ou tese.

const INDICE = new Map<string, Map<string, number>>();

function indexar(id: string, texto: string, peso: number): void {
  for (const token of tokenize(texto)) {
    let posting = INDICE.get(token);
    if (!posting) {
      posting = new Map();
      INDICE.set(token, posting);
    }
    posting.set(id, (posting.get(id) ?? 0) + peso);
  }
}

for (const item of Object.values(informativos)) {
  indexar(item.id, item.titulo, 3);
  indexar(item.id, item.teseJulgado, 3);
  indexar(item.id, item.resumo, 2);
  indexar(item.id, item.materia, 2);
  indexar(item.id, item.ramoDireito, 1);
  indexar(item.id, item.legislacao, 1);
}

// ── Public API ─────────────────────────────────────────────────────────────

export function buscarInformativos(query: string, limit = 5): InformativoJulgado[] {
  // Lookup por edição: "informativo 1222", "inf 1222", "informativo stf 1222".
  const edicaoMatch = query.match(/inf(?:ormativo)?\s*(?:stf\s*)?n?[º°.]?\s*(\d+)/i);
  if (edicaoMatch) {
    const edicao = parseInt(edicaoMatch[1], 10);
    const found = Object.values(informativos).filter((i) => i.edicao === edicao);
    if (found.length > 0) return found.slice(0, limit);
  }

  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scores = new Map<string, number>();
  for (const token of tokens) {
    const posting = INDICE.get(token);
    if (!posting) continue;
    for (const [id, peso] of posting) {
      scores.set(id, (scores.get(id) ?? 0) + peso);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || informativos[a[0]].edicao - informativos[b[0]].edicao)
    .slice(0, limit)
    .map(([id]) => informativos[id])
    .filter((i): i is InformativoJulgado => i !== undefined);
}

/** Busca com a expansão declarada do léxico (ver `lexico.ts`). */
export function buscarInformativosAmpliado(
  query: string,
  limit = 5,
): BuscaAmpliada<InformativoJulgado> {
  return buscarComEquivalencias(query, limit, buscarInformativos, (item) => item.id);
}

export function formatInformativo(item: InformativoJulgado): string {
  const processo = [item.classeProcesso, item.numeroProcesso]
    .filter(Boolean)
    .join(" ");
  const tese = item.teseJulgado?.trim()
    ? `\n**Tese do julgado:**\n> ${item.teseJulgado}\n`
    : "";
  const resumo = item.resumo?.trim() ? `\n**Resumo:** ${item.resumo}\n` : "";
  const rg =
    item.repercussaoGeral && item.temaRG
      ? ` | **Repercussão geral:** ${item.repercussaoGeral} (Tema RG ${item.temaRG})`
      : item.repercussaoGeral
        ? ` | **Repercussão geral:** ${item.repercussaoGeral}`
        : "";
  const legislacao = item.legislacao?.trim()
    ? `\n**Legislação:** ${item.legislacao}`
    : "";
  const fonte = item.links.edicao
    ? `\n**Proveniência:** ${FONTE_OFICIAL} — STF\n- Edição ${item.edicao} do Informativo: ${item.links.edicao}\n`
    : "\n**Proveniência:** links oficiais não disponíveis neste snapshot.\n";

  return `## 📋 ${NATUREZAS_DOCUMENTAIS.compilacaoInstitucional} | INFORMATIVO STF

**Informativo ${item.edicao} — ${item.titulo}**
**Efeito jurídico:** NÃO VINCULANTE POR SI SÓ — resumo informativo de julgado; examine o inteiro teor e a situação atual no link oficial
${tese}${resumo}
**${processo || "Processo não informado"}** | **Órgão:** ${item.orgaoJulgador}${item.relator ? ` | **Relator(a):** ${item.relator}` : ""}${item.dataJulgamento ? ` | **Julgamento:** ${item.dataJulgamento}` : ""}
**Ramo:** ${item.ramoDireito}${rg}${legislacao}${fonte}`;
}
