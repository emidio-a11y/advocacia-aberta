# Catálogo da base jurídica

| Campo | Valor |
|---|---|
| Auditoria estrutural | 17 de julho de 2026 |
| Local atual dos dados | `ferramentas/pesquisa/busca_delfus/data/` |
| Escopo | inventário, metadados, cobertura do motor e rastreabilidade interna |

Este catálogo descreve o que o repositório contém. Ele **não confirma externamente**
a vigência, a completude ou a correspondência de cada registro com a fonte oficial na
data de uso.

## Como repetir a auditoria

```bash
python3 ferramentas/manutencao/auditar_base_juridica.py
```

Para obter os dados estruturados:

```bash
python3 ferramentas/manutencao/auditar_base_juridica.py --json
```

## Visão geral

| Acervo | Arquivos principais | Quantidade observada | Tamanho ou cobertura |
|---|---:|---:|---|
| Legislação | 11 | 6.802 registros | 11 diplomas |
| Súmulas | 3 | 1.475 registros | STJ, STF e vinculantes do STF |
| Jurisprudência em Teses | 1 | 3.372 teses | 269 edições do STJ |
| Temas repetitivos | 1 | 1.405 temas | STJ |
| Índices auxiliares | 2 exclusivos + índices embutidos | derivados | palavras-chave e termos de busca |
| Total em JSON | 18 | — | 20.718.944 bytes, cerca de 20 MB |

Os números acima foram contados diretamente nos JSONs. `gerado_em` e `generatedAt`
indicam geração do arquivo, não garantem a data de vigência do conteúdo.

## Legislação

Todos os 6.802 registros legislativos possuem URL individual. Os metadados apontam
para páginas compiladas do Planalto.

| Código | Diploma | Gerado em | Registros | Índice | Situação estrutural |
|---|---|---:|---:|---|---|
| `ADCT` | Ato das Disposições Constitucionais Transitórias | 2026-01-20 | 148 | pré-computado | coerente |
| `CC` | Código Civil — Lei 10.406/2002 | 2026-01-21 | 2.028 | pré-computado | coerente |
| `CDC` | Código de Defesa do Consumidor — Lei 8.078/1990 | 2026-01-30 | 131 | palavras-chave por registro | coerente |
| `CE` | Código Eleitoral — Lei 4.737/1965 | 2026-01-30 | 382 | palavras-chave por registro | coerente |
| `CF` | Constituição Federal de 1988 | 2026-01-20 | 276 | pré-computado | coerente |
| `CLT` | Consolidação das Leis do Trabalho | 2026-01-21 | 920 | pré-computado | coerente; 804 registros têm palavras-chave próprias |
| `CP` | Código Penal — Decreto-Lei 2.848/1940 | 2026-01-20 | 430 | pré-computado | coerente |
| `CPC` | Código de Processo Civil — Lei 13.105/2015 | 2026-01-20 | 1.072 | pré-computado | coerente |
| `CPP` | Código de Processo Penal — Decreto-Lei 3.689/1941 | 2026-01-20 | 822 | pré-computado | coerente |
| `CTB` | Código de Trânsito Brasileiro — Lei 9.503/1997 | 2026-01-30 | 389 | palavras-chave por registro | **metadado informa 390** |
| `CTN` | Código Tributário Nacional — Lei 5.172/1966 | 2026-01-30 | 204 | pré-computado | coerente |

A soma dos metadados é 6.803, mas a contagem real é 6.802 por causa da divergência no
CTB. Não se deve simplesmente alterar o número: primeiro é preciso conferir se falta
um registro ou se o metadado está incorreto.

### Cobertura real do motor legislativo

| Superfície | Cobertura observada |
|---|---|
| Arquivos disponíveis | `ADCT`, `CC`, `CDC`, `CE`, `CF`, `CLT`, `CP`, `CPC`, `CPP`, `CTB`, `CTN` |
| Códigos declarados no TypeScript | os 11 acima + `EI` |
| Busca com código específico | tenta carregar qualquer código declarado |
| Busca `todos` | somente `CPC`, `CC`, `CP`, `CDC`, `CF`, `CLT` |
| Esquema MCP e sua documentação | somente `CPC`, `CC`, `CP`, `CDC`, `CF`, `CLT` |

Consequências:

- `ADCT`, `CE`, `CPP`, `CTB` e `CTN` existem, mas ficam fora da busca `todos`;
- `EI` está declarado como Estatuto da Pessoa Idosa, mas `lei_ei.json` não existe e a
  consulta específica termina com erro;
- chamar uma busca de “todos” hoje cria uma expectativa de cobertura que o motor não
  cumpre.

## Súmulas

| Conjunto | Gerado em | Registros | Estado dos registros | URLs oficiais |
|---|---:|---:|---|---:|
| STJ | 2025-12-17 | 676 | 649 ativas; 27 canceladas | 676 |
| STF não vinculantes | 2026-01-13 | 736 | 724 ativas; 10 canceladas; 1 alterada; 1 superada | 736 |
| STF vinculantes | 2026-01-14 | 63 | 62 aprovadas; 1 cancelada | 63 |

As contagens, os estados e a presença de URLs são coerentes com os metadados. A
auditoria não comparou os enunciados nem os estados atuais com os portais dos
tribunais.

### Índices derivados de súmulas

| Arquivo | Cobertura | Gerado em | Proveniência declarada |
|---|---:|---:|---|
| `sumulas_keywords.json` | 676 súmulas STJ | 2025-12-09 | `gemini-2.0-flash-lite-001` |
| `sumulas_stf_keywords.json` | 736 súmulas STF | 2026-01-13 | `gemini-2.0-flash-lite` |

São dados derivados para recuperação, não fontes jurídicas. O repositório não contém
o procedimento completo, o prompt, os parâmetros ou os testes usados para reproduzir
esses índices. O índice do STJ também é anterior em oito dias ao JSON consolidado de
súmulas do STJ.

## Jurisprudência em Teses do STJ

| Campo | Valor observado |
|---|---:|
| Arquivo | `jt_stj.json` |
| Gerado em | 2026-02-17 |
| Edições distintas | 269 |
| Teses | 3.372 |
| Teses com URL do STJ | 3.372 |
| Teses marcadas como rito especial | 154 |

Os totais por ramo do Direito conferem com os metadados. Há uma ressalva material:
`JT_179_T19` possui URL e metadados, mas o enunciado está vazio. A descrição do servidor
MCP também informa incorretamente “792 edições”, embora o arquivo e seus metadados
registrem 269.

## Temas repetitivos do STJ

| Campo | Valor observado |
|---|---:|
| Arquivo | `flash_temas_stj.json` |
| Gerado em | 2026-01-07 |
| Temas | 1.405 |
| Temas com questão submetida | 1.405 |
| Temas com página oficial do STJ | 1.405 |
| Temas sem tese firmada preenchida | 331 |

A ausência de tese em 331 registros aparece associada principalmente a temas afetados,
cancelados ou ainda em julgamento; ela não foi classificada automaticamente como erro.

O problema de proveniência está no `_meta.source`: ele registra caminhos absolutos da
máquina que gerou o arquivo, em `Downloads`, em vez de uma origem pública e
reproduzível. Os registros individuais, por outro lado, possuem links oficiais.

## Rastreabilidade entregue pelo motor

Os dados guardam links oficiais e, desde a conclusão do `BASE-001`, o motor os
preserva na saída formatada:

| Resultado | URL existe no JSON | URL aparece na resposta formatada |
|---|---|---|
| Legislação | sim | sim |
| Súmula STJ/STF/vinculante | sim | sim |
| Jurisprudência em Teses | sim | sim |
| Tema repetitivo | sim | sim; inclui todos os links disponíveis no registro |

Cinco testes de regressão cobrem os três ramos de súmulas, Jurisprudência em Teses e
temas repetitivos. O auditor também verifica estaticamente que os formatadores
continuam usando os campos de URL.

## Atualização e reprodutibilidade

O repositório contém o motor de consulta, mas não contém um pipeline completo para
baixar, transformar, validar e reconstruir os 18 JSONs. Hoje não é possível reproduzir
uma atualização integral apenas a partir do código versionado.

Uma atualização confiável precisa registrar, por conjunto:

- URL ou endpoint de origem;
- instante da coleta e data de referência do conteúdo;
- artefato bruto ou checksum quando for permitido preservá-lo;
- transformação aplicada;
- versão do esquema;
- diferenças em relação à versão anterior;
- validações executadas;
- responsável pela revisão.

## Resultado da auditoria

### Pontos fortes confirmados

- acervo local expressivo e estruturado;
- contagens coerentes na maior parte dos conjuntos;
- URLs oficiais presentes em todos os registros das quatro famílias;
- estados de súmulas preservados;
- índices de busca já disponíveis;
- links oficiais preservados nas respostas formatadas;
- motor funcional para consultas locais sem enviar a base a serviço externo.

### Limitações conhecidas

- nenhuma confirmação externa de vigência ou conteúdo foi feita nesta rodada;
- não há pipeline integral e reproduzível de atualização;
- a cobertura declarada e a cobertura executada da legislação divergem;
- existem inconsistências pontuais no CTB, em uma tese e na descrição MCP;
- os termos “fonte primária” e as classificações de força jurídica ainda precisam de
  revisão conceitual uniforme;
- não há avaliação documentada de precisão e cobertura das buscas por palavras-chave.

As correções estão organizadas no [BACKLOG.md](BACKLOG.md).
