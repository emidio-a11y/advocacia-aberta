# casos/ — onde mora cada caso

Cada processo ou matéria que você trabalha vira **uma pasta aqui dentro**.

## Como começar um caso novo

1. Copie a pasta `_modelo-de-caso/` e renomeie para o número do processo ou um nome
   curto — ex.: `0001234-56.2025.8.16.0000` ou `cliente-acme-rescisao`.
2. Jogue os documentos do caso dentro de `autos/` (PDFs, áudios, e-mails, contratos…).
3. Use as skills. Um bom começo: `/organizar-caso casos/<sua-pasta>` para gerar o resumo.

## A estrutura de cada caso

- `autos/` — os documentos e mídias do caso (o material bruto, o que **entra**).
- `analise/` — sínteses geradas pelas skills: `SUMARIO.md`, `DIAGNOSTICO.md`.
- `fundamentacao/` — `LEGISLACAO.md` e `JURISPRUDENCIA.md` (as fontes que sustentam as teses).
- `pecas/` — as peças que você produz e as versões diagramadas em PDF.

## Fluxo sugerido

```text
/organizar-caso  →  /diagnosticar  →  /buscar-fontes (+ /buscar-tjpr)
                                          ↓
            /redigir-peca  →  /revisar-peca  →  /diagramar-peca
```

> Os dados dos seus casos ficam **só na sua máquina**. Nada é enviado para fora.
