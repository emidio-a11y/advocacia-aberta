# Créditos e proveniência

A Advocacia Aberta distribui o conteúdo **autoral** (protocolos, ferramentas, motores,
documentação e templates) sob a licença [MIT](LICENSE). Materiais de
terceiros e fontes oficiais **preservam a sua situação jurídica, os seus termos de uso e a
sua proveniência**, conforme o [Manifesto](MANIFESTO.md), os [Princípios](PRINCIPIOS.md) (método
aberto e execução local) e a
[Política de sigilo e dados](SIGILO-E-DADOS.md). A licença MIT não relicencia direitos que o
projeto não possui.

## Fontes jurídicas oficiais

A base jurídica reúne legislação, súmulas, teses, temas e julgados a partir de **fontes
públicas oficiais** (Planalto, STF, STJ e correlatos). Textos legais e decisões judiciais
são de fonte oficial; o trabalho autoral está na **curadoria** — reunião, normalização,
indexação, classificação, preservação de links e conexão com os protocolos.

Proveniência, cobertura, data de coleta e ressalvas de cada conjunto estão registradas em
[`base-juridica/CATALOGO.md`](base-juridica/CATALOGO.md). Constar de fonte pública não
elimina deveres de sigilo, proteção de dados e prudência na reutilização.

## Design do template de parecer

O template [`templates/parecer-trafico-drogas.typ`](templates/parecer-trafico-drogas.typ)
usa um sistema de componentes de **Legal Design** (paleta, badges processuais, blocos de
silogismo, callouts de jurisprudência e lei) **inlinado no próprio arquivo, sem dependência
de import externo**. Esses componentes derivam de um template de legal design
(`template-af.typ`) empregado anteriormente pelo autor em trabalho para **Souza Neto
Advocacia**, e foram reescritos para este repositório.

O **conteúdo jurídico** do parecer é `SINTÉTICO`: relatório, análise e parecer final são
placeholders (`«PREENCHER»`), sem origem em caso real. Os precedentes citados nos blocos de
jurisprudência são **reais e verificados** via Vade Mecum, mantidos como exemplos.

## Ferramentas e formatos de terceiros

O projeto executa com apoio de ferramentas de código aberto de terceiros — entre outras,
[Bun](https://bun.sh), [Typst](https://typst.app), [uv](https://github.com/astral-sh/uv),
[ffmpeg](https://ffmpeg.org) e [whisper](https://github.com/openai/whisper) —, cada uma sob
a sua própria licença. A instalação é feita sob demanda (`preparar-ambiente` / `setup.sh`) e
nenhuma delas é redistribuída dentro deste repositório.
