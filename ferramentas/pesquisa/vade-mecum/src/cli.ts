/**
 * CLI para uso direto (slash commands, scripts).
 * Uso: bun run src/cli.ts <tool> <args...>
 *
 * Exemplos:
 *   bun run src/cli.ts sumula "dano moral cadastro" STJ 5
 *   bun run src/cli.ts tese "plano de saude cobertura" 5
 *   bun run src/cli.ts tema "honorarios fazenda publica" 5
 *   bun run src/cli.ts tema-rg "ICMS base calculo PIS COFINS" 5
 *   bun run src/cli.ts informativo "principio da insignificancia" 5
 *   bun run src/cli.ts espelho "honorarios apreciacao equitativa" 5
 *   bun run src/cli.ts legislacao "186" CC 5
 *   bun run src/cli.ts buscar "responsabilidade civil dano" 5
 */

import { buscarSumulasAmpliado, formatSumula, type Tribunal } from "./search/sumulas.js";
import { buscarTesesAmpliado, formatTese } from "./search/jt.js";
import { buscarTemasAmpliado, formatTema } from "./search/temas.js";
import { buscarTemasRGAmpliado, formatTemaRG } from "./search/temas_rg_stf.js";
import { buscarInformativosAmpliado, formatInformativo } from "./search/informativo_stf.js";
import { buscarEspelhosAmpliado, formatEspelho } from "./search/espelhos_stj.js";
import { montarResposta, totalExibido } from "./search/lexico.js";
import {
  buscarLegislacao,
  CODIGOS_DISPONIVEIS,
  formatArtigo,
  normalizarCodigo,
} from "./search/legislacao.js";
import {
  rodapeSnapshot,
  rodapeSnapshotLegislacao,
} from "./search/cobertura.js";

const [, , tool, query, arg3, arg4] = process.argv;

function printSep() { console.log("\n" + "─".repeat(60) + "\n"); }

// Toda saída declara de quando é o dado que a sustenta — pesquisa jurídica sem
// data de captura não é conferível.
function printRodape(texto: string) { console.log("\n" + texto); }

if (!tool || !query) {
  console.error("Uso: bun run src/cli.ts <sumula|tese|tema|tema-rg|informativo|espelho|legislacao|buscar> <query> [args]");
  process.exit(1);
}

switch (tool) {
  case "sumula": {
    const tribunal = (arg3 ?? "todos") as Tribunal | "todos";
    const limit = parseInt(arg4 ?? "5", 10);
    const chaves: Record<string, string> = {
      STJ: "sumulas_stj",
      STF: "sumulas_stf",
      vinculante: "sumulas_vinculantes",
    };
    const busca = buscarSumulasAmpliado(query, tribunal, limit);
    if (totalExibido(busca) === 0) {
      console.log(`Nenhuma súmula encontrada para: "${query}"`);
      printRodape(rodapeSnapshot(tribunal === "todos" ? Object.values(chaves) : [chaves[tribunal]!]));
      break;
    }
    const results = [...busca.diretos, ...busca.porEquivalencia];
    console.log(`${results.length} súmula(s) encontrada(s)\n`);
    process.stdout.write(montarResposta(busca, formatSumula));
    printRodape(rodapeSnapshot([...new Set(results.map(({ tribunal: t }) => chaves[t]!))]));
    break;
  }

  case "tese": {
    const limit = parseInt(arg3 ?? "5", 10);
    const busca = buscarTesesAmpliado(query, limit);
    if (totalExibido(busca) === 0) { console.log(`Nenhuma tese encontrada para: "${query}"`); }
    else {
      console.log(`${totalExibido(busca)} tese(s) encontrada(s)\n`);
      process.stdout.write(montarResposta(busca, formatTese));
    }
    printRodape(rodapeSnapshot("jurisprudencia_teses_stj"));
    break;
  }

  case "tema": {
    const limit = parseInt(arg3 ?? "5", 10);
    const busca = buscarTemasAmpliado(query, limit);
    if (totalExibido(busca) === 0) { console.log(`Nenhum tema encontrado para: "${query}"`); }
    else {
      console.log(`${totalExibido(busca)} tema(s) encontrado(s)\n`);
      process.stdout.write(montarResposta(busca, formatTema));
    }
    printRodape(rodapeSnapshot("temas_repetitivos_stj"));
    break;
  }

  case "tema-rg": {
    const limit = parseInt(arg3 ?? "5", 10);
    const busca = buscarTemasRGAmpliado(query, limit);
    if (totalExibido(busca) === 0) { console.log(`Nenhum tema de repercussão geral encontrado para: "${query}"`); }
    else {
      console.log(`${totalExibido(busca)} tema(s) de repercussão geral encontrado(s)\n`);
      process.stdout.write(montarResposta(busca, formatTemaRG));
    }
    printRodape(rodapeSnapshot("temas_rg_stf"));
    break;
  }

  case "informativo": {
    const limit = parseInt(arg3 ?? "5", 10);
    const busca = buscarInformativosAmpliado(query, limit);
    if (totalExibido(busca) === 0) { console.log(`Nenhum julgado do Informativo encontrado para: "${query}"`); }
    else {
      console.log(`${totalExibido(busca)} julgado(s) do Informativo encontrado(s)\n`);
      process.stdout.write(montarResposta(busca, formatInformativo));
    }
    printRodape(rodapeSnapshot("informativo_stf"));
    break;
  }

  case "espelho": {
    const limit = parseInt(arg3 ?? "5", 10);
    const busca = buscarEspelhosAmpliado(query, limit);
    if (totalExibido(busca) === 0) { console.log(`Nenhum espelho de acórdão encontrado para: "${query}"`); }
    else {
      console.log(`${totalExibido(busca)} espelho(s) de acórdão encontrado(s)\n`);
      process.stdout.write(montarResposta(busca, formatEspelho));
    }
    printRodape(rodapeSnapshot("espelhos_stj"));
    break;
  }

  case "legislacao": {
    const codigoInformado = arg3 ?? "todos";
    const codigo = normalizarCodigo(codigoInformado);
    const limit = parseInt(arg4 ?? "5", 10);
    if (!codigo) {
      const disponiveis = [...CODIGOS_DISPONIVEIS, "todos"].join(", ");
      console.error(`Código de legislação indisponível: "${codigoInformado}". Use: ${disponiveis}.`);
      process.exitCode = 1;
      break;
    }
    const results = buscarLegislacao(query, codigo, limit);
    if (results.length === 0) {
      console.log(`Nenhum artigo encontrado para: "${query}"`);
      printRodape(rodapeSnapshotLegislacao(codigo === "todos" ? [] : [codigo]));
      break;
    }
    console.log(`${results.length} artigo(s) encontrado(s)\n`);
    results.forEach(({ codigo: cod, artigo }, i) => { if (i > 0) printSep(); process.stdout.write(formatArtigo(cod, artigo)); });
    printRodape(rodapeSnapshotLegislacao(results.map(({ codigo: cod }) => cod)));
    break;
  }

  case "buscar": {
    // Busca ampla: súmulas + teses + temas repetitivos + temas de RG + Informativo STF
    const limit = parseInt(arg3 ?? "3", 10);

    const buscaSumulas = buscarSumulasAmpliado(query, "todos", limit);
    const buscaTeses = buscarTesesAmpliado(query, limit);
    const buscaTemas = buscarTemasAmpliado(query, limit);
    const buscaTemasRG = buscarTemasRGAmpliado(query, limit);
    const buscaInformativos = buscarInformativosAmpliado(query, limit);
    const buscaEspelhos = buscarEspelhosAmpliado(query, limit);

    const sumulas = [...buscaSumulas.diretos, ...buscaSumulas.porEquivalencia];
    const teses = [...buscaTeses.diretos, ...buscaTeses.porEquivalencia];
    const temas = [...buscaTemas.diretos, ...buscaTemas.porEquivalencia];
    const temasRG = [...buscaTemasRG.diretos, ...buscaTemasRG.porEquivalencia];
    const informativos = [...buscaInformativos.diretos, ...buscaInformativos.porEquivalencia];
    const espelhos = [...buscaEspelhos.diretos, ...buscaEspelhos.porEquivalencia];

    const total = sumulas.length + teses.length + temas.length + temasRG.length + informativos.length + espelhos.length;
    if (total === 0) { console.log(`Nenhum resultado encontrado para: "${query}"`); break; }

    console.log(`=== BASE JURÍDICA LOCAL — "${query}" ===\n`);

    if (sumulas.length > 0) {
      console.log(`## SÚMULAS (${sumulas.length})\n`);
      process.stdout.write(montarResposta(buscaSumulas, formatSumula));
    }
    if (teses.length > 0) {
      printSep();
      console.log(`## JURISPRUDÊNCIA EM TESES (${teses.length})\n`);
      process.stdout.write(montarResposta(buscaTeses, formatTese));
    }
    if (temas.length > 0) {
      printSep();
      console.log(`## TEMAS REPETITIVOS (${temas.length})\n`);
      process.stdout.write(montarResposta(buscaTemas, formatTema));
    }
    if (temasRG.length > 0) {
      printSep();
      console.log(`## TEMAS DE REPERCUSSÃO GERAL STF (${temasRG.length})\n`);
      process.stdout.write(montarResposta(buscaTemasRG, formatTemaRG));
    }
    if (informativos.length > 0) {
      printSep();
      console.log(`## INFORMATIVO STF (${informativos.length})\n`);
      process.stdout.write(montarResposta(buscaInformativos, formatInformativo));
    }
    if (espelhos.length > 0) {
      printSep();
      console.log(`## ESPELHOS DE ACÓRDÃOS STJ (${espelhos.length})\n`);
      process.stdout.write(montarResposta(buscaEspelhos, formatEspelho));
    }
    break;
  }

  default:
    console.error(`Tool desconhecida: ${tool}. Use: sumula | tese | tema | tema-rg | informativo | espelho | legislacao | buscar`);
    process.exit(1);
}
