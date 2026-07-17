# BASE-014 — motor Vade Mecum

| Campo | Valor |
|---|---|
| Migração | 17 de julho de 2026 |
| Nome público | Vade Mecum |
| Identificador técnico | `vade-mecum` |
| Caminho | `ferramentas/pesquisa/vade-mecum/` |
| Alias legado | nenhum |

## Mudança realizada

- o diretório completo do motor e dos dados foi movido preservando o histórico Git;
- `package.json`, `bun.lock` e o nome anunciado pelo MCP foram atualizados;
- manifestos, geradores, pipeline, auditor, testes e GitHub Actions usam o novo caminho;
- as skills canônicas foram alteradas e o espelho Claude foi regenerado;
- setup, templates e documentação pública usam o nome Vade Mecum;
- a CLI e a skill de pesquisa foram alinhadas à taxonomia documental do `BASE-009`.

Esta é uma mudança de caminho deliberadamente incompatível. O repositório não mantém
um diretório ou alias com o identificador anterior, conforme a decisão de remover o
nome por completo.

## Validação executada

```bash
python3 ferramentas/manutencao/gerar_indices_derivados.py --verificar
python3 ferramentas/manutencao/verificar_compatibilidade.py
python3 ferramentas/manutencao/auditar_base_juridica.py --strict
python3 -m unittest discover -s ferramentas/manutencao/tests -p 'test_*.py'
cd ferramentas/pesquisa/vade-mecum
bun run typecheck
bun test
```

Além da bateria funcional, a regressão de nomenclatura verifica arquivos e caminhos
textuais do repositório para impedir o retorno do identificador removido.
