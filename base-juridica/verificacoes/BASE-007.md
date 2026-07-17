# BASE-007 — proveniência pública dos temas repetitivos

| Campo | Registro |
|---|---|
| Verificado em | 17 de julho de 2026 |
| Escopo | metadados de `flash_temas_stj.json`; conteúdo dos 1.405 temas preservado |
| Problema | `_meta.source` expunha dois caminhos absolutos da pasta pessoal `Downloads` |
| Decisão | substituir os caminhos por referência pública oficial e declarar a limitação do snapshot legado |

## Fontes oficiais conferidas

- conjunto **Precedentes qualificados** do Portal de Dados Abertos do STJ;
- pacote CKAN `4238da2f-c07b-4c1a-b345-4402accacdcf`;
- recurso `Temas.csv`: `df29da13-7d6b-41ba-ad96-cd1a5bbd191c`;
- recurso `Processos.csv`: `7ed21202-0049-4fcb-aa7c-48d810d3c499`;
- chave pública de relacionamento declarada pelo STJ: `sequencialPrecedente`.

O catálogo oficial informa que `Temas.csv` contém os dados gerais dos precedentes e
`Processos.csv` contém seus processos relacionados. Os dois recursos e seus IDs estão
registrados diretamente no metadado do snapshot.

## Limitação preservada

O snapshot foi gerado em 7 de janeiro de 2026 pela combinação de uma página salva em
MHTML e um relatório CSV. Esses dois artefatos brutos não foram versionados. Por isso,
o novo metadado declara `legacy_not_fully_reproducible`; ele não atribui falsamente o
snapshot histórico aos CSVs baixados em julho.

Para os próximos snapshots, o adaptador `temas_stj_csv_v1` relaciona os dois CSVs
oficiais por `sequencialPrecedente`, conforme o manifesto versionado.

## Integridade da alteração

- SHA-256 canônico da coleção `temas` antes da alteração:
  `a311c0fbd1fec4ee17ba8b9f07be52add5ee33eced9bee9042e20002c66e1f82`;
- o mesmo checksum foi conferido depois da alteração;
- somente `_meta.source` mudou;
- nenhum dos 1.405 registros foi adicionado, removido ou modificado;
- teste de regressão rejeita o retorno de `/Users/` ou `Downloads` ao metadado.
