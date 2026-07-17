import { expect, test } from "bun:test";

import { CODIGOS_DISPONIVEIS } from "./search/legislacao.js";

interface ToolMCP {
  name: string;
  description: string;
  inputSchema: {
    properties?: {
      codigo?: { enum?: string[] };
    };
  };
}

interface RespostaMCP {
  id?: number;
  result?: { tools?: ToolMCP[] };
}

test("MCP anuncia cobertura e contagens derivadas dos dados", async () => {
  const raizMotor = new URL("..", import.meta.url).pathname;
  const processo = Bun.spawn(["bun", "run", "src/index.ts"], {
    cwd: raizMotor,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  const mensagens = [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "teste", version: "1.0" },
      },
    },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
  ];

  processo.stdin.write(mensagens.map((item) => JSON.stringify(item)).join("\n"));
  processo.stdin.write("\n");
  processo.stdin.end();

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(processo.stdout).text(),
    new Response(processo.stderr).text(),
    processo.exited,
  ]);
  expect(exitCode, stderr).toBe(0);

  const respostas = stdout
    .trim()
    .split("\n")
    .map((linha) => JSON.parse(linha) as RespostaMCP);
  const tools = respostas.find((resposta) => resposta.id === 2)?.result?.tools;
  expect(tools).toBeDefined();

  const legislacao = tools!.find((tool) => tool.name === "buscar_legislacao");
  expect(legislacao?.inputSchema.properties?.codigo?.enum).toEqual([
    ...CODIGOS_DISPONIVEIS,
    "todos",
  ]);
  expect(legislacao?.description).toContain("11 diplomas");

  const teses = tools!.find((tool) => tool.name === "buscar_tese");
  expect(teses?.description).toContain("3.372 teses de 269 edições");
});
