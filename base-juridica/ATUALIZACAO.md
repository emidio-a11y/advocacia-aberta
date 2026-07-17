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
anteriores em `backup/` dentro da execução.

Se o relatório contiver qualquer remoção, a promoção ainda é recusada. Depois da
conferência individual dos IDs, uma remoção intencional exige também
`--aceitar-remocoes`.

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

Os índices `sumulas_keywords.json` e `sumulas_stf_keywords.json` são enriquecimentos
derivados, não fontes jurídicas. Modelo, prompt e parâmetros ainda serão tratados no
`BASE-010`; por isso o manifesto os identifica, mas este pipeline não finge que
consegue regenerá-los.

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

1. Confira se a coleta veio dos domínios e recursos declarados no manifesto.
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

Depois da promoção, execute a auditoria e os testes do motor:

```bash
python3 ferramentas/manutencao/auditar_base_juridica.py --strict
python3 -m unittest discover -s ferramentas/manutencao/tests -p 'test_*.py'
cd ferramentas/pesquisa/busca_delfus
bun run typecheck
bun test
```

## Política de falha

- download vazio, erro HTTP, catálogo sem registros ou adaptador desconhecido encerra
  a execução;
- JSON inválido, contagem divergente, campo obrigatório vazio, caminho absoluto ou
  URL fora dos domínios oficiais falha na validação;
- a auditoria estrutural roda em modo estrito no CI e bloqueia regressões detectáveis;
- falha de validação bloqueia a promoção;
- qualquer remoção bloqueia a promoção até receber autorização adicional explícita;
- mudança volumosa não é aprovada automaticamente: aparece no relatório e exige
  decisão humana;
- artefatos brutos não são versionados por padrão; seus checksums e cabeçalhos ficam
  no recibo local da execução.
