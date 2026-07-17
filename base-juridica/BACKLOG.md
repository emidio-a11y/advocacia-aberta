# Backlog de confiabilidade da base jurídica

Este backlog transforma os achados do [catálogo](CATALOGO.md) em trabalho verificável.
Nenhum item deve ser encerrado apenas porque a saída “parece correta”.

## Prioridades

- **P0 — confiança operacional:** afeta cobertura, execução ou possibilidade de
  conferir a fonte.
- **P1 — integridade e proveniência:** afeta coerência, atualização ou compreensão do
  dado.
- **P2 — robustez e evolução:** melhora testes, arquitetura e qualidade de busca.

## P0 — confiança operacional

| ID | Problema | Critério de aceite | Estado |
|---|---|---|---|
| `BASE-001` | Formatadores omitem URLs de súmulas, teses e temas | Toda resposta dessas famílias exibe ao menos um link oficial existente no registro | aberto |
| `BASE-002` | Busca legislativa `todos` cobre somente 6 dos 11 diplomas disponíveis | Lista única de códigos alimenta carregamento, `todos`, CLI, MCP e documentação; teste cobre os 11 | aberto |
| `BASE-003` | `EI` é declarado, mas `lei_ei.json` não existe | Adicionar conjunto verificado ou remover o código de todas as superfícies; consulta nunca termina em erro de módulo | aberto |
| `BASE-004` | Não existe pipeline reproduzível de atualização | Cada família possui coletor, transformação documentada, validação, versão e instrução de execução | aberto |

## P1 — integridade e proveniência

| ID | Problema | Critério de aceite | Estado |
|---|---|---|---|
| `BASE-005` | CTB informa 390 registros no metadado, mas contém 389 | Conferir na fonte e corrigir o registro ausente ou o metadado, com justificativa registrada | aberto |
| `BASE-006` | `JT_179_T19` tem enunciado vazio | Conferir a edição oficial; restaurar o enunciado ou documentar por que o registro não representa uma tese | aberto |
| `BASE-007` | Metadados de temas expõem caminhos locais de `Downloads` | Substituir por origem pública, data, método e identificador reproduzível, sem caminho pessoal | aberto |
| `BASE-008` | Descrição MCP declara 792 edições, mas existem 269 | Gerar descrição a partir do metadado ou corrigir o valor; teste impede nova divergência | aberto |
| `BASE-009` | “Fonte primária” e força jurídica não seguem taxonomia documentada | Definir e revisar rótulos para texto normativo, fonte oficial, compilação institucional, precedente e índice derivado | aberto |
| `BASE-010` | Índices de palavras-chave não têm processo reproduzível | Versionar geração, modelo, prompt/parâmetros, relação com a base e teste de cobertura | aberto |

## P2 — robustez e evolução

| ID | Trabalho | Critério de aceite | Estado |
|---|---|---|---|
| `BASE-011` | Criar testes de esquema e integridade | CI valida JSON, campos obrigatórios, contagens, URLs, códigos e referências cruzadas | aberto |
| `BASE-012` | Testar qualidade da recuperação | Conjunto de consultas e resultados esperados mede precisão, cobertura e regressões | aberto |
| `BASE-013` | Versionar snapshots e diferenças | Manifesto por conjunto registra versão, checksum, coleta e resumo das mudanças | aberto |
| `BASE-014` | Neutralizar o nome técnico `busca_delfus` | Migrar para `motores/pesquisa-juridica/` preservando compatibilidade temporária | aberto |
| `BASE-015` | Integrar auditoria estrutural ao fluxo de contribuição | GitHub Actions executa o auditor e apresenta seus achados em toda mudança da base | aberto |

## Ordem sugerida de execução

1. `BASE-001`, porque a fonte já existe e está sendo descartada na saída.
2. `BASE-002`, `BASE-003` e `BASE-008`, para alinhar promessa e execução do motor.
3. `BASE-004`, antes de qualquer atualização ampla dos snapshots.
4. `BASE-005`, `BASE-006` e `BASE-007`, consultando os materiais oficiais.
5. `BASE-009` e `BASE-010`, consolidando proveniência e linguagem.
6. `BASE-011` a `BASE-015`, transformando as garantias em manutenção contínua.

## Regra de encerramento

Um item que altera conteúdo jurídico deve registrar a fonte oficial consultada, a data
da verificação, a mudança realizada e a validação executada. Correções puramente
técnicas ainda devem incluir teste que reproduza a falha anterior.
