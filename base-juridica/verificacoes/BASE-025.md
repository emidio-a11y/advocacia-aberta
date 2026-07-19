# BASE-025 — Informativo STF

**Data da verificação:** 2026-07-19
**Fonte oficial:** planilha estruturada do Informativo STF —
`https://www.stf.jus.br/arquivo/cms/informativoSTF/anexo/Informativo_Dados/Dados_InformativosSTF.xlsx`
(rastreabilidade por edição em `.../informativo/documento/informativo{N}.htm`).

## Problema

A base continha a Jurisprudência em Teses do STJ, mas não o produto análogo do STF:
o Informativo, compilação institucional de julgados resumidos do Tribunal.

## O que foi feito

- **Coleta reproduzível:** um único GET baixa a planilha (9,3 MB). Respondeu 200 ao
  User-Agent próprio do coletor (`Advocacia-Aberta/1.0`); `www.stf.jus.br` foi
  acrescentado à allowlist oficial do pipeline.
- **Leitura sem dependências:** XLSX é um zip de XML. A planilha do Informativo não
  usa a tabela de strings compartilhadas — as células de texto trazem `inlineStr` e
  as numéricas (edição e data) trazem `<v>`. `ler_xlsx` percorre a planilha de 61 MB
  por streaming (`iterparse`), e `serial_excel_para_data` converte a data de
  julgamento do serial do Excel (sistema 1900, epoch 1899-12-30) para DD/MM/AAAA
  (conferido: serial 46190,125 → 17/06/2026, o valor real do primeiro julgado da
  edição 1222).
- **Escopo curado (decisão registrada):** foram mantidos, por julgado, os campos
  curados (classe e número do processo, data, relator, órgão, situação, título,
  tese, resumo, matéria, ramo do direito, repercussão geral, Tema RG e legislação)
  e o link oficial da edição. As duas colunas de notícia integral foram omitidas:
  incluí-las levaria o JSON a ~56 MB (mais que dobraria a base). O texto completo
  fica a um clique no link oficial da edição, como as demais famílias fazem com
  seus resumos e links.
- **Licença:** o expediente do Informativo permite a reprodução "no todo ou em
  parte, sem alteração do conteúdo, desde que citada a fonte"; o texto está
  registrado em `_meta.source.license`, e o auditor acusa sua ausência.
- **Codificação:** a planilha é UTF-8 limpo; não há mojibake (as ocorrências de "Ã"
  são "ÇÃO"/"SÃO"/"NÃO" em caixa alta, português correto), então nenhuma correção de
  mojibake é aplicada — diferente da rota HTML dos temas de repercussão geral.
- **Motor:** módulo `informativo_stf.ts` com natureza `COMPILAÇÃO INSTITUCIONAL` e
  efeito `NÃO VINCULANTE POR SI SÓ`; busca por edição ("informativo 1222") e por
  palavra-chave sobre índice textual em memória (título, tese, resumo, matéria, ramo
  e legislação) que cobre os 11.567 julgados. A coluna "Matéria" (100% preenchida)
  garante recuperação mesmo nos julgados sem resumo ou tese. Ferramenta MCP
  `buscar_informativo`, subcomando de CLI `informativo` e inclusão na busca ampla.

## Números observados

- 11.567 julgados de 1.211 edições distintas (numeradas de 1 a 1.222); 850 com tese
  registrada.
- Completude: título 11.558, matéria 11.567, ramo 11.562, data 11.566, relator e
  órgão 11.567, legislação 8.092, resumo 3.104, tese 850.
- Tamanho: `informativo_stf.json` com 10,6 MB.

## Testes e validação

- pipeline: conversão de serial de data, leitura de XLSX + transformação (campos,
  data, links, ID por edição/sequência), cabeçalho divergente e monitor
  (304 sem mudança, 200 mudou);
- motor: contagem `TOTAL_INFORMATIVOS_STF === 11567` e `TOTAL_EDICOES_INFORMATIVO
  === 1211`, descrição MCP da ferramenta, link oficial no formatador;
- avaliação: grupo `informativo_stf` com três consultas julgadas pelo conteúdo
  (base de cálculo do PIS/COFINS, execução provisória da pena, princípio da
  insignificância), precisão@5 0,8000 (limiar 0,70); global preservado (precisão
  0,7974; recall 0,9903; MRR 1,0);
- bateria completa aprovada: `auditar_base_juridica.py --strict`, unittest,
  `bun run typecheck`, `bun test`, `bun run avaliar`.

## Limitações declaradas

- o Informativo é compilação institucional: o resumo não é vinculante por si só; o
  inteiro teor e a situação atual devem ser conferidos no link oficial;
- o monitor por `If-Modified-Since` detecta republicação da planilha, mas não
  distingue correção de conteúdo de nova edição; o Informativo pausa no recesso
  (jan/jul), então uma semana sem edição não é erro;
- as notícias integrais não foram capturadas por decisão de escopo (base local
  enxuta); ficam acessíveis no link oficial da edição.
