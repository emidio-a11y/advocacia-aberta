# Como contribuir

A Advocacia Aberta melhora pela revisão. Protocolos, ferramentas e bases devem poder ser
criticados, testados, corrigidos e aperfeiçoados — é o [princípio da melhora pela revisão](PRINCIPIOS.md).
Toda contribuição é bem-vinda, das menores correções de fonte às discussões de método.

> **Antes de tudo:** nunca envie dados de casos reais. Autos, áudios, dados pessoais, peças e
> estratégias de clientes permanecem privados — leia a [Política de sigilo e dados](SIGILO-E-DADOS.md).
> Exemplos públicos devem ser `SINTÉTICO`, `FONTE PÚBLICA` ou `ANONIMIZADO`, sempre marcados.

## Formas de contribuir

- **Assinar o Manifesto.** Se você se reconhece nos princípios, abra um PR acrescentando seu nome
  em [“Quem assina”](MANIFESTO.md#quem-assina). Assinar é adesão a princípios — não é oferta de
  serviço nem captação.
- **Corrigir a base jurídica.** Achou um dispositivo desatualizado, uma tese vazia, um link
  quebrado? Abra uma issue ou um PR seguindo o padrão dos relatórios em
  [`base-juridica/verificacoes/`](base-juridica/verificacoes/): fonte consultada, mudança feita e
  como conferir. Veja o [backlog](base-juridica/BACKLOG.md) e a [avaliação](base-juridica/AVALIACAO-RECUPERACAO.md).
- **Melhorar ou propor um protocolo (skill).** A fonte canônica de cada skill vive em
  `.agents/skills/<nome>/SKILL.md`. Edite ali e rode a sincronização (ver abaixo) — nunca edite os
  espelhos à mão.
- **Reportar um problema ou propor uma ideia.** Use as _Issues_ para o que é trabalho a fazer e as
  _Discussions_ para conversa aberta de método.

## Fluxo de trabalho

1. Faça um fork e crie um branch descritivo.
2. Faça a mudança na **fonte canônica** correspondente.
3. Se tocou em skills, sincronize os espelhos e valide a portabilidade:
   ```bash
   bash ferramentas/manutencao/sincronizar-skills.sh
   ```
   O comando gera os espelhos (`.claude/skills/` e `skills/`) a partir de `.agents/skills/` e roda
   o verificador. O mesmo verificador roda no GitHub Actions — um PR com espelho fora de sincronia
   não passa.
4. Se tocou no motor de busca ou na base, rode o gate de regressão:
   ```bash
   cd ferramentas/pesquisa/vade-mecum && bun run avaliar
   ```
5. Abra o PR descrevendo **o que**, **por quê** e **como conferir**. Fonte antes da afirmação:
   toda mudança em dado jurídico aponta a origem oficial.

## Critérios de qualidade

- Fonte verificável e proveniência declarada; incerteza registrada, não escondida.
- Sem número sem fonte; sem citação de lei ou precedente que não venha da base ou de fonte oficial.
- Portabilidade preservada: uma skill não deve depender de um único fornecedor de agente.
- Método aberto, casos privados — sempre.
