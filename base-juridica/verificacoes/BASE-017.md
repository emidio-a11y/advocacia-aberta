# Verificação — BASE-017: monitoramento de mudanças nas fontes

| Campo | Valor |
|---|---|
| Data | 2026-07-18 |
| Item | Detecção de mudança nas fontes oficiais sem preparar candidatos |
| Estado | concluído |

## O que foi verificado

### 1. Sondagem empírica das fontes (2026-07-18)

- O Planalto responde `ETag` e `Last-Modified` válidos na URL canônica em
  minúsculas; as URLs antigas do manifesto (com maiúsculas) recebiam `301`, o
  que impedia a resposta condicional direta. As seis URLs alteradas no
  manifesto foram testadas individualmente e respondem `200` sem
  redirecionamento com o User-Agent do pipeline.
- O SCON do STJ e o portal do STF não emitem `ETag` nem `Last-Modified`; para
  essas famílias o sinal é a comparação de contagens extraídas do catálogo.
- A API CKAN do STJ (`package_show`) expõe `metadata_modified` do dataset e
  `last_modified` por recurso; durante a verificação o dataset apresentou
  também indisponibilidade transitória (HTTP 504), tratada pelo monitor como
  `erro` sem interromper as demais famílias.

### 2. Execução real do monitor

`python3 ferramentas/manutencao/atualizar_base_juridica.py monitorar` em
2026-07-18 produziu:

- legislação: 11 de 11 diplomas com `Last-Modified` posterior ao snapshot
  local de janeiro de 2026 (`mudou`);
- súmulas STJ: contagem igual (676) — `sem_mudanca`;
- súmulas STF: `mudou` (728 ativas e 6 canceladas na fonte vs 724 e 10 no
  snapshot);
- súmulas vinculantes: contagens iguais (63) — `sem_mudanca`;
- Jurisprudência em Teses: `mudou` (edição 284 na fonte vs 271 no snapshot);
- temas repetitivos: `erro` transitório (504 na API CKAN) registrado sem
  interromper o monitor.

Os sinais de legislação e Jurisprudência em Teses foram confirmados de forma
independente: a execução `2026-07-18` do pipeline preparou candidatos de
legislação com adições e alterações reais, e o índice oficial da JT exibe a
edição 284 publicada em 17/07/2026.

### 3. Testes

`ferramentas/manutencao/tests/test_monitorar.py` cobre:

- 304 → `sem_mudanca` e 200 → `mudou` na legislação, com o `If-Modified-Since`
  derivado do `gerado_em` publicado;
- arquivo publicado ausente → `indeterminado`;
- contagem do catálogo STJ ignora blocos sem número ou verbete;
- mudança de estado no catálogo STF (ativa → cancelada) → `mudou`;
- edição mais recente da JT extraída de `numeroSumula`/`data-edicao` (os
  regexes legados do coletor truncavam dígitos em `value="271"` e
  `livre='271'` e não foram reutilizados);
- CKAN mais novo que `generatedAt` → `mudou`;
- falha de coleta vira `erro` sem derrubar o monitor;
- a CLI aceita `monitorar` sem `--execucao`.

A suíte completa (`python3 -m unittest discover -s ferramentas/manutencao/tests
-p 'test_*.py'`) passou com 35 testes.

## Limitações registradas

- O sinal indica que vale preparar candidato; não substitui o relatório de
  diferenças nem a revisão humana da promoção.
- `Last-Modified` do Planalto pode refletir republicação sem mudança normativa
  (cluster observado em 23/04/2026).
- Mudanças que não alteram contagens (estados no STJ com contagem estável,
  enunciados no STF, revisões de edições antigas da JT) não são captadas pelos
  sinais baratos.
- O CKAN do STJ não publica hashes de recurso; reenvio idêntico conta como
  mudança.
