# Gerenciamento de contexto — como fazer a IA ler o que importa

> A IA não alucina porque é burra. Ela alucina quando o dado está **ilegível** ou
> não **cabe** na memória dela. Gerenciar contexto é a habilidade de dar à IA o
> dado certo, no formato certo, na hora certa. É isso que separa o copiloto que
> decepciona da operação que transforma.

---

## 1. A janela de contexto é finita

A IA lê um "tanto" por vez — uma espécie de memória de trabalho da conversa. Pense
num estagiário que só consegue segurar um número limitado de pastas na mão. Se você
empilha tudo de uma vez, ele derruba — ou esquece o que estava no começo da pilha.

**Na prática:** não cole 40 PDFs de uma só vez. Trabalhe por partes. Indexe os
autos primeiro, gere uma síntese, e só então peça a análise sobre o que importa.

## 2. Dado ilegível é o verdadeiro problema

Um PDF escaneado sem camada de texto, uma pilha de documentos sem organização, um
áudio de audiência não transcrito — a IA não "enxerga" bem nada disso. É como pedir
um parecer sobre um documento borrado: o erro não está em quem lê, está no que foi
entregue para ler.

**Antes de pedir análise, torne o dado legível:**

- Transcreva a audiência com `/transcrever` (áudio/vídeo viram texto).
- Organize a pilha com `/organizar-caso` (cada documento no seu lugar).
- Garanta que os PDFs tenham texto extraível, não só imagem.

## 3. Use arquivos `.md` como memória externa

Em vez de manter tudo dentro da conversa, salve as sínteses em arquivos: um
`SUMARIO.md` com o resumo dos autos, um `DIAGNOSTICO.md` com as fragilidades do
caso. Assim a IA relê apenas o resumo essencial quando precisa, sem reprocessar a
pilha inteira a cada pergunta.

É a mesma lógica da **ementa** ou do resumo dos autos: você consulta a síntese em
vez de reler o processo do zero toda vez. O `/diagnosticar` produz exatamente esse
tipo de memória externa.

## 4. Estruture a pasta do caso

Uma estrutura clara já é metade do gerenciamento de contexto — quando os arquivos
estão no lugar certo, a IA encontra o que precisa sem você apontar. A convenção do
kit é uma pasta por caso:

```text
casos/<seu-caso>/
├── autos/            # documentos e mídia do processo
├── analise/          # sínteses geradas: SUMARIO.md, DIAGNOSTICO.md
├── fundamentacao/    # LEGISLACAO.md, JURISPRUDENCIA.md
└── pecas/            # as peças produzidas
```

Cada subpasta tem um papel. A IA sabe que o resumo está em `analise/`, que a base
legal está em `fundamentacao/` — e busca direto, sem rodeios.

## 5. Comece conversa nova quando trocar de assunto

Quando o contexto fica longo e cheio de assunto velho, a qualidade cai — a IA mistura
o que era de outra tarefa. Ao mudar de assunto, comece uma conversa nova (no Claude
Code, o comando é `/clear`) e aponte os arquivos relevantes para a tarefa atual.

É a **mesa limpa** para cada tarefa: você não espalha os autos de cinco processos
diferentes na mesa enquanto trabalha em um. Limpa, foca, produz.

## 6. O `CLAUDE.md` é a memória permanente do projeto

Existe um arquivo chamado `CLAUDE.md` na raiz do projeto que a IA **lê
automaticamente em toda conversa**. É onde ficam as instruções e convenções que
valem sempre: como nomear arquivos, qual estrutura seguir, que tom usar.

Diferente da conversa (que esvazia com o `/clear`), o `CLAUDE.md` persiste. Escreva
ali uma vez e não precisa repetir — é o "manual da casa" que a IA consulta sozinha.

---

## Regra de bolso

> **Dado legível + na medida certa + no lugar certo = IA que cita em vez de inventar.**

E o ciclo do trabalho segue a mesma ordem: `/organizar-caso` → `/transcrever` →
`/diagnosticar` → `/redigir-peca`. Cada etapa torna o dado mais legível e mais
sintético para a seguinte.

*Termos técnicos? Consulte o `GLOSSARIO.md` para as definições.*

