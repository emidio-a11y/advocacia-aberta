# BASE-006 — registro espúrio na edição 179

| Campo | Registro |
|---|---|
| Verificado em | 17 de julho de 2026 |
| Escopo | edição 179 da Jurisprudência em Teses do STJ |
| Problema | `JT_179_T19` possuía enunciado vazio e URL sem fragmento textual |
| Decisão | remover o registro, pois a fonte oficial não contém tese 19 |

## Fontes oficiais conferidas

- [página da edição 179 no STJ](https://processo.stj.jus.br/SCON/jt/toc.jsp?livre=%40DOCN%3D%27000007424%27);
- [PDF institucional da edição 179](https://www.stj.jus.br/docs_internet/jurisprudencia/jurisprudenciaemteses/Jurisprudencia%20em%20Teses%20179%20-%20Orientacoes%20Jurisprudenciais%20Sobre%20a%20Covid-19%20-%20II.pdf).

As duas publicações apresentam dez teses, numeradas sequencialmente de 1 a 10. Não há
tese 19 nem salto de numeração. A última tese trata da inaplicabilidade dos benefícios
dos arts. 4º e 5º da Recomendação n. 62/2020 do CNJ a condenados por crime equiparado
a hediondo.

## Reprodução pelo pipeline

A página oficial foi coletada em 17 de julho de 2026 com resposta HTTP 200. O
adaptador `jt_stj_html_v1` produziu exatamente estes identificadores:

`JT_179_T01` a `JT_179_T10`.

Nenhum enunciado vazio foi produzido. Portanto, `JT_179_T19` era um artefato legado
de extração, e completar seu texto seria inventar conteúdo ausente da fonte.

## Alteração e validação

- `JT_179_T19` foi removido;
- `total_teses` passou de 3.372 para 3.371;
- a contagem de `Orientações Jurisprudenciais` passou de 72 para 71;
- as 269 edições e os demais 3.371 registros foram preservados;
- um teste de regressão exige que a edição 179 contenha somente `T01` a `T10`;
- a auditoria estrutural deixou de emitir `TESE_VAZIA`.
