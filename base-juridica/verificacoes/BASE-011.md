# BASE-011 — testes de esquema e integridade

| Campo | Valor |
|---|---|
| Verificação | 19 de julho de 2026 (UTC) |
| Escopo | manifestos versionados, registros publicados das quatro famílias e referências cruzadas do corpus de avaliação |
| Ferramenta | `ferramentas/manutencao/validar_integridade.py` (biblioteca padrão) |

## Limitação anterior

Os esquemas (`fontes.schema.json`, `indices-derivados.schema.json`) eram
documentação sem execução: nada no CI conferia o contrato de cada registro
publicado, e um julgamento do corpus de avaliação podia apontar para um
dispositivo, súmula, tese ou tema que deixasse de existir sem que nenhum teste
acusasse.

## O que o validador confere

- **Manifestos**: `fontes.json` (versão de esquema, política de promoção nos
  limites, conjuntos com família, fontes com id/URL/arquivo bruto e URL em
  domínio oficial com HTTPS); `indices-derivados.json` e `expansao/normas.json`
  pelos próprios carregadores versionados, que já rejeitam algoritmo, modelo ou
  prompt fora do contrato;
- **Legislação** (273 diplomas): `_meta` com campos obrigatórios; cada
  dispositivo com `numero` igual à chave, texto não vazio, URL oficial,
  hierarquia no contrato do pipeline e encadeamento `prev`/`next` coerente com
  a ordem do arquivo; registros retidos do snapshot legado são aceitos com a
  forma antiga de hierarquia (artefatos preservados, documentados no
  `CATALOGO.md`);
- **Súmulas STJ, STF e vinculantes**: número, enunciado, estado e URL oficial;
- **Jurisprudência em Teses**: id, edição, enunciado e URL oficial;
- **Temas repetitivos**: número, situação e página oficial do tema;
- **Referências cruzadas**: todo ID em `relevantes`/`obrigatorios` do corpus de
  avaliação existe na base correspondente, e o filtro de cada caso de
  legislação aponta diploma existente.

## Validação executada

```bash
python3 ferramentas/manutencao/validar_integridade.py
python3 -m unittest discover -s ferramentas/manutencao/tests -p 'test_*.py'
python3 ferramentas/manutencao/auditar_base_juridica.py --strict
```

A base publicada passou sem achados. Quatro testes cobrem a base íntegra, a
rejeição de URL fora dos domínios oficiais, a detecção de referência órfã no
corpus e a detecção de hierarquia fora do contrato em registro não retido. O
GitHub Actions executa o validador em todo `push` e `pull_request`, no passo
"Validar esquemas, campos obrigatórios e referências cruzadas".

## Achado da primeira execução

A primeira rodada acusou 36 dispositivos com "hierarquia incompleta". A
investigação confirmou que todos são registros retidos sem correspondência
(`registros_retidos_sem_correspondencia`), preservados do snapshot legado com a
forma antiga de hierarquia — chaves em português (`titulo`, `capitulo`,
`livro`, `parte`) e com os **nomes reais** das divisões. O validador passou a
reconhecê-los como artefatos preservados; a observação alimenta o `BASE-018`
(o adaptador atual captura nomes genéricos onde o legado tinha nomes reais).
