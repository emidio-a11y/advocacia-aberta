import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { buscarSumulas, formatSumula, type Tribunal } from "./search/sumulas.js";
import { buscarTeses, formatTese } from "./search/jt.js";
import { buscarTemas, formatTema } from "./search/temas.js";
import { buscarLegislacao, formatArtigo, type CodigoCodigo } from "./search/legislacao.js";

// ── Server ─────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "busca_delfus", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ───────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "buscar_sumula",
      description: `Busca súmulas do STJ, STF e Súmulas Vinculantes STF nas fontes primárias curadas (676 STJ + 736 STF + 63 vinculantes).

Aceita busca por número ("365") ou por palavras-chave ("dano moral cadastro crédito").

Súmulas Vinculantes têm força obrigatória (art. 103-A CF) — descumprimento gera reclamação constitucional.
Súmulas STJ/STF têm força persuasiva — orientação forte, sem vinculação formal.

Use quando o usuário mencionar número de súmula, ou quando a questão jurídica puder ter orientação sumulada.`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Número da súmula (ex: '365') ou palavras-chave (ex: 'dano moral cadastro negativação').",
          },
          tribunal: {
            type: "string",
            enum: ["STJ", "STF", "vinculante", "todos"],
            description: "Tribunal a buscar. Use 'todos' para buscar em todos. Default: 'todos'.",
            default: "todos",
          },
          limit: {
            type: "number",
            description: "Máximo de resultados por tribunal. Default: 5.",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "buscar_tese",
      description: `Busca jurisprudência em teses do STJ (3.372 teses de 792 edições).

As Teses STJ consolidam o entendimento predominante do tribunal por ramo do direito.
Força: ORIENTATIVA — reflete entendimento dominante mas NÃO vincula formalmente.

Aceita busca por palavras-chave ou por número de edição ("edição 142", "JT 142").

Use quando precisar do entendimento consolidado do STJ sobre um tema específico.`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Palavras-chave (ex: 'plano de saúde cobertura') ou número de edição (ex: 'edição 142').",
          },
          limit: {
            type: "number",
            description: "Máximo de resultados. Default: 5.",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "buscar_tema",
      description: `Busca temas repetitivos do STJ (1.405 temas).

Temas repetitivos são recursos afetados sob o rito dos arts. 1.036-1.041 CPC.
A tese firmada tem efeito vinculante para casos idênticos nos tribunais inferiores.

Aceita busca por número ("tema 1377", "tema repetitivo 1302") ou palavras-chave.

Use quando a questão puder ser objeto de recurso repetitivo, para verificar se já há tese firmada.`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Número do tema (ex: 'tema 1377') ou palavras-chave (ex: 'honorários sucumbenciais fazenda pública').",
          },
          limit: {
            type: "number",
            description: "Máximo de resultados. Default: 5.",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "buscar_legislacao",
      description: `Busca artigos de legislação brasileira: CPC, CC, CP, CDC, CF e CLT.

Aceita busca por número de artigo ("art. 702", "artigo 186") ou por palavras-chave.
Retorna o texto completo do artigo com URL canônica do Planalto.

Códigos disponíveis:
- CPC: Código de Processo Civil (Lei 13.105/2015) — 1.072 artigos
- CC: Código Civil (Lei 10.406/2002)
- CP: Código Penal (Decreto-Lei 2.848/1940)
- CDC: Código de Defesa do Consumidor (Lei 8.078/1990)
- CF: Constituição Federal de 1988
- CLT: Consolidação das Leis do Trabalho

Use para verificar o texto exato de um dispositivo legal antes de citar.`,
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Número do artigo (ex: '186', 'art. 702') ou palavras-chave (ex: 'responsabilidade civil dano').",
          },
          codigo: {
            type: "string",
            enum: ["CPC", "CC", "CP", "CDC", "CF", "CLT", "todos"],
            description: "Código a buscar. Se informar número de artigo, especifique o código. Default: 'todos'.",
            default: "todos",
          },
          limit: {
            type: "number",
            description: "Máximo de resultados. Default: 5.",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
  ],
}));

// ── Tool handlers ──────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "buscar_sumula") {
    const query = String(args?.query ?? "");
    const tribunal = (args?.tribunal ?? "todos") as Tribunal | "todos";
    const limit = Number(args?.limit ?? 5);

    const results = buscarSumulas(query, tribunal, limit);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Nenhuma súmula encontrada para: "${query}"` }] };
    }
    const text = results.map(formatSumula).join("\n---\n\n");
    return { content: [{ type: "text", text }] };
  }

  if (name === "buscar_tese") {
    const query = String(args?.query ?? "");
    const limit = Number(args?.limit ?? 5);

    const results = buscarTeses(query, limit);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Nenhuma tese encontrada para: "${query}"` }] };
    }
    const text = results.map(formatTese).join("\n---\n\n");
    return { content: [{ type: "text", text }] };
  }

  if (name === "buscar_tema") {
    const query = String(args?.query ?? "");
    const limit = Number(args?.limit ?? 5);

    const results = buscarTemas(query, limit);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Nenhum tema encontrado para: "${query}"` }] };
    }
    const text = results.map(formatTema).join("\n---\n\n");
    return { content: [{ type: "text", text }] };
  }

  if (name === "buscar_legislacao") {
    const query = String(args?.query ?? "");
    const codigo = (args?.codigo ?? "todos") as CodigoCodigo | "todos";
    const limit = Number(args?.limit ?? 5);

    const results = buscarLegislacao(query, codigo, limit);
    if (results.length === 0) {
      return { content: [{ type: "text", text: `Nenhum artigo encontrado para: "${query}"` }] };
    }
    const text = results.map(({ codigo: cod, artigo }) => formatArtigo(cod, artigo)).join("\n---\n\n");
    return { content: [{ type: "text", text }] };
  }

  return { content: [{ type: "text", text: `Tool desconhecida: ${name}` }] };
});

// ── Start ──────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
