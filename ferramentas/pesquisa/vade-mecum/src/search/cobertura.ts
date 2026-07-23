/**
 * Cobertura declarada da base.
 *
 * Quem consulta pelo MCP não enxerga o repositório: sem isto, um resultado
 * vazio é indistinguível de "não existe norma sobre o assunto", e uma resposta
 * correta não diz de quando é o dado que a sustenta. Este módulo reúne, a partir
 * dos próprios snapshots carregados, o que existe, quantos registros, de quando
 * é cada família — e as limitações abertas do backlog, que precisam chegar a
 * quem pesquisa, não ficar só no repositório.
 *
 * Nada aqui é escrito à mão: contagens e datas vêm dos metadados dos arquivos
 * publicados (o `BASE-008` nasceu de uma descrição digitada que divergiu do dado).
 */

import { createRequire } from "module";

import {
  SNAPSHOT_ESPELHOS_STJ,
  TOTAL_ESPELHOS_STJ,
  TOTAL_ORGAOS_ESPELHOS,
} from "./espelhos_stj.js";
import {
  SNAPSHOT_INFORMATIVO_STF,
  TOTAL_EDICOES_INFORMATIVO,
  TOTAL_INFORMATIVOS_STF,
} from "./informativo_stf.js";
import { SNAPSHOT_JT_STJ, TOTAL_EDICOES_JT, TOTAL_TESES_STJ } from "./jt.js";
import {
  type CodigoCodigo,
  dataDoDiploma,
  listarLegislacaoDisponivel,
} from "./legislacao.js";
import { SNAPSHOTS_SUMULAS, TOTAIS_SUMULAS } from "./sumulas.js";
import { SNAPSHOT_TEMAS_STJ, TOTAL_TEMAS_STJ } from "./temas.js";
import { SNAPSHOT_TEMAS_RG_STF, TOTAL_TEMAS_RG_STF } from "./temas_rg_stf.js";

const require = createRequire(import.meta.url);

// ── Limitações declaradas ──────────────────────────────────────────────────

interface LimitacaoJSON {
  readonly id: string;
  readonly afetaCobertura: boolean;
  readonly familias: readonly string[];
  readonly resumo: string;
}

const limitacoes = require("../../data/limitacoes.json") as {
  _meta: { fonte: string; atualizado_em: string };
  itens: readonly LimitacaoJSON[];
};

export const LIMITACOES_DECLARADAS = limitacoes.itens;
export const LIMITACOES_ATUALIZADAS_EM = limitacoes._meta.atualizado_em;

// ── Famílias ───────────────────────────────────────────────────────────────

export interface FamiliaCobertura {
  /** Chave interna, usada para casar limitação e rodapé de proveniência. */
  readonly chave: string;
  readonly rotulo: string;
  readonly ferramenta: string;
  readonly registros: number;
  readonly detalhe: string;
  /** Data de geração do snapshot, em formato brasileiro. */
  readonly geradoEm: string;
}

const formatarNumero = new Intl.NumberFormat("pt-BR").format;

// As famílias de jurisprudência têm um snapshot cada, já carregado em memória.
// A legislação fica de fora desta constante de propósito: são 273 diplomas com
// datas próprias, e montar a lista exige abrir todos os arquivos — trabalho que
// só o relatório de cobertura justifica, nunca o rodapé de uma busca.
const FAMILIAS_JURISPRUDENCIA: readonly FamiliaCobertura[] = [
  {
      chave: "sumulas_stj",
      rotulo: "Súmulas do STJ",
      ferramenta: "buscar_sumula",
      registros: TOTAIS_SUMULAS.STJ,
      detalhe: "catálogo do SCON",
      geradoEm: SNAPSHOTS_SUMULAS.STJ,
    },
    {
      chave: "sumulas_stf",
      rotulo: "Súmulas do STF",
      ferramenta: "buscar_sumula",
      registros: TOTAIS_SUMULAS.STF,
      detalhe: "catálogo do STF",
      geradoEm: SNAPSHOTS_SUMULAS.STF,
    },
    {
      chave: "sumulas_vinculantes",
      rotulo: "Súmulas vinculantes do STF",
      ferramenta: "buscar_sumula",
      registros: TOTAIS_SUMULAS.vinculantes,
      detalhe: "catálogo do STF",
      geradoEm: SNAPSHOTS_SUMULAS.vinculante,
    },
    {
      chave: "jurisprudencia_teses_stj",
      rotulo: "Jurisprudência em Teses do STJ",
      ferramenta: "buscar_tese",
      registros: TOTAL_TESES_STJ,
      detalhe: `${formatarNumero(TOTAL_EDICOES_JT)} edições`,
      geradoEm: SNAPSHOT_JT_STJ,
    },
    {
      chave: "temas_repetitivos_stj",
      rotulo: "Temas repetitivos do STJ",
      ferramenta: "buscar_tema",
      registros: TOTAL_TEMAS_STJ,
      detalhe: "precedentes qualificados",
      geradoEm: SNAPSHOT_TEMAS_STJ,
    },
    {
      chave: "temas_rg_stf",
      rotulo: "Temas de repercussão geral do STF",
      ferramenta: "buscar_tema_rg",
      registros: TOTAL_TEMAS_RG_STF,
      detalhe: "precedentes qualificados",
      geradoEm: SNAPSHOT_TEMAS_RG_STF,
    },
    {
      chave: "informativo_stf",
      rotulo: "Informativo de Jurisprudência do STF",
      ferramenta: "buscar_informativo",
      registros: TOTAL_INFORMATIVOS_STF,
      detalhe: `${formatarNumero(TOTAL_EDICOES_INFORMATIVO)} edições`,
      geradoEm: SNAPSHOT_INFORMATIVO_STF,
    },
    {
      chave: "espelhos_stj",
      rotulo: "Espelhos de acórdãos do STJ",
      ferramenta: "buscar_espelho",
      registros: TOTAL_ESPELHOS_STJ,
      detalhe: `${TOTAL_ORGAOS_ESPELHOS} órgãos julgadores`,
      geradoEm: SNAPSHOT_ESPELHOS_STJ,
    },
];

function ordenarData(brasileira: string): number {
  const [dia, mes, ano] = brasileira.split("/");
  return Number(`${ano}${mes}${dia}`);
}

/** Todas as famílias, inclusive a legislação — abre os 273 diplomas. */
export function listarFamilias(): FamiliaCobertura[] {
  const legislacoes = listarLegislacaoDisponivel();
  const artigos = legislacoes.reduce((soma, item) => soma + item.registros, 0);
  // Diplomas promovidos em datas diferentes convivem na base; anunciar uma data
  // só esconderia isso, então a legislação declara o intervalo observado.
  const datas = [...new Set(legislacoes.map((item) => item.geradoEm))].sort(
    (a, b) => ordenarData(a) - ordenarData(b),
  );

  return [
    {
      chave: "legislacao",
      rotulo: "Legislação (compilações do Planalto)",
      ferramenta: "buscar_legislacao",
      registros: artigos,
      detalhe: `${formatarNumero(legislacoes.length)} diplomas`,
      geradoEm:
        datas.length > 1
          ? `${datas[0]} a ${datas[datas.length - 1]}`
          : (datas[0] ?? "não declarada"),
    },
    ...FAMILIAS_JURISPRUDENCIA,
  ];
}

// ── Rodapé de proveniência ─────────────────────────────────────────────────

const AVISO_RODAPE =
  "Cobertura e limitações: ferramenta `cobertura_da_base`. A data do snapshot não confirma vigência hoje — conferir na fonte oficial.";

/**
 * Linha que acompanha cada resposta de busca: de quando é o snapshot que
 * sustentou aquele resultado e por onde ver a cobertura inteira. Uma busca de
 * súmulas sem filtro toca três famílias, então aceita mais de uma chave.
 */
export function rodapeSnapshot(chaves: string | readonly string[]): string {
  const pedidas = typeof chaves === "string" ? [chaves] : chaves;
  const trechos = pedidas
    .map((chave) => FAMILIAS_JURISPRUDENCIA.find((item) => item.chave === chave))
    .filter((item): item is FamiliaCobertura => item !== undefined)
    .map((item) => `${item.rotulo} em ${item.geradoEm}`);
  const origem =
    trechos.length > 0
      ? `Snapshot local: ${trechos.join("; ")}`
      : "Snapshot local";
  return `---\n_${origem}. ${AVISO_RODAPE}_`;
}

/** Rodapé da legislação: a data varia por diploma consultado. */
export function rodapeSnapshotLegislacao(codigos: readonly CodigoCodigo[]): string {
  const trechos = [...new Set(codigos)].map(
    (codigo) => `${codigo} em ${dataDoDiploma(codigo)}`,
  );
  const origem =
    trechos.length > 0
      ? `Compilação capturada do Planalto: ${trechos.join("; ")}`
      : "Snapshot local da legislação";
  return `---\n_${origem}. ${AVISO_RODAPE}_`;
}

// ── Relatório ──────────────────────────────────────────────────────────────

export function formatCobertura(): string {
  const familias = listarFamilias();
  const linhas = familias
    .map(
      (familia) =>
        `| ${familia.rotulo} | \`${familia.ferramenta}\` | ${formatarNumero(familia.registros)} | ${familia.detalhe} | ${familia.geradoEm} |`,
    )
    .join("\n");

  const declaradas = LIMITACOES_DECLARADAS.filter((item) => item.afetaCobertura)
    .map((item) => `- **${item.id}** (${item.familias.join(", ")}): ${item.resumo}`)
    .join("\n");

  return `## 📋 COBERTURA DECLARADA DA BASE

Snapshot local de fontes oficiais. As datas abaixo dizem **quando o dado foi capturado**,
não que ele continue vigente hoje.

| Acervo | Ferramenta | Registros | Detalhe | Capturado em |
|---|---|---:|---|---|
${linhas}

**Limitações conhecidas** (backlog em \`${limitacoes._meta.fonte}\`, revisto em ${LIMITACOES_ATUALIZADAS_EM}):

${declaradas}

Fora dessas famílias, a base não responde: ausência de resultado aqui não é prova de
ausência de norma, súmula ou precedente. Jurisprudência de tribunais estaduais e federais,
por exemplo, não está neste acervo.
`;
}
