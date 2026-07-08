# Kit de Skills Jurídicas

Um conjunto de **skills** (procedimentos jurídicos escritos em português) para rodar no
**Claude Code**, mais uma convenção simples para organizar seus casos. Feito para
advogados — sem necessidade de programar.

> **Novo por aqui? Abra o [COMECE-AQUI.md](COMECE-AQUI.md).** Ele tem os 3 passos.

## O que é uma skill

Uma skill é o seu procedimento de trabalho escrito uma vez, que a IA executa sempre do
mesmo jeito. Toda skill responde a três coisas: **o que entra** (os dados que você tem)
→ **o que sai** (o resultado que você quer) → **o procedimento** (o passo a passo).
Você não escreve código — escreve português.

## Como abrir

1. Baixe e descompacte esta pasta.
2. Abra-a no **Claude Code** (no app, ou apontando o Claude Code para esta pasta).
3. Digite `/` para ver as skills e use com `/nome`.

A maioria das skills roda **sem instalar nada**. As que precisam de ferramentas extras
estão marcadas com 🔧 na tabela abaixo — rode `/preparar-ambiente` para liberá-las.

## Skills

| Comando | O que faz | Setup |
|---|---|---|
| `/criar-skill` | Constrói uma skill nova com você, por entrevista | — |
| `/organizar-caso` | Lê uma pilha de documentos → `SUMARIO.md` | — |
| `/diagnosticar` | Mapeia forças e fragilidades do caso → `DIAGNOSTICO.md` | — |
| `/redigir-peca` | Planeja e redige uma peça de qualquer tipo | — |
| `/revisar-peca` | Auditoria adversarial da peça (provas + fundamentos) | — |
| `/transcrever` | Áudio/vídeo → texto (reunião, audiência, depoimento) | 🔧 |
| `/buscar-fontes` | Súmulas, leis e temas repetitivos (base Delfus, offline) | 🔧 |
| `/buscar-tjpr` | Jurisprudência no portal do TJPR | 🔧 |
| `/diagramar-peca` | Gera um PDF com Legal Design simples | 🔧 |
| `/preparar-ambiente` | Instala as ferramentas das skills marcadas com 🔧 | — |

Fluxo típico de um caso:

```text
/organizar-caso → /diagnosticar → /buscar-fontes (+ /buscar-tjpr)
                                      ↓
        /redigir-peca → /revisar-peca → /diagramar-peca
```

## Onde ficam os casos

Cada processo seu mora em `casos/<numero-ou-nome>/`. Há um modelo vazio em
`casos/_modelo-de-caso/` — copie e renomeie para começar. Detalhes em
[casos/README.md](casos/README.md). **Seus dados ficam só na sua máquina.**

## Aprenda os conceitos

- [GLOSSARIO.md](GLOSSARIO.md) — termos de IA em linguagem de advogado.
- [GERENCIAR-CONTEXTO.md](GERENCIAR-CONTEXTO.md) — como fazer a IA ler o que importa.

## Estrutura

```text
.
├── COMECE-AQUI.md          # leia primeiro
├── README.md               # este arquivo
├── GLOSSARIO.md            # termos de IA
├── GERENCIAR-CONTEXTO.md   # gerenciamento de contexto
├── CLAUDE.md               # instruções que o Claude lê automaticamente
├── setup.sh / setup.command# instala as ferramentas extras (ou use /preparar-ambiente)
├── .claude/skills/         # as skills
├── ferramentas/            # ferramentas usadas pelas skills 🔧
└── casos/                  # onde moram seus casos
```
