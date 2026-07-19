# BASE-013 — snapshots e diferenças versionados

| Campo | Valor |
|---|---|
| Verificação | 19 de julho de 2026 (UTC) |
| Escopo | 278 arquivos publicados: 273 diplomas de legislação, súmulas STJ/STF/vinculantes, Jurisprudência em Teses e temas repetitivos |
| Ferramenta | `ferramentas/manutencao/gerar_snapshots.py` (biblioteca padrão + Git) |

## Limitação anterior

O repositório versionava os dados no Git, mas nenhum manifesto registrava, por
arquivo publicado, qual versão de snapshot estava em vigor, com qual checksum e
com qual resumo de mudanças. O relatório de diferenças de cada execução
(`diferencas.json`) fica fora do versionamento, em
`.atualizacao-base-juridica/`, e se perde com a limpeza local.

## Mudança realizada

- `base-juridica/snapshots.json` registra por arquivo: `versao` (contador que
  avança a cada mudança de conteúdo), `sha256`, `gerado_em` (declarado pelo
  próprio arquivo), `registros`, `colecao` e `mudancas` (IDs adicionados,
  removidos e alterados em relação à versão anterior, com amostra de até dez);
- o estado anterior vem de `git show HEAD:<arquivo>`, por isso o fluxo
  documentado em `ATUALIZACAO.md` manda atualizar o manifesto **depois da
  promoção e antes do commit**; a primeira versão é a linha de base
  (`mudancas` nula);
- `--verificar` confere SHA-256, contagens e cobertura 1:1 entre manifesto e
  arquivos publicados, sem rede; o GitHub Actions executa a verificação em
  passo próprio ("Verificar o manifesto de versões dos snapshots");
- remoção de arquivo publicado remove a entrada (a remoção do dado em si já
  passa pelos gates de promoção, que exigem `--aceitar-remocoes`);
- os índices derivados não entram: têm manifesto e verificação próprios
  (`indices-derivados.json`, BASE-010/BASE-019).

## Validação executada

```bash
python3 ferramentas/manutencao/gerar_snapshots.py --escrever   # backfill inicial
python3 ferramentas/manutencao/gerar_snapshots.py --verificar
python3 -m unittest discover -s ferramentas/manutencao/tests -p 'test_*.py'
```

O backfill inicial criou 278 entradas na versão 1 (linha de base). Cinco
testes cobrem a coerência do manifesto publicado, a cobertura dos arquivos
rastreados, o cálculo do resumo de mudanças, a linha de base sem resumo e a
detecção de SHA divergente.

## Limitações declaradas

- o manifesto rastreia as famílias publicadas conhecidas (legislação por
  `lei_*.json` e os cinco arquivos das demais famílias); uma família nova
  precisa ser acrescentada em `FAMILIAS_FIXAS` ao ser incorporada;
- o resumo de mudanças depende de o manifesto ser atualizado antes do commit
  da promoção; se o passo for esquecido, o CI acusa a divergência de SHA, mas
  o resumo daquela promoção sai agregado no próximo `--escrever`.
