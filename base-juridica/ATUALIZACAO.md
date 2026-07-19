# Protocolo de atualização da base jurídica

Este protocolo reconstrói candidatos a snapshot a partir de fontes oficiais, registra
a coleta e mostra as diferenças antes de qualquer alteração na base publicada.

Ele reduz risco operacional; não substitui a revisão jurídica da vigência, do
conteúdo e das consequências de cada mudança.

## Garantia central

`coletar`, `transformar`, `validar`, `comparar` e `executar` escrevem somente em
`.atualizacao-base-juridica/<execucao>/`, ignorado pelo Git. Nenhum desses comandos
altera os JSONs consumidos pelo motor.

A publicação exige `promover --confirmar PROMOVER`. Antes de copiar o candidato, o
comando repete a validação, gera o relatório de diferenças e preserva os arquivos
anteriores em `backup/` dentro da execução. A mesma execução não pode ser promovida
duas vezes, evitando a sobrescrita desse backup.

Se o relatório contiver qualquer remoção, a promoção ainda é recusada. Depois da
conferência individual dos IDs, uma remoção intencional exige também
`--aceitar-remocoes`.

Uma alteração que supere o limiar versionado em `politica_promocao` — atualmente 25%
da coleção anterior e pelo menos 20 registros — também é recusada. Depois da revisão
do relatório, sua promoção exige adicionalmente `--aceitar-mudanca-volumosa`.

## Dependências

- Python 3.11 ou posterior;
- `curl` com suporte a HTTPS;
- acesso à internet para a etapa de coleta.

O pipeline usa somente a biblioteca padrão do Python. Não envia dados de casos nem
consulta serviços de IA.

## Fontes e transformações

O manifesto versionado está em [fontes.json](fontes.json), validado pelo contrato
[fontes.schema.json](fontes.schema.json).

| Conjunto | Origem oficial | Coleta | Transformação |
|---|---|---|---|
| Legislação | páginas compiladas do Planalto | um HTML por diploma | separa dispositivos, normaliza números como `1.072`, preserva hierarquia e retém registros antigos não reencontrados para revisão |
| Súmulas STJ | catálogo de Súmulas Anotadas do STJ | catálogo completo em HTML | extrai número, enunciado, estado, ramo, tema, órgão, data e URL oficial |
| Súmulas STF | aplicação das Súmulas no STF | catálogo e uma página de detalhe por verbete | junta estado do catálogo, enunciado/data do detalhe e classificação já curada quando existente |
| Súmulas vinculantes | aplicação das Súmulas Vinculantes no STF | catálogo e uma página de detalhe por verbete | mesma transformação do STF, com metadados de vinculância separados |
| Jurisprudência em Teses | páginas de cada edição no STJ | índice e edições de `1` até a mais recente observada | extrai edição, título, data, enunciados, julgados e links para o PDF oficial |
| Temas repetitivos | Portal de Dados Abertos do STJ | metadados CKAN, `Temas.csv` e `Processos.csv` | relaciona os CSVs por `sequencialPrecedente` e produz questões, teses, processo representativo e links |
| Temas de repercussão geral | exportação do Portal da Repercussão Geral do STF | uma tabela HTML única (rótulo `application/vnd.ms-excel`) | corrige mojibake por célula, extrai os 15 campos, monta a página oficial por tema e os links de detalhamento, manifestação e acórdão |
| Informativo STF | planilha estruturada `Dados_InformativosSTF.xlsx` | um XLSX único (zip+XML, strings inline) lido por streaming | converte datas do serial do Excel, extrai os campos curados por julgado e monta o link oficial da edição; omite as colunas de notícia integral |

Os índices `sumulas_keywords.json` e `sumulas_stf_keywords.json` (súmulas,
`BASE-010`) e os 270 arquivos `indices/lei_*_keywords.json` (legislação,
`BASE-019`) são enriquecimentos derivados, não fontes jurídicas. Eles são
produzidos localmente a partir dos textos publicados, sem modelo ou prompt
externo. No índice de legislação, cada diploma tem um arquivo com os tokens dos
dispositivos que o índice curado preservado (`indexes.keywords`) não cobre; a
união dos dois cobre todos os dispositivos em relação 1:1, e as stopwords são
preservadas para que o ranking reproduza a busca em texto integral do motor.
Algoritmos, parâmetros, fontes, relação 1:1 e data estão em
[`indices-derivados.json`](indices-derivados.json).

Para conferir que os arquivos publicados correspondem exatamente ao processo
versionado:

```bash
python3 ferramentas/manutencao/gerar_indices_derivados.py --verificar
```

Depois de revisar uma atualização das súmulas **ou promover qualquer mudança de
legislação**, regenere os índices com:

```bash
python3 ferramentas/manutencao/gerar_indices_derivados.py --escrever
```

Cada saída registra o SHA-256 da fonte, o total de registros, a versão do gerador e os
parâmetros. Alterar o algoritmo exige nova versão no manifesto e revisão das diferenças
antes da promoção. O auditor estrutural acusa como P0 um índice de legislação
ausente ou dessincronizado do diploma (comparação de SHA-256), então o CI
bloqueia promoções que esqueçam a regeneração — artigos novos nunca mais ficam
invisíveis à busca.

## Expansão da legislação

Diplomas novos entram pela expansão dirigida pelo manifesto
[`expansao/normas.json`](expansao/normas.json), em fatias por grupo:

```bash
python3 ferramentas/manutencao/gerar_expansao_legislacao.py --listar
python3 ferramentas/manutencao/gerar_expansao_legislacao.py --materializar <grupo>
python3 ferramentas/manutencao/atualizar_base_juridica.py executar \
  --execucao <data>-<grupo> --conjunto legislacao_<grupo>
python3 ferramentas/manutencao/revisar_expansao.py \
  --execucao <data>-<grupo> --conjunto legislacao_<grupo>
python3 ferramentas/manutencao/atualizar_base_juridica.py promover \
  --execucao <data>-<grupo> --conjunto legislacao_<grupo> --confirmar PROMOVER
```

Materializar cria o conjunto em `fontes.json`, stubs vazios em `data/` e as
entradas geradas do registro do motor; como o diploma novo parte de coleção
vazia, o diff da execução mostra somente adições e o gate volumétrico exige
`--aceitar-mudanca-volumosa` depois da revisão. O relatório de revisão confere
contagens, sequência de numeração, cabeçalho oficial contra o manifesto e os
dispositivos excluídos por pertencerem a outra norma.
`gerar_expansao_legislacao.py --verificar` confere a sincronia
(manifesto ↔ `fontes.json` ↔ registro do motor ↔ `data/`) e roda nos testes.
Depois da promoção de cada fatia, regenere os índices derivados
(`gerar_indices_derivados.py --escrever`), atualize os fixtures de cobertura,
acrescente consultas julgadas à avaliação e registre a fatia no catálogo.

## Monitoramento de mudanças

O subcomando `monitorar` responde, sem preparar candidatos nem tocar nos dados
publicados, à pergunta "alguma fonte mudou desde o snapshot promovido?":

```bash
python3 ferramentas/manutencao/atualizar_base_juridica.py monitorar
python3 ferramentas/manutencao/atualizar_base_juridica.py monitorar --conjunto legislacao --json
```

Sinal utilizado por família:

| Família | Sinal | Custo |
|---|---|---|
| Legislação | GET condicional (`If-Modified-Since` com o `gerado_em` do snapshot); o Planalto responde 304 quando nada mudou | ~zero quando não há mudança |
| Súmulas STJ | contagem de súmulas no catálogo oficial vs snapshot | download de 1 página |
| Súmulas STF e vinculantes | contagem por estado (ativas, canceladas etc.) no catálogo vs snapshot | download de 1 página |
| Jurisprudência em Teses | edição mais recente do índice vs snapshot | download de 1 página |
| Temas repetitivos | `last_modified` dos recursos na API CKAN do STJ vs `generatedAt` do snapshot | 1 JSON pequeno |
| Temas de repercussão geral | contagem total e por situação na exportação oficial do STF vs snapshot | download de 1 arquivo |
| Informativo STF | GET condicional (`If-Modified-Since` com o `Last-Modified` do snapshot); o STF responde 304 quando a planilha não mudou | ~zero quando não há mudança |

Limitações declaradas do sinal:

- ele indica que **vale preparar um candidato**; a confirmação material vem do
  relatório de diferenças da execução completa;
- `Last-Modified` do Planalto pode mudar por republicação sem alteração
  normativa (observado em republicação em massa de 23/04/2026);
- mudanças de estado de súmulas STJ sem alteração de contagem, revisões de
  edições antigas da Jurisprudência em Teses e alterações de enunciado no STF
  não são captadas pelos sinais baratos;
- reenvio de conteúdo idêntico no CKAN do STJ conta como mudança (os hashes dos
  recursos não são publicados pelo portal);
- alteração de tese de tema de repercussão geral sem mudança de contagem ou de
  situação não é captada pelo sinal do STF; o Informativo STF pausa no recesso
  (jan/jul), então uma semana sem nova edição não é erro do monitor;
- falha de uma fonte não interrompe o monitor: aparece como `erro` no relatório.

O GitHub Actions `monitorar-base.yml` executa o monitor semanalmente e abre ou
atualiza uma issue quando há sinais de mudança ou erros. Nenhuma etapa
automatizada promove dados: a preparação, a revisão e a promoção continuam
seguindo este protocolo.

## Execução recomendada

Use uma identificação legível, normalmente a data da coleta:

```bash
python3 ferramentas/manutencao/atualizar_base_juridica.py executar \
  --execucao 2026-07-17 \
  --conjunto temas_repetitivos_stj
```

Para processar todas as famílias primárias:

```bash
python3 ferramentas/manutencao/atualizar_base_juridica.py executar \
  --execucao 2026-07-17 \
  --conjunto todos
```

Também é possível interromper e conferir cada etapa:

```bash
python3 ferramentas/manutencao/atualizar_base_juridica.py coletar \
  --execucao 2026-07-17 --conjunto sumulas_stj
python3 ferramentas/manutencao/atualizar_base_juridica.py transformar \
  --execucao 2026-07-17 --conjunto sumulas_stj
python3 ferramentas/manutencao/atualizar_base_juridica.py validar \
  --execucao 2026-07-17 --conjunto sumulas_stj
python3 ferramentas/manutencao/atualizar_base_juridica.py comparar \
  --execucao 2026-07-17 --conjunto sumulas_stj
```

Conjuntos separados por vírgula podem compartilhar a mesma execução. `listar` mostra
os identificadores aceitos.

## Artefatos da execução

```text
.atualizacao-base-juridica/<execucao>/
├── bruto/                 # respostas oficiais e cabeçalhos HTTP
├── candidatos/            # JSONs normalizados ainda não publicados
├── relatorios/
│   ├── validacao.json     # erros estruturais e de rastreabilidade
│   ├── diferencas.json    # IDs adicionados, removidos e alterados
│   └── diferencas.md      # resumo legível da comparação
├── backup/                # criado somente pela promoção
├── execucao.json          # URL, horário, bytes, ETag, Last-Modified e SHA-256
└── promocao.json          # recibo dos arquivos efetivamente promovidos
```

## Revisão antes de promover

1. Confira a URL inicial e a URL efetiva registradas no recibo. O coletor aceita
   somente HTTPS nos domínios oficiais permitidos e rejeita redirecionamento externo.
2. Leia `validacao.json`; qualquer erro bloqueia a promoção.
3. Leia `diferencas.md` e examine no JSON os IDs adicionados, removidos e alterados.
4. Em legislação, revise `registros_retidos_sem_correspondencia`: o pipeline preserva
   esses dispositivos em vez de presumir que desapareceram da ordem jurídica.
5. Em súmulas e precedentes, confira especialmente cancelamentos, revisões e mudanças
   de situação.
6. Registre no commit a fonte consultada, a data e a justificativa jurídica.
7. Só então promova o conjunto aprovado:

```bash
python3 ferramentas/manutencao/atualizar_base_juridica.py promover \
  --execucao 2026-07-17 \
  --conjunto temas_repetitivos_stj \
  --confirmar PROMOVER
```

Se e somente se as remoções do relatório tiverem sido confirmadas na fonte, acrescente
`--aceitar-remocoes` ao comando.

Se o gate volumétrico for acionado, examine os IDs alterados e acrescente
`--aceitar-mudanca-volumosa` somente depois de confirmar que a mudança em massa é
intencional.

Depois da promoção — e **antes do commit correspondente** — regenere os
índices derivados (obrigatório para súmulas e legislação; a auditoria acusa
índice dessincronizado), atualize o manifesto de versões dos snapshots (o
resumo das mudanças é computado contra o estado ainda versionado no Git) e
execute a auditoria e os testes do motor:

```bash
python3 ferramentas/manutencao/gerar_indices_derivados.py --escrever
python3 ferramentas/manutencao/gerar_snapshots.py --escrever
python3 ferramentas/manutencao/auditar_base_juridica.py --strict
python3 -m unittest discover -s ferramentas/manutencao/tests -p 'test_*.py'
cd ferramentas/pesquisa/vade-mecum
bun run typecheck
bun test
```

O manifesto [`snapshots.json`](snapshots.json) (contrato em
[`snapshots.schema.json`](snapshots.schema.json)) registra, por arquivo
publicado, a versão, o SHA-256, a data de geração, a contagem de registros e o
resumo das mudanças promovidas (quantos IDs foram adicionados, removidos e
alterados, com amostra). `gerar_snapshots.py --verificar` roda no CI e acusa
promoção sem o manifesto atualizado.

## Política de falha

- URL inicial ou redirecionada fora da allowlist, tipo de conteúdo incompatível,
  download vazio, erro HTTP, catálogo sem registros ou adaptador desconhecido encerra
  a execução;
- JSON inválido, contagem divergente, campo obrigatório vazio, caminho absoluto ou
  URL fora dos domínios oficiais falha na validação;
- a auditoria estrutural roda em modo estrito no CI e bloqueia regressões detectáveis;
- falha de validação bloqueia a promoção;
- qualquer remoção bloqueia a promoção até receber autorização adicional explícita;
- mudança acima de 25% da coleção e de 20 registros exige autorização adicional;
- uma execução já promovida não pode sobrescrever seu backup;
- artefatos brutos não são versionados por padrão; seus checksums e cabeçalhos ficam
  no recibo local da execução.
