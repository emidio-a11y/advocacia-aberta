# BASE-021 — Temas de repercussão geral do STF

**Data da verificação:** 2026-07-19
**Fonte oficial:** Portal da Repercussão Geral do STF —
`https://portal.stf.jus.br/jurisprudenciaRepercussao/exportarDados.asp`
(exportação única; página individual por tema em `verTeseTema.asp?numTema=N`).

## Problema

A base já continha os temas repetitivos do STJ, mas não o seu par vinculante no
STF: os temas de repercussão geral. Faltava a família de precedentes qualificados
do controle difuso constitucional.

## O que foi feito

- **Coleta reproduzível:** um único GET à exportação oficial devolve os 1.470
  temas (~3,8 MB). A resposta chega rotulada `application/vnd.ms-excel`, mas o
  corpo é uma tabela HTML de 15 colunas, parseada com a biblioteca padrão. O
  arquivo bruto é salvo com a extensão `.xls` (o próprio `filename` do
  `content-disposition` do STF), que pula a checagem de tipo de conteúdo do
  coletor; a transformação o decodifica como HTML.
- **Correção de mojibake por célula:** a fonte mistura, às vezes na mesma linha,
  texto correto ("Trânsito em Julgado") e mojibake UTF-8 ("NÃ£o hÃ¡"). O helper
  `corrigir_mojibake` faz a volta cp1252→utf-8, que é autovalidante: só altera a
  string quando os bytes formam UTF-8 válido, condição que o mojibake satisfaz e
  que uma letra acentuada isolada não satisfaz. Conferência sobre o snapshot: zero
  ocorrências do char de mojibake `Ã` e de `â€` no JSON final; o único `Â`
  remanescente é o legítimo "Âmbito" (Tema 389).
- **Rastreabilidade:** cada tema guarda `paginaTema`
  (`verTeseTema.asp?numTema=N`, sempre presente) e, quando a fonte oferece, os
  links de `detalhamento` (`detalharProcesso.asp`), `manifestacao`
  (`verPronunciamento.asp`) e `acordao` (busca em `jurisprudencia.stf.jus.br`, com
  o espaço da URL encodado). Todos em domínios oficiais já permitidos.
- **Requisitos operacionais confirmados:** o `exportarDados.asp` respondeu 200 ao
  User-Agent próprio do coletor (`Advocacia-Aberta/1.0`) — não foi preciso UA de
  navegador; a cadeia TLS incompleta do `stf.jus.br` funcionou com o trust store
  do sistema, sem trocar de fetcher.
- **Motor:** módulo `temas_rg_stf.ts` com busca por número ("tema 69", "RG 69") e
  por palavra-chave sobre um índice textual construído em memória a partir do
  texto publicado — cobre todos os 1.470 temas, evitando por desenho a lacuna do
  `BASE-020`. Efeito jurídico em `descreverEfeitoTemaRG`: observância obrigatória
  (art. 927, III, do CPC) apenas quando o mérito foi julgado; reconhecimento de RG
  sem mérito, cancelamento e estados preliminares recebem rótulo distinto.
  Ferramenta MCP `buscar_tema_rg`, subcomando de CLI `tema-rg` e inclusão na busca
  ampla.

## Números observados

- 1.470 temas (0001–1470), todos com página oficial; 1.300 com tese firmada.
- Situações: Trânsito em Julgado 1.263, Acórdão de Repercussão Geral publicado
  136, Acórdão de mérito publicado 36, Cancelado 21, Mérito julgado 7, Analisada
  Preliminar de Repercussão Geral 4, Em julgamento 3.
- Repercussão: Há 783, Há (com reafirmação de jurisprudência) 187, Não há 49, Não
  há (questão infraconstitucional) 451.
- Conferência de conteúdo: Tema 69 ("tese do século") traz "O ICMS não compõe a
  base de cálculo para a incidência do PIS e da COFINS", com relator, datas e
  links corretos.

## Testes e validação

- pipeline: `corrigir_mojibake`, transformação (campos, mojibake, links,
  cabeçalho divergente) e monitor (contagem+situação);
- motor: contagem `TOTAL_TEMAS_RG_STF === 1470`, descrição MCP da ferramenta,
  links do formatador, classificação de efeito;
- avaliação de recuperação: grupo `temas_rg_stf` com três consultas julgadas pelo
  conteúdo (ICMS na base do PIS/COFINS, ICMS sobre demanda contratada de energia,
  aposentadoria especial por agentes nocivos), precisão@5 0,7333 (limiar 0,70);
  global preservado (precisão 0,7973; recall 0,9899; MRR 1,0);
- bateria completa aprovada: `auditar_base_juridica.py --strict`, unittest,
  `bun run typecheck`, `bun test`, `bun run avaliar`.

## Limitações declaradas

- o flag de suspensão nacional (art. 1.035, §5º, do CPC) não existe nas rotas
  estáticas do STF, só na base Qlik — registrado como `BASE-022`;
- a coluna "Assuntos" da exportação duplica "Descrição" e não fornece a taxonomia
  de assuntos (disponível apenas em `todostemas.asp`, fora deste escopo);
- o snapshot não confirma vigência nem estabilização da tese em todo estado
  possível; o exame do inteiro teor e da situação atual continua obrigatório.
