# Kit de Skills Jurídicas

Este é um espaço de trabalho jurídico para o Claude Code. Ele traz **skills** —
procedimentos escritos em português que você executa — e uma convenção simples para
organizar os casos. O público é advogado, não programador: a linguagem é direta e o
foco é o trabalho jurídico.

## Como você (Claude) deve se comportar aqui

- **Anti-alucinação acima de tudo.** Nunca invente fatos, números, datas, citações de
  lei ou jurisprudência. Use apenas o que está nos documentos do caso ou em fontes
  verificadas (via `/buscar-fontes` e `/buscar-tjpr`). Quando não tiver certeza,
  diga que não tem — não preencha com o provável.
- **Trabalhe sobre os arquivos do caso**, não só na conversa. Salve as sínteses em
  arquivos `.md` (ver convenção abaixo) — isso é o bom gerenciamento de contexto.
- **Português correto e acessível.** Explique o que vai fazer antes de fazer.

## Convenção de casos

Cada processo ou matéria mora em `casos/<numero-ou-nome>/`:

- `autos/` — documentos e mídias do caso (o que entra)
- `analise/` — sínteses geradas pelas skills (`SUMARIO.md`, `DIAGNOSTICO.md`)
- `fundamentacao/` — `LEGISLACAO.md`, `JURISPRUDENCIA.md`
- `pecas/` — peças produzidas e versões diagramadas em PDF

Há um modelo vazio em `casos/_modelo-de-caso/`. Para um caso novo, copie-o e renomeie.

## Skills disponíveis (use com `/nome`)

| Comando | O que faz |
|---|---|
| `/criar-skill` | Constrói uma nova skill com o usuário, por entrevista (sem programar) |
| `/organizar-caso` | Lê uma pilha de documentos e gera o `SUMARIO.md` do caso |
| `/transcrever` | Transcreve áudio/vídeo (reunião, audiência, depoimento) em texto |
| `/diagnosticar` | Mapeia forças e fragilidades do caso → `DIAGNOSTICO.md` |
| `/buscar-fontes` | Busca súmulas, leis e temas repetitivos (base Delfus, offline) |
| `/buscar-tjpr` | Busca jurisprudência no portal do TJPR |
| `/redigir-peca` | Planeja e redige uma peça de qualquer tipo |
| `/revisar-peca` | Auditoria adversarial da peça (confere provas e fundamentos) |
| `/diagramar-peca` | Gera um PDF diagramado com Legal Design simples |
| `/preparar-ambiente` | Instala as ferramentas que algumas skills usam |

## Ferramentas e setup automático

A maioria das skills é markdown puro e roda **sem instalar nada**. Três skills usam
ferramentas externas: `/buscar-fontes` (bun), `/buscar-tjpr` (uv + python),
`/transcrever` (whisper) e `/diagramar-peca` (typst).

**Regra de auto-setup:** se você for executar uma dessas skills e a ferramenta não
estiver instalada (o comando falha com "command not found"), **não desista** — avise o
usuário e ofereça rodar `/preparar-ambiente`, que instala só o que falta para aquela
skill. Instale sob demanda, nunca tudo de uma vez sem necessidade.

## Gerenciamento de contexto

Este é o segundo pilar do kit. Veja `GERENCIAR-CONTEXTO.md` para a prática (janela de
contexto, dado legível, arquivos como memória, quando começar conversa nova). Termos em
`GLOSSARIO.md`.
