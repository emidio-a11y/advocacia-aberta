# Base jurídica

Esta pasta documenta o acervo jurídico estruturado da Advocacia Aberta.

Os JSONs ainda permanecem em
`ferramentas/pesquisa/busca_delfus/data/` para preservar o funcionamento do motor
atual. A migração física será feita somente depois das correções de cobertura e da
definição de uma rotina reproduzível de atualização.

- [CATALOGO.md](CATALOGO.md) — conteúdo, cobertura, proveniência e ressalvas.
- [BACKLOG.md](BACKLOG.md) — correções priorizadas e critérios de aceite.

Para repetir a auditoria estrutural:

```bash
python3 ferramentas/manutencao/auditar_base_juridica.py
```

O relatório mede os arquivos locais. Ele não confirma vigência nem substitui a
consulta à fonte oficial.
