# Avaliação da recuperação jurídica

Este protocolo mede a capacidade do **Vade Mecum** de recuperar registros relevantes
para consultas textuais. Ele protege o ranking contra regressões reproduzíveis, mas
não confirma vigência, força jurídica, aplicabilidade ao caso ou completude do acervo.

## Corpus versionado

O arquivo
[`consultas.json`](../ferramentas/pesquisa/vade-mecum/avaliacao/consultas.json)
contém 97 consultas: as 24 avaliadas em 17 de julho de 2026; as acrescentadas em
19 de julho de 2026 pela expansão da legislação — dez casos do
piloto, dois a três casos julgados por fatia promovida (estatutos,
trabalhista, codificadas, penal, tributária, previdenciária, cível/família, eleitoral, imobiliário/agrário, administrativa, processual/constitucional, consumidor/bancária, empresarial e regulatória), dois casos do Código
Comercial de 1850 (`CCOM`), dois do Decreto 2.044/1908 (`D2044`) e dois do
Marco Legal dos Contratos de Seguro (`L15040`); e nove casos das famílias de
jurisprudência de alto volume incorporadas na mesma data — três para os temas de
repercussão geral do STF (`temas_rg_stf`), três para o Informativo STF
(`informativo_stf`) e três para os espelhos de acórdãos do STJ (`espelhos_stj`),
julgados nas promoções respectivas:

| Família | Consultas |
|---|---:|
| Súmulas STJ | 4 |
| Súmulas STF | 3 |
| Súmulas vinculantes | 4 |
| Jurisprudência em Teses STJ | 4 |
| Temas repetitivos STJ | 3 |
| Temas de repercussão geral STF | 4 |
| Informativo STF | 3 |
| Espelhos de acórdãos STJ | 3 |
| Legislação | 69 |

Cada caso registra consulta, filtro, justificativa, conjunto de resultados relevantes
e resultados canônicos obrigatórios. Os julgamentos foram feitos sobre o conteúdo do
snapshot local, não gerados pelo próprio algoritmo de busca. IDs obrigatórios impedem
que um resultado central desapareça mesmo quando as métricas agregadas ainda passam.

Os julgamentos representam um conjunto controlado de regressão. Eles não afirmam que
todo resultado relevante possível foi identificado em todo o acervo.

Um caso julgado da LC 227/2026 (competências do Comitê Gestor do IBS) foi deliberadamente
**deixado fora** do corpus: a consulta devolve as cláusulas de alteração da lei à frente
dos dispositivos de competência, e mantê-lo exigiria afrouxar o limiar do grupo. O defeito
está registrado no `BASE-041`, com o caso a reintroduzir quando o ranking o resolver.

Em 23 de julho de 2026 entraram três casos da Lei Complementar 214/2025 (split
payment, Imposto Seletivo e devolução a famílias de baixa renda) e três das leis
complementares promovidas na mesma data (LC 225/2026, Código de Defesa do Contribuinte,
e LC 220/2025, Sistema Nacional de Educação), além de dois casos de recuperação por
equivalência declarada
(`rg-nepotismo` e `sv-nepotismo-termo-unico`): a Súmula Vinculante 13 e o Tema 1000 do
STF descrevem a conduta sem escrever "nepotismo", e a busca léxica sozinha não os
alcançava. A avaliação roda sobre o que o usuário recebe — resultados diretos **mais**
os trazidos pelo léxico (`data/lexico_juridico.json`), para que a expansão seja medida
tanto no ganho quanto no ruído.

## Métricas

O corte é `k = 5` e as métricas são agregadas sobre as consultas:

- **precisão@5:** acertos divididos pelos resultados efetivamente retornados na janela
  de até cinco itens;
- **recall julgado@5:** resultados relevantes recuperados divididos pelo conjunto
  relevante julgado e versionado;
- **cobertura de casos:** proporção de consultas com ao menos um resultado relevante;
- **cobertura de obrigatórios:** proporção de consultas que preserva todos os seus IDs
  canônicos;
- **MRR:** média do inverso da posição do primeiro resultado relevante.

Há limiares globais e um limiar de precisão para cada família. A separação impede que
o bom desempenho de um conjunto compense silenciosamente uma regressão em outro.

## Linha de base

| Escopo | Precisão@5 | Recall julgado@5 | Cobertura | Obrigatórios | MRR |
|---|---:|---:|---:|---:|---:|
| Global | 0,8025 | 0,9907 | 1,0000 | 1,0000 | 1,0000 |
| Súmulas STJ | 0,6667 | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| Súmulas STF | 0,5714 | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| Súmulas vinculantes | 0,6000 | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| Jurisprudência em Teses | 0,9000 | 0,9000 | 1,0000 | 1,0000 | 1,0000 |
| Temas repetitivos | 0,8667 | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| Temas de repercussão geral STF | 0,7333 | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| Informativo STF | 0,8000 | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| Espelhos de acórdãos STJ | 0,9333 | 1,0000 | 1,0000 | 1,0000 | 1,0000 |
| Legislação | 0,8127 | 0,9957 | 1,0000 | 1,0000 | 1,0000 |

Linha de base medida em 19 de julho de 2026 (UTC), após a atualização integral dos
snapshots e a incorporação dos diplomas da expansão (piloto de 8 leis e fatias já
promovidas da expansão). O caso
`jt-trafico-dosimetria` teve os julgamentos revisados com justificativa registrada
no corpus: a atualização oficial da edição 45 reescreveu a tese 4, que deixou de
versar diretamente sobre aplicação da pena. Os dez casos dos diplomas novos foram
julgados sobre o conteúdo dos snapshots; esses diplomas não têm índice curado e a
busca usa o texto integral dos dispositivos. Três casos (Código Florestal,
lavagem de dinheiro e interceptação) tiveram os julgamentos revisados com
justificativa registrada depois que a correção do rótulo "Art. 1º-A" separou
dispositivos antes absorvidos no artigo anterior.

O `BASE-019` (19 de julho de 2026) introduziu os índices derivados de legislação
para todos os diplomas e o complemento dos índices curados do núcleo. A avaliação
arbitrou a estratégia: a substituição do índice curado (precisão de legislação
0,5528) e a geração aditiva com a pontuação legada (0,5915) foram reprovadas; a
estratégia adotada — índice curado intacto mais índice derivado que reproduz a
semântica da busca em texto integral, com stopwords preservadas — retornou
exatamente os mesmos resultados nos 74 casos então existentes, caso a caso. A
mudança funcional é que 314 dispositivos do núcleo antes invisíveis à busca
textual passaram a ser recuperáveis, com teste de regressão próprio fora deste
corpus.

Na mesma data, as promoções do Código Comercial de 1850 (`CCOM`, 448
dispositivos do corpo do Código capturados com o marcador `fim_antes`) e do
Decreto 2.044/1908 (`D2044`, 57 dispositivos da página oficial localizada em
`historicos/dpl/dpl2044-1908.htm`) e da Lei 15.040/2024 (`L15040`, 134
dispositivos — sede atual do contrato de seguro após revogar os arts. 757 a
802 do CC) acrescentaram seis casos julgados sobre o texto dos snapshots
(avaria grossa, carta-partida de fretamento, aval, nota promissória, contrato
de seguro e prescrição securitária), levando o corpus a 80 consultas naquele
passo; a variação em relação à rodada anterior
(global 0,8121 → 0,8000; legislação 0,8295 → 0,8127) decorreu exclusivamente dos
casos novos, cujos conjuntos julgados incluem dispositivos além do top-5
retornado — nenhum resultado dos 74 casos anteriores mudou.

Ainda em 19 de julho de 2026, as três famílias de jurisprudência de alto volume
promovidas nos `BASE-021` (temas de repercussão geral do STF), `BASE-025`
(Informativo STF) e `BASE-026` (espelhos de acórdãos do STJ) receberam três casos
julgados cada, sobre o conteúdo dos snapshots, levando o corpus a **89 consultas**.
A tabela de linha de base acima é a medida após essa incorporação: o global passou
de 0,8000 para 0,8025; as três novas famílias preservam recall julgado@5, cobertura
e todos os obrigatórios (precisão@5 de 0,7333 nos temas de repercussão geral, 0,8000
no Informativo STF e 0,9333 nos espelhos de acórdãos), e nenhum resultado dos casos
anteriores mudou.

Os valores são uma linha de base operacional, não uma alegação de precisão geral para
qualquer consulta jurídica.

## Execução e manutenção

```bash
cd ferramentas/pesquisa/vade-mecum
bun run avaliar
```

O comando encerra com erro quando um limiar ou resultado obrigatório deixa de ser
atendido. Os mesmos critérios rodam nos testes e no GitHub Actions.

Ao alterar o ranking ou o acervo:

1. execute o corpus antes e depois da mudança;
2. examine os enunciados e dispositivos dos resultados alterados;
3. ajuste julgamentos somente com justificativa humana registrada;
4. não reduza limiares para acomodar uma regressão sem documentá-la;
5. acrescente consultas para vocabulários, ramos e falhas ainda não representados.

Uma avaliação externa futura pode ampliar o corpus, usar julgadores independentes e
medir concordância entre avaliadores. Essa ampliação não é pré-condição para o gate de
regressão atual.
